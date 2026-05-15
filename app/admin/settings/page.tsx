"use client";

import { useState } from "react";
import { toast } from "sonner";
import { RolePageShell } from "@/components/role-page-shell";
import { Field, Icon } from "@/components/ui";

type NotifSettings = {
  newPrescription: boolean;
  prescriptionConsumed: boolean;
  dailyDigest: boolean;
  weeklyReport: boolean;
};

type SystemSettings = {
  platformName: string;
  supportEmail: string;
  prescriptionCodePrefix: string;
  maxItemsPerPrescription: string;
};

export default function AdminSettingsPage() {
  return (
    <RolePageShell
      title="Settings"
      crumbs={["Admin"]}
      expectedRole="admin"
    >
      <AdminSettingsContent />
    </RolePageShell>
  );
}

function AdminSettingsContent() {
  const [notif, setNotif] = useState<NotifSettings>({
    newPrescription: true,
    prescriptionConsumed: true,
    dailyDigest: false,
    weeklyReport: true,
  });

  const [system, setSystem] = useState<SystemSettings>({
    platformName: "RxFlow",
    supportEmail: "support@rxflow.health",
    prescriptionCodePrefix: "RX",
    maxItemsPerPrescription: "20",
  });

  const [savingNotif, setSavingNotif] = useState(false);
  const [savingSystem, setSavingSystem] = useState(false);

  const saveNotif = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNotif(true);
    await new Promise((r) => setTimeout(r, 600));
    setSavingNotif(false);
    toast.success("Notification preferences saved.");
  };

  const saveSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSystem(true);
    await new Promise((r) => setTimeout(r, 600));
    setSavingSystem(false);
    toast.success("System settings saved.");
  };

  return (
    <div className="stack-lg" style={{ maxWidth: 680 }}>
      <div>
        <p className="page-sub">
          Configure platform-wide behaviour, notifications, and integrations.
        </p>
      </div>

      {/* System config */}
      <form className="card" onSubmit={saveSystem}>
        <div className="card-head">
          <h2 className="card-title">
            <Icon name="cog" size={15} /> Platform configuration
          </h2>
        </div>
        <div className="card-body stack">
          <div className="grid-2">
            <Field label="Platform name">
              <input
                className="input"
                value={system.platformName}
                onChange={(e) =>
                  setSystem((s) => ({ ...s, platformName: e.target.value }))
                }
              />
            </Field>
            <Field label="Support email">
              <input
                className="input"
                type="email"
                value={system.supportEmail}
                onChange={(e) =>
                  setSystem((s) => ({ ...s, supportEmail: e.target.value }))
                }
              />
            </Field>
            <Field
              label="Prescription code prefix"
              hint="Prepended to all new prescription codes."
            >
              <input
                className="input mono"
                value={system.prescriptionCodePrefix}
                maxLength={8}
                onChange={(e) =>
                  setSystem((s) => ({
                    ...s,
                    prescriptionCodePrefix: e.target.value.toUpperCase(),
                  }))
                }
              />
            </Field>
            <Field
              label="Max medications per prescription"
              hint="Doctors cannot exceed this limit."
            >
              <input
                className="input"
                type="number"
                min={1}
                max={100}
                value={system.maxItemsPerPrescription}
                onChange={(e) =>
                  setSystem((s) => ({
                    ...s,
                    maxItemsPerPrescription: e.target.value,
                  }))
                }
              />
            </Field>
          </div>
        </div>
        <div
          className="card-foot"
          style={{ justifyContent: "flex-end" }}
        >
          <button
            type="submit"
            className="btn btn-primary"
            disabled={savingSystem}
          >
            {savingSystem ? "Saving…" : <><Icon name="check" /> Save configuration</>}
          </button>
        </div>
      </form>

      {/* Notification preferences */}
      <form className="card" onSubmit={saveNotif}>
        <div className="card-head">
          <h2 className="card-title">
            <Icon name="bell" size={15} /> Notification preferences
          </h2>
        </div>
        <div className="card-body stack" style={{ gap: 0 }}>
          {(
            [
              {
                key: "newPrescription" as const,
                label: "New prescription issued",
                hint: "Alert when a doctor issues a new prescription.",
              },
              {
                key: "prescriptionConsumed" as const,
                label: "Prescription filled",
                hint: "Alert when a patient marks a prescription as consumed.",
              },
              {
                key: "dailyDigest" as const,
                label: "Daily activity digest",
                hint: "Summary email every morning at 8 AM.",
              },
              {
                key: "weeklyReport" as const,
                label: "Weekly analytics report",
                hint: "Full metrics report every Monday.",
              },
            ] as const
          ).map(({ key, label, hint }, i, arr) => (
            <div key={key}>
              <div
                className="row"
                style={{
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  padding: "14px 0",
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{label}</div>
                  <div className="tight" style={{ marginTop: 2 }}>
                    {hint}
                  </div>
                </div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={notif[key]}
                    onChange={(e) =>
                      setNotif((n) => ({ ...n, [key]: e.target.checked }))
                    }
                    style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--accent)" }}
                  />
                  <span className="tight" style={{ fontSize: 12 }}>
                    {notif[key] ? "On" : "Off"}
                  </span>
                </label>
              </div>
              {i < arr.length - 1 && <div className="hair" />}
            </div>
          ))}
        </div>
        <div
          className="card-foot"
          style={{ justifyContent: "flex-end" }}
        >
          <button
            type="submit"
            className="btn btn-primary"
            disabled={savingNotif}
          >
            {savingNotif ? "Saving…" : <><Icon name="check" /> Save preferences</>}
          </button>
        </div>
      </form>

      {/* Danger zone */}
      <div
        className="card"
        style={{
          borderColor: "color-mix(in srgb, var(--status-expired) 30%, transparent)",
        }}
      >
        <div className="card-head">
          <h2 className="card-title" style={{ color: "var(--status-expired)" }}>
            <Icon name="shield" size={15} /> Danger zone
          </h2>
        </div>
        <div className="card-body stack" style={{ gap: 0 }}>
          {[
            {
              label: "Export all data",
              hint: "Download a full CSV export of all prescriptions and users.",
              action: "Export",
              icon: "download",
            },
            {
              label: "Clear audit log",
              hint: "Permanently delete all audit log entries older than 1 year.",
              action: "Clear",
              icon: "trash",
            },
          ].map(({ label, hint, action, icon }, i, arr) => (
            <div key={label}>
              <div
                className="row"
                style={{
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 0",
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{label}</div>
                  <div className="tight" style={{ marginTop: 2 }}>{hint}</div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost btn-danger"
                  onClick={() =>
                    toast.info(`${action} is not yet available in this environment.`)
                  }
                >
                  <Icon name={icon} /> {action}
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
