"use client";

import { useEffect, useState } from "react";
import { useDismiss } from "@/components/use-dismiss";
import { useAuth } from "@/components/auth-context";
import { apiGet } from "@/lib/api";
import {
  Download,
  FileDown,
  Plus,
  CalendarDays,
  ChevronDown,
  Check,
  Users,
  GraduationCap,
  Wallet,
  TriangleAlert,
  ShieldAlert,
  CreditCard,
  FileText,
  TrendingUp,
  TrendingDown,
  Timer,
  ClipboardList,
  MailCheck,
  ArrowUpRight,
  CalendarClock,
  ChevronRight,
  BellRing,
  Ellipsis,
  Sparkles,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { PerformanceBar, type PerformancePoint } from "@/components/charts/performance-bar";
import { DistributionDonut, type DistributionPoint } from "@/components/charts/distribution-donut";
import { AttendanceBar, type AttendancePoint } from "@/components/charts/attendance-bar";
import { IncomeBar, type IncomePoint } from "@/components/charts/income-bar";

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

type Cat = "academico" | "finanzas";

type Kpi = {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: Tone;
  delta?: string;
  deltaDir?: "up" | "down";
  deltaTone?: "success" | "error";
  foot?: string;
  cat: Cat;
};

/* ---- Construcción de KPIs a partir del payload real de /dashboard ---- */

const fmtNum = (n: number) => n.toLocaleString("es-CO");
const fmtCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
    notation: "compact",
  }).format(n);

function academicKpis(o: DashboardData["overview"]): Kpi[] {
  if (!o) return [];
  return [
    { label: "TOTAL ESTUDIANTES", value: fmtNum(o.totalStudents), icon: Users, tone: "info", foot: "activos", cat: "academico" },
    { label: "PROFESORES ACTIVOS", value: fmtNum(o.totalTeachers), icon: GraduationCap, tone: "primary", foot: "activos", cat: "academico" },
    { label: "MATRÍCULAS ACTIVAS", value: fmtNum(o.activeEnrollments), icon: ClipboardList, tone: "success", foot: "año en curso", cat: "academico" },
  ];
}

function financeKpis(f: DashboardData["finance"]): Kpi[] {
  if (!f) return [];
  return [
    { label: "RECAUDADO (MES)", value: fmtCOP(f.collectedThisMonth), icon: Wallet, tone: "success", foot: "este mes", cat: "finanzas" },
    { label: "FACTURADO (MES)", value: fmtCOP(f.billedThisMonth), icon: FileText, tone: "info", foot: "este mes", cat: "finanzas" },
    { label: "FACTURAS PENDIENTES", value: fmtNum(f.pendingInvoices), icon: CreditCard, tone: "warning", foot: "por cobrar", cat: "finanzas" },
    { label: "PAGOS VENCIDOS", value: fmtNum(f.overdueInvoices), icon: TriangleAlert, tone: "error", foot: "en mora", cat: "finanzas" },
  ];
}

const ALERTS = [
  { icon: ShieldAlert, tone: "error" as const, bar: "bg-danger", title: "Bajo rendimiento académico", badge: "Crítico", desc: "41 estudiantes con promedio inferior a 3.0 en al menos 2 materias del periodo actual.", meta: "Detectado hoy 08:14", action: "Revisar" },
  { icon: CreditCard, tone: "warning" as const, bar: "bg-s-warning-fg", title: "Pagos vencidos en cartera", badge: "Alto", desc: "63 familias con pagos vencidos hace más de 30 días. Total en mora: $ 142,5 M COP.", meta: "Actualizado hace 6 h", action: "Cobrar" },
  { icon: Timer, tone: "warning" as const, bar: "bg-s-warning-fg", title: "Notas sin reportar", badge: "Medio", desc: "12 docentes con notas del Periodo 2 pendientes. Cierre programado en 4 días.", meta: "Vence 27 mayo · 18:00", action: "Notificar" },
  { icon: CalendarClock, tone: "info" as const, bar: "bg-s-info-fg", title: "Fallas de asistencia", badge: "Seguir", desc: "9 estudiantes con más del 20% de inasistencias. Notificar acudientes antes del viernes.", meta: "Reporte semanal", action: "Contactar" },
];

