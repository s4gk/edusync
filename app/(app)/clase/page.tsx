"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Clock, CalendarCheck, ClipboardList, CircleDot, ListChecks, FileText, Loader2,
} from "lucide-react";
import { useSchedule } from "@/components/schedule-context";
import { BLOCKS, currentBlock, fmt, timeToMin } from "@/lib/schedule";
import { apiGet } from "@/lib/api";
import { TakeTable, type AttRosterRow, type AttRecord } from "@/components/attendance-table";
import { StudentQuickView } from "@/components/student-quick-view";

export default function ClasePage() {
  const { teachers, currentTeacherId, setCurrentTeacherId, loadTeacher, courseFor } = useSchedule();
  const teacher = teachers.find((t) => t.id === currentTeacherId) ?? null;

  useEffect(() => { if (currentTeacherId) loadTeacher(currentTeacherId); }, [currentTeacherId, loadTeacher]);

  const [now, setNow] = useState<Date | null>(null);
  const [today, setToday] = useState<string>("");
  useEffect(() => {
    const d = new Date();
    setNow(d); setToday(d.toLocaleDateString("en-CA"));
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const todayIdx = now ? now.getDay() : 0;
  const school = todayIdx >= 1 && todayIdx <= 5;
  const viewDay = school ? todayIdx : 1;
  const nowMin = now ? now.getHours() * 60 + now.getMinutes() : -1;
  const tid = currentTeacherId;

  const dayClasses = BLOCKS.map((block) => ({ block, course: courseFor(tid, viewDay, block.id) })).filter((c) => c.course);
  const curBlk = school && now ? currentBlock(now) : null;
  const curCourse = curBlk ? courseFor(tid, viewDay, curBlk.id) : undefined;
  const defaultBlockId = curCourse ? curBlk!.id : dayClasses[0]?.block.id ?? null;

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const effId = selectedId ?? defaultBlockId;
  const effBlock = BLOCKS.find((b) => b.id === effId) ?? null;
  const effCourse = effBlock ? courseFor(tid, viewDay, effBlock.id) : undefined;
  const isCurrent = !!curCourse && curBlk?.id === effId;
  const remaining = isCurrent && nowMin >= 0 && effBlock ? timeToMin(effBlock.end) - nowMin : null;

  const [tab, setTab] = useState<"asistencia" | "notas">("asistencia");
  const [roster, setRoster] = useState<AttRosterRow[]>([]);
  const [records, setRecords] = useState<AttRecord[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [quickId, setQuickId] = useState<string | null>(null);

  // roster (estudiantes del grupo) + asistencia previa de la materia
  const loadRoster = useCallback(async () => {
    if (!effCourse || !today) { setRoster([]); setRecords([]); return; }
    setLoadingRoster(true);
    try {
      const res = await apiGet<{ data: { id: string; user: { firstName: string; lastName: string } }[] }>(`/students?gradeGroupId=${effCourse.gradeGroupId}&limit=100`);
      const att = await apiGet<{ data: AttRecord[] }>(`/attendance?subjectId=${effCourse.subjectId}&limit=200`);
      setRecords(att.data);
      // % de asistencia acumulado por estudiante en esta materia
      const stat = new Map<string, { p: number; t: number }>();
      att.data.forEach((a) => { const e = stat.get(a.studentId) ?? { p: 0, t: 0 }; e.t++; if (a.status === "PRESENT") e.p++; stat.set(a.studentId, e); });
      setRoster(res.data.map((s) => {
        const st = stat.get(s.id);
        return { studentId: s.id, name: `${s.user.firstName} ${s.user.lastName}`, percentage: st && st.t ? Math.round((st.p / st.t) * 100) : undefined };
      }));
    } catch {
      setRoster([]); setRecords([]);
    } finally {
      setLoadingRoster(false);
    }
  }, [effCourse?.subjectId, effCourse?.gradeGroupId, today]);

  useEffect(() => { loadRoster(); }, [loadRoster]);

  if (!effCourse || !effBlock) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-8 py-24 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface text-subtle"><CalendarCheck className="h-7 w-7" /></span>
        <h1 className="text-xl font-bold text-ink">No hay clase seleccionada</h1>
        <p className="max-w-sm text-sm text-subtle">{teacher ? `${teacher.name} no tiene clases ${school ? "hoy" : "el lunes"}.` : "Cargando horario…"}</p>
        <div className="flex items-center gap-2">
          {teachers.length > 0 && (
            <select value={currentTeacherId} onChange={(e) => setCurrentTeacherId(e.target.value)} className="h-9 rounded-lg border border-line bg-card px-3 text-[13px] font-semibold text-ink outline-none">
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
          <Link href="/profesor" className="flex h-9 items-center gap-1.5 rounded-lg border border-line px-3.5 text-[13px] font-semibold text-ink hover:bg-surface"><ArrowLeft className="h-3.5 w-3.5" /> Mi día</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-7 py-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <Link href="/profesor" className="flex w-fit items-center gap-1.5 text-[13px] font-semibold text-subtle transition-colors hover:text-ink"><ArrowLeft className="h-4 w-4" /> Mi día</Link>
          {teachers.length > 0 && (
            <select value={currentTeacherId} onChange={(e) => { setCurrentTeacherId(e.target.value); setSelectedId(null); }} className="h-8 rounded-lg border border-line bg-card px-2.5 text-[12px] font-semibold text-ink outline-none">
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
        </div>
        {dayClasses.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {dayClasses.map(({ block, course }) => {
              const on = block.id === effId;
              const isLive = curBlk?.id === block.id && !!curCourse;
              return (
                <button key={block.id} onClick={() => setSelectedId(block.id)} className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${on ? "border-primary bg-primary-tint text-primary" : "border-line text-ink hover:bg-surface"}`}>
                  {isLive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                  {fmt(block.start)} · {course!.grado}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* banner */}
      <div className="flex flex-col gap-4 rounded-[18px] p-6 text-white sm:flex-row sm:items-center sm:justify-between" style={{ background: "var(--grad-primary)" }}>
        <div className="flex flex-col gap-2.5">
          <span className="flex w-fit items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[9px] font-bold tracking-[0.16em]">
            {isCurrent ? <><span className="h-1.5 w-1.5 rounded-full bg-white" /> EN CLASE AHORA</> : <><CircleDot className="h-3 w-3" /> CLASE SELECCIONADA</>}
          </span>
          <span className="text-[30px] font-extrabold leading-none -tracking-[0.03em]">{effCourse.grado} · {effCourse.materia}</span>
          <div className="flex flex-wrap items-center gap-4 text-white/80">
            <span className="flex items-center gap-1.5 text-xs font-medium"><MapPin className="h-3 w-3" /> Aula {effCourse.aula}</span>
            <span className="flex items-center gap-1.5 text-xs font-medium"><Clock className="h-3 w-3" /> {fmt(effBlock.start)} — {fmt(effBlock.end)}</span>
            {teacher && <span className="flex items-center gap-1.5 text-xs font-medium"><CalendarCheck className="h-3 w-3" /> {teacher.name}</span>}
            {remaining !== null && <span className="flex items-center gap-1.5 text-xs font-semibold"><Clock className="h-3 w-3" /> Faltan {remaining}′</span>}
          </div>
        </div>
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-2xl font-extrabold">{roster.length}</span>
      </div>

      {/* tabs */}
      <div className="flex items-center gap-1 border-b border-line">
        {[{ id: "asistencia" as const, label: "Llamar a lista", icon: ListChecks }, { id: "notas" as const, label: "Notas", icon: FileText }].map((t) => {
          const Icon = t.icon; const on = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm transition-colors ${on ? "border-primary font-semibold text-ink" : "border-transparent font-medium text-subtle hover:text-ink"}`}>
              <Icon className={`h-4 w-4 ${on ? "text-primary" : ""}`} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "asistencia" && (
        loadingRoster ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Cargando lista…</div>
        ) : (
          <TakeTable subjectId={effCourse.subjectId} roster={roster} records={records} onSaved={loadRoster} onStudentClick={setQuickId} />
        )
      )}

      {tab === "notas" && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-card px-6 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-tint text-primary"><ClipboardList className="h-7 w-7" /></span>
          <div className="flex flex-col gap-1.5">
            <h3 className="text-base font-bold text-ink">Notas de {effCourse.grado} · {effCourse.materia}</h3>
            <p className="max-w-sm text-sm text-subtle">Abre el libro de calificaciones para registrar y editar las notas de este curso.</p>
          </div>
          <Link href="/calificaciones" className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"><FileText className="h-3.5 w-3.5" /> Abrir libro de notas</Link>
        </div>
      )}

      <StudentQuickView open={!!quickId} studentId={quickId} onClose={() => setQuickId(null)} />
    </div>
  );
}
