"use client";

import { useEffect, useState } from "react";
import { RolePageShell } from "@/components/role-page-shell";
import { Avatar, Icon, fmtDate } from "@/components/ui";
import { ApiError, apiRequest } from "@/lib/http-client";
import { SessionUser } from "@/lib/auth-types";
import { toast } from "sonner";

export default function PatientProfilePage() {
  return (
    <RolePageShell title="Profile" crumbs={["Patient"]} expectedRole="patient">
      <PatientProfileContent />
    </RolePageShell>
  );
}

function PatientProfileContent() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<SessionUser>("/auth/profile", { method: "GET" }, { auth: true })
      .then(setUser)
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : "Could not load profile.",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="empty"><p>Loading profile…</p></div>;
  }

  if (error) {
    return <div className="alert-error">{error}</div>;
  }

  return (
    <div className="stack-lg" style={{ maxWidth: 640 }}>
      <div>
        <p className="page-sub">
          Your personal information and account details.
        </p>
      </div>

      {/* Identity card */}
      <div className="card">
        <div
          className="card-body"
          style={{ display: "flex", gap: 20, alignItems: "center" }}
        >
          <Avatar name={user?.name ?? ""} size="xl" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{user?.name}</div>
            <div className="tight" style={{ marginTop: 2 }}>
              {user?.email}
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                marginTop: 8,
                background: "var(--accent-soft)",
                color: "var(--accent-strong)",
                borderRadius: 999,
                padding: "3px 10px",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <Icon name="user" size={12} /> Patient
            </div>
          </div>
          <div
            style={{
              textAlign: "right",
              color: "var(--ink-3)",
              fontSize: 12,
            }}
          >
            <div>Member since</div>
            <div
              style={{
                fontWeight: 600,
                color: "var(--ink-2)",
                marginTop: 2,
              }}
            >
              {user?.createdAt ? fmtDate(user.createdAt) : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Account details */}
      <div className="card">
        <div className="card-head">
          <h2 className="card-title">Account details</h2>
        </div>
        <div className="card-body stack" style={{ gap: 0 }}>
          {[
            { label: "Full name",      value: user?.name  ?? "—" },
            { label: "Email address",  value: user?.email ?? "—" },
            { label: "Role",           value: "Patient"           },
            { label: "Account ID",     value: user?.id    ?? "—" },
          ].map(({ label, value }, i, arr) => (
            <div key={label}>
              <div
                className="row"
                style={{
                  justifyContent: "space-between",
                  padding: "13px 0",
                  gap: 16,
                }}
              >
                <span
                  className="tight"
                  style={{ fontSize: 12.5, minWidth: 130 }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontWeight: 500,
                    textAlign: "right",
                    fontFamily:
                      label === "Account ID" ? "var(--font-mono)" : undefined,
                    fontSize: label === "Account ID" ? 12 : undefined,
                    color:
                      label === "Account ID"
                        ? "var(--ink-3)"
                        : "var(--ink)",
                  }}
                >
                  {value}
                </span>
              </div>
              {i < arr.length - 1 && <div className="hair" />}
            </div>
          ))}
        </div>
        <div
          className="card-foot"
          style={{ color: "var(--ink-4)", fontSize: 12 }}
        >
          To update your name or email, contact your doctor or clinic admin.
        </div>
      </div>

      {/* Security section */}
      <div className="card">
        <div className="card-head">
          <h2 className="card-title">Security</h2>
        </div>
        <div className="card-body stack" style={{ gap: 0 }}>
          {[
            {
              label: "Password",
              hint: "Contact support to reset your password.",
              action: "Reset",
              icon: "lock",
            },
            {
              label: "Active sessions",
              hint: "1 device currently signed in.",
              action: "Manage",
              icon: "shieldCheck",
            },
          ].map(({ label, hint, action, icon }, i, arr) => (
            <div key={label}>
              <div
                className="row"
                style={{
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "13px 0",
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{label}</div>
                  <div className="tight" style={{ marginTop: 2 }}>
                    {hint}
                  </div>
                </div>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() =>
                    toast.info("Please contact support for account changes.")
                  }
                >
                  <Icon name={icon} size={13} /> {action}
                </button>
              </div>
              {i < arr.length - 1 && <div className="hair" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
