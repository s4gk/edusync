import {
  Calendar,
  Plus,
  MapPin,
  Users,
  Clock,
  CalendarCheck,
  BookOpen,
  ListChecks,
  AlertTriangle,
  CalendarX,
  FileCheck,
  MessageCircle,
} from "lucide-react";

/* ---------------- datos ---------------- */

type Tone = "error" | "warning" | "info" | "success" | "muted";

const BOX: Record<Tone, string> = {
  error: "bg-s-error text-s-error-fg",
  warning: "bg-s-warning text-s-warning-fg",
  info: "bg-s-info text-s-info-fg",
  success: "bg-s-success text-s-success-fg",
  muted: "border border-line text-subtle",
};

const TAREAS: { icon: typeof FileCheck; tone: Tone; title: string; sub: string; tag?: string }[] = [
  { icon: AlertTriangle, tone: "error", title: "Cerrar notas · Periodo 2", sub: "8°B Matemáticas · vence hoy", tag: "Urgente" },
  { icon: CalendarX, tone: "warning", title: "Subir 12 inasistencias", sub: "7°A · semana 21" },
  { icon: BookOpen, tone: "info", title: "Revisar plan de lectura", sub: "Tecnología · 9°C" },
  { icon: FileCheck, tone: "success", title: "Calificar quiz de álgebra", sub: "8°B · 30 entregas" },
  { icon: MessageCircle, tone: "muted", title: "Responder 3 acudientes", sub: "Bandeja de mensajes" },
];

const CLASES = [
  { time: "10:00", grupo: "8°B", tema: "Álgebra II · Aula 204", now: true },
  { time: "11:00", grupo: "9°C", tema: "Geometría · Aula 204" },
  { time: "12:00", grupo: "7°A", tema: "Fracciones · Aula 110" },
  { time: "14:00", grupo: "10°B", tema: "Estadística · Aula 204", dim: true },
];

const MENSAJES = [
  { color: "#9A6A1F", initials: "CR", name: "Carolina Rivera", sub: "7°B · Acudiente", text: "¿Cuándo entregan el boletín de Mateo?", time: "10:24" },
  { color: "#1B3B8A", initials: "DA", name: "Daniel Ariza", sub: "Coordinación", text: "Recordatorio: reunión de área el viernes.", time: "09:10" },
  { color: "#5749F4", initials: "RE", name: "Rectoría Edusync", sub: "Circular", text: "Cierre de notas programado para el 30 de mayo.", time: "Ayer" },
];

/* ---------------- página ---------------- */

