"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { RolePageShell } from "@/components/role-page-shell";
import { Avatar, Badge, Icon, fmtDate } from "@/components/ui";
import { ApiError, apiRequest } from "@/lib/http-client";
import { PaginatedResponse, Prescription } from "@/lib/prescriptions";

export default function DoctorPrescriptionsPage() {
  return (
    <RolePageShell
      title="Prescriptions"
      crumbs={["Doctor"]}
      expectedRole="doctor"
      actions={
        <Link href="/doctor/prescriptions/new" className="btn btn-primary">
          <Icon name="plus" /> New prescription
        </Link>
      }
    >
      <Suspense>
        <DoctorPrescriptionsContent />
      </Suspense>
    </RolePageShell>
  );
}

function DoctorPrescriptionsContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState(() => searchParams.get("status") ?? "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<PaginatedResponse<Prescription> | null>(null);

  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20") || 20));

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchParams.get("status")) params.set("status", searchParams.get("status") as string);
    const patient = searchParams.get("patient");
    if (patient) params.set("patientId", patient);
    params.set("page", String(page));
    params.set("limit", String(limit));

    apiRequest<PaginatedResponse<Prescription>>(
      `/prescriptions?${params.toString()}`,
      { method: "GET" },
      { auth: true },
    )
      .then((data) => setResponse(data))
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Could not load prescriptions.");
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  const pushQuery = (next: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const s = next.status !== undefined ? next.status : status;
    const pg = next.page !== undefined ? next.page : String(page);
    const lim = next.limit !== undefined ? next.limit : String(limit);
    const patient = searchParams.get("patient");
    if (s) p.set("status", s);
    if (patient) p.set("patient", patient);
    if (pg && pg !== "1") p.set("page", pg);
    if (lim && lim !== "20") p.set("limit", lim);
    const q = p.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  };

  const applyStatus = (s: string) => {
    setStatus(s);
    pushQuery({ status: s || undefined, page: "1" });
  };

  const goPage = (n: number) => pushQuery({ page: String(Math.max(1, n)) });

  const prescriptions = response?.data ?? [];
  const meta = response?.meta;
  const total = meta?.total ?? prescriptions.length;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className="stack-lg">
      <div className="row-wrap" style={{ justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <p className="page-sub">Issued to your patients. Filter by status or search by code.</p>
        <form
          onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); pushQuery({ page: "1", limit: String(fd.get("limit") ?? "20") }); }}
          className="row" style={{ gap: 8, alignItems: "center" }}
        >
          <label className="tight" style={{ fontSize: 12, color: "var(--ink-3)" }}>Per page</label>
          <select className="input" name="limit" defaultValue={String(limit)} style={{ width: 72 }}>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
          <button type="submit" className="btn btn-sm">Apply</button>
        </form>
      </div>

      {/* Status filter chips */}
      <div className="row-wrap" style={{ gap: 6 }}>
        <button
          className={"chip" + (status === "" ? " active" : "")}
          onClick={() => applyStatus("")}
        >
          All
        </button>
        <button
          className={"chip" + (status === "pending" ? " active" : "")}
          onClick={() => applyStatus("pending")}
        >
          <span className="badge-dot" style={{ color: "var(--status-pending)" }} />
          Pending
        </button>
        <button
          className={"chip" + (status === "consumed" ? " active" : "")}
          onClick={() => applyStatus("consumed")}
        >
          <span className="badge-dot" style={{ color: "var(--status-consumed)" }} />
          Consumed
        </button>
      </div>

      {/* Table */}
      {error && <div className="alert-error">{error}</div>}

      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div className="empty">
            <p>Loading prescriptions…</p>
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><Icon name="inbox" size={26} /></div>
            <h3>No prescriptions found</h3>
            <p>Try clearing the filter or create a new prescription.</p>
            <button className="btn" onClick={() => applyStatus("")}>Clear filter</button>
          </div>
        ) : (
          <>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Patient</th>
                  <th>Medications</th>
                  <th>Status</th>
                  <th>Issued</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((p) => (
                  <tr
                    key={p.id}
                    className="tbl-row-link"
                    onClick={() => router.push(`/doctor/prescriptions/${p.id}`)}
                  >
                    <td>
                      <span className="mono" style={{ fontWeight: 600 }}>{p.code}</span>
                    </td>
                    <td>
                      <div className="row" style={{ gap: 10 }}>
                        <Avatar name={p.patient.user.name} />
                        <div>
                          <div style={{ fontWeight: 500 }}>{p.patient.user.name}</div>
                          <div className="tight">{p.patient.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {p.items.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <span style={{ fontWeight: 500 }}>
                            {p.items[0].name}
                            {p.items[0].dosage && (
                              <span className="tight" style={{ fontWeight: 400, marginLeft: 4 }}>
                                {p.items[0].dosage}
                              </span>
                            )}
                          </span>
                          {p.items.length > 1 && (
                            <span className="tight">+ {p.items.length - 1} more</span>
                          )}
                        </div>
                      ) : (
                        <span className="tight">—</span>
                      )}
                    </td>
                    <td><Badge status={p.status} dot /></td>
                    <td className="tight">{fmtDate(p.createdAt)}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/doctor/prescriptions/${p.id}`);
                        }}
                      >
                        Open <Icon name="arrowRight" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="card-foot">
              <span>{total} prescription{total !== 1 ? "s" : ""}</span>
            </div>
          </>
        )}
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
    </div>
  );
}
