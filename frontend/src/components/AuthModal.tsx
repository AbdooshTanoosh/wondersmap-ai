
import { useState, type FormEvent } from "react";

export type AuthUser = {
  id: number;
  full_name: string;
  email: string;
  preferred_language: string;
};

type AuthModalProps = {
  isArabic: boolean;
  onClose: () => void;
  onAuthenticated: (token: string, user: AuthUser) => void;
};

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

export default function AuthModal({
  isArabic,
  onClose,
  onAuthenticated,
}: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const text = (en: string, ar: string) =>
    isArabic ? ar : en;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");
    setNotice("");

    try {
      if (mode === "register") {
        const response = await fetch(`${API_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: fullName.trim(),
            email: email.trim(),
            password,
            preferred_language: isArabic ? "ar" : "en",
          }),
        });

        if (!response.ok) {
          setError(
            response.status === 409
              ? text(
                  "This email is already registered.",
                  "هذا البريد الإلكتروني مسجل مسبقاً."
                )
              : text(
                  "Registration failed. Check your details.",
                  "فشل إنشاء الحساب. تحقق من بياناتك."
                )
          );
          return;
        }

        setMode("login");
        setPassword("");
        setNotice(
          text(
            "Account created! Please log in.",
            "تم إنشاء الحساب! يرجى تسجيل الدخول."
          )
        );
        return;
      }

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      if (!response.ok) {
        setError(
          text(
            "Invalid email or password.",
            "البريد الإلكتروني أو كلمة المرور غير صحيحة."
          )
        );
        return;
      }

      const data: {
        access_token: string;
        token_type: string;
      } = await response.json();

      // Retrieve the actual authenticated profile.
      const profileResponse = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      });

      if (!profileResponse.ok) {
        throw new Error("Profile request failed");
      }

      const user: AuthUser = await profileResponse.json();

      onAuthenticated(data.access_token, user);
      onClose();
    } catch {
      setError(
        text(
          "Unable to connect to the server. Please try again.",
          "تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-heading"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <button
          className="auth-close"
          type="button"
          onClick={onClose}
          aria-label={text("Close", "إغلاق")}
        >
          ×
        </button>

        <img
          src="/wondersmap-logo.png"
          alt="Wonders Map"
          className="auth-logo"
        />

        <h2 id="auth-heading">
          {mode === "login"
            ? text("Welcome Back", "مرحباً بعودتك")
            : text("Create Your Account", "إنشاء حساب جديد")}
        </h2>

        <p className="auth-subtitle">
          {text(
            "Your journey starts with WondersMap AI",
            "رحلتك تبدأ مع وندرز ماب"
          )}
        </p>

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <>
              <label htmlFor="auth-name">
                {text("Full Name", "الاسم الكامل")}
              </label>
              <input
                id="auth-name"
                type="text"
                autoComplete="name"
                required
                minLength={2}
                maxLength={150}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </>
          )}

          <label htmlFor="auth-email">
            {text("Email Address", "البريد الإلكتروني")}
          </label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            dir="ltr"
          />

          <label htmlFor="auth-password">
            {text("Password", "كلمة المرور")}
          </label>
          <input
            id="auth-password"
            type="password"
            autoComplete={
              mode === "register" ? "new-password" : "current-password"
            }
            required
            minLength={mode === "register" ? 12 : undefined}
            maxLength={mode === "register" ? 128 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            dir="ltr"
          />

          {mode === "register" && (
            <small className="auth-hint">
              {text(
                "Use at least 12 characters.",
                "استخدم 12 حرفاً على الأقل."
              )}
            </small>
          )}

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          {notice && (
            <p className="auth-notice" role="status">
              {notice}
            </p>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? text("Please wait...", "يرجى الانتظار...")
              : mode === "login"
                ? text("Log In", "تسجيل الدخول")
                : text("Create Account", "إنشاء الحساب")}
          </button>
        </form>

        <button
          className="auth-switch"
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
            setNotice("");
            setPassword("");
          }}
        >
          {mode === "login"
            ? text(
                "Don't have an account? Register",
                "ليس لديك حساب؟ أنشئ حساباً"
              )
            : text(
                "Already have an account? Log in",
                "لديك حساب بالفعل؟ سجل الدخول"
              )}
        </button>
      </section>
    </div>
  );
}
