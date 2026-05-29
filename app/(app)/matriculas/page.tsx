import {
  Download,
  Clock3,
  Plus,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  ListTree,
  TableProperties,
  Calendar,
} from "lucide-react";

/* ---------------- datos ---------------- */

type Tone = "info" | "warning" | "primary" | "success" | "error" | "muted";

const CHIP: Record<Tone, string> = {
  info: "bg-s-info text-s-info-fg",
  warning: "bg-s-warning text-s-warning-fg",
  primary: "bg-primary-tint text-primary",
  success: "bg-s-success text-s-success-fg",
  error: "bg-s-error text-s-error-fg",
  muted: "bg-surface text-subtle",
};

const FUNNEL = [
  { label: "SOLICITUDES", value: "184", pct: "100%" },
  { label: "EN REVISIÓN", value: "142", pct: "77%" },
  { label: "ENTREVISTAS", value: "118", pct: "64%" },
  { label: "APROBADAS", value: "96", pct: "52%" },
  { label: "MATRICULADAS", value: "84", pct: "46%", primary: true },
];

const METER = ["bg-s-info", "bg-blue-600", "bg-primary", "bg-s-success", "bg-surface"];

const TABS = [
  { label: "Resumen" },
  { label: "Solicitudes", count: "142", active: true },
  { label: "Aprobadas" },
  { label: "Lista de espera" },
  { label: "Rechazadas" },
];

const FILTERS = ["Grado: Todos", "Estado documento: Cualquiera", "Fuente: Todas"];

type Card = {
  tipo: string;
  tipoTone: Tone;
  id: string;
  initials: string;
  avatar: Tone;
  name: string;
  grado: string;
  acudiente: string;
  date: string;
  resp: string;
  progress: number; // 0..1
};

type Column = {
  title: string;
  tone: "info" | "warning" | "primary" | "success";
  count: number;
  cards: Card[];
};

const COLUMN_TONE: Record<Column["tone"], { dot: string; bar: string }> = {
  info: { dot: "bg-blue-700", bar: "bg-blue-600" },
  warning: { dot: "bg-amber-500", bar: "bg-amber-500" },
  primary: { dot: "bg-primary", bar: "bg-primary" },
  success: { dot: "bg-emerald-600", bar: "bg-emerald-600" },
};

const COLUMNS: Column[] = [
  {
    title: "Solicitud recibida",
    tone: "info",
    count: 42,
    cards: [
      { tipo: "Nuevo ingreso", tipoTone: "info", id: "STU-2026-0184", initials: "VC", avatar: "warning", name: "Valentina Castaño", grado: "6°", acudiente: "Diana G.", date: "Recibido hace 2 d", resp: "Secretaría López", progress: 0.5 },
      { tipo: "Beca", tipoTone: "warning", id: "STU-2026-0173", initials: "SO", avatar: "info", name: "Santiago Ortega", grado: "9°", acudiente: "Ricardo O.", date: "Recibido hace 1 d", resp: "M. Restrepo", progress: 0.5 },
      { tipo: "Reingreso", tipoTone: "muted", id: "STU-2026-0168", initials: "JM", avatar: "success", name: "Juliana Marín", grado: "4°", acudiente: "Camila M.", date: "Recibido hace 3 d", resp: "Secretaría López", progress: 0.25 },
    ],
  },
  {
    title: "Documentos en revisión",
    tone: "warning",
    count: 38,
    cards: [
      { tipo: "Nuevo ingreso", tipoTone: "info", id: "STU-2026-0152", initials: "AP", avatar: "error", name: "Andrés Patiño", grado: "7°", acudiente: "Mauricio P.", date: "Recibido hace 5 d", resp: "P. Salazar", progress: 0.5 },
      { tipo: "Reingreso", tipoTone: "muted", id: "STU-2026-0148", initials: "LB", avatar: "info", name: "Laura Botero", grado: "10°", acudiente: "Sandra B.", date: "Recibido hace 7 d", resp: "D. Quintero", progress: 0.33 },
      { tipo: "Beca", tipoTone: "warning", id: "STU-2026-0139", initials: "MV", avatar: "warning", name: "Mateo Vélez", grado: "8°", acudiente: "Carolina V.", date: "Recibido hace 4 d", resp: "Bienestar", progress: 0.5 },
    ],
  },
  {
    title: "Entrevista agendada",
    tone: "primary",
    count: 22,
    cards: [
      { tipo: "Nuevo ingreso", tipoTone: "info", id: "STU-2026-0121", initials: "IS", avatar: "success", name: "Isabella Suárez", grado: "5°", acudiente: "Andrea S.", date: "Entrevista 28 nov", resp: "Psicología", progress: 0.5 },
      { tipo: "Reingreso", tipoTone: "muted", id: "STU-2026-0112", initials: "NR", avatar: "error", name: "Nicolás Rojas", grado: "11°", acudiente: "Jorge R.", date: "Entrevista 25 nov", resp: "Coordinación", progress: 0.33 },
      { tipo: "Beca", tipoTone: "warning", id: "STU-2026-0104", initials: "DG", avatar: "info", name: "Daniel Gómez", grado: "3°", acudiente: "Marta G.", date: "Entrevista 30 nov", resp: "Rectoría", progress: 0.25 },
    ],
  },
  {
    title: "Aprobado · falta pago",
    tone: "success",
    count: 18,
    cards: [
      { tipo: "Nuevo ingreso", tipoTone: "success", id: "STU-2026-0098", initials: "SH", avatar: "warning", name: "Sofía Henao", grado: "2°", acudiente: "Mónica H.", date: "Aprobada hace 1 d", resp: "Tesorería", progress: 1 },
      { tipo: "Reingreso", tipoTone: "muted", id: "STU-2026-0089", initials: "TC", avatar: "success", name: "Tomás Cárdenas", grado: "9°", acudiente: "Paola C.", date: "Aprobada hace 3 d", resp: "Tesorería", progress: 0.5 },
      { tipo: "Beca", tipoTone: "warning", id: "STU-2026-0081", initials: "MA", avatar: "error", name: "Mariana Acevedo", grado: "7°", acudiente: "Luisa A.", date: "Aprobada hace 5 d", resp: "Bienestar", progress: 0.25 },
    ],
  },
];

