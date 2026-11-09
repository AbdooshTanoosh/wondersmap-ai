
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal

app = FastAPI(
    title="WondersMap AI API",
    description="Backend API for the bilingual AI travel planner.",
    version="0.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
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