const CHIPS = ["Hoy", "Esta semana", "Este mes", "Trimestre", "Año lectivo"];

type TabId = "resumen" | "academico" | "finanzas" | "actividad" | "alertas";

const TABS: { id: TabId; label: string; count?: string }[] = [
  { id: "resumen", label: "Resumen" },
  { id: "academico", label: "Académico" },
  { id: "finanzas", label: "Finanzas" },
  { id: "actividad", label: "Actividad", count: "248" },
  { id: "alertas", label: "Alertas", count: "27" },
];

/* ---------------- helpers ---------------- */

function RangeSelect() {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState(CHIPS[0]);
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-line bg-card px-3.5 py-1.5 transition-colors hover:bg-surface"
      >
        <CalendarDays className="h-3.5 w-3.5 text-subtle" />
        <span className="text-[13px] font-medium text-ink">{range}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-subtle transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-11 z-40 flex w-44 flex-col overflow-hidden rounded-xl border border-line bg-card p-1.5 shadow-2xl">
          <span className="px-2.5 py-1.5 text-[10px] font-bold tracking-wide text-subtle">RANGO</span>
          {CHIPS.map((c) => (
            <button
              key={c}
              onClick={() => {
                setRange(c);
                setOpen(false);
              }}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-ink transition-colors hover:bg-surface"
            >
              <span className="flex-1">{c}</span>
              {c === range && <Check className="h-3.5 w-3.5 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Spark({ tone }: { tone: Tone }) {
  const color = { info: "var(--s-info)", primary: "var(--primary-tint)", success: "var(--s-success)", warning: "var(--s-warning)", error: "var(--s-error)" }[tone];
  const strong = { info: "var(--s-info-fg)", primary: "var(--c-brand)", success: "var(--s-success-fg)", warning: "var(--s-warning-fg)", error: "var(--s-error-fg)" }[tone];
  const bars = [8, 12, 10, 16];
  return (
    <div className="flex items-end gap-[3px]" style={{ height: 20 }}>
      {bars.map((h, i) => (
        <span key={i} className="w-1 rounded-sm" style={{ height: h, background: i === bars.length - 1 ? strong : color }} />
      ))}
    </div>
  );
}

function KpiCard({ k }: { k: Kpi }) {
  const t = TONE[k.tone];
  const Icon = k.icon;
  const DeltaIcon = k.deltaDir === "up" ? TrendingUp : TrendingDown;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${t.badgeBg}`}>
          <Icon className={`h-[22px] w-[22px] ${t.badgeFg}`} />
        </div>
        {k.delta && (
          <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
            k.deltaTone === "success" ? "bg-s-success text-s-success-fg" : "bg-s-error text-s-error-fg"
          }`}>
            <DeltaIcon className="h-3 w-3" />
            {k.delta}
          </span>
        )}
      </div>
      <p className="text-[11px] font-semibold tracking-wide text-subtle">{k.label}</p>
      <p className="text-[30px] font-bold leading-none -tracking-[0.01em] text-ink">{k.value}</p>
      <div className="flex items-center justify-between">
        <Spark tone={k.tone} />
        {k.foot && <span className="text-[11px] text-subtle">{k.foot}</span>}
      </div>
    </div>
  );
}

/* Skeleton de carga para la grilla de KPIs. */
function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-5 shadow-card">
          <div className="h-11 w-11 animate-pulse rounded-xl bg-surface" />
          <div className="h-3 w-24 animate-pulse rounded bg-surface" />
          <div className="h-7 w-20 animate-pulse rounded bg-surface" />
        </div>
      ))}
    </div>
  );
}

/* ---------------- secciones por tab ---------------- */

type Announcement = {
  id: string;
  title?: string;
  publishedAt?: string | null;
  author?: { firstName: string; lastName: string } | null;
};

