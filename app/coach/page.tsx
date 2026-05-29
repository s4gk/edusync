import {
  ChevronDown,
  Plus,
  Search,
  Users,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Check,
  ArrowUpRight,
  Activity,
  BookOpen,
  Paperclip,
  ArrowUp,
  X,
  type LucideIcon,
} from "lucide-react";

/* ---------------- datos ---------------- */

const CONVOS: { group: string; items: { title: string; sub: string; active?: boolean }[] }[] = [
  { group: "HOY", items: [{ title: "Periodo 2 de Camila", sub: "hace 5 min", active: true }] },
  { group: "ESTA SEMANA", items: [
    { title: "Plan de refuerzo en Tecnología", sub: "lun" },
    { title: "Cómo leer el boletín", sub: "mar" },
    { title: "Reunión con la profe Lozano", sub: "mié" },
  ] },
  { group: "ANTERIORES", items: [
    { title: "Resultados Periodo 1", sub: "12 mar" },
    { title: "Matrícula 2025", sub: "28 ene" },
  ] },
];

const STATS = [
  { label: "Promedio", value: "4.3", sub: "/ 5.0" },
  { label: "Asistencia", value: "96,4%", sub: "47/49 d" },
  { label: "Convivencia", value: "0 obs.", sub: "2 logros" },
];

const GROWTH = [
  { name: "Matemáticas", delta: "+0,5", pct: 90 },
  { name: "Ciencias Sociales", delta: "+0,3", pct: 75 },
  { name: "Inglés", delta: "+0,2", pct: 55 },
];

const PLAN_STEPS = [
  "Entregar los 2 talleres pendientes esta semana",
  "Tutoría de 30 min los martes con el profe García",
  "Mini-proyecto final para subir a nivel básico",
];

const SOURCES = [
  { title: "Boletín Periodo 2", sub: "Verificado por el colegio" },
  { title: "Notas del docente — 8 áreas", sub: "Actualizado hace 14 h" },
  { title: "Registro de asistencia", sub: "47 / 49 días" },
];

const SUGGESTIONS = ["¿Cómo apoyo en Tecnología?", "Redacta mensaje al profe", "Compara con Periodo 1"];

const CHAT: { from: "user" | "ai"; text: string; card?: "stats" | "growth" | "plan" }[] = [
  { from: "user", text: "¿Cómo le fue a Camila este periodo?" },
  { from: "ai", text: "¡Hola Carolina! Camila cerró un Periodo 2 muy sólido. Subió su promedio, mantuvo casi perfecta su asistencia y recibió 2 reconocimientos. Aquí van los números clave:", card: "stats" },
  { from: "ai", text: "Resumen en una línea: cerraste con todas las luces verdes 🟢. ¿Quieres que profundice en algún punto?" },
  { from: "user", text: "¿En qué mejoró más?" },
  { from: "ai", text: "Subió en 6 de 8 materias respecto al Periodo 1. Las tres mejoras más notables:", card: "growth" },
  { from: "ai", text: "Mi observación: el salto en Matemáticas es notable. Cambió un patrón de varios periodos donde se quedaba en 3,8–4,0. ¿Te muestro qué actividades cree el profesor que ayudaron?" },
  { from: "user", text: "¿Y en qué materia necesita apoyo?" },
  { from: "ai", text: "Una sola materia se quedó por debajo: Tecnología e Informática. El profesor Felipe García ya construyó un plan acordado con el director de grupo. Te dejo la versión resumida:", card: "plan" },
  { from: "ai", text: "Si quieres, te genero un mensaje listo para enviarle al profesor confirmando que apoyarás los 3 pasos. ¿Lo redactamos?" },
];

function Side({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 border-b border-line px-5 py-4">
      <span className="flex items-center gap-2 text-xs font-bold text-ink"><Icon className="h-3.5 w-3.5 text-primary" /> {title}</span>
      {children}
    </div>
  );
}

/* ---------------- página ---------------- */

