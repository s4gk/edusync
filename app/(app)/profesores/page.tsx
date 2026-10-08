"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus, Search, ChevronLeft, ChevronRight, GraduationCap, Loader2, TriangleAlert, Mail, Phone, BookOpen,
} from "lucide-react";
import { apiGet } from "@/lib/api";

type ApiTeacher = {
  id: string;
  speciality: string | null;
  user: { firstName: string; lastName: string; email: string; phone: string | null; avatarUrl: string | null; status: string };
  subjects: { id: string; name: string; gradeGroup: { id: string; name: string } | null }[];
};
type Paginated<T> = { data: T[]; meta: { total: number; page: number; limit: number; totalPages: number } };

const initialsOf = (f: string, l: string) => `${f?.[0] ?? ""}${l?.[0] ?? ""}`.toUpperCase();
const PAGE_SIZE = 12;

export default function ProfesoresPage() {
  const [items, setItems] = useState<ApiTeacher[]>([]);
  const [meta, setMeta] = useState<Paginated<ApiTeacher>["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (search.trim()) params.set("search", search.trim());
      if (status) params.set("status", status);
      const res = await apiGet<Paginated<ApiTeacher>>(`/teachers?${params.toString()}`);
      setItems(res.data);
      setMeta(res.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar los docentes.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

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
          <h1 className="text-[28px] font-bold -tracking-[0.02em] text-ink">Docentes</h1>
          <p className="text-[13px] text-subtle">{meta ? `${meta.total.toLocaleString("es-CO")} docentes` : "Docentes"}</p>
        </div>
        <Link href="/profesores/nuevo" className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90">
          <Plus className="h-3.5 w-3.5" /> Nuevo docente
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {[{ k: "", l: "Todos" }, { k: "ACTIVE", l: "Activos" }, { k: "INACTIVE", l: "Inactivos" }].map((o) => (
          <button key={o.k} onClick={() => { setStatus(o.k); setPage(1); }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${status === o.k ? "border border-primary bg-primary/10 text-primary" : "border border-line text-subtle hover:bg-surface"}`}>
            {o.l}
          </button>
        ))}
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
          <span className="flex-1">DOCENTE</span>
          <span className="w-[150px]">ESPECIALIDAD</span>
          <span className="flex-1">MATERIAS</span>
          <span className="w-[160px]">CONTACTO</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Cargando docentes…</div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-s-error-fg"><TriangleAlert className="h-4 w-4" /> {error}</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-subtle"><GraduationCap className="h-6 w-6 text-muted" /> No hay docentes{search ? " que coincidan" : " registrados"}.</div>
        ) : (
          items.map((t, i) => (
            <Link key={t.id} href={`/profesores/${t.id}`} className={`flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface/50 ${i < items.length - 1 ? "border-b border-line" : ""}`}>
              <div className="flex flex-1 items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  {t.user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.user.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : initialsOf(t.user.firstName, t.user.lastName)}
                </span>
                <span className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                  {t.user.firstName} {t.user.lastName}
                  {t.user.status !== "ACTIVE" && <span className="rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-subtle">Inactivo</span>}
                </span>
              </div>
              <span className="w-[150px]">
                {t.speciality ? <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-ink">{t.speciality}</span> : <span className="text-[13px] text-muted">—</span>}
              </span>
              <span className="flex flex-1 items-center gap-1.5 text-[12px] text-subtle">
                {t.subjects.length === 0 ? "—" : (
                  <>
                    <BookOpen className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{t.subjects.map((s) => `${s.name}${s.gradeGroup ? ` (${s.gradeGroup.name})` : ""}`).join(", ")}</span>
                  </>
                )}
              </span>
              <div className="flex w-[160px] flex-col gap-0.5 text-[11px] text-subtle">
                <span className="flex items-center gap-1.5 truncate"><Mail className="h-3 w-3 shrink-0" /> {t.user.email}</span>
                {t.user.phone && <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 shrink-0" /> {t.user.phone}</span>}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
