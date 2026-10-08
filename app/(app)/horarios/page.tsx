"use client";

import { useEffect, useState } from "react";
import {
  CalendarRange, Plus, X, Check, ArrowLeft, ArrowRight, Search, Clock, MapPin, Coffee, MoonStar, Sunrise, CircleDot, Loader2,
} from "lucide-react";
import { useSchedule } from "@/components/schedule-context";
import { useDismiss } from "@/components/use-dismiss";
import { BLOCKS, DAYS, fmt, currentBlock, blockStatus, timeToMin, isSchoolDay, colorFor } from "@/lib/schedule";

type Role = "admin" | "profesor";
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const chipStyle = (color: string) => ({ backgroundColor: `${color}22`, color });
const initialsOf = (name: string) => name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

function RoleToggle({ role, setRole }: { role: Role; setRole: (r: Role) => void }) {
  return (
    <div className="flex gap-0.5 rounded-lg bg-surface p-1">
      {(["admin", "profesor"] as const).map((r) => (
        <button key={r} onClick={() => setRole(r)} className={`rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors ${role === r ? "bg-card text-ink shadow-card" : "text-subtle hover:text-ink"}`}>
          {r === "admin" ? "Administración" : "Profesor"}
        </button>
      ))}
    </div>
  );
}

export default function HorariosPage() {
  const { teachers, loadingTeachers, currentTeacherId, setCurrentTeacherId, loadTeacher, courseFor, assign, removeSlot } = useSchedule();
  const [role, setRole] = useState<Role>("admin");
  const [view, setView] = useState<"list" | "grid">("list");
  const [teacherId, setTeacherId] = useState("");
  const [now, setNow] = useState<Date | null>(null);
  const [query, setQuery] = useState("");
  const [openCell, setOpenCell] = useState<string | null>(null);
  const [busyCell, setBusyCell] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const dismissRef = useDismiss<HTMLDivElement>(openCell !== null, () => setOpenCell(null));

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { if (view === "grid" && teacherId) loadTeacher(teacherId); }, [view, teacherId, loadTeacher]);
  useEffect(() => { if (role === "profesor" && currentTeacherId) loadTeacher(currentTeacherId); }, [role, currentTeacherId, loadTeacher]);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3500); };

  const teacher = teachers.find((t) => t.id === teacherId) ?? null;
  const dayCount = (day: number) => BLOCKS.filter((b) => courseFor(teacherId, day, b.id)).length;
  const weekCount = DAYS.reduce((a, d) => a + dayCount(d.idx), 0);

  const openTeacher = (id: string) => { setTeacherId(id); setOpenCell(null); setView("grid"); };

  const filtered = teachers.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()) || t.groups.join(" ").toLowerCase().includes(query.toLowerCase()));

  const doAssign = async (subjectId: string, day: number, block: number) => {
    const key = `${day}|${block}`;
    setBusyCell(key); setOpenCell(null);
    const err = await assign(teacherId, subjectId, day, block);
    setBusyCell(null);
    if (err) flash(err);
  };
  const doRemove = async (slotId: string, day: number, block: number) => {
    const key = `${day}|${block}`;
    setBusyCell(key); setOpenCell(null);
    await removeSlot(teacherId, slotId);
    setBusyCell(null);
  };

  if (loadingTeachers) {
    return <div className="flex items-center justify-center gap-2 px-8 py-24 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Cargando horarios…</div>;
  }

  /* ---------------- VISTA PROFESOR (solo lectura) ---------------- */
  if (role === "profesor") {
    const me = teachers.find((t) => t.id === currentTeacherId) ?? null;
    const school = now ? isSchoolDay(now) : false;
    const todayIdx = now ? now.getDay() : 1;
    const nowMin = now ? now.getHours() * 60 + now.getMinutes() : -1;
    const dayLabel = DAYS.find((d) => d.idx === todayIdx)?.label ?? "";
    const firstStart = timeToMin(BLOCKS[0].start);
    const lastEnd = timeToMin(BLOCKS[BLOCKS.length - 1].end);
    const curBlock = now && school ? currentBlock(now) : null;
    const curCourse = curBlock && me ? courseFor(me.id, todayIdx, curBlock.id) : undefined;
    const minsLeft = curBlock ? timeToMin(curBlock.end) - nowMin : 0;
    const blockPct = curBlock ? ((nowMin - timeToMin(curBlock.start)) / (timeToMin(curBlock.end) - timeToMin(curBlock.start))) * 100 : 0;
    const todayBlocks = me ? BLOCKS.map((b) => ({ block: b, course: courseFor(me.id, todayIdx, b.id) })) : [];
    const totalToday = todayBlocks.filter((x) => x.course).length;

    let heroState: "loading" | "weekend" | "before" | "after" | "free" | "class" = "loading";
    if (now) {
      if (!school) heroState = "weekend";
      else if (nowMin < firstStart) heroState = "before";
      else if (nowMin >= lastEnd) heroState = "after";
      else if (curCourse) heroState = "class";
      else heroState = "free";
    }

    return (
      <div className="flex flex-col gap-5 px-8 py-7">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-tint text-base font-bold text-primary">{me ? initialsOf(me.name) : "—"}</span>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold tracking-[0.18em] text-primary">MI HORARIO</span>
              <h1 className="text-[24px] font-bold -tracking-[0.02em] text-ink">{me?.name ?? "Docente"}</h1>
              <span className="text-[13px] text-subtle">{me?.groups.join(", ")}{now && school ? ` · ${cap(dayLabel)}, ${totalToday} ${totalToday === 1 ? "clase" : "clases"} hoy` : ""}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select value={currentTeacherId} onChange={(e) => setCurrentTeacherId(e.target.value)} className="h-9 rounded-lg border border-line bg-card px-3 text-[13px] font-semibold text-ink outline-none">
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <RoleToggle role={role} setRole={setRole} />
          </div>
        </div>

        {heroState === "class" && curBlock && curCourse ? (
          <div className="flex flex-col gap-4 rounded-2xl p-6 text-white" style={{ background: "var(--grad-primary)" }}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[10px] font-bold tracking-[0.16em]"><CircleDot className="h-3 w-3" /> AHORA · {curBlock.label}</span>
              <span className="text-[12px] font-semibold text-white/80">{fmt(curBlock.start)} – {fmt(curBlock.end)}</span>
            </div>
            <div className="flex flex-col gap-1"><h2 className="text-[30px] font-bold leading-none">{curCourse.grado}</h2><span className="text-[15px] font-medium text-white/85">{curCourse.materia}</span></div>
            <div className="flex flex-wrap items-center gap-4 text-[13px] text-white/80">
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> Aula {curCourse.aula}</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Termina en {minsLeft} min</span>
            </div>
            <span className="h-1.5 overflow-hidden rounded-full bg-white/20"><span className="block h-full rounded-full bg-white" style={{ width: `${blockPct}%` }} /></span>
          </div>
        ) : (
          <div className="flex items-center gap-4 rounded-2xl border border-line bg-card p-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface text-subtle">{heroState === "weekend" ? <MoonStar className="h-5 w-5" /> : heroState === "before" ? <Sunrise className="h-5 w-5" /> : heroState === "after" ? <MoonStar className="h-5 w-5" /> : <Coffee className="h-5 w-5" />}</span>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-bold tracking-[0.16em] text-subtle">AHORA</span>
              <span className="text-[17px] font-bold text-ink">
                {heroState === "loading" && "Cargando tu horario…"}{heroState === "weekend" && "Hoy no hay clases"}{heroState === "before" && "La jornada aún no empieza"}{heroState === "after" && "Jornada terminada por hoy"}{heroState === "free" && "Hora libre"}
              </span>
              <span className="text-[13px] text-subtle">
                {heroState === "weekend" && "Disfruta tu fin de semana. Tu próxima jornada es el lunes."}
                {heroState === "before" && `Tu primera hora es a las ${fmt(BLOCKS[0].start)}.`}
                {heroState === "after" && `Mañana retomas a las ${fmt(BLOCKS[0].start)}.`}
                {heroState === "free" && curBlock && `Tienes este bloque sin clase. Sigue a las ${fmt(curBlock.end)}.`}
                {heroState === "loading" && "Un momento…"}
              </span>
            </div>
          </div>
        )}

        {/* grilla semanal solo lectura */}
        <div className="overflow-hidden rounded-2xl border border-line bg-card">
          <div className="flex items-center justify-between border-b border-line px-5 py-3"><span className="text-sm font-semibold text-ink">Mi horario semanal</span><span className="text-xs text-subtle">Lunes a viernes · 6:30 a.m. – 12:30 p.m.</span></div>
          <div className="overflow-x-auto"><div className="min-w-[820px]">
            <div className="grid grid-cols-[120px_repeat(5,1fr)] border-b border-line bg-surface">
              <div className="border-r border-line px-3 py-3 text-[10px] font-bold tracking-[0.1em] text-subtle">HORA</div>
              {DAYS.map((d) => { const isToday = school && d.idx === todayIdx; return <div key={d.idx} className={`border-r border-line px-3 py-3 last:border-r-0 ${isToday ? "bg-primary/10" : ""}`}><span className={`text-[13px] font-bold ${isToday ? "text-primary" : "text-ink"}`}>{d.label}</span></div>; })}
            </div>
            {BLOCKS.map((block) => (
              <div key={block.id} className="grid grid-cols-[120px_repeat(5,1fr)] border-b border-line last:border-b-0">
                <div className="flex flex-col justify-center border-r border-line px-3 py-2"><span className="text-[12px] font-semibold text-ink">{block.label}</span><span className="text-[10px] text-subtle">{fmt(block.start)} – {fmt(block.end)}</span></div>
                {DAYS.map((day) => {
                  const course = me ? courseFor(me.id, day.idx, block.id) : undefined;
                  const isNow = school && day.idx === todayIdx && curBlock?.id === block.id;
                  const isToday = school && day.idx === todayIdx;
                  return (
                    <div key={day.idx} className={`min-h-[58px] border-r border-line p-1.5 last:border-r-0 ${isToday ? "bg-primary/[0.04]" : ""} ${isNow ? "ring-1 ring-inset ring-primary" : ""}`}>
                      {course ? (
                        <div className="flex h-full flex-col justify-center gap-0.5 rounded-lg px-2 py-1.5" style={chipStyle(course.color)}>
                          <span className="text-[12px] font-bold leading-tight">{course.grado}</span><span className="text-[10px] leading-tight opacity-80">{course.materia}</span><span className="text-[9px] leading-tight opacity-70">Aula {course.aula}</span>
                        </div>
                      ) : <div className="flex h-full items-center justify-center text-[10px] text-muted">Libre</div>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div></div>
        </div>
      </div>
    );
  }

  /* ---------------- VISTA LISTA ---------------- */
  if (view === "list") {
    return (
      <div className="flex flex-col gap-5 px-8 py-7">
        <div className="flex items-end justify-between gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold tracking-[0.18em] text-primary">ACADÉMICO · ADMINISTRACIÓN</span>
            <h1 className="text-[28px] font-bold -tracking-[0.02em] text-ink">Horarios docentes</h1>
            <p className="text-[13px] text-subtle">Todos los docentes y su carga. Abre uno para asignar sus horas (L–V, 6:30 a.m.–12:30 p.m.).</p>
          </div>
          <RoleToggle role={role} setRole={setRole} />
        </div>

        <div className="flex h-10 w-full max-w-sm items-center gap-2 rounded-lg border border-line bg-card px-3">
          <Search className="h-4 w-4 text-subtle" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar docente o grupo…" className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted" />
        </div>

        <div className="overflow-hidden rounded-2xl border border-line bg-card">
          <div className="flex items-center gap-4 border-b border-line bg-surface px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.08em] text-subtle">
            <span className="flex-1">Docente</span><span className="hidden w-[240px] lg:block">Grupos</span><span className="w-[170px]">Carga horaria</span><span className="w-[120px]">Estado</span><span className="w-[140px]" />
          </div>
          {filtered.map((t, i) => {
            const h = t.assignedHours;
            const estado = h >= 30 ? "Completo" : h === 0 ? "Sin asignar" : "Asignado";
            const estadoCls = h >= 30 ? "bg-s-success text-s-success-fg" : h === 0 ? "bg-surface text-subtle" : "bg-s-warning text-s-warning-fg";
            return (
              <div key={t.id} className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-surface/50 ${i < filtered.length - 1 ? "border-b border-line" : ""}`}>
                <div className="flex flex-1 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-tint text-[13px] font-bold text-primary">{initialsOf(t.name)}</span>
                  <div className="flex flex-col"><span className="text-[15px] font-semibold text-ink">{t.name}</span><span className="text-[12px] text-subtle">{t.subjects.length} materias</span></div>
                </div>
                <div className="hidden w-[240px] flex-wrap gap-1.5 lg:flex">
                  {t.groups.length === 0 ? <span className="text-[13px] text-muted">—</span> : <>{t.groups.slice(0, 5).map((g) => <span key={g} className="rounded-md bg-surface px-2 py-0.5 text-[12px] font-medium text-subtle">{g}</span>)}{t.groups.length > 5 && <span className="self-center text-[12px] font-medium text-muted">+{t.groups.length - 5}</span>}</>}
                </div>
                <div className="flex w-[170px] flex-col gap-1.5">
                  <span className="text-[13px] font-bold text-ink">{h}<span className="font-medium text-subtle">/30 h</span></span>
                  <span className="h-2 overflow-hidden rounded-full bg-surface"><span className={`block h-full rounded-full ${h >= 30 ? "bg-emerald-500" : "bg-primary"}`} style={{ width: `${Math.min(100, (h / 30) * 100)}%` }} /></span>
                </div>
                <div className="w-[120px]"><span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${estadoCls}`}>{estado}</span></div>
                <div className="flex w-[140px] justify-end">
                  <button onClick={() => openTeacher(t.id)} className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border border-line px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">Ver horario <ArrowRight className="h-4 w-4 shrink-0" /></button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <div className="px-6 py-10 text-center text-[15px] text-subtle">Sin docentes que coincidan con “{query}”.</div>}
        </div>
      </div>
    );
  }

  /* ---------------- VISTA GRILLA (editable) ---------------- */
  return (
    <div className="flex flex-col gap-5 px-8 py-7">
      <div className="flex flex-col gap-3">
        <button onClick={() => setView("list")} className="flex w-fit items-center gap-1.5 text-[13px] font-semibold text-subtle transition-colors hover:text-ink"><ArrowLeft className="h-4 w-4" /> Volver a docentes</button>
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-tint text-base font-bold text-primary">{teacher ? initialsOf(teacher.name) : "—"}</span>
          <div className="flex flex-col"><h1 className="text-[24px] font-bold -tracking-[0.02em] text-ink">{teacher?.name ?? "Docente"}</h1><span className="text-[13px] text-subtle">{teacher?.subjects.length ?? 0} materias · {weekCount} horas asignadas</span></div>
        </div>
      </div>

      {toast && <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-s-warning px-4 py-2.5 text-[13px] font-medium text-s-warning-fg"><X className="h-4 w-4" /> {toast}</div>}

      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        <div className="flex items-center justify-between border-b border-line px-5 py-3"><span className="text-sm font-semibold text-ink">Horario semanal</span><span className="text-xs font-medium text-subtle">{weekCount} horas asignadas</span></div>
        <div className="overflow-x-auto"><div className="min-w-[820px]">
          <div className="grid grid-cols-[120px_repeat(5,1fr)] border-b border-line bg-surface">
            <div className="border-r border-line px-3 py-3 text-[10px] font-bold tracking-[0.1em] text-subtle">HORA</div>
            {DAYS.map((d) => { const c = dayCount(d.idx); return <div key={d.idx} className="flex items-center justify-between border-r border-line px-3 py-3 last:border-r-0"><span className="text-[13px] font-bold text-ink">{d.label}</span><span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${c === 6 ? "bg-s-success text-s-success-fg" : "bg-s-warning text-s-warning-fg"}`}>{c}/6</span></div>; })}
          </div>
          {BLOCKS.map((block) => (
            <div key={block.id} className="grid grid-cols-[120px_repeat(5,1fr)] border-b border-line last:border-b-0">
              <div className="flex flex-col justify-center border-r border-line px-3 py-2"><span className="text-[12px] font-semibold text-ink">{block.label}</span><span className="text-[10px] text-subtle">{fmt(block.start)} – {fmt(block.end)}</span></div>
              {DAYS.map((day) => {
                const course = courseFor(teacherId, day.idx, block.id);
                const key = `${day.idx}|${block.id}`;
                const isOpen = openCell === key;
                const isBusy = busyCell === key;
                return (
                  <div key={day.idx} ref={isOpen ? dismissRef : undefined} className="relative border-r border-line p-1.5 last:border-r-0">
                    {isBusy ? (
                      <div className="flex h-full min-h-[58px] items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-subtle" /></div>
                    ) : course ? (
                      <button onClick={() => setOpenCell(isOpen ? null : key)} style={chipStyle(course.color)} className="flex w-full flex-col items-start gap-0.5 rounded-lg px-2.5 py-2 text-left transition-opacity hover:opacity-90">
                        <span className="text-[12px] font-bold">{course.grado}</span><span className="text-[10px] opacity-90">{course.materia}</span><span className="text-[10px] opacity-70">Aula {course.aula}</span>
                      </button>
                    ) : (
                      <button onClick={() => setOpenCell(isOpen ? null : key)} className="flex h-full min-h-[58px] w-full items-center justify-center gap-1 rounded-lg border border-dashed border-line text-[11px] font-medium text-muted transition-colors hover:border-primary hover:text-primary"><Plus className="h-3.5 w-3.5" /> Asignar</button>
                    )}
                    {isOpen && (
                      <div className="absolute left-1.5 top-full z-30 mt-1 flex max-h-[280px] w-64 flex-col overflow-y-auto rounded-xl border border-line bg-card p-1.5 shadow-2xl">
                        {course && (
                          <>
                            <button onClick={() => doRemove(course.slotId, day.idx, block.id)} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12px] font-medium text-danger transition-colors hover:bg-s-error/30"><X className="h-3.5 w-3.5" /> Quitar clase</button>
                            <div className="my-1 h-px bg-line" />
                          </>
                        )}
                        {(teacher?.subjects ?? []).length === 0 && <span className="px-2.5 py-2 text-[12px] text-subtle">Este docente no tiene materias.</span>}
                        {(teacher?.subjects ?? []).map((s) => {
                          const sel = course?.subjectId === s.id;
                          const col = colorFor(s.name);
                          return (
                            <button key={s.id} onClick={() => doAssign(s.id, day.idx, block.id)} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${sel ? "bg-surface" : "hover:bg-surface/60"}`}>
                              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: col }} />
                              <span className="flex flex-1 flex-col"><span className="text-[12px] font-semibold text-ink">{s.name}</span><span className="text-[10px] text-subtle">{s.gradeGroup.name}</span></span>
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
        </div></div>
        <div className="flex items-center gap-2 border-t border-line bg-surface px-5 py-2.5 text-[11px] text-subtle"><CalendarRange className="h-3.5 w-3.5" /> Toca una celda para asignar una de las materias del docente. El sistema evita cruces de grupo y de docente automáticamente.</div>
      </div>
    </div>
  );
}
