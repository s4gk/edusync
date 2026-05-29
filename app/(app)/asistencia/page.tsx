import {
  ChevronDown,
  QrCode,
  CircleCheck,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Clock3,
  FileCheck,
  LayoutGrid,
  List,
  CheckCheck,
  Eraser,
  SlidersHorizontal,
} from "lucide-react";

/* ---------------- datos ---------------- */

type Tone = "success" | "error" | "warning" | "info";

const TONE: Record<Tone, { chip: string; bar: string; icon: string }> = {
  success: { chip: "bg-s-success text-s-success-fg", bar: "bg-emerald-400", icon: "text-emerald-600" },
  error: { chip: "bg-s-error text-s-error-fg", bar: "bg-rose-400", icon: "text-rose-600" },
  warning: { chip: "bg-s-warning text-s-warning-fg", bar: "bg-amber-400", icon: "text-amber-600" },
  info: { chip: "bg-s-info text-s-info-fg", bar: "bg-blue-400", icon: "text-blue-600" },
};

const DAYS = [
  { d: "L", n: "20", pct: "98%" },
  { d: "M", n: "21", pct: "96%" },
  { d: "M", n: "22", pct: "94%" },
  { d: "J", n: "23", today: true },
  { d: "V", n: "24" },
  { d: "S", n: "25", weekend: true },
  { d: "D", n: "26", weekend: true },
];

const STATS = [
  { label: "Presentes", value: "28", foot: "87,5%", tone: "success" as Tone, icon: TrendingUp, bars: [10, 14, 12, 16, 18] },
  { label: "Ausentes", value: "2", foot: "6,3%", tone: "error" as Tone, icon: TrendingDown, bars: [16, 12, 14, 8, 6] },
  { label: "Tardanzas", value: "1", foot: "3,1%", tone: "warning" as Tone, icon: Clock3, bars: [8, 10, 6, 9, 7] },
  { label: "Justificadas", value: "1", foot: "3,1%", tone: "info" as Tone, icon: FileCheck, bars: [6, 8, 7, 9, 8] },
];

const CLASSES = [
  { label: "Matemáticas · 1ª hora", active: true },
  { label: "Lengua · 2ª hora" },
  { label: "Ciencias · 3ª hora" },
  { label: "Artes · 4ª hora" },
  { label: "Educación física · 5ª hora" },
];

type Estado = "P" | "A" | "T" | "J";

const ESTADO: Record<Estado, { chip: string }> = {
  P: { chip: "bg-s-success text-s-success-fg" },
  A: { chip: "bg-s-error text-s-error-fg" },
  T: { chip: "bg-s-warning text-s-warning-fg" },
  J: { chip: "bg-s-info text-s-info-fg" },
};

const AVATARS = [
  "bg-blue-100 text-blue-700",
  "bg-amber-100 text-amber-700",
  "bg-pink-100 text-pink-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
  "bg-orange-100 text-orange-700",
  "bg-sky-100 text-sky-700",
];

const ROSTER: { name: string; estado: Estado }[] = [
  { name: "Mariana A.", estado: "P" }, { name: "Juan B.", estado: "P" }, { name: "Lucía R.", estado: "P" }, { name: "Diego P.", estado: "P" }, { name: "Ana S.", estado: "P" },
  { name: "Sofía H.", estado: "A" }, { name: "Mateo G.", estado: "P" }, { name: "Valeria C.", estado: "P" }, { name: "Tomás Q.", estado: "P" }, { name: "Camila D.", estado: "P" },
  { name: "Samuel L.", estado: "P" }, { name: "Isabela M.", estado: "P" }, { name: "Andrés T.", estado: "T" }, { name: "Daniela V.", estado: "P" }, { name: "Nicolás F.", estado: "P" },
  { name: "Laura J.", estado: "P" }, { name: "Felipe O.", estado: "P" }, { name: "Gabriela N.", estado: "P" }, { name: "Sebastián R.", estado: "P" }, { name: "Antonia M.", estado: "P" },
  { name: "David E.", estado: "P" }, { name: "Paula Z.", estado: "P" }, { name: "Emilio C.", estado: "A" }, { name: "Sara B.", estado: "P" }, { name: "Martín G.", estado: "P" },
  { name: "Valentina P.", estado: "J" }, { name: "Pablo R.", estado: "P" }, { name: "Renata S.", estado: "P" }, { name: "Julián A.", estado: "P" }, { name: "Salomé D.", estado: "P" },
  { name: "Esteban C.", estado: "P" }, { name: "Manuela V.", estado: "P" },
];

