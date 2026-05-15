"use client";

import { RolePageShell } from "@/components/role-page-shell";
import { Icon } from "@/components/ui";

export default function DoctorSchedulePage() {
  return (
    <RolePageShell title="Schedule" crumbs={["Doctor"]} expectedRole="doctor">
      <DoctorScheduleContent />
    </RolePageShell>
  );
}

const UPCOMING = [
  { time: "9:00 AM",  label: "Morning rounds",      type: "Checkup",      color: "var(--accent)" },
  { time: "11:30 AM", label: "Consultation block",   type: "Consultation", color: "var(--status-pending)" },
  { time: "2:00 PM",  label: "Follow-up appointments", type: "Follow-up",  color: "var(--status-consumed)" },
];

function DoctorScheduleContent() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="stack-lg" style={{ maxWidth: 720 }}>
      <div>
        <p className="page-sub">Your appointments and consultation blocks.</p>
      </div>

      {/* Coming-soon banner */}
      <div
        className="card"
        style={{
          background: "var(--accent-soft)",
          borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)",
        }}
      >
        <div
          className="card-body row-wrap"
          style={{ gap: 16, alignItems: "center" }}
        >
          <div
            className="empty-icon"
            style={{
              background: "var(--accent)",
              color: "var(--accent-fg)",
              width: 44,
              height: 44,
              flexShrink: 0,
            }}
          >
            <Icon name="calendar" size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontWeight: 600,
                color: "var(--accent-strong)",
                marginBottom: 2,
              }}
            >
              Scheduling is coming soon
            </div>
            <div
              className="tight"
              style={{ color: "var(--accent-strong)", opacity: 0.85 }}
            >
              Full calendar integration with appointment booking is being rolled
              out. You&apos;ll be notified when it&apos;s available for your
              account.
            </div>
          </div>
        </div>
      </div>

      {/* Today's date header */}
      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
            marginBottom: 10,
            paddingLeft: 2,
          }}
        >
          Today · {today}
        </div>

        <div className="stack" style={{ gap: 8 }}>
          {UPCOMING.map((slot) => (
            <div className="card" key={slot.time}>
              <div
                className="card-body"
                style={{
                  display: "grid",
                  gridTemplateColumns: "56px 1fr auto",
                  gap: 16,
                  alignItems: "center",
                  opacity: 0.45,
                }}
              >
                <div
                  style={{
                    textAlign: "center",
                    borderRight: "1px solid var(--hairline)",
                    paddingRight: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: slot.color,
                      lineHeight: 1.2,
                    }}
                  >
                    {slot.time}
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{slot.label}</div>
                  <div
                    className="tight"
                    style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}
                  >
                    <Icon name="calendar" size={12} />
                    {slot.type}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    color: "var(--ink-4)",
                  }}
                >
                  Preview
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
