"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus, Search, ChevronLeft, ChevronRight, Users2, Loader2, TriangleAlert, Phone, Mail,
} from "lucide-react";
import { apiGet } from "@/lib/api";

type ApiGuardian = {
  id: string;
  relation: string;
  user: { firstName: string; lastName: string; email: string; phone: string | null; avatarUrl: string | null; status: string };
  students: { isPrimary: boolean; student: { id: string; user: { firstName: string; lastName: string }; gradeGroup: { name: string } | null } }[];
};
type Paginated<T> = { data: T[]; meta: { total: number; page: number; limit: number; totalPages: number } };

const initialsOf = (f: string, l: string) => `${f?.[0] ?? ""}${l?.[0] ?? ""}`.toUpperCase();
const PAGE_SIZE = 12;

export default function AcudientesPage() {
  const [items, setItems] = useState<ApiGuardian[]>([]);
  const [meta, setMeta] = useState<Paginated<ApiGuardian>["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (search.trim()) params.set("search", search.trim());
      const res = await apiGet<Paginated<ApiGuardian>>(`/guardians?${params.toString()}`);
      setItems(res.data);
      setMeta(res.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar los acudientes.");
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
          <span className="text-[11px] font-bold tracking-[0.18em] text-primary">PERSONAS</span>
          <h1 className="text-[28px] font-bold -tracking-[0.02em] text-ink">Acudientes</h1>
          <p className="text-[13px] text-subtle">{meta ? `${meta.total.toLocaleString("es-CO")} acudientes registrados` : "Acudientes registrados"}</p>
        </div>
        <Link href="/acudientes/nuevo" className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90">
          <Plus className="h-3.5 w-3.5" /> Nuevo acudiente
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
          <span className="flex-1">ACUDIENTE</span>
          <span className="w-[110px]">PARENTESCO</span>
          <span className="flex-1">ESTUDIANTES</span>
          <span className="w-[160px]">CONTACTO</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Cargando acudientes…</div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-s-error-fg"><TriangleAlert className="h-4 w-4" /> {error}</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-subtle"><Users2 className="h-6 w-6 text-muted" /> No hay acudientes{search ? " que coincidan" : " registrados"}.</div>
        ) : (
          items.map((g, i) => (
            <Link key={g.id} href={`/acudientes/${g.id}`} className={`flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface/50 ${i < items.length - 1 ? "border-b border-line" : ""}`}>
              <div className="flex flex-1 items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-s-warning text-[11px] font-bold text-s-warning-fg">
                  {g.user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={g.user.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : initialsOf(g.user.firstName, g.user.lastName)}
                </span>
                <span className="text-[13px] font-semibold text-ink">{g.user.firstName} {g.user.lastName}</span>
              </div>
              <span className="w-[110px]"><span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-ink">{g.relation}</span></span>
              <span className="flex-1 text-[12px] text-subtle">
                {g.students.length === 0 ? "—" : g.students.map((s) => `${s.student.user.firstName} ${s.student.user.lastName}${s.isPrimary ? " ★" : ""}`).join(", ")}
              </span>
              <div className="flex w-[160px] flex-col gap-0.5 text-[11px] text-subtle">
                <span className="flex items-center gap-1.5 truncate"><Mail className="h-3 w-3 shrink-0" /> {g.user.email}</span>
                {g.user.phone && <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 shrink-0" /> {g.user.phone}</span>}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
