"use client";

import { useMemo, useRef, useState } from "react";
import {
  Upload,
  History,
  Save,
  Check,
  ChevronDown,
  Maximize2,
  Plus,
  X,
  Sparkles,
  AlertTriangle,
  Heart,
  Hammer,
  BookOpen,
  type LucideIcon,
} from "lucide-react";

/* ---------------- dimensiones ---------------- */

type Dim = "ser" | "hacer" | "saber";

const DIMS: { id: Dim; label: string; weight: number; icon: LucideIcon; accent: string }[] = [
  { id: "ser", label: "Ser", weight: 0.3, icon: Heart, accent: "text-rose-500" },
  { id: "hacer", label: "Hacer", weight: 0.4, icon: Hammer, accent: "text-primary" },
  { id: "saber", label: "Saber", weight: 0.3, icon: BookOpen, accent: "text-sky-500" },
];

/* ---------------- datos ---------------- */

const FILTERS = [
  { label: "Año: 2025" },
  { label: "Grado: 8°B" },
  { label: "Materia: Matemáticas", active: true },
  { label: "Periodo: P2" },
  { label: "Docente: C. Ríos" },
];

const VIEW_TABS = [
  { label: "Notas", active: true },
  { label: "Comentarios" },
  { label: "Asistencia" },
];

type Evaluation = { id: string; dim: Dim; name: string };

type Student = {
  id: string;
  name: string;
  initials: string;
  avatar: string;
  grades: Record<string, string>;
};

const AVATARS = [
  "bg-blue-100 text-blue-700", "bg-amber-100 text-amber-700", "bg-pink-100 text-pink-700",
  "bg-emerald-100 text-emerald-700", "bg-violet-100 text-violet-700", "bg-teal-100 text-teal-700",
  "bg-red-100 text-red-700", "bg-yellow-100 text-yellow-700", "bg-sky-100 text-sky-700", "bg-orange-100 text-orange-700",
];

const NAMES = [
  "Ana Castillo", "Bryan Méndez", "Carolina Ríos", "Daniel Ortiz", "Esteban Lozano",
  "Felipe Vargas", "Gabriela Franco", "Hugo Bermúdez", "Isabella Pérez", "Jaime Salcedo",
];

const INITIAL_EVALS: Evaluation[] = [
  { id: "ser1", dim: "ser", name: "Autoevaluación" },
  { id: "ser2", dim: "ser", name: "Actitud y convivencia" },
  { id: "hac1", dim: "hacer", name: "Taller práctico" },
  { id: "hac2", dim: "hacer", name: "Proyecto" },
  { id: "sab1", dim: "saber", name: "Quiz" },
  { id: "sab2", dim: "saber", name: "Parcial" },
];

const BASES = [4.6, 3.9, 4.9, 2.9, 4.1, 3.3, 4.5, 2.7, 4.0, 3.4];
const OFFSETS: Record<string, number> = { ser1: 0.2, ser2: 0.1, hac1: 0.1, hac2: -0.2, sab1: 0.0, sab2: -0.1 };
const clampNote = (v: number) => Math.max(2.0, Math.min(5.0, v));

const INITIAL_STUDENTS: Student[] = NAMES.map((name, i) => ({
  id: `s${i}`,
  name,
  initials: name.split(" ").map((p) => p[0]).join("").slice(0, 2),
  avatar: AVATARS[i % AVATARS.length],
  grades: Object.fromEntries(INITIAL_EVALS.map((e) => [e.id, clampNote(BASES[i] + (OFFSETS[e.id] ?? 0)).toFixed(1)])),
}));

const DIST = [
  { label: "Superior", pct: 20, bar: "bg-emerald-400" },
  { label: "Alto", pct: 34, bar: "bg-primary" },
  { label: "Básico", pct: 25, bar: "bg-amber-300" },
  { label: "Bajo", pct: 21, bar: "bg-rose-300" },
];

/* ---------------- cálculo ---------------- */

function num(v: string): number | null {
  const n = parseFloat(v.replace(",", "."));
  return isNaN(n) ? null : n;
}

