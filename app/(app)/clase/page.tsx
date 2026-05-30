"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Clock,
  CalendarCheck,
  CheckCheck,
  ClipboardList,
  CircleDot,
  ListChecks,
  FileText,
  CircleCheck,
} from "lucide-react";
import { useSchedule } from "@/components/schedule-context";
import {
  BLOCKS,
  DAYS,
  CURRENT_TEACHER_ID,
  TEACHERS,
  currentBlock,
  fmt,
  timeToMin,
  rosterFor,
} from "@/lib/schedule";

type Estado = "P" | "A" | "T" | "J";
const CYCLE: Record<Estado, Estado> = { P: "A", A: "T", T: "J", J: "P" };
const ESTADO: Record<Estado, { label: string; chip: string; dot: string }> = {
  P: { label: "Presente", chip: "bg-s-success text-s-success-fg", dot: "bg-emerald-500" },
  A: { label: "Ausente", chip: "bg-s-error text-s-error-fg", dot: "bg-rose-500" },
  T: { label: "Tarde", chip: "bg-s-warning text-s-warning-fg", dot: "bg-amber-500" },
  J: { label: "Justificado", chip: "bg-s-info text-s-info-fg", dot: "bg-blue-500" },
};

const AVATARS = [
  "bg-blue-100 text-blue-700", "bg-amber-100 text-amber-700", "bg-pink-100 text-pink-700",
  "bg-emerald-100 text-emerald-700", "bg-violet-100 text-violet-700", "bg-teal-100 text-teal-700",
  "bg-orange-100 text-orange-700", "bg-sky-100 text-sky-700",
];

