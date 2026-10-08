"use client";

import { useCallback, useEffect, useState } from "react";
import { Award, Loader2, TriangleAlert, Users, ArrowRightLeft, Download, Check, CircleAlert } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { getCurrentYear, getGroups, gradeLabel, initials, type Group } from "@/lib/academic";
import { useAuth } from "@/components/auth-context";
import { Modal } from "@/components/modal";
import { downloadCSV } from "@/lib/finance";
import { listYears } from "@/lib/settings";
import type { AcademicYear } from "@/lib/academic";

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

/** Mover estudiantes de grado lo firma rectoría. */
const CAN_PROMOTE = new Set(["SUPER_ADMIN", "RECTOR"]);

export default function CierrePage() {
  const { user } = useAuth();
  const puedePromover = !!user && CAN_PROMOTE.has(user.role);
  const [promoOpen, setPromoOpen] = useState(false);
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

  /** El acta del grupo tal como se ve, para archivarla o firmarla. */
  const exportarActa = () => {
    if (!data) return;
    downloadCSV(`acta_promocion_${data.group.name}_${year?.year ?? ""}.csv`, [
      ["Estudiante", ...data.subjects.map((s) => s.name), "Promedio", "Áreas perdidas", "Estado"],
      ...data.students.map((st) => [
        st.name,
        ...data.subjects.map((s) => (st.finals[s.id] == null ? "" : (st.finals[s.id] as number).toFixed(1))),
        st.overall == null ? "" : st.overall.toFixed(1),
        st.failed,
        STATUS[st.status]?.label ?? st.status,
      ]),
    ]);
  };

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
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-1.5 text-xs">
            <span className="font-medium text-subtle">Grupo</span>
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="bg-transparent text-[13px] font-semibold text-ink outline-none">
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </label>
          <button onClick={exportarActa} disabled={!data}
            className="flex h-[34px] items-center gap-2 rounded-lg border border-line px-3 text-[13px] font-semibold text-ink transition-colors hover:bg-surface disabled:opacity-40">
            <Download className="h-3.5 w-3.5" /> Exportar acta
          </button>
          {puedePromover && (
            <button onClick={() => setPromoOpen(true)}
              className="flex h-[34px] items-center gap-2 rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90">
              <ArrowRightLeft className="h-3.5 w-3.5" /> Promover al año siguiente
            </button>
          )}
        </div>
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
            Definitiva del año = promedio de las notas de cada periodo ponderado por su peso.
            El paso al siguiente grado se hace con <b>Promover al año siguiente</b>, que primero muestra la simulación completa.
          </div>
        </div>
      )}
      {promoOpen && year && (
        <PromocionModal fromYear={year} onClose={() => setPromoOpen(false)} />
      )}
    </div>
  );
}

/* ══════════ Promoción al año siguiente ══════════ */

type PromoRow = {
  studentId: string; name: string; status: string; overall: number | null; failed: number;
  from: { id: string; name: string; gradeLevel: number };
  to: { id: string; name: string; gradeLevel: number } | null;
  accion: "PROMUEVE" | "REPITE" | "GRADUA";
  bloqueado: boolean;
};
type Preview = {
  fromYear: { id: string; year: number };
  toYear: { id: string; year: number };
  cursosDestino: { id: string; name: string; gradeLevel: number; estudiantes: number }[];
  rows: PromoRow[];
  summary: { total: number; promueve: number; repite: number; gradua: number; bloqueados: number };
};

const ACCION_CHIP: Record<string, string> = {
  PROMUEVE: "bg-s-success text-s-success-fg",
  REPITE: "bg-s-warning text-s-warning-fg",
  GRADUA: "bg-s-info text-s-info-fg",
};
const ACCION_LABEL: Record<string, string> = { PROMUEVE: "Promueve", REPITE: "Repite", GRADUA: "Se gradúa" };

