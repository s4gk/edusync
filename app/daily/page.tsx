import {
  Search,
  Sun,
  Bell,
  Archive,
  Share2,
  Printer,
  SlidersHorizontal,
  Download,
  Maximize2,
  ShieldAlert,
  CreditCard,
  GraduationCap,
  RefreshCw,
  Inbox,
  Settings2,
  Mail,
  ArrowRight,
  Plus,
  List,
  Columns3,
  Star,
  ArrowUpRight,
  Quote,
  MessagesSquare,
  type LucideIcon,
} from "lucide-react";

/* ---------------- datos ---------------- */

const NAV = ["Hoy", "Agenda", "Cohortes", "Procesos", "Biblioteca", "Reportes"];

const ANCHORS = ["Briefing del día", "Bandeja", "Procesos en curso", "Cohorte destacada", "Voces y métricas"];

const RINGS = [
  { label: "Asistencia", pct: 94, color: "#16A34A", r: 86 },
  { label: "Académico", pct: 78, color: "#5749F4", r: 64 },
  { label: "Cobranza", pct: 66, color: "#B45309", r: 42 },
];

type Tone = "error" | "warning" | "info";
const BADGE: Record<Tone, { box: string; bar: string }> = {
  error: { box: "bg-s-error text-s-error-fg", bar: "bg-s-error-fg" },
  warning: { box: "bg-s-warning text-s-warning-fg", bar: "bg-s-warning-fg" },
  info: { box: "bg-s-info text-s-info-fg", bar: "bg-s-info-fg" },
};

const TAKEAWAYS: { icon: LucideIcon; tone: Tone; title: string; sub: string; action: string; primary?: boolean }[] = [
  { icon: ShieldAlert, tone: "error", title: "7 docentes no han subido notas", sub: "Vence hoy a las 18:00 · Periodo 2", action: "Notificar", primary: true },
  { icon: CreditCard, tone: "warning", title: "Recordatorio de cartera 30+ días", sub: "63 familias · $ 142,5 M COP", action: "Programar" },
  { icon: GraduationCap, tone: "info", title: "Plan de refuerzo Química 11°A", sub: "7 estudiantes bajo 3.0 · Asignar tutor", action: "Asignar" },
];

const INBOX_SEGMENTS = [
  { label: "Urgentes", active: true },
  { label: "Padres", count: "3" },
  { label: "Docentes", count: "2" },
  { label: "Internas" },
];

const INBOX = [
  { color: "#9A6A1F", bg: "bg-amber-100 text-amber-800", initials: "CR", name: "Carolina Rivera", time: "08:02", subject: "Solicitud de cita — bajo rendimiento de Mateo (7°B)", preview: "Quisiera reunirme esta semana para revisar el plan de apoyo en matemáticas…", dot: "bg-amber-600" },
  { bg: "bg-blue-100 text-blue-800", initials: "JM", name: "Prof. Jorge Mendoza", time: "07:48", subject: "Notas Periodo 2 — Ciencias 9°A listas para revisión", preview: "Subí las notas anoche. Pendiente tu aprobación para publicar boletines…" },
  { bg: "bg-rose-100 text-rose-800", initials: "SY", name: "Sistema Edusync", time: "07:30", subject: "Alerta crítica — Inasistencia consecutiva > 5 días", preview: "3 estudiantes han superado el umbral de inasistencia. Acción sugerida: contactar acudientes…", dot: "bg-rose-600" },
  { bg: "bg-emerald-100 text-emerald-800", initials: "DG", name: "Diana Gómez", time: "Ayer", subject: "Pago confirmado — Pensión mayo", preview: "Gracias por el recordatorio amable. Adjunto comprobante PSE de $ 480.000…" },
  { bg: "bg-violet-100 text-violet-800", initials: "CV", name: "Coord. Camilo Vargas", time: "Ayer", subject: "Cronograma Día E — propuesta de agenda", preview: "Te dejo la versión 2 del cronograma para el 30 de mayo. Espero tu visto bueno antes del jueves…" },
];

type Card = { chip: string; chipTone: string; id: string; title: string; meta: string; progress: number; bar: string };

