
from pydantic import BaseModel, Field, model_validator

from app.schemas.trip import AITripRequest
from app.schemas.itinerary import AIItinerary


class RegenerateDayRequest(BaseModel):
    trip: AITripRequest
    itinerary: AIItinerary
    day_number: int = Field(ge=1, le=7)

    @model_validator(mode="after")
    def validate_day_number(self):
        duration = (
            self.trip.end_date - self.trip.start_date
        ).days + 1

        if duration > 7:
            raise ValueError(
                "AI generation supports up to 7 days"
            )

        if self.day_number > duration:
            raise ValueError(
                "Selected day is outside the trip duration"
            )

        if len(self.itinerary.days) != duration:
            raise ValueError(
                "Itinerary does not match trip duration"
            )

        day_numbers = [
            day.day for day in self.itinerary.days
        ]

        if sorted(day_numbers) != list(
            range(1, duration + 1)
        ):
            raise ValueError(
                "Itinerary must contain each day exactly once"
            )

        return self
