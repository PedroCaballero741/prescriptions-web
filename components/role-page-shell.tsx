"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ApiError, apiRequest } from "@/lib/http-client";
import { isUserRole, SessionUser, UserRole } from "@/lib/auth-types";
import { clearSession, getDefaultRouteForRole, getSession } from "@/lib/session";
import { Avatar, Icon } from "@/components/ui";

/* ── Nav config ─────────────────────────────────────────── */

const ROLE_NAV: Record<
  UserRole,
  Array<{ key: string; label: string; icon: string; route: string; badge?: string }>
> = {
  doctor: [
    { key: "doctor.prescriptions", label: "Prescriptions", icon: "fileText", route: "/doctor/prescriptions" },
    { key: "doctor.patients",      label: "Patients",      icon: "users",    route: "/doctor/patients" },
    { key: "doctor.schedule",      label: "Schedule",      icon: "calendar", route: "/doctor/schedule" },
  ],
  patient: [
    { key: "patient.prescriptions", label: "My prescriptions", icon: "fileText", route: "/patient/prescriptions" },
    { key: "patient.history",        label: "History",          icon: "clock",    route: "/patient/history" },
    { key: "patient.profile",        label: "Profile",          icon: "user",     route: "/patient/profile" },
  ],
  admin: [
    { key: "admin.dashboard",      label: "Dashboard",     icon: "chart",    route: "/admin" },
    { key: "admin.prescriptions",  label: "Prescriptions", icon: "fileText", route: "/admin/prescriptions" },
    { key: "admin.users",          label: "Users",         icon: "users",    route: "/admin/users" },
    { key: "admin.settings",       label: "Settings",      icon: "cog",      route: "/admin/settings" },
  ],
};

const ROLE_LABEL: Record<UserRole, string> = {
  doctor:  "Clinician console",
  patient: "Patient portal",
  admin:   "Admin console",
};

/* ── Sidebar ─────────────────────────────────────────────── */

function Sidebar({
  role,
  user,
  onLogout,
}: {
  role: UserRole;
  user: SessionUser;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const items = ROLE_NAV[role] ?? [];

  return (
    <aside className="side">
      <div className="side-brand">
        <div className="side-brand-mark">Rx</div>
        <div>
          <div className="side-brand-name">RxFlow</div>
          <div className="tight" style={{ fontSize: 11, lineHeight: 1, marginTop: 2 }}>
            {ROLE_LABEL[role]}
          </div>
        </div>
      </div>

      <div className="side-section">Workspace</div>
      <nav className="side-nav">
        {items.map((item) => {
          const isActive =
            pathname === item.route ||
            (item.route !== "/admin" && pathname.startsWith(item.route));
          return (
            <Link
              key={item.key}
              href={item.route}
              className={"side-link" + (isActive ? " active" : "")}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.badge && <span className="pill">{item.badge}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="side-foot">
        <div className="row" style={{ gap: 10 }}>
          <Avatar name={user.name} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user.name}
            </div>
            <div
              className="tight"
              style={{
                fontSize: 11.5,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user.email}
            </div>
          </div>
          <button className="icon-btn" title="Sign out" onClick={onLogout}>
            <Icon name="logout" />
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ── Topbar ──────────────────────────────────────────────── */

function Topbar({
  title,
  crumbs = [],
  actions,
}: {
  title: string;
  crumbs?: string[];
  actions?: ReactNode;
}) {
  return (
    <header className="top">
      <div style={{ minWidth: 0 }}>
        {crumbs.length > 0 && (
          <div className="top-crumb">
            {crumbs.map((c, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {i > 0 && <span className="top-crumb-sep">›</span>}
                {c}
              </span>
            ))}
          </div>
        )}
        <h1 className="top-title">{title}</h1>
      </div>

      <div className="top-actions">
        {actions}
        <button className="icon-btn" aria-label="Notifications">
          <Icon name="bell" />
        </button>
      </div>
    </header>
  );
}

/* ── Shell ───────────────────────────────────────────────── */

type RolePageShellProps = {
  title: string;
  crumbs?: string[];
  expectedRole: UserRole;
  actions?: ReactNode;
  children: ReactNode;
};

export function RolePageShell({
  title,
  crumbs = [],
  expectedRole,
  actions,
  children,
}: RolePageShellProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<SessionUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onLogout = () => {
    clearSession();
    router.replace("/login");
  };

  useEffect(() => {
    const session = getSession();

    if (!session || !isUserRole(session.user.role)) {
      clearSession();
      router.replace("/login");
      return;
    }

    apiRequest<SessionUser>("/auth/profile", { method: "GET" }, { auth: true })
      .then((user) => {
        if (user.role !== expectedRole) {
          router.replace(getDefaultRouteForRole(user.role));
          return;
        }
        setProfile(user);
      })
      .catch((requestError) => {
        if (requestError instanceof ApiError && requestError.status === 401) {
          clearSession();
          router.replace("/login");
          return;
        }
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Could not load your profile.",
        );
      });
  }, [expectedRole, router]);

  if (!profile && !error) {
    return (
      <div className="app">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "var(--ink-3)", fontSize: 13 }}>
          Loading…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24 }}>
        <div className="alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar role={expectedRole} user={profile!} onLogout={onLogout} />
      <div style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Topbar title={title} crumbs={crumbs} actions={actions} />
        <div className="page">{children}</div>
      </div>
    </div>
  );
}