const COLUMNS: { title: string; dot: string; count: string; cards: Card[] }[] = [
  {
    title: "Matrículas 2026", dot: "bg-blue-900", count: "12",
    cards: [
      { chip: "Nuevo", chipTone: "bg-s-warning text-s-warning-fg", id: "STU-0124", title: "12 solicitudes — Grado Transición", meta: "Asignado a Secretaría", progress: 0.65, bar: "bg-amber-700" },
      { chip: "Revisión", chipTone: "bg-s-info text-s-info-fg", id: "STU-0098", title: "Familia Restrepo — 8°B", meta: "Coord. Admisiones", progress: 0.95, bar: "bg-blue-900" },
      { chip: "Entrevista", chipTone: "bg-surface text-subtle", id: "STU-0142", title: "4 entrevistas programadas — Hoy 10:00", meta: "Psicología", progress: 0.35, bar: "bg-primary" },
    ],
  },
  {
    title: "Aprobación de notas", dot: "bg-primary", count: "8",
    cards: [
      { chip: "Aprobar", chipTone: "bg-s-success text-s-success-fg", id: "NTA-0231", title: "Ciencias 9°A — Prof. Mendoza", meta: "Subido hace 14 h · 32 estudiantes", progress: 0.95, bar: "bg-emerald-700" },
      { chip: "Revisión", chipTone: "bg-s-info text-s-info-fg", id: "NTA-0218", title: "Matemáticas 5°A — Prof. Ríos", meta: "Coord. revisando · 12 ajustes", progress: 0.6, bar: "bg-blue-900" },
      { chip: "Incompleto", chipTone: "bg-s-error text-s-error-fg", id: "NTA-0204", title: "Inglés 11°A — Prof. Holguín", meta: "Faltan 3 estudiantes evaluados", progress: 0.4, bar: "bg-rose-800" },
    ],
  },
  {
    title: "Cobranzas y finanzas", dot: "bg-amber-700", count: "6",
    cards: [
      { chip: "Mora 30+", chipTone: "bg-s-warning text-s-warning-fg", id: "COB-0301", title: "Lote A — 27 familias", meta: "Total $ 64,2 M · WhatsApp programado", progress: 0.25, bar: "bg-amber-700" },
      { chip: "Al día", chipTone: "bg-s-success text-s-success-fg", id: "COB-0288", title: "Lote B — 18 familias", meta: "Cuotas en pago · al día", progress: 0.7, bar: "bg-emerald-700" },
      { chip: "Crítico", chipTone: "bg-s-error text-s-error-fg", id: "COB-0276", title: "Lote C — 8 familias", meta: "Pendiente reunión con Rectoría", progress: 0.12, bar: "bg-rose-800" },
    ],
  },
];

const STATS = [
  { label: "Promedio", value: "4.3 / 5.0" },
  { label: "Asistencia", value: "96.4%" },
  { label: "Observaciones", value: "0 obs." },
  { label: "Entregas", value: "88%" },
];

const FEATURED = [
  { initials: "VG", bg: "bg-blue-100 text-blue-800", name: "Valentina Gómez", note: "4.8" },
  { initials: "SA", bg: "bg-emerald-100 text-emerald-800", name: "Samuel Acosta", note: "4.7" },
  { initials: "MR", bg: "bg-violet-100 text-violet-800", name: "Mariana Ruiz", note: "4.6" },
];

const RING_SIZE = 200;
const CENTER = RING_SIZE / 2;

/* ---------------- página ---------------- */

