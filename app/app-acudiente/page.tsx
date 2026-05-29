import {
  Signal,
  Wifi,
  BatteryFull,
  Bell,
  ChevronDown,
  CalendarCheck,
  Award,
  Wallet,
  FileText,
  House,
  Sparkles,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";

/* ---------------- datos ---------------- */

const STATS = [
  { icon: CalendarCheck, value: "96.4%", label: "Asistencia", color: "text-emerald-700" },
  { icon: Award, value: "6/32", label: "Posición", color: "text-primary" },
  { icon: Wallet, value: "Al día", label: "Pensión", color: "text-emerald-700" },
];

const CLASES = [
  { time: "09:00", ampm: "AM", name: "Matemáticas", meta: "Prof. Carlos Ríos · Aula 204", badge: "En 46 min", now: true },
  { time: "10:30", ampm: "AM", name: "Ciencias Sociales", meta: "Prof. Ana Mejía · Aula 102" },
];

const NOVEDADES = [
  { icon: Award, box: "bg-s-success text-s-success-fg", title: "Camila recibió un reconocimiento", sub: "Liderazgo en debate · Ciencias Sociales", time: "hace 14 min" },
  { icon: FileText, box: "bg-s-info text-s-info-fg", title: "Boletín del Periodo 2 disponible", sub: "Promedio 4.3 · subió +0.4 vs P1", time: "hace 2 h" },
];

const TABS: { icon: LucideIcon; label: string; active?: boolean }[] = [
  { icon: House, label: "Hoy", active: true },
  { icon: FileText, label: "Notas" },
  { icon: Sparkles, label: "Coach" },
  { icon: MessageCircle, label: "Mensajes" },
  { icon: Wallet, label: "Pagos" },
];

/* ---------------- página ---------------- */

export default function AppAcudientePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-0 sm:p-8">
      {/* device */}
      <div className="flex h-screen w-full max-w-[414px] flex-col overflow-hidden bg-card shadow-2xl sm:h-[860px] sm:rounded-[44px] sm:border-[10px] sm:border-ink/90">
        {/* status bar */}
        <div className="flex items-center justify-between px-7 pt-3 pb-1 text-ink">
          <span className="text-[13px] font-semibold">8:14</span>
          <div className="flex items-center gap-1.5">
            <Signal className="h-3.5 w-3.5" />
            <Wifi className="h-3.5 w-3.5" />
            <BatteryFull className="h-4 w-4" />
          </div>
        </div>

        {/* header */}
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-primary text-sm font-extrabold text-white">E</span>
            <span className="text-base font-extrabold tracking-wide text-ink">Edusync</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink"><Bell className="h-[15px] w-[15px]" /></button>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-700 text-[11px] font-bold text-white">CR</span>
          </div>
        </div>

        {/* scroll content */}
        <div className="flex flex-1 flex-col gap-[18px] overflow-y-auto px-5 py-4">
          {/* greeting */}
          <div className="flex flex-col gap-1">
            <span className="text-[13px] font-medium text-subtle">Buenos días, Carolina</span>
            <h1 className="text-2xl font-extrabold leading-tight -tracking-[0.02em] text-ink">Tu hija Camila empieza el día en 46 min ⏰</h1>
          </div>

          {/* student card */}
          <div className="flex items-center gap-3 rounded-[18px] p-4 text-white" style={{ background: "linear-gradient(120deg, #5749F4 0%, #7C5BFF 100%)" }}>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-base font-extrabold text-primary">CR</span>
            <div className="flex flex-1 flex-col">
              <span className="text-sm font-bold">Camila Restrepo</span>
              <span className="flex items-center gap-2 text-[11px] text-white/80">8°B <span>·</span> <span className="font-semibold">Promedio 4.3</span></span>
            </div>
            <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/15"><ChevronDown className="h-3.5 w-3.5" /></span>
          </div>

          {/* quick stats */}
          <div className="flex gap-2.5">
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex flex-1 flex-col gap-1.5 rounded-[14px] border border-line bg-card p-3.5">
                  <Icon className={`h-4 w-4 ${s.color}`} />
                  <span className="text-lg font-extrabold text-ink">{s.value}</span>
                  <span className="text-[10px] text-subtle">{s.label}</span>
                </div>
              );
            })}
          </div>

          {/* clases de hoy */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-ink">Clases de hoy</span>
              <button className="text-[11px] font-semibold text-primary">Ver todas</button>
            </div>
            {CLASES.map((c) => (
              <div key={c.time} className="flex items-center gap-3 rounded-[14px] border border-line bg-card p-3.5">
                <div className="flex flex-col items-center">
                  <span className={`text-[13px] font-extrabold ${c.now ? "text-primary" : "text-ink"}`}>{c.time}</span>
                  <span className="text-[9px] font-semibold text-subtle">{c.ampm}</span>
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-[13px] font-bold text-ink">{c.name}</span>
                  <span className="text-[11px] text-subtle">{c.meta}</span>
                </div>
                {c.badge && <span className="rounded-full bg-s-success px-2 py-0.5 text-[9px] font-bold text-s-success-fg">{c.badge}</span>}
              </div>
            ))}
          </div>

          {/* novedades */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-ink">Novedades</span>
              <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-white">3 nuevas</span>
            </div>
            {NOVEDADES.map((n) => {
              const Icon = n.icon;
              return (
                <div key={n.title} className="flex items-start gap-3 rounded-[14px] border border-line bg-card p-3.5">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${n.box}`}><Icon className="h-3.5 w-3.5" /></span>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="text-xs font-bold text-ink">{n.title}</span>
                    <span className="text-[11px] text-subtle">{n.sub}</span>
                    <span className="text-[10px] text-subtle">{n.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* bottom tabs */}
        <div className="flex items-center justify-between border-t border-line bg-card px-3 pb-5 pt-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.label} className="flex flex-1 flex-col items-center gap-0.5 py-1.5">
                <Icon className={`h-[22px] w-[22px] ${t.active ? "text-primary" : "text-subtle"}`} />
                <span className={`text-[10px] ${t.active ? "font-bold text-primary" : "font-medium text-subtle"}`}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