/* ---------------- página ---------------- */

export default function MatriculasPage() {
  return (
    <div className="flex flex-col gap-6 px-8 py-7">
      {/* ====== header ====== */}
      <div className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold tracking-[0.18em] text-primary">PROCESO ANUAL</span>
          <h1 className="text-[28px] font-bold -tracking-[0.02em] text-ink">Matrículas 2026</h1>
          <p className="text-[13px] text-subtle">
            184 solicitudes recibidas · 96 confirmadas · cierre 30 noviembre 2025
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="flex h-[38px] items-center gap-2 rounded-[10px] border border-line px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">
            <Download className="h-3.5 w-3.5" />
            Exportar reporte
          </button>
          <button className="flex h-[38px] items-center gap-2 rounded-[10px] border border-line px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">
            <Clock3 className="h-3.5 w-3.5" />
            Lista de espera
          </button>
          <button className="flex h-[38px] items-center gap-2 rounded-[10px] bg-primary px-3.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90">
            <Plus className="h-3.5 w-3.5" />
            Nueva solicitud
          </button>
        </div>
      </div>

      {/* ====== funnel ====== */}
      <div className="flex flex-col gap-[18px] rounded-2xl border border-line bg-card p-6">
        <div className="flex items-center justify-between gap-2">
          {FUNNEL.map((s, i) => (
            <div key={s.label} className="flex flex-1 items-center gap-2">
              <div className="flex flex-col gap-1">
                <span className={`text-[10px] font-semibold tracking-[0.1em] ${s.primary ? "text-primary" : "text-subtle"}`}>
                  {s.label}
                </span>
                <span className={`text-[22px] font-bold leading-none ${s.primary ? "text-primary" : "text-ink"}`}>
                  {s.value}
                </span>
                <span className="text-[11px] text-subtle">{s.pct}</span>
              </div>
              {i < FUNNEL.length - 1 && (
                <ChevronRight className="h-[18px] w-[18px] shrink-0 text-subtle" />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-0.5 overflow-hidden rounded-[3px]">
          {METER.map((c, i) => (
            <span key={i} className={`h-1.5 flex-1 ${c}`} />
          ))}
        </div>
      </div>

      {/* ====== tabs + filtros ====== */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          {TABS.map((t) => (
            <button
              key={t.label}
              className={`flex h-[34px] items-center gap-2 rounded-lg px-3 text-[13px] transition-colors ${
                t.active ? "bg-surface font-semibold text-ink" : "font-medium text-subtle hover:text-ink"
              }`}
            >
              {t.label}
              {t.count && (
                <span className="flex h-[18px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-medium text-ink transition-colors hover:bg-surface"
            >
              {f}
              <ChevronDown className="h-3 w-3 text-subtle" />
            </button>
          ))}
          <span className="h-6 w-px bg-line" />
          <div className="flex items-center gap-0.5">
            <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink transition-colors hover:bg-surface">
              <ListTree className="h-4 w-4" />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink transition-colors hover:bg-surface">
              <TableProperties className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ====== kanban ====== */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const ct = COLUMN_TONE[col.tone];
          return (
            <div key={col.title} className="flex flex-col gap-3 rounded-[20px] bg-surface p-4">
              {/* header columna */}
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${ct.dot}`} />
                <span className="text-[13px] font-semibold text-ink">{col.title}</span>
                <span className="flex-1" />
                <span className="flex h-5 items-center justify-center rounded-full bg-card px-2 text-[11px] font-bold text-ink">
                  {col.count}
                </span>
                <Plus className="h-3.5 w-3.5 text-subtle" />
              </div>
              {/* tarjetas */}
              {col.cards.map((c) => (
                <div key={c.id} className="flex flex-col gap-2 rounded-[14px] border border-line bg-card p-3.5">
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${CHIP[c.tipoTone]}`}>
                      {c.tipo}
                    </span>
                    <span className="text-[10px] font-medium text-subtle">{c.id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${CHIP[c.avatar]}`}>
                      {c.initials}
                    </span>
                    <span className="text-[13px] font-semibold text-ink">{c.name}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] text-subtle">Grado solicitado: {c.grado}</span>
                    <span className="text-[11px] text-subtle">Acudiente: {c.acudiente}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-subtle" />
                    <span className="text-[11px] text-subtle">{c.date}</span>
                    <span className="flex-1" />
                    <span className="text-[11px] font-medium text-ink">{c.resp}</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-surface">
                    <span
                      className={`block h-full rounded-full ${ct.bar}`}
                      style={{ width: `${c.progress * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
