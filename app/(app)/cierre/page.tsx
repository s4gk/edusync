"use client";

import { useCallback, useEffect, useState } from "react";
import { Award, Loader2, TriangleAlert, Users } from "lucide-react";
import { apiGet } from "@/lib/api";
import { getCurrentYear, getGroups, initials, type Group } from "@/lib/academic";

type Final = number | null;
type CStudent = { studentId: string; name: string; finals: Record<string, Final>; overall: number | null; failed: number; status: string };
type Consolidation = {
  group: { id: string; name: string; gradeLevel: number };
  subjects: { id: string; name: string }[];
  maxFails: number;
  students: CStudent[];
  summary: { total: number; promovidos: number; recuperacion: number; reprobados: number; sinNotas: number; promedioGrupo: number | null };
};

const AVATARS = [
  "bg-blue-100 text-blue-700", "bg-amber-100 text-amber-700", "bg-pink-100 text-pink-700", "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700", "bg-teal-100 text-teal-700", "bg-orange-100 text-orange-700", "bg-sky-100 text-sky-700",
];
const STATUS: Record<string, { label: string; chip: string }> = {
  PROMOVIDO: { label: "Promovido", chip: "bg-s-success text-s-success-fg" },
  RECUPERACION: { label: "Recuperación", chip: "bg-s-warning text-s-warning-fg" },
  REPROBADO: { label: "Reprobado", chip: "bg-s-error text-s-error-fg" },
  SIN_NOTAS: { label: "Sin notas", chip: "bg-surface text-subtle" },
};
const finalColor = (v: Final) => (v == null ? "text-subtle" : v >= 4.5 ? "text-emerald-600 font-bold" : v < 3.0 ? "text-rose-600 font-bold" : "text-ink");

