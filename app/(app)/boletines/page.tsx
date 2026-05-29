import {
  Search,
  History,
  Download,
  Send,
  ChevronDown,
  Printer,
  Check,
  Clock,
  Smartphone,
  Mail,
  MessageCircle,
  GraduationCap,
} from "lucide-react";

/* ---------------- datos ---------------- */

type Desempeno = "Superior" | "Alto" | "Básico" | "Bajo";

const DESEMPENO: Record<Desempeno, string> = {
  Superior: "bg-s-success text-s-success-fg",
  Alto: "bg-s-info text-s-info-fg",
  Básico: "bg-s-warning text-s-warning-fg",
  Bajo: "bg-s-error text-s-error-fg",
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

const STUDENTS = [
  { name: "Camila Restrepo Henao", grupo: "8°B", prom: "4.3", estado: "Listo", selected: true },
  { name: "Sebastián Vargas", grupo: "8°B", prom: "3.9", estado: "Listo" },
  { name: "Mariana Gómez", grupo: "8°B", prom: "4.6", estado: "Listo" },
  { name: "Andrés Patiño", grupo: "8°B", prom: "2.8", estado: "Pendiente" },
  { name: "Laura Botero", grupo: "8°B", prom: "4.1", estado: "Listo" },
  { name: "Felipe Holguín", grupo: "8°B", prom: "3.3", estado: "Pendiente" },
  { name: "Diana Castaño", grupo: "8°B", prom: "4.8", estado: "Listo" },
  { name: "Tomás Cárdenas", grupo: "8°B", prom: "4.0", estado: "Listo" },
];

const MATERIAS: { area: string; p: string[]; def: string; des: Desempeno }[] = [
  { area: "Matemáticas", p: ["4.1", "4.3", "4.5"], def: "4.3", des: "Alto" },
  { area: "Lengua Castellana", p: ["4.0", "4.2", "4.4"], def: "4.2", des: "Alto" },
  { area: "Ciencias Naturales", p: ["4.6", "4.7", "4.8"], def: "4.7", des: "Superior" },
  { area: "Ciencias Sociales", p: ["3.8", "4.0", "4.1"], def: "4.0", des: "Alto" },
  { area: "Educación Física", p: ["4.8", "4.9", "5.0"], def: "4.9", des: "Superior" },
  { area: "Educación Artística", p: ["4.3", "4.4", "4.5"], def: "4.4", des: "Alto" },
  { area: "Inglés", p: ["3.9", "4.1", "4.0"], def: "4.0", des: "Alto" },
  { area: "Tecnología e Informática", p: ["4.2", "4.3", "3.7"], def: "4.1", des: "Alto" },
];

const FLOW = [
  { title: "Notas cargadas", sub: "Prof. Carlos Ríos · 8 áreas", time: "28 may · 10:12", state: "done" as const },
  { title: "Revisión de coordinación", sub: "Coord. Mejía · sin objeciones", time: "29 may · 09:40", state: "done" as const },
  { title: "Firma de Rectoría", sub: "María Rojas · esperando firma", time: "En curso", state: "current" as const },
  { title: "Publicación a acudientes", sub: "Envío automático programado", time: "Pendiente", state: "pending" as const },
];

const CHANNELS = [
  { label: "App acudientes", icon: Smartphone, on: true },
  { label: "Correo electrónico PDF", icon: Mail, on: true },
  { label: "WhatsApp", icon: MessageCircle, on: false },
];

const COMMENTS = [
  { initials: "CM", avatar: AVATARS[5], name: "Coord. Mejía", text: "Boletín revisado, todo en orden para firma.", time: "hace 1 d" },
  { initials: "CR", avatar: AVATARS[0], name: "Prof. Carlos Ríos", text: "Excelente progreso de Camila en ciencias.", time: "hace 2 d" },
];

function Toggle({ on }: { on: boolean }) {
  return (
    <span className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${on ? "bg-primary" : "bg-line-soft"}`}>
      <span className={`h-4 w-4 rounded-full bg-white transition-transform ${on ? "translate-x-4" : ""}`} />
    </span>
  );
}

/* ---------------- página ---------------- */

export default function BoletinesPage() {
  return (
    <div className="flex flex-col gap-5 px-7 py-6">
      {/* ====== header ====== */}
      <div className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold tracking-[0.18em] text-primary">CIERRE DE PERIODO 2 · 2025</span>
          <h1 className="text-[28px] font-bold -tracking-[0.02em] text-ink">Boletines académicos</h1>
          <p className="text-[13px] text-subtle">
            312 boletines pendientes de aprobación · publicación programada 2 de junio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-9 items-center gap-2 rounded-lg border border-line px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">
            <History className="h-3.5 w-3.5" />
            Versiones
          </button>
          <button className="flex h-9 items-center gap-2 rounded-lg border border-line px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">
            <Download className="h-3.5 w-3.5" />
            Descargar PDF
          </button>
          <button className="flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90">
            <Send className="h-3.5 w-3.5" />
            Publicar y enviar
          </button>
        </div>
      </div>

      {/* ====== tres columnas ====== */}
      <div className="flex flex-col gap-4 xl:flex-row">
        {/* --- izquierda: estudiantes --- */}
        <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-line bg-card xl:w-[300px] xl:shrink-0">
          <div className="flex flex-col gap-3 border-b border-line p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">Estudiantes</span>
              <span className="text-[11px] text-subtle">8°B · 32</span>
            </div>
            <div className="flex h-8 items-center gap-2 rounded-lg bg-surface px-2.5">
              <Search className="h-3.5 w-3.5 text-subtle" />
              <span className="text-xs text-subtle">Buscar estudiante…</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="rounded-full bg-primary-tint px-2 py-0.5 text-[11px] font-semibold text-primary">Todos</span>
              <span className="rounded-full border border-line px-2 py-0.5 text-[11px] font-medium text-subtle">Listos</span>
              <span className="rounded-full border border-line px-2 py-0.5 text-[11px] font-medium text-subtle">Pendientes</span>
            </div>
          </div>
          <div className="flex flex-col gap-1 p-2">
            {STUDENTS.map((s, i) => (
              <div
                key={s.name}
                className={`flex items-center gap-2.5 rounded-[10px] p-2.5 transition-colors ${
                  s.selected ? "bg-surface" : "hover:bg-surface/60"
                }`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${AVATARS[i % AVATARS.length]}`}>
                  {s.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                </span>
                <div className="flex flex-1 flex-col">
                  <span className="text-[13px] font-semibold text-ink">{s.name}</span>
                  <span className="text-[11px] text-subtle">{s.grupo} · Prom {s.prom}</span>
                </div>
                <span
                  className={`h-2 w-2 rounded-full ${s.estado === "Listo" ? "bg-emerald-500" : "bg-amber-500"}`}
                  title={s.estado}
                />
              </div>
            ))}
          </div>
        </div>

        {/* --- centro: boletín --- */}
        <div className="flex flex-1 flex-col gap-3 rounded-2xl bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-subtle">Vista previa del boletín</span>
            <div className="flex items-center gap-1 rounded-lg border border-line bg-card p-1">
              <button className="flex h-7 w-7 items-center justify-center rounded-md text-subtle hover:text-ink">
                <Printer className="h-3.5 w-3.5" />
              </button>
              <button className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-ink">
                100% <ChevronDown className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* papel */}
          <div className="overflow-hidden rounded-xl border border-line bg-card shadow-card">
            {/* school header */}
            <div
              className="flex items-center gap-3.5 px-6 py-5 text-white"
              style={{ background: "linear-gradient(180deg, #5749F4 0%, #3D32B0 100%)" }}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                <GraduationCap className="h-6 w-6" />
              </span>
              <div className="flex flex-1 flex-col">
                <span className="text-base font-bold tracking-wide">COLEGIO SAN MATEO</span>
                <span className="text-[11px] text-white/80">Boletín de calificaciones · Periodo 2 · 2025</span>
              </div>
              <div className="flex items-center gap-5">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-white/70">Promedio</span>
                  <span className="text-xl font-bold">4.3</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-white/70">Posición</span>
                  <span className="text-xl font-bold">6/32</span>
                </div>
              </div>
            </div>

            {/* student info */}
            <div className="flex items-center gap-3.5 border-b border-line px-6 py-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-s-info text-xs font-bold text-s-info-fg">
                CR
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-ink">Camila Restrepo Henao</span>
                <span className="text-xs text-subtle">8°B · ID-1824 · Jornada única</span>
              </div>
            </div>

            {/* tabla materias */}
            <div className="flex items-center gap-2 bg-surface px-6 py-2.5 text-[10px] font-bold tracking-[0.1em] text-subtle">
              <span className="flex-1">ÁREA / ASIGNATURA</span>
              <span className="w-10 text-center">P1</span>
              <span className="w-10 text-center">P2</span>
              <span className="w-10 text-center">P3</span>
              <span className="w-12 text-center">DEF.</span>
              <span className="w-[88px] text-right">DESEMPEÑO</span>
            </div>
            {MATERIAS.map((m) => (
              <div key={m.area} className="flex items-center gap-2 border-b border-line px-6 py-3">
                <span className="flex-1 text-[13px] font-medium text-ink">{m.area}</span>
                {m.p.map((g, gi) => (
                  <span key={gi} className="w-10 text-center text-[13px] tabular-nums text-subtle">{g}</span>
                ))}
                <span className="w-12 text-center text-[13px] font-bold tabular-nums text-ink">{m.def}</span>
                <span className="flex w-[88px] justify-end">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${DESEMPENO[m.des]}`}>{m.des}</span>
                </span>
              </div>
            ))}

            {/* observaciones */}
            <div className="flex flex-col gap-1.5 border-t border-line px-6 py-4">
              <span className="text-[11px] font-bold tracking-wide text-subtle">OBSERVACIONES DEL DIRECTOR DE GRUPO</span>
              <p className="text-xs leading-relaxed text-ink">
                Camila mantiene un desempeño sobresaliente y constante. Se destaca su liderazgo en
                trabajos de ciencias. Recomendación: reforzar puntualidad en la entrega de talleres
                de tecnología.
              </p>
            </div>

            {/* firmas */}
            <div className="flex items-center justify-between gap-5 bg-surface px-6 py-4">
              {["Director de grupo", "Coordinación", "Rectoría"].map((rol) => (
                <div key={rol} className="flex flex-1 flex-col items-center gap-1">
                  <span className="h-px w-full bg-line" />
                  <span className="text-[10px] text-subtle">{rol}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* --- derecha: acciones --- */}
        <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-line bg-card xl:w-[320px] xl:shrink-0">
          {/* head flujo */}
          <div className="flex flex-col gap-3 border-b border-line px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">Flujo de aprobación</span>
              <span className="rounded-full bg-primary-tint px-2 py-0.5 text-[11px] font-bold text-primary">Paso 3/4</span>
            </div>
            <div className="flex gap-1">
              {[true, true, true, false].map((f, i) => (
                <span key={i} className={`h-1.5 flex-1 rounded-full ${f ? "bg-primary" : "bg-line-soft"}`} />
              ))}
            </div>
            <span className="text-[11px] text-subtle">Paso 3 de 4 · esperando firma de Rectoría</span>
          </div>

          {/* flow steps */}
          <div className="flex flex-col gap-3.5 border-b border-line px-5 py-4">
            {FLOW.map((step, i) => (
              <div key={step.title} className={`flex gap-3 ${step.state === "pending" ? "opacity-55" : ""}`}>
                <div className="flex flex-col items-center">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full ${
                      step.state === "done"
                        ? "bg-primary text-white"
                        : step.state === "current"
                        ? "border-2 border-primary text-primary"
                        : "border border-line text-subtle"
                    }`}
                  >
                    {step.state === "done" ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  </span>
                  {i < FLOW.length - 1 && <span className="my-1 w-px flex-1 bg-line" />}
                </div>
                <div className="flex flex-1 flex-col pb-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-ink">{step.title}</span>
                    <span className="text-[10px] text-subtle">{step.time}</span>
                  </div>
                  <span className="text-[11px] text-subtle">{step.sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* comentarios */}
          <div className="flex flex-col gap-3 border-b border-line px-5 py-4">
            <span className="text-sm font-semibold text-ink">Comentarios</span>
            {COMMENTS.map((c) => (
              <div key={c.name} className="flex gap-2.5">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${c.avatar}`}>
                  {c.initials}
                </span>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-ink">{c.name}</span>
                    <span className="text-[10px] text-subtle">{c.time}</span>
                  </div>
                  <span className="text-[12px] text-subtle">{c.text}</span>
                </div>
              </div>
            ))}
            <div className="flex h-9 items-center rounded-[10px] bg-surface px-3 text-xs text-subtle">
              Agregar comentario…
            </div>
          </div>

          {/* canales */}
          <div className="flex flex-col gap-2.5 border-b border-line px-5 py-4">
            <span className="text-[9px] font-bold tracking-[0.12em] text-subtle">CANALES DE ENVÍO</span>
            {CHANNELS.map((ch) => {
              const Icon = ch.icon;
              return (
                <div key={ch.label} className="flex items-center justify-between rounded-[10px] bg-surface px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 text-subtle" />
                    <span className="text-[13px] font-medium text-ink">{ch.label}</span>
                  </div>
                  <Toggle on={ch.on} />
                </div>
              );
            })}
          </div>

          {/* acciones finales */}
          <div className="flex flex-col gap-2 px-5 py-4">
            <button className="flex h-11 items-center justify-center gap-2 rounded-[10px] bg-primary text-sm font-semibold text-white transition-opacity hover:opacity-90">
              <Check className="h-4 w-4" />
              Aprobar y publicar
            </button>
            <button className="flex h-11 items-center justify-center rounded-[10px] border border-line text-sm font-semibold text-ink transition-colors hover:bg-surface">
              Solicitar cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
