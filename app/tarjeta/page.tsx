import {
  Download,
  Share2,
  Info,
  Flame,
  Trophy,
  TrendingUp,
  Clock,
  Users,
  Target,
  Star,
  type LucideIcon,
} from "lucide-react";

/* ---------------- datos ---------------- */

const AREAS = [
  { name: "Cs. Sociales", value: 98 },
  { name: "Ed. Física", value: 96 },
  { name: "Cs. Naturales", value: 94 },
  { name: "Ed. Artística", value: 88 },
  { name: "Matemáticas", value: 86 },
  { name: "Lengua", value: 84 },
  { name: "Inglés", value: 80 },
  { name: "Tecnología", value: 60 },
];

const ATRIBUTOS = [
  { label: "Asistencia", value: 98, sub: "+4 vs P1", color: "bg-emerald-400" },
  { label: "Constancia", value: 94, sub: "Racha de 18 días", color: "bg-emerald-400" },
  { label: "Convivencia", value: 92, sub: "0 observaciones", color: "bg-sky-400" },
  { label: "Académico", value: 89, sub: "+6 vs P1", color: "bg-sky-400" },
  { label: "Participación", value: 84, sub: "Estable", color: "bg-violet-400" },
  { label: "Tecnología", value: 67, sub: "A mejorar", color: "bg-rose-400" },
];

const RECORDS: { icon: LucideIcon; title: string; sub: string; badge?: string; tone?: string }[] = [
  { icon: Flame, title: "Mejor racha de asistencia", sub: "18 días seguidos sin faltar", badge: "Nuevo", tone: "bg-s-success text-s-success-fg" },
  { icon: Trophy, title: "Mejor promedio histórico", sub: "4.3 acumulado — tu marca personal", badge: "Récord", tone: "bg-primary-tint text-primary" },
  { icon: TrendingUp, title: "Salto en Matemáticas", sub: "+0.5 en un solo periodo", badge: "Nuevo", tone: "bg-s-success text-s-success-fg" },
  { icon: Clock, title: "Entregas a tiempo", sub: "94% del periodo" },
];

/* radar */
const SIZE = 300;
const CX = SIZE / 2;
const CY = SIZE / 2;
const MAXR = 118;

function point(i: number, value: number) {
  const angle = (Math.PI * 2 * i) / AREAS.length - Math.PI / 2;
  const r = (value / 100) * MAXR;
  return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)];
}

function gridPolygon(scale: number) {
  return AREAS.map((_, i) => point(i, scale * 100).join(",")).join(" ");
}

const dataPolygon = AREAS.map((a, i) => point(i, a.value).join(",")).join(" ");

/* ---------------- página ---------------- */

