
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
from dotenv import load_dotenv
from pwdlib import PasswordHash


ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(ENV_PATH)

password_hasher = PasswordHash.recommended()

JWT_ALGORITHM = "HS256"
JWT_ISSUER = "wondersmap-ai"
JWT_AUDIENCE = "wondersmap-api"


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(
    password: str,
    password_hash: str
) -> bool:
    return password_hasher.verify(
        password,
        password_hash
    )


def create_access_token(user_id: int) -> str:
    secret_key = os.getenv("JWT_SECRET_KEY")

    if not secret_key or len(secret_key) < 32:
        raise RuntimeError(
            "A secure JWT_SECRET_KEY is required"
        )

    expire_minutes = int(
        os.getenv(
            "JWT_ACCESS_TOKEN_EXPIRE_MINUTES",
            "30"
        )
    )

    if expire_minutes < 1 or expire_minutes > 1440:
        raise ValueError("Invalid token expiration setting")

    now = datetime.now(timezone.utc)

    payload = {
        "sub": str(user_id),
        "iss": JWT_ISSUER,
        "aud": JWT_AUDIENCE,
        "iat": now,
        "exp": now + timedelta(minutes=expire_minutes),
    }

    return jwt.encode(
        payload,
        secret_key,
        algorithm=JWT_ALGORITHM
    )


def decode_access_token(token: str) -> int:
    secret_key = os.getenv("JWT_SECRET_KEY")

    if not secret_key or len(secret_key) < 32:
        raise RuntimeError(
            "JWT_SECRET_KEY is not configured"
        )

    payload = jwt.decode(
        token,
        secret_key,
        algorithms=[JWT_ALGORITHM],
        issuer=JWT_ISSUER,
        audience=JWT_AUDIENCE,
        options={
            "require": [
                "sub",
                "iss",
                "aud",
                "iat",
                "exp"
            ]
        }
    )

    return int(payload["sub"])
