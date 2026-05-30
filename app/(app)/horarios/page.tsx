"use client";

import { useState } from "react";
import {
  CalendarRange,
  Plus,
  X,
  TriangleAlert,
  Check,
  ArrowLeft,
  ArrowRight,
  Search,
} from "lucide-react";
import { useSchedule } from "@/components/schedule-context";
import { useDismiss } from "@/components/use-dismiss";
import { BLOCKS, DAYS, COURSES, TEACHERS, fmt, slotKey, courseById } from "@/lib/schedule";

function chipStyle(color: string) {
  return { backgroundColor: `${color}22`, color };
}

export default function HorariosPage() {
  const { assignments, assign, courseFor } = useSchedule();
  const [view, setView] = useState<"list" | "grid">("list");
  const [teacherId, setTeacherId] = useState(TEACHERS[0].id);
  const [query, setQuery] = useState("");
  const [openCell, setOpenCell] = useState<string | null>(null);
  const dismissRef = useDismiss<HTMLDivElement>(openCell !== null, () => setOpenCell(null));

  const teacher = TEACHERS.find((t) => t.id === teacherId)!;

  const hoursFor = (tid: string) =>
    DAYS.reduce((a, d) => a + BLOCKS.filter((b) => assignments[slotKey(tid, d.idx, b.id)]).length, 0);

  const gradosFor = (tid: string) => {
    const set = new Set<string>();
    DAYS.forEach((d) =>
      BLOCKS.forEach((b) => {
        const c = courseById(assignments[slotKey(tid, d.idx, b.id)]);
        if (c) set.add(c.grado);
      })
    );
    return [...set];
  };

  const dayCount = (day: number) => BLOCKS.filter((b) => assignments[slotKey(teacherId, day, b.id)]).length;
  const weekCount = DAYS.reduce((a, d) => a + dayCount(d.idx), 0);
  const conflict = (day: number, block: number, courseId: string) =>
    TEACHERS.some((t) => t.id !== teacherId && assignments[slotKey(t.id, day, block)] === courseId);

  const openTeacher = (id: string) => {
    setTeacherId(id);
    setOpenCell(null);
    setView("grid");
  };

  const filtered = TEACHERS.filter(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.materia.toLowerCase().includes(query.toLowerCase())
  );
  const completos = TEACHERS.filter((t) => hoursFor(t.id) === 30).length;
  const totalHoras = TEACHERS.reduce((a, t) => a + hoursFor(t.id), 0);

  /* ---------------- VISTA LISTA (tabla de docentes) ---------------- */
  if (view === "list") {
    return (
      <div className="flex flex-col gap-5 px-8 py-7">
        <div className="flex items-end justify-between gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold tracking-[0.18em] text-primary">ACADÉMICO · ADMINISTRACIÓN</span>
            <h1 className="text-[28px] font-bold -tracking-[0.02em] text-ink">Horarios docentes</h1>
            <p className="text-[13px] text-subtle">
              Todos los docentes y su área. Abre uno para asignar sus 6 horas diarias (L–V, 6:30 a.m.–12:30 p.m.).
            </p>
          </div>
        </div>

        {/* resumen */}
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Docentes", value: String(TEACHERS.length) },
            { label: "Horarios completos", value: `${completos}/${TEACHERS.length}`, tone: completos === TEACHERS.length ? "text-emerald-600" : "text-ink" },
            { label: "Horas asignadas", value: `${totalHoras}/${TEACHERS.length * 30}` },
          ].map((k) => (
            <div key={k.label} className="flex min-w-[150px] flex-col gap-1 rounded-xl border border-line bg-card px-4 py-2.5">
              <span className="text-[11px] font-medium text-subtle">{k.label}</span>
              <span className={`text-xl font-bold leading-none ${k.tone ?? "text-ink"}`}>{k.value}</span>
            </div>
          ))}
        </div>

        {/* buscador */}
        <div className="flex h-10 w-full max-w-sm items-center gap-2 rounded-lg border border-line bg-card px-3">
          <Search className="h-4 w-4 text-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar docente o materia…"
            className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
          />
        </div>

        {/* tabla */}
        <div className="overflow-hidden rounded-2xl border border-line bg-card">
          <div className="flex items-center gap-4 border-b border-line bg-surface px-5 py-3 text-[10px] font-bold tracking-[0.1em] text-subtle">
            <span className="flex-1">DOCENTE</span>
            <span className="w-[180px]">ÁREA / MATERIA</span>
            <span className="hidden w-[220px] lg:block">GRUPOS</span>
            <span className="w-[150px]">HORAS</span>
            <span className="w-[110px]">ESTADO</span>
            <span className="w-[110px]" />
          </div>

          {filtered.map((t, i) => {
            const h = hoursFor(t.id);
            const grados = gradosFor(t.id);
            const estado = h === 30 ? "Completo" : h === 0 ? "Sin asignar" : "Incompleto";
            const estadoCls =
              h === 30 ? "bg-s-success text-s-success-fg" : h === 0 ? "bg-surface text-subtle" : "bg-s-warning text-s-warning-fg";
            return (
              <div
                key={t.id}
                className={`flex items-center gap-4 px-5 py-3 transition-colors hover:bg-surface/50 ${i < filtered.length - 1 ? "border-b border-line" : ""}`}
              >
                <div className="flex flex-1 items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-tint text-[12px] font-bold text-primary">
                    {t.initials}
                  </span>
                  <span className="text-[13px] font-semibold text-ink">{t.name}</span>
                </div>
                <div className="w-[180px]">
                  <span className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-ink">{t.materia}</span>
                </div>
                <div className="hidden w-[220px] flex-wrap gap-1 lg:flex">
                  {grados.length === 0 ? (
                    <span className="text-[11px] text-muted">—</span>
                  ) : (
                    <>
                      {grados.slice(0, 5).map((g) => (
                        <span key={g} className="rounded-md bg-surface px-1.5 py-0.5 text-[10px] font-medium text-subtle">{g}</span>
                      ))}
                      {grados.length > 5 && <span className="text-[10px] text-muted">+{grados.length - 5}</span>}
                    </>
                  )}
                </div>
                <div className="flex w-[150px] flex-col gap-1">
                  <span className="text-[12px] font-bold text-ink">{h}/30 h</span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-surface">
                    <span className={`block h-full rounded-full ${h === 30 ? "bg-emerald-500" : "bg-primary"}`} style={{ width: `${(h / 30) * 100}%` }} />
                  </span>
                </div>
                <div className="w-[110px]">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${estadoCls}`}>{estado}</span>
                </div>
                <div className="flex w-[110px] justify-end">
                  <button
                    onClick={() => openTeacher(t.id)}
                    className="flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-semibold text-ink transition-colors hover:bg-surface"
                  >
                    Ver horario <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-subtle">Sin docentes que coincidan con “{query}”.</div>
          )}
        </div>
      </div>
    );
  }

  /* ---------------- VISTA GRILLA (horario de un docente) ---------------- */
  return (
    <div className="flex flex-col gap-5 px-8 py-7">
      <div className="flex flex-col gap-3">
        <button
          onClick={() => setView("list")}
          className="flex w-fit items-center gap-1.5 text-[13px] font-semibold text-subtle transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a docentes
        </button>
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-tint text-base font-bold text-primary">
            {teacher.initials}
          </span>
          <div className="flex flex-col">
            <h1 className="text-[24px] font-bold -tracking-[0.02em] text-ink">{teacher.name}</h1>
            <span className="text-[13px] text-subtle">{teacher.materia} · {weekCount}/30 horas asignadas</span>
          </div>
        </div>
      </div>

      {/* grilla */}
      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <span className="text-sm font-semibold text-ink">Horario semanal</span>
          <span className={`text-xs font-medium ${weekCount === 30 ? "text-emerald-600" : "text-subtle"}`}>
            {weekCount}/30 horas asignadas
          </span>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[820px]">
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
                    <div key={day.idx} ref={isOpen ? dismissRef : undefined} className="relative border-r border-line p-1.5 last:border-r-0">
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
