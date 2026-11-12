
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from app.schemas.trip import AITripRequest
from app.api.auth import router as auth_router
from fastapi import HTTPException
from openai import OpenAIError

from app.schemas.itinerary import AIItineraryWithBudget
from app.services.budget_service import calculate_trip_budget
from app.services.ai_trip_service import generate_ai_itinerary
from typing import Literal

app = FastAPI(
    title="WondersMap AI API",
    description="Backend API for the bilingual AI travel planner.",
    version="0.2.0"
)
app.include_router(auth_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)


class TripRequest(BaseModel):
    destination: str = Field(min_length=2, max_length=100)
    travelers: int = Field(ge=1, le=30)
    budget: float = Field(gt=0)
    language: Literal["en", "ar"] = "en"


@app.get("/")
def home():
    return {
        "message": "Welcome to WondersMap AI!",
        "supported_languages": ["en", "ar"]
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "WondersMap AI Backend"
    }


@app.post("/api/trips/plan")
def plan_trip(trip: TripRequest):
    if trip.language == "ar":
        message = f"تم استلام طلب رحلتك إلى {trip.destination} بنجاح!"
    else:
        message = f"Your trip request to {trip.destination} was received!"

    return {
        "status": "success",
        "message": message,
        "trip": {
            "destination": trip.destination,
            "travelers": trip.travelers,
            "budget": trip.budget,
            "currency": "CAD",
            "language": trip.language
        }
    }

@app.post("/api/trips/preview")
def preview_trip(trip: AITripRequest):

    duration = (
        trip.end_date - trip.start_date
    ).days + 1

    total_travelers = trip.adults + trip.children

    return {
        "status": "success",
        "message": (
            "تم التحقق من تفاصيل الرحلة بنجاح"
            if trip.language == "ar"
            else "Trip details validated successfully"
        ),
        "trip_summary": {
            "departure_city": trip.departure_city,
            "destination": trip.destination,
            "start_date": trip.start_date,
            "end_date": trip.end_date,
            "duration_days": duration,
            "adults": trip.adults,
            "children": trip.children,
            "total_travelers": total_travelers,
            "budget": trip.budget,
            "currency": trip.currency,
            "preferences": trip.preferences,
            "language": trip.language
        }
    }


@app.post(
    "/api/trips/generate",
    response_model=AIItineraryWithBudget
)
def generate_trip(trip: AITripRequest):

    duration = (
        trip.end_date - trip.start_date
    ).days + 1

    if duration > 7:
        raise HTTPException(
            status_code=400,
            detail="AI generation supports up to 7 days."
        )

    try:
        # Generate itinerary using OpenAI.
        itinerary = generate_ai_itinerary(trip)

        # Calculate costs using Python.
        budget_summary = calculate_trip_budget(
            itinerary,
            trip.budget
        )

        # Return itinerary and budget together.
        return AIItineraryWithBudget(
            **itinerary.model_dump(),
            budget_summary=budget_summary
        )

    except (OpenAIError, RuntimeError, ValueError) as exc:
        import logging

        logger = logging.getLogger("wondersmap.ai")

        logger.error(
            "AI generation failed: type=%s, status=%s, code=%s",
            type(exc).__name__,
            getattr(exc, "status_code", None),
            getattr(exc, "code", None),
        )

        raise HTTPException(
            status_code=502,
            detail="AI itinerary generation is unavailable."
        ) from exc


