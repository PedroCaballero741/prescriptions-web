import { ReactNode } from "react";

/* ── Icons ──────────────────────────────────────────────── */

const ICONS: Record<string, ReactNode> = {
  pill: <><path d="M10.5 20.5a7 7 0 0 1-9.9-9.9l9.9-9.9a7 7 0 0 1 9.9 9.9z"/><path d="M8.5 8.5l7 7"/></>,
  fileText: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></>,
  filePlus: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="12" x2="12" y2="18"/><line x1="9" y1="15" x2="15" y2="15"/></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
  search: <><circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16.65" y2="16.65"/></>,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  users: <><circle cx="9" cy="8" r="4"/><path d="M3 21a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="3"/><path d="M22 21a4 4 0 0 0-7-2.6"/></>,
  stethoscope: <><path d="M6 2v6a4 4 0 0 0 8 0V2"/><path d="M6 2H4"/><path d="M14 2h2"/><path d="M10 18a4 4 0 0 0 8 0v-6"/><circle cx="18" cy="11" r="2"/></>,
  shield: <><path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5z"/></>,
  shieldCheck: <><path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5z"/><polyline points="9 12 11 14 15 10"/></>,
  chart: <><line x1="3" y1="20" x2="21" y2="20"/><rect x="6" y="12" width="3" height="8"/><rect x="11" y="7" width="3" height="13"/><rect x="16" y="14" width="3" height="6"/></>,
  home: <><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></>,
  cog: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  check: <><polyline points="20 6 9 17 4 12"/></>,
  arrowRight: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
  arrowLeft: <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></>,
  share: <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></>,
  mail: <><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22 6 12 13 2 6"/></>,
  lock: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
  trend: <><polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></>,
  inbox: <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/></>,
  qr: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3z"/><path d="M19 14h2"/><path d="M14 19h3"/><path d="M19 19v2"/></>,
};

export function Icon({
  name,
  size = 16,
  className = "",
  strokeWidth = 1.7,
}: {
  name: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  const node = ICONS[name];
  if (!node) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {node}
    </svg>
  );
}

/* ── Avatar ─────────────────────────────────────────────── */

export function Avatar({
  name,
  size = "",
}: {
  name: string;
  size?: "" | "lg" | "xl";
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const cls = "avatar" + (size === "lg" ? " avatar-lg" : size === "xl" ? " avatar-xl" : "");
  return (
    <div className={cls} aria-label={name}>
      {initials}
    </div>
  );
}

/* ── Badge ──────────────────────────────────────────────── */

export function Badge({
  status,
  dot = false,
  children,
}: {
  status?: string;
  dot?: boolean;
  children?: ReactNode;
}) {
  const cls = status ? `badge badge-${status}` : "badge";
  const label =
    children ??
    (status ? status[0].toUpperCase() + status.slice(1) : null);
  return (
    <span className={cls}>
      {dot && <span className="badge-dot" />}
      {label}
    </span>
  );
}

/* ── Field ──────────────────────────────────────────────── */

export function Field({
  label,
  hint,
  error,
  full = false,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  full?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="field" style={full ? { gridColumn: "1 / -1" } : {}}>
      <span className="field-lbl">{label}</span>
      {children}
      {hint && !error && (
        <span className="tight" style={{ fontSize: 11.5 }}>
          {hint}
        </span>
      )}
      {error && (
        <span style={{ color: "var(--status-expired)", fontSize: 11.5 }}>
          {error}
        </span>
      )}
    </label>
  );
}

/* ── Date helpers ───────────────────────────────────────── */

export function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function fmtDateTime(s: string | null | undefined): string {
  if (!s) return "—";
  const d = new Date(s);
  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

export function relTime(s: string | null | undefined): string {
  if (!s) return "—";
  const m = Math.round((Date.now() - new Date(s).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days < 30) return `${days}d ago`;
  return fmtDate(s);
}
