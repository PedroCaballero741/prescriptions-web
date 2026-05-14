"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RolePageShell } from "@/components/role-page-shell";
import { ApiError, apiRequest } from "@/lib/http-client";
import { AdminMetricsResponse } from "@/lib/prescriptions";

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  consumed: "#10b981",
};

export default function AdminDashboardPage() {
  return (
    <RolePageShell
      title="Admin dashboard"
      description="Metrics overview"
      expectedRole="admin"
    >
      <Suspense>
        <AdminDashboardContent />
      </Suspense>
    </RolePageShell>
  );
}

function AdminDashboardContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [from, setFrom] = useState(() => searchParams.get("from") ?? "");
  const [to, setTo] = useState(() => searchParams.get("to") ?? "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<AdminMetricsResponse | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchParams.get("from")) params.set("from", searchParams.get("from") as string);
    if (searchParams.get("to")) params.set("to", searchParams.get("to") as string);
    const query = params.toString();

    apiRequest<AdminMetricsResponse>(
      `/admin/metrics${query ? `?${query}` : ""}`,
      { method: "GET" },
      { auth: true },
    )
      .then((data) => setMetrics(data))
      .catch((requestError) => {
        setError(
          requestError instanceof ApiError
            ? requestError.message
            : "Could not load metrics.",
        );
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  const onFilter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const onClear = () => {
    setFrom("");
    setTo("");
    router.push(pathname);
  };

  const totalPrescriptions = metrics?.totals?.prescriptions ?? metrics?.total ?? 0;
  const totalDoctors = metrics?.totals?.doctors ?? 0;
  const totalPatients = metrics?.totals?.patients ?? 0;
  const byStatus = metrics?.byStatus ?? {
    pending: metrics?.pending ?? 0,
    consumed: metrics?.consumed ?? 0,
  };
  const byDay = metrics?.byDay ?? [];
  const topDoctors = metrics?.topDoctors ?? [];
  const statusPieData = Object.entries(byStatus).map(([name, value]) => ({ name, value }));

  return (
    <section className="space-y-4">
      {/* Date filter */}
      <form
        onSubmit={onFilter}
        className="grid gap-3 rounded border border-zinc-200 bg-white p-4 md:grid-cols-4"
      >
        <label className="space-y-1 text-sm">
          <span>From</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span>To</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2"
          />
        </label>
        <div className="flex items-end gap-2 md:col-span-2">
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
        <p className="text-sm text-zinc-600">Loading metrics...</p>
      ) : (
        <>
          {/* Totals */}
          <div className="grid gap-3 md:grid-cols-3">
            <MetricCard label="Prescriptions" value={String(totalPrescriptions)} />
            <MetricCard label="Doctors" value={String(totalDoctors)} />
            <MetricCard label="Patients" value={String(totalPatients)} />
          </div>

          {/* Charts row */}
          <div className="grid gap-3 md:grid-cols-2">
            {/* By-day bar chart */}
            <section className="rounded border border-zinc-200 bg-white p-4">
              <h2 className="mb-3 text-sm font-medium">Prescriptions by day</h2>
              {byDay.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={byDay} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v: string) => v.slice(5)}
                    />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="count" fill="#18181b" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-zinc-500">No data for this range.</p>
              )}
            </section>

            {/* By-status pie chart */}
            <section className="rounded border border-zinc-200 bg-white p-4">
              <h2 className="mb-3 text-sm font-medium">By status</h2>
              {statusPieData.some((d) => d.value > 0) ? (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="60%" height={180}>
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {statusPieData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={STATUS_COLORS[entry.name] ?? "#a1a1aa"}
                          />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <ul className="space-y-2 text-sm">
                    {statusPieData.map((entry) => (
                      <li key={entry.name} className="flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ background: STATUS_COLORS[entry.name] ?? "#a1a1aa" }}
                        />
                        <span className="capitalize text-zinc-700">
                          {entry.name}: <strong>{entry.value}</strong>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-zinc-500">No data.</p>
              )}
            </section>
          </div>

          {/* Consumption rate + top doctors */}
          <div className="grid gap-3 md:grid-cols-2">
            <section className="rounded border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
              Consumption rate:{" "}
              <strong>{((metrics?.consumptionRate ?? 0) * 100).toFixed(2)}%</strong>
            </section>

            {topDoctors.length > 0 && (
              <section className="rounded border border-zinc-200 bg-white p-4 text-sm">
                <h2 className="mb-2 font-medium">Top doctors by volume</h2>
                <ol className="space-y-1 text-zinc-700">
                  {topDoctors.map((d, i) => (
                    <li key={d.doctorId}>
                      {i + 1}. {d.name} — <strong>{d.count}</strong>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded border border-zinc-200 bg-white p-4">
      <p className="text-sm text-zinc-600">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </article>
  );
}
