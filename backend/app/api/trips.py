
from datetime import date

from fastapi import APIRouter, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError

from app.api.auth import CurrentUser, DbSession
from app.models.travel import Trip, Itinerary
from app.schemas.saved_trip import (
    SaveTripRequest,
    SavedTripResponse,
)
from app.schemas.itinerary import AIItineraryWithBudget
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.schemas.saved_trip import SavedTripListItem
from sqlalchemy.orm import selectinload
from app.services.budget_service import calculate_trip_budget


router = APIRouter(
    prefix="/api/trips",
    tags=["Saved Trips"],
)


def validate_itinerary(data: SaveTripRequest) -> None:
    """Check that the itinerary matches the trip dates."""

    duration = (
        data.trip.end_date - data.trip.start_date
    ).days + 1

    if duration < 1 or duration > 7:
        raise HTTPException(
            status_code=422,
            detail="Only itineraries of 1 to 7 days can be saved.",
        )

    day_numbers = [
        day.day for day in data.itinerary.days
    ]

    if day_numbers != list(range(1, duration + 1)):
        raise HTTPException(
            status_code=422,
            detail="Itinerary days do not match trip duration.",
        )

    for day in data.itinerary.days:
        if not day.activities:
            raise HTTPException(
                status_code=422,
                detail="Each day must contain an activity.",
            )

        for activity in day.activities:
            cost = activity.estimated_cost_cad

            # Reject NaN, infinity, and excessively large values.
            if not (0 <= cost <= 1_000_000):
                raise HTTPException(
                    status_code=422,
                    detail="Invalid estimated activity cost.",
                )


@router.post(
    "/save",
    response_model=SavedTripResponse,
    status_code=status.HTTP_201_CREATED,
)
def save_trip(
    data: SaveTripRequest,
    db: DbSession,
    current_user: CurrentUser,
):
    """Save an itinerary for the authenticated user."""

    validate_itinerary(data)

    # Never trust a budget total sent by the browser.
    budget_summary = calculate_trip_budget(
        data.itinerary,
        data.trip.budget,
    )

    saved_content = AIItineraryWithBudget(
        **data.itinerary.model_dump(),
        budget_summary=budget_summary,
    ).model_dump(mode="json")

    trip = Trip(
        user_id=current_user.id,
        departure_city=data.trip.departure_city,
        destination=data.trip.destination,
        start_date=data.trip.start_date,
        end_date=data.trip.end_date,
        adults=data.trip.adults,
        children=data.trip.children,
        budget=data.trip.budget,
        currency=data.trip.currency,
        preferences=data.trip.preferences,
        language=data.trip.language,
    )

    itinerary_record = Itinerary(
        content=saved_content
    )

    trip.itinerary = itinerary_record

    try:
        db.add(trip)
        db.commit()
        db.refresh(trip)

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to save the trip.",
        ) from None

    return SavedTripResponse(
        id=trip.id,
        user_id=current_user.id,
        departure_city=trip.departure_city,
        destination=trip.destination,
        start_date=trip.start_date.isoformat(),
        end_date=trip.end_date.isoformat(),
        adults=trip.adults,
        children=trip.children,
        budget=float(trip.budget),
        currency=trip.currency,
        language=trip.language,
        preferences=trip.preferences,
        created_at=trip.created_at,
        itinerary=saved_content,
        budget_summary=budget_summary,
    )

@router.get(
    "/mine",
    response_model=list[SavedTripListItem],
)
def get_my_trips(
    db: DbSession,
    current_user: CurrentUser,
):
    """Return trips owned by the authenticated user."""

    statement = (
        select(Trip)
        .options(selectinload(Trip.itinerary))
        .where(Trip.user_id == current_user.id)
        .order_by(Trip.created_at.desc(), Trip.id.desc())
    )

    trips = db.scalars(statement).all()

    results = []

    for trip in trips:
        content = (
            trip.itinerary.content
            if trip.itinerary
            else {}
        )

        results.append(
            SavedTripListItem(
                id=trip.id,
                departure_city=trip.departure_city,
                destination=trip.destination,
                start_date=trip.start_date.isoformat(),
                end_date=trip.end_date.isoformat(),
                budget=float(trip.budget),
                currency=trip.currency,
                created_at=trip.created_at,
                trip_title=content.get("trip_title", ""),
            )
        )

    return results

@router.get(
    "/{trip_id}",
    response_model=SavedTripResponse,
)
def get_saved_trip(
    trip_id: int,
    db: DbSession,
    current_user: CurrentUser,
):
    """Retrieve a saved trip owned by the current user."""

    if trip_id < 1:
        raise HTTPException(
            status_code=404,
            detail="Trip not found",
        )

    statement = (
        select(Trip)
        .options(selectinload(Trip.itinerary))
        .where(
            Trip.id == trip_id,
            Trip.user_id == current_user.id,
        )
    )

    trip = db.scalar(statement)

    if trip is None or trip.itinerary is None:
        raise HTTPException(
            status_code=404,
            detail="Trip not found",
        )

    content = trip.itinerary.content

    return SavedTripResponse(
        id=trip.id,
        user_id=trip.user_id,
        departure_city=trip.departure_city,
        destination=trip.destination,
        start_date=trip.start_date.isoformat(),
        end_date=trip.end_date.isoformat(),
        adults=trip.adults,
        children=trip.children,
        budget=float(trip.budget),
        currency=trip.currency,
        language=trip.language,
        preferences=trip.preferences,
        created_at=trip.created_at,
        itinerary=content,
        budget_summary=content["budget_summary"],
    )

@router.delete(
    "/{trip_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_saved_trip(
    trip_id: int,
    db: DbSession,
    current_user: CurrentUser,
):
    """Delete a saved trip owned by the authenticated user."""

    trip = db.scalar(
        select(Trip).where(
            Trip.id == trip_id,
            Trip.user_id == current_user.id,
        )
    )

    if trip is None:
        raise HTTPException(
            status_code=404,
            detail="Trip not found",
        )

    try:
        db.delete(trip)
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to delete trip",
        ) from None

    return None

