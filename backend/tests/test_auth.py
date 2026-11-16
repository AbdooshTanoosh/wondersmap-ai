
import uuid


def make_test_user():
    """Generate a unique test user."""
    return {
        "email": f"test-{uuid.uuid4().hex}@example.com",
        "full_name": "WondersMap Test User",
        "password": "SecureTestPassword123!",
        "preferred_language": "en",
    }


def test_register_user(client):
    user = make_test_user()

    response = client.post(
        "/api/auth/register",
        json=user,
    )

    assert response.status_code == 201

    data = response.json()

    assert data["email"] == user["email"]
    assert data["full_name"] == user["full_name"]
    assert "id" in data

    # Never expose passwords in the API response.
    assert "password" not in data
    assert "password_hash" not in data


def test_duplicate_registration(client):
    user = make_test_user()

    first_response = client.post(
        "/api/auth/register",
        json=user,
    )

    assert first_response.status_code == 201

    second_response = client.post(
        "/api/auth/register",
        json=user,
    )

    assert second_response.status_code in (400, 409)


def test_login_success(client):
    user = make_test_user()

    registration = client.post(
        "/api/auth/register",
        json=user,
    )

    assert registration.status_code == 201

    response = client.post(
        "/api/auth/login",
        json={
            "email": user["email"],
            "password": user["password"],
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data
    assert data["token_type"].lower() == "bearer"


def test_login_wrong_password(client):
    user = make_test_user()

    registration = client.post(
        "/api/auth/register",
        json=user,
    )

    assert registration.status_code == 201

    response = client.post(
        "/api/auth/login",
        json={
            "email": user["email"],
            "password": "WrongPassword123!",
        },
    )

    assert response.status_code == 401


def test_authenticated_user_profile(client):
    user = make_test_user()

    registration = client.post(
        "/api/auth/register",
        json=user,
    )

    assert registration.status_code == 201

    login_response = client.post(
        "/api/auth/login",
        json={
            "email": user["email"],
            "password": user["password"],
        },
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    profile_response = client.get(
        "/api/auth/me",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert profile_response.status_code == 200

    profile = profile_response.json()

    assert profile["email"] == user["email"]
    assert profile["full_name"] == user["full_name"]