function initials(name: string) {
  const parts = name.replace(".", "").split(" ");
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

/* ---------------- página ---------------- */

export default function AsistenciaPage() {
  return (
    <div className="flex flex-col gap-3.5 px-7 py-5">
      {/* ====== header ====== */}
      <div className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold tracking-[0.18em] text-primary">OPERACIONES</span>
          <h1 className="text-[28px] font-bold text-ink">Asistencia diaria</h1>
          <p className="text-[13px] text-subtle">Jueves 23 de mayo · Sesión de la mañana · 32 estudiantes</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-9 items-center gap-2 rounded-full bg-primary px-3.5 text-xs font-semibold text-white">
            Hoy <span className="opacity-80">23 may</span>
            <ChevronDown className="h-3 w-3" />
          </button>
          <button className="flex h-9 items-center gap-2 rounded-[10px] border border-line px-3.5 text-xs font-semibold text-ink transition-colors hover:bg-surface">
            <QrCode className="h-3.5 w-3.5" />
            Importar lectores QR
          </button>
          <button className="flex h-9 items-center gap-2 rounded-[10px] bg-primary px-3.5 text-xs font-semibold text-white transition-opacity hover:opacity-90">
            <CircleCheck className="h-3.5 w-3.5" />
            Cerrar lista
          </button>
        </div>
      </div>

      {/* ====== date strip ====== */}
      <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface text-ink">
            <Calendar className="h-3.5 w-3.5" />
          </span>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-ink">Semana 21</span>
            <span className="text-[10px] text-subtle">19 – 25 mayo</span>
          </div>
        </div>
        <span className="h-8 w-px bg-line" />
        <div className="flex flex-1 gap-2">
          {DAYS.map((day) => (
            <div
              key={day.n}
              className={`flex h-16 w-14 flex-col items-center justify-center gap-0.5 rounded-xl ${
                day.today
                  ? "bg-primary text-white"
                  : day.weekend
                  ? "bg-surface"
                  : "border border-line bg-card"
              }`}
            >
              <span className={`text-[10px] font-medium ${day.today ? "text-white/85" : "text-subtle"}`}>{day.d}</span>
              <span className={`text-base font-bold ${day.today ? "text-white" : day.weekend ? "text-subtle" : "text-ink"}`}>{day.n}</span>
              {day.today ? (
                <span className="text-[9px] font-semibold text-white/85">Hoy</span>
              ) : day.pct ? (
                <span className="text-[9px] font-semibold text-emerald-600">{day.pct}</span>
              ) : null}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-ink transition-colors hover:bg-line-soft">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-ink transition-colors hover:bg-line-soft">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button className="flex h-8 items-center rounded-lg border border-line px-3 text-[11px] font-semibold text-ink transition-colors hover:bg-surface">
            Hoy
          </button>
        </div>
      </div>

      {/* ====== quick stats ====== */}
      <div className="flex gap-3">
        {STATS.map((s) => {
          const t = TONE[s.tone];
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex flex-1 flex-col gap-1.5 rounded-2xl border border-line bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-subtle">{s.label}</span>
                <Icon className={`h-3 w-3 ${t.icon}`} />
              </div>
              <div className="flex items-end justify-between">
                <div className="flex flex-col">
                  <span className="text-2xl font-bold leading-none text-ink">{s.value}</span>
                  <span className="mt-1 text-[11px] text-subtle">{s.foot}</span>
                </div>
                <div className="flex h-6 items-end gap-[3px]">
                  {s.bars.map((h, i) => (
                    <span key={i} className={`w-1 rounded-sm ${t.bar}`} style={{ height: h }} />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ====== class selector ====== */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {CLASSES.map((c) => (
            <button
              key={c.label}
              className={`flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-[13px] transition-colors ${
                c.active
                  ? "border-b-2 border-primary bg-surface font-semibold text-ink"
                  : "font-medium text-subtle hover:text-ink"
              }`}
            >
              {c.label}
              {c.active && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-0.5 rounded-lg bg-surface p-[3px]">
          <button className="flex h-[26px] w-8 items-center justify-center rounded-md bg-primary text-white">
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button className="flex h-[26px] w-8 items-center justify-center rounded-md text-subtle hover:text-ink">
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ====== roster ====== */}
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-ink">Lista — Matemáticas · 8°B</span>
            <span className="text-xs text-subtle">32 estudiantes · 4 grupos</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-primary hover:bg-primary/5">
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todos
            </button>
            <button className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-subtle hover:text-ink">
              <Eraser className="h-3.5 w-3.5" />
              Limpiar
            </button>
            <span className="h-5 w-px bg-line" />
            <button className="flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-medium text-ink transition-colors hover:bg-surface">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtrar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {ROSTER.map((st, i) => (
            <div
              key={st.name}
              className="flex items-center gap-2 rounded-xl border border-line bg-card px-2.5 py-2 transition-colors hover:border-primary/40"
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${AVATARS[i % AVATARS.length]}`}>
                {initials(st.name)}
              </span>
              <span className="flex-1 truncate text-[12px] font-medium text-ink">{st.name}</span>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${ESTADO[st.estado].chip}`}>
                {st.estado}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
