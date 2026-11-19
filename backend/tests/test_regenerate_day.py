
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.regenerate_day import RegenerateDayRequest
from app.schemas.itinerary import ItineraryDay
from app.services import regenerate_day_service


client = TestClient(app)


def sample_request():
    return {
        "trip": {
            "departure_city": "Toronto",
            "destination": "Cairo",
            "start_date": "2026-12-01",
            "end_date": "2026-12-03",
            "adults": 2,
            "children": 0,
            "budget": 1000,
            "currency": "CAD",
            "preferences": ["History"],
            "language": "en",
        },
        "itinerary": {
            "trip_title": "Cairo Trip",
            "overview": "Three days in Cairo",
            "days": [
                {
                    "day": 1,
                    "title": "Arrival",
                    "activities": [
                        {
                            "time": "10:00",
                            "name": "Hotel",
                            "description": "Hotel check-in",
                            "category": "accommodation",
                            "estimated_cost_cad": 200,
                        }
                    ],
                },
                {
                    "day": 2,
                    "title": "Pyramids",
                    "activities": [
                        {
                            "time": "09:00",
                            "name": "Giza Pyramids",
                            "description": "Visit the pyramids",
                            "category": "activities",
                            "estimated_cost_cad": 100,
                        }
                    ],
                },
                {
                    "day": 3,
                    "title": "Old Cairo",
                    "activities": [
                        {
                            "time": "09:00",
                            "name": "Old Cairo Walk",
                            "description": "Explore Old Cairo",
                            "category": "activities",
                            "estimated_cost_cad": 50,
                        }
                    ],
                },
            ],
            "travel_tips": ["Bring water"],
            "disclaimer": "Costs are estimates",
        },
        "day_number": 2,
    }


def mock_openai(monkeypatch):
    replacement = ItineraryDay(
        day=2,
        title="Egyptian Museum",
        activities=[
            {
                "time": "10:00",
                "name": "Museum Visit",
                "description": "Explore the museum",
                "category": "activities",
                "estimated_cost_cad": 150,
            }
        ],
    )

    class MockResponses:
        def parse(self, **kwargs):
            class Result:
                output_parsed = replacement

            return Result()

    class MockOpenAI:
        def __init__(self, **kwargs):
            self.responses = MockResponses()

    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setattr(
        regenerate_day_service,
        "OpenAI",
        MockOpenAI,
    )


def test_regenerate_only_selected_day(monkeypatch):
    mock_openai(monkeypatch)

    request = RegenerateDayRequest.model_validate(
        sample_request()
    )

    result = regenerate_day_service.regenerate_itinerary_day(
        request
    )

    assert result.days[0].title == "Arrival"
    assert result.days[1].title == "Egyptian Museum"
    assert result.days[2].title == "Old Cairo"

    assert result.budget_summary.estimated_total == 400
    assert result.budget_summary.remaining_budget == 600


def test_invalid_day_number():
    payload = sample_request()
    payload["day_number"] = 5

    response = client.post(
        "/api/trips/regenerate-day",
        json=payload,
    )

    assert response.status_code == 422


def test_regenerate_endpoint(monkeypatch):
    mock_openai(monkeypatch)

    response = client.post(
        "/api/trips/regenerate-day",
        json=sample_request(),
    )

    assert response.status_code == 200

    result = response.json()

    assert len(result["days"]) == 3
    assert result["days"][0]["title"] == "Arrival"
    assert result["days"][1]["title"] == "Egyptian Museum"
    assert result["days"][2]["title"] == "Old Cairo"

    assert result["budget_summary"]["estimated_total"] == 400
    assert result["budget_summary"]["remaining_budget"] == 600
