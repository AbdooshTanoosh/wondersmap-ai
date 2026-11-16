
import { useEffect, useState } from "react";

type Activity = {
  time: string;
  name: string;
  description: string;
  category: string;
  estimated_cost_cad: number;
};

type ItineraryDay = {
  day: number;
  title: string;
  activities: Activity[];
};

type BudgetSummary = {
  currency: string;
  requested_budget: number;
  estimated_total: number;
  remaining_budget: number;
  over_budget: boolean;
  over_budget_amount: number;
  category_totals: Record<string, number>;
};

type SavedTrip = {
  id: number;
  departure_city: string;
  destination: string;
  start_date: string;
  end_date: string;
  adults: number;
  children: number;
  budget: number;
  currency: string;
  language: string;
  itinerary: {
    trip_title: string;
    overview: string;
    days: ItineraryDay[];
    travel_tips: string[];
    disclaimer: string;
  };
  budget_summary: BudgetSummary;
};

type Props = {
  tripId: number;
  accessToken: string;
  isArabic: boolean;
  onBack: () => void;
  onUnauthorized: () => void;
};

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

const categories = [
  { key: "flights", en: "Flights", ar: "الطيران" },
  { key: "accommodation", en: "Accommodation", ar: "الإقامة" },
  { key: "food", en: "Food", ar: "الطعام" },
  { key: "transportation", en: "Transportation", ar: "المواصلات" },
  { key: "activities", en: "Activities", ar: "الأنشطة" },
  { key: "other", en: "Other Expenses", ar: "مصاريف أخرى" },
];

export default function SavedTripDetails({
  tripId,
  accessToken,
  isArabic,
  onBack,
  onUnauthorized,
}: Props) {
  const [trip, setTrip] = useState<SavedTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const text = (en: string, ar: string) =>
    isArabic ? ar : en;

  // Load the selected trip from PostgreSQL through FastAPI.
  useEffect(() => {
    const controller = new AbortController();

    async function loadTrip() {
      setLoading(true);
      setTrip(null);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/api/trips/${tripId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            signal: controller.signal,
          }
        );

        if (controller.signal.aborted) return;

        if (response.status === 401) {
          onUnauthorized();
          return;
        }

        if (response.status === 404) {
          throw new Error("NOT_FOUND");
        }

        if (!response.ok) {
          throw new Error("REQUEST_FAILED");
        }

        const data: SavedTrip = await response.json();

        if (!controller.signal.aborted) {
          setTrip(data);
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error && err.message === "NOT_FOUND"
            ? isArabic
              ? "لم يتم العثور على الرحلة."
              : "Trip not found."
            : isArabic
              ? "تعذر تحميل الرحلة المحفوظة."
              : "Unable to load saved trip."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadTrip();

    return () => controller.abort();
  }, [tripId, accessToken, isArabic, onUnauthorized]);

  const formatCAD = (amount: number) =>
    new Intl.NumberFormat(
      isArabic ? "ar-CA" : "en-CA",
      {
        style: "currency",
        currency: "CAD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    ).format(amount);

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(
      isArabic ? "ar-CA" : "en-CA",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      }
    ).format(new Date(`${value}T12:00:00Z`));

  return (
    <section
      className="saved-trip-details"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <button
        type="button"
        className="back-trips-button"
        onClick={onBack}
      >
        {text("Back to My Trips", "العودة إلى رحلاتي")}
      </button>

      {loading && (
        <p role="status">
          {text(
            "Loading itinerary...",
            "جاري تحميل برنامج الرحلة..."
          )}
        </p>
      )}

      {error && <p role="alert">{error}</p>}

      {trip && (
        <>
          <h1>{trip.itinerary.trip_title}</h1>

          <p className="trip-route" dir="auto">
            {trip.departure_city} → {trip.destination}
          </p>

          <p>
            {formatDate(trip.start_date)}
            {" — "}
            {formatDate(trip.end_date)}
          </p>

          <p>
            <strong>{text("Travelers", "المسافرون")}:</strong>{" "}
            {trip.adults + trip.children}
          </p>

          <p>{trip.itinerary.overview}</p>

          {/* Saved budget */}
          <section className="saved-budget">
            <h2>{text("Trip Budget", "ميزانية الرحلة")}</h2>

            <div className="saved-budget-grid">
              <div>
                <span>{text("Your Budget", "ميزانيتك")}</span>
                <strong>
                  {formatCAD(
                    trip.budget_summary.requested_budget
                  )}
                </strong>
              </div>

              <div>
                <span>
                  {text("Estimated Total", "التكلفة التقديرية")}
                </span>
                <strong>
                  {formatCAD(
                    trip.budget_summary.estimated_total
                  )}
                </strong>
              </div>

              <div>
                <span>
                  {trip.budget_summary.over_budget
                    ? text("Over Budget", "تجاوز الميزانية")
                    : text("Remaining", "المتبقي")}
                </span>
                <strong>
                  {formatCAD(
                    trip.budget_summary.over_budget
                      ? trip.budget_summary.over_budget_amount
                      : trip.budget_summary.remaining_budget
                  )}
                </strong>
              </div>
            </div>

            {trip.budget_summary.over_budget && (
              <p className="budget-warning" role="alert">
                {text(
                  "Warning: This trip exceeds your budget.",
                  "تحذير: تكلفة الرحلة تتجاوز الميزانية."
                )}
              </p>
            )}

            <h3>
              {text("Expense Breakdown", "تفاصيل المصاريف")}
            </h3>

            <div className="expense-list">
              {categories.map((category) => (
                <div
                  className="expense-row"
                  key={category.key}
                >
                  <span>
                    {text(category.en, category.ar)}
                  </span>
                  <strong>
                    {formatCAD(
                      trip.budget_summary.category_totals[
                        category.key
                      ] ?? 0
                    )}
                  </strong>
                </div>
              ))}
            </div>
          </section>

          {/* Daily itinerary */}
          <h2>
            {text("Daily Itinerary", "برنامج الرحلة اليومي")}
          </h2>

          <div className="itinerary-days">
            {trip.itinerary.days.map((day) => (
              <article
                className="day-card"
                key={day.day}
              >
                <h3>
                  {text(
                    `Day ${day.day}`,
                    `اليوم ${day.day}`
                  )}
                  {" — "}
                  {day.title}
                </h3>

                {day.activities.map((activity, index) => (
                  <div
                    className="activity-card"
                    key={`${day.day}-${index}`}
                  >
                    <div className="activity-heading">
                      <strong>{activity.name}</strong>
                      <span>{activity.time}</span>
                    </div>

                    <p>{activity.description}</p>

                    <small>
                      {text(
                        "Estimated cost",
                        "التكلفة التقديرية"
                      )}:{" "}
                      {formatCAD(
                        activity.estimated_cost_cad
                      )}
                    </small>
                  </div>
                ))}
              </article>
            ))}
          </div>

          {/* Travel tips */}
          <section className="travel-tips">
            <h3>
              {text("Travel Tips", "نصائح السفر")}
            </h3>

            <ul>
              {trip.itinerary.travel_tips.map(
                (tip, index) => (
                  <li key={index}>{tip}</li>
                )
              )}
            </ul>
          </section>

          <p className="itinerary-disclaimer">
            {trip.itinerary.disclaimer}
          </p>

          <p className="budget-note">
            {text(
              "These are saved estimates, not verified booking prices.",
              "هذه تقديرات محفوظة وليست أسعار حجز مؤكدة."
            )}
          </p>
        </>
      )}
    </section>
  );
}
