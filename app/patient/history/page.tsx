"use client";

import { useEffect, useState } from "react";
import { RolePageShell } from "@/components/role-page-shell";
import { Avatar, Badge, Icon, fmtDate, fmtDateTime } from "@/components/ui";
import { ApiError, apiRequest } from "@/lib/http-client";
import { PaginatedResponse, Prescription } from "@/lib/prescriptions";

export default function PatientHistoryPage() {
  return (
    <RolePageShell
      title="History"
      crumbs={["Patient"]}
      expectedRole="patient"
    >
      <PatientHistoryContent />
    </RolePageShell>
  );
}

function PatientHistoryContent() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<PaginatedResponse<Prescription> | Prescription[]>(
      "/me/prescriptions?status=consumed",
      { method: "GET" },
      { auth: true },
    )
      .then((data) => {
        setPrescriptions(Array.isArray(data) ? data : data.data);
      })
      .catch((err) => {
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not load prescription history.",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="stack-lg">
      <div>
        <p className="page-sub">
          A complete record of every prescription you have filled.
        </p>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <div className="empty">
          <p>Loading history…</p>
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="card">
          <div className="empty" style={{ padding: "48px 24px" }}>
            <div className="empty-icon">
              <Icon name="clock" size={26} />
            </div>
            <h3>No history yet</h3>
            <p>Prescriptions you mark as picked up will appear here.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary strip */}
          <div className="grid-4" style={{ gap: 12 }}>
            <div className="card kpi">
              <div className="kpi-label">Total filled</div>
              <div className="kpi-value">{prescriptions.length}</div>
            </div>
            <div className="card kpi">
              <div className="kpi-label">Medications</div>
              <div className="kpi-value">
                {prescriptions.reduce((s, p) => s + p.items.length, 0)}
              </div>
            </div>
            <div className="card kpi">
              <div className="kpi-label">Doctors seen</div>
              <div className="kpi-value">
                {new Set(prescriptions.map((p) => p.author.id)).size}
              </div>
            </div>
            <div className="card kpi">
              <div className="kpi-label">First prescription</div>
              <div className="kpi-value" style={{ fontSize: 16 }}>
                {fmtDate(
                  [...prescriptions].sort(
                    (a, b) =>
                      new Date(a.createdAt).getTime() -
                      new Date(b.createdAt).getTime(),
                  )[0]?.createdAt,
                )}
              </div>
            </div>
          </div>

          {/* Timeline list */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div className="card-head">
              <h2 className="card-title">Filled prescriptions</h2>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Medications</th>
                  <th>Doctor</th>
                  <th>Issued</th>
                  <th>Filled</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[...prescriptions]
                  .sort(
                    (a, b) =>
                      new Date(b.consumedAt ?? b.createdAt).getTime() -
                      new Date(a.consumedAt ?? a.createdAt).getTime(),
                  )
                  .map((p) => (
                    <tr key={p.id}>
                      <td>
                        <span className="mono" style={{ fontWeight: 600 }}>
                          {p.code}
                        </span>
                      </td>
                      <td>
                        {p.items.length > 0 ? (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 2,
                            }}
                          >
                            <span style={{ fontWeight: 500 }}>
                              {p.items[0].name}
                              {p.items[0].dosage && (
                                <span
                                  className="tight"
                                  style={{ fontWeight: 400, marginLeft: 4 }}
                                >
                                  {p.items[0].dosage}
                                </span>
                              )}
                            </span>
                            {p.items.length > 1 && (
                              <span className="tight">
                                + {p.items.length - 1} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="tight">—</span>
                        )}
                      </td>
                      <td>
                        <div className="row" style={{ gap: 8 }}>
                          <Avatar name={p.author.user.name} />
                          <span style={{ fontWeight: 500 }}>
                            {p.author.user.name}
                          </span>
                        </div>
                      </td>
                      <td className="tight">{fmtDate(p.createdAt)}</td>
                      <td className="tight">
                        {p.consumedAt ? fmtDateTime(p.consumedAt) : "—"}
                      </td>
                      <td>
                        <Badge status={p.status} dot />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <div className="card-foot">
              <span>
                {prescriptions.length} record
                {prescriptions.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
