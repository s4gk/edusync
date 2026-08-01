"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Download, Plus, Search, ChevronLeft, ChevronRight, GraduationCap, Loader2, TriangleAlert, IdCard, ChevronRight as Caret,
} from "lucide-react";
import { apiGet } from "@/lib/api";

type ApiStudent = {
  id: string;
  enrollmentCode: string;
  documentId: string;
  birthDate: string;
  user: { firstName: string; lastName: string; email: string; phone: string | null; status: string; avatarUrl: string | null };
  gradeGroup: { id: string; name: string; gradeLevel: number } | null;
  guardians: { isPrimary?: boolean; guardian: { user: { firstName: string; lastName: string } } }[];
};
type Paginated<T> = { data: T[]; meta: { total: number; page: number; limit: number; totalPages: number } };
type Group = { id: string; name: string; gradeLevel: number; _count?: { students: number } };

const STATUS_META: Record<string, { label: string; chip: string; dot: string }> = {
  ACTIVE: { label: "Activo", chip: "bg-s-success text-s-success-fg", dot: "bg-emerald-500" },
  INACTIVE: { label: "Inactivo", chip: "bg-surface text-subtle", dot: "bg-muted" },
  SUSPENDED: { label: "Suspendido", chip: "bg-s-error text-s-error-fg", dot: "bg-danger" },
  PENDING: { label: "Pendiente", chip: "bg-s-warning text-s-warning-fg", dot: "bg-amber-500" },
};
const statusMeta = (s: string) => STATUS_META[s] ?? { label: s, chip: "bg-surface text-subtle", dot: "bg-muted" };
const initialsOf = (f: string, l: string) => `${f?.[0] ?? ""}${l?.[0] ?? ""}`.toUpperCase();
const age = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / (365.25 * 24 * 3600 * 1000));

const PAGE_SIZE = 12;