type DashboardData = {
  type?: string;
  overview?: { totalStudents: number; totalTeachers: number; totalUsers: number; activeEnrollments: number };
  finance?: { pendingInvoices: number; overdueInvoices: number; collectedThisMonth: number; billedThisMonth: number };
  recentAnnouncements?: Announcement[];
  currentYear?: { id: string; year: number } | null;
};

type ChartsData = {
  income: IncomePoint[];
  performanceByGrade: PerformancePoint[];
  attendanceWeekly: AttendancePoint[];
  distribution: DistributionPoint[];
  currentPeriod?: string | null;
};

type TabProps = { data: DashboardData | null; loading: boolean };
type ChartTabProps = TabProps & { charts: ChartsData | null };

function ResumenTab({ data, loading }: TabProps) {
  if (loading) return <KpiSkeleton />;

  const kpis = [...academicKpis(data?.overview), ...financeKpis(data?.finance)];

  if (!kpis.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-card py-16 text-center">
        <p className="text-sm font-medium text-ink">Sin métricas disponibles</p>
        <p className="text-xs text-subtle">Tu rol no tiene un resumen ejecutivo asignado.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {kpis.map((k) => (
        <KpiCard key={k.label} k={k} />
      ))}
    </div>
  );
}

const DIST_COLOR: Record<string, string> = {
  Superior: "var(--c-brand)",
  Alto: "var(--c-green)",
  Básico: "var(--c-amber)",
  Bajo: "var(--c-red)",
};

function AsistenciaCard({ data }: { data: AttendancePoint[] }) {
  const prom = data.length ? data.reduce((s, d) => s + d.valor, 0) / data.length : null;
  return (
    <div className="flex h-[280px] flex-col gap-4 rounded-2xl border border-line bg-card p-5">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-ink">Asistencia semanal</h3>
        <div className="flex items-end gap-2">
          <span className="text-[28px] font-bold leading-none text-ink">{prom != null ? `${prom.toFixed(1)}%` : "—"}</span>
        </div>
        <span className="text-[10px] text-subtle">Promedio de los últimos días con registro</span>
      </div>
      <div className="min-h-0 flex-1">
        <AttendanceBar data={data} />
      </div>
    </div>
  );
}

