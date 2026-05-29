import { FileText, CalendarPlus, TrendingUp, Activity, Award, TriangleAlert, Sparkles, type LucideIcon } from "lucide-react";

/* ---------------- datos ---------------- */

const PERIODS = [
  { label: "P3·23", value: "3.7", x: 44, y: 178 },
  { label: "P1·24", value: "3.8", x: 204, y: 167 },
  { label: "P2·24", value: "4.0", x: 364, y: 145 },
  { label: "P3·24", value: "3.9", x: 524, y: 156 },
  { label: "P1·25", value: "4.0", x: 684, y: 145 },
  { label: "P2·25", value: "4.3", x: 842, y: 99 },
];

const linePath = "M" + PERIODS.map((p) => `${p.x},${p.y}`).join(" L");
const areaPath = `${linePath} L842,280 L44,280 Z`;
const GRID = [30, 85, 140, 195, 250];
const YLABS = ["5.0", "4.5", "4.0", "3.5", "3.0"];

const SUMMARY: { icon: LucideIcon; label: string; value: string; sub: string; tone: string }[] = [
  { icon: TrendingUp, label: "TENDENCIA GENERAL", value: "+0.7", sub: "vs hace 2 años", tone: "bg-s-success text-s-success-fg" },
  { icon: Activity, label: "CONSTANCIA", value: "5 de 6", sub: "periodos al alza", tone: "bg-s-info text-s-info-fg" },
  { icon: Award, label: "FORTALEZA", value: "4.9", sub: "Ciencias Sociales", tone: "bg-primary-tint text-primary" },
  { icon: TriangleAlert, label: "A REFORZAR", value: "3.0", sub: "Tecnología e Informática", tone: "bg-s-error text-s-error-fg" },
];

/* ---------------- página ---------------- */

export default function TrayectoriaPage() {
  return (
    <div className="min-h-screen bg-bg">
      <header className="flex h-14 items-center justify-between border-b border-line bg-card px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-sm font-extrabold text-white">E</span>
          <span className="text-sm font-bold tracking-wide text-ink">EDUSYNC</span>
          <span className="hidden text-xs text-subtle sm:block">· Seguimiento · Camila Restrepo</span>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-[11px] font-bold text-primary">CM</span>
      </header>

      <div className="flex flex-col gap-6 px-6 py-7 sm:px-8">
        {/* header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold tracking-[0.18em] text-primary">SEGUIMIENTO LONGITUDINAL · DIRECTOR DE GRUPO</span>
            <h1 className="text-[28px] font-extrabold -tracking-[0.02em] text-ink">La trayectoria de Camila</h1>
            <p className="text-sm text-subtle">Dos años de historia académica. La tendencia es clara: viene subiendo de forma sostenida.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex h-9 items-center gap-2 rounded-lg border border-line px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface"><FileText className="h-3.5 w-3.5" /> Informe de seguimiento</button>
            <button className="flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"><CalendarPlus className="h-3.5 w-3.5" /> Agendar reunión</button>
          </div>
        </div>

        {/* hero: chart + summary */}
        <div className="flex flex-col gap-5 xl:flex-row">
          {/* chart */}
          <div className="flex flex-1 flex-col gap-4 rounded-[20px] border border-line bg-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-base font-semibold text-ink">Promedio general por periodo</h3>
                <span className="text-xs text-subtle">Escala 0–5 · línea de tendencia</span>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-s-success px-2.5 py-1 text-[11px] font-bold text-s-success-fg">
                <TrendingUp className="h-3 w-3" /> +0.7 acumulado
              </span>
            </div>
            <div className="relative">
              <svg viewBox="0 0 900 280" className="w-full" preserveAspectRatio="none" style={{ height: 280 }}>
                {GRID.map((y, i) => (
                  <line key={y} x1={20} y1={y} x2={900} y2={y} stroke={i === 2 ? "#5749F4" : "var(--line)"} strokeOpacity={i === 2 ? 0.35 : 1} strokeWidth={1} />
                ))}
                <path d={areaPath} fill="#5749F4" fillOpacity={0.15} />
                <path d={linePath} fill="none" stroke="#5749F4" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
                {PERIODS.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={i === PERIODS.length - 1 ? 8 : 5.5} fill={i === PERIODS.length - 1 ? "#5749F4" : "var(--card)"} stroke="#5749F4" strokeWidth={i === PERIODS.length - 1 ? 4 : 2.5} />
                ))}
              </svg>
              {/* y labels */}
              <div className="pointer-events-none absolute inset-y-0 left-0 flex flex-col justify-between py-[24px] text-[10px] font-medium text-subtle">
                {YLABS.map((l) => <span key={l}>{l}</span>)}
              </div>
            </div>
            {/* x labels */}
            <div className="flex justify-between px-2">
              {PERIODS.map((p) => (
                <div key={p.label} className="flex flex-col items-center gap-0.5">
                  <span className="text-[11px] font-bold text-ink">{p.value}</span>
                  <span className="text-[10px] text-subtle">{p.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* summary */}
          <div className="flex w-full flex-col gap-3.5 xl:w-[340px] xl:shrink-0">
            {SUMMARY.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex items-center gap-3.5 rounded-2xl border border-line bg-card p-4">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.tone}`}><Icon className="h-5 w-5" /></span>
                  <div className="flex flex-1 flex-col">
                    <span className="text-[10px] font-bold tracking-[0.14em] text-subtle">{s.label}</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-extrabold text-ink">{s.value}</span>
                      <span className="text-[11px] text-subtle">{s.sub}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="flex flex-col gap-2.5 rounded-2xl bg-surface p-4">
              <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.14em] text-primary"><Sparkles className="h-3.5 w-3.5" /> LECTURA DEL COACH</span>
              <p className="text-xs leading-relaxed text-ink">
                La mejora se aceleró tras el cambio de metodología en Matemáticas. Si sostiene el hábito de estudio, alcanzaría nivel Superior en el próximo periodo.
              </p>
            </div>
          </div>
        </div>

        {/* desglose por materia (tendencia 2 años) */}
        <div className="flex flex-col gap-4 rounded-[20px] border border-line bg-card p-6">
          <h3 className="text-base font-semibold text-ink">Evolución por materia</h3>
          <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
            {[
              { name: "Ciencias Sociales", from: "4.2", to: "4.9", up: true },
              { name: "Matemáticas", from: "3.8", to: "4.3", up: true },
              { name: "Ciencias Naturales", from: "4.3", to: "4.7", up: true },
              { name: "Lengua Castellana", from: "4.0", to: "4.2", up: true },
              { name: "Inglés", from: "4.1", to: "4.0", up: false },
              { name: "Tecnología", from: "3.6", to: "3.0", up: false },
            ].map((m) => (
              <div key={m.name} className="flex items-center gap-3 border-b border-line py-2 last:border-0">
                <span className="flex-1 text-[13px] font-medium text-ink">{m.name}</span>
                <span className="text-[13px] text-subtle">{m.from}</span>
                <span className="text-subtle">→</span>
                <span className="text-[13px] font-bold text-ink">{m.to}</span>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full ${m.up ? "bg-s-success text-s-success-fg" : "bg-s-error text-s-error-fg"}`}>
                  <TrendingUp className={`h-3 w-3 ${m.up ? "" : "rotate-180"}`} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
