
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import "./App.css";

type TripSummary = {
  departure_city: string;
  destination: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  adults: number;
  children: number;
  total_travelers: number;
  budget: number;
  currency: string;
  preferences: string[];
  language: string;
};

type TripResponse = {
  status: string;
  message: string;
  trip_summary: TripSummary;
};

function App() {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const [departureCity, setDepartureCity] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [budget, setBudget] = useState(5000);
  const [preferences, setPreferences] = useState("");

  const [tripData, setTripData] = useState<TripResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const changeLanguage = async (language: "en" | "ar") => {
    await i18n.changeLanguage(language);

    localStorage.setItem("wondersmap-language", language);

    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";

    setTripData(null);
    setError("");
  };

  const handlePreviewTrip = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setTripData(null);

    if (endDate < startDate) {
      setError(
        isArabic
          ? "تاريخ العودة يجب أن يكون بعد تاريخ المغادرة."
          : "End date must be on or after start date."
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/trips/preview",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            departure_city: departureCity.trim(),
            destination: destination.trim(),
            start_date: startDate,
            end_date: endDate,
            adults,
            children,
            budget,
            currency: "CAD",
            preferences: preferences
              .split(",")
              .map((p) => p.trim())
              .filter(Boolean),
            language: isArabic ? "ar" : "en",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: TripResponse = await response.json();
      setTripData(data);
    } catch (err) {
      console.error(err);
      setError(t("connectionError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="navbar">
        <div className="brand">
          <img
            src="/wondersmap-logo.png"
            alt="Wonders Map"
            className="brand-logo"
          />
          <span className="brand-name">WondersMap AI</span>
        </div>

        <nav aria-label="Main navigation">
          <a href="#home">{t("home")}</a>
          <a href="#destinations">{t("destinations")}</a>
          <a href="#trips">{t("myTrips")}</a>
        </nav>

        <div className="nav-actions">
          <button
            type="button"
            className="language-button"
            onClick={() => changeLanguage(isArabic ? "en" : "ar")}
          >
            {isArabic ? "English" : "العربية"}
          </button>
          <button type="button" className="login-button">
            {t("login")}
          </button>
        </div>
      </header>

      <main id="home">
        <section className="hero">
          <span className="eyebrow">✦ WondersMap AI</span>
          <h1>{t("heroTitle")}</h1>
          <p>{t("heroSubtitle")}</p>

          <form className="search-card" onSubmit={handlePreviewTrip}>
            <div className="form-row">
              <div>
                <label htmlFor="departure">{t("departureCity")}</label>
                <input
                  id="departure"
                  type="text"
                  value={departureCity}
                  onChange={(e) => setDepartureCity(e.target.value)}
                  placeholder={t("departureCity")}
                  minLength={2}
                  maxLength={100}
                  required
                />
              </div>
              <div>
                <label htmlFor="destination">{t("destination")}</label>
                <input
                  id="destination"
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder={t("destination")}
                  minLength={2}
                  maxLength={100}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div>
                <label htmlFor="startDate">{t("startDate")}</label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="endDate">{t("endDate")}</label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div>
                <label htmlFor="adults">{t("adults")}</label>
                <input
                  id="adults"
                  type="number"
                  min="1"
                  max="30"
                  value={adults}
                  onChange={(e) => setAdults(Number(e.target.value))}
                  required
                />
              </div>
              <div>
                <label htmlFor="children">{t("children")}</label>
                <input
                  id="children"
                  type="number"
                  min="0"
                  max="20"
                  value={children}
                  onChange={(e) => setChildren(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <label htmlFor="budget">{t("budget")} (CAD)</label>
            <input
              id="budget"
              type="number"
              min="1"
              step="0.01"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              required
            />

            <label htmlFor="preferences">{t("preferences")}</label>
            <input
              id="preferences"
              type="text"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder={
                isArabic
                  ? "عائلي، مواقع تاريخية، طعام حلال"
                  : "Family-friendly, Historical sites, Halal food"
              }
            />

            <button
              className="plan-button"
              type="submit"
              disabled={loading}
            >
              {loading ? t("loading") : `✨ ${t("previewTrip")}`}
            </button>

            {error && (
              <div className="trip-result" role="alert">
                {error}
              </div>
            )}

            {tripData && (
              <div className="trip-result" role="status">
                <h3>{t("tripSummary")}</h3>
                <p>{tripData.message}</p>
                <p>
                  <strong>{t("departureCity")}:</strong>{" "}
                  {tripData.trip_summary.departure_city}
                </p>
                <p>
                  <strong>{t("destination")}:</strong>{" "}
                  {tripData.trip_summary.destination}
                </p>
                <p>
                  <strong>{t("duration")}:</strong>{" "}
                  {tripData.trip_summary.duration_days} {t("days")}
                </p>
                <p>
                  <strong>{t("totalTravelers")}:</strong>{" "}
                  {tripData.trip_summary.total_travelers}
                </p>
                <p>
                  <strong>{t("budget")}:</strong>{" "}
                  {tripData.trip_summary.budget.toLocaleString(
                    isArabic ? "ar-EG" : "en-CA"
                  )} CAD
                </p>
              </div>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}

export default App;
