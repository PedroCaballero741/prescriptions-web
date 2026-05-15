"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { RolePageShell } from "@/components/role-page-shell";
import { Avatar, Badge, Icon, fmtDate } from "@/components/ui";
import { ApiError, apiRequest, apiRequestRaw } from "@/lib/http-client";
import { PaginatedResponse, Prescription } from "@/lib/prescriptions";

export default function AdminPrescriptionsPage() {
  return (
    <RolePageShell
      title="Prescriptions"
      crumbs={["Admin"]}
      expectedRole="admin"
    >
      <Suspense>
        <AdminPrescriptionsContent />
      </Suspense>
    </RolePageShell>
  );
}

function AdminPrescriptionsContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState(() => searchParams.get("status") ?? "");
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [patientId, setPatientId] = useState(() => searchParams.get("patientId") ?? "");
  const [doctorId, setDoctorId] = useState(() => searchParams.get("doctorId") ?? "");
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    setStatus(searchParams.get("status") ?? "");
    setSearch(searchParams.get("q") ?? "");
    setPatientId(searchParams.get("patientId") ?? "");
    setDoctorId(searchParams.get("doctorId") ?? "");
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchParams.get("status"))
      params.set("status", searchParams.get("status") as string);
    if (searchParams.get("patientId"))
      params.set("patientId", searchParams.get("patientId") as string);
    if (searchParams.get("doctorId"))
      params.set("doctorId", searchParams.get("doctorId") as string);
    const query = params.toString();

    apiRequest<PaginatedResponse<Prescription>>(
      `/admin/prescriptions${query ? `?${query}` : ""}`,
      { method: "GET" },
      { auth: true },
    )
      .then((data) => {
        setPrescriptions(data.data);
        setTotal(data.meta?.total ?? data.data.length);
      })
      .catch((err) => {
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not load prescriptions.",
        );
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  const applyFilters = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (patientId.trim()) params.set("patientId", patientId.trim());
    if (doctorId.trim()) params.set("doctorId", doctorId.trim());
    if (search.trim()) params.set("q", search.trim());
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const clearFilters = () => {
    setStatus("");
    setSearch("");
    setPatientId("");
    setDoctorId("");
    router.push(pathname);
  };

  const downloadPdf = async (p: Prescription) => {
    setDownloadingId(p.id);
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
      toast.error(
        err instanceof ApiError ? err.message : "Could not download PDF.",
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const hasFilters =
    !!searchParams.get("status") ||
    !!searchParams.get("patientId") ||
    !!searchParams.get("doctorId") ||
    !!searchParams.get("q");

  // Client-side search filter on top of API results
  const filtered = search.trim()
    ? prescriptions.filter((p) => {
        const q = search.toLowerCase();
        return (
          p.code.toLowerCase().includes(q) ||
          p.patient.user.name.toLowerCase().includes(q) ||
          p.patient.user.email.toLowerCase().includes(q) ||
          p.author.user.name.toLowerCase().includes(q)
        );
      })
    : prescriptions;

  return (
    <div className="stack-lg">
      {/* Filters */}
      <form
        onSubmit={applyFilters}
        className="row-wrap"
        style={{ gap: 8 }}
      >
        <input
          className="input mono"
          placeholder="Patient profile id"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          style={{ width: 200 }}
        />
        <input
          className="input mono"
          placeholder="Doctor profile id"
          value={doctorId}
          onChange={(e) => setDoctorId(e.target.value)}
          style={{ width: 200 }}
        />
        <input
          className="input"
          placeholder="Search by code, patient or doctor…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 280 }}
        />
        <select
          className="input"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{ width: 160 }}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="consumed">Consumed</option>
        </select>
        <button type="submit" className="btn">
          <Icon name="search" /> Filter
        </button>
        {(hasFilters || status || search.trim() || patientId.trim() || doctorId.trim()) && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={clearFilters}
          >
            Clear
          </button>
        )}
      </form>

      {error && <div className="alert-error">{error}</div>}

      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div className="empty">
            <p>Loading prescriptions…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">
              <Icon name="inbox" size={26} />
            </div>
            <h3>No prescriptions found</h3>
            <p>Try adjusting your filters.</p>
            {(hasFilters || status || search.trim() || patientId.trim() || doctorId.trim()) && (
              <button className="btn" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Medications</th>
                  <th>Status</th>
                  <th>Issued</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="mono" style={{ fontWeight: 600 }}>
                        {p.code}
                      </span>
                    </td>
                    <td>
                      <div className="row" style={{ gap: 8 }}>
                        <Avatar name={p.patient.user.name} />
                        <div>
                          <div style={{ fontWeight: 500 }}>
                            {p.patient.user.name}
                          </div>
                          <div className="tight">{p.patient.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="row" style={{ gap: 8 }}>
                        <Avatar name={p.author.user.name} />
                        <span style={{ fontWeight: 500 }}>
                          {p.author.user.name}
                        </span>
                      </div>
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
                                style={{
                                  fontWeight: 400,
                                  marginLeft: 4,
                                }}
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
                      <Badge status={p.status} dot />
                    </td>
                    <td className="tight">{fmtDate(p.createdAt)}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="btn btn-sm btn-ghost"
                        disabled={downloadingId === p.id}
                        onClick={() => downloadPdf(p)}
                      >
                        <Icon name="download" />
                        {downloadingId === p.id ? "…" : "PDF"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="card-foot">
              <span>
                {filtered.length !== total
                  ? `${filtered.length} of ${total}`
                  : total}{" "}
                prescription{total !== 1 ? "s" : ""}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
