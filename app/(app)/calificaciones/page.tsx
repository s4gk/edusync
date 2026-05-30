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
} from "lucide-react";

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

type Evaluation = { id: string; name: string; date: string; peso: number };

type Student = {
  id: string;
  name: string;
  initials: string;
  avatar: string;
  grades: Record<string, string>; // evalId -> nota (texto)
};

const AVATARS = [
  "bg-blue-100 text-blue-700",
  "bg-amber-100 text-amber-700",
  "bg-pink-100 text-pink-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
  "bg-red-100 text-red-700",
  "bg-yellow-100 text-yellow-700",
  "bg-sky-100 text-sky-700",
  "bg-orange-100 text-orange-700",
];

const NAMES = [
  "Ana Castillo", "Bryan Méndez", "Carolina Ríos", "Daniel Ortiz", "Esteban Lozano",
  "Felipe Vargas", "Gabriela Franco", "Hugo Bermúdez", "Isabella Pérez", "Jaime Salcedo",
];

// Sin plantilla por defecto: el docente arranca con las evaluaciones que ya
// registró (acá 2 de ejemplo) y va agregando las que necesite.
const INITIAL_EVALS: Evaluation[] = [
  { id: "e1", name: "Quiz diagnóstico", date: "20 ago", peso: 30 },
  { id: "e2", name: "Taller en clase", date: "28 ago", peso: 30 },
];

const INITIAL_GRADES: Record<string, [string, string]> = {
  "Ana Castillo": ["4.5", "4.8"],
  "Bryan Méndez": ["3.9", "4.0"],
  "Carolina Ríos": ["4.9", "5.0"],
  "Daniel Ortiz": ["2.8", "3.1"],
  "Esteban Lozano": ["4.1", "4.2"],
  "Felipe Vargas": ["3.4", "3.2"],
  "Gabriela Franco": ["4.7", "4.5"],
  "Hugo Bermúdez": ["2.6", "2.9"],
  "Isabella Pérez": ["4.0", "4.2"],
  "Jaime Salcedo": ["3.5", "3.3"],
};

const INITIAL_STUDENTS: Student[] = NAMES.map((name, i) => ({
  id: `s${i}`,
  name,
  initials: name.split(" ").map((p) => p[0]).join("").slice(0, 2),
  avatar: AVATARS[i % AVATARS.length],
  grades: { e1: INITIAL_GRADES[name][0], e2: INITIAL_GRADES[name][1] },
}));

const DIST = [
  { label: "Superior", pct: 20, bar: "bg-emerald-400", chip: "bg-s-success text-s-success-fg" },
  { label: "Alto", pct: 34, bar: "bg-primary", chip: "bg-primary-tint text-primary" },
  { label: "Básico", pct: 25, bar: "bg-amber-300", chip: "bg-s-warning text-s-warning-fg" },
  { label: "Bajo", pct: 21, bar: "bg-rose-300", chip: "bg-s-error text-s-error-fg" },
];

/* ---------------- helpers ---------------- */

function num(v: string): number | null {
  const n = parseFloat(v.replace(",", "."));
  return isNaN(n) ? null : n;
}

function promedio(grades: Record<string, string>, evals: Evaluation[]): number | null {
  let sum = 0;
  let w = 0;
  for (const e of evals) {
    const v = num(grades[e.id] ?? "");
    if (v !== null) {
      sum += v * e.peso;
      w += e.peso;
    }
  }
  return w > 0 ? sum / w : null;
}

function letra(p: number | null): { txt: string; chip: string } {
  if (p === null) return { txt: "—", chip: "bg-surface text-subtle" };
  if (p >= 4.6) return { txt: "S", chip: "bg-s-success text-s-success-fg" };
  if (p >= 4.0) return { txt: "A", chip: "bg-primary-tint text-primary" };
  if (p >= 3.0) return { txt: "Bs", chip: "bg-surface text-ink" };
  return { txt: "Bj", chip: "bg-s-error text-s-error-fg" };
}

function cellClass(v: number | null): string {
  if (v === null) return "bg-transparent text-subtle placeholder:text-muted";
  if (v >= 4.5) return "bg-s-success text-s-success-fg";
  if (v < 3.0) return "bg-s-error text-s-error-fg";
  return "bg-surface text-ink";
}

/* ---------------- página ---------------- */

