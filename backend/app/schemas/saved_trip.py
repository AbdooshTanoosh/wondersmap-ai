
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.trip import AITripRequest
from app.schemas.itinerary import AIItinerary, BudgetSummary


class SaveTripRequest(BaseModel):
    trip: AITripRequest
    itinerary: AIItinerary


class SavedTripResponse(BaseModel):
    id: int
    user_id: int
    departure_city: str
    destination: str
    start_date: str
    end_date: str
    adults: int
    children: int
    budget: float
    currency: str
    language: str
    preferences: list[str]
    created_at: datetime
    itinerary: dict[str, Any]
    budget_summary: BudgetSummary


class SavedTripListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    departure_city: str
    destination: str
    start_date: str
    end_date: str
    budget: float
    currency: str
    created_at: datetime
    trip_title: str = Field(default="")
