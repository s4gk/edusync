import {
  Upload,
  FileUp,
  Download,
  UserPlus,
  TrendingUp,
  SlidersHorizontal,
  RefreshCw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  MoreHorizontal,
} from "lucide-react";

/* ---------------- datos ---------------- */

type Tone = "success" | "info" | "primary" | "warning" | "muted";

const CHIP: Record<Tone, string> = {
  success: "bg-s-success text-s-success-fg",
  info: "bg-s-info text-s-info-fg",
  primary: "bg-primary-tint text-primary",
  warning: "bg-s-warning text-s-warning-fg",
  muted: "bg-surface text-subtle",
};

const SPARK: Record<Tone, { soft: string; strong: string }> = {
  success: { soft: "bg-emerald-200", strong: "bg-emerald-500" },
  info: { soft: "bg-blue-200", strong: "bg-blue-500" },
  primary: { soft: "bg-primary-tint", strong: "bg-primary" },
  warning: { soft: "bg-amber-200", strong: "bg-amber-500" },
  muted: { soft: "bg-line-soft", strong: "bg-subtle" },
};

type Kpi = {
  label: string;
  value: string;
  chip: string;
  tone: Tone;
  trend?: boolean;
  bars: number[];
};

const KPIS: Kpi[] = [
  { label: "TOTAL USUARIOS", value: "3.012", chip: "+47", tone: "success", trend: true, bars: [10, 14, 8, 18] },
  { label: "ESTUDIANTES", value: "1.284", chip: "42,6%", tone: "info", bars: [8, 12, 16, 18] },
  { label: "DOCENTES", value: "86", chip: "2,9%", tone: "primary", bars: [14, 10, 18, 16] },
  { label: "ACUDIENTES", value: "1.642", chip: "54,5%", tone: "warning", bars: [12, 14, 18, 16] },
  { label: "ACTIVOS HOY", value: "1.847", chip: "+12%", tone: "success", trend: true, bars: [8, 14, 12, 18] },
];

const TABS = [
  { label: "Todos", count: "3.012", active: true },
  { label: "Estudiantes", count: "1.284" },
  { label: "Docentes", count: "86" },
  { label: "Acudientes", count: "1.642" },
  { label: "Administrativos", count: "14" },
];

const FILTERS = ["Estado: Activos", "Grado: Todos", "Última conexión: 7d"];

type Estado = "Activo" | "Pendiente" | "Inactivo";

type Row = {
  name: string;
  id: string;
  initials: string;
  avatar: Tone;
  role: string;
  roleTone: Tone;
  grade: string;
  email: string;
  estado: Estado;
  last: string;
  checked?: boolean;
};

const ROWS: Row[] = [
  { name: "Camila Restrepo", id: "ID-1824", initials: "CR", avatar: "info", role: "Estudiante", roleTone: "info", grade: "8°B", email: "camila.restrepo@edusync.co", estado: "Activo", last: "hace 12 min", checked: true },
  { name: "Carlos Ríos", id: "ID-0042", initials: "CR", avatar: "primary", role: "Docente", roleTone: "primary", grade: "Matemáticas", email: "carlos.rios@edusync.co", estado: "Activo", last: "hoy 07:48" },
  { name: "Jhon Pérez", id: "ID-A327", initials: "JP", avatar: "warning", role: "Acudiente", roleTone: "warning", grade: "—", email: "jhon.perez@gmail.com", estado: "Pendiente", last: "ayer 16:22" },
  { name: "Mariana Gómez", id: "ID-1142", initials: "MG", avatar: "info", role: "Estudiante", roleTone: "info", grade: "Pre-Jardín", email: "mariana.gomez@edusync.co", estado: "Activo", last: "hace 1 h" },
  { name: "Diana Castaño", id: "ID-0014", initials: "DC", avatar: "success", role: "Coordinador", roleTone: "success", grade: "Coordinación", email: "diana.castano@edusync.co", estado: "Activo", last: "hace 3 d" },
  { name: "Felipe Holguín", id: "ID-0078", initials: "FH", avatar: "primary", role: "Docente", roleTone: "primary", grade: "Ciencias Naturales", email: "felipe.holguin@edusync.co", estado: "Inactivo", last: "hace 14 d" },
  { name: "Andrea Mejía", id: "ID-0102", initials: "AM", avatar: "muted", role: "Administrativo", roleTone: "muted", grade: "Secretaría", email: "andrea.mejia@edusync.co", estado: "Activo", last: "hace 4 min" },
  { name: "Sebastián Vargas", id: "ID-2241", initials: "SV", avatar: "info", role: "Estudiante", roleTone: "info", grade: "11°A", email: "sebastian.vargas@edusync.co", estado: "Pendiente", last: "hace 30 min" },
];

