
from typing import Literal
from pydantic import BaseModel, Field


ExpenseCategory = Literal[
    "flights",
    "accommodation",
    "food",
    "transportation",
    "activities",
    "other"
]



class Activity(BaseModel):
    time: str
    name: str
    description: str
    category: ExpenseCategory
    estimated_cost_cad: float = Field(ge=0)

    # Searchable location name for map integration
    
    # Location details for interactive maps
    location_query: str | None = Field(
        ...,
        max_length=200
    )

    latitude: float | None = Field(
        ...,
        ge=-90,
        le=90
    )

    longitude: float | None = Field(
        ...,
        ge=-180,
        le=180
    )




class ItineraryDay(BaseModel):
    day: int
    title: str
    activities: list[Activity]


class AIItinerary(BaseModel):
    trip_title: str
    overview: str
    days: list[ItineraryDay]
    travel_tips: list[str]
    disclaimer: str


class BudgetSummary(BaseModel):
    currency: str
    requested_budget: float
    estimated_total: float
    remaining_budget: float
    over_budget: bool
    over_budget_amount: float
    category_totals: dict[str, float]


class AIItineraryWithBudget(AIItinerary):
    budget_summary: BudgetSummary
