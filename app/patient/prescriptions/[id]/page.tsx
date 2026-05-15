"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RolePageShell } from "@/components/role-page-shell";
import { Avatar, Badge, Icon, fmtDate, fmtDateTime, relTime } from "@/components/ui";
import { ApiError, apiRequest } from "@/lib/http-client";
import { Prescription } from "@/lib/prescriptions";

export default function PatientPrescriptionDetailPage() {
  return (
    <RolePageShell
      title="Prescription detail"
      crumbs={["Patient", "My prescriptions"]}
      expectedRole="patient"
    >
      <PatientPrescriptionDetailContent />
    </RolePageShell>
  );
}

function PatientPrescriptionDetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    apiRequest<Prescription>(`/me/prescriptions/${id}`, { method: "GET" }, { auth: true })
      .then((data) => setPrescription(data))
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Could not load prescription detail.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="empty"><p>Loading prescription…</p></div>;
  }

  if (error && !prescription) {
    return <div className="alert-error">{error}</div>;
  }

  if (!prescription) {
    return (
      <div className="card">
        <div className="empty">
          <div className="empty-icon"><Icon name="inbox" size={26} /></div>
          <h3>Prescription not found</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="stack-lg" style={{ maxWidth: 880 }}>
      {/* Header */}
      <div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => router.push("/patient/prescriptions")}
          style={{ marginBottom: 10, paddingLeft: 0 }}
        >
          <Icon name="arrowLeft" /> Back
        </button>
        <div className="row" style={{ gap: 12, alignItems: "center", marginBottom: 8 }}>
          <h2 className="page-h1 mono" style={{ fontSize: 26, marginBottom: 0 }}>
            {prescription.code}
          </h2>
          <Badge status={prescription.status} dot />
        </div>
        <p className="page-sub" style={{ margin: 0 }}>
          Prescribed by {prescription.author.user.name} on {fmtDateTime(prescription.createdAt)}
        </p>
      </div>

      {/* Pending callout */}
      {prescription.status === "pending" && (
        <div
          className="card"
          style={{
            background: "var(--accent-soft)",
            borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)",
          }}
        >
          <div className="card-body row-wrap" style={{ gap: 14 }}>
            <div
              className="empty-icon"
              style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
            >
              <Icon name="pill" size={22} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 600, color: "var(--accent-strong)", marginBottom: 2 }}>
                Ready to fill
              </div>
              <div className="tight" style={{ color: "var(--accent-strong)", opacity: 0.85 }}>
                Show this code or QR at any participating pharmacy.
              </div>
            </div>
            <button className="btn">
              <Icon name="qr" /> Show QR
            </button>
          </div>
        </div>
      )}

      {/* Medications */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div className="card-head">
          <h2 className="card-title">Medications · {prescription.items.length}</h2>
        </div>
        <div className="card-body stack">
          {prescription.items.map((item) => (
            <div
              key={item.id}
              style={{
                padding: 14,
                border: "1px solid var(--hairline)",
                borderRadius: "var(--radius-lg)",
                background: "var(--bg-sunk)",
              }}
            >
              <div className="row" style={{ gap: 12, marginBottom: 6 }}>
                <div
                  className="empty-icon"
                  style={{ width: 38, height: 38, borderRadius: 10 }}
                >
                  <Icon name="pill" size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{item.name}</div>
                  <div className="tight">
                    {item.dosage || "—"} · Qty {item.quantity ?? "—"}
                  </div>
                </div>
              </div>
              {item.instructions && (
                <div
                  style={{
                    color: "var(--ink-2)",
                    fontSize: 13.5,
                    marginTop: 6,
                    paddingLeft: 50,
                  }}
                >
                  <strong style={{ color: "var(--ink-3)", fontWeight: 500, marginRight: 6 }}>
                    Directions:
                  </strong>
                  {item.instructions}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Doctor + activity */}
      <div className="grid-2">
        <div className="card">
          <div className="card-body">
            <div
              className="tight"
              style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}
            >
              Prescribed by
            </div>
            <div className="row" style={{ gap: 12 }}>
              <Avatar name={prescription.author.user.name} size="lg" />
              <div>
                <div style={{ fontWeight: 600 }}>{prescription.author.user.name}</div>
                <div className="tight">{prescription.author.user.email}</div>
              </div>
            </div>
            <div className="hair" style={{ margin: "14px 0" }} />
            <button className="btn btn-sm" style={{ width: "100%", justifyContent: "center" }}>
              <Icon name="mail" /> Message doctor
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div
              className="tight"
              style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}
            >
              Activity
            </div>
            <div className="timeline">
              <div className="tl-item">
                <div className="tl-dot accent"><Icon name="filePlus" size={14} /></div>
                <div>
                  <div className="tl-meta">
                    <strong>Issued</strong>
                    <time>{relTime(prescription.createdAt)}</time>
                  </div>
                  <div className="tl-body">by {prescription.author.user.name}</div>
                </div>
              </div>

              {prescription.consumedAt ? (
                <div className="tl-item">
                  <div className="tl-dot success"><Icon name="check" size={14} /></div>
                  <div>
                    <div className="tl-meta">
                      <strong>Picked up</strong>
                      <time>{relTime(prescription.consumedAt)}</time>
                    </div>
                    <div className="tl-body">Patient confirmed</div>
                  </div>
                </div>
              ) : (
                <div className="tl-item">
                  <div className="tl-dot"><Icon name="clock" size={14} /></div>
                  <div>
                    <div className="tl-meta">
                      <strong>Pickup pending</strong>
                      <time>—</time>
                    </div>
                    <div className="tl-body">Awaiting pharmacy fill</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {prescription.notes && (
        <div className="card">
          <div className="card-head"><h2 className="card-title">Notes from your doctor</h2></div>
          <div className="card-body" style={{ color: "var(--ink-2)" }}>{prescription.notes}</div>
        </div>
      )}
    </div>
  );
}
