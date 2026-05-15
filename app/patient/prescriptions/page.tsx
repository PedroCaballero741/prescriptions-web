"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { RolePageShell } from "@/components/role-page-shell";
import { Badge, Icon, fmtDate } from "@/components/ui";
import { ApiError, apiRequest, apiRequestRaw } from "@/lib/http-client";
import { PaginatedResponse, Prescription } from "@/lib/prescriptions";

export default function PatientPrescriptionsPage() {
  return (
    <RolePageShell
      title="My prescriptions"
      crumbs={["Patient"]}
      expectedRole="patient"
    >
      <Suspense
        fallback={
          <div className="empty">
            <p>Loading…</p>
          </div>
        }
      >
        <PatientPrescriptionsContent />
      </Suspense>
    </RolePageShell>
  );
}

function PatientPrescriptionsContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [response, setResponse] = useState<PaginatedResponse<Prescription> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [reloadSignal, setReloadSignal] = useState(0);

  const status = searchParams.get("status") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20") || 20));

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    params.set("page", String(page));
    params.set("limit", String(limit));
    const query = params.toString();

    apiRequest<PaginatedResponse<Prescription>>(
      `/me/prescriptions?${query}`,
      { method: "GET" },
      { auth: true },
    )
      .then((data) => setResponse(data))
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Could not load prescriptions.");
      })
      .finally(() => setLoading(false));
  }, [status, page, limit, reloadSignal]);

  const pushQuery = (next: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const s = next.status !== undefined ? next.status : status;
    const pg = next.page !== undefined ? next.page : String(page);
    const lim = next.limit !== undefined ? next.limit : String(limit);
    if (s) p.set("status", s);
    if (pg && pg !== "1") p.set("page", pg);
    if (lim && lim !== "20") p.set("limit", lim);
    const q = p.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  };

  const applyStatus = (s: string) => {
    pushQuery({ status: s || undefined, page: "1" });
  };

  const goPage = (n: number) => {
    pushQuery({ page: String(Math.max(1, n)) });
  };

  const onLimitChange = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = String(fd.get("limit") ?? "20");
    pushQuery({ page: "1", limit: v });
  };

  const consumePrescription = async (id: string) => {
    setActionId(id);
    setError(null);
    try {
      await apiRequest(`/prescriptions/${id}/consume`, { method: "PUT" }, { auth: true });
      toast.success("Prescription marked as consumed.");
      setLoading(true);
      setReloadSignal((n) => n + 1);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not consume prescription.";
      setError(message);
      toast.error(message);
    } finally {
      setActionId(null);
    }
  };

  const downloadPdf = async (p: Prescription) => {
    setActionId(p.id);
    setError(null);
    try {
      const res = await apiRequestRaw(
        `/prescriptions/${p.id}/pdf`,
        { method: "GET" },
        { auth: true },
      );
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const cd = res.headers.get("Content-Disposition") ?? "";
      const match = cd.match(/filename="?([^"]+)"?/i);
      const filename = match?.[1] ?? `prescription-${p.code}.pdf`;
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
      setActionId(null);
    }
  };

  const prescriptions = response?.data ?? [];
  const meta = response?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const pendingOnPage = prescriptions.filter((p) => p.status === "pending").length;

  return (
    <div className="stack-lg">
      <div className="row-wrap" style={{ justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div>
          <p className="page-sub">
            {pendingOnPage > 0
              ? `${pendingOnPage} pending on this page. Use filters to browse all prescriptions.`
              : "All your prescriptions in one place."}
          </p>
        </div>
        <form onSubmit={onLimitChange} className="row" style={{ gap: 8, alignItems: "center" }}>
          <label className="tight" style={{ fontSize: 12, color: "var(--ink-3)" }}>Per page</label>
          <select className="input" name="limit" defaultValue={String(limit)} style={{ width: 72 }}>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
          <button type="submit" className="btn btn-sm">Apply</button>
        </form>
      </div>

      <div className="row-wrap" style={{ gap: 6 }}>
        <button
          type="button"
          className={"chip" + (status === "" ? " active" : "")}
          onClick={() => applyStatus("")}
        >
          All
        </button>
        <button
          type="button"
          className={"chip" + (status === "pending" ? " active" : "")}
          onClick={() => applyStatus("pending")}
        >
          <span className="badge-dot" style={{ color: "var(--status-pending)" }} />
          Pending
        </button>
        <button
          type="button"
          className={"chip" + (status === "consumed" ? " active" : "")}
          onClick={() => applyStatus("consumed")}
        >
          <span className="badge-dot" style={{ color: "var(--status-consumed)" }} />
          Consumed
        </button>
      </div>

      {pendingOnPage > 0 && status !== "consumed" && (
        <div
          className="card"
          style={{
            background: "var(--accent-soft)",
            borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)",
          }}
        >
          <div className="card-body" style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div
              className="empty-icon"
              style={{ background: "var(--accent)", color: "var(--accent-fg)", width: 44, height: 44 }}
            >
              <Icon name="pill" size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: "var(--accent-strong)" }}>
                Pickup ready — show your PDF at the pharmacy
              </div>
              <div className="tight" style={{ color: "var(--accent-strong)", opacity: 0.85 }}>
                {pendingOnPage} pending prescription{pendingOnPage > 1 ? "s" : ""} on this page.
              </div>
            </div>
          </div>
        </div>
      )}

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <div className="empty"><p>Loading prescriptions…</p></div>
      ) : prescriptions.length === 0 ? (
        <div className="card">
          <div className="empty">
            <div className="empty-icon"><Icon name="inbox" size={26} /></div>
            <h3>No prescriptions yet</h3>
            <p>Prescriptions from your doctor will appear here.</p>
            {(status || page > 1) && (
              <button type="button" className="btn" onClick={() => router.push(pathname)}>
                Clear filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="stack">
            {prescriptions.map((p) => {
              const busy = actionId === p.id;
              return (
                <div className="card" key={p.id}>
                  <div
                    className="card-body"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0, 1fr) auto",
                      gap: 16,
                      alignItems: "center",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div className="row" style={{ gap: 10, marginBottom: 6 }}>
                        <span className="mono" style={{ fontWeight: 600, fontSize: 14 }}>{p.code}</span>
                        <Badge status={p.status} dot />
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                        {p.items.map((item, idx) => (
                          <span key={item.id}>
                            {item.name}
                            {item.dosage && (
                              <span className="tight" style={{ fontWeight: 400 }}> {item.dosage}</span>
                            )}
                            {idx < p.items.length - 1 && <span style={{ color: "var(--ink-3)" }}>, </span>}
                          </span>
                        ))}
                      </div>
                      <div className="tight">
                        From {p.author.user.name} · Issued {fmtDate(p.createdAt)}
                      </div>
                    </div>

                    <div className="row-wrap" style={{ gap: 6, justifyContent: "flex-end" }}>
                      <Link href={`/patient/prescriptions/${p.id}`} className="btn btn-sm">
                        Details
                      </Link>
                      <button
                        className="btn btn-sm"
                        type="button"
                        onClick={() => downloadPdf(p)}
                        disabled={busy}
                      >
                        <Icon name="download" /> PDF
                      </button>
                      {p.status === "pending" && (
                        <button
                          className="btn btn-primary btn-sm"
                          type="button"
                          onClick={() => consumePrescription(p.id)}
                          disabled={busy}
                        >
                          <Icon name="check" /> {busy ? "Updating…" : "Mark picked up"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="row" style={{ justifyContent: "center", gap: 8 }}>
              <button
                type="button"
                className="btn btn-sm"
                disabled={page <= 1}
                onClick={() => goPage(page - 1)}
              >
                Previous
              </button>
              <span className="tight" style={{ alignSelf: "center", fontSize: 13 }}>
                Page {page} of {totalPages}
                {meta?.total !== undefined && ` · ${meta.total} total`}
              </span>
              <button
                type="button"
                className="btn btn-sm"
                disabled={page >= totalPages}
                onClick={() => goPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
