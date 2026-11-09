
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import "./App.css";

type TripResponse = {
  status: string;
  message: string;
  trip: {
    destination: string;
    travelers: number;
    budget: number;
    currency: string;
    language: string;
  };
};

function App() {
  const { t, i18n } = useTranslation();

  // Trip form state
  const [destination, setDestination] = useState("");
  const [travelers, setTravelers] = useState(2);
  const [budget, setBudget] = useState(5000);

  // API response state
  const [result, setResult] = useState("");
  const [tripData, setTripData] = useState<TripResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const isArabic = i18n.language === "ar";

  // Change website language
  const changeLanguage = async (language: "en" | "ar") => {
    await i18n.changeLanguage(language);

    localStorage.setItem("wondersmap-language", language);

    document.documentElement.lang = language;
    document.documentElement.dir =
      language === "ar" ? "rtl" : "ltr";

    // Clear previous result when changing language
    setResult("");
    setTripData(null);
  };

  // Submit trip request to FastAPI
  const handlePlanTrip = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setLoading(true);
    setResult("");
    setTripData(null);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/trips/plan",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            destination: destination.trim(),
            travelers,
            budget,
            language: isArabic ? "ar" : "en",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Trip request failed");
      }

      const data: TripResponse = await response.json();

      setResult(data.message);
      setTripData(data);

    } catch (error) {
      console.error("Trip planning error:", error);

      setResult(
        isArabic
          ? "حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة مرة أخرى."
          : "Error connecting to the server. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">

      {/* Navigation Bar */}
      <header className="navbar">

        {/* Company Logo */}
        <div className="brand">
          <img
            src="/wondersmap-logo.png"
            alt="Wonders Map company logo"
            className="brand-logo"
          />

          <span className="brand-name">
            WondersMap AI
          </span>
        </div>

        {/* Navigation Links */}
        <nav aria-label={isArabic ? "التنقل الرئيسي" : "Main navigation"}>
          <a href="#home">{t("home")}</a>
          <a href="#destinations">{t("destinations")}</a>
          <a href="#trips">{t("myTrips")}</a>
        </nav>

        {/* Language Switcher */}
        <div className="nav-actions">

          <button
            type="button"
            className="language-button"
            onClick={() =>
              changeLanguage(isArabic ? "en" : "ar")
            }
          >
            {isArabic ? "English" : "العربية"}
          </button>

          <button
            type="button"
            className="login-button"
          >
            {t("login")}
          </button>

        </div>
      </header>

      {/* Main Website */}
      <main id="home">

        {/* Hero Section */}
        <section className="hero">

          <span className="eyebrow">
            ✦ WondersMap AI
          </span>

          <h1>{t("heroTitle")}</h1>

          <p>{t("heroSubtitle")}</p>

          {/* Trip Planning Form */}
          <form
            className="search-card"
            onSubmit={handlePlanTrip}
          >

            {/* Destination */}
            <label htmlFor="destination">
              {t("destination")}
            </label>

            <input
              id="destination"
              type="text"
              placeholder={t("destination")}
              value={destination}
              onChange={(event) =>
                setDestination(event.target.value)
              }
              required
              minLength={2}
              maxLength={100}
            />

            <div className="form-row">

              {/* Number of Travelers */}
              <div>
                <label htmlFor="travelers">
                  {t("travelers")}
                </label>

                <input
                  id="travelers"
                  type="number"
                  min="1"
                  max="30"
                  value={travelers}
                  onChange={(event) =>
                    setTravelers(Number(event.target.value))
                  }
                  required
                />
              </div>

              {/* Travel Budget */}
              <div>
                <label htmlFor="budget">
                  {t("budget")} (CAD)
                </label>

                <input
                  id="budget"
                  type="number"
                  min="1"
                  step="0.01"
                  value={budget}
                  onChange={(event) =>
                    setBudget(Number(event.target.value))
                  }
                  required
                />
              </div>

            </div>

            {/* Submit Button */}
            <button
              className="plan-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? isArabic
                  ? "جاري إرسال الطلب..."
                  : "Submitting..."
                : `✨ ${t("planTrip")}`}
            </button>

            {/* API Response */}
            {result && (
              <div
                className="trip-result"
                role="status"
                aria-live="polite"
              >
                <p>{result}</p>

                {/* Display successful trip details */}
                {tripData && (
                  <div className="trip-details">

                    <h3>
                      {isArabic
                        ? "تفاصيل الرحلة"
                        : "Trip Details"}
                    </h3>

                    <p>
                      <strong>
                        {isArabic
                          ? "الوجهة:"
                          : "Destination:"}
                      </strong>{" "}
                      {tripData.trip.destination}
                    </p>

                    <p>
                      <strong>
                        {isArabic
                          ? "عدد المسافرين:"
                          : "Travelers:"}
                      </strong>{" "}
                      {tripData.trip.travelers}
                    </p>

                    <p>
                      <strong>
                        {isArabic
                          ? "الميزانية:"
                          : "Budget:"}
                      </strong>{" "}
                      {tripData.trip.budget.toLocaleString(
                        isArabic ? "ar-EG" : "en-CA"
                      )}{" "}
                      {tripData.trip.currency}
                    </p>

                  </div>
                )}
              </div>
            )}

          </form>
        </section>
      </main>
    </div>
  );
}

export default App;