export default function ProfesorPage() {
  return (
    <div className="flex flex-col gap-5 px-7 py-6">
      {/* ====== header ====== */}
      <div className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold tracking-[0.18em] text-primary">VISTA DEL DOCENTE</span>
          <h1 className="text-[26px] font-bold -tracking-[0.02em] text-ink">Mi día · jueves 23 de mayo</h1>
          <p className="text-[13px] text-subtle">
            6 clases programadas · 32 notas por subir antes del cierre del periodo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-9 items-center gap-2 rounded-lg border border-line px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">
            <Calendar className="h-3.5 w-3.5" />
            Mi horario
          </button>
          <button className="flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90">
            <Plus className="h-3.5 w-3.5" />
            Nueva evaluación
          </button>
        </div>
      </div>

      {/* ====== hero: clase actual ====== */}
      <div
        className="flex flex-col gap-5 rounded-[18px] p-6 text-white lg:flex-row lg:items-center lg:gap-6"
        style={{ background: "linear-gradient(135deg, #5749F4 0%, #7C5BFF 100%)" }}
      >
        <div className="flex w-[120px] flex-col gap-1.5">
          <span className="flex w-fit items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[9px] font-bold tracking-[0.18em]">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            EN CURSO
          </span>
          <span className="text-4xl font-extrabold -tracking-[0.04em]">24:18</span>
          <span className="text-[10px] font-medium text-white/70">Tiempo restante</span>
        </div>
        <div className="flex flex-1 flex-col gap-3">
          <span className="text-[11px] font-bold tracking-[0.14em] text-white/80">MATEMÁTICAS · ÁLGEBRA II</span>
          <span className="text-[34px] font-extrabold leading-none -tracking-[0.03em]">Grado 8°B</span>
          <div className="flex flex-wrap items-center gap-4 text-white/80">
            <span className="flex items-center gap-1.5 text-xs font-medium">
              <MapPin className="h-3 w-3" /> Aula 204
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium">
              <Users className="h-3 w-3" /> 32 estudiantes · 28 presentes
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium">
              <Clock className="h-3 w-3" /> 10:00 — 11:00 am
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button className="flex items-center justify-center gap-2 rounded-[10px] bg-white px-4 py-2.5 text-[13px] font-bold text-primary transition-opacity hover:opacity-90">
            <CalendarCheck className="h-3.5 w-3.5" />
            Tomar asistencia
          </button>
          <button className="flex items-center justify-center gap-2 rounded-[10px] border border-white/40 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10">
            <BookOpen className="h-3.5 w-3.5" />
            Plan de clase
          </button>
        </div>
      </div>

      {/* ====== 3 columnas ====== */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* tareas */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
          <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
            <span className="flex items-center gap-2 text-[13px] font-bold text-ink">
              <ListChecks className="h-3.5 w-3.5 text-primary" />
              Tareas pendientes
            </span>
            <span className="rounded-full bg-s-error px-2 py-0.5 text-[10px] font-bold text-s-error-fg">7 urgentes</span>
          </div>
          <div className="flex flex-col gap-1.5 p-2.5">
            {TAREAS.map((t) => {
              const Icon = t.icon;
              return (
                <div key={t.title} className="flex items-center gap-2.5 rounded-[10px] bg-surface p-3">
                  <span className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg ${BOX[t.tone]}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="text-[13px] font-semibold text-ink">{t.title}</span>
                    <span className="text-[11px] text-subtle">{t.sub}</span>
                  </div>
                  {t.tag && (
                    <span className="rounded-full bg-s-error px-2 py-0.5 text-[10px] font-bold text-s-error-fg">{t.tag}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* próximas clases */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
          <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
            <span className="flex items-center gap-2 text-[13px] font-bold text-ink">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Mis próximas clases
            </span>
            <span className="text-[11px] font-semibold text-subtle">Hoy</span>
          </div>
          <div className="flex flex-col gap-1.5 p-2.5">
            {CLASES.map((c) => (
              <div
                key={c.time}
                className={`flex items-center gap-3 rounded-[10px] bg-surface p-3 ${
                  c.now ? "border-l-[3px] border-primary" : ""
                } ${c.dim ? "opacity-70" : ""}`}
              >
                <div className="flex w-[54px] flex-col">
                  <span className="text-[15px] font-bold text-ink">{c.time}</span>
                  <span className="text-[10px] text-subtle">am</span>
                </div>
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-[13px] font-semibold text-ink">Grado {c.grupo}</span>
                  <span className="text-[11px] text-subtle">{c.tema}</span>
                </div>
                {c.now && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">Ahora</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* mensajes */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
          <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
            <span className="flex items-center gap-2 text-[13px] font-bold text-ink">
              <MessageCircle className="h-3.5 w-3.5 text-primary" />
              Bandeja de mensajes
            </span>
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">3 nuevos</span>
          </div>
          <div className="flex flex-1 flex-col px-3 py-2">
            {MENSAJES.map((m, i) => (
              <div
                key={m.name}
                className={`flex gap-2.5 py-3 ${i < MENSAJES.length - 1 ? "border-b border-line" : ""}`}
              >
                <span
                  className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{ background: m.color }}
                >
                  {m.initials}
                </span>
                <div className="flex flex-1 flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-ink">{m.name}</span>
                    <span className="text-[10px] text-subtle">{m.time}</span>
                  </div>
                  <span className="text-[11px] font-medium text-subtle">{m.sub}</span>
                  <span className="text-[12px] text-ink">{m.text}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="border-t border-line py-3 text-center text-xs font-semibold text-primary hover:bg-surface/50">
            Abrir bandeja completa
          </button>
        </div>
      </div>
    </div>
  );
}
