"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar, TrendingUp, TrendingDown, Clock3, FileCheck, Loader2, TriangleAlert, ClipboardList, ShieldAlert,
  MessageSquare, ListChecks, DoorOpen,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import { getCurrentYear, getGroups, getSubjects, initials, type Group, type Subject } from "@/lib/academic";
import { TakeTable } from "@/components/attendance-table";

type AttRecord = {
  id: string; studentId: string; date: string; status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | "PERMISSION" | "EVASION";
  notes?: string | null;
  student: { user: { firstName: string; lastName: string } };
};
type Paginated<T> = { data: T[]; meta: { total: number } };
type ReportRow = { studentId: string; name: string; total: number; present: number; absent: number; late: number; excused: number; evasion?: number; percentage: number; atRisk: boolean };
type Report = { subject: string; group: string; students: ReportRow[] };

const ESTADO: Record<string, { letra: string; chip: string }> = {
  PRESENT: { letra: "P", chip: "bg-s-success text-s-success-fg" },
  ABSENT: { letra: "A", chip: "bg-s-error text-s-error-fg" },
  LATE: { letra: "T", chip: "bg-s-warning text-s-warning-fg" },
  EXCUSED: { letra: "J", chip: "bg-s-info text-s-info-fg" },
  PERMISSION: { letra: "Pe", chip: "bg-surface text-ink" },
  EVASION: { letra: "Ev", chip: "bg-orange-100 text-orange-700" },
};

