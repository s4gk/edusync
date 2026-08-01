"use client";

import { useEffect, useState } from "react";
import { Download, Share2, Loader2, GraduationCap } from "lucide-react";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/components/auth-context";

/* ---------------- datos del backend ---------------- */

type Grade = { id: string; score: number | string; scale?: string; period?: string; subject?: { name: string } };
type StudentPayload = {
  type?: string;
  student?: { id: string; gradeGroup?: { name?: string; gradeLevel?: number } };
  currentPeriod?: string | null;
  grades?: Grade[];
};

/** Banda de desempeño según la escala nacional (0–5). */
function band(score: number) {
  if (score >= 4.6) return { label: "SUPERIOR", color: "bg-emerald-400", text: "text-emerald-600" };
  if (score >= 4.0) return { label: "ALTO", color: "bg-sky-400", text: "text-sky-600" };
  if (score >= 3.0) return { label: "BÁSICO", color: "bg-amber-300", text: "text-amber-600" };
  return { label: "BAJO", color: "bg-rose-400", text: "text-rose-600" };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const initialsOf = (name: string) => name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

/* ---------------- radar ---------------- */

const SIZE = 300;
const CX = SIZE / 2;
const CY = SIZE / 2;
const MAXR = 118;

function point(i: number, value: number, count: number) {
  const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
  const r = (value / 100) * MAXR;
  return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)];
}
function gridPolygon(scale: number, count: number) {
  return Array.from({ length: count }).map((_, i) => point(i, scale * 100, count).join(",")).join(" ");
}

/* ---------------- página ---------------- */

type Area = { name: string; score: number; value: number };

