import {
  Download,
  FileDown,
  Plus,
  Users,
  GraduationCap,
  CalendarCheck,
  Wallet,
  TriangleAlert,
  ShieldAlert,
  CreditCard,
  FileText,
  TrendingUp,
  TrendingDown,
  Timer,
  ClipboardList,
  FilePenLine,
  MessageSquareWarning,
  MailCheck,
  SlidersHorizontal,
  ArrowUpRight,
  CalendarClock,
  ChevronRight,
  BellRing,
  Ellipsis,
  Sparkles,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { PerformanceBar } from "@/components/charts/performance-bar";
import { DistributionDonut } from "@/components/charts/distribution-donut";
import { AttendanceBar } from "@/components/charts/attendance-bar";
import { IncomeBar } from "@/components/charts/income-bar";

/* ---------------- datos ---------------- */

type Tone = "info" | "primary" | "success" | "warning" | "error";

const TONE: Record<
  Tone,
  { badgeBg: string; badgeFg: string; chipBg: string; chipFg: string }
> = {
  info: { badgeBg: "bg-s-info", badgeFg: "text-s-info-fg", chipBg: "bg-s-info", chipFg: "text-s-info-fg" },
  primary: { badgeBg: "bg-primary-tint", badgeFg: "text-primary", chipBg: "bg-s-success", chipFg: "text-s-success-fg" },
  success: { badgeBg: "bg-s-success", badgeFg: "text-s-success-fg", chipBg: "bg-s-success", chipFg: "text-s-success-fg" },
  warning: { badgeBg: "bg-s-warning", badgeFg: "text-s-warning-fg", chipBg: "bg-s-warning", chipFg: "text-s-warning-fg" },
  error: { badgeBg: "bg-s-error", badgeFg: "text-s-error-fg", chipBg: "bg-s-error", chipFg: "text-s-error-fg" },
};

type Kpi = {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: Tone;
  delta: string;
  deltaDir: "up" | "down";
  deltaTone: "success" | "error";
  foot: string;
};

const KPIS: Kpi[] = [
  { label: "TOTAL ESTUDIANTES", value: "1.284", icon: Users, tone: "info", delta: "+3,1%", deltaDir: "up", deltaTone: "success", foot: "vs mes anterior" },
  { label: "PROFESORES ACTIVOS", value: "86", icon: GraduationCap, tone: "primary", delta: "+1,2%", deltaDir: "up", deltaTone: "success", foot: "vs mes anterior" },
  { label: "ASISTENCIA PROMEDIO", value: "94,3%", icon: CalendarCheck, tone: "success", delta: "-0,8%", deltaDir: "down", deltaTone: "error", foot: "vs mes anterior" },
  { label: "CARTERA PENDIENTE", value: "$ 142,5 M", icon: Wallet, tone: "warning", delta: "+6,4%", deltaDir: "up", deltaTone: "error", foot: "vs mes anterior" },
  { label: "ALERTAS ACADÉMICAS", value: "27", icon: TriangleAlert, tone: "error", delta: "+12", deltaDir: "up", deltaTone: "error", foot: "vs mes anterior" },
  { label: "ESTUDIANTES EN RIESGO", value: "41", icon: ShieldAlert, tone: "error", delta: "+5", deltaDir: "up", deltaTone: "error", foot: "vs mes anterior" },
  { label: "PAGOS VENCIDOS", value: "63", icon: CreditCard, tone: "warning", delta: "-9%", deltaDir: "down", deltaTone: "success", foot: "vs mes anterior" },
  { label: "BOLETINES PENDIENTES", value: "312", icon: FileText, tone: "info", delta: "En 9 días", deltaDir: "up", deltaTone: "success", foot: "meta semanal" },
];

const TENDENCIAS = [
  { materia: "Matemáticas grado 9°", delta: "+5.2%", tone: "success" as const, dir: "up" as const },
  { materia: "Lengua Castellana 7°", delta: "-2.1%", tone: "error" as const, dir: "down" as const },
  { materia: "Ciencias Naturales 10°", delta: "+1.8%", tone: "info" as const, dir: "up" as const },
  { materia: "Inglés 11°", delta: "+3.0%", tone: "success" as const, dir: "up" as const },
];

const ACTIVITY = [
  { icon: ClipboardList, tone: "info" as const, bold: "Camila Restrepo", rest: "matriculada en 8°B", sub: "Por Secretaría López · Documento adjunto verificado", chip: "Matrícula", time: "hace 12 min" },
  { icon: FilePenLine, tone: "primary" as const, bold: "Prof. Carlos Ríos", rest: "actualizó 32 notas de Matemáticas — 5°A", sub: "Periodo 2 · Promedio del grupo subió de 3.8 a 4.1", chip: "Notas", time: "hace 28 min" },
  { icon: MessageSquareWarning, tone: "warning" as const, bold: "Coord. Mejía", rest: "registró observación disciplinaria a Jhon Pérez — 10°C", sub: "Tipo: Falta grave · Pendiente notificar acudiente", chip: "Disciplina", time: "hace 41 min" },
  { icon: Wallet, tone: "success" as const, bold: "Pago de pensión recibido — $ 480.000", rest: "", sub: "Familia Gómez Castaño · Estudiante: Mariana Gómez 7°B · Bancolombia PSE", chip: "Finanzas", time: "hace 1 h" },
  { icon: TriangleAlert, tone: "error" as const, bold: "Alerta automática", rest: "· bajo rendimiento detectado en Química 11°A", sub: "7 estudiantes por debajo de 3.0 · Recomendación: refuerzo académico", chip: "Alerta", time: "hace 2 h" },
  { icon: MailCheck, tone: "primary" as const, bold: "Rectoría", rest: "envió circular a 432 acudientes", sub: "Asunto: Convivencia escolar · Canales: Email + App + SMS", chip: "Comunicación", time: "hace 5 h" },
];

const ACTIVITY_TABS = ["Todas", "Matrículas", "Notas", "Observaciones", "Pagos", "Comunicaciones"];

const ALERTS = [
  { icon: ShieldAlert, tone: "error" as const, bar: "bg-danger", title: "Bajo rendimiento académico", badge: "Crítico", desc: "41 estudiantes con promedio inferior a 3.0 en al menos 2 materias del periodo actual.", meta: "Detectado hoy 08:14", action: "Revisar" },
  { icon: CreditCard, tone: "warning" as const, bar: "bg-s-warning-fg", title: "Pagos vencidos en cartera", badge: "Alto", desc: "63 familias con pagos vencidos hace más de 30 días. Total en mora: $ 142,5 M COP.", meta: "Actualizado hace 6 h", action: "Cobrar" },
  { icon: Timer, tone: "warning" as const, bar: "bg-s-warning-fg", title: "Notas sin reportar", badge: "Medio", desc: "12 docentes con notas del Periodo 2 pendientes. Cierre programado en 4 días.", meta: "Vence 27 mayo · 18:00", action: "Notificar" },
  { icon: CalendarClock, tone: "info" as const, bar: "bg-s-info-fg", title: "Fallas de asistencia", badge: "Seguir", desc: "9 estudiantes con más del 20% de inasistencias. Notificar acudientes antes del viernes.", meta: "Reporte semanal", action: "Contactar" },
];

const CHIPS = ["Hoy", "Esta semana", "Este mes", "Trimestre", "Año lectivo"];

/* ---------------- helpers ---------------- */

function Spark({ tone }: { tone: Tone }) {
  const color = { info: "#C9D6F0", primary: "#ECEAFF", success: "#A1E5A1", warning: "#FFD9B2", error: "#FFBFB2" }[tone];
  const strong = { info: "#001133", primary: "#5749F4", success: "#003300", warning: "#4D2700", error: "#590F00" }[tone];
  const bars = [8, 12, 10, 16];
  return (
    <div className="flex items-end gap-[3px]" style={{ height: 20 }}>
      {bars.map((h, i) => (
        <span key={i} className="w-1 rounded-sm" style={{ height: h, background: i === bars.length - 1 ? strong : color }} />
      ))}
    </div>
  );
}

/* ---------------- página ---------------- */

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-7 px-7 py-8">
      {/* ====== Page header ====== */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-6">
          <div className="flex flex-col gap-2.5">
            <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
              Resumen ejecutivo
            </span>
            <h1 className="text-[30px] font-bold leading-tight text-ink">
              Buenos días, María 👋
            </h1>
            <p className="text-sm text-subtle">
              Esto está pasando en el colegio hoy, jueves 23 de mayo de 2026.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink transition-colors hover:bg-surface">
              <Download className="h-4 w-4" />
            </button>
            <button className="flex h-10 items-center gap-1.5 rounded-full border border-line px-4 text-sm font-medium text-ink transition-colors hover:bg-surface">
              <FileDown className="h-4 w-4" />
              Exportar reporte
            </button>
            <button className="flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90">
              <Plus className="h-4 w-4" />
              Nueva acción
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            {CHIPS.map((chip, i) => (
              <button
                key={chip}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                  i === 0
                    ? "border border-primary bg-primary/10 text-primary"
                    : "border border-line text-subtle hover:bg-surface"
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
          <span className="text-[13px] font-medium text-subtle">
            01 – 23 May 2026
          </span>
        </div>
      </div>

      {/* ====== KPI grid ====== */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => {
          const t = TONE[k.tone];
          const Icon = k.icon;
          const DeltaIcon = k.deltaDir === "up" ? TrendingUp : TrendingDown;
          return (
            <div
              key={k.label}
              className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-5 shadow-card"
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${t.badgeBg}`}>
                  <Icon className={`h-[22px] w-[22px] ${t.badgeFg}`} />
                </div>
                <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
                  k.deltaTone === "success" ? "bg-s-success text-s-success-fg" : "bg-s-error text-s-error-fg"
                }`}>
                  <DeltaIcon className="h-3 w-3" />
                  {k.delta}
                </span>
              </div>
              <p className="text-[11px] font-semibold tracking-wide text-subtle">
                {k.label}
              </p>
              <p className="text-[30px] font-bold leading-none -tracking-[0.01em] text-ink">
                {k.value}
              </p>
              <div className="flex items-center justify-between">
                <Spark tone={k.tone} />
                <span className="text-[11px] text-subtle">{k.foot}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ====== Charts row 1 ====== */}
      <div className="flex flex-col gap-4 xl:flex-row">
        {/* Card A */}
        <div className="flex h-[360px] flex-1 flex-col gap-4 rounded-2xl border border-line bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold text-ink">
                Rendimiento académico por grado
              </h3>
              <p className="text-xs text-subtle">
                Promedio sobre 5.0 — comparado con el periodo anterior
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-[11px] text-subtle">Este periodo</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-line-soft" />
                <span className="text-[11px] text-subtle">Periodo anterior</span>
              </div>
              <button className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface">
                Ver detalle
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <PerformanceBar />
          </div>
        </div>

        {/* Card B */}
        <div className="flex h-[360px] w-full flex-col gap-4 rounded-2xl border border-line bg-card p-5 xl:w-[340px] xl:shrink-0">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold text-ink">
              Distribución de desempeño
            </h3>
            <p className="text-xs text-subtle">
              Estudiantes por nivel — periodo actual
            </p>
          </div>
          <DistributionDonut />
          <div className="flex flex-col gap-2">
            {[
              { name: "Superior", val: "32%", color: "#5749F4" },
              { name: "Alto", val: "46%", color: "#003300" },
              { name: "Básico", val: "18%", color: "#4D2700" },
              { name: "Bajo", val: "4%", color: "#590F00" },
            ].map((l) => (
              <div key={l.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} />
                  <span className="text-xs text-ink">{l.name}</span>
                </div>
                <span className="text-xs font-semibold text-subtle">{l.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ====== Charts row 2 ====== */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Card C */}
        <div className="flex h-[280px] flex-col gap-4 rounded-2xl border border-line bg-card p-5">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold text-ink">Asistencia semanal</h3>
            <div className="flex items-end gap-2">
              <span className="text-[28px] font-bold leading-none text-ink">94.3%</span>
              <span className="flex items-center gap-1 rounded-full bg-s-success px-1.5 py-0.5 text-[10px] font-semibold text-s-success-fg">
                <TrendingUp className="h-2.5 w-2.5" />
                +0.6%
              </span>
            </div>
            <span className="text-[10px] text-subtle">95% meta</span>
          </div>
          <div className="min-h-0 flex-1">
            <AttendanceBar />
          </div>
        </div>

        {/* Card D */}
        <div className="flex h-[280px] flex-col gap-4 rounded-2xl border border-line bg-card p-5">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold text-ink">
              Ingresos mensuales (COP)
            </h3>
            <div className="flex items-end gap-2">
              <span className="text-[24px] font-bold leading-none text-ink">$ 1.245 M</span>
              <span className="flex items-center gap-1 rounded-full bg-s-success px-1.5 py-0.5 text-[10px] font-semibold text-s-success-fg">
                <TrendingUp className="h-2.5 w-2.5" />
                +8.2%
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              {[
                { n: "Matrículas", c: "#5749F4" },
                { n: "Pensiones", c: "#003300" },
                { n: "Otros", c: "#4D2700" },
              ].map((l) => (
                <div key={l.n} className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: l.c }} />
                  <span className="text-[9px] text-subtle">{l.n}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <IncomeBar />
          </div>
        </div>

        {/* Card E */}
        <div className="flex h-[280px] flex-col gap-4 rounded-2xl border border-line bg-card p-5">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold text-ink">
              Tendencias académicas
            </h3>
            <p className="text-[11px] text-subtle">
              Variación promedio vs. periodo anterior
            </p>
          </div>
          <div className="flex flex-1 flex-col justify-between gap-2.5">
            {TENDENCIAS.map((t) => {
              const tone = TONE[t.tone];
              const Icon = t.dir === "up" ? TrendingUp : TrendingDown;
              return (
                <div key={t.materia} className="flex items-center gap-2.5">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full ${tone.badgeBg}`}>
                    <Icon className={`h-3.5 w-3.5 ${tone.badgeFg}`} />
                  </div>
                  <span className="flex-1 text-[11px] text-ink">{t.materia}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${tone.chipBg} ${tone.chipFg}`}>
                    {t.delta}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ====== Activity + Alerts ====== */}
      <div className="flex flex-col gap-5 xl:flex-row">
        {/* Activity feed */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-card">
          <div className="flex flex-col gap-4 border-b border-line px-6 py-5">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-semibold text-ink">
                    Actividad reciente
                  </h3>
                  <span className="flex items-center gap-1.5 rounded-full bg-s-success px-2 py-1 text-[10px] font-semibold text-s-success-fg">
                    <span className="h-1.5 w-1.5 rounded-full bg-s-success-fg" />
                    En vivo
                  </span>
                </div>
                <p className="text-[13px] text-subtle">
                  Eventos del sistema en los últimos 7 días · 248 registros
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-surface">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-subtle" />
                  Filtros
                </button>
                <button className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-[13px] font-medium text-primary hover:bg-primary/5">
                  Ver todo
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {ACTIVITY_TABS.map((tab, i) => (
                <button
                  key={tab}
                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] transition-colors ${
                    i === 0 ? "bg-surface font-semibold text-ink" : "font-medium text-subtle hover:bg-surface/60"
                  }`}
                >
                  {tab}
                  {i === 0 && (
                    <span className="rounded-full bg-card px-1.5 py-0.5 text-[10px] font-semibold text-subtle">
                      248
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col px-2">
            {ACTIVITY.map((a, i) => {
              const tone = TONE[a.tone];
              const Icon = a.icon;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3.5 px-4 py-3.5 ${
                    i < ACTIVITY.length - 1 ? "border-b border-line" : ""
                  }`}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${tone.badgeBg}`}>
                    <Icon className={`h-4 w-4 ${tone.badgeFg}`} />
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <p className="text-[13px] text-subtle">
                      <span className="font-semibold text-ink">{a.bold}</span>
                      {a.rest ? ` ${a.rest}` : ""}
                    </p>
                    <p className="text-xs text-subtle">{a.sub}</p>
                  </div>
                  <span className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold ${tone.badgeBg} ${tone.badgeFg}`}>
                    {a.chip}
                  </span>
                  <span className="w-[78px] shrink-0 text-right text-xs text-subtle">
                    {a.time}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alerts panel */}
        <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-line bg-card xl:w-[420px] xl:shrink-0">
          <div className="flex flex-col gap-3.5 border-b border-line px-6 py-5">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <BellRing className="h-4 w-4 text-danger" />
                  <h3 className="text-base font-semibold text-ink">
                    Alertas críticas
                  </h3>
                  <span className="rounded-full bg-danger px-1.5 py-0.5 text-[11px] font-bold text-white">
                    27
                  </span>
                </div>
                <p className="text-xs text-subtle">Requieren acción inmediata</p>
              </div>
              <button className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-line text-subtle hover:bg-surface">
                <Ellipsis className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex gap-0.5 rounded-lg bg-surface p-1">
              {["Todas", "Académicas", "Asistencia", "Finanzas"].map((s, i) => (
                <button
                  key={s}
                  className={`flex-1 rounded-md px-2 py-1.5 text-center text-xs transition-colors ${
                    i === 0 ? "border border-line bg-card font-semibold text-ink" : "font-medium text-subtle"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-2.5 px-4 py-3">
            {ALERTS.map((al) => {
              const tone = TONE[al.tone];
              const Icon = al.icon;
              return (
                <div
                  key={al.title}
                  className="flex gap-3 rounded-xl border border-line bg-card p-3.5"
                >
                  <span className={`w-[3px] shrink-0 rounded-full ${al.bar}`} />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Icon className={`h-3.5 w-3.5 ${tone.badgeFg}`} />
                        <span className="text-[13px] font-semibold text-ink">
                          {al.title}
                        </span>
                      </div>
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${tone.badgeBg} ${tone.badgeFg}`}>
                        {al.badge}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-subtle">{al.desc}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CalendarClock className="h-3 w-3 text-subtle" />
                        <span className="text-[11px] text-subtle">{al.meta}</span>
                      </div>
                      <button className="flex items-center gap-1 rounded-md border border-line px-2 py-1 text-[11px] font-semibold text-ink transition-colors hover:bg-surface">
                        {al.action}
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between border-t border-line px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-ink">
                Sugerencias IA disponibles
              </span>
            </div>
            <button className="flex items-center gap-1 text-xs font-semibold text-primary">
              Ver las 27
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
