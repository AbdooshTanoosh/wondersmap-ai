
from decimal import Decimal, ROUND_HALF_UP

from app.schemas.itinerary import AIItinerary


CATEGORIES = (
    "flights",
    "accommodation",
    "food",
    "transportation",
    "activities",
    "other",
)


def calculate_trip_budget(
    itinerary: AIItinerary,
    requested_budget: float
) -> dict:

    category_totals = {
        category: Decimal("0.00")
        for category in CATEGORIES
    }

    # Calculate every expense from the AI itinerary.
    for day in itinerary.days:
        for activity in day.activities:
            amount = Decimal(
                str(activity.estimated_cost_cad)
            )

            category_totals[activity.category] += amount

    total = sum(
        category_totals.values(),
        Decimal("0.00")
    )

    budget = Decimal(str(requested_budget))

    # Round financial values to two decimal places.
    def money(value: Decimal) -> float:
        return float(
            value.quantize(
                Decimal("0.01"),
                rounding=ROUND_HALF_UP
            )
        )

    total = total.quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP
    )

    remaining = budget - total

    return {
        "currency": "CAD",
        "requested_budget": money(budget),
        "estimated_total": money(total),
        "remaining_budget": money(remaining),
        "over_budget": remaining < 0,
        "over_budget_amount": money(
            max(-remaining, Decimal("0"))
        ),
        "category_totals": {
            category: money(amount)
            for category, amount in category_totals.items()
        },
    }