const AVATARS = [
  "bg-blue-100 text-blue-700", "bg-amber-100 text-amber-700", "bg-pink-100 text-pink-700", "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700", "bg-teal-100 text-teal-700", "bg-orange-100 text-orange-700", "bg-sky-100 text-sky-700",
];
const dayShort = (iso: string) => {
  const d = new Date(iso);
  return { d: ["D", "L", "M", "M", "J", "V", "S"][d.getUTCDay()], n: String(d.getUTCDate()), key: iso.slice(0, 10) };
};
export default function AsistenciaPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [groupId, setGroupId] = useState("");
  const [subjectId, setSubjectId] = useState("");

  const [records, setRecords] = useState<AttRecord[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [activeDate, setActiveDate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<"take" | "view">("take");

  useEffect(() => {
    (async () => {
      try {
        const year = await getCurrentYear();
        if (!year) throw new Error("Sin año lectivo");
        const gs = await getGroups(year.id);
        setGroups(gs);
        if (gs[0]) setGroupId(gs[0].id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error de contexto.");
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!groupId) return;
    (async () => {
      const subs = await getSubjects(groupId);
      setSubjects(subs);
      setSubjectId(subs[0]?.id ?? "");
    })();
  }, [groupId]);

  const load = useCallback(async () => {
    if (!subjectId) return;
    setLoading(true);
    setError(null);
    try {
      const [recs, rep] = await Promise.all([
        apiGet<Paginated<AttRecord>>(`/attendance?subjectId=${subjectId}&limit=200`),
        apiGet<Report>(`/attendance/subject/${subjectId}/report`),
      ]);
      setRecords(recs.data);
      setReport(rep);
      const dates = [...new Set(recs.data.map((r) => r.date.slice(0, 10)))].sort();
      setActiveDate(dates[dates.length - 1] ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar la asistencia.");
      setRecords([]); setReport(null);
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => { load(); }, [load]);

  const dates = useMemo(() => [...new Set(records.map((r) => r.date.slice(0, 10)))].sort(), [records]);
  const dayRecords = useMemo(() => records.filter((r) => r.date.slice(0, 10) === activeDate), [records, activeDate]);

  const dayStats = useMemo(() => {
    const c = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0, PERMISSION: 0, EVASION: 0 } as Record<string, number>;
    dayRecords.forEach((r) => { c[r.status]++; });
    const total = dayRecords.length || 1;
    return [
      { label: "Presentes", value: c.PRESENT, pct: Math.round((c.PRESENT / total) * 100), icon: TrendingUp, color: "text-emerald-600", bar: "bg-emerald-400" },
      { label: "Ausentes", value: c.ABSENT, pct: Math.round((c.ABSENT / total) * 100), icon: TrendingDown, color: "text-rose-600", bar: "bg-rose-400" },
      { label: "Evasiones", value: c.EVASION, pct: Math.round((c.EVASION / total) * 100), icon: DoorOpen, color: "text-orange-600", bar: "bg-orange-400" },
      { label: "Tardanzas", value: c.LATE, pct: Math.round((c.LATE / total) * 100), icon: Clock3, color: "text-amber-600", bar: "bg-amber-400" },
      { label: "Justificadas", value: c.EXCUSED, pct: Math.round((c.EXCUSED / total) * 100), icon: FileCheck, color: "text-blue-600", bar: "bg-blue-400" },
    ];
  }, [dayRecords]);

  const subjectName = subjects.find((s) => s.id === subjectId)?.name ?? "";
  const groupName = groups.find((g) => g.id === groupId)?.name ?? "";
  const atRisk = report?.students.filter((s) => s.atRisk) ?? [];

  return (
    <div className="flex flex-col gap-4 px-7 py-5">
      {/* header */}
      <div className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold tracking-[0.18em] text-primary">OPERACIONES</span>
          <h1 className="text-[28px] font-bold text-ink">Asistencia</h1>
          <p className="text-[13px] text-subtle">{subjectName ? `${subjectName} · ${groupName} · ${records.length} registros` : "Selecciona grupo y materia"}</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-1.5 text-xs">
            <span className="font-medium text-subtle">Grado</span>
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="bg-transparent text-[13px] font-semibold text-ink outline-none">
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-1.5 text-xs">
            <span className="font-medium text-subtle">Materia</span>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="bg-transparent text-[13px] font-semibold text-ink outline-none">
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
        </div>
      </div>

      {/* selector de modo */}
      <div className="flex w-fit items-center gap-1 rounded-xl border border-line bg-surface p-1">
        {([["take", "Tomar asistencia", ListChecks], ["view", "Consultar", Calendar]] as const).map(([m, label, Icon]) => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${mode === m ? "bg-card text-ink shadow-sm" : "text-subtle hover:text-ink"}`}>
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Cargando asistencia…</div>
      ) : error ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-s-error-fg"><TriangleAlert className="h-4 w-4" /> {error}</div>
      ) : mode === "take" ? (
        <TakeTable
          subjectId={subjectId}
          roster={report?.students ?? []}
          records={records}
          onSaved={load}
        />
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center text-sm text-subtle"><ClipboardList className="h-6 w-6 text-muted" /> Sin registros de asistencia para esta materia.</div>
      ) : (
        <>
          {/* date strip */}
          <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-card px-4 py-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface text-ink"><Calendar className="h-3.5 w-3.5" /></span>
            <div className="flex flex-1 flex-wrap gap-2">
              {dates.map((d) => {
                const ds = dayShort(d);
                const on = d === activeDate;
                return (
                  <button key={d} onClick={() => setActiveDate(d)}
                    className={`flex h-16 w-14 flex-col items-center justify-center gap-0.5 rounded-xl transition-colors ${on ? "bg-primary text-white" : "border border-line bg-card hover:bg-surface"}`}>
                    <span className={`text-[10px] font-medium ${on ? "text-white/85" : "text-subtle"}`}>{ds.d}</span>
                    <span className={`text-base font-bold ${on ? "text-white" : "text-ink"}`}>{ds.n}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* day stats */}
          <div className="flex flex-wrap gap-3">
            {dayStats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex flex-1 flex-col gap-1.5 rounded-2xl border border-line bg-card p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-subtle">{s.label}</span>
                    <Icon className={`h-3 w-3 ${s.color}`} />
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold leading-none text-ink">{s.value}</span>
                    <span className="text-[11px] text-subtle">{s.pct}%</span>
                  </div>
                  <span className="h-1.5 w-full overflow-hidden rounded-full bg-surface"><span className={`block h-full rounded-full ${s.bar}`} style={{ width: `${s.pct}%` }} /></span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-4 xl:flex-row">
            {/* roster del día */}
            <div className="flex flex-1 flex-col gap-3 rounded-2xl border border-line bg-card p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">Lista — {new Date(activeDate + "T00:00:00").toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}</span>
                <span className="text-xs text-subtle">{dayRecords.length} estudiantes</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                {dayRecords.map((r, i) => {
                  const name = `${r.student.user.firstName} ${r.student.user.lastName}`;
                  const est = ESTADO[r.status];
                  return (
                    <div key={r.id} className="flex items-center gap-2 rounded-xl border border-line bg-card px-2.5 py-2" title={r.notes ?? ""}>
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${AVATARS[i % AVATARS.length]}`}>{initials(r.student.user.firstName, r.student.user.lastName)}</span>
                      <span className="flex-1 truncate text-[12px] font-medium text-ink">{name}</span>
                      {r.notes ? <MessageSquare className="h-3 w-3 shrink-0 text-subtle" /> : null}
                      <span className={`flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md px-1 text-[11px] font-bold ${est.chip}`}>{est.letra}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* en riesgo (acumulado del periodo) */}
            <div className="flex w-full flex-col gap-3 rounded-2xl border border-line bg-card p-5 xl:w-[340px] xl:shrink-0">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-600" />
                <h3 className="text-sm font-semibold text-ink">Asistencia en riesgo</h3>
                {atRisk.length > 0 && <span className="rounded-full bg-s-error px-1.5 py-0.5 text-[10px] font-bold text-s-error-fg">{atRisk.length}</span>}
              </div>
              <p className="text-[11px] text-subtle">Estudiantes con asistencia acumulada por debajo del umbral.</p>
              {(atRisk.length ? atRisk : (report?.students ?? []).slice(0, 6)).map((s, i) => (
                <div key={s.studentId} className="flex items-center gap-2.5">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold ${AVATARS[i % AVATARS.length]}`}>{initials(...s.name.split(" "))}</span>
                  <div className="flex flex-1 flex-col">
                    <span className="text-[13px] font-medium text-ink">{s.name}</span>
                    <span className="text-[10px] text-subtle">{s.present}P · {s.absent}A · {s.evasion ?? 0}Ev · {s.late}T · {s.excused}J</span>
                  </div>
                  <span className={`text-[13px] font-bold ${s.atRisk ? "text-danger" : "text-ink"}`}>{s.percentage}%</span>
                </div>
              ))}
              {report && report.students.length === 0 && <span className="text-xs text-subtle">Sin datos.</span>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
