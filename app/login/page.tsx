"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiRequest } from "@/lib/http-client";
import { AuthSession } from "@/lib/auth-types";
import { getDefaultRouteForRole, getSession, setSession } from "@/lib/session";
import { Avatar, Field, Icon } from "@/components/ui";

type LoginResponse = AuthSession;

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    if (session) {
      router.replace(getDefaultRouteForRole(session.user.role));
    }
  }, [router]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const session = await apiRequest<LoginResponse>(
        "/auth/login",
        { method: "POST", body: JSON.stringify({ email, password }) },
        { auth: false },
      );

      setSession(session);
      const nextPath = new URLSearchParams(window.location.search).get("next");
      router.replace(nextPath || getDefaultRouteForRole(session.user.role));
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : submitError instanceof Error
            ? submitError.message
            : "Unexpected error. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      {/* ── Left panel ── */}
      <aside className="login-side">
        <div className="login-side-art" />

        <div className="row" style={{ position: "relative", gap: 10 }}>
          <div className="side-brand-mark" style={{ width: 34, height: 34, fontSize: 18 }}>Rx</div>
          <div className="side-brand-name">RxFlow</div>
        </div>

        <div className="login-quote">
          <p className="login-quote-text">
            Prescriptions, written once. Tracked everywhere they go.
          </p>
          <div className="login-quote-cite">
            <Avatar name="Maya Chen" />
            <div>
              <div style={{ fontWeight: 600, color: "var(--ink-2)", fontSize: 13 }}>Dr. Maya Chen</div>
              <div>Internal Medicine · Mercy General</div>
            </div>
          </div>
        </div>

        <div className="row" style={{ position: "relative", gap: 18, color: "var(--ink-3)", fontSize: 12 }}>
          <div className="row" style={{ gap: 6 }}>
            <Icon name="shieldCheck" size={14} /> HIPAA compliant
          </div>
          <div className="row" style={{ gap: 6 }}>
            <Icon name="lock" size={14} /> SOC 2 Type II
          </div>
        </div>
      </aside>

      {/* ── Right panel ── */}
      <main className="login-main">
        <div className="login-card">
          <div style={{ marginBottom: 24 }}>
            <h1 className="page-h1" style={{ fontSize: 28, marginBottom: 6 }}>Sign in</h1>
            <p className="page-sub">Continue to your RxFlow workspace.</p>
          </div>

          <form onSubmit={onSubmit} className="stack">
            <Field label="Email">
              <input
                className="input"
                type="email"
                required
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            <Field label="Password">
              <input
                className="input"
                type="password"
                required
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>

            {error && <div className="alert-error">{error}</div>}

            <button
              className="btn btn-primary btn-lg"
              type="submit"
              disabled={loading}
              style={{ justifyContent: "center", marginTop: 4 }}
            >
              {loading ? "Signing in…" : (
                <>Sign in <Icon name="arrowRight" /></>
              )}
            </button>
          </form>

          <div className="hair" style={{ margin: "22px 0 16px" }} />

          <div className="tight" style={{ fontSize: 11.5, textAlign: "center", marginBottom: 10 }}>
            Demo accounts
          </div>
          <div className="row-wrap" style={{ justifyContent: "center", gap: 6 }}>
            <button
              type="button"
              className="chip"
              onClick={() => { setEmail("dr@test.com"); setPassword("dr123"); }}
            >
              <Icon name="stethoscope" size={13} /> Doctor
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => { setEmail("patient@test.com"); setPassword("patient123"); }}
            >
              <Icon name="user" size={13} /> Patient
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => { setEmail("admin@test.com"); setPassword("admin123"); }}
            >
              <Icon name="shield" size={13} /> Admin
            </button>
          </div>

          <div className="login-foot">
            By signing in you agree to the Terms and Privacy Policy.
          </div>
        </div>
      </main>
    </div>
  );
}