const ESTADO: Record<Estado, { chip: string; dot: string }> = {
  Activo: { chip: "bg-s-success text-s-success-fg", dot: "bg-emerald-600" },
  Pendiente: { chip: "bg-s-warning text-s-warning-fg", dot: "bg-amber-700" },
  Inactivo: { chip: "bg-surface text-subtle", dot: "bg-muted" },
};

/* ---------------- helpers ---------------- */

function Spark({ tone, bars }: { tone: Tone; bars: number[] }) {
  const c = SPARK[tone];
  return (
    <div className="flex items-end gap-[3px]" style={{ height: 18 }}>
      {bars.map((h, i) => (
        <span
          key={i}
          className={`w-1.5 rounded-sm ${i === bars.length - 1 ? c.strong : c.soft}`}
          style={{ height: h }}
        />
      ))}
    </div>
  );
}

/* ---------------- página ---------------- */

export default function UsuariosPage() {
  return (
    <div className="flex flex-col gap-6 px-8 py-7">
      {/* ====== Page header ====== */}
      <div className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold tracking-[0.18em] text-primary">PERSONAS</span>
          <h1 className="text-[28px] font-bold -tracking-[0.02em] text-ink">Gestión de usuarios</h1>
          <p className="text-[13px] text-subtle">
            1.284 estudiantes · 86 docentes · 1.642 acudientes registrados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink transition-colors hover:bg-surface">
            <Upload className="h-3.5 w-3.5" />
          </button>
          <button className="flex h-9 items-center gap-2 rounded-lg border border-line px-3.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface">
            <FileUp className="h-3.5 w-3.5" />
            Importar CSV
          </button>
          <button className="flex h-9 items-center gap-2 rounded-lg border border-line px-3.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface">
            <Download className="h-3.5 w-3.5" />
            Exportar
          </button>
          <button className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90">
            <UserPlus className="h-3.5 w-3.5" />
            Invitar usuario
          </button>
        </div>
      </div>

      {/* ====== KPI row ====== */}
      <div className="flex gap-3">
        {KPIS.map((k) => (
          <div
            key={k.label}
            className="flex flex-1 flex-col gap-2 rounded-2xl border border-line bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wide text-subtle">{k.label}</span>
              <span className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${CHIP[k.tone]}`}>
                {k.trend && <TrendingUp className="h-2.5 w-2.5" />}
                {k.chip}
              </span>
            </div>
            <span className="text-2xl font-bold text-ink">{k.value}</span>
            <Spark tone={k.tone} bars={k.bars} />
          </div>
        ))}
      </div>

      {/* ====== Toolbar (tabs + filtros) ====== */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-full bg-surface p-1">
          {TABS.map((t) => (
            <button
              key={t.label}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors ${
                t.active
                  ? "border border-line bg-card font-semibold text-ink"
                  : "font-medium text-subtle hover:text-ink"
              }`}
            >
              {t.label}
              <span className={`rounded-full px-1.5 py-px text-[10px] font-bold ${
                t.active ? "bg-primary text-white" : "bg-line-soft text-subtle"
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-surface"
            >
              {f}
              <ChevronDown className="h-3 w-3 text-subtle" />
            </button>
          ))}
          <span className="h-5 w-px bg-line" />
          <button className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-line text-ink transition-colors hover:bg-surface">
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
          <button className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-line text-ink transition-colors hover:bg-surface">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ====== Tabla ====== */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
        {/* barra de acciones */}
        <div className="flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full bg-primary-tint px-2.5 py-1 text-[11px] font-bold text-primary">
              3 seleccionados
              <X className="h-2.5 w-2.5" />
            </span>
            <button className="text-xs font-medium text-ink hover:text-primary">Asignar grupo</button>
            <button className="text-xs font-medium text-ink hover:text-primary">Cambiar rol</button>
            <button className="text-xs font-medium text-danger hover:underline">Desactivar</button>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-subtle">Mostrando 1–10 de 3.012</span>
            <button className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-line text-subtle transition-colors hover:bg-surface">
              <ChevronLeft className="h-3 w-3" />
            </button>
            <button className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-line text-ink transition-colors hover:bg-surface">
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* header de columnas */}
        <div className="flex items-center gap-4 border-y border-line bg-surface px-5 py-3">
          <span className="flex h-[18px] w-[18px] items-center justify-center rounded border border-line" />
          <span className="flex flex-1 items-center gap-1 text-[11px] font-bold tracking-[0.1em] text-subtle">
            USUARIO <ChevronDown className="h-2.5 w-2.5" />
          </span>
          <span className="w-[120px] text-[11px] font-bold tracking-[0.1em] text-subtle">ROL</span>
          <span className="w-[140px] text-[11px] font-bold tracking-[0.1em] text-subtle">GRADO / CARGO</span>
          <span className="w-[220px] text-[11px] font-bold tracking-[0.1em] text-subtle">CORREO</span>
          <span className="w-[110px] text-[11px] font-bold tracking-[0.1em] text-subtle">ESTADO</span>
          <span className="flex w-[130px] items-center gap-1 text-[11px] font-bold tracking-[0.1em] text-subtle">
            ÚLTIMA CONEXIÓN <ChevronDown className="h-2.5 w-2.5" />
          </span>
          <span className="w-6" />
        </div>

        {/* filas */}
        {ROWS.map((r, i) => {
          const est = ESTADO[r.estado];
          return (
            <div
              key={r.id}
              className={`flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface/50 ${
                i < ROWS.length - 1 ? "border-b border-line" : ""
              }`}
            >
              {/* checkbox */}
              <span
                className={`flex h-[18px] w-[18px] items-center justify-center rounded ${
                  r.checked ? "bg-primary" : "border border-line"
                }`}
              >
                {r.checked && <Check className="h-3 w-3 text-white" />}
              </span>
              {/* usuario */}
              <div className="flex flex-1 items-center gap-2.5">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold ${CHIP[r.avatar]}`}>
                  {r.initials}
                </span>
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-ink">{r.name}</span>
                  <span className="text-[11px] text-subtle">{r.id}</span>
                </div>
              </div>
              {/* rol */}
              <div className="w-[120px]">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${CHIP[r.roleTone]}`}>
                  {r.role}
                </span>
              </div>
              {/* grado/cargo */}
              <span className="w-[140px] truncate text-[13px] font-medium text-ink">{r.grade}</span>
              {/* correo */}
              <span className="w-[220px] truncate text-[13px] text-subtle">{r.email}</span>
              {/* estado */}
              <div className="w-[110px]">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${est.chip}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${est.dot}`} />
                  {r.estado}
                </span>
              </div>
              {/* última conexión */}
              <span className="w-[130px] text-[13px] text-subtle">{r.last}</span>
              {/* acción */}
              <button className="flex w-6 items-center justify-center text-subtle hover:text-ink">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
