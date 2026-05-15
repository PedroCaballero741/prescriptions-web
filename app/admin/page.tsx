"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { RolePageShell } from "@/components/role-page-shell";
import { Avatar, Icon } from "@/components/ui";
import { ApiError, apiRequest } from "@/lib/http-client";
import { AdminMetricsResponse } from "@/lib/prescriptions";

const STATUS_FILL: Record<string, string> = {
  pending:  "var(--status-pending)",
  consumed: "var(--status-consumed)",
};

export default function AdminDashboardPage() {
  return (
    <RolePageShell
      title="Dashboard"
      crumbs={["Admin"]}
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
    setLoading(true);
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
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Could not load metrics.");
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
  const byStatus = metrics?.byStatus ?? { pending: metrics?.pending ?? 0, consumed: metrics?.consumed ?? 0 };
  const byDay = metrics?.byDay ?? [];
  const topDoctors = metrics?.topDoctors ?? [];
  const statusPieData = Object.entries(byStatus).map(([name, value]) => ({ name, value }));
  const total = statusPieData.reduce((s, e) => s + e.value, 0);

  return (
    <div className="stack-lg">
      {/* Page head */}
      <div className="page-head" style={{ marginBottom: 0 }}>
        <div>
          <p className="page-sub">Activity across all clinicians and patients.</p>
        </div>
        <form onSubmit={onFilter} className="row" style={{ gap: 8 }}>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="input"
            style={{ width: 140 }}
          />
          <span className="tight">→</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="input"
            style={{ width: 140 }}
          />
          <button type="submit" className="btn"><Icon name="calendar" /> Apply</button>
          {(from || to) && (
            <button type="button" className="btn btn-ghost" onClick={onClear}>Clear</button>
          )}
        </form>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <div className="empty"><p>Loading metrics…</p></div>
      ) : (
        <>
          {/* KPI strip */}
          <div className="grid-4">
            <Kpi label="Prescriptions" value={totalPrescriptions.toLocaleString()} />
            <Kpi label="Active doctors"  value={String(totalDoctors)} />
            <Kpi label="Patients"        value={totalPatients.toLocaleString()} />
            <Kpi
              label="Fill rate"
              value={((metrics?.consumptionRate ?? 0) * 100).toFixed(0) + "%"}
              up
            />
          </div>

          {/* Charts */}
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>
            {/* Bar chart */}
            <div className="card">
              <div className="card-head">
                <h2 className="card-title">Prescriptions issued · daily</h2>
              </div>
              <div className="card-body" style={{ padding: "12px 12px 8px" }}>
                {byDay.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={byDay} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v: string) => v.slice(5)}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                        width={28}
                      />
                      <Tooltip
                        cursor={{ fill: "var(--bg-sunk)" }}
                        contentStyle={{
                          background: "var(--bg-elev)",
                          border: "1px solid var(--hairline)",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty" style={{ padding: "32px 24px" }}>
                    <p>No daily data for this range.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pie chart */}
            <div className="card">
              <div className="card-head"><h2 className="card-title">Status mix</h2></div>
              <div
                className="card-body"
                style={{ display: "flex", gap: 18, alignItems: "center" }}
              >
                {statusPieData.some((d) => d.value > 0) ? (
                  <>
                    <ResponsiveContainer width="55%" height={200}>
                      <PieChart>
                        <Pie
                          data={statusPieData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={56}
                          outerRadius={84}
                          paddingAngle={3}
                          strokeWidth={0}
                        >
                          {statusPieData.map((e) => (
                            <Cell key={e.name} fill={STATUS_FILL[e.name] ?? "var(--ink-4)"} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="stack" style={{ gap: 14, flex: 1 }}>
                      {statusPieData.map((e) => (
                        <div key={e.name}>
                          <div className="row" style={{ gap: 8, marginBottom: 2 }}>
                            <span
                              className="badge-dot"
                              style={{ background: STATUS_FILL[e.name], width: 8, height: 8 }}
                            />
                            <span style={{ fontSize: 12.5, color: "var(--ink-3)", textTransform: "capitalize" }}>
                              {e.name}
                            </span>
                          </div>
                          <div className="row" style={{ gap: 8, alignItems: "baseline" }}>
                            <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>
                              {e.value.toLocaleString()}
                            </span>
                            {total > 0 && (
                              <span className="tight">
                                {((e.value / total) * 100).toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="empty" style={{ padding: "32px 24px" }}>
                    <p>No data.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top doctors */}
          {topDoctors.length > 0 && (
            <div className="card" style={{ overflow: "hidden" }}>
              <div className="card-head"><h2 className="card-title">Top doctors · by volume</h2></div>
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>#</th>
                    <th>Doctor</th>
                    <th className="num">Issued</th>
                    <th style={{ width: 160 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {topDoctors.map((d, i) => {
                    const pct = (d.count / topDoctors[0].count) * 100;
                    return (
                      <tr key={d.doctorId}>
                        <td className="tight">{i + 1}</td>
                        <td>
                          <div className="row" style={{ gap: 10 }}>
                            <Avatar name={d.name} />
                            <span style={{ fontWeight: 500 }}>{d.name}</span>
                          </div>
                        </td>
                        <td className="num mono">{d.count}</td>
                        <td>
                          <div
                            style={{
                              height: 6,
                              background: "var(--bg-sunk)",
                              borderRadius: 999,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${pct}%`,
                                background: "var(--accent)",
                                borderRadius: 999,
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, up }: { label: string; value: string; up?: boolean }) {
  return (
    <div className="card kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {up && (
        <div className="kpi-delta up">
          <Icon name="trend" size={12} />
        </div>
      )}
    </div>
  );
}