function TendenciasCard({ data }: { data: PerformancePoint[] }) {
  // Variación real por grado: promedio actual vs. periodo anterior.
  const movers = data
    .filter((g) => g.actual != null && g.anterior != null)
    .map((g) => ({ grado: g.grado, delta: (g.actual as number) - (g.anterior as number) }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 5);

  return (
    <div className="flex h-[280px] flex-col gap-4 rounded-2xl border border-line bg-card p-5">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-ink">Variación por grado</h3>
        <p className="text-[11px] text-subtle">Promedio vs. periodo anterior</p>
      </div>
      {movers.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-center text-[11px] text-subtle">
          Sin periodo anterior para comparar todavía.
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-between gap-2.5">
          {movers.map((t) => {
            const up = t.delta >= 0;
            const tone = up ? TONE.success : TONE.error;
            const Icon = up ? TrendingUp : TrendingDown;
            return (
              <div key={t.grado} className="flex items-center gap-2.5">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full ${tone.badgeBg}`}>
                  <Icon className={`h-3.5 w-3.5 ${tone.badgeFg}`} />
                </div>
                <span className="flex-1 text-[11px] text-ink">{t.grado}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${tone.chipBg} ${tone.chipFg}`}>
                  {up ? "+" : ""}{t.delta.toFixed(1)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AcademicoTab({ charts }: { charts: ChartsData | null }) {
  const distribution = charts?.distribution ?? [];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 xl:flex-row">
        {/* Rendimiento por grado */}
        <div className="flex h-[400px] flex-1 flex-col gap-4 rounded-2xl border border-line bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold text-ink">Rendimiento académico por grado</h3>
              <p className="text-xs text-subtle">Promedio sobre 5.0 — comparado con el periodo anterior</p>
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
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <PerformanceBar data={charts?.performanceByGrade} />
          </div>
        </div>

        {/* Distribución de desempeño */}
        <div className="flex h-[400px] w-full flex-col gap-4 rounded-2xl border border-line bg-card p-5 xl:w-[340px] xl:shrink-0">
          <div className="flex shrink-0 flex-col gap-1">
            <h3 className="text-base font-semibold text-ink">Distribución de desempeño</h3>
            <p className="text-xs text-subtle">Estudiantes por nivel — periodo actual</p>
          </div>
          <div className="min-h-0 flex-1">
            <DistributionDonut data={distribution} />
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-x-4 gap-y-2">
            {distribution.map((l) => (
              <div key={l.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: DIST_COLOR[l.name] ?? "var(--c-brand)" }} />
                  <span className="text-xs text-ink">{l.name}</span>
                </div>
                <span className="text-xs font-semibold text-subtle">{l.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AsistenciaCard data={charts?.attendanceWeekly ?? []} />
        <TendenciasCard data={charts?.performanceByGrade ?? []} />
      </div>
    </div>
  );
}

function FinanzasTab({ data, charts }: ChartTabProps) {
  const finanzasKpis = financeKpis(data?.finance);
  const income = charts?.income ?? [];
  const totalRecaudado = income.reduce((s, m) => s + m.recaudado, 0);
  return (
    <div className="flex flex-col gap-4 xl:flex-row">
      {/* Ingresos por mes */}
      <div className="flex h-[400px] flex-1 flex-col gap-4 rounded-2xl border border-line bg-card p-5">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-ink">Ingresos por mes (COP)</h3>
          <div className="flex items-end gap-2">
            <span className="text-[28px] font-bold leading-none text-ink">{fmtCOP(totalRecaudado)}</span>
            <span className="text-[11px] text-subtle">recaudado en el año</span>
          </div>
          <div className="flex items-center gap-2.5">
            {[
              { n: "Recaudado", c: "var(--c-income-1)" },
              { n: "Facturado", c: "var(--c-income-2)" },
            ].map((l) => (
              <div key={l.n} className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: l.c }} />
                <span className="text-[10px] text-subtle">{l.n}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1">
          <IncomeBar data={income} />
        </div>
      </div>

      {/* KPIs de cartera */}
      <div className="grid w-full grid-cols-2 gap-4 xl:w-[340px] xl:shrink-0 xl:grid-cols-1">
        {finanzasKpis.map((k) => <KpiCard key={k.label} k={k} />)}
      </div>
    </div>
  );
}

// Tiempo relativo en español a partir de una fecha ISO ("hace 12 min", etc.).
function relativeTime(iso?: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Math.max(0, Date.now() - then);
  const min = Math.round(diff / 60000);
  if (min < 1) return "hace un momento";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "hace 1 día" : `hace ${d} días`;
}

function ActividadTab({ data, loading }: TabProps) {
  const items = data?.recentAnnouncements ?? [];
  const tone = TONE.primary;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
      <div className="flex flex-col gap-4 border-b border-line px-6 py-5">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-semibold text-ink">Comunicados recientes</h3>
              <span className="flex items-center gap-1.5 rounded-full bg-s-success px-2 py-1 text-[10px] font-semibold text-s-success-fg">
                <span className="h-1.5 w-1.5 rounded-full bg-s-success-fg" />
                En vivo
              </span>
            </div>
            <p className="text-[13px] text-subtle">
              Últimos comunicados publicados · {items.length} registros
            </p>
          </div>
          <a
            href="/comunicaciones"
            className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-[13px] font-medium text-primary hover:bg-primary/5"
          >
            Ver todo
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
      <div className="flex flex-col px-2">
        {loading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-surface" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-1 py-14 text-center">
            <MailCheck className="h-6 w-6 text-subtle" />
            <p className="text-sm font-medium text-ink">Sin comunicados recientes</p>
            <p className="text-xs text-subtle">Cuando se publique un comunicado aparecerá aquí.</p>
          </div>
        ) : (
          items.map((a, i) => (
            <div
              key={a.id}
              className={`flex items-center gap-3.5 px-4 py-3.5 ${i < items.length - 1 ? "border-b border-line" : ""}`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${tone.badgeBg}`}>
                <MailCheck className={`h-4 w-4 ${tone.badgeFg}`} />
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <p className="text-[13px] font-semibold text-ink">{a.title ?? "Comunicado"}</p>
                {a.author && (
                  <p className="text-xs text-subtle">
                    Por {a.author.firstName} {a.author.lastName}
                  </p>
                )}
              </div>
              <span className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold ${tone.badgeBg} ${tone.badgeFg}`}>
                Comunicación
              </span>
              <span className="w-[78px] shrink-0 text-right text-xs text-subtle">{relativeTime(a.publishedAt)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AlertasTab() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
      <div className="flex flex-col gap-3.5 border-b border-line px-6 py-5">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <BellRing className="h-4 w-4 text-danger" />
              <h3 className="text-base font-semibold text-ink">Alertas críticas</h3>
              <span className="rounded-full bg-danger px-1.5 py-0.5 text-[11px] font-bold text-white">27</span>
            </div>
            <p className="text-xs text-subtle">Requieren acción inmediata</p>
          </div>
          <button className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-line text-subtle hover:bg-surface">
            <Ellipsis className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex max-w-md gap-0.5 rounded-lg bg-surface p-1">
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
      <div className="grid flex-1 grid-cols-1 gap-2.5 px-4 py-3 lg:grid-cols-2">
        {ALERTS.map((al) => {
          const tone = TONE[al.tone];
          const Icon = al.icon;
          return (
            <div key={al.title} className="flex gap-3 rounded-xl border border-line bg-card p-3.5">
              <span className={`w-[3px] shrink-0 rounded-full ${al.bar}`} />
              <div className="flex flex-1 flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`h-3.5 w-3.5 ${tone.badgeFg}`} />
                    <span className="text-[13px] font-semibold text-ink">{al.title}</span>
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
          <span className="text-xs font-medium text-ink">Sugerencias IA disponibles</span>
        </div>
        <button className="flex items-center gap-1 text-xs font-semibold text-primary">
          Ver las 27
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

/* ---------------- página ---------------- */

export default function DashboardPage() {
  const [tab, setTab] = useState<TabId>("resumen");
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [charts, setCharts] = useState<ChartsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    apiGet<DashboardData>("/dashboard")
      .then((d) => alive && setData(d))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    // Series para los gráficos (admin/coordinación); silencioso si no aplica.
    apiGet<ChartsData>("/dashboard/charts")
      .then((c) => alive && setCharts(c))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Fecha de hoy (en cliente, para evitar desajustes de hidratación).
  useEffect(() => {
    setToday(
      new Intl.DateTimeFormat("es-CO", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    );
  }, []);

  const hour = new Date().getHours();
  const saludo = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const nombre = user?.firstName ?? "";

  // Conteos dinámicos para las pestañas que sí tienen datos reales.
  const tabs = TABS.map((t) =>
    t.id === "actividad"
      ? { ...t, count: String(data?.recentAnnouncements?.length ?? 0) }
      : t.id === "alertas"
        ? { ...t, count: undefined }
        : t,
  );

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
              {saludo}{nombre ? `, ${nombre}` : ""} 👋
            </h1>
            <p className="text-sm text-subtle">
              Esto está pasando en el colegio{today ? ` hoy, ${today}` : ""}.
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
          <RangeSelect />
          {data?.currentYear && (
            <span className="text-[13px] font-medium text-subtle">Año lectivo {data.currentYear.year}</span>
          )}
        </div>
      </div>

      {/* ====== Tabs ====== */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-line">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
                active ? "text-primary" : "text-subtle hover:text-ink"
              }`}
            >
              {t.label}
              {t.count && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    active ? "bg-primary/10 text-primary" : "bg-surface text-subtle"
                  }`}
                >
                  {t.count}
                </span>
              )}
              {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>

      {/* ====== Tab content ====== */}
      {tab === "resumen" && <ResumenTab data={data} loading={loading} />}
      {tab === "academico" && <AcademicoTab charts={charts} />}
      {tab === "finanzas" && <FinanzasTab data={data} loading={loading} charts={charts} />}
      {tab === "actividad" && <ActividadTab data={data} loading={loading} />}
      {tab === "alertas" && <AlertasTab />}
    </div>
  );
}
