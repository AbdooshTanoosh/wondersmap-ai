
import json
import os
from datetime import timedelta

from openai import OpenAI

from app.schemas.itinerary import (
    AIItineraryWithBudget,
    ItineraryDay,
)
from app.schemas.regenerate_day import RegenerateDayRequest
from app.services.budget_service import calculate_trip_budget


def regenerate_itinerary_day(
    request: RegenerateDayRequest,
) -> AIItineraryWithBudget:

    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured")

    client = OpenAI(
        api_key=api_key,
        timeout=60.0,
        max_retries=1,
    )

    trip = request.trip
    itinerary = request.itinerary
    selected_day = request.day_number

    selected_date = (
        trip.start_date + timedelta(days=selected_day - 1)
    )

    existing_day = next(
        day for day in itinerary.days
        if day.day == selected_day
    )

    other_days = [
        day.model_dump()
        for day in itinerary.days
        if day.day != selected_day
    ]

    trip_context = {
        "destination": trip.destination,
        "departure_city": trip.departure_city,
        "date": selected_date.isoformat(),
        "day_number": selected_day,
        "total_days": len(itinerary.days),
        "adults": trip.adults,
        "children": trip.children,
        "total_budget_cad": trip.budget,
        "preferences": trip.preferences,
        "language": (
            "Arabic" if trip.language == "ar" else "English"
        ),
        "current_day": existing_day.model_dump(),
        "other_days": other_days,
    }

    response = client.responses.parse(
        model=os.getenv("OPENAI_MODEL", "gpt-5-mini"),
        instructions=(
            "You are an experienced travel planner. "
            "Regenerate ONLY the selected itinerary day. "
            "Return exactly one ItineraryDay object. "
            "Keep the requested day number unchanged. "
            "Write in the requested language. "
            "Make the replacement meaningfully different "
            "from the existing day. "
            "Respect the destination, date, travelers, "
            "preferences, and overall trip budget. "
            "Avoid repeating activities from other days. "
            "Use realistic nonnegative CAD cost estimates "
            "for the entire travel party, not per person. "
            "Use the correct expense categories. "
            "Do not duplicate flights or accommodation "
            "already included on other days. "
            "Do not invent live prices, reservations, "
            "opening hours, or guaranteed availability. "
            "Keep airport transfers conditional on "
            "actual flight schedules."

" Include a searchable location_query for activities "
"that have a specific physical location. "
"Use the place name, city, and country. "
"Set location_query to null when a specific location "
"cannot be identified. "
"Always set latitude and longitude to null. "
"Coordinates will be verified separately."

        ),
        input=json.dumps(
            trip_context,
            ensure_ascii=False,
        ),
        text_format=ItineraryDay,
        max_output_tokens=2500,
        store=False,
    )

    new_day = response.output_parsed

    if new_day is None:
        raise RuntimeError(
            "AI did not return a valid replacement day"
        )

    if new_day.day != selected_day:
        raise RuntimeError(
            "AI returned an incorrect day number"
        )

    updated_itinerary = itinerary.model_copy(deep=True)

    updated_itinerary.days = [
        new_day if day.day == selected_day else day
        for day in updated_itinerary.days
    ]

    budget_summary = calculate_trip_budget(
        updated_itinerary,
        trip.budget,
    )

    return AIItineraryWithBudget(
        **updated_itinerary.model_dump(),
        budget_summary=budget_summary,
    )
