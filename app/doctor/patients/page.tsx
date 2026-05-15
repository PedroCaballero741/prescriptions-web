"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RolePageShell } from "@/components/role-page-shell";
import { Avatar, Icon, fmtDate } from "@/components/ui";
import { ApiError, apiRequest } from "@/lib/http-client";
import { PaginatedResponse, Prescription } from "@/lib/prescriptions";

type DerivedPatient = {
  id: string;
  name: string;
  email: string;
  prescriptionCount: number;
  lastPrescriptionAt: string;
};

function derivePatientsFromPrescriptions(
  prescriptions: Prescription[],
): DerivedPatient[] {
  const map = new Map<string, DerivedPatient>();
  for (const p of prescriptions) {
    const { id, user } = p.patient;
    const existing = map.get(id);
    if (existing) {
      existing.prescriptionCount += 1;
      if (p.createdAt > existing.lastPrescriptionAt) {
        existing.lastPrescriptionAt = p.createdAt;
      }
    } else {
      map.set(id, {
        id,
        name: user.name,
        email: user.email,
        prescriptionCount: 1,
        lastPrescriptionAt: p.createdAt,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    b.lastPrescriptionAt.localeCompare(a.lastPrescriptionAt),
  );
}

export default function DoctorPatientsPage() {
  return (
    <RolePageShell title="Patients" crumbs={["Doctor"]} expectedRole="doctor">
      <DoctorPatientsContent />
    </RolePageShell>
  );
}

function DoctorPatientsContent() {
  const router = useRouter();
  const [patients, setPatients] = useState<DerivedPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Fetch all prescriptions (no pageSize cap — use large page if needed)
    apiRequest<PaginatedResponse<Prescription>>(
      "/prescriptions?pageSize=500",
      { method: "GET" },
      { auth: true },
    )
      .then((data) => {
        setPatients(derivePatientsFromPrescriptions(data.data));
      })
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : "Could not load patients.",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="stack-lg">
      <div className="page-head" style={{ marginBottom: 0 }}>
        <p className="page-sub">
          Patients who have received at least one prescription from you.
        </p>
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <span style={{ position: "absolute", left: 10, color: "var(--ink-4)", pointerEvents: "none" }}>
            <Icon name="search" size={14} />
          </span>
          <input
            className="input"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 32, width: 260 }}
          />
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div className="empty">
            <p>Loading patients…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">
              <Icon name="users" size={26} />
            </div>
            <h3>
              {search ? "No patients match your search" : "No patients yet"}
            </h3>
            <p>
              {search
                ? "Try a different name or email."
                : "Patients will appear here once you issue your first prescription."}
            </p>
            {search && (
              <button className="btn" onClick={() => setSearch("")}>
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th className="num">Prescriptions</th>
                  <th>Last prescription</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="tbl-row-link"
                    onClick={() =>
                      router.push(`/doctor/prescriptions?patient=${p.id}`)
                    }
                  >
                    <td>
                      <div className="row" style={{ gap: 10 }}>
                        <Avatar name={p.name} />
                        <div>
                          <div style={{ fontWeight: 500 }}>{p.name}</div>
                          <div className="tight">{p.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="num mono">{p.prescriptionCount}</td>
                    <td className="tight">{fmtDate(p.lastPrescriptionAt)}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/doctor/prescriptions`);
                        }}
                      >
                        View prescriptions <Icon name="arrowRight" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="card-foot">
              <span>
                {filtered.length} patient{filtered.length !== 1 ? "s" : ""}
                {search && patients.length !== filtered.length
                  ? ` of ${patients.length}`
                  : ""}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