export default function ClasePage() {
  const { courseFor } = useSchedule();
  const teacher = TEACHERS.find((t) => t.id === CURRENT_TEACHER_ID)!;

  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const todayIdx = now ? now.getDay() : 0;
  const school = todayIdx >= 1 && todayIdx <= 5;
  const viewDay = school ? todayIdx : 1;
  const nowMin = now ? now.getHours() * 60 + now.getMinutes() : -1;

  const dayClasses = BLOCKS.map((block) => ({ block, course: courseFor(CURRENT_TEACHER_ID, viewDay, block.id) })).filter(
    (c) => c.course
  );

  const curBlk = school && now ? currentBlock(now) : null;
  const curCourse = curBlk ? courseFor(CURRENT_TEACHER_ID, viewDay, curBlk.id) : undefined;
  const defaultBlockId = curCourse ? curBlk!.id : dayClasses[0]?.block.id ?? null;

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const effId = selectedId ?? defaultBlockId;
  const effBlock = BLOCKS.find((b) => b.id === effId) ?? null;
  const effCourse = effBlock ? courseFor(CURRENT_TEACHER_ID, viewDay, effBlock.id) : undefined;
  const isCurrent = !!curCourse && curBlk?.id === effId;
  const remaining = isCurrent && nowMin >= 0 && effBlock ? timeToMin(effBlock.end) - nowMin : null;

  const roster = useMemo(() => (effCourse ? rosterFor(effCourse.id) : []), [effCourse]);

  const [tab, setTab] = useState<"asistencia" | "notas">("asistencia");
  const [estados, setEstados] = useState<Record<string, Estado>>({});
  const getEstado = (id: string): Estado => estados[id] ?? "P";
  const cycle = (id: string) => setEstados((s) => ({ ...s, [id]: CYCLE[getEstado(id)] }));
  const markAll = (e: Estado) => setEstados((s) => {
    const next = { ...s };
    roster.forEach((r) => (next[r.id] = e));
    return next;
  });

  const counts = roster.reduce(
    (acc, r) => {
      acc[getEstado(r.id)]++;
      return acc;
    },
    { P: 0, A: 0, T: 0, J: 0 } as Record<Estado, number>
  );

  if (!effCourse || !effBlock) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-8 py-24 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface text-subtle">
          <CalendarCheck className="h-7 w-7" />
        </span>
        <h1 className="text-xl font-bold text-ink">No tienes clases programadas</h1>
        <p className="max-w-sm text-sm text-subtle">Cuando la administración te asigne cursos, aparecerán aquí para tomar lista.</p>
        <Link href="/profesor" className="mt-1 flex h-9 items-center gap-1.5 rounded-lg border border-line px-3.5 text-[13px] font-semibold text-ink hover:bg-surface">
          <ArrowLeft className="h-3.5 w-3.5" /> Ir a Mi día
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-7 py-6">
      {/* volver + selector de clase del día */}
      <div className="flex flex-col gap-3">
        <Link href="/profesor" className="flex w-fit items-center gap-1.5 text-[13px] font-semibold text-subtle transition-colors hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Mi día
        </Link>
        {dayClasses.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {dayClasses.map(({ block, course }) => {
              const on = block.id === effId;
              const isLive = curBlk?.id === block.id && !!curCourse;
              return (
                <button
                  key={block.id}
                  onClick={() => setSelectedId(block.id)}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                    on ? "border-primary bg-primary-tint text-primary" : "border-line text-ink hover:bg-surface"
                  }`}
                >
                  {isLive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                  {fmt(block.start)} · {course!.grado}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* banner de la clase */}
      <div
        className="flex flex-col gap-4 rounded-[18px] p-6 text-white sm:flex-row sm:items-center sm:justify-between"
        style={{ background: "linear-gradient(135deg, #5749F4 0%, #7C5BFF 100%)" }}
      >
        <div className="flex flex-col gap-2.5">
          <span className="flex w-fit items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[9px] font-bold tracking-[0.16em]">
            {isCurrent ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-white" /> EN CLASE AHORA
              </>
            ) : (
              <>
                <CircleDot className="h-3 w-3" /> CLASE SELECCIONADA
              </>
            )}
          </span>
          <span className="text-[30px] font-extrabold leading-none -tracking-[0.03em]">
            Grado {effCourse.grado} · {effCourse.materia}
          </span>
          <div className="flex flex-wrap items-center gap-4 text-white/80">
            <span className="flex items-center gap-1.5 text-xs font-medium"><MapPin className="h-3 w-3" /> Aula {effCourse.aula}</span>
            <span className="flex items-center gap-1.5 text-xs font-medium"><Clock className="h-3 w-3" /> {fmt(effBlock.start)} — {fmt(effBlock.end)}</span>
            <span className="flex items-center gap-1.5 text-xs font-medium"><CalendarCheck className="h-3 w-3" /> {teacher.name}</span>
            {remaining !== null && <span className="flex items-center gap-1.5 text-xs font-semibold"><Clock className="h-3 w-3" /> Faltan {remaining}′</span>}
          </div>
        </div>
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-2xl font-extrabold">
          {roster.length}
        </span>
      </div>

      {/* tabs del proceso */}
      <div className="flex items-center gap-1 border-b border-line">
        {[
          { id: "asistencia" as const, label: "Llamar a lista", icon: ListChecks },
          { id: "notas" as const, label: "Notas", icon: FileText },
        ].map((t) => {
          const Icon = t.icon;
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm transition-colors ${
                on ? "border-primary font-semibold text-ink" : "border-transparent font-medium text-subtle hover:text-ink"
              }`}
            >
              <Icon className={`h-4 w-4 ${on ? "text-primary" : ""}`} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ====== TAB: ASISTENCIA ====== */}
      {tab === "asistencia" && (
        <div className="flex flex-col gap-4">
          {/* resumen + acciones */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {(Object.keys(ESTADO) as Estado[]).map((e) => (
                <span key={e} className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${ESTADO[e].chip}`}>
                  {counts[e]} {ESTADO[e].label}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => markAll("P")} className="flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-semibold text-ink transition-colors hover:bg-surface">
                <CheckCheck className="h-3.5 w-3.5" /> Todos presentes
              </button>
              <button className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-semibold text-white transition-opacity hover:opacity-90">
                <CircleCheck className="h-3.5 w-3.5" /> Cerrar lista
              </button>
            </div>
          </div>

          <p className="text-[11px] text-subtle">
            Toca cada estudiante para cambiar su estado: Presente → Ausente → Tarde → Justificado.
          </p>

          {/* grilla de estudiantes */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {roster.map((s, i) => {
              const e = getEstado(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => cycle(s.id)}
                  className="flex items-center gap-2.5 rounded-xl border border-line bg-card px-3 py-2.5 text-left transition-colors hover:border-primary/40"
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${AVATARS[i % AVATARS.length]}`}>
                    {s.initials}
                  </span>
                  <span className="flex-1 truncate text-[13px] font-medium text-ink">{s.name}</span>
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold ${ESTADO[e].chip}`}>
                    {e}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ====== TAB: NOTAS ====== */}
      {tab === "notas" && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-card px-6 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-tint text-primary">
            <ClipboardList className="h-7 w-7" />
          </span>
          <div className="flex flex-col gap-1.5">
            <h3 className="text-base font-bold text-ink">Notas de {effCourse.grado} · {effCourse.materia}</h3>
            <p className="max-w-sm text-sm text-subtle">Abre el libro de calificaciones para registrar y editar las notas de este curso (Ser · Hacer · Saber).</p>
          </div>
          <Link href="/calificaciones" className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90">
            <FileText className="h-3.5 w-3.5" /> Abrir libro de notas
          </Link>
        </div>
      )}
    </div>
  );
}
