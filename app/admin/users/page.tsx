"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { RolePageShell } from "@/components/role-page-shell";
import { Badge, Field, Icon } from "@/components/ui";
import { ApiError, apiRequest } from "@/lib/http-client";
import { UserRole } from "@/lib/auth-types";

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
};

type UsersResponse = {
  data: UserRow[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
};

export default function AdminUsersPage() {
  return (
    <RolePageShell title="Users" crumbs={["Admin"]} expectedRole="admin">
      <Suspense fallback={<div className="empty"><p>Loading…</p></div>}>
        <AdminUsersContent />
      </Suspense>
    </RolePageShell>
  );
}

function AdminUsersContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleQ = searchParams.get("role") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const queryQ = searchParams.get("q") ?? "";

  const [list, setList] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterRole, setFilterRole] = useState(roleQ);
  const [filterQuery, setFilterQuery] = useState(queryQ);

  const [createOpen, setCreateOpen] = useState(false);
  const [cEmail, setCEmail] = useState("");
  const [cPassword, setCPassword] = useState("");
  const [cName, setCName] = useState("");
  const [cRole, setCRole] = useState<UserRole>("patient");
  const [cSpecialty, setCSpecialty] = useState("");
  const [cBirth, setCBirth] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setFilterRole(roleQ);
    setFilterQuery(queryQ);
  }, [roleQ, queryQ]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (roleQ) params.set("role", roleQ);
    if (queryQ.trim()) params.set("query", queryQ.trim());
    params.set("page", String(page));
    params.set("pageSize", "20");

    apiRequest<UsersResponse>(`/users?${params.toString()}`, { method: "GET" }, { auth: true })
      .then(setList)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Could not load users.");
      })
      .finally(() => setLoading(false));
  }, [roleQ, queryQ, page]);

  const applyFilters = (e: FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (filterRole) p.set("role", filterRole);
    if (filterQuery.trim()) p.set("q", filterQuery.trim());
    p.set("page", "1");
    const q = p.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  };

  const clearFilters = () => {
    setFilterRole("");
    setFilterQuery("");
    router.push(pathname);
  };

  const goPage = (n: number) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("page", String(Math.max(1, n)));
    router.push(`${pathname}?${p.toString()}`);
  };

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        email: cEmail.trim(),
        password: cPassword,
        name: cName.trim(),
        role: cRole,
      };
      if (cRole === "doctor" && cSpecialty.trim()) body.specialty = cSpecialty.trim();
      if (cRole === "patient" && cBirth.trim()) body.birthDate = cBirth.trim();

      await apiRequest("/users", { method: "POST", body: JSON.stringify(body) }, { auth: true });
      toast.success("User created.");
      setCreateOpen(false);
      setCEmail("");
      setCPassword("");
      setCName("");
      setCRole("patient");
      setCSpecialty("");
      setCBirth("");
      const params = new URLSearchParams();
      if (roleQ) params.set("role", roleQ);
      if (queryQ.trim()) params.set("query", queryQ.trim());
      params.set("page", String(page));
      params.set("pageSize", "20");
      const refreshed = await apiRequest<UsersResponse>(
        `/users?${params.toString()}`,
        { method: "GET" },
        { auth: true },
      );
      setList(refreshed);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not create user.";
      setError(msg);
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const rows = list?.data ?? [];
  const meta = list?.meta;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className="stack-lg" style={{ maxWidth: 960 }}>
      <div className="page-head" style={{ marginBottom: 0 }}>
        <p className="page-sub">Directory backed by <code className="mono" style={{ fontSize: 12 }}>GET /users</code> and <code className="mono" style={{ fontSize: 12 }}>POST /users</code>.</p>
        <button type="button" className="btn btn-primary" onClick={() => setCreateOpen((o) => !o)}>
          <Icon name="plus" /> {createOpen ? "Close form" : "New user"}
        </button>
      </div>

      {createOpen && (
        <form className="card" onSubmit={onCreate}>
          <div className="card-head"><h2 className="card-title">Create user</h2></div>
          <div className="card-body grid-2" style={{ gap: 14 }}>
            <Field label="Email" full>
              <input className="input" type="email" required value={cEmail} onChange={(e) => setCEmail(e.target.value)} />
            </Field>
            <Field label="Password" hint="Min. 8 characters">
              <input className="input" type="password" required minLength={8} value={cPassword} onChange={(e) => setCPassword(e.target.value)} />
            </Field>
            <Field label="Full name" full>
              <input className="input" required minLength={2} value={cName} onChange={(e) => setCName(e.target.value)} />
            </Field>
            <Field label="Role">
              <select className="input" value={cRole} onChange={(e) => setCRole(e.target.value as UserRole)}>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
            {cRole === "doctor" && (
              <Field label="Specialty (optional)" full>
                <input className="input" value={cSpecialty} onChange={(e) => setCSpecialty(e.target.value)} placeholder="e.g. General Medicine" />
              </Field>
            )}
            {cRole === "patient" && (
              <Field label="Birth date (optional)" full>
                <input className="input" type="date" value={cBirth} onChange={(e) => setCBirth(e.target.value)} />
              </Field>
            )}
            <div className="row" style={{ gridColumn: "1 / -1", justifyContent: "flex-end", gap: 8 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setCreateOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? "Creating…" : "Create user"}
              </button>
            </div>
          </div>
        </form>
      )}

      <form onSubmit={applyFilters} className="row-wrap" style={{ gap: 8 }}>
        <input
          className="input"
          placeholder="Search name or email…"
          style={{ width: 260 }}
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
        />
        <select className="input" style={{ width: 160 }} value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="doctor">Doctor</option>
          <option value="patient">Patient</option>
        </select>
        <button type="submit" className="btn"><Icon name="search" /> Apply</button>
        {(roleQ || queryQ) && (
          <button type="button" className="btn btn-ghost" onClick={clearFilters}>Clear</button>
        )}
      </form>

      {error && <div className="alert-error">{error}</div>}

      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div className="empty"><p>Loading users…</p></div>
        ) : rows.length === 0 ? (
          <div className="empty">
            <Icon name="users" size={28} />
            <h3>No users</h3>
            <p>Try changing filters or create a new account.</p>
          </div>
        ) : (
          <>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td className="tight">{u.email}</td>
                    <td><Badge>{u.role}</Badge></td>
                    <td className="tight mono" style={{ fontSize: 12 }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="card-foot row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <span className="tight">
                {meta?.total ?? rows.length} user{(meta?.total ?? rows.length) !== 1 ? "s" : ""}
              </span>
              {totalPages > 1 && (
                <div className="row" style={{ gap: 8 }}>
                  <button type="button" className="btn btn-sm" disabled={page <= 1} onClick={() => goPage(page - 1)}>Previous</button>
                  <span className="tight" style={{ fontSize: 13 }}>Page {page} / {totalPages}</span>
                  <button type="button" className="btn btn-sm" disabled={page >= totalPages} onClick={() => goPage(page + 1)}>Next</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
