
import uuid


def create_user_and_token(client):
    """Register a temporary user and return their JWT."""

    email = f"triptest-{uuid.uuid4().hex}@example.com"
    password = "SecureTestPassword123!"

    registration = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "full_name": "Trip Test User",
            "password": password,
            "preferred_language": "en",
        },
    )

    assert registration.status_code == 201

    login = client.post(
        "/api/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )

    assert login.status_code == 200

    return login.json()["access_token"]


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def sample_trip():
    """Use a one-day trip; no OpenAI calls required."""

    return {
        "trip": {
            "departure_city": "Toronto",
            "destination": "Ottawa",
            "start_date": "2026-12-15",
            "end_date": "2026-12-15",
            "adults": 2,
            "children": 1,
            "budget": 2000,
            "currency": "CAD",
            "preferences": [
                "Family-friendly",
                "Museums",
            ],
            "language": "en",
        },
        "itinerary": {
            "trip_title": "Ottawa Family Day",
            "overview": "A family day exploring Ottawa.",
            "days": [
                {
                    "day": 1,
                    "title": "Discover Ottawa",
                    "activities": [
                        {
                            "time": "10:00",
                            "name": "Visit Museum",
                            "description": "Explore a museum.",
                            "category": "activities",
                            "estimated_cost_cad": 100,
                        },
                        {
                            "time": "13:00",
                            "name": "Family Lunch",
                            "description": "Enjoy lunch.",
                            "category": "food",
                            "estimated_cost_cad": 80,
                        },
                    ],
                }
            ],
            "travel_tips": [
                "Check museum hours.",
            ],
            "disclaimer": "Prices are estimates.",
        },
    }


def save_trip(client, token):
    response = client.post(
        "/api/trips/save",
        json=sample_trip(),
        headers=auth_headers(token),
    )

    assert response.status_code == 201, response.text

    return response.json()


def test_save_trip(client):
    token = create_user_and_token(client)

    trip = save_trip(client, token)

    assert trip["id"] > 0
    assert trip["destination"] == "Ottawa"

    assert trip["budget_summary"]["estimated_total"] == 180
    assert trip["budget_summary"]["remaining_budget"] == 1820


def test_list_my_trips(client):
    token = create_user_and_token(client)

    saved = save_trip(client, token)

    response = client.get(
        "/api/trips/mine",
        headers=auth_headers(token),
    )

    assert response.status_code == 200

    trips = response.json()

    assert len(trips) == 1
    assert trips[0]["id"] == saved["id"]
    assert trips[0]["trip_title"] == "Ottawa Family Day"


def test_view_saved_trip(client):
    token = create_user_and_token(client)

    saved = save_trip(client, token)

    response = client.get(
        f"/api/trips/{saved['id']}",
        headers=auth_headers(token),
    )

    assert response.status_code == 200

    trip = response.json()

    assert trip["destination"] == "Ottawa"
    assert trip["itinerary"]["trip_title"] == "Ottawa Family Day"
    assert len(trip["itinerary"]["days"]) == 1


def test_delete_saved_trip(client):
    token = create_user_and_token(client)

    saved = save_trip(client, token)

    delete_response = client.delete(
        f"/api/trips/{saved['id']}",
        headers=auth_headers(token),
    )

    assert delete_response.status_code == 204

    get_response = client.get(
        f"/api/trips/{saved['id']}",
        headers=auth_headers(token),
    )

    assert get_response.status_code == 404


def test_user_cannot_view_another_users_trip(client):
    owner_token = create_user_and_token(client)
    other_token = create_user_and_token(client)

    saved = save_trip(client, owner_token)

    response = client.get(
        f"/api/trips/{saved['id']}",
        headers=auth_headers(other_token),
    )

    assert response.status_code == 404


def test_user_cannot_delete_another_users_trip(client):
    owner_token = create_user_and_token(client)
    other_token = create_user_and_token(client)

    saved = save_trip(client, owner_token)

    response = client.delete(
        f"/api/trips/{saved['id']}",
        headers=auth_headers(other_token),
    )

    assert response.status_code == 404

    # Verify the owner's trip still exists.
    owner_response = client.get(
        f"/api/trips/{saved['id']}",
        headers=auth_headers(owner_token),
    )

    assert owner_response.status_code == 200


def test_user_only_sees_own_trips(client):
    first_token = create_user_and_token(client)
    second_token = create_user_and_token(client)

    first_trip = save_trip(client, first_token)

    response = client.get(
        "/api/trips/mine",
        headers=auth_headers(second_token),
    )

    assert response.status_code == 200
    assert response.json() == []

    owner_response = client.get(
        "/api/trips/mine",
        headers=auth_headers(first_token),
    )

    assert owner_response.status_code == 200
    assert len(owner_response.json()) == 1
    assert owner_response.json()[0]["id"] == first_trip["id"]
