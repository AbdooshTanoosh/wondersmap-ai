
from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class AITripRequest(BaseModel):
    departure_city: str = Field(
        min_length=2,
        max_length=100
    )

    destination: str = Field(
        min_length=2,
        max_length=100
    )

    start_date: date
    end_date: date

    adults: int = Field(ge=1, le=30)
    children: int = Field(ge=0, le=20)

    budget: float = Field(gt=0)
    currency: Literal["CAD"] = "CAD"

    preferences: list[str] = Field(
        default_factory=list,
        max_length=10
    )

    language: Literal["en", "ar"] = "en"

    @model_validator(mode="after")
    def validate_trip(self):
        if self.end_date < self.start_date:
            raise ValueError(
                "End date must be on or after start date"
            )

        if self.adults + self.children > 30:
            raise ValueError(
                "Maximum 30 travelers are allowed"
            )

        return self