export default function EstudiantesPage() {
  const [students, setStudents] = useState<ApiStudent[]>([]);
  const [meta, setMeta] = useState<Paginated<ApiStudent>["meta"] | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [gradeLevel, setGradeLevel] = useState<number | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [unassigned, setUnassigned] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const years = await apiGet<{ id: string; isCurrent?: boolean }[]>("/academic/years");
        const current = years.find((y) => y.isCurrent) ?? years[0];
        if (current) {
          const gs = await apiGet<Group[]>(`/academic/years/${current.id}/groups`);
          setGroups(gs.sort((a, b) => a.gradeLevel - b.gradeLevel || a.name.localeCompare(b.name)));
        }
      } catch {
        /* filtro secundario */
      }
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (unassigned) params.set("unassigned", "true");
      else if (groupId) params.set("gradeGroupId", groupId);
      else if (gradeLevel !== null) params.set("gradeLevel", String(gradeLevel));
      if (search.trim()) params.set("search", search.trim());
      const res = await apiGet<Paginated<ApiStudent>>(`/students?${params.toString()}`);
      setStudents(res.data);
      setMeta(res.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar los estudiantes.");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [search, groupId, gradeLevel, unassigned, page]);

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
          <h1 className="text-[28px] font-bold -tracking-[0.02em] text-ink">Estudiantes</h1>
          <p className="text-[13px] text-subtle">
            {meta ? `${meta.total.toLocaleString("es-CO")} estudiantes` : "Estudiantes"}
            {groups.length ? ` · ${groups.length} grupos` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-9 items-center gap-2 rounded-lg border border-line px-3.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface">
            <Download className="h-3.5 w-3.5" /> Exportar
          </button>
          <Link href="/matriculas/nuevo" className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90">
            <Plus className="h-3.5 w-3.5" /> Nuevo estudiante
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {/* nivel 1 — grados */}
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => { setGradeLevel(null); setGroupId(null); setUnassigned(false); setPage(1); }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${gradeLevel === null && groupId === null && !unassigned ? "border border-primary bg-primary/10 text-primary" : "border border-line text-subtle hover:bg-surface"}`}>
            Todos
          </button>
          <button onClick={() => { setUnassigned(true); setGradeLevel(null); setGroupId(null); setPage(1); }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${unassigned ? "border border-amber-500 bg-s-warning text-s-warning-fg" : "border border-line text-subtle hover:bg-surface"}`}>
            Sin grupo
          </button>
          <span className="mx-1 h-5 w-px bg-line" />
          {[...new Set(groups.map((g) => g.gradeLevel))].sort((a, b) => a - b).map((gl) => (
            <button key={gl} onClick={() => { setGradeLevel(gl); setGroupId(null); setUnassigned(false); setPage(1); }}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${gradeLevel === gl && !unassigned ? "border border-primary bg-primary/10 text-primary" : "border border-line text-subtle hover:bg-surface"}`}>
              {gl === 0 ? "Preescolar" : `${gl}°`}
            </button>
          ))}
          <div className="ml-auto flex h-9 w-72 items-center gap-2 rounded-lg border border-line bg-card px-3">
            <Search className="h-4 w-4 text-subtle" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar por nombre o documento…" className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted" />
          </div>
        </div>

        {/* nivel 2 — secciones del grado seleccionado */}
        {gradeLevel !== null && !unassigned && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface/40 px-3 py-2">
            <span className="text-[11px] font-bold tracking-[0.1em] text-subtle">
              {gradeLevel === 0 ? "PREESCOLAR" : `GRADO ${gradeLevel}`}
            </span>
            <button onClick={() => { setGroupId(null); setPage(1); }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${groupId === null ? "border border-primary bg-primary/10 text-primary" : "border border-line bg-card text-subtle hover:bg-surface"}`}>
              Todas las secciones
            </button>
            {groups.filter((g) => g.gradeLevel === gradeLevel).map((g) => (
              <button key={g.id} onClick={() => { setGroupId(g.id); setPage(1); }}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${groupId === g.id ? "border border-primary bg-primary/10 text-primary" : "border border-line bg-card text-subtle hover:bg-surface"}`}>
                {g.name}{g._count && <span className="text-[10px] opacity-70">{g._count.students}</span>}
              </button>
            ))}
          </div>
        )}
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
          <span className="flex-1">ESTUDIANTE</span>
          <span className="w-[110px]">CÓDIGO</span>
          <span className="w-[80px]">GRUPO</span>
          <span className="w-[170px]">ACUDIENTE</span>
          <span className="w-[60px]">EDAD</span>
          <span className="w-[100px]">ESTADO</span>
          <span className="w-5" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Cargando estudiantes…</div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-s-error-fg"><TriangleAlert className="h-4 w-4" /> {error}</div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-subtle"><GraduationCap className="h-6 w-6 text-muted" /> No hay estudiantes{search ? " que coincidan" : ""}.</div>
        ) : (
          students.map((s, i) => {
            const sm = statusMeta(s.user.status);
            const primary = s.guardians?.find((g) => g.isPrimary) ?? s.guardians?.[0];
            return (
              <Link key={s.id} href={`/estudiantes/${s.id}`}
                className={`flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface/50 ${i < students.length - 1 ? "border-b border-line" : ""}`}>
                <div className="flex flex-1 items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-s-info text-[11px] font-bold text-s-info-fg">
                    {s.user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.user.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : initialsOf(s.user.firstName, s.user.lastName)}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-ink">{s.user.firstName} {s.user.lastName}</span>
                    <span className="text-[11px] text-subtle">{s.user.email}</span>
                  </div>
                </div>
                <span className="flex w-[110px] items-center gap-1.5 text-[13px] font-medium text-ink"><IdCard className="h-3.5 w-3.5 text-subtle" /> {s.enrollmentCode}</span>
                <span className="w-[80px]">{s.gradeGroup ? <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-ink">{s.gradeGroup.name}</span> : <span className="rounded-full bg-s-warning px-2 py-0.5 text-[11px] font-semibold text-s-warning-fg">Sin asignar</span>}</span>
                <span className="w-[170px] truncate text-[12px] text-subtle">{primary ? `${primary.guardian.user.firstName} ${primary.guardian.user.lastName}` : "—"}</span>
                <span className="w-[60px] text-[13px] text-subtle">{age(s.birthDate)} años</span>
                <div className="w-[100px]"><span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${sm.chip}`}><span className={`h-1.5 w-1.5 rounded-full ${sm.dot}`} />{sm.label}</span></div>
                <Caret className="h-4 w-4 shrink-0 text-muted" />
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
