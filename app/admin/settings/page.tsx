"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RolePageShell } from "@/components/role-page-shell";
import { Field, Icon } from "@/components/ui";
import { ApiError, apiRequest } from "@/lib/http-client";

type Settings = {
  platformName: string;
  supportEmail: string;
  prescriptionCodePrefix: string;
  maxItemsPerPrescription: number;
  notifNewPrescription: boolean;
  notifConsumed: boolean;
  notifDailyDigest: boolean;
  notifWeeklyReport: boolean;
};

const DEFAULTS: Settings = {
  platformName: "RxFlow",
  supportEmail: "support@rxflow.health",
  prescriptionCodePrefix: "RX",
  maxItemsPerPrescription: 20,
  notifNewPrescription: true,
  notifConsumed: true,
  notifDailyDigest: false,
  notifWeeklyReport: true,
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
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [savingSystem, setSavingSystem] = useState(false);
  const [savingNotif, setSavingNotif] = useState(false);

  useEffect(() => {
    apiRequest<Settings>("/admin/settings", { method: "GET" }, { auth: true })
      .then((data) => setSettings((prev) => ({ ...prev, ...data })))
      .catch(() => toast.error("Could not load settings."))
      .finally(() => setLoading(false));
  }, []);

  const saveSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSystem(true);
    try {
      const updated = await apiRequest<Settings>(
        "/admin/settings/system",
        {
          method: "PATCH",
          body: JSON.stringify({
            platformName: settings.platformName,
            supportEmail: settings.supportEmail,
            prescriptionCodePrefix: settings.prescriptionCodePrefix,
            maxItemsPerPrescription: Number(settings.maxItemsPerPrescription),
          }),
        },
        { auth: true },
      );
      setSettings((prev) => ({ ...prev, ...updated }));
      toast.success("System settings saved.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save settings.");
    } finally {
      setSavingSystem(false);
    }
  };

  const saveNotif = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNotif(true);
    try {
      const updated = await apiRequest<Settings>(
        "/admin/settings/notifications",
        {
          method: "PATCH",
          body: JSON.stringify({
            notifNewPrescription: settings.notifNewPrescription,
            notifConsumed: settings.notifConsumed,
            notifDailyDigest: settings.notifDailyDigest,
            notifWeeklyReport: settings.notifWeeklyReport,
          }),
        },
        { auth: true },
      );
      setSettings((prev) => ({ ...prev, ...updated }));
      toast.success("Notification preferences saved.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save preferences.");
    } finally {
      setSavingNotif(false);
    }
  };

  if (loading) return <div className="empty"><p>Loading settings…</p></div>;

  return (
    <div className="stack-lg">
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
                value={settings.platformName}
                onChange={(e) => setSettings((s) => ({ ...s, platformName: e.target.value }))}
              />
            </Field>
            <Field label="Support email">
              <input
                className="input"
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings((s) => ({ ...s, supportEmail: e.target.value }))}
              />
            </Field>
            <Field label="Prescription code prefix" hint="Prepended to all new prescription codes.">
              <input
                className="input mono"
                value={settings.prescriptionCodePrefix}
                maxLength={8}
                onChange={(e) => setSettings((s) => ({ ...s, prescriptionCodePrefix: e.target.value.toUpperCase() }))}
              />
            </Field>
            <Field label="Max medications per prescription" hint="Doctors cannot exceed this limit.">
              <input
                className="input"
                type="number"
                min={1}
                max={100}
                value={settings.maxItemsPerPrescription}
                onChange={(e) => setSettings((s) => ({ ...s, maxItemsPerPrescription: Number(e.target.value) }))}
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
                key: "notifNewPrescription" as const,
                label: "New prescription issued",
                hint: "Alert when a doctor issues a new prescription.",
              },
              {
                key: "notifConsumed" as const,
                label: "Prescription filled",
                hint: "Alert when a patient marks a prescription as consumed.",
              },
              {
                key: "notifDailyDigest" as const,
                label: "Daily activity digest",
                hint: "Summary email every morning at 8 AM.",
              },
              {
                key: "notifWeeklyReport" as const,
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
                    checked={settings[key]}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, [key]: e.target.checked }))
                    }
                    style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--accent)" }}
                  />
                  <span className="tight" style={{ fontSize: 12 }}>
                    {settings[key] ? "On" : "Off"}
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
