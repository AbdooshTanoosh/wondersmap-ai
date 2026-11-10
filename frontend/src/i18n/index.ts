
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      home: "Home",
      destinations: "Destinations",
      myTrips: "My Trips",
      login: "Login",
      heroTitle: "Discover the World with AI",
      heroSubtitle:
        "Plan unforgettable trips with your personal AI travel assistant.",
      planTrip: "Plan My Trip",
      destination: "Where do you want to go?",
      budget: "Your Budget",
      travelers: "Travelers",
      welcome: "Welcome to WondersMap AI",
      departureCity: "Departure City",
      startDate: "Start Date",
      endDate: "End Date",
      adults: "Adults",
      children: "Children",
      preferences: "Travel Preferences",
      previewTrip: "Preview Trip",
      tripSummary: "Trip Summary",
      duration: "Duration",
      days: "days",
      totalTravelers: "Total Travelers",
      loading: "Processing...",
      connectionError: "Error connecting to the server.",
    },
  },
  ar: {
    translation: {
      home: "الرئيسية",
      destinations: "الوجهات",
      myTrips: "رحلاتي",
      login: "تسجيل الدخول",
      heroTitle: "اكتشف العالم بالذكاء الاصطناعي",
      heroSubtitle:
        "خطط لرحلات لا تُنسى مع مساعد السفر الذكي الخاص بك.",
      planTrip: "خطط لرحلتي",
      destination: "إلى أين تريد السفر؟",
      budget: "ميزانيتك",
      travelers: "المسافرون",
      welcome: "مرحباً بك في وندرز ماب",
      departureCity: "مدينة المغادرة",
      startDate: "تاريخ المغادرة",
      endDate: "تاريخ العودة",
      adults: "البالغون",
      children: "الأطفال",
      preferences: "تفضيلات السفر",
      previewTrip: "معاينة الرحلة",
      tripSummary: "ملخص الرحلة",
      duration: "المدة",
      days: "أيام",
      totalTravelers: "إجمالي المسافرين",
      loading: "جاري المعالجة...",
      connectionError: "حدث خطأ أثناء الاتصال بالخادم.",
    },
  },
};

const savedLanguage = localStorage.getItem("wondersmap-language");
const initialLanguage =
  savedLanguage === "ar" ? "ar" : "en";

i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

document.documentElement.lang = initialLanguage;
document.documentElement.dir =
  initialLanguage === "ar" ? "rtl" : "ltr";

export default i18n;