export default function CalificacionesPage() {
  const [evals, setEvals] = useState<Evaluation[]>(INITIAL_EVALS);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const counter = useRef(INITIAL_EVALS.length);

  const setGrade = (studentId: string, evalId: string, value: string) => {
    // permite vacío, números y un punto/coma decimal
    if (value !== "" && !/^\d{0,1}([.,]\d{0,1})?$/.test(value)) return;
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, grades: { ...s.grades, [evalId]: value } } : s))
    );
  };

  const addEval = () => {
    counter.current += 1;
    const id = `e${counter.current}`;
    setEvals((prev) => [...prev, { id, name: `Evaluación ${prev.length + 1}`, date: "", peso: 10 }]);
  };

  const removeEval = (id: string) => setEvals((prev) => prev.filter((e) => e.id !== id));

  const updateEval = (id: string, patch: Partial<Evaluation>) =>
    setEvals((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const totalPeso = evals.reduce((a, e) => a + (e.peso || 0), 0);

  const grupo = useMemo(() => {
    const proms = students.map((s) => promedio(s.grades, evals)).filter((p): p is number => p !== null);
    if (!proms.length) return null;
    return proms.reduce((a, b) => a + b, 0) / proms.length;
  }, [students, evals]);

  const enRiesgo = students.filter((s) => {
    const p = promedio(s.grades, evals);
    return p !== null && p < 3.0;
  }).length;

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
              <Upload className="h-3.5 w-3.5" />
              Importar Excel
            </button>
            <button className="flex h-9 items-center gap-2 rounded-[10px] border border-line px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">
              <History className="h-3.5 w-3.5" />
              Histórico
            </button>
            <button className="flex h-9 items-center gap-2 rounded-[10px] bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90">
              <Save className="h-3.5 w-3.5" />
              Guardar cambios
            </button>
          </div>
          <span className="flex items-center gap-1 text-[11px] text-subtle">
            <Check className="h-3 w-3 text-emerald-600" />
            autoguardado hace 12 s
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

      {/* ====== contenido ====== */}
      <div className="flex flex-col gap-5 xl:flex-row">
        {/* libro */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-card">
          {/* toolbar */}
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
            <span className="text-sm font-semibold text-ink">
              {students.length} estudiantes · {evals.length} {evals.length === 1 ? "evaluación" : "evaluaciones"}
            </span>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium ${totalPeso === 100 ? "text-emerald-600" : "text-subtle"}`}>
                Peso total: {totalPeso}%{totalPeso !== 100 && " (no suma 100)"}
              </span>
              <button
                onClick={addEval}
                className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar evaluación
              </button>
            </div>
          </div>

          {/* tabla con scroll horizontal (por si hay muchas evaluaciones) */}
          <div className="overflow-x-auto">
            <div className="min-w-max">
              {/* encabezado */}
              <div className="flex items-stretch gap-2 border-b border-line bg-surface px-5 py-2.5">
                <span className="flex w-[200px] shrink-0 items-center text-[10px] font-bold tracking-[0.1em] text-subtle">
                  ESTUDIANTE
                </span>
                {evals.map((e) => (
                  <div key={e.id} className="group flex w-[110px] shrink-0 flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <input
                        value={e.name}
                        onChange={(ev) => updateEval(e.id, { name: ev.target.value })}
                        className="w-full truncate bg-transparent text-[11px] font-bold text-ink outline-none focus:rounded focus:bg-card focus:px-1"
                        title="Nombre de la evaluación"
                      />
                      <button
                        onClick={() => removeEval(e.id)}
                        title="Quitar evaluación"
                        className="ml-1 flex h-4 w-4 shrink-0 items-center justify-center rounded text-muted opacity-0 transition-opacity hover:bg-s-error hover:text-s-error-fg group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        value={String(e.peso)}
                        onChange={(ev) => updateEval(e.id, { peso: Math.max(0, Math.min(100, parseInt(ev.target.value.replace(/\D/g, "")) || 0)) })}
                        className="w-7 rounded bg-card px-1 text-center text-[10px] font-semibold text-subtle outline-none focus:ring-1 focus:ring-primary/40"
                        title="Peso (%)"
                      />
                      <span className="text-[10px] text-muted">%</span>
                    </div>
                  </div>
                ))}
                {/* botón agregar columna */}
                <button
                  onClick={addEval}
                  title="Agregar evaluación"
                  className="flex w-10 shrink-0 items-center justify-center rounded-lg border border-dashed border-line text-subtle transition-colors hover:border-primary hover:text-primary"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <span className="flex w-[64px] shrink-0 items-center justify-end text-right text-[10px] font-bold tracking-[0.1em] text-subtle">
                  PROMEDIO
                </span>
              </div>

              {/* filas */}
              {students.map((s, i) => {
                const p = promedio(s.grades, evals);
                const l = letra(p);
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-2 px-5 py-2 ${
                      i < students.length - 1 ? "border-b border-line" : ""
                    }`}
                  >
                    <div className="flex w-[200px] shrink-0 items-center gap-2.5">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold ${s.avatar}`}>
                        {s.initials}
                      </span>
                      <span className="text-[13px] font-semibold text-ink">{s.name}</span>
                    </div>
                    {evals.map((e) => {
                      const v = num(s.grades[e.id] ?? "");
                      return (
                        <div key={e.id} className="flex w-[110px] shrink-0 justify-center">
                          <input
                            value={s.grades[e.id] ?? ""}
                            onChange={(ev) => setGrade(s.id, e.id, ev.target.value)}
                            inputMode="decimal"
                            placeholder="–"
                            className={`h-7 w-12 rounded-md text-center text-[13px] font-semibold tabular-nums outline-none transition-colors focus:ring-2 focus:ring-primary/40 ${cellClass(v)}`}
                          />
                        </div>
                      );
                    })}
                    <span className="w-10 shrink-0" />
                    <div className="flex w-[64px] shrink-0 items-center justify-end gap-1">
                      <span className={`flex items-center justify-center rounded-full px-2 py-1 text-[12px] font-bold tabular-nums ${l.chip}`}>
                        {p === null ? "—" : p.toFixed(1)}
                      </span>
                    </div>
                  </div>
                );
              })}

              {evals.length === 0 && (
                <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
                  <span className="text-sm font-semibold text-ink">Aún no hay evaluaciones</span>
                  <span className="text-xs text-subtle">Agrega la primera evaluación del periodo para empezar a calificar.</span>
                  <button onClick={addEval} className="mt-1 flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-white">
                    <Plus className="h-3.5 w-3.5" /> Agregar evaluación
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* footer */}
          <div className="flex items-center justify-between border-t border-line bg-surface px-5 py-3">
            <div className="flex items-center gap-3 text-xs">
              <span className="text-subtle">
                Promedio grupo: <span className="font-semibold text-ink">{grupo === null ? "—" : grupo.toFixed(1)}</span>
              </span>
              <span className="text-subtle">·</span>
              <span className="font-medium text-danger">{enRiesgo} en riesgo</span>
              <span className="text-subtle">·</span>
              <span className="text-subtle">{evals.length} evaluaciones</span>
            </div>
            <span className="text-[11px] text-subtle">Tip: clic en el nombre o el % de una columna para editarlo</span>
          </div>
        </div>

        {/* sidebar derecha */}
        <div className="flex w-full flex-col gap-4 xl:w-[340px] xl:shrink-0">
          {/* distribución */}
          <div className="flex flex-col gap-4 rounded-2xl border border-line bg-card p-5">
            <h3 className="text-sm font-semibold text-ink">Distribución de desempeño</h3>
            <div className="flex h-2.5 overflow-hidden rounded-full">
              {DIST.map((d) => (
                <span key={d.label} className={d.bar} style={{ width: `${d.pct}%` }} />
              ))}
            </div>
            <div className="flex flex-col gap-2">
              {DIST.map((d) => (
                <div key={d.label} className="flex items-center justify-between">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${d.chip}`}>{d.label}</span>
                  <span className="text-[13px] font-semibold text-ink">{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* riesgo */}
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-ink">Estudiantes en riesgo</h3>
              <span className="flex items-center gap-1 rounded-full bg-s-error px-1.5 py-0.5 text-[10px] font-bold text-s-error-fg">
                <AlertTriangle className="h-2.5 w-2.5" />
                {enRiesgo}
              </span>
            </div>
            {students
              .map((s) => ({ s, p: promedio(s.grades, evals) }))
              .filter((x) => x.p !== null && x.p < 3.0)
              .map(({ s, p }) => (
                <div key={s.id} className="flex items-center gap-2.5">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold ${s.avatar}`}>
                    {s.initials}
                  </span>
                  <span className="flex-1 text-[13px] font-medium text-ink">{s.name}</span>
                  <span className="text-[12px] font-bold text-danger">Promedio {p!.toFixed(1)}</span>
                </div>
              ))}
            {enRiesgo === 0 && <span className="text-xs text-subtle">Ningún estudiante por debajo de 3.0 🎉</span>}
          </div>

          {/* AI card */}
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-center gap-1.5 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold tracking-[0.18em]">EDUSYNC AI</span>
            </div>
            <h4 className="text-[13px] font-semibold text-ink">Refuerzo personalizado sugerido</h4>
            <p className="text-xs leading-relaxed text-subtle">
              Programa 3 sesiones de tutoría grupal con foco en fracciones y álgebra básica.
            </p>
            <div className="flex items-center gap-2">
              <button className="flex h-8 flex-1 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-white transition-opacity hover:opacity-90">
                Generar plan
              </button>
              <button className="flex h-8 items-center justify-center rounded-lg px-3 text-xs font-medium text-subtle hover:text-ink">
                Descartar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
