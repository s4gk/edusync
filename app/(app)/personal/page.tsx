"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus, Search, ChevronLeft, ChevronRight, Briefcase, Loader2, TriangleAlert,
} from "lucide-react";
import { apiGet } from "@/lib/api";

const STAFF_ROLES = [
  { key: "RECTOR", label: "Rector" },
  { key: "COORDINATOR_ACADEMIC", label: "Coord. Académico" },
  { key: "COORDINATOR_CONVIVENCIA", label: "Coord. Convivencia" },
  { key: "SECRETARY", label: "Secretaría" },
  { key: "ACCOUNTANT", label: "Contabilidad" },
  { key: "SUPER_ADMIN", label: "Super Admin" },
] as const;
const STAFF_CSV = STAFF_ROLES.map((r) => r.key).join(",");
const roleLabel = (r: string) => STAFF_ROLES.find((x) => x.key === r)?.label ?? r;

const STATUS_META: Record<string, { label: string; chip: string; dot: string }> = {
  ACTIVE: { label: "Activo", chip: "bg-s-success text-s-success-fg", dot: "bg-emerald-500" },
  INACTIVE: { label: "Inactivo", chip: "bg-surface text-subtle", dot: "bg-muted" },
  SUSPENDED: { label: "Suspendido", chip: "bg-s-error text-s-error-fg", dot: "bg-danger" },
  PENDING: { label: "Pendiente", chip: "bg-s-warning text-s-warning-fg", dot: "bg-amber-500" },
};
const statusMeta = (s: string) => STATUS_META[s] ?? { label: s, chip: "bg-surface text-subtle", dot: "bg-muted" };

type ApiUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  avatarUrl: string | null;
};
type Paginated<T> = { data: T[]; meta: { total: number; page: number; limit: number; totalPages: number } };

const initialsOf = (f: string, l: string) => `${f?.[0] ?? ""}${l?.[0] ?? ""}`.toUpperCase();
const PAGE_SIZE = 12;

export default function PersonalPage() {
  const [items, setItems] = useState<ApiUser[]>([]);
  const [meta, setMeta] = useState<Paginated<ApiUser>["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ roles: STAFF_CSV, page: String(page), limit: String(PAGE_SIZE) });
      if (search.trim()) params.set("search", search.trim());
      const res = await apiGet<Paginated<ApiUser>>(`/users?${params.toString()}`);
      setItems(res.data);
      setMeta(res.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el personal.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    const id = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(id);
  }, [load, search]);

  const from = meta && meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0;
  const to = meta ? Math.min(meta.page * meta.limit, meta.total) : 0;

  return (
    <div className="flex flex-col gap-6 px-8 py-7">
      <div className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold tracking-[0.18em] text-primary">ADMINISTRACIÓN</span>
          <h1 className="text-[28px] font-bold -tracking-[0.02em] text-ink">Personal</h1>
          <p className="text-[13px] text-subtle">{meta ? `${meta.total.toLocaleString("es-CO")} cuentas administrativas` : "Rector, coordinadores, secretaría y contabilidad"}</p>
        </div>
        <Link href="/personal/nuevo" className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90">
          <Plus className="h-3.5 w-3.5" /> Nuevo personal
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <div className="ml-auto flex h-9 w-72 items-center gap-2 rounded-lg border border-line bg-card px-3">
          <Search className="h-4 w-4 text-subtle" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar por nombre o correo…" className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted" />
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
        <div className="flex items-center justify-between px-5 py-3.5">
          <span className="text-xs text-subtle">{meta && meta.total > 0 ? `Mostrando ${from}–${to} de ${meta.total.toLocaleString("es-CO")}` : "—"}</span>
          <div className="flex items-center gap-2.5">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!meta || meta.page <= 1} className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-line text-subtle transition-colors hover:bg-surface disabled:opacity-40"><ChevronLeft className="h-3 w-3" /></button>
            <button onClick={() => setPage((p) => (meta && p < meta.totalPages ? p + 1 : p))} disabled={!meta || meta.page >= meta.totalPages} className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-line text-ink transition-colors hover:bg-surface disabled:opacity-40"><ChevronRight className="h-3 w-3" /></button>
          </div>
        </div>

        <div className="flex items-center gap-4 border-y border-line bg-surface px-5 py-3 text-[11px] font-bold tracking-[0.1em] text-subtle">
          <span className="flex-1">NOMBRE</span>
          <span className="w-[170px]">CARGO</span>
          <span className="w-[150px]">TELÉFONO</span>
          <span className="w-[110px]">ESTADO</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Cargando personal…</div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-s-error-fg"><TriangleAlert className="h-4 w-4" /> {error}</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-subtle"><Briefcase className="h-6 w-6 text-muted" /> No hay personal{search ? " que coincida" : " registrado"}.</div>
        ) : (
          items.map((u, i) => {
            const sm = statusMeta(u.status);
            return (
              <Link key={u.id} href={`/personal/${u.id}`} className={`flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface/50 ${i < items.length - 1 ? "border-b border-line" : ""}`}>
                <div className="flex flex-1 items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                    {u.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : initialsOf(u.firstName, u.lastName)}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-ink">{u.firstName} {u.lastName}</span>
                    <span className="text-[11px] text-subtle">{u.email}</span>
                  </div>
                </div>
                <span className="w-[170px]"><span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-ink">{roleLabel(u.role)}</span></span>
                <span className="w-[150px] text-[13px] text-subtle">{u.phone ?? "—"}</span>
                <div className="w-[110px]"><span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${sm.chip}`}><span className={`h-1.5 w-1.5 rounded-full ${sm.dot}`} />{sm.label}</span></div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
