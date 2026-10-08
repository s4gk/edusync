"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, GraduationCap, CalendarCheck, Wallet, Loader2, TriangleAlert, ShieldAlert, Users } from "lucide-react";
import { apiGet } from "@/lib/api";
import { getCurrentYear } from "@/lib/academic";

type Tab = "rendimiento" | "docentes" | "asistencia" | "financiero";

type CoursePerf = { gradeGroupId: string; gradeGroupName: string; gradeLevel: number; subjects: { subjectId: string; subjectName: string; studentCount: number; average: number | null; scaleDist: Record<string, number>; passRate: number | null }[] };
type TeacherPerf = { teacherId: string; name: string; subjectCount: number; totalStudentRecords: number; average: number | null; passRate: number | null };
type AttRow = { studentId: string; name: string; gradeGroup: { name: string }; total: number; present: number; absences: number; lates: number; attendancePct: number | null; atRisk: boolean };
type Financial = { billed: number; collected: number; portfolio: number; invoiceCount: number; paymentCount: number; overdueCount: number; breakdown: { status: string; count: number; total: number }[] };
type AtRisk = { studentId: string; name: string; gradeGroup?: { name: string }; lowCount?: number };

const cop = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
const avgChip = (a: number | null) => (a == null ? "text-subtle" : a >= 4.6 ? "text-emerald-600" : a >= 4.0 ? "text-blue-600" : a >= 3.0 ? "text-amber-600" : "text-rose-600");
const fmt1 = (n: number | null) => (n == null ? "—" : n.toFixed(1));
const pct = (n: number | null) => (n == null ? "—" : `${n}%`);

const TABS: { id: Tab; label: string; icon: typeof BarChart3 }[] = [
  { id: "rendimiento", label: "Rendimiento académico", icon: GraduationCap },
  { id: "docentes", label: "Docentes", icon: Users },
  { id: "asistencia", label: "Asistencia", icon: CalendarCheck },
  { id: "financiero", label: "Financiero", icon: Wallet },
];

