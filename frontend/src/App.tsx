
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import "./App.css";

// ==========================================
// TYPES
// ==========================================

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

type ExpenseCategory =
  | "flights"
  | "accommodation"
  | "food"
  | "transportation"
  | "activities"
  | "other";

type Activity = {
  time: string;
  name: string;
  description: string;
  category: ExpenseCategory;
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
  category_totals: Record<ExpenseCategory, number>;
};

type AIItinerary = {
  trip_title: string;
  overview: string;
  days: ItineraryDay[];
  travel_tips: string[];
  disclaimer: string;
  budget_summary: BudgetSummary;
};

const expenseCategories: {
  key: ExpenseCategory;
  en: string;
  ar: string;
}[] = [
  { key: "flights", en: "Flights", ar: "الطيران" },
  {
    key: "accommodation",
    en: "Accommodation",
    ar: "الإقامة",
  },
  { key: "food", en: "Food", ar: "الطعام" },
  {
    key: "transportation",
    en: "Transportation",
    ar: "المواصلات",
  },
  {
    key: "activities",
    en: "Activities",
    ar: "الأنشطة",
  },
  {
    key: "other",
    en: "Other Expenses",
    ar: "مصاريف أخرى",
  },
];

// ==========================================
// MAIN APPLICATION
// ==========================================