export default function CierrePage() {
  const [year, setYear] = useState<{ id: string; year: number } | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState("");
  const [data, setData] = useState<Consolidation | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const y = await getCurrentYear();
        if (!y) throw new Error("Sin año lectivo.");
        setYear(y);
        const gs = await getGroups(y.id);
        setGroups(gs);
        if (gs[0]) setGroupId(gs[0].id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo cargar.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const load = useCallback(async (yid: string, gid: string) => {
    if (!yid || !gid) return;
    setLoadingData(true);
    setError(null);
    try {
      const d = await apiGet<Consolidation>(`/year-close/consolidation?academicYearId=${yid}&gradeGroupId=${gid}`);
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar la consolidación.");
      setData(null);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { if (year && groupId) load(year.id, groupId); }, [year, groupId, load]);

  if (loading) {
    return <div className="flex items-center justify-center gap-2 px-8 py-24 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>;
  }

  const s = data?.summary;
  const KPIS = s
    ? [
        { label: "Promovidos", value: s.promovidos, tone: "text-emerald-600" },
        { label: "Con recuperación", value: s.recuperacion, tone: "text-amber-600" },
        { label: "Reprobados", value: s.reprobados, tone: "text-rose-600" },
        { label: "Promedio del grupo", value: s.promedioGrupo == null ? "—" : s.promedioGrupo.toFixed(1), tone: "text-ink" },
      ]
    : [];

  return (
    <div className="flex flex-col gap-5 px-8 py-7">
      {/* header */}
      <div className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold tracking-[0.18em] text-primary">ACADÉMICO</span>
          <h1 className="text-[28px] font-bold -tracking-[0.02em] text-ink">Cierre de año · Acta de promoción</h1>
          <p className="text-[13px] text-subtle">{year ? `Consolidado del año ${year.year} — definitiva ponderada por periodo.` : ""}</p>
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-1.5 text-xs">
          <span className="font-medium text-subtle">Grupo</span>
          <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="bg-transparent text-[13px] font-semibold text-ink outline-none">
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </label>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-s-error px-3.5 py-2.5 text-[13px] font-medium text-s-error-fg">
          <TriangleAlert className="h-4 w-4" /> {error}
        </div>
      )}

      {/* KPIs */}
      {s && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k) => (
            <div key={k.label} className="flex flex-col gap-1.5 rounded-2xl border border-line bg-card p-5">
              <span className="text-[11px] font-medium text-subtle">{k.label}</span>
              <span className={`text-[28px] font-bold leading-none ${k.tone}`}>{k.value}</span>
            </div>
          ))}
        </div>
      )}

      {loadingData ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Calculando consolidación…</div>
      ) : !data || data.students.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-subtle">
          <Users className="h-6 w-6 text-muted" /> Este grupo no tiene estudiantes.
        </div>
      ) : (
        <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
          <div className="flex items-center gap-2 border-b border-line bg-surface px-5 py-3 text-xs text-subtle">
            <Award className="h-4 w-4 text-primary" />
            {data.group.name} · {data.students.length} estudiantes · promovido si pierde {data.maxFails} áreas o menos (con recuperación)
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-max">
              {/* encabezado */}
              <div className="flex items-stretch border-b border-line bg-surface text-[10px] font-bold tracking-[0.08em] text-subtle">
                <span className="sticky left-0 z-10 flex w-[200px] shrink-0 items-center border-r border-line bg-surface px-5 py-3">ESTUDIANTE</span>
                {data.subjects.map((subj) => (
                  <span key={subj.id} className="flex w-[88px] shrink-0 items-center justify-center border-r border-line px-1.5 py-3 text-center" title={subj.name}>
                    <span className="line-clamp-2 leading-tight">{subj.name}</span>
                  </span>
                ))}
                <span className="flex w-[70px] shrink-0 items-center justify-center border-r border-line px-2 py-3 text-ink">PROM</span>
                <span className="flex w-[70px] shrink-0 items-center justify-center border-r border-line px-2 py-3">PERD.</span>
                <span className="flex w-[120px] shrink-0 items-center justify-center px-2 py-3 text-ink">ESTADO</span>
              </div>

              {/* filas */}
              {data.students.map((st, i) => {
                const sc = STATUS[st.status] ?? STATUS.SIN_NOTAS;
                return (
                  <div key={st.studentId} className={`flex items-stretch ${i < data.students.length - 1 ? "border-b border-line" : ""}`}>
                    <div className="sticky left-0 z-10 flex w-[200px] shrink-0 items-center gap-2.5 border-r border-line bg-card px-5 py-2">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${AVATARS[i % AVATARS.length]}`}>{initials(...st.name.split(" "))}</span>
                      <span className="truncate text-[13px] font-medium text-ink">{st.name}</span>
                    </div>
                    {data.subjects.map((subj) => {
                      const v = st.finals[subj.id];
                      return (
                        <span key={subj.id} className={`flex w-[88px] shrink-0 items-center justify-center border-r border-line py-2 text-[13px] tabular-nums ${finalColor(v)}`}>
                          {v == null ? "—" : v.toFixed(1)}
                        </span>
                      );
                    })}
                    <span className={`flex w-[70px] shrink-0 items-center justify-center border-r border-line py-2 text-[13px] font-bold tabular-nums ${finalColor(st.overall)}`}>
                      {st.overall == null ? "—" : st.overall.toFixed(1)}
                    </span>
                    <span className={`flex w-[70px] shrink-0 items-center justify-center border-r border-line py-2 text-[13px] font-semibold ${st.failed > 0 ? "text-rose-600" : "text-subtle"}`}>
                      {st.failed}
                    </span>
                    <span className="flex w-[120px] shrink-0 items-center justify-center py-2">
                      <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${sc.chip}`}>{sc.label}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="border-t border-line bg-surface px-5 py-2.5 text-[11px] text-subtle">
            Definitiva del año = promedio de las notas de cada periodo ponderado por su peso. Solo lectura — la matrícula al siguiente grado se gestiona en Matrículas del año nuevo.
          </div>
        </div>
      )}
    </div>
  );
}