export default function TarjetaPage() {
  return (
    <div className="min-h-screen bg-bg">
      {/* top bar */}
      <header className="flex h-14 items-center justify-between border-b border-line bg-card px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-sm font-extrabold text-white">E</span>
          <span className="text-sm font-bold tracking-wide text-ink">EDUSYNC</span>
          <span className="hidden rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-subtle sm:block">Vista estudiante</span>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-700 text-[11px] font-bold text-white">CR</span>
      </header>

      <div className="flex flex-col gap-6 px-6 py-7 sm:px-8">
        {/* header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold tracking-[0.18em] text-primary">MI TARJETA · PERIODO 2 · 2025</span>
            <h1 className="text-[28px] font-extrabold -tracking-[0.02em] text-ink">Tu mejor periodo hasta ahora, Camila ⚡</h1>
            <p className="text-sm text-subtle">Subiste 8 puestos, cerraste con 4.3 y rompiste 3 récords personales.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex h-9 items-center gap-2 rounded-lg border border-line px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface"><Download className="h-3.5 w-3.5" /> Guardar tarjeta</button>
            <button className="flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"><Share2 className="h-3.5 w-3.5" /> Compartir</button>
          </div>
        </div>

        {/* hero row */}
        <div className="flex flex-col gap-5 lg:flex-row">
          {/* player card */}
          <div
            className="flex flex-col justify-between gap-6 overflow-hidden rounded-3xl p-7 text-white lg:w-[420px] lg:shrink-0"
            style={{ background: "linear-gradient(155deg, #1A0E5C 0%, #5749F4 55%, #9B7BFF 100%)" }}
          >
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-7xl font-black leading-none -tracking-[0.04em]">86</span>
                <span className="text-xs font-bold tracking-[0.16em] text-white/70">PUNTOS · NIVEL 5</span>
              </div>
              <span className="flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-[10px] font-bold tracking-[0.14em]">
                <Star className="h-3 w-3" /> ÉPICO
              </span>
            </div>
            <div className="flex flex-col items-center gap-3.5">
              <span className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white/40 bg-white">
                <span className="flex h-[110px] w-[110px] items-center justify-center rounded-full bg-primary text-4xl font-black text-white">CR</span>
              </span>
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold">Camila R.</span>
                <span className="text-[11px] text-white/70">8°B · ID-2025-014</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              {[["4.3", "Promedio"], ["96%", "Asistencia"], ["0", "Obs."], ["2", "Logros"]].map(([v, l], i) => (
                <div key={l} className={`flex flex-1 flex-col items-center ${i > 0 ? "border-l border-white/20" : ""}`}>
                  <span className="text-xl font-extrabold">{v}</span>
                  <span className="text-[10px] text-white/70">{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* radar card */}
          <div className="flex flex-1 flex-col gap-4 rounded-3xl border border-line bg-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-base font-semibold text-ink">Mapa de competencias</h3>
                <span className="text-xs text-subtle">Tus 8 áreas este periodo</span>
              </div>
              <span className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-subtle">Periodo 2</span>
            </div>
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
              <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0">
                {[0.25, 0.5, 0.75, 1].map((s) => (
                  <polygon key={s} points={gridPolygon(s)} fill="none" stroke="var(--line)" strokeWidth={1} opacity={0.6} />
                ))}
                {AREAS.map((_, i) => {
                  const [x, y] = point(i, 100);
                  return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="var(--line)" strokeWidth={1} opacity={0.5} />;
                })}
                <polygon points={dataPolygon} fill="#5749F4" fillOpacity={0.25} stroke="#5749F4" strokeWidth={2} />
                {AREAS.map((a, i) => {
                  const [x, y] = point(i, a.value);
                  return <circle key={i} cx={x} cy={y} r={3} fill="#5749F4" />;
                })}
              </svg>
              <div className="flex flex-1 flex-col gap-1.5 self-stretch">
                {AREAS.map((a) => (
                  <div key={a.name} className="flex items-center gap-2.5">
                    <span className="w-24 shrink-0 text-[11px] text-subtle">{a.name}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
                      <span className="block h-full rounded-full bg-primary" style={{ width: `${a.value}%` }} />
                    </span>
                    <span className="w-7 text-right text-[11px] font-bold text-ink">{a.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* atributos */}
        <div className="flex flex-col gap-3.5">
          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              <h2 className="text-lg font-bold -tracking-[0.01em] text-ink">Atributos</h2>
              <span className="text-[13px] text-subtle">Cómo se compone tu puntaje global de 86</span>
            </div>
            <span className="hidden items-center gap-1.5 text-[11px] text-subtle sm:flex"><Info className="h-3 w-3" /> Cada atributo combina varias materias y hábitos</span>
          </div>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
            {ATRIBUTOS.map((a) => (
              <div key={a.label} className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-subtle">{a.label}</span>
                  <span className="text-xl font-extrabold text-ink">{a.value}</span>
                </div>
                <span className="h-1.5 overflow-hidden rounded-full bg-surface">
                  <span className={`block h-full rounded-full ${a.color}`} style={{ width: `${a.value}%` }} />
                </span>
                <span className="text-[10px] text-subtle">{a.sub}</span>
              </div>
            ))}
          </div>
        </div>

        {/* records + level up */}
        <div className="flex flex-col gap-5 lg:flex-row">
          <div className="flex flex-1 flex-col gap-4 rounded-[20px] border border-line bg-card p-6">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-bold text-ink"><Trophy className="h-4 w-4 text-amber-500" /> Récords y rachas del periodo</span>
              <span className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-subtle">3 nuevos</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {RECORDS.map((r) => {
                const Icon = r.icon;
                return (
                  <div key={r.title} className="flex items-center gap-3.5 rounded-xl bg-surface p-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary"><Icon className="h-5 w-5" /></span>
                    <div className="flex flex-1 flex-col">
                      <span className="text-[13px] font-semibold text-ink">{r.title}</span>
                      <span className="text-[11px] text-subtle">{r.sub}</span>
                    </div>
                    {r.badge && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${r.tone}`}>{r.badge}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* level up */}
          <div
            className="flex flex-col gap-4 overflow-hidden rounded-[20px] p-6 text-white lg:w-[420px] lg:shrink-0"
            style={{ background: "linear-gradient(145deg, #5749F4 0%, #7C5BFF 100%)" }}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-[10px] font-bold tracking-[0.14em]"><Target className="h-3 w-3" /> SIGUIENTE NIVEL</span>
              <span className="text-xs font-bold text-white/80">86 / 87</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[22px] font-extrabold leading-tight -tracking-[0.01em]">Te falta 1 punto para el Nivel 6</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-white/25">
                <span className="block h-full rounded-full bg-white" style={{ width: "98%" }} />
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white text-primary"><Target className="h-5 w-5" /></span>
              <div className="flex flex-col">
                <span className="text-[13px] font-bold">Sube en Tecnología</span>
                <span className="text-[11px] text-white/80">2 entregas pendientes = +1 punto</span>
              </div>
            </div>
            <span className="flex items-center gap-2.5 text-xs font-semibold"><Users className="h-3.5 w-3.5 text-white/80" /> Estás en el top 19% de 8°B</span>
            <button className="flex items-center justify-center gap-2 rounded-[10px] bg-white py-2.5 text-[13px] font-bold text-primary">
              <Target className="h-3.5 w-3.5" /> Ver mi plan en Tecnología
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