function dimAvg(grades: Record<string, string>, evals: Evaluation[], dim: Dim): number | null {
  const vals = evals.filter((e) => e.dim === dim).map((e) => num(grades[e.id] ?? "")).filter((v): v is number => v !== null);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function definitiva(grades: Record<string, string>, evals: Evaluation[]): number | null {
  let acc = 0;
  let w = 0;
  for (const d of DIMS) {
    const a = dimAvg(grades, evals, d.id);
    if (a !== null) {
      acc += a * d.weight;
      w += d.weight;
    }
  }
  return w > 0 ? acc / w : null;
}

function letra(p: number | null): { txt: string; chip: string } {
  if (p === null) return { txt: "—", chip: "bg-surface text-subtle" };
  if (p >= 4.6) return { txt: "S", chip: "bg-s-success text-s-success-fg" };
  if (p >= 4.0) return { txt: "A", chip: "bg-primary-tint text-primary" };
  if (p >= 3.0) return { txt: "Bs", chip: "bg-surface text-ink" };
  return { txt: "Bj", chip: "bg-s-error text-s-error-fg" };
}

function cellClass(v: number | null): string {
  if (v === null) return "bg-transparent text-subtle";
  if (v >= 4.5) return "bg-s-success text-s-success-fg";
  if (v < 3.0) return "bg-s-error text-s-error-fg";
  return "bg-surface text-ink";
}

function pillClass(v: number | null): string {
  if (v === null) return "bg-surface text-subtle";
  if (v >= 4.5) return "bg-s-success text-s-success-fg";
  if (v < 3.0) return "bg-s-error text-s-error-fg";
  return "bg-primary-tint text-primary";
}

/* ---------------- página ---------------- */

export default function CalificacionesPage() {
  const [evals, setEvals] = useState<Evaluation[]>(INITIAL_EVALS);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [activeDim, setActiveDim] = useState<Dim>("hacer");
  const counter = useRef(0);

  const activeEvals = evals.filter((e) => e.dim === activeDim);
  const activeMeta = DIMS.find((d) => d.id === activeDim)!;

  const setGrade = (studentId: string, evalId: string, value: string) => {
    if (value !== "" && !/^\d{0,1}([.,]\d{0,1})?$/.test(value)) return;
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, grades: { ...s.grades, [evalId]: value } } : s))
    );
  };

  const addEval = () => {
    counter.current += 1;
    const id = `${activeDim}-n${counter.current}`;
    setEvals((prev) => [...prev, { id, dim: activeDim, name: `Nueva nota` }]);
  };

  const removeEval = (id: string) => setEvals((prev) => prev.filter((e) => e.id !== id));
  const updateEval = (id: string, name: string) =>
    setEvals((prev) => prev.map((e) => (e.id === id ? { ...e, name } : e)));

  const grupo = useMemo(() => {
    const ds = students.map((s) => definitiva(s.grades, evals)).filter((p): p is number => p !== null);
    return ds.length ? ds.reduce((a, b) => a + b, 0) / ds.length : null;
  }, [students, evals]);

  const enRiesgo = students.filter((s) => {
    const p = definitiva(s.grades, evals);
    return p !== null && p < 3.0;
  });

  return (
    <div className="flex flex-col gap-5 px-8 py-7">
      {/* ====== header ====== */}
      <div className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold tracking-[0.18em] text-primary">ACADÉMICO</span>
          <h1 className="text-[28px] font-bold -tracking-[0.02em] text-ink">Libro de calificaciones</h1>
          <p className="text-[13px] text-subtle">Matemáticas · 8°B · Periodo 2 · Prof. Carlos Ríos</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2.5">
            <button className="flex h-9 items-center gap-2 rounded-[10px] border border-line px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">
              <Upload className="h-3.5 w-3.5" /> Importar Excel
            </button>
            <button className="flex h-9 items-center gap-2 rounded-[10px] border border-line px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">
              <History className="h-3.5 w-3.5" /> Histórico
            </button>
            <button className="flex h-9 items-center gap-2 rounded-[10px] bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90">
              <Save className="h-3.5 w-3.5" /> Guardar cambios
            </button>
          </div>
          <span className="flex items-center gap-1 text-[11px] text-subtle">
            <Check className="h-3 w-3 text-emerald-600" /> autoguardado hace 12 s
          </span>
        </div>
      </div>

      {/* ====== filter bar ====== */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card px-3 py-2.5">
        <div className="flex items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.label}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                f.active ? "bg-primary-tint text-primary" : "border border-line text-ink hover:bg-surface"
              }`}
            >
              {f.label}
              <ChevronDown className="h-3 w-3 opacity-70" />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-lg bg-surface p-1">
            {VIEW_TABS.map((t) => (
              <button
                key={t.label}
                className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                  t.active ? "bg-card font-semibold text-ink" : "font-medium text-subtle hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink transition-colors hover:bg-surface">
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ====== resumen compacto (franja) ====== */}
      <div className="flex flex-wrap items-stretch gap-3">
        {/* definitiva grupo */}
        <div className="flex min-w-[136px] flex-col justify-center gap-1 rounded-xl border border-line bg-card px-4 py-2.5">
          <span className="text-[11px] font-medium text-subtle">Definitiva grupo</span>
          <span className="text-2xl font-bold leading-none text-ink">{grupo === null ? "—" : grupo.toFixed(1)}</span>
        </div>
        {/* en riesgo */}
        <div
          title={enRiesgo.length ? enRiesgo.map((s) => s.name).join(", ") : "Ninguno"}
          className="flex min-w-[120px] flex-col justify-center gap-1 rounded-xl border border-line bg-card px-4 py-2.5"
        >
          <span className="flex items-center gap-1 text-[11px] font-medium text-subtle">
            <AlertTriangle className="h-3 w-3 text-danger" /> En riesgo
          </span>
          <span className="text-2xl font-bold leading-none text-danger">{enRiesgo.length}</span>
        </div>
        {/* distribución mini */}
        <div className="flex min-w-[240px] flex-[2] flex-col justify-center gap-1.5 rounded-xl border border-line bg-card px-4 py-2.5">
          <span className="text-[11px] font-medium text-subtle">Distribución de desempeño</span>
          <div className="flex h-2 overflow-hidden rounded-full">
            {DIST.map((d) => (
              <span key={d.label} className={d.bar} style={{ width: `${d.pct}%` }} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
            {DIST.map((d) => (
              <span key={d.label} className="flex items-center gap-1.5 text-[10px] text-subtle">
                <span className={`h-2 w-2 rounded-full ${d.bar}`} />
                {d.label} <span className="font-semibold text-ink">{d.pct}%</span>
              </span>
            ))}
          </div>
        </div>
        {/* AI banner */}
        <div className="flex min-w-[260px] flex-[2] items-center gap-3 rounded-xl border border-line bg-surface px-4 py-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-tint text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="flex flex-1 flex-col">
            <span className="text-[10px] font-bold tracking-[0.16em] text-primary">EDUSYNC AI</span>
            <span className="text-xs leading-snug text-ink">Refuerzo sugerido: tutoría grupal en fracciones y álgebra.</span>
          </div>
          <button className="flex h-8 shrink-0 items-center rounded-lg bg-primary px-3 text-xs font-semibold text-white transition-opacity hover:opacity-90">
            Generar plan
          </button>
        </div>
      </div>

      {/* ====== libro (ancho completo) ====== */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
        {/* tabs de dimensión */}
        <div className="flex flex-col gap-3 border-b border-line p-4">
          <div className="flex items-center gap-2">
            {DIMS.map((d) => {
              const Icon = d.icon;
              const count = evals.filter((e) => e.dim === d.id).length;
              const on = activeDim === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setActiveDim(d.id)}
                  className={`flex flex-1 items-center justify-center gap-2.5 rounded-xl border px-4 py-3 transition-colors ${
                    on ? "border-primary bg-primary-tint" : "border-line bg-card hover:bg-surface"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${on ? "text-primary" : d.accent}`} />
                  <div className="flex flex-col items-start">
                    <span className={`text-sm font-bold ${on ? "text-primary" : "text-ink"}`}>{d.label}</span>
                    <span className="text-[11px] text-subtle">{count} {count === 1 ? "nota" : "notas"}</span>
                  </div>
                  <span className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${on ? "bg-primary text-white" : "bg-surface text-subtle"}`}>
                    {Math.round(d.weight * 100)}%
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-subtle">
              Editando <span className="font-semibold text-ink">{activeMeta.label}</span> · las notas de esta sección promedian y pesan {Math.round(activeMeta.weight * 100)}% en la definitiva
            </span>
            <button
              onClick={addEval}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" /> Agregar nota a {activeMeta.label}
            </button>
          </div>
        </div>

        {/* tabla */}
        <div className="overflow-x-auto">
          <div className="min-w-max">
            <div className="flex items-stretch gap-2 border-b border-line bg-surface px-5 py-2.5">
              <span className="flex w-[190px] shrink-0 items-center text-[10px] font-bold tracking-[0.1em] text-subtle">ESTUDIANTE</span>
              {activeEvals.map((e) => (
                <div key={e.id} className="group flex w-[108px] shrink-0 items-center gap-1">
                  <input
                    value={e.name}
                    onChange={(ev) => updateEval(e.id, ev.target.value)}
                    className="w-full truncate bg-transparent text-[11px] font-bold text-ink outline-none focus:rounded focus:bg-card focus:px-1"
                    title="Nombre de la nota"
                  />
                  <button
                    onClick={() => removeEval(e.id)}
                    title="Quitar nota"
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-muted opacity-0 transition-opacity hover:bg-s-error hover:text-s-error-fg group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={addEval}
                title={`Agregar nota a ${activeMeta.label}`}
                className="flex w-9 shrink-0 items-center justify-center rounded-lg border border-dashed border-line text-subtle transition-colors hover:border-primary hover:text-primary"
              >
                <Plus className="h-4 w-4" />
              </button>
              <span className="flex w-[70px] shrink-0 items-center justify-end text-right text-[10px] font-bold tracking-[0.1em] text-subtle">
                PROM·{activeMeta.label.toUpperCase()}
              </span>
              <span className="flex w-[60px] shrink-0 items-center justify-end text-right text-[10px] font-bold tracking-[0.1em] text-ink">DEFINITIVA</span>
            </div>

            {students.map((s, i) => {
              const da = dimAvg(s.grades, evals, activeDim);
              const def = definitiva(s.grades, evals);
              const l = letra(def);
              return (
                <div key={s.id} className={`flex items-center gap-2 px-5 py-2 ${i < students.length - 1 ? "border-b border-line" : ""}`}>
                  <div className="flex w-[190px] shrink-0 items-center gap-2.5">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold ${s.avatar}`}>{s.initials}</span>
                    <span className="text-[13px] font-semibold text-ink">{s.name}</span>
                  </div>
                  {activeEvals.map((e) => {
                    const v = num(s.grades[e.id] ?? "");
                    return (
                      <div key={e.id} className="flex w-[108px] shrink-0 justify-center">
                        <input
                          value={s.grades[e.id] ?? ""}
                          onChange={(ev) => setGrade(s.id, e.id, ev.target.value)}
                          inputMode="decimal"
                          placeholder="–"
                          className={`h-7 w-12 rounded-md text-center text-[13px] font-semibold tabular-nums outline-none transition-colors placeholder:text-muted focus:ring-2 focus:ring-primary/40 ${cellClass(v)}`}
                        />
                      </div>
                    );
                  })}
                  <span className="w-9 shrink-0" />
                  <div className="flex w-[70px] shrink-0 justify-end">
                    <span className={`rounded-full px-2 py-1 text-[12px] font-bold tabular-nums ${pillClass(da)}`}>
                      {da === null ? "—" : da.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex w-[60px] shrink-0 items-center justify-end gap-1">
                    <span className={`rounded-full px-2 py-1 text-[12px] font-bold tabular-nums ${l.chip}`}>
                      {def === null ? "—" : def.toFixed(1)}
                    </span>
                  </div>
                </div>
              );
            })}

            {activeEvals.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
                <span className="text-sm font-semibold text-ink">Sin notas en {activeMeta.label} todavía</span>
                <span className="text-xs text-subtle">Agrega la primera nota de esta sección.</span>
                <button onClick={addEval} className="mt-1 flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-white">
                  <Plus className="h-3.5 w-3.5" /> Agregar nota a {activeMeta.label}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* footer */}
        <div className="flex items-center justify-between border-t border-line bg-surface px-5 py-3">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-subtle">Definitiva grupo: <span className="font-semibold text-ink">{grupo === null ? "—" : grupo.toFixed(1)}</span></span>
            <span className="text-subtle">·</span>
            <span className="font-medium text-danger">{enRiesgo.length} en riesgo</span>
            <span className="text-subtle">·</span>
            <span className="text-subtle">Ser 30 · Hacer 40 · Saber 30</span>
          </div>
          <span className="text-[11px] text-subtle">Cambia de sección arriba para calificar Ser / Hacer / Saber</span>
        </div>
      </div>
    </div>
  );
}
