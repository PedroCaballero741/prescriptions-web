"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RolePageShell } from "@/components/role-page-shell";
import { Avatar, Badge, Icon, fmtDate, fmtDateTime, relTime } from "@/components/ui";
import { ApiError, apiRequest, apiRequestRaw } from "@/lib/http-client";
import { Prescription } from "@/lib/prescriptions";

export default function DoctorPrescriptionDetailPage() {
  return (
    <RolePageShell
      title="Prescription detail"
      crumbs={["Doctor", "Prescriptions"]}
      expectedRole="doctor"
    >
      <DoctorPrescriptionDetailContent />
    </RolePageShell>
  );
}

function DoctorPrescriptionDetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiRequest<Prescription>(`/prescriptions/${id}`, { method: "GET" }, { auth: true })
      .then((data) => setPrescription(data))
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Could not load prescription detail.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const downloadPdf = async () => {
    if (!prescription) return;
    setDownloading(true);
    setError(null);
    try {
      const res = await apiRequestRaw(
        `/prescriptions/${prescription.id}/pdf`,
        { method: "GET" },
        { auth: true },
      );
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const cd = res.headers.get("Content-Disposition") ?? "";
      const match = cd.match(/filename="?([^"]+)"?/i);
      const filename = match?.[1] ?? `prescription-${prescription.code}.pdf`;
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      toast.success("PDF downloaded.");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not download PDF.";
      setError(message);
      toast.error(message);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="empty">
        <p>Loading prescription…</p>
      </div>
    );
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

  const totalQty = prescription.items.reduce((s, i) => s + (i.quantity ?? 0), 0);

  return (
    <div className="stack-lg">
      {/* Header */}
      <div className="row-wrap" style={{ justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div style={{ minWidth: 0 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => router.push("/doctor/prescriptions")}
            style={{ marginBottom: 10, paddingLeft: 0 }}
          >
            <Icon name="arrowLeft" /> Back to prescriptions
          </button>
          <div className="row" style={{ gap: 12, alignItems: "center", marginBottom: 8 }}>
            <h2 className="page-h1 mono" style={{ fontSize: 26, marginBottom: 0 }}>
              {prescription.code}
            </h2>
            <Badge status={prescription.status} dot />
          </div>
          <p className="page-sub" style={{ margin: 0 }}>
            Issued {fmtDateTime(prescription.createdAt)}
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button
            className="btn btn-primary"
            onClick={downloadPdf}
            disabled={downloading}
          >
            <Icon name="download" /> {downloading ? "Preparing…" : "Download PDF"}
          </button>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="rx-detail-grid">
        {/* Main column */}
        <div className="stack-lg" style={{ minWidth: 0 }}>
          {/* Items table */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div className="card-head">
              <h2 className="card-title">Medications · {prescription.items.length}</h2>
              <span className="tight">Total qty: {totalQty}</span>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Medication</th>
                  <th>Dosage</th>
                  <th className="num">Qty</th>
                  <th>Instructions</th>
                </tr>
              </thead>
              <tbody>
                {prescription.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="row" style={{ gap: 10 }}>
                        <div
                          className="empty-icon"
                          style={{ width: 32, height: 32, borderRadius: 8 }}
                        >
                          <Icon name="pill" size={16} />
                        </div>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                      </div>
                    </td>
                    <td><span className="mono">{item.dosage || "—"}</span></td>
                    <td className="num mono">{item.quantity ?? "—"}</td>
                    <td className="tight" style={{ maxWidth: 320 }}>{item.instructions || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {prescription.notes && (
            <div className="card">
              <div className="card-head"><h2 className="card-title">Notes for patient</h2></div>
              <div className="card-body" style={{ color: "var(--ink-2)" }}>{prescription.notes}</div>
            </div>
          )}
        </div>

        {/* Side rail */}
        <div className="stack" style={{ position: "sticky", top: 92 }}>
          {/* Patient card */}
          <div className="card">
            <div className="card-body">
              <div
                className="tight"
                style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}
              >
                Patient
              </div>
              <div className="row" style={{ gap: 12 }}>
                <Avatar name={prescription.patient.user.name} size="lg" />
                <div>
                  <div style={{ fontWeight: 600 }}>{prescription.patient.user.name}</div>
                  <div className="tight">{prescription.patient.user.email}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity timeline */}
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
                        <strong>Consumed</strong>
                        <time>{relTime(prescription.consumedAt)}</time>
                      </div>
                      <div className="tl-body">Patient confirmed fill</div>
                    </div>
                  </div>
                ) : (
                  <div className="tl-item">
                    <div className="tl-dot"><Icon name="clock" size={14} /></div>
                    <div>
                      <div className="tl-meta">
                        <strong>Awaiting fill</strong>
                        <time>—</time>
                      </div>
                      <div className="tl-body">Pending patient pickup</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
