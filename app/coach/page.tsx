"use client";

import { useEffect, useRef, useState } from "react";
import {
  Plus, ShieldCheck, Sparkles, ArrowUp, X, Loader2, TriangleAlert, BookOpen, Activity, type LucideIcon,
} from "lucide-react";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { useAuth } from "@/components/auth-context";

/* ---------------- datos del backend ---------------- */

type Grade = { id: string; score: number | string; subject?: { name: string } };
type Dash = {
  type?: string;
  student?: { id: string; gradeGroup?: { name?: string } };
  currentPeriod?: string | null;
  students?: { id: string; name: string; gradeGroup?: { name?: string }; isPrimary?: boolean }[];
};

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Resume el desempeño del periodo",
  "¿En qué materia necesita apoyo?",
  "Dame hábitos de estudio para casa",
];

const GREETING: Msg = {
  role: "assistant",
  content:
    "¡Hola! Soy el Coach de Edusync. Puedo ayudarte a entender el desempeño del periodo y darte ideas para acompañar en casa. ¿Qué quieres saber?",
};

function Side({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 border-b border-line px-5 py-4">
      <span className="flex items-center gap-2 text-xs font-bold text-ink"><Icon className="h-3.5 w-3.5 text-primary" /> {title}</span>
      {children}
    </div>
  );
}

