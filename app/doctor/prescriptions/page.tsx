"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { RolePageShell } from "@/components/role-page-shell";
import { ApiError, apiRequest } from "@/lib/http-client";
import { PaginatedResponse, Prescription } from "@/lib/prescriptions";

export default function DoctorPrescriptionsPage() {
  return (
    <RolePageShell
      title="Doctor prescriptions"
      description="List and manage your prescriptions"
      expectedRole="doctor"
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
  const [from, setFrom] = useState(() => searchParams.get("from") ?? "");
  const [to, setTo] = useState(() => searchParams.get("to") ?? "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<PaginatedResponse<Prescription> | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchParams.get("status")) params.set("status", searchParams.get("status") as string);
    if (searchParams.get("from")) params.set("from", searchParams.get("from") as string);
    if (searchParams.get("to")) params.set("to", searchParams.get("to") as string);

    const query = params.toString();

    apiRequest<PaginatedResponse<Prescription>>(
      `/prescriptions${query ? `?${query}` : ""}`,
      { method: "GET" },
      { auth: true },
    )
      .then((data) => setResponse(data))
      .catch((requestError) => {
        setError(
          requestError instanceof ApiError
            ? requestError.message
            : "Could not load prescriptions.",
        );
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  const onFilter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const onClear = () => {
    setStatus("");
    setFrom("");
    setTo("");
    router.push(pathname);
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-medium">Your prescriptions</h2>
        <Link
          href="/doctor/prescriptions/new"
          className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          New prescription
        </Link>
      </div>

      <form onSubmit={onFilter} className="grid gap-3 rounded border border-zinc-200 bg-white p-4 md:grid-cols-4">
        <label className="space-y-1 text-sm">
          <span>Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="consumed">Consumed</option>
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span>From</span>
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span>To</span>
          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2"
          />
        </label>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
          >
            Clear
          </button>
        </div>
      </form>

      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="text-sm text-zinc-600">Loading prescriptions...</p>
      ) : response && response.data.length > 0 ? (
        <ul className="space-y-3">
          {response.data.map((prescription) => (
            <li key={prescription.id} className="rounded border border-zinc-200 bg-white p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{prescription.code}</p>
                  <p className="text-zinc-600">
                    Patient: {prescription.patient.user.name} · Status: {prescription.status}
                  </p>
                </div>
                <Link
                  href={`/doctor/prescriptions/${prescription.id}`}
                  className="rounded border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100"
                >
                  View detail
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          No prescriptions found.
        </p>
      )}
    </section>
  );
}
