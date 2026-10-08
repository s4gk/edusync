"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MapPin, Clock, CalendarCheck, BookOpen, ClipboardList, CalendarRange, CircleDot, Coffee, MoonStar, Loader2,
} from "lucide-react";
import { useSchedule } from "@/components/schedule-context";
import { useAuth } from "@/components/auth-context";
import { RemindersCard } from "@/components/reminders-card";
import { BLOCKS, DAYS, currentBlock, blockStatus, fmt, timeToMin } from "@/lib/schedule";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const initialsOf = (name: string) => name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

const STATUS_CHIP: Record<string, { label: string; cls: string }> = {
  done: { label: "Terminada", cls: "bg-surface text-subtle" },
  current: { label: "En curso", cls: "bg-s-success text-s-success-fg" },
  upcoming: { label: "Próxima", cls: "bg-s-info text-s-info-fg" },
  next: { label: "Próxima", cls: "bg-s-info text-s-info-fg" },
};

export default function ProfesorPage() {
  const { teachers, loadingTeachers, currentTeacherId, setCurrentTeacherId, loadTeacher, courseFor } = useSchedule();
  const { user } = useAuth();

  // Un docente ve SU propia jornada (anclado por userId); admin/coordinador
  // pueden navegar entre docentes con el selector.
  const isTeacherUser = user?.role === "TEACHER";
  const myTeacher = teachers.find((t) => t.userId === user?.id);
  const teacher = isTeacherUser
    ? myTeacher ?? null
    : teachers.find((t) => t.id === currentTeacherId) ?? null;
  const tid = teacher?.id ?? "";

  // Mantiene el contexto sincronizado con la identidad del docente (lo usan
  // también /clase y el horario), y carga sus slots.
  useEffect(() => {
    if (isTeacherUser && myTeacher && currentTeacherId !== myTeacher.id) {
      setCurrentTeacherId(myTeacher.id);
    }
  }, [isTeacherUser, myTeacher, currentTeacherId, setCurrentTeacherId]);

  useEffect(() => { if (tid) loadTeacher(tid); }, [tid, loadTeacher]);

  const [now, setNow] = useState<Date | null>(null);
  const [pickedDay, setPickedDay] = useState<number | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const todayIdx = now ? now.getDay() : 0;
  const school = todayIdx >= 1 && todayIdx <= 5;
  const viewDay = school ? todayIdx : 1;
  const dayMeta = DAYS.find((d) => d.idx === viewDay)!;
  const nowMin = now ? now.getHours() * 60 + now.getMinutes() : -1;

  const dateLabel = now
    ? school ? cap(now.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })) : `${dayMeta.label} · próximo día de clases`
    : "…";

  const dayClasses = BLOCKS.map((block) => ({ block, course: courseFor(tid, viewDay, block.id), status: blockStatus(block, now ?? new Date(0), school) }));
  const totalHoy = dayClasses.filter((c) => c.course).length;

  // Día que se está viendo (libre: cualquier día Lun–Vie). El estado en vivo solo aplica a hoy.
  const effDay = pickedDay ?? viewDay;
  const effDayMeta = DAYS.find((d) => d.idx === effDay)!;
  const isToday = effDay === todayIdx && school;
  const viewClasses = BLOCKS.map((block) => ({ block, course: courseFor(tid, effDay, block.id), status: isToday ? blockStatus(block, now ?? new Date(0), school) : "" }));
  const totalView = viewClasses.filter((c) => c.course).length;

  const curBlk = school && now ? currentBlock(now) : null;
  const curCourse = curBlk ? courseFor(tid, viewDay, curBlk.id) : undefined;
  const nextItem = !curCourse && school && now ? dayClasses.find((c) => c.course && timeToMin(c.block.start) > nowMin) : undefined;

  let heroMode: "current" | "next" | "free" | "weekend" = "weekend";
  if (curCourse) heroMode = "current";
  else if (nextItem) heroMode = "next";
  else if (school) heroMode = "free";

  const heroBlock = curBlk ?? nextItem?.block ?? null;
  const heroCourse = curCourse ?? nextItem?.course ?? undefined;
  const remaining = curBlk && nowMin >= 0 ? timeToMin(curBlk.end) - nowMin : null;
  const startsIn = nextItem && nowMin >= 0 ? timeToMin(nextItem.block.start) - nowMin : null;

  if (loadingTeachers) {
    return (
      <div className="flex items-center justify-center gap-2 px-8 py-24 text-sm text-subtle">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
      </div>
    );
  }
  if (!teacher) {
    return (
      <div className="flex items-center justify-center px-8 py-24 text-sm text-subtle">
        {isTeacherUser
          ? "No encontramos tu ficha de docente. Contacta a coordinación."
          : "No hay docentes registrados."}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-7 py-6">
      {/* header */}
      <div className="flex items-end justify-between gap-6">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-tint text-base font-bold text-primary">{initialsOf(teacher.name)}</span>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-[0.18em] text-primary">VISTA DEL DOCENTE</span>
            <h1 className="text-[24px] font-bold -tracking-[0.02em] text-ink">{teacher.name}</h1>
            <span className="text-[13px] text-subtle">{teacher.groups.join(", ") || "Sin grupos"} · {totalHoy} {totalHoy === 1 ? "clase" : "clases"} hoy</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isTeacherUser && (
            <select value={currentTeacherId} onChange={(e) => setCurrentTeacherId(e.target.value)} className="h-9 rounded-lg border border-line bg-card px-3 text-[13px] font-semibold text-ink outline-none">
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
          <Link href="/horarios" className="flex h-9 items-center gap-2 rounded-lg border border-line px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">
            <CalendarRange className="h-3.5 w-3.5" /> Horario completo
          </Link>
        </div>
      </div>

      {/* hero */}
      <div className="flex flex-col gap-5 rounded-[18px] p-6 text-white lg:flex-row lg:items-center lg:gap-6" style={{ background: "var(--grad-primary)" }}>
        {heroCourse && heroBlock ? (
          <>
            <div className="flex w-[150px] flex-col gap-1.5">
              <span className="flex w-fit items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[9px] font-bold tracking-[0.16em]">
                {heroMode === "current" ? <><span className="h-1.5 w-1.5 rounded-full bg-white" /> EN CLASE AHORA</> : <><CircleDot className="h-3 w-3" /> PRÓXIMA CLASE</>}
              </span>
              <span className="text-4xl font-extrabold -tracking-[0.04em]">{heroMode === "current" ? `${remaining}′` : `${startsIn}′`}</span>
              <span className="text-[10px] font-medium text-white/70">{heroMode === "current" ? "para terminar" : "para empezar"}</span>
            </div>
            <div className="flex flex-1 flex-col gap-3">
              <span className="text-[11px] font-bold tracking-[0.14em] text-white/80">{heroCourse.materia.toUpperCase()}</span>
              <span className="text-[34px] font-extrabold leading-none -tracking-[0.03em]">{heroCourse.grado}</span>
              <div className="flex flex-wrap items-center gap-4 text-white/80">
                <span className="flex items-center gap-1.5 text-xs font-medium"><MapPin className="h-3 w-3" /> Aula {heroCourse.aula}</span>
                <span className="flex items-center gap-1.5 text-xs font-medium"><Clock className="h-3 w-3" /> {fmt(heroBlock.start)} — {fmt(heroBlock.end)}</span>
                <span className="flex items-center gap-1.5 text-xs font-medium"><CalendarCheck className="h-3 w-3" /> {heroBlock.label}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/clase" className="flex items-center justify-center gap-2 rounded-[10px] bg-white px-4 py-2.5 text-[13px] font-bold text-primary transition-opacity hover:opacity-90"><CalendarCheck className="h-3.5 w-3.5" /> Tomar asistencia</Link>
              <Link href="/calificaciones" className="flex items-center justify-center gap-2 rounded-[10px] border border-white/40 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10"><BookOpen className="h-3.5 w-3.5" /> Calificar</Link>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">{heroMode === "weekend" ? <MoonStar className="h-6 w-6" /> : <Coffee className="h-6 w-6" />}</span>
            <div className="flex flex-col">
              <span className="text-xl font-bold">{heroMode === "weekend" ? "Fin de semana" : "No tienes clase ahora"}</span>
              <span className="text-sm text-white/80">{heroMode === "weekend" ? "Tus clases se retoman el lunes. Abajo ves el horario del lunes." : "Terminaste tu jornada de hoy. ¡Buen trabajo!"}</span>
            </div>
          </div>
        )}
      </div>

      {/* clases del día (libre: cualquier día) */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {DAYS.map((d) => {
            const on = effDay === d.idx;
            const isTodayPill = d.idx === todayIdx && school;
            return (
              <button key={d.idx} onClick={() => setPickedDay(d.idx)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${on ? "border-primary bg-primary/10 text-primary" : "border-line text-subtle hover:bg-surface"}`}>
                {isTodayPill && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                {d.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-ink">{isToday ? "Tus clases de hoy" : `Clases del ${effDayMeta.label.toLowerCase()}`}</span>
          <span className="text-xs text-subtle">{totalView} {totalView === 1 ? "clase" : "clases"} · 6:30 a.m. – 12:30 p.m.</span>
        </div>
        <div className="flex flex-col gap-2.5">
          {viewClasses.map(({ block, course, status }) => {
            const sChip = status ? (STATUS_CHIP[status] ?? STATUS_CHIP.upcoming) : null;
            if (!course) {
              return (
                <div key={block.id} className="flex items-center gap-4 rounded-xl border border-dashed border-line bg-card px-4 py-3">
                  <div className="flex w-[64px] flex-col"><span className="text-[13px] font-bold text-subtle">{fmt(block.start)}</span><span className="text-[10px] text-muted">{block.label}</span></div>
                  <span className="text-[13px] font-medium text-muted">Hora libre</span>
                </div>
              );
            }
            const isNow = status === "current";
            return (
              <div key={block.id} className={`flex flex-col gap-3 rounded-xl border bg-card px-4 py-3 sm:flex-row sm:items-center ${isNow ? "border-primary ring-1 ring-primary/30" : "border-line"} ${status === "done" ? "opacity-70" : ""}`}>
                <div className="flex w-[64px] shrink-0 flex-col"><span className={`text-[15px] font-extrabold ${isNow ? "text-primary" : "text-ink"}`}>{fmt(block.start)}</span><span className="text-[10px] text-subtle">{block.label}</span></div>
                <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: course.color }} />
                <div className="flex flex-1 flex-col"><span className="text-[14px] font-bold text-ink">{course.grado} · {course.materia}</span><span className="text-[11px] text-subtle">Aula {course.aula} · {fmt(block.start)} – {fmt(block.end)}</span></div>
                {sChip && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${sChip.cls}`}>{sChip.label}</span>}
                <div className="flex items-center gap-1.5">
                  <Link href="/clase" className="flex h-8 items-center gap-1.5 rounded-lg border border-line px-2.5 text-[11px] font-semibold text-ink transition-colors hover:bg-surface"><CalendarCheck className="h-3.5 w-3.5" /> Asistencia</Link>
                  <Link href="/calificaciones" className="flex h-8 items-center gap-1.5 rounded-lg border border-line px-2.5 text-[11px] font-semibold text-ink transition-colors hover:bg-surface"><ClipboardList className="h-3.5 w-3.5" /> Calificar</Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <RemindersCard />
    </div>
  );
}
