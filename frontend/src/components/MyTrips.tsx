
import { useEffect, useState } from "react";
import type { AuthUser } from "./AuthModal";

type SavedTrip = {
  id: number;
  departure_city: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget: number;
  currency: string;
  created_at: string;
  trip_title: string;
};

type MyTripsProps = {
  accessToken: string;
  currentUser: AuthUser;
  isArabic: boolean;
  onViewTrip: (tripId: number) => void;
  onUnauthorized: () => void;
};

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

export default function MyTrips({
  accessToken,
  currentUser,
  isArabic,
  onViewTrip,
  onUnauthorized,
}: MyTripsProps) {
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Delete Trip states
  const [tripToDelete, setTripToDelete] =
    useState<SavedTrip | null>(null);

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Load saved trips
  useEffect(() => {
    const controller = new AbortController();

    const loadTrips = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/api/trips/mine`,
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

        if (!response.ok) {
          throw new Error("Unable to load trips");
        }

        const data: SavedTrip[] =
          await response.json();

        if (!controller.signal.aborted) {
          setTrips(data);
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        console.error("My Trips error:", err);

        setError(
          isArabic
            ? "تعذر تحميل الرحلات المحفوظة."
            : "Unable to load saved trips."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadTrips();

    return () => controller.abort();
  }, [accessToken, isArabic, onUnauthorized]);

  // Format trip budget
  const formatCAD = (amount: number) =>
    new Intl.NumberFormat(
      isArabic ? "ar-CA" : "en-CA",
      {
        style: "currency",
        currency: "CAD",
      }
    ).format(amount);

  // Open delete confirmation dialog
  const openDeleteDialog = (trip: SavedTrip) => {
    setDeleteError("");
    setTripToDelete(trip);
  };

  // Close delete confirmation dialog
  const closeDeleteDialog = () => {
    if (deleting) return;

    setTripToDelete(null);
    setDeleteError("");
  };

  // Delete saved trip through FastAPI
  const handleDeleteTrip = async () => {
    if (!tripToDelete || deleting) return;

    const tripId = tripToDelete.id;

    setDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch(
        `${API_URL}/api/trips/${tripId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 401) {
        setTripToDelete(null);
        onUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(
          `Delete failed with status ${response.status}`
        );
      }

      // Remove the deleted trip from the displayed list
      setTrips((previousTrips) =>
        previousTrips.filter(
          (trip) => trip.id !== tripId
        )
      );

      setTripToDelete(null);
    } catch (err) {
      console.error("Delete trip error:", err);

      setDeleteError(
        isArabic
          ? "تعذر حذف الرحلة. يرجى المحاولة مرة أخرى."
          : "Unable to delete the trip. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section
      className="my-trips-page"
      dir={isArabic ? "rtl" : "ltr"}
    >
      {/* Page Header */}
      <div className="my-trips-header">
        <h1>{isArabic ? "رحلاتي" : "My Trips"}</h1>

        <p>
          {isArabic
            ? `مرحباً ${currentUser.full_name}، هذه رحلاتك المحفوظة.`
            : `Welcome ${currentUser.full_name}, here are your saved trips.`}
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <p role="status">
          {isArabic
            ? "جاري تحميل الرحلات..."
            : "Loading trips..."}
        </p>
      )}

      {/* Load Error */}
      {error && (
        <p role="alert">
          {error}
        </p>
      )}

      {/* Empty Trips */}
      {!loading && !error && trips.length === 0 && (
        <div className="empty-trips">
          <h2>
            {isArabic
              ? "لا توجد رحلات محفوظة بعد"
              : "No saved trips yet"}
          </h2>

          <p>
            {isArabic
              ? "أنشئ برنامج رحلة واحفظه ليظهر هنا."
              : "Generate and save an itinerary to see it here."}
          </p>
        </div>
      )}

      {/* Saved Trips Cards */}
      {!loading && !error && trips.length > 0 && (
        <div className="saved-trips-grid">
          {trips.map((trip) => (
            <article
              className="saved-trip-card"
              key={trip.id}
            >
              <div className="saved-trip-icon">
                ✈
              </div>

              <h2>
                {trip.trip_title ||
                  trip.destination}
              </h2>

              <p dir="auto">
                {trip.departure_city}
                {" → "}
                {trip.destination}
              </p>

              <p>
                <strong>
                  {isArabic ? "من:" : "From:"}
                </strong>{" "}
                <span dir="ltr">
                  {trip.start_date}
                </span>
              </p>

              <p>
                <strong>
                  {isArabic ? "إلى:" : "To:"}
                </strong>{" "}
                <span dir="ltr">
                  {trip.end_date}
                </span>
              </p>

              <p>
                <strong>
                  {isArabic
                    ? "الميزانية:"
                    : "Budget:"}
                </strong>{" "}
                {formatCAD(trip.budget)}
              </p>

              {/* View Itinerary */}
              <button
                type="button"
                className="view-trip-button"
                onClick={() =>
                  onViewTrip(trip.id)
                }
              >
                {isArabic
                  ? "عرض برنامج الرحلة"
                  : "View Itinerary"}
              </button>

              {/* Delete Trip */}
              <button
                type="button"
                className="delete-trip-button"
                onClick={() =>
                  openDeleteDialog(trip)
                }
              >
                {isArabic
                  ? "حذف الرحلة"
                  : "Delete Trip"}
              </button>
            </article>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {tripToDelete && (
        <div
          className="delete-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeDeleteDialog();
            }
          }}
        >
          <div
            className="delete-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
            dir={isArabic ? "rtl" : "ltr"}
          >
            <h2 id="delete-dialog-title">
              {isArabic
                ? "تأكيد حذف الرحلة"
                : "Delete Trip?"}
            </h2>

            <p id="delete-dialog-description">
              {isArabic
                ? `هل أنت متأكد من حذف رحلة ${tripToDelete.destination}؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete your trip to ${tripToDelete.destination}? This action cannot be undone.`}
            </p>

            {/* Delete Error */}
            {deleteError && (
              <p
                className="auth-error"
                role="alert"
              >
                {deleteError}
              </p>
            )}

            <div className="delete-dialog-actions">
              {/* Cancel */}
              <button
                type="button"
                className="cancel-delete-button"
                disabled={deleting}
                onClick={closeDeleteDialog}
              >
                {isArabic
                  ? "إلغاء"
                  : "Cancel"}
              </button>

              {/* Confirm Delete */}
              <button
                type="button"
                className="confirm-delete-button"
                disabled={deleting}
                onClick={handleDeleteTrip}
              >
                {deleting
                  ? isArabic
                    ? "جاري الحذف..."
                    : "Deleting..."
                  : isArabic
                    ? "نعم، احذف الرحلة"
                    : "Yes, Delete Trip"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