function PromocionModal({ fromYear, onClose }: { fromYear: { id: string; year: number }; onClose: () => void }) {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [toYearId, setToYearId] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  // Ajustes manuales del destino, por estudiante. La simulación propone; quien
  // firma decide.
  const [override, setOverride] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [hecho, setHecho] = useState<number | null>(null);
  const [confirmar, setConfirmar] = useState(false);

  useEffect(() => {
    listYears()
      .then((ys) => {
        const otros = ys.filter((y) => y.id !== fromYear.id).sort((a, b) => a.year - b.year);
        setYears(otros);
        const siguiente = otros.find((y) => y.year === fromYear.year + 1) ?? otros[0];
        if (siguiente) setToYearId(siguiente.id);
      })
      .catch(() => setYears([]));
  }, [fromYear.id]);

  useEffect(() => {
    if (!toYearId) { setPreview(null); return; }
    setLoading(true); setErr(null); setOverride({}); setConfirmar(false);
    apiGet<Preview>(`/year-close/promotion-preview?fromYearId=${fromYear.id}&toYearId=${toYearId}`)
      .then(setPreview)
      .catch((e) => setErr(e instanceof Error ? e.message : "No se pudo simular la promoción."))
      .finally(() => setLoading(false));
  }, [fromYear.id, toYearId]);

  const destinoDe = (r: PromoRow) => override[r.studentId] ?? r.to?.id ?? "";
  const aMover = (preview?.rows ?? []).filter((r) => destinoDe(r));

  const ejecutar = async () => {
    if (!preview || !aMover.length) return;
    setBusy(true); setErr(null);
    try {
      const res = await apiPost<{ movidos: number }>("/year-close/promote", {
        fromYearId: preview.fromYear.id,
        toYearId: preview.toYear.id,
        assignments: aMover.map((r) => ({ studentId: r.studentId, gradeGroupId: destinoDe(r) })),
      });
      setHecho(res.movidos);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo ejecutar la promoción.");
    } finally { setBusy(false); }
  };

  if (hecho != null) {
    return (
      <Modal open onClose={onClose} title="Promoción ejecutada" width={480}>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-s-success text-s-success-fg"><Check className="h-6 w-6" /></span>
          <span className="text-[15px] font-semibold text-ink">{hecho} estudiantes quedaron matriculados en {preview?.toYear.year}.</span>
          <span className="text-[13px] text-subtle">
            Las notas, la asistencia y el observador del año anterior siguen intactos. Si algún estudiante
            quedó en el curso equivocado, se corrige desde <b>Administración → Cursos</b>.
          </span>
        </div>
        <div className="flex justify-end">
          <button onClick={onClose} className="flex h-9 items-center rounded-lg bg-primary px-4 text-[13px] font-semibold text-white">Listo</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title="Promover al año siguiente"
      subtitle={`Simulación desde ${fromYear.year}. Nada se guarda hasta confirmar.`} width={860}>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-1.5 text-xs">
          <span className="font-medium text-subtle">Año destino</span>
          <select value={toYearId} onChange={(e) => setToYearId(e.target.value)} className="bg-transparent text-[13px] font-semibold text-ink outline-none">
            {years.length === 0 && <option value="">Sin años disponibles</option>}
            {years.map((y) => <option key={y.id} value={y.id}>{y.year}</option>)}
          </select>
        </label>
        {preview && (
          <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
            <span className="rounded-full bg-s-success px-2.5 py-1 text-s-success-fg">{preview.summary.promueve} promueven</span>
            <span className="rounded-full bg-s-warning px-2.5 py-1 text-s-warning-fg">{preview.summary.repite} repiten</span>
            <span className="rounded-full bg-s-info px-2.5 py-1 text-s-info-fg">{preview.summary.gradua} se gradúan</span>
            {preview.summary.bloqueados > 0 && (
              <span className="rounded-full bg-s-error px-2.5 py-1 text-s-error-fg">{preview.summary.bloqueados} sin curso destino</span>
            )}
          </div>
        )}
      </div>

      {years.length === 0 && (
        <div className="flex items-start gap-2 rounded-lg bg-s-warning px-3 py-2.5 text-[12px] text-s-warning-fg">
          <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          No hay otro año lectivo creado. Créalo primero en <b>Configuración → Año lectivo y periodos</b>, y luego sus cursos en <b>Administración → Cursos</b>.
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Calculando…</div>
      ) : err ? (
        <div className="flex items-center gap-2 rounded-lg bg-s-error px-3 py-2.5 text-[13px] text-s-error-fg"><TriangleAlert className="h-4 w-4" /> {err}</div>
      ) : preview ? (
        <>
          {preview.summary.bloqueados > 0 && (
            <div className="flex items-start gap-2 rounded-lg bg-s-warning px-3 py-2.5 text-[12px] text-s-warning-fg">
              <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {preview.summary.bloqueados} estudiantes no tienen curso en {preview.toYear.year}: falta crearlo en <b>Cursos</b>, o asígnales uno a mano aquí abajo. Los que queden sin destino simplemente no se mueven.
            </div>
          )}

          <div className="flex max-h-[46vh] flex-col overflow-y-auto rounded-xl border border-line">
            <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-surface px-4 py-2.5 text-[11px] font-bold tracking-[0.1em] text-subtle">
              <span className="flex-1">ESTUDIANTE</span>
              <span className="w-[70px]">ACTUAL</span>
              <span className="w-[100px]">RESULTADO</span>
              <span className="w-[170px]">QUEDA EN</span>
            </div>
            {preview.rows.map((r, i) => {
              const dest = destinoDe(r);
              return (
                <div key={r.studentId} className={`flex items-center gap-3 px-4 py-2 ${i < preview.rows.length - 1 ? "border-b border-line" : ""} ${!dest ? "bg-s-warning/20" : ""}`}>
                  <span className="flex-1 truncate text-[13px] text-ink">{r.name}</span>
                  <span className="w-[70px] text-[12px] text-subtle">{r.from.name}</span>
                  <span className="w-[100px]">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ACCION_CHIP[r.accion]}`}>{ACCION_LABEL[r.accion]}</span>
                  </span>
                  <select value={dest} onChange={(e) => setOverride((o) => ({ ...o, [r.studentId]: e.target.value }))}
                    className="h-8 w-[170px] rounded-lg border border-line bg-card px-2 text-[12px] text-ink outline-none focus:ring-2 focus:ring-primary/40">
                    <option value="">{r.accion === "GRADUA" ? "Se gradúa — no se mueve" : "No mover"}</option>
                    {preview.cursosDestino.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} · {gradeLabel(c.gradeLevel)}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg bg-surface px-3.5 py-2.5">
            <input type="checkbox" checked={confirmar} onChange={(e) => setConfirmar(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[color:var(--primary,#7C3AED)]" />
            <span className="text-[12px] text-ink">
              Confirmo que <b>{aMover.length}</b> estudiantes pasan a los cursos de <b>{preview.toYear.year}</b>.
              El historial académico no se toca y un traslado equivocado se corrige desde Cursos.
            </span>
          </label>

          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="flex h-9 items-center rounded-lg border border-line px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">Cancelar</button>
            <button onClick={ejecutar} disabled={busy || !confirmar || !aMover.length}
              className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRightLeft className="h-3.5 w-3.5" />} Promover {aMover.length}
            </button>
          </div>
        </>
      ) : null}
    </Modal>
  );
}
