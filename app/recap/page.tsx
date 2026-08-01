"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Download, Share2, Sparkles, Crown, ArrowUpRight, Loader2, GraduationCap } from "lucide-react";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/components/auth-context";

/* paleta oscura inmersiva (el diseño es dark en ambos temas) */

const RING_SIZE = 200;
const C = RING_SIZE / 2;

function Ring({ pct, track, color }: { pct: number; track: string; color: string }) {
  const r = 82;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} className="shrink-0">
      <g transform={`rotate(-90 ${C} ${C})`}>
        <circle cx={C} cy={C} r={r} fill="none" stroke={track} strokeWidth={28} />
        <circle cx={C} cy={C} r={r} fill="none" stroke={color} strokeWidth={28} strokeLinecap="round" strokeDasharray={`${(pct / 100) * circ} ${circ}`} />
      </g>
    </svg>
  );
}

/* ---------------- datos del backend ---------------- */

type Grade = { id: string; score: number | string; scale?: string; period?: string; subject?: { name: string } };
type Dash = {
  type?: string;
  student?: { id: string; gradeGroup?: { name?: string } };
  currentPeriod?: string | null;
  students?: { id: string; name: string; gradeGroup?: { name?: string }; isPrimary?: boolean }[];
};

/** Tono visual según la escala nacional (0–5). */
function tones(score: number) {
  if (score >= 4.6) return { text: "text-emerald-300", bar: "bg-emerald-400" };
  if (score >= 4.0) return { text: "text-sky-300", bar: "bg-sky-400" };
  if (score >= 3.0) return { text: "text-amber-300", bar: "bg-amber-400" };
  return { text: "text-rose-300", bar: "bg-rose-400" };
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const initialsOf = (name: string) => name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

type Area = { name: string; score: number; pct: number; count: number };

export default function RecapPage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [grupo, setGrupo] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const dash = await apiGet<Dash>("/dashboard");
        let studentId = "";
        if (dash.type === "student" && dash.student) {
          studentId = dash.student.id;
          if (alive) {
            setName(user ? `${user.firstName} ${user.lastName}`.trim() : "");
            setGrupo(dash.student.gradeGroup?.name ?? "");
            setPeriodo(dash.currentPeriod ?? "");
          }
        } else if (dash.type === "guardian" && dash.students?.length) {
          const child = dash.students.find((s) => s.isPrimary) ?? dash.students[0];
          studentId = child.id;
          if (alive) {
            setName(child.name);
            setGrupo(child.gradeGroup?.name ?? "");
          }
        } else {
          if (alive) setUnsupported(true);
          return;
        }

        const grades = await apiGet<Grade[]>(`/grades?studentId=${studentId}`);
        const bySubject = new Map<string, { sum: number; n: number }>();
        for (const g of grades) {
          const subj = g.subject?.name ?? "—";
          const s = Number(g.score);
          if (!Number.isFinite(s)) continue;
          const e = bySubject.get(subj) ?? { sum: 0, n: 0 };
          e.sum += s;
          e.n += 1;
          bySubject.set(subj, e);
        }
        const built: Area[] = [...bySubject.entries()]
          .map(([n, { sum, n: cnt }]) => ({ name: n, score: sum / cnt, pct: Math.round((sum / cnt / 5) * 100), count: cnt }))
          .sort((a, b) => b.score - a.score);
        if (alive) setAreas(built);
      } catch {
        if (alive) setUnsupported(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-[#131124] text-sm text-[#888799]">
        <Loader2 className="h-4 w-4 animate-spin" /> Preparando el boletín…
      </div>
    );
  }

  if (unsupported || !areas.length) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-[#131124] px-6 text-center text-[#E8E8EA]">
        <GraduationCap className="h-7 w-7 text-[#888799]" />
        <p className="text-sm font-medium">
          {unsupported ? "Este boletín es para estudiantes y acudientes." : "Aún no hay notas registradas para mostrar."}
        </p>
      </div>
    );
  }

  const promedio = areas.reduce((s, a) => s + a.score, 0) / areas.length;
  const best = areas[0];
  const challenge = areas[areas.length - 1];
  const firstName = name.split(" ")[0] || "Estudiante";

  return (
    <div className="min-h-screen bg-[#131124] text-[#E8E8EA]">
      {/* ====== utility bar ====== */}
      <header className="flex items-center justify-between border-b border-[#2B283D] px-6 py-3">
        <div className="flex items-center gap-3.5">
          <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2B283D] text-[#E8E8EA]">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="hidden text-xs text-[#888799] sm:block">Volver al panel</span>
          <span className="hidden h-6 w-px bg-[#2B283D] sm:block" />
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-[13px] font-extrabold text-white">E</span>
          <span className="hidden text-xs font-semibold tracking-wide text-[#888799] sm:block">EDUSYNC</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="hidden h-8 items-center gap-1.5 rounded-lg border border-[#2B283D] px-2.5 text-xs font-semibold sm:flex"><Download className="h-3.5 w-3.5" /> Descargar</button>
          <button className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-white"><Share2 className="h-3.5 w-3.5" /> Compartir con familia</button>
        </div>
      </header>

      {/* ====== hero ====== */}
      <section
        className="relative overflow-hidden px-6 py-12 sm:px-12"
        style={{ background: "linear-gradient(135deg, #1A0E5C 0%, #5749F4 45%, #FF7BD5 100%)" }}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2.5 text-[10px] font-bold tracking-[0.3em] text-white/70">
            <span className="h-2 w-2 rounded-full bg-white" /> EDUSYNC · BOLETÍN INTERACTIVO
          </span>
          {periodo && (
            <span className="flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-[10px] font-bold tracking-[0.16em] text-white">
              <Sparkles className="h-3 w-3" /> {periodo.toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex flex-col items-start justify-between gap-8 pt-10 lg:flex-row lg:items-center">
          <div className="flex flex-col gap-4">
            <span className="text-base font-bold tracking-[0.4em] text-white/70 sm:text-lg">EL PERIODO DE</span>
            <span className="text-[22vw] font-black leading-[0.9] -tracking-[0.05em] text-white lg:text-[180px]">{firstName.toUpperCase()}</span>
            <div className="flex items-center gap-4">
              <span className="h-16 w-1 rounded bg-white" />
              <p className="max-w-xl text-lg font-semibold leading-snug -tracking-[0.01em] text-white sm:text-[22px]">
                {areas.length} {areas.length === 1 ? "materia" : "materias"} · promedio {promedio.toFixed(1)} · una historia.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-center gap-5">
            <span className="flex h-44 w-44 items-center justify-center rounded-full border-[6px] border-white/40 bg-white sm:h-48 sm:w-48">
              <span className="flex h-36 w-36 items-center justify-center rounded-full bg-primary text-6xl font-black text-white sm:h-40 sm:w-40">{initialsOf(name || "??")}</span>
            </span>
            <span className="text-lg font-bold text-white">{name || "Estudiante"}</span>
            {grupo && (
              <span className="rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-[11px] font-semibold text-white">
                {grupo}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ====== capítulo 1: cómo te fue ====== */}
      <section className="flex flex-col gap-6 px-6 py-12 sm:px-12">
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-primary">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[12px] font-extrabold text-white">01</span>
            CAPÍTULO 1 · CÓMO TE FUE
          </span>
          <h2 className="max-w-3xl text-4xl font-extrabold leading-[1.05] -tracking-[0.03em] sm:text-5xl">Tu promedio del periodo.</h2>
        </div>
        <div className="flex items-center gap-6 rounded-3xl border border-[#2B283D] bg-[#1A182E] p-7 lg:w-[460px]">
          <div className="relative shrink-0">
            <Ring pct={Math.round((promedio / 5) * 100)} track="#3B4748" color="#A1E5A1" />
            <span className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-extrabold -tracking-[0.03em] text-[#E8E8EA]">{promedio.toFixed(1)}</span>
              <span className="text-xs text-[#888799]">/ 5.0</span>
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold tracking-[0.18em] text-[#888799]">PROMEDIO GENERAL</span>
            <span className="text-2xl font-bold -tracking-[0.01em]">
              {areas.filter((a) => a.score >= 4.0).length} de {areas.length} en alto o superior
            </span>
            <span className="text-[13px] leading-relaxed text-[#888799]">Promedio de tus {areas.length} {areas.length === 1 ? "materia" : "materias"} registradas este periodo.</span>
          </div>
        </div>
      </section>

      {/* ====== capítulo 2: tu mejor materia ====== */}
      <section className="flex flex-col gap-6 px-6 py-8 sm:px-12">
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-2.5 text-xs font-bold tracking-[0.16em] text-[#FFD9B2]">
            <span className="flex items-center justify-center rounded-md bg-[#FFD9B2] px-2 py-1 text-[11px] font-extrabold text-[#4D2700]">02</span>
            CAPÍTULO 2 · TU MEJOR MATERIA
          </span>
          <h2 className="max-w-3xl text-4xl font-extrabold leading-[1.05] -tracking-[0.03em] sm:text-5xl">Brillaste en {cap(best.name)}.</h2>
        </div>
        <div className="flex flex-col overflow-hidden rounded-[28px] border border-[#2B283D] lg:flex-row">
          <div
            className="flex flex-1 flex-col justify-between gap-8 p-9 text-white"
            style={{ background: "linear-gradient(200deg, #FF7BD5 0%, #FF8400 50%, #FFC85C 100%)" }}
          >
            <div className="flex items-start justify-between">
              <span className="flex items-center gap-1.5 rounded-full border border-white/30 bg-white/20 px-3 py-1.5 text-[10px] font-bold tracking-[0.16em]">
                <Crown className="h-3 w-3" /> MEJOR MATERIA DEL PERIODO
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[12vw] font-black leading-[0.95] -tracking-[0.04em] lg:text-[72px]">{best.name.toUpperCase()}</span>
            </div>
            <div className="flex items-end justify-end">
              <span className="text-7xl font-black leading-none -tracking-[0.03em]">{best.score.toFixed(1)}</span>
              <span className="pb-2 text-sm font-bold text-white/80">/ 5.0</span>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-5 bg-[#1A182E] p-9 lg:w-[520px]">
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold tracking-[0.18em] text-[#888799]">TU MATERIA MÁS FUERTE</span>
              <p className="text-[22px] font-semibold leading-snug -tracking-[0.01em]">
                Cerraste {cap(best.name)} en {best.score.toFixed(1)}, tu nota más alta del periodo.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { l: "NOTAS REGISTRADAS", v: String(best.count), d: "en esta materia", dc: "text-[#888799]" },
                { l: "PROMEDIO EN LA MATERIA", v: best.score.toFixed(1), d: tones(best.score).text === "text-emerald-300" ? "Superior" : "Alto", dc: "text-emerald-300" },
              ].map((s) => (
                <div key={s.l} className="flex flex-col gap-1 rounded-xl bg-[#131124] p-3.5">
                  <span className="text-[10px] font-bold tracking-wide text-[#888799]">{s.l}</span>
                  <span className="text-[22px] font-extrabold text-[#E8E8EA]">{s.v}</span>
                  <span className={`text-[10px] font-medium ${s.dc}`}>{s.d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ====== capítulo 3: tus materias ====== */}
      <section className="flex flex-col gap-6 px-6 py-12 sm:px-12">
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-2.5 text-xs font-bold tracking-[0.16em] text-sky-300">
            <span className="flex items-center justify-center rounded-md bg-sky-300 px-2 py-1 text-[11px] font-extrabold text-[#001133]">03</span>
            CAPÍTULO 3 · TUS {areas.length} MATERIAS
          </span>
          <h2 className="max-w-3xl text-4xl font-extrabold leading-[1.05] -tracking-[0.03em] sm:text-5xl">Cómo te fue en cada una.</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {areas.map((s) => {
            const t = tones(s.score);
            return (
              <div key={s.name} className="flex flex-col gap-3 rounded-2xl border border-[#2B283D] bg-[#1A182E] p-5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold leading-tight">{cap(s.name)}</span>
                  <span className={`text-2xl font-extrabold ${t.text}`}>{s.score.toFixed(1)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#131124]">
                  <span className={`block h-full rounded-full ${t.bar}`} style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ====== capítulo 4: a mejorar ====== */}
      {challenge.score < 4.0 && challenge.name !== best.name && (
        <section className="flex flex-col gap-6 px-6 py-8 sm:px-12">
          <div className="flex flex-col gap-2">
            <span className="flex items-center gap-2.5 text-xs font-bold tracking-[0.16em] text-emerald-300">
              <span className="flex items-center justify-center rounded-md bg-emerald-300 px-2 py-1 text-[11px] font-extrabold text-[#003300]">04</span>
              CAPÍTULO 4 · TU RETO
            </span>
            <h2 className="max-w-3xl text-4xl font-extrabold leading-[1.05] -tracking-[0.03em] sm:text-5xl">Donde hay margen para crecer.</h2>
          </div>
          <div
            className="flex flex-col justify-between gap-6 overflow-hidden rounded-[28px] p-9 text-white lg:flex-row lg:items-end"
            style={{ background: "linear-gradient(135deg, #5749F4 0%, #2D2380 100%)" }}
          >
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold tracking-[0.18em] text-white/70">UN RETO PARA EL PRÓXIMO PERIODO</span>
              <span className="text-[10vw] font-black leading-[0.95] -tracking-[0.04em] lg:text-[72px]">{challenge.name.toUpperCase()}</span>
              <p className="max-w-xl text-sm leading-relaxed text-white/80">
                Cerraste en {challenge.score.toFixed(1)} — tu materia más retadora este periodo. Un buen punto de partida para el próximo.
              </p>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-7xl font-black leading-none">{challenge.score.toFixed(1)}</span>
              <button className="mb-2 flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[13px] font-semibold text-primary">
                Ver detalle <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ====== cierre + footer ====== */}
      <section className="flex flex-col items-center gap-6 px-6 py-16 text-center sm:px-12">
        <span className="text-xs font-bold tracking-[0.16em] text-[#888799]">CIERRE</span>
        <h2 className="max-w-4xl text-5xl font-black leading-[1.05] -tracking-[0.03em] sm:text-7xl">Y eso fue tu periodo{periodo ? ` — ${firstName}` : ""}.</h2>
        <p className="max-w-2xl text-lg text-[#888799]">
          Gracias por el esfuerzo, {firstName} — y gracias a la familia por acompañar el camino.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white"><Share2 className="h-4 w-4" /> Compartir con la familia</button>
          <button className="flex items-center gap-2 rounded-full border border-[#2B283D] px-6 py-3 text-sm font-semibold"><Download className="h-4 w-4" /> Descargar PDF</button>
        </div>
        <div className="mt-8 flex items-center gap-2 border-t border-[#2B283D] pt-8 text-xs text-[#888799]">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-primary text-[10px] font-extrabold text-white">E</span>
          EDUSYNC · Boletín interactivo
        </div>
      </section>
    </div>
  );
}