export default function TarjetaPage() {
  const { user } = useAuth();
  const [data, setData] = useState<StudentPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    apiGet<StudentPayload>("/dashboard")
      .then((d) => alive && setData(d))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  // Agrega las notas por materia (promedio de los registros de cada una).
  const bySubject = new Map<string, { sum: number; n: number }>();
  for (const g of data?.grades ?? []) {
    const name = g.subject?.name ?? "—";
    const s = Number(g.score);
    if (!Number.isFinite(s)) continue;
    const e = bySubject.get(name) ?? { sum: 0, n: 0 };
    e.sum += s;
    e.n += 1;
    bySubject.set(name, e);
  }
  const areas: Area[] = [...bySubject.entries()]
    .map(([name, { sum, n }]) => ({ name, score: sum / n, value: Math.round((sum / n / 5) * 100) }))
    .sort((a, b) => b.score - a.score);

  const promedio = areas.length ? areas.reduce((s, a) => s + a.score, 0) / areas.length : null;
  const enAlto = areas.filter((a) => a.score >= 4.0).length;
  const enBasico = areas.filter((a) => a.score >= 3.0 && a.score < 4.0).length;
  const enBajo = areas.filter((a) => a.score < 3.0).length;

  const nombre = user ? `${user.firstName} ${user.lastName}`.trim() : "";
  const grupo = data?.student?.gradeGroup?.name ?? "";
  const periodo = data?.currentPeriod ?? "";
  const idCorto = data?.student?.id ? data.student.id.slice(0, 8).toUpperCase() : "";
  const b = promedio != null ? band(promedio) : null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-bg text-sm text-subtle">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando tu tarjeta…
      </div>
    );
  }

  if (data?.type !== "student" || !areas.length) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-bg px-6 text-center">
        <GraduationCap className="h-7 w-7 text-subtle" />
        <p className="text-sm font-medium text-ink">
          {data?.type !== "student" ? "Esta vista es para estudiantes." : "Aún no tienes notas registradas."}
        </p>
        <p className="text-xs text-subtle">Cuando se registren tus calificaciones del periodo aparecerán aquí.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* top bar */}
      <header className="flex h-14 items-center justify-between border-b border-line bg-card px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-sm font-extrabold text-white">E</span>
          <span className="text-sm font-bold tracking-wide text-ink">EDUSYNC</span>
          <span className="hidden rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-subtle sm:block">Vista estudiante</span>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">{initialsOf(nombre || "??")}</span>
      </header>

      <div className="flex flex-col gap-6 px-6 py-7 sm:px-8">
        {/* header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold tracking-[0.18em] text-primary">
              MI TARJETA{periodo ? ` · ${periodo.toUpperCase()}` : ""}
            </span>
            <h1 className="text-[28px] font-extrabold -tracking-[0.02em] text-ink">
              {nombre ? `Hola, ${nombre.split(" ")[0]}` : "Tu tarjeta del periodo"}
            </h1>
            <p className="text-sm text-subtle">
              Promedio {promedio!.toFixed(1)} en {areas.length} {areas.length === 1 ? "materia" : "materias"}
              {grupo ? ` · ${grupo}` : ""}.
            </p>
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
                <span className="text-7xl font-black leading-none -tracking-[0.04em]">{promedio!.toFixed(1)}</span>
                <span className="text-xs font-bold tracking-[0.16em] text-white/70">PROMEDIO DEL PERIODO</span>
              </div>
              {b && (
                <span className="flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-[10px] font-bold tracking-[0.14em]">
                  {b.label}
                </span>
              )}
            </div>
            <div className="flex flex-col items-center gap-3.5">
              <span className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white/40 bg-white">
                <span className="flex h-[110px] w-[110px] items-center justify-center rounded-full bg-primary text-4xl font-black text-white">{initialsOf(nombre || "??")}</span>
              </span>
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold">{nombre || "Estudiante"}</span>
                <span className="text-[11px] text-white/70">{[grupo, idCorto && `ID-${idCorto}`].filter(Boolean).join(" · ")}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              {([
                [promedio!.toFixed(1), "Promedio"],
                [String(areas.length), "Materias"],
                [String(enAlto), "En alto"],
                [String(enBajo), "En bajo"],
              ] as const).map(([v, l], i) => (
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
                <span className="text-xs text-subtle">Tus {areas.length} {areas.length === 1 ? "área" : "áreas"} este periodo</span>
              </div>
              {periodo && <span className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-subtle">{periodo}</span>}
            </div>
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
              <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0">
                {[0.25, 0.5, 0.75, 1].map((s) => (
                  <polygon key={s} points={gridPolygon(s, areas.length)} fill="none" stroke="var(--line)" strokeWidth={1} opacity={0.6} />
                ))}
                {areas.map((_, i) => {
                  const [x, y] = point(i, 100, areas.length);
                  return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="var(--line)" strokeWidth={1} opacity={0.5} />;
                })}
                <polygon points={areas.map((a, i) => point(i, a.value, areas.length).join(",")).join(" ")} fill="#5749F4" fillOpacity={0.25} stroke="#5749F4" strokeWidth={2} />
                {areas.map((a, i) => {
                  const [x, y] = point(i, a.value, areas.length);
                  return <circle key={i} cx={x} cy={y} r={3} fill="#5749F4" />;
                })}
              </svg>
              <div className="flex flex-1 flex-col gap-1.5 self-stretch">
                {areas.map((a) => (
                  <div key={a.name} className="flex items-center gap-2.5">
                    <span className="w-24 shrink-0 text-[11px] text-subtle">{cap(a.name)}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
                      <span className={`block h-full rounded-full ${band(a.score).color}`} style={{ width: `${a.value}%` }} />
                    </span>
                    <span className={`w-7 text-right text-[11px] font-bold ${band(a.score).text}`}>{a.score.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* desglose por desempeño */}
        <div className="grid grid-cols-3 gap-3.5">
          {[
            { label: "En alto o superior", value: enAlto, color: "text-emerald-600" },
            { label: "En básico", value: enBasico, color: "text-amber-600" },
            { label: "En bajo", value: enBajo, color: "text-rose-600" },
          ].map((c) => (
            <div key={c.label} className="flex flex-col gap-1 rounded-2xl border border-line bg-card p-4">
              <span className={`text-2xl font-extrabold ${c.color}`}>{c.value}</span>
              <span className="text-[11px] font-medium text-subtle">{c.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