export default function ReportesPage() {
  const [yearId, setYearId] = useState("");
  const [tab, setTab] = useState<Tab>("rendimiento");
  const [period, setPeriod] = useState(1);

  const [course, setCourse] = useState<CoursePerf[]>([]);
  const [teachers, setTeachers] = useState<TeacherPerf[]>([]);
  const [attendance, setAttendance] = useState<AttRow[]>([]);
  const [financial, setFinancial] = useState<Financial | null>(null);
  const [atRisk, setAtRisk] = useState<AtRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { (async () => {
    try { const y = await getCurrentYear(); if (!y) throw new Error("Sin año lectivo"); setYearId(y.id); }
    catch (e) { setError(e instanceof Error ? e.message : "Error"); setLoading(false); }
  })(); }, []);

  const load = useCallback(async () => {
    if (!yearId) return;
    setLoading(true); setError(null);
    try {
      if (tab === "rendimiento") {
        const [c, r] = await Promise.all([
          apiGet<CoursePerf[]>(`/reports/course-performance?academicYearId=${yearId}&period=P${period}`),
          apiGet<AtRisk[]>(`/reports/at-risk?academicYearId=${yearId}&period=P${period}`),
        ]);
        setCourse(c); setAtRisk(r);
      } else if (tab === "docentes") {
        setTeachers(await apiGet<TeacherPerf[]>(`/reports/teacher-performance?academicYearId=${yearId}`));
      } else if (tab === "asistencia") {
        setAttendance(await apiGet<AttRow[]>(`/reports/attendance?academicYearId=${yearId}`));
      } else {
        setFinancial(await apiGet<Financial>(`/reports/financial?academicYearId=${yearId}`));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el reporte.");
    } finally { setLoading(false); }
  }, [yearId, tab, period]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col gap-5 px-8 py-7">
      <div className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold tracking-[0.18em] text-primary">ANÁLISIS</span>
          <h1 className="text-[28px] font-bold -tracking-[0.02em] text-ink">Reportes</h1>
          <p className="text-[13px] text-subtle">Indicadores académicos, de asistencia y financieros del año lectivo</p>
        </div>
        {tab === "rendimiento" && (
          <label className="flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-1.5 text-xs">
            <span className="font-medium text-subtle">Periodo</span>
            <select value={period} onChange={(e) => setPeriod(Number(e.target.value))} className="bg-transparent text-[13px] font-semibold text-ink outline-none">
              {[1, 2, 3, 4].map((n) => <option key={n} value={n}>P{n}</option>)}
            </select>
          </label>
        )}
      </div>

      {/* tabs */}
      <div className="flex items-center gap-1 border-b border-line">
        {TABS.map((t) => {
          const Icon = t.icon; const on = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm transition-colors ${on ? "border-primary font-semibold text-ink" : "border-transparent font-medium text-subtle hover:text-ink"}`}>
              <Icon className={`h-4 w-4 ${on ? "text-primary" : ""}`} /> {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Cargando reporte…</div>
      ) : error ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-s-error-fg"><TriangleAlert className="h-4 w-4" /> {error}</div>
      ) : tab === "rendimiento" ? (
        <div className="flex flex-col gap-5">
          {atRisk.length > 0 && (
            <div className="flex flex-col gap-2 rounded-2xl border border-rose-300 bg-s-error/40 p-4">
              <span className="flex items-center gap-2 text-sm font-semibold text-ink"><ShieldAlert className="h-4 w-4 text-rose-600" /> {atRisk.length} estudiantes en riesgo (2+ áreas en Bajo)</span>
              <div className="flex flex-wrap gap-2">
                {atRisk.map((s) => <span key={s.studentId} className="rounded-full bg-card px-2.5 py-1 text-[11px] font-medium text-ink">{s.name}{s.gradeGroup ? ` · ${s.gradeGroup.name}` : ""}</span>)}
              </div>
            </div>
          )}
          {course.length === 0 ? <Empty /> : course.map((g) => (
            <div key={g.gradeGroupId} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
              <div className="flex items-center justify-between border-b border-line bg-surface px-5 py-3">
                <span className="text-sm font-bold text-ink">{g.gradeGroupName}</span>
                <span className="text-[11px] text-subtle">{g.subjects.length} materias</span>
              </div>
              <div className="flex items-center gap-3 border-b border-line px-5 py-2.5 text-[10px] font-bold tracking-[0.1em] text-subtle">
                <span className="flex-1">MATERIA</span><span className="w-20 text-center">PROMEDIO</span><span className="w-24 text-center">APROBACIÓN</span><span className="hidden w-[220px] sm:block">DISTRIBUCIÓN</span>
              </div>
              {g.subjects.map((s) => {
                const dist = s.scaleDist; const tot = Object.values(dist).reduce((a, b) => a + b, 0) || 1;
                const seg = [["SUPERIOR", "bg-emerald-400"], ["ALTO", "bg-blue-400"], ["BASICO", "bg-amber-300"], ["BAJO", "bg-rose-400"]] as const;
                return (
                  <div key={s.subjectId} className="flex items-center gap-3 border-b border-line px-5 py-3 last:border-0">
                    <span className="flex-1 text-[13px] font-medium text-ink">{s.subjectName}</span>
                    <span className={`w-20 text-center text-[13px] font-bold tabular-nums ${avgChip(s.average)}`}>{fmt1(s.average)}</span>
                    <span className="w-24 text-center text-[13px] text-subtle">{pct(s.passRate)}</span>
                    <span className="hidden w-[220px] sm:flex h-2.5 overflow-hidden rounded-full bg-surface">
                      {seg.map(([k, c]) => dist[k] ? <span key={k} className={c} style={{ width: `${(dist[k] / tot) * 100}%` }} title={`${k}: ${dist[k]}`} /> : null)}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : tab === "docentes" ? (
        <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
          <div className="flex items-center gap-3 border-b border-line bg-surface px-5 py-3 text-[11px] font-bold tracking-[0.1em] text-subtle">
            <span className="flex-1">DOCENTE</span><span className="w-24 text-center">MATERIAS</span><span className="w-24 text-center">REGISTROS</span><span className="w-24 text-center">PROMEDIO</span><span className="w-24 text-center">APROBACIÓN</span>
          </div>
          {teachers.length === 0 ? <Empty /> : teachers.map((t, i) => (
            <div key={t.teacherId} className={`flex items-center gap-3 px-5 py-3.5 ${i < teachers.length - 1 ? "border-b border-line" : ""}`}>
              <span className="flex-1 text-[13px] font-semibold text-ink">{t.name}</span>
              <span className="w-24 text-center text-[13px] text-subtle">{t.subjectCount}</span>
              <span className="w-24 text-center text-[13px] text-subtle">{t.totalStudentRecords}</span>
              <span className={`w-24 text-center text-[13px] font-bold tabular-nums ${avgChip(t.average)}`}>{fmt1(t.average)}</span>
              <span className="w-24 text-center text-[13px] text-subtle">{pct(t.passRate)}</span>
            </div>
          ))}
        </div>
      ) : tab === "asistencia" ? (
        <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
          <div className="flex items-center gap-3 border-b border-line bg-surface px-5 py-3 text-[11px] font-bold tracking-[0.1em] text-subtle">
            <span className="flex-1">ESTUDIANTE</span><span className="w-20">GRUPO</span><span className="w-20 text-center">PRES.</span><span className="w-20 text-center">FALTAS</span><span className="w-20 text-center">TARDES</span><span className="w-24 text-center">% ASIST.</span>
          </div>
          {attendance.length === 0 ? <Empty /> : attendance.map((a, i) => (
            <div key={a.studentId} className={`flex items-center gap-3 px-5 py-3 ${i < attendance.length - 1 ? "border-b border-line" : ""} ${a.atRisk ? "bg-s-error/20" : ""}`}>
              <span className="flex-1 text-[13px] font-medium text-ink">{a.name}</span>
              <span className="w-20 text-[12px] text-subtle">{a.gradeGroup?.name}</span>
              <span className="w-20 text-center text-[13px] text-subtle">{a.present}</span>
              <span className="w-20 text-center text-[13px] text-subtle">{a.absences}</span>
              <span className="w-20 text-center text-[13px] text-subtle">{a.lates}</span>
              <span className={`w-24 text-center text-[13px] font-bold ${a.atRisk ? "text-danger" : "text-ink"}`}>{pct(a.attendancePct)}</span>
            </div>
          ))}
        </div>
      ) : financial ? (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Facturado", value: cop(financial.billed) },
              { label: "Recaudado", value: cop(financial.collected) },
              { label: "Cartera", value: cop(financial.portfolio) },
              { label: "Facturas vencidas", value: String(financial.overdueCount) },
            ].map((k) => (
              <div key={k.label} className="flex flex-col gap-1.5 rounded-2xl border border-line bg-card p-5">
                <span className="text-[11px] font-medium text-subtle">{k.label}</span>
                <span className="text-[22px] font-bold leading-none text-ink">{k.value}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
            <div className="flex items-center gap-3 border-b border-line bg-surface px-5 py-3 text-[11px] font-bold tracking-[0.1em] text-subtle">
              <span className="flex-1">ESTADO</span><span className="w-24 text-center">FACTURAS</span><span className="w-40 text-right">MONTO</span>
            </div>
            {financial.breakdown.map((b, i) => (
              <div key={b.status} className={`flex items-center gap-3 px-5 py-3.5 ${i < financial.breakdown.length - 1 ? "border-b border-line" : ""}`}>
                <span className="flex-1 text-[13px] font-medium text-ink">{b.status === "PAID" ? "Pagadas" : b.status === "OVERDUE" ? "Vencidas" : b.status}</span>
                <span className="w-24 text-center text-[13px] text-subtle">{b.count}</span>
                <span className="w-40 text-right text-[13px] font-bold text-ink">{cop(b.total)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : <Empty />}
    </div>
  );
}

function Empty() {
  return <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-subtle"><BarChart3 className="h-6 w-6 text-muted" /> Sin datos para este reporte todavía.</div>;
}