function App() {
  const { t, i18n } = useTranslation();

  const isArabic = i18n.resolvedLanguage === "ar";

  // Trip form state
  const [departureCity, setDepartureCity] = useState("");
  const [destination, setDestination] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  const [budget, setBudget] = useState(5000);
  const [preferences, setPreferences] = useState("");

  // API result state
  const [tripData, setTripData] =
    useState<TripResponse | null>(null);

  const [itinerary, setItinerary] =
    useState<AIItinerary | null>(null);

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000";

  // ==========================================
  // LANGUAGE SWITCHING
  // ==========================================

  const changeLanguage = async (
    language: "en" | "ar"
  ) => {
    await i18n.changeLanguage(language);

    localStorage.setItem(
      "wondersmap-language",
      language
    );

    document.documentElement.lang = language;

    document.documentElement.dir =
      language === "ar" ? "rtl" : "ltr";

    // Clear previous content generated in another language
    setTripData(null);
    setItinerary(null);
    setError("");
  };

  // ==========================================
  // TRIP REQUEST PAYLOAD
  // ==========================================

  const getTripPayload = () => ({
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
      .map((item) => item.trim())
      .filter(Boolean),
    language: isArabic ? "ar" : "en",
  });

  // ==========================================
  // FORM VALIDATION
  // ==========================================

  const validateTrip = (
    forAI: boolean = false
  ): boolean => {
    const payload = getTripPayload();

    if (
      payload.departure_city.length < 2 ||
      payload.destination.length < 2 ||
      !startDate ||
      !endDate ||
      !Number.isInteger(adults) ||
      !Number.isInteger(children) ||
      adults < 1 ||
      adults > 30 ||
      children < 0 ||
      children > 20 ||
      adults + children > 30 ||
      !Number.isFinite(budget) ||
      budget <= 0
    ) {
      setError(
        isArabic
          ? "يرجى إدخال تفاصيل الرحلة بشكل صحيح."
          : "Please enter valid trip details."
      );

      return false;
    }

    if (endDate < startDate) {
      setError(
        isArabic
          ? "تاريخ العودة يجب أن يكون بعد أو يساوي تاريخ المغادرة."
          : "End date must be on or after the start date."
      );

      return false;
    }

    if (payload.preferences.length > 10) {
      setError(
        isArabic
          ? "يمكنك إدخال 10 تفضيلات كحد أقصى."
          : "You can enter a maximum of 10 preferences."
      );

      return false;
    }

    if (forAI) {
      const start = new Date(`${startDate}T12:00:00`);
      const end = new Date(`${endDate}T12:00:00`);

      const duration =
        Math.round(
          (end.getTime() - start.getTime()) /
            86400000
        ) + 1;

      if (
        !Number.isFinite(duration) ||
        duration < 1 ||
        duration > 7
      ) {
        setError(
          isArabic
            ? "يدعم الذكاء الاصطناعي رحلات من يوم إلى 7 أيام حالياً."
            : "AI itinerary generation currently supports trips of 1 to 7 days."
        );

        return false;
      }
    }

    return true;
  };

  // ==========================================
  // PREVIEW TRIP
  // ==========================================

  const handlePreviewTrip = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (loading || generating) return;

    setError("");

    if (!validateTrip()) return;

    setLoading(true);
    setTripData(null);
    setItinerary(null);

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/trips/preview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(getTripPayload()),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Preview request failed: ${response.status}`
        );
      }

      const data: TripResponse =
        await response.json();

      setTripData(data);

    } catch (err) {
      console.error(
        "Trip preview error:",
        err
      );

      setError(
        isArabic
          ? "تعذر معاينة الرحلة. تحقق من الاتصال بالخادم."
          : "Unable to preview the trip. Check the server connection."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // GENERATE AI ITINERARY
  // ==========================================

  const handleGenerateAI = async () => {
    if (generating || loading) return;

    setError("");

    if (!validateTrip(true)) return;

    setGenerating(true);
    setTripData(null);
    setItinerary(null);

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/trips/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(getTripPayload()),
        }
      );

      if (!response.ok) {
        throw new Error(
          `AI request failed: ${response.status}`
        );
      }

      const data: AIItinerary =
        await response.json();

      if (!data.budget_summary) {
        throw new Error(
          "Budget summary missing from API response"
        );
      }

      setItinerary(data);

    } catch (err) {
      console.error(
        "AI generation error:",
        err
      );

      setError(
        isArabic
          ? "تعذر إنشاء برنامج الرحلة. يرجى المحاولة مرة أخرى."
          : "Unable to generate the AI itinerary. Please try again."
      );
    } finally {
      setGenerating(false);
    }
  };

  // ==========================================
  // CURRENCY FORMATTING
  // ==========================================

  const formatCAD = (amount: number): string => {
    return new Intl.NumberFormat(
      isArabic ? "ar-CA" : "en-CA",
      {
        style: "currency",
        currency: "CAD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    ).format(amount);
  };

  // ==========================================
  // BUDGET DASHBOARD VARIABLES
  // ==========================================

  const budgetSummary =
    itinerary?.budget_summary;

  const budgetPercentage =
    budgetSummary &&
    budgetSummary.requested_budget > 0
      ? (
          budgetSummary.estimated_total /
          budgetSummary.requested_budget
        ) * 100
      : 0;

  const budgetBarWidth = Math.min(
    Math.max(budgetPercentage, 0),
    100
  );

  // ==========================================
  // USER INTERFACE
  // ==========================================

  return (
    <div className="app">

      {/* =====================================
          NAVIGATION BAR
      ====================================== */}

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

        {/* Navigation */}
        <nav
          aria-label={
            isArabic
              ? "التنقل الرئيسي"
              : "Main navigation"
          }
        >
          <a href="#home">
            {t("home")}
          </a>

          <a href="#destinations">
            {t("destinations")}
          </a>

          <a href="#trips">
            {t("myTrips")}
          </a>
        </nav>

        {/* Language Switcher */}
        <div className="nav-actions">

          <button
            type="button"
            className="language-button"
            onClick={() =>
              changeLanguage(
                isArabic ? "en" : "ar"
              )
            }
          >
            {isArabic
              ? "English"
              : "العربية"}
          </button>

          <button
            type="button"
            className="login-button"
          >
            {t("login")}
          </button>

        </div>
      </header>

      {/* =====================================
          HOMEPAGE
      ====================================== */}

      <main id="home">

        <section className="hero">

          <span className="eyebrow">
            ✦ WondersMap AI
          </span>

          <h1>
            {t("heroTitle")}
          </h1>

          <p>
            {t("heroSubtitle")}
          </p>

          {/* =====================================
              TRIP PLANNING FORM
          ====================================== */}

          <form
            className="search-card"
            onSubmit={handlePreviewTrip}
          >

            {/* Departure / Destination */}
            <div className="form-row">

              <div>
                <label htmlFor="departure">
                  {t("departureCity")}
                </label>

                <input
                  id="departure"
                  type="text"
                  value={departureCity}
                  onChange={(event) =>
                    setDepartureCity(
                      event.target.value
                    )
                  }
                  placeholder={t("departureCity")}
                  minLength={2}
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <label htmlFor="destination">
                  {t("destination")}
                </label>

                <input
                  id="destination"
                  type="text"
                  value={destination}
                  onChange={(event) =>
                    setDestination(
                      event.target.value
                    )
                  }
                  placeholder={t("destination")}
                  minLength={2}
                  maxLength={100}
                  required
                />
              </div>
            </div>

            {/* Travel Dates */}
            <div className="form-row">

              <div>
                <label htmlFor="startDate">
                  {t("startDate")}
                </label>

                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(event) =>
                    setStartDate(
                      event.target.value
                    )
                  }
                  required
                />
              </div>

              <div>
                <label htmlFor="endDate">
                  {t("endDate")}
                </label>

                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(event) =>
                    setEndDate(
                      event.target.value
                    )
                  }
                  required
                />
              </div>
            </div>

            {/* Adults / Children */}
            <div className="form-row">

              <div>
                <label htmlFor="adults">
                  {t("adults")}
                </label>

                <input
                  id="adults"
                  type="number"
                  min="1"
                  max="30"
                  value={adults}
                  onChange={(event) =>
                    setAdults(
                      Number(event.target.value)
                    )
                  }
                  required
                />
              </div>

              <div>
                <label htmlFor="children">
                  {t("children")}
                </label>

                <input
                  id="children"
                  type="number"
                  min="0"
                  max="20"
                  value={children}
                  onChange={(event) =>
                    setChildren(
                      Number(event.target.value)
                    )
                  }
                  required
                />
              </div>
            </div>

            {/* Budget */}
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
                setBudget(
                  Number(event.target.value)
                )
              }
              required
            />

            {/* Preferences */}
            <label htmlFor="preferences">
              {t("preferences")}
            </label>

            <input
              id="preferences"
              type="text"
              value={preferences}
              onChange={(event) =>
                setPreferences(
                  event.target.value
                )
              }
              placeholder={
                isArabic
                  ? "عائلي، مواقع تاريخية، طعام حلال"
                  : "Family-friendly, Historical sites, Halal food"
              }
            />

            {/* Preview Button */}
            <button
              className="plan-button"
              type="submit"
              disabled={
                loading || generating
              }
            >
              {loading
                ? t("loading")
                : `✨ ${t("previewTrip")}`}
            </button>

            {/* AI Generation Button */}
            <button
              type="button"
              className="plan-button ai-button"
              onClick={handleGenerateAI}
              disabled={
                loading || generating
              }
            >
              {generating
                ? isArabic
                  ? "جاري إنشاء برنامج الرحلة..."
                  : "Generating AI itinerary..."
                : isArabic
                  ? "✨ إنشاء برنامج الرحلة بالذكاء الاصطناعي"
                  : "✨ Generate AI Itinerary"}
            </button>

            {/* =====================================
                ERROR DISPLAY
            ====================================== */}

            {error && (
              <div
                className="trip-result"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* =====================================
                TRIP PREVIEW
            ====================================== */}

            {tripData && (
              <div
                className="trip-result"
                role="status"
              >
                <h3>
                  {t("tripSummary")}
                </h3>

                <p>
                  {tripData.message}
                </p>

                <p>
                  <strong>
                    {t("departureCity")}:
                  </strong>{" "}
                  {
                    tripData.trip_summary
                      .departure_city
                  }
                </p>

                <p>
                  <strong>
                    {t("destination")}:
                  </strong>{" "}
                  {
                    tripData.trip_summary
                      .destination
                  }
                </p>

                <p>
                  <strong>
                    {t("duration")}:
                  </strong>{" "}
                  {
                    tripData.trip_summary
                      .duration_days
                  }{" "}
                  {t("days")}
                </p>

                <p>
                  <strong>
                    {t("totalTravelers")}:
                  </strong>{" "}
                  {
                    tripData.trip_summary
                      .total_travelers
                  }
                </p>

                <p>
                  <strong>
                    {t("budget")}:
                  </strong>{" "}
                  {formatCAD(
                    tripData.trip_summary.budget
                  )}
                </p>

              </div>
            )}

            {/* =====================================
                AI ITINERARY
            ====================================== */}

            {itinerary && (
              <div className="itinerary-result">

                <h2>
                  {itinerary.trip_title}
                </h2>

                <p>
                  {itinerary.overview}
                </p>

                {/* =====================================
                    BUDGET DASHBOARD
                ====================================== */}

                {budgetSummary && (
                  <section className="budget-dashboard">

                    <h3>
                      {isArabic
                        ? "ملخص ميزانية الرحلة"
                        : "Trip Budget Summary"}
                    </h3>

                    {/* Budget Statistics */}
                    <div className="budget-stats">

                      <div className="budget-stat">

                        <span>
                          {isArabic
                            ? "الميزانية المحددة"
                            : "Your Budget"}
                        </span>

                        <strong>
                          {formatCAD(
                            budgetSummary.requested_budget
                          )}
                        </strong>

                      </div>

                      <div className="budget-stat">

                        <span>
                          {isArabic
                            ? "التكلفة التقديرية"
                            : "Estimated Total"}
                        </span>

                        <strong>
                          {formatCAD(
                            budgetSummary.estimated_total
                          )}
                        </strong>

                      </div>

                      <div className="budget-stat">

                        <span>
                          {budgetSummary.over_budget
                            ? isArabic
                              ? "تجاوز الميزانية"
                              : "Over Budget"
                            : isArabic
                              ? "المبلغ المتبقي"
                              : "Remaining Budget"}
                        </span>

                        <strong
                          className={
                            budgetSummary.over_budget
                              ? "budget-negative"
                              : "budget-positive"
                          }
                        >
                          {formatCAD(
                            budgetSummary.over_budget
                              ? budgetSummary.over_budget_amount
                              : budgetSummary.remaining_budget
                          )}
                        </strong>

                      </div>
                    </div>

                    {/* Budget Usage Bar */}
                    <div
                      className="budget-progress"
                      role="progressbar"
                      aria-label={
                        isArabic
                          ? "نسبة الميزانية المستخدمة"
                          : "Budget used"
                      }
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={
                        Math.min(
                          Math.max(budgetPercentage, 0),
                          100
                        )
                      }
                      aria-valuetext={`${budgetPercentage.toFixed(1)}%`}
                    >
                      <div
                        className="budget-progress-fill"
                        style={{
                          width: `${budgetBarWidth}%`,
                          backgroundColor:
                            budgetSummary.over_budget
                              ? "#dc2626"
                              : "#0d9488",
                        }}
                      />
                    </div>

                    <p className="budget-usage">
                      {budgetPercentage.toFixed(1)}%
                      {" "}
                      {isArabic
                        ? "من الميزانية المستخدمة"
                        : "of budget used"}
                    </p>

                    {/* Over Budget Warning */}
                    {budgetSummary.over_budget && (
                      <p
                        className="budget-warning"
                        role="alert"
                      >
                        {isArabic
                          ? `تحذير: تكلفة الرحلة تتجاوز الميزانية بمبلغ ${formatCAD(
                              budgetSummary.over_budget_amount
                            )}.`
                          : `Warning: This trip exceeds your budget by ${formatCAD(
                              budgetSummary.over_budget_amount
                            )}.`}
                      </p>
                    )}

                    {/* Expense Categories */}
                    <h4>
                      {isArabic
                        ? "تفاصيل المصاريف"
                        : "Expense Breakdown"}
                    </h4>

                    <div className="expense-list">

                      {expenseCategories.map(
                        (category) => (
                          <div
                            className="expense-row"
                            key={category.key}
                          >
                            <span>
                              {isArabic
                                ? category.ar
                                : category.en}
                            </span>

                            <strong>
                              {formatCAD(
                                budgetSummary.category_totals[
                                  category.key
                                ] ?? 0
                              )}
                            </strong>
                          </div>
                        )
                      )}

                    </div>

                    <p className="budget-note">
                      {isArabic
                        ? "جميع الأسعار تقديرية وغير مؤكدة. قد تختلف الأسعار الفعلية عند الحجز."
                        : "All prices are estimates, not verified offers. Actual booking costs may differ."}
                    </p>

                  </section>
                )}

                {/* =====================================
                    DAY-BY-DAY ITINERARY
                ====================================== */}

                <div className="itinerary-days">

                  {itinerary.days.map(
                    (day) => (
                      <article
                        className="day-card"
                        key={day.day}
                      >

                        <h3>
                          {isArabic
                            ? `اليوم ${day.day}`
                            : `Day ${day.day}`}
                          {" — "}
                          {day.title}
                        </h3>

                        {day.activities.map(
                          (activity, index) => (
                            <div
                              className="activity-card"
                              key={`${day.day}-${index}`}
                            >

                              <div className="activity-heading">

                                <strong>
                                  {activity.name}
                                </strong>

                                <span>
                                  {activity.time}
                                </span>

                              </div>

                              <p>
                                {activity.description}
                              </p>

                              <small>
                                {isArabic
                                  ? "التكلفة التقديرية:"
                                  : "Estimated cost:"}
                                {" "}
                                {formatCAD(
                                  activity.estimated_cost_cad
                                )}
                              </small>

                            </div>
                          )
                        )}
                      </article>
                    )
                  )}

                </div>

                {/* =====================================
                    TRAVEL TIPS
                ====================================== */}

                <div className="travel-tips">

                  <h3>
                    {isArabic
                      ? "نصائح السفر"
                      : "Travel Tips"}
                  </h3>

                  <ul>
                    {itinerary.travel_tips.map(
                      (tip, index) => (
                        <li key={index}>
                          {tip}
                        </li>
                      )
                    )}
                  </ul>

                </div>

                {/* Disclaimer */}
                <p className="itinerary-disclaimer">
                  {itinerary.disclaimer}
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
