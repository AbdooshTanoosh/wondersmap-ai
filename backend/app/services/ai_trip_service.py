
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

from app.schemas.trip import AITripRequest
from app.schemas.itinerary import AIItinerary


# Load environment variables from backend/.env
env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(env_path)


def generate_ai_itinerary(trip: AITripRequest) -> AIItinerary:
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured")

    client = OpenAI(api_key=api_key, timeout=60.0, max_retries=1)

    language = "Arabic" if trip.language == "ar" else "English"
    duration = (trip.end_date - trip.start_date).days + 1

    trip_details = {
        "departure_city": trip.departure_city,
        "destination": trip.destination,
        "start_date": trip.start_date.isoformat(),
        "end_date": trip.end_date.isoformat(),
        "duration_days": duration,
        "adults": trip.adults,
        "children": trip.children,
        "budget_cad": trip.budget,
        "preferences": trip.preferences,
        "language": language,
    }

    response = client.responses.parse(
        model=os.getenv("OPENAI_MODEL", "gpt-5-mini"),
        
instructions=(
    "You are an experienced travel itinerary planner. "
    "Generate a structured travel plan in the requested language. "
    "Create exactly one day for each travel date, numbered from 1. "
    "Respect the travelers, preferences, and budget. "
    "All estimated_cost_cad values must be nonnegative CAD amounts "
    "for the entire travel party, not per person. "
    "Assign each expense its correct category: "
    "flights, accommodation, food, transportation, activities, or other. "
    "Include flights and accommodation as distinct expense items "
    "when estimating a complete trip budget. "
    "Count each expense only once. "
    "Do not claim that estimated prices are live offers. "
    "Do not assume actual flight arrival or departure times. "
    "Make airport transfers conditional on flight schedules. "
    "Avoid unverified claims about museum collections, schedules, "
    "availability, or attraction opening hours. "
    "If the budget appears insufficient, explain the issue "
    "instead of making unrealistic prices fit. "

"Include a location_query for each activity that has "
"a meaningful physical location, such as a museum, "
"restaurant, landmark, or attraction. "
"Use a searchable place name, city, and country. "
"For example: 'Giza Pyramids, Giza, Egypt'. "
"For activities without a specific physical location, "
"set location_query to null. "
"Always set latitude and longitude to null. "
"Coordinates will be verified by a separate map service. "

    "Provide a disclaimer about estimates and unverified information."
),

        input=json.dumps(trip_details, ensure_ascii=False),
        text_format=AIItinerary,
        max_output_tokens=5000,
        store=False,
    )

    itinerary = response.output_parsed

    if itinerary is None:
        raise RuntimeError("AI did not return a valid itinerary")

    if len(itinerary.days) != duration:
        raise RuntimeError("AI returned an incorrect number of days")

    return itinerary
