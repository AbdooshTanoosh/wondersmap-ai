
import pytest
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


@pytest.mark.parametrize(
    "endpoint",
    [
        "/api/auth/me",
        "/api/trips/mine",
        "/api/trips/1",
    ],
)
def test_protected_get_without_token(endpoint):
    response = client.get(endpoint)

    assert response.status_code == 401


@pytest.mark.parametrize(
    "endpoint",
    [
        "/api/auth/me",
        "/api/trips/mine",
        "/api/trips/1",
    ],
)
def test_protected_get_with_invalid_token(endpoint):
    response = client.get(
        endpoint,
        headers={
            "Authorization": "Bearer invalid-test-token"
        },
    )

    assert response.status_code == 401


def test_delete_trip_without_token():
    response = client.delete("/api/trips/1")

    assert response.status_code == 401


def test_delete_trip_with_invalid_token():
    response = client.delete(
        "/api/trips/1",
        headers={
            "Authorization": "Bearer invalid-test-token"
        },
    )

    assert response.status_code == 401
