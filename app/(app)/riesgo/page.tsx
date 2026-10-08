"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, Loader2, TriangleAlert, TrendingDown, CalendarX, BookOpen, CheckCircle2, CalendarCheck, ClipboardList } from "lucide-react";
import { apiGet } from "@/lib/api";
import { getCurrentYear, getGroups, getSubjects, getPeriods, currentPeriodNumber, initials } from "@/lib/academic";

type GradeRow = { score: string | number; student: { id: string; user: { firstName: string; lastName: string } } };
type AttStudent = { studentId: string; name: string; percentage: number; atRisk: boolean };
type Report = { students: AttStudent[] };

type RiskEntry = {
  key: string; studentId: string; name: string; subject: string; group: string;
  nota: number | null; asistencia: number | null; reasons: ("nota" | "asistencia")[];
};

const NOTA_MIN = 3.0;

export default function RiesgoPage() {
  const [entries, setEntries] = useState<RiskEntry[]>([]);
  const [period, setPeriod] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const year = await getCurrentYear();
      if (!year) throw new Error("Sin año lectivo");
      const per = currentPeriodNumber(await getPeriods(year.id).catch(() => []));
      setPeriod(per);
      const groups = await getGroups(year.id);
      // materias del docente (scoped)
      const subjects: { id: string; name: string; group: string }[] = [];
      for (const g of groups) {
        const subs = await getSubjects(g.id).catch(() => []);
        subs.forEach((s) => subjects.push({ id: s.id, name: s.name, group: g.name }));
      }

      const all: RiskEntry[] = [];
      await Promise.all(subjects.map(async (subj) => {
        const [grades, report] = await Promise.all([
          apiGet<GradeRow[]>(`/grades?subjectId=${subj.id}&periodNumber=${per}`).catch(() => [] as GradeRow[]),
          apiGet<Report>(`/attendance/subject/${subj.id}/report`).catch(() => ({ students: [] as AttStudent[] })),
        ]);
        const attBy = new Map(report.students.map((s) => [s.studentId, s]));
        const seen = new Set<string>();
        // por notas
        for (const gr of grades) {
          const nota = Number(gr.score);
          const sid = gr.student.id;
          seen.add(sid);
          const att = attBy.get(sid);
          const reasons: ("nota" | "asistencia")[] = [];
          if (Number.isFinite(nota) && nota < NOTA_MIN) reasons.push("nota");
          if (att?.atRisk) reasons.push("asistencia");
          if (reasons.length) all.push({
            key: `${subj.id}:${sid}`, studentId: sid, name: `${gr.student.user.firstName} ${gr.student.user.lastName}`,
            subject: subj.name, group: subj.group, nota: Number.isFinite(nota) ? nota : null, asistencia: att?.percentage ?? null, reasons,
          });
        }
        // estudiantes en riesgo por asistencia sin registro de nota
        for (const att of report.students) {
          if (att.atRisk && !seen.has(att.studentId)) {
            all.push({
              key: `${subj.id}:${att.studentId}`, studentId: att.studentId, name: att.name,
              subject: subj.name, group: subj.group, nota: null, asistencia: att.percentage, reasons: ["asistencia"],
            });
          }
        }
      }));

      all.sort((a, b) => b.reasons.length - a.reasons.length || (a.nota ?? 9) - (b.nota ?? 9));
      setEntries(all);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar.");
      setEntries([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const porNota = entries.filter((e) => e.reasons.includes("nota")).length;
  const porAsist = entries.filter((e) => e.reasons.includes("asistencia")).length;

  return (
    <div className="flex flex-col gap-5 px-7 py-6">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold tracking-[0.18em] text-primary">SEGUIMIENTO</span>
          <h1 className="flex items-center gap-2 text-[26px] font-bold -tracking-[0.02em] text-ink"><ShieldAlert className="h-6 w-6 text-rose-600" /> Mis estudiantes en riesgo</h1>
          <p className="text-[13px] text-subtle">Notas bajas (&lt; {NOTA_MIN.toFixed(1)}) o inasistencia · Periodo {period}</p>
        </div>
        <div className="flex gap-2">
          <span className="flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-1.5 text-[12px] font-semibold text-rose-600"><TrendingDown className="h-3.5 w-3.5" /> {porNota} notas</span>
          <span className="flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-1.5 text-[12px] font-semibold text-amber-600"><CalendarX className="h-3.5 w-3.5" /> {porAsist} asistencia</span>
        </div>
      </div>

      {error && <div className="flex items-center gap-2 rounded-lg bg-s-error px-3 py-2 text-[13px] text-s-error-fg"><TriangleAlert className="h-4 w-4" /> {error}</div>}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Analizando notas y asistencia…</div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-card py-20 text-center text-sm text-subtle">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          ¡Sin estudiantes en riesgo! Todos tus grupos van bien este periodo.
        </div>
      ) : (
        <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
          <div className="flex items-center gap-4 border-b border-line bg-surface px-5 py-3 text-[11px] font-bold tracking-[0.1em] text-subtle">
            <span className="flex-1">ESTUDIANTE</span>
            <span className="w-[150px]">MATERIA · GRUPO</span>
            <span className="w-[70px] text-center">NOTA</span>
            <span className="w-[80px] text-center">ASIST.</span>
            <span className="w-[150px]">MOTIVO</span>
            <span className="w-[90px]" />
          </div>
          {entries.map((e, i) => (
            <div key={e.key} className={`flex items-center gap-4 px-5 py-3 ${i < entries.length - 1 ? "border-b border-line" : ""}`}>
              <div className="flex flex-1 items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-s-error text-[11px] font-bold text-s-error-fg">{initials(...e.name.split(" "))}</span>
                <span className="text-[13px] font-semibold text-ink">{e.name}</span>
              </div>
              <span className="flex w-[150px] items-center gap-1 text-[12px] text-subtle"><BookOpen className="h-3 w-3 shrink-0" /> {e.subject} · {e.group}</span>
              <span className={`w-[70px] text-center text-[13px] font-bold ${e.nota != null && e.nota < NOTA_MIN ? "text-rose-600" : "text-subtle"}`}>{e.nota != null ? e.nota.toFixed(1) : "—"}</span>
              <span className={`w-[80px] text-center text-[13px] font-bold ${e.asistencia != null && e.reasons.includes("asistencia") ? "text-amber-600" : "text-subtle"}`}>{e.asistencia != null ? `${e.asistencia}%` : "—"}</span>
              <span className="flex w-[150px] flex-wrap gap-1">
                {e.reasons.includes("nota") && <span className="rounded-full bg-s-error px-2 py-0.5 text-[10px] font-bold text-s-error-fg">Nota baja</span>}
                {e.reasons.includes("asistencia") && <span className="rounded-full bg-s-warning px-2 py-0.5 text-[10px] font-bold text-s-warning-fg">Inasistencia</span>}
              </span>
              <div className="flex w-[90px] items-center justify-end gap-1.5">
                <Link href="/calificaciones" title="Calificar" className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-subtle transition-colors hover:bg-surface hover:text-ink"><ClipboardList className="h-3.5 w-3.5" /></Link>
                <Link href="/clase" title="Asistencia" className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-subtle transition-colors hover:bg-surface hover:text-ink"><CalendarCheck className="h-3.5 w-3.5" /></Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
