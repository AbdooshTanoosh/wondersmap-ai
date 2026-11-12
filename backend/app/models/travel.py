
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base


def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False
    )
    full_name: Mapped[str] = mapped_column(String(150))
    password_hash: Mapped[str] = mapped_column(String(255))
    preferred_language: Mapped[str] = mapped_column(
        String(2), default="en"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now
    )

    trips: Mapped[list["Trip"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )


class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )

    departure_city: Mapped[str] = mapped_column(String(100))
    destination: Mapped[str] = mapped_column(String(100))
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)

    adults: Mapped[int] = mapped_column(Integer)
    children: Mapped[int] = mapped_column(Integer)

    budget: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(
        String(3), default="CAD"
    )
    preferences: Mapped[list] = mapped_column(
        JSON, default=list
    )
    language: Mapped[str] = mapped_column(
        String(2), default="en"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now
    )

    user: Mapped["User"] = relationship(
        back_populates="trips"
    )
    itinerary: Mapped["Itinerary | None"] = relationship(
        back_populates="trip",
        uselist=False,
        cascade="all, delete-orphan",
    )


class Itinerary(Base):
    __tablename__ = "itineraries"
    __table_args__ = (
        UniqueConstraint("trip_id", name="uq_itineraries_trip_id"),
    )

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True
    )
    trip_id: Mapped[int] = mapped_column(
        ForeignKey("trips.id"), nullable=False
    )
    content: Mapped[dict] = mapped_column(
        JSON, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now
    )

    trip: Mapped["Trip"] = relationship(
        back_populates="itinerary"
    )
