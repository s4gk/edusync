"use client";

import { useState } from "react";
import { CalendarRange, Plus, X, TriangleAlert, Check } from "lucide-react";
import { useSchedule } from "@/components/schedule-context";
import { useDismiss } from "@/components/use-dismiss";
import { BLOCKS, DAYS, COURSES, TEACHERS, fmt, slotKey } from "@/lib/schedule";

function chipStyle(color: string) {
  return { backgroundColor: `${color}22`, color };
}

export default function HorariosPage() {
  const { assignments, assign, courseFor } = useSchedule();
  const [teacherId, setTeacherId] = useState(TEACHERS[0].id);
  const [openCell, setOpenCell] = useState<string | null>(null);
  const dismissRef = useDismiss<HTMLDivElement>(openCell !== null, () => setOpenCell(null));

  const teacher = TEACHERS.find((t) => t.id === teacherId)!;

  const dayCount = (day: number) => BLOCKS.filter((b) => assignments[slotKey(teacherId, day, b.id)]).length;
  const weekCount = DAYS.reduce((a, d) => a + dayCount(d.idx), 0);
  const hoursFor = (tid: string) =>
    DAYS.reduce((a, d) => a + BLOCKS.filter((b) => assignments[slotKey(tid, d.idx, b.id)]).length, 0);

  const conflict = (day: number, block: number, courseId: string) =>
    TEACHERS.some((t) => t.id !== teacherId && assignments[slotKey(t.id, day, block)] === courseId);

  return (
    <div className="flex flex-col gap-5 px-8 py-7">
      {/* header */}
      <div className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold tracking-[0.18em] text-primary">ACADÉMICO · ADMINISTRACIÓN</span>
          <h1 className="text-[28px] font-bold -tracking-[0.02em] text-ink">Asignación de horarios</h1>
          <p className="text-[13px] text-subtle">
            Asigna los cursos de cada docente · 6 horas diarias · lunes a viernes, 6:30 a.m. – 12:30 p.m.
          </p>
        </div>
      </div>

      {/* selector de profesor */}
      <div className="flex flex-wrap items-center gap-2">
        {TEACHERS.map((t) => {
          const on = t.id === teacherId;
          const h = hoursFor(t.id);
          return (
            <button
              key={t.id}
              onClick={() => {
                setTeacherId(t.id);
                setOpenCell(null);
              }}
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 transition-colors ${
                on ? "border-primary bg-primary-tint" : "border-line bg-card hover:bg-surface"
              }`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-[11px] font-bold text-ink">
                {t.initials}
              </span>
              <span className="flex flex-col items-start">
                <span className={`text-[13px] font-semibold ${on ? "text-primary" : "text-ink"}`}>{t.name}</span>
                <span className="text-[10px] text-subtle">{t.materia}</span>
              </span>
              <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${h === 30 ? "bg-s-success text-s-success-fg" : "bg-surface text-subtle"}`}>
                {h}/30 h
              </span>
            </button>
          );
        })}
      </div>

      {/* grilla */}
      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <span className="text-sm font-semibold text-ink">
            Horario semanal · <span className="text-primary">{teacher.name}</span>
          </span>
          <span className={`text-xs font-medium ${weekCount === 30 ? "text-emerald-600" : "text-subtle"}`}>
            {weekCount}/30 horas asignadas
          </span>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[820px]">
            {/* encabezado de días */}
            <div className="grid grid-cols-[120px_repeat(5,1fr)] border-b border-line bg-surface">
              <div className="border-r border-line px-3 py-3 text-[10px] font-bold tracking-[0.1em] text-subtle">HORA</div>
              {DAYS.map((d) => {
                const c = dayCount(d.idx);
                return (
                  <div key={d.idx} className="flex items-center justify-between border-r border-line px-3 py-3 last:border-r-0">
                    <span className="text-[13px] font-bold text-ink">{d.label}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${c === 6 ? "bg-s-success text-s-success-fg" : "bg-s-warning text-s-warning-fg"}`}>
                      {c}/6
                    </span>
                  </div>
                );
              })}
            </div>

            {/* filas por bloque */}
            {BLOCKS.map((block) => (
              <div key={block.id} className="grid grid-cols-[120px_repeat(5,1fr)] border-b border-line last:border-b-0">
                <div className="flex flex-col justify-center border-r border-line px-3 py-2">
                  <span className="text-[12px] font-semibold text-ink">{block.label}</span>
                  <span className="text-[10px] text-subtle">{fmt(block.start)} – {fmt(block.end)}</span>
                </div>
                {DAYS.map((day) => {
                  const course = courseFor(teacherId, day.idx, block.id);
                  const key = slotKey(teacherId, day.idx, block.id);
                  const isOpen = openCell === key;
                  const isConflict = course ? conflict(day.idx, block.id, course.id) : false;
                  return (
                    <div
                      key={day.idx}
                      ref={isOpen ? dismissRef : undefined}
                      className="relative border-r border-line p-1.5 last:border-r-0"
                    >
                      {course ? (
                        <button
                          onClick={() => setOpenCell(isOpen ? null : key)}
                          style={chipStyle(course.color)}
                          className="flex w-full flex-col items-start gap-0.5 rounded-lg px-2.5 py-2 text-left transition-opacity hover:opacity-90"
                        >
                          <span className="flex w-full items-center justify-between gap-1">
                            <span className="text-[12px] font-bold">{course.grado}</span>
                            {isConflict && <TriangleAlert className="h-3 w-3 text-danger" />}
                          </span>
                          <span className="text-[10px] opacity-90">{course.materia}</span>
                          <span className="text-[10px] opacity-70">Aula {course.aula}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setOpenCell(isOpen ? null : key)}
                          className="flex h-full min-h-[58px] w-full items-center justify-center gap-1 rounded-lg border border-dashed border-line text-[11px] font-medium text-muted transition-colors hover:border-primary hover:text-primary"
                        >
                          <Plus className="h-3.5 w-3.5" /> Asignar
                        </button>
                      )}

                      {isOpen && (
                        <div className="absolute left-1.5 top-full z-30 mt-1 flex max-h-[280px] w-60 flex-col overflow-y-auto rounded-xl border border-line bg-card p-1.5 shadow-2xl">
                          <button
                            onClick={() => {
                              assign(teacherId, day.idx, block.id, null);
                              setOpenCell(null);
                            }}
                            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12px] font-medium text-danger transition-colors hover:bg-s-error/30"
                          >
                            <X className="h-3.5 w-3.5" /> Sin clase
                          </button>
                          <div className="my-1 h-px bg-line" />
                          {COURSES.map((c) => {
                            const sel = course?.id === c.id;
                            return (
                              <button
                                key={c.id}
                                onClick={() => {
                                  assign(teacherId, day.idx, block.id, c.id);
                                  setOpenCell(null);
                                }}
                                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${sel ? "bg-surface" : "hover:bg-surface/60"}`}
                              >
                                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                                <span className="flex flex-1 flex-col">
                                  <span className="text-[12px] font-semibold text-ink">{c.materia} · {c.grado}</span>
                                  <span className="text-[10px] text-subtle">Aula {c.aula}</span>
                                </span>
                                {sel && <Check className="h-3.5 w-3.5 text-primary" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-line bg-surface px-5 py-2.5 text-[11px] text-subtle">
          <CalendarRange className="h-3.5 w-3.5" />
          Toca una celda para asignar o cambiar el curso. <TriangleAlert className="ml-1 inline h-3 w-3 text-danger" /> marca un cruce con otro docente en la misma hora.
        </div>
      </div>
    </div>
  );
}