export default function DailyPage() {
  return (
    <div className="min-h-screen bg-card">
      {/* ====== top nav ====== */}
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-line bg-card px-8">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-sm font-extrabold text-white">E</span>
            <span className="text-sm font-extrabold tracking-[0.18em] text-ink">EDUSYNC</span>
            <span className="h-4 w-px bg-line" />
            <span className="text-[10px] font-semibold tracking-[0.18em] text-subtle">DAILY</span>
          </div>
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((n, i) => (
              <span
                key={n}
                className={`flex flex-col items-center px-2 py-3 text-[13px] ${
                  i === 0 ? "font-bold text-ink" : "font-medium text-subtle"
                }`}
              >
                {n}
                {i === 0 && <span className="mt-1 h-0.5 w-5 rounded-full bg-primary" />}
              </span>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden h-8 items-center gap-2 rounded-full border border-line px-3 sm:flex">
            <Search className="h-3.5 w-3.5 text-subtle" />
            <span className="text-xs text-subtle">Buscar</span>
            <span className="rounded border border-line bg-surface px-1 py-0.5 text-[10px] text-subtle">⌘K</span>
          </div>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-ink hover:bg-surface"><Sun className="h-4 w-4" /></button>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-ink hover:bg-surface"><Bell className="h-4 w-4" /></button>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-[11px] font-bold text-primary">MR</span>
        </div>
      </header>

      {/* ====== editorial header ====== */}
      <section className="flex flex-col gap-5 px-8 py-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="font-bold tracking-[0.18em] text-primary">EDICIÓN N.º 142</span>
            <span className="h-4 w-px bg-line" />
            <span className="text-subtle">Jueves 23 de mayo de 2026</span>
            <span className="h-4 w-px bg-line" />
            <span className="flex items-center gap-1.5 text-subtle"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> Datos al 08:14 a.m.</span>
          </div>
          <div className="flex items-center gap-1">
            {[Archive, Share2, Printer].map((Icon, i) => (
              <button key={i} className="flex h-8 w-8 items-center justify-center rounded-lg text-subtle hover:bg-surface"><Icon className="h-3.5 w-3.5" /></button>
            ))}
          </div>
        </div>
        <h1 className="max-w-3xl text-[40px] font-bold leading-[1.05] -tracking-[0.025em] text-ink">Buenos días, Rectora Rojas.</h1>
        <p className="max-w-3xl text-[17px] leading-relaxed text-subtle">
          Hoy hay 27 decisiones pendientes, 312 boletines por aprobar y 41 estudiantes en riesgo. Esto es lo que importa antes del recreo.
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <div className="flex flex-wrap items-center gap-2.5 text-[13px]">
            {ANCHORS.map((a, i) => (
              <span key={a} className={i === 0 ? "font-bold text-ink" : "font-medium text-subtle"}>
                {a}{i < ANCHORS.length - 1 && <span className="ml-2.5 text-subtle">·</span>}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button className="flex h-9 items-center gap-2 rounded-lg border border-line px-3.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Personalizar edición
            </button>
            <button className="flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90">
              <Download className="h-3.5 w-3.5" /> Exportar PDF
            </button>
          </div>
        </div>
      </section>

      {/* ====== hero row ====== */}
      <section className="flex flex-col gap-5 px-8 pb-6 xl:flex-row">
        {/* briefing hero */}
        <div className="flex flex-1 flex-col gap-6 rounded-3xl border border-line bg-card p-8">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold tracking-[0.18em] text-primary">LEAD STORY</span>
              <h2 className="text-2xl font-bold -tracking-[0.01em] text-ink">Cierre del Periodo 2: la última milla</h2>
              <p className="text-sm text-subtle">Te quedan 9 días para cerrar boletines y notificar acudientes.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-s-info px-2.5 py-1 text-[11px] font-semibold text-s-info-fg">En curso</span>
              <button className="flex h-7 w-7 items-center justify-center rounded-lg text-subtle hover:bg-surface"><Maximize2 className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-center">
            {/* anillos */}
            <div className="flex items-center gap-3">
              <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} className="shrink-0">
                {RINGS.map((ring) => {
                  const circ = 2 * Math.PI * ring.r;
                  return (
                    <g key={ring.label} transform={`rotate(-90 ${CENTER} ${CENTER})`}>
                      <circle cx={CENTER} cy={CENTER} r={ring.r} fill="none" stroke="var(--surface)" strokeWidth={14} />
                      <circle
                        cx={CENTER} cy={CENTER} r={ring.r} fill="none" stroke={ring.color} strokeWidth={14}
                        strokeLinecap="round" strokeDasharray={`${(ring.pct / 100) * circ} ${circ}`}
                      />
                    </g>
                  );
                })}
              </svg>
              <div className="flex flex-col gap-1.5">
                {RINGS.map((r) => (
                  <div key={r.label} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                    <span className="text-xs text-subtle">{r.label}</span>
                    <span className="text-xs font-semibold text-ink">{r.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            {/* takeaways */}
            <div className="flex flex-1 flex-col gap-2.5">
              <span className="text-[11px] font-bold tracking-[0.18em] text-subtle">PARA HACER HOY</span>
              {TAKEAWAYS.map((t) => {
                const Icon = t.icon;
                const b = BADGE[t.tone];
                return (
                  <div key={t.title} className="flex items-center gap-3.5 rounded-2xl bg-surface p-3.5">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${b.box}`}><Icon className="h-5 w-5" /></span>
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-semibold text-ink">{t.title}</span>
                      <span className="text-xs text-subtle">{t.sub}</span>
                    </div>
                    <button className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold ${t.primary ? "bg-primary text-white" : "border border-line text-ink"}`}>
                      {t.action}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-line pt-4">
            <span className="flex items-center gap-1.5 text-xs text-subtle"><RefreshCw className="h-3 w-3" /> Actualizado a las 08:14 · próximo refresco en 12 min</span>
            <span className="flex items-center gap-2.5 text-xs text-subtle">
              <span className="flex -space-x-2">
                {[["AR", "bg-blue-100 text-blue-800"], ["JM", "bg-emerald-100 text-emerald-800"], ["LD", "bg-amber-100 text-amber-800"]].map(([t, c]) => (
                  <span key={t} className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-card text-[9px] font-bold ${c}`}>{t}</span>
                ))}
              </span>
              Equipo directivo conectado
            </span>
          </div>
        </div>

        {/* inbox */}
        <div className="flex w-full flex-col overflow-hidden rounded-3xl border border-line bg-card xl:w-[440px] xl:shrink-0">
          <div className="flex flex-col gap-2.5 border-b border-line px-6 py-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-base font-semibold text-ink">Bandeja</span>
                <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-white">8</span>
              </div>
              <div className="flex items-center gap-1">
                <button className="flex h-7 w-7 items-center justify-center rounded-md text-subtle hover:bg-surface"><Inbox className="h-4 w-4" /></button>
                <button className="flex h-7 w-7 items-center justify-center rounded-md text-subtle hover:bg-surface"><Settings2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="flex gap-1 rounded-[10px] bg-surface p-1">
              {INBOX_SEGMENTS.map((s) => (
                <button key={s.label} className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${s.active ? "border border-line bg-card text-ink" : "text-subtle"}`}>
                  {s.label}
                  {s.count && <span className="rounded-full bg-subtle/25 px-1.5 text-[10px] font-bold text-ink">{s.count}</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col">
            {INBOX.map((m, i) => (
              <div key={m.name} className={`flex gap-3 px-5 py-3 ${i < INBOX.length - 1 ? "border-b border-line" : ""}`}>
                <span className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${m.bg}`}>
                  {m.initials}
                  {m.dot && <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${m.dot}`} />}
                </span>
                <div className="flex flex-1 flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-ink">{m.name}</span>
                    <span className="text-[11px] text-subtle">{m.time}</span>
                  </div>
                  <span className="text-[13px] font-medium text-ink">{m.subject}</span>
                  <span className="text-xs leading-relaxed text-subtle">{m.preview}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-line px-5 py-3">
            <span className="flex items-center gap-1.5 text-xs text-ink"><Mail className="h-3.5 w-3.5" /> Bandeja unificada <span className="text-subtle">— 142 sin leer</span></span>
            <button className="flex items-center gap-1 text-xs font-semibold text-primary">Abrir bandeja completa <ArrowRight className="h-3 w-3" /></button>
          </div>
        </div>
      </section>

      {/* ====== pipeline kanban ====== */}
      <section className="flex flex-col gap-4 px-8 py-6">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold tracking-[0.18em] text-primary">PROCESOS EN CURSO</span>
            <h2 className="text-2xl font-bold -tracking-[0.01em] text-ink">Tablero de operaciones</h2>
            <p className="text-[13px] text-subtle">14 procesos activos a lo largo de la semana</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-[10px] border border-line bg-card p-1">
              {["Esta semana", "Mes", "Trimestre"].map((s, i) => (
                <button key={s} className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${i === 0 ? "bg-surface text-ink" : "text-subtle"}`}>{s}</button>
              ))}
            </div>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink hover:bg-surface"><List className="h-4 w-4" /></button>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white"><Columns3 className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.title} className="flex flex-col gap-3 rounded-[20px] bg-surface p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                  <span className="text-[13px] font-bold text-ink">{col.title}</span>
                  <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-bold text-subtle">{col.count}</span>
                </div>
                <Plus className="h-4 w-4 text-subtle" />
              </div>
              {col.cards.map((c) => (
                <div key={c.id} className="flex flex-col gap-2 rounded-[14px] border border-line bg-card p-3.5">
                  <div className="flex items-center justify-between">
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${c.chipTone}`}>{c.chip}</span>
                    <span className="text-[10px] tracking-wide text-subtle">{c.id}</span>
                  </div>
                  <span className="text-[13px] font-semibold text-ink">{c.title}</span>
                  <span className="text-[11px] text-subtle">{c.meta}</span>
                  <div className="h-1 overflow-hidden rounded-full bg-surface">
                    <span className={`block h-full rounded-full ${c.bar}`} style={{ width: `${c.progress * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ====== spotlight + insights ====== */}
      <section className="flex flex-col gap-5 px-8 pb-10 xl:flex-row">
        {/* cohort spotlight */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-line bg-card lg:flex-row">
          <div
            className="flex w-full flex-col justify-between gap-5 p-8 text-white lg:w-[440px] lg:shrink-0"
            style={{ background: "linear-gradient(135deg, #5749F4 0%, #7C5BFF 50%, #2D2380 100%)" }}
          >
            <div className="flex flex-col gap-3.5">
              <span className="flex w-fit items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-2.5 py-1.5 text-[10px] font-bold tracking-[0.14em]">
                <Star className="h-3 w-3" /> COHORTE DESTACADA · SEMANA 21
              </span>
              <span className="text-[88px] font-extrabold leading-none -tracking-[0.05em]">Grado 9°A</span>
              <p className="text-sm leading-relaxed text-white/80">
                Ciencias Sociales lidera el Periodo 2 con un alza de +0,6 frente al periodo anterior. La cohorte muestra la mejora más consistente del colegio.
              </p>
            </div>
            <div className="flex flex-col gap-3.5">
              <div className="flex flex-wrap gap-2">
                {["+0,6 promedio", "96,4% asistencia", "0 observaciones"].map((m) => (
                  <span key={m} className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1.5 text-[11px] font-medium">{m}</span>
                ))}
              </div>
              <button className="flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[13px] font-semibold text-primary">
                Abrir reporte de cohorte <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-5 p-8">
            <div className="flex items-end justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold tracking-[0.18em] text-subtle">DESEMPEÑO DEL PERIODO</span>
                <h3 className="text-xl font-bold text-ink">Indicadores clave</h3>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {STATS.map((s) => (
                <div key={s.label} className="flex flex-col gap-2.5 rounded-[14px] border border-line bg-card p-4">
                  <span className="text-[11px] font-medium text-subtle">{s.label}</span>
                  <span className="text-[22px] font-bold -tracking-[0.02em] text-ink">{s.value}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2.5 rounded-[14px] bg-surface p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink">Estudiantes destacados</span>
                <button className="text-[11px] font-semibold text-primary">Ver lista</button>
              </div>
              <div className="flex gap-2">
                {FEATURED.map((f) => (
                  <div key={f.name} className="flex flex-1 items-center gap-2 rounded-[10px] bg-card p-2.5">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold ${f.bg}`}>{f.initials}</span>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold text-ink">{f.name}</span>
                      <span className="text-[10px] text-subtle">Prom {f.note}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* insights */}
        <div className="flex w-full flex-col justify-between gap-4 rounded-3xl bg-surface p-7 xl:w-[440px] xl:shrink-0">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] text-ink">
                <Quote className="h-3.5 w-3.5 text-primary" /> VOCES DE LA COMUNIDAD
              </span>
            </div>
            <p className="text-[22px] font-semibold leading-snug -tracking-[0.01em] text-ink">
              “El plan de refuerzo cambió la manera en que mi hija ve las matemáticas. Pasó de evitarlas a pedirlas.”
            </p>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-700 text-[13px] font-bold text-white">CR</span>
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold text-ink">Carolina Rivera</span>
                <span className="text-[11px] text-subtle">Acudiente · Grado 7°B · Encuesta NPS Q2</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3.5">
            <span className="h-px w-full bg-line" />
            <div className="flex gap-3">
              {[{ l: "NPS familias", v: "72" }, { l: "Satisfacción docentes", v: "4,5/5" }].map((m) => (
                <div key={m.l} className="flex flex-1 flex-col gap-1 rounded-xl bg-card p-3">
                  <span className="text-[11px] text-subtle">{m.l}</span>
                  <span className="text-lg font-bold text-ink">{m.v}</span>
                </div>
              ))}
            </div>
            <button className="flex items-center justify-center gap-2 rounded-full border border-line bg-card py-2.5 text-xs font-semibold text-primary">
              <MessagesSquare className="h-3.5 w-3.5" /> Ver todas las voces (42)
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
