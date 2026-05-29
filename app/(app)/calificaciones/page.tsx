import {
  Upload,
  History,
  Save,
  Check,
  ChevronDown,
  Maximize2,
  RefreshCw,
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

const EVALS = [
  { code: "E1", sub: "Quiz · 20 ago", peso: "10%" },
  { code: "E2", sub: "Taller · 28 ago", peso: "10%" },
  { code: "E3", sub: "Parcial · 05 sep", peso: "20%" },
  { code: "E4", sub: "Quiz · 12 sep", peso: "10%" },
  { code: "E5", sub: "Proyecto · 22 sep", peso: "20%" },
  { code: "E6", sub: "Examen · 02 oct", peso: "30%" },
];

type Letra = "S" | "A" | "Bs" | "Bj";

type Student = {
  name: string;
  id: string;
  initials: string;
  avatar: string; // tailwind clases bg+text
  grades: number[];
  prom: number;
  letra: Letra;
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

const STUDENTS: Student[] = [
  { name: "Ana Castillo", id: "ID-1801", initials: "AC", avatar: AVATARS[0], grades: [4.0, 4.5, 4.8, 4.7, 4.9, 4.6], prom: 4.7, letra: "S" },
  { name: "Bryan Méndez", id: "ID-1802", initials: "BM", avatar: AVATARS[1], grades: [3.8, 4.0, 3.7, 4.1, 3.9, 3.9], prom: 3.9, letra: "Bs" },
  { name: "Carolina Ríos", id: "ID-1803", initials: "CR", avatar: AVATARS[2], grades: [4.8, 5.0, 4.9, 4.7, 5.0, 4.9], prom: 4.9, letra: "S" },
  { name: "Daniel Ortiz", id: "ID-1804", initials: "DO", avatar: AVATARS[3], grades: [2.5, 3.4, 2.8, 3.2, 2.6, 2.4], prom: 2.8, letra: "Bj" },
  { name: "Esteban Lozano", id: "ID-1805", initials: "EL", avatar: AVATARS[4], grades: [4.1, 4.0, 4.2, 4.6, 4.0, 4.2], prom: 4.2, letra: "A" },
  { name: "Felipe Vargas", id: "ID-1806", initials: "FV", avatar: AVATARS[5], grades: [3.2, 3.5, 3.1, 3.4, 3.3, 3.3], prom: 3.3, letra: "Bs" },
  { name: "Gabriela Franco", id: "ID-1807", initials: "GF", avatar: AVATARS[6], grades: [4.7, 4.5, 4.8, 4.0, 4.6, 4.7], prom: 4.6, letra: "S" },
  { name: "Hugo Bermúdez", id: "ID-1808", initials: "HB", avatar: AVATARS[7], grades: [2.4, 2.6, 3.3, 2.5, 2.7, 2.6], prom: 2.7, letra: "Bj" },
  { name: "Isabella Pérez", id: "ID-1809", initials: "IP", avatar: AVATARS[8], grades: [4.0, 4.2, 4.1, 3.9, 4.2, 4.1], prom: 4.1, letra: "A" },
  { name: "Jaime Salcedo", id: "ID-1810", initials: "JS", avatar: AVATARS[9], grades: [3.3, 3.5, 3.4, 3.2, 3.6, 3.4], prom: 3.4, letra: "Bs" },
];

const DIST = [
  { label: "Superior", pct: 20, bar: "bg-emerald-400", chip: "bg-s-success text-s-success-fg" },
  { label: "Alto", pct: 34, bar: "bg-primary", chip: "bg-primary-tint text-primary" },
  { label: "Básico", pct: 25, bar: "bg-amber-300", chip: "bg-s-warning text-s-warning-fg" },
  { label: "Bajo", pct: 21, bar: "bg-rose-300", chip: "bg-s-error text-s-error-fg" },
];

const RIESGO = [
  { name: "Daniel Ortiz", prom: "2.8", avatar: AVATARS[3] },
  { name: "Hugo Bermúdez", prom: "2.7", avatar: AVATARS[7] },
  { name: "Mariana Quintero", prom: "2.5", avatar: "bg-purple-100 text-purple-700" },
  { name: "Santiago Nieto", prom: "2.4", avatar: "bg-cyan-100 text-cyan-700" },
];

/* ---------------- helpers ---------------- */

function cellClass(v: number): string {
  if (v >= 4.5) return "bg-s-success text-s-success-fg";
  if (v < 3.0) return "bg-s-error text-s-error-fg";
  return "text-ink";
}

const LETRA_CHIP: Record<Letra, string> = {
  S: "bg-s-success text-s-success-fg",
  A: "bg-primary-tint text-primary",
  Bs: "bg-surface text-ink",
  Bj: "bg-s-error text-s-error-fg",
};

/* ---------------- página ---------------- */

export default function CalificacionesPage() {
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
                f.active
                  ? "bg-primary-tint text-primary"
                  : "border border-line text-ink hover:bg-surface"
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
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <span className="text-sm font-semibold text-ink">32 estudiantes · 6 evaluaciones</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-subtle">Página 1 de 1</span>
            </div>
          </div>

          {/* encabezado de columnas */}
          <div className="flex items-center gap-2 border-b border-line bg-surface px-5 py-2.5">
            <span className="flex-1 text-[10px] font-bold tracking-[0.1em] text-subtle">ESTUDIANTE</span>
            {EVALS.map((e) => (
              <div key={e.code} className="flex w-[68px] shrink-0 flex-col items-center">
                <span className="text-[11px] font-bold text-ink">{e.code}</span>
                <span className="text-[9px] text-subtle">{e.peso}</span>
              </div>
            ))}
            <span className="w-[64px] shrink-0 text-right text-[10px] font-bold tracking-[0.1em] text-subtle">
              PROMEDIO
            </span>
          </div>

          {/* filas */}
          {STUDENTS.map((s, i) => (
            <div
              key={s.id}
              className={`flex items-center gap-2 px-5 py-2.5 transition-colors hover:bg-surface/50 ${
                i < STUDENTS.length - 1 ? "border-b border-line" : ""
              }`}
            >
              <div className="flex flex-1 items-center gap-2.5">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold ${s.avatar}`}>
                  {s.initials}
                </span>
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-ink">{s.name}</span>
                  <span className="text-[11px] text-subtle">{s.id}</span>
                </div>
              </div>
              {s.grades.map((g, gi) => (
                <div key={gi} className="flex w-[68px] shrink-0 justify-center">
                  <span className={`flex h-7 w-10 items-center justify-center rounded-md text-[13px] font-semibold tabular-nums ${cellClass(g)}`}>
                    {g.toFixed(1)}
                  </span>
                </div>
              ))}
              <div className="flex w-[64px] shrink-0 justify-end">
                <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-[12px] font-bold tabular-nums ${LETRA_CHIP[s.letra]}`}>
                  {s.prom.toFixed(1)}
                </span>
              </div>
            </div>
          ))}

          {/* footer */}
          <div className="flex items-center justify-between border-t border-line bg-surface px-5 py-3">
            <div className="flex items-center gap-3 text-xs">
              <span className="text-subtle">Promedio grupo: <span className="font-semibold text-ink">3.9</span></span>
              <span className="text-subtle">·</span>
              <span className="font-medium text-danger">4 estudiantes en riesgo</span>
              <span className="text-subtle">·</span>
              <span className="text-subtle">12 ajustes sin guardar</span>
            </div>
            <button className="flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-surface">
              <RefreshCw className="h-3.5 w-3.5" />
              Recalcular
            </button>
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
                4
              </span>
            </div>
            {RIESGO.map((r) => (
              <div key={r.name} className="flex items-center gap-2.5">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold ${r.avatar}`}>
                  {r.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                </span>
                <span className="flex-1 text-[13px] font-medium text-ink">{r.name}</span>
                <span className="text-[12px] font-bold text-danger">Promedio {r.prom}</span>
              </div>
            ))}
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