export default function CoachPage() {
  return (
    <div className="flex h-screen flex-col bg-card">
      {/* top utility bar */}
      <header className="flex h-12 items-center justify-between border-b border-line px-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-[12px] font-extrabold text-white">E</span>
          <span className="text-[13px] font-bold text-ink">Edusync Coach</span>
          <span className="rounded-full bg-primary-tint px-2 py-0.5 text-[10px] font-bold text-primary">IA familiar</span>
        </div>
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-subtle hover:bg-surface"><X className="h-4 w-4" /></button>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* ===== left rail ===== */}
        <aside className="hidden w-72 shrink-0 flex-col border-r border-line bg-card lg:flex">
          <div className="flex flex-col gap-3 border-b border-line p-4">
            <button className="flex items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2.5">
              <span className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-700 text-[11px] font-bold text-white">CR</span>
                <span className="flex flex-col items-start">
                  <span className="text-[13px] font-semibold text-ink">Camila Restrepo</span>
                  <span className="text-[11px] text-subtle">8°B · Acudida</span>
                </span>
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted" />
            </button>
            <button className="flex items-center justify-center gap-2 rounded-[10px] bg-primary py-2.5 text-xs font-bold text-white">
              <Plus className="h-3.5 w-3.5" /> Nueva conversación
            </button>
            <div className="flex h-9 items-center gap-2 rounded-[10px] bg-surface px-3">
              <Search className="h-3.5 w-3.5 text-muted" />
              <span className="text-xs text-muted">Buscar en mis conversaciones</span>
            </div>
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto py-3">
            {CONVOS.map((g) => (
              <div key={g.group} className="flex flex-col">
                <span className="px-5 py-1 text-[10px] font-bold tracking-[0.18em] text-muted">{g.group}</span>
                {g.items.map((it) => (
                  <button key={it.title} className={`flex flex-col gap-0.5 px-5 py-2.5 text-left ${it.active ? "border-l-[3px] border-primary bg-surface" : "hover:bg-surface/60"}`}>
                    <span className="text-[13px] font-semibold text-ink">{it.title}</span>
                    <span className="text-[11px] text-subtle">{it.sub}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2 border-t border-line px-5 py-3">
            <span className="flex items-center gap-2 text-xs font-semibold text-subtle"><Users className="h-3.5 w-3.5" /> Mis 2 acudidos</span>
            <span className="flex items-center gap-2 text-xs font-medium text-subtle"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Privacidad y datos</span>
          </div>
        </aside>

        {/* ===== chat column ===== */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-col gap-3 border-b border-line px-8 py-5">
            <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.16em] text-primary"><Sparkles className="h-3 w-3" /> CONVERSACIÓN CON EL COACH</span>
            <h1 className="text-2xl font-bold -tracking-[0.01em] text-ink">Hablemos del periodo 2 de Camila</h1>
            <div className="flex flex-wrap gap-1.5">
              {["Periodo 2", "8 materias", "Asistencia", "Convivencia", "Plan de mejora"].map((c) => (
                <span key={c} className="rounded-full border border-line px-2.5 py-1 text-[11px] font-medium text-subtle">{c}</span>
              ))}
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-7 sm:px-12">
            {CHAT.map((m, i) =>
              m.from === "user" ? (
                <div key={i} className="flex justify-end">
                  <span className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-white">{m.text}</span>
                </div>
              ) : (
                <div key={i} className="flex max-w-[88%] gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">E</span>
                  <div className="flex flex-1 flex-col gap-3">
                    <p className="text-sm leading-relaxed text-ink">{m.text}</p>
                    {m.card === "stats" && (
                      <div className="flex gap-2.5">
                        {STATS.map((s) => (
                          <div key={s.label} className="flex flex-1 flex-col gap-1 rounded-xl border border-line bg-card p-3">
                            <span className="text-[10px] font-bold tracking-wide text-subtle">{s.label}</span>
                            <span className="text-xl font-bold text-ink">{s.value}</span>
                            <span className="text-[10px] text-subtle">{s.sub}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {m.card === "growth" && (
                      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4">
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-ink"><TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> Top 3 mejoras vs Periodo 1</span>
                        {GROWTH.map((g) => (
                          <div key={g.name} className="flex items-center gap-3">
                            <span className="w-36 shrink-0 text-xs text-ink">{g.name}</span>
                            <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
                              <span className="block h-full rounded-full bg-emerald-400" style={{ width: `${g.pct}%` }} />
                            </span>
                            <span className="w-10 text-right text-xs font-bold text-emerald-600">{g.delta}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {m.card === "plan" && (
                      <div className="overflow-hidden rounded-2xl border border-line bg-card">
                        <div className="flex items-center justify-between gap-2 border-b border-line bg-surface px-4 py-3">
                          <span className="text-[13px] font-bold text-ink">Plan · Tecnología e Informática</span>
                          <span className="rounded-full bg-s-error px-2 py-0.5 text-[10px] font-bold text-s-error-fg">3.0</span>
                        </div>
                        <div className="flex flex-col gap-2.5 p-4">
                          {PLAN_STEPS.map((s, si) => (
                            <div key={si} className="flex items-start gap-2.5">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-tint text-[10px] font-bold text-primary">{si + 1}</span>
                              <span className="text-[13px] text-ink">{s}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between gap-2 border-t border-line bg-surface px-4 py-2.5">
                          <span className="text-[11px] text-subtle">Acordado con el director de grupo</span>
                          <button className="flex items-center gap-1 text-[11px] font-semibold text-primary">Ver plan completo <ArrowUpRight className="h-3 w-3" /></button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
            {/* typing */}
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">E</span>
              <span className="flex items-center gap-2 rounded-2xl bg-surface px-4 py-3">
                <span className="flex gap-1">
                  {[0, 1, 2].map((d) => <span key={d} className="h-1.5 w-1.5 rounded-full bg-muted" />)}
                </span>
                <span className="text-xs font-medium text-subtle">Edusync Coach está pensando…</span>
              </span>
            </div>
          </div>

          {/* composer */}
          <div className="flex flex-col gap-3 border-t border-line px-4 py-4 sm:px-12">
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="rounded-full border border-line bg-card px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-surface">{s}</button>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-2xl border-[1.5px] border-line bg-card px-4 py-2.5">
              <button className="text-subtle hover:text-ink"><Paperclip className="h-4 w-4" /></button>
              <input placeholder="Escribe tu pregunta sobre Camila…" className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted" />
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white"><ArrowUp className="h-4 w-4" /></button>
            </div>
            <p className="flex items-center justify-center gap-1.5 text-center text-[11px] leading-relaxed text-subtle">
              <ShieldCheck className="h-3 w-3 shrink-0 text-emerald-600" />
              Las respuestas se generan con datos verificados por el colegio. Edusync Coach puede equivocarse; consulta siempre al docente para decisiones importantes.
            </p>
          </div>
        </main>

        {/* ===== right rail ===== */}
        <aside className="hidden w-[340px] shrink-0 flex-col overflow-y-auto border-l border-line bg-card xl:flex">
          <div className="flex flex-col gap-2 border-b border-line px-5 py-4">
            <span className="text-xs font-bold text-ink">Contexto en vivo</span>
            <p className="text-[11px] leading-relaxed text-subtle">Esto es lo que el coach está consultando para responderte. Toca cualquier fuente para inspeccionarla.</p>
          </div>
          <Side icon={Activity} title="Estudiante">
            <div className="flex items-center gap-3 rounded-xl bg-surface p-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-700 text-sm font-bold text-white">CR</span>
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold text-ink">Camila Restrepo Henao</span>
                <span className="text-[11px] text-subtle">8°B · Promedio 4.3 · Puesto 6/32</span>
              </div>
            </div>
          </Side>
          <Side icon={Check} title="Fuentes consultadas">
            <div className="flex flex-col gap-2">
              {SOURCES.map((s) => (
                <div key={s.title} className="flex items-center gap-2.5 rounded-[10px] bg-surface p-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-card text-emerald-600"><Check className="h-3.5 w-3.5" /></span>
                  <div className="flex flex-1 flex-col">
                    <span className="text-[12px] font-semibold text-ink">{s.title}</span>
                    <span className="text-[10px] text-subtle">{s.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </Side>
          <Side icon={BookOpen} title="Lecturas recomendadas">
            <div className="flex flex-col">
              {["Cómo acompañar en casa sin presionar", "Hábitos de estudio que funcionan", "Hablar de notas con tu hijo"].map((t) => (
                <button key={t} className="flex items-center gap-2.5 py-2 text-left">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface text-subtle"><BookOpen className="h-3.5 w-3.5" /></span>
                  <span className="flex-1 text-[12px] font-medium text-ink">{t}</span>
                  <ArrowUpRight className="h-3 w-3 text-subtle" />
                </button>
              ))}
              <span className="mt-2 flex items-center gap-1.5 text-[10px] text-subtle"><ShieldCheck className="h-3 w-3 text-emerald-600" /> Tus datos están cifrados extremo a extremo</span>
            </div>
          </Side>
        </aside>
      </div>
    </div>
  );
}