export default function CoachPage() {
  const { user } = useAuth();
  const [studentName, setStudentName] = useState("");
  const [studentGrade, setStudentGrade] = useState("");
  const [studentAvg, setStudentAvg] = useState<number | null>(null);
  const [context, setContext] = useState<string | undefined>(undefined);

  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [notConfigured, setNotConfigured] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Arma el contexto real del estudiante (propio o hijo del acudiente) para
  // aterrizar al coach en datos verificados. Para staff queda sin contexto.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const dash = await apiGet<Dash>("/dashboard");
        let studentId = "";
        let name = "";
        let grade = "";
        if (dash.type === "student" && dash.student) {
          studentId = dash.student.id;
          name = user ? `${user.firstName} ${user.lastName}`.trim() : "";
          grade = dash.student.gradeGroup?.name ?? "";
        } else if (dash.type === "guardian" && dash.students?.length) {
          const child = dash.students.find((s) => s.isPrimary) ?? dash.students[0];
          studentId = child.id;
          name = child.name;
          grade = child.gradeGroup?.name ?? "";
        }
        if (!studentId || !alive) return;

        const grades = await apiGet<Grade[]>(`/grades?studentId=${studentId}`);
        const bySubject = new Map<string, { sum: number; n: number }>();
        for (const g of grades) {
          const subj = g.subject?.name ?? "—";
          const s = Number(g.score);
          if (!Number.isFinite(s)) continue;
          const e = bySubject.get(subj) ?? { sum: 0, n: 0 };
          e.sum += s; e.n += 1;
          bySubject.set(subj, e);
        }
        const perSubject = [...bySubject.entries()].map(([n, { sum, n: c }]) => ({ name: n, avg: sum / c }));
        const avg = perSubject.length ? perSubject.reduce((a, b) => a + b.avg, 0) / perSubject.length : null;
        if (!alive) return;
        setStudentName(name);
        setStudentGrade(grade);
        setStudentAvg(avg);
        if (perSubject.length) {
          const lista = perSubject.map((p) => `${p.name}: ${p.avg.toFixed(1)}`).join(", ");
          setContext(
            [
              `Estudiante: ${name || "(sin nombre)"}${grade ? ` (${grade})` : ""}.`,
              dash.currentPeriod ? `Periodo actual: ${dash.currentPeriod}.` : "",
              avg != null ? `Promedio general: ${avg.toFixed(1)} sobre 5.0.` : "",
              `Notas por materia (sobre 5.0): ${lista}.`,
            ].filter(Boolean).join(" "),
          );
        }
      } catch {
        /* coach funciona igual sin contexto */
      }
    })();
    return () => { alive = false; };
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || sending) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setSending(true);
    setNotConfigured(null);
    try {
      // Solo enviamos los turnos reales (sin el saludo local) al backend.
      const payload = next.filter((m) => m !== GREETING);
      const res = await apiPost<{ reply: string }>("/coach/chat", { messages: payload, context });
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        setNotConfigured(err.message);
      } else {
        const msg = err instanceof ApiError ? err.message : "No se pudo conectar con el Coach.";
        setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${msg}` }]);
      }
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setMessages([GREETING]);
    setNotConfigured(null);
  }

  const initials = (studentName || (user ? `${user.firstName} ${user.lastName}` : "") || "??")
    .split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen flex-col bg-card">
      {/* top utility bar */}
      <header className="flex h-12 items-center justify-between border-b border-line px-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-[12px] font-extrabold text-white">E</span>
          <span className="text-[13px] font-bold text-ink">Edusync Coach</span>
          <span className="rounded-full bg-primary-tint px-2 py-0.5 text-[10px] font-bold text-primary">IA familiar</span>
        </div>
        <a href="/dashboard" className="flex h-8 w-8 items-center justify-center rounded-lg text-subtle hover:bg-surface"><X className="h-4 w-4" /></a>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* ===== left rail ===== */}
        <aside className="hidden w-72 shrink-0 flex-col border-r border-line bg-card lg:flex">
          <div className="flex flex-col gap-3 border-b border-line p-4">
            <div className="flex items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2.5">
              <span className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">{initials}</span>
                <span className="flex flex-col items-start">
                  <span className="text-[13px] font-semibold text-ink">{studentName || "Estudiante"}</span>
                  <span className="text-[11px] text-subtle">{studentGrade || "—"}</span>
                </span>
              </span>
            </div>
            <button onClick={reset} className="flex items-center justify-center gap-2 rounded-[10px] bg-primary py-2.5 text-xs font-bold text-white">
              <Plus className="h-3.5 w-3.5" /> Nueva conversación
            </button>
          </div>
          <div className="flex flex-1 flex-col gap-2 px-5 py-4 text-[11px] leading-relaxed text-subtle">
            <span className="flex items-center gap-2 font-semibold text-ink"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Privacidad</span>
            <p>El coach solo usa los datos académicos del colegio para responder. No compartas información sensible en el chat.</p>
          </div>
        </aside>

        {/* ===== chat column ===== */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-col gap-2 border-b border-line px-8 py-5">
            <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.16em] text-primary"><Sparkles className="h-3 w-3" /> CONVERSACIÓN CON EL COACH</span>
            <h1 className="text-2xl font-bold -tracking-[0.01em] text-ink">
              {studentName ? `Hablemos del desempeño de ${studentName.split(" ")[0]}` : "Tu asistente académico"}
            </h1>
          </div>

          <div ref={scrollRef} className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-7 sm:px-12">
            {notConfigured && (
              <div className="flex items-start gap-2.5 rounded-xl border border-s-warning-fg/30 bg-s-warning px-4 py-3 text-[13px] text-s-warning-fg">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{notConfigured}</span>
              </div>
            )}
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <span className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-white">{m.content}</span>
                </div>
              ) : (
                <div key={i} className="flex max-w-[88%] gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">E</span>
                  <p className="flex-1 whitespace-pre-wrap pt-1 text-sm leading-relaxed text-ink">{m.content}</p>
                </div>
              ),
            )}
            {sending && (
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">E</span>
                <span className="flex items-center gap-2 rounded-2xl bg-surface px-4 py-3">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-subtle" />
                  <span className="text-xs font-medium text-subtle">Edusync Coach está pensando…</span>
                </span>
              </div>
            )}
          </div>

          {/* composer */}
          <div className="flex flex-col gap-3 border-t border-line px-4 py-4 sm:px-12">
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={sending}
                  className="rounded-full border border-line bg-card px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-surface disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="flex items-center gap-2 rounded-2xl border-[1.5px] border-line bg-card px-4 py-2.5 focus-within:border-primary"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu pregunta…"
                className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white transition-opacity disabled:opacity-40"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </form>
            <p className="flex items-center justify-center gap-1.5 text-center text-[11px] leading-relaxed text-subtle">
              <ShieldCheck className="h-3 w-3 shrink-0 text-emerald-600" />
              El Coach puede equivocarse; consulta siempre al docente para decisiones importantes.
            </p>
          </div>
        </main>

        {/* ===== right rail ===== */}
        <aside className="hidden w-[340px] shrink-0 flex-col overflow-y-auto border-l border-line bg-card xl:flex">
          <div className="flex flex-col gap-2 border-b border-line px-5 py-4">
            <span className="text-xs font-bold text-ink">Contexto en vivo</span>
            <p className="text-[11px] leading-relaxed text-subtle">Datos del colegio que el coach usa para responderte.</p>
          </div>
          <Side icon={Activity} title="Estudiante">
            {studentName ? (
              <div className="flex items-center gap-3 rounded-xl bg-surface p-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">{initials}</span>
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-ink">{studentName}</span>
                  <span className="text-[11px] text-subtle">
                    {studentGrade || "—"}{studentAvg != null ? ` · Promedio ${studentAvg.toFixed(1)}` : ""}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-subtle">Inicia sesión como estudiante o acudiente para ver el contexto del estudiante.</p>
            )}
          </Side>
          <Side icon={BookOpen} title="Recomendaciones">
            <p className="text-[11px] leading-relaxed text-subtle">
              Pregunta por hábitos de estudio, cómo leer el boletín o cómo apoyar en una materia específica.
            </p>
          </Side>
        </aside>
      </div>
    </div>
  );
}
