"use client";

import { useEffect, useState } from "react";
import { FileText, CalendarPlus, TrendingUp, Activity, Award, TriangleAlert, Loader2, GraduationCap, type LucideIcon } from "lucide-react";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/components/auth-context";

/* ---------------- datos del backend ---------------- */

type Grade = { id: string; score: number | string; period?: string; subject?: { name: string } };
type Dash = {
  type?: string;
  student?: { id: string };
  students?: { id: string; name: string; isPrimary?: boolean }[];
};

const PERIOD_ORDER = ["P1", "P2", "P3", "P4"];
const GRID = [30, 85, 140, 195, 250];
const YLABS = ["5.0", "4.5", "4.0", "3.5", "3.0"];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const initialsOf = (name: string) => name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

/** Mapea una nota (0–5) a la coordenada Y del chart (escala visible 3.0–5.0). */
function yFor(score: number) {
  const y = 30 + ((5 - score) / 2) * 220;
  return Math.max(20, Math.min(272, y));
}

export default function TrayectoriaPage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [grades, setGrades] = useState<Grade[] | null>(null);
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
          if (alive) setName(user ? `${user.firstName} ${user.lastName}`.trim() : "");
        } else if (dash.type === "guardian" && dash.students?.length) {
          const child = dash.students.find((s) => s.isPrimary) ?? dash.students[0];
          studentId = child.id;
          if (alive) setName(child.name);
        } else {
          if (alive) setUnsupported(true);
          return;
        }
        const g = await apiGet<Grade[]>(`/grades?studentId=${studentId}`);
        if (alive) setGrades(g);
      } catch {
        if (alive) setUnsupported(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-bg text-sm text-subtle">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando la trayectoria…
      </div>
    );
  }

  if (unsupported || !grades?.length) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-bg px-6 text-center">
        <GraduationCap className="h-7 w-7 text-subtle" />
        <p className="text-sm font-medium text-ink">
          {unsupported ? "Este seguimiento es para estudiantes y acudientes." : "Aún no hay historial de notas para mostrar."}
        </p>
      </div>
    );
  }

  // Promedio por periodo (para la línea).
  const byPeriod = new Map<string, { sum: number; n: number }>();
  // Notas por materia y periodo (para la evolución).
  const bySubject = new Map<string, Map<string, number[]>>();
  for (const g of grades) {
    const p = g.period ?? "";
    const s = Number(g.score);
    if (!PERIOD_ORDER.includes(p) || !Number.isFinite(s)) continue;
    const bp = byPeriod.get(p) ?? { sum: 0, n: 0 };
    bp.sum += s;
    bp.n += 1;
    byPeriod.set(p, bp);

    const subj = g.subject?.name ?? "—";
    if (!bySubject.has(subj)) bySubject.set(subj, new Map());
    const pm = bySubject.get(subj)!;
    pm.set(p, [...(pm.get(p) ?? []), s]);
  }

  const points = PERIOD_ORDER.filter((p) => byPeriod.has(p)).map((p) => {
    const { sum, n } = byPeriod.get(p)!;
    return { period: p, avg: sum / n };
  });

  // Coordenadas X repartidas entre los márgenes (44 … 842).
  const X0 = 44, X1 = 842;
  const coords = points.map((pt, i) => ({
    ...pt,
    x: points.length === 1 ? (X0 + X1) / 2 : X0 + ((X1 - X0) * i) / (points.length - 1),
    y: yFor(pt.avg),
  }));
  const linePath = coords.length ? "M" + coords.map((c) => `${c.x},${c.y}`).join(" L") : "";
  const areaPath = coords.length ? `${linePath} L${coords[coords.length - 1].x},280 L${coords[0].x},280 Z` : "";

  // Evolución por materia: primer → último periodo con dato.
  const subjects = [...bySubject.entries()].map(([subj, pm]) => {
    const ordered = PERIOD_ORDER.filter((p) => pm.has(p));
    const first = ordered.length ? avg(pm.get(ordered[0])!) : 0;
    const last = ordered.length ? avg(pm.get(ordered[ordered.length - 1])!) : 0;
    const all = ordered.flatMap((p) => pm.get(p)!);
    return { name: subj, from: first, to: last, mean: avg(all), up: last >= first };
  });

  const firstAvg = points[0]?.avg ?? 0;
  const lastAvg = points[points.length - 1]?.avg ?? 0;
  const tendencia = lastAvg - firstAvg;
  const subidas = coords.reduce((acc, c, i) => (i > 0 && c.avg >= coords[i - 1].avg ? acc + 1 : acc), 0);
  const fortaleza = [...subjects].sort((a, b) => b.mean - a.mean)[0];
  const reforzar = [...subjects].sort((a, b) => a.mean - b.mean)[0];

  const SUMMARY: { icon: LucideIcon; label: string; value: string; sub: string; tone: string }[] = [
    { icon: TrendingUp, label: "TENDENCIA GENERAL", value: `${tendencia >= 0 ? "+" : ""}${tendencia.toFixed(1)}`, sub: "primer vs. último periodo", tone: tendencia >= 0 ? "bg-s-success text-s-success-fg" : "bg-s-error text-s-error-fg" },
    { icon: Activity, label: "CONSTANCIA", value: `${subidas} de ${Math.max(0, coords.length - 1)}`, sub: "periodos al alza", tone: "bg-s-info text-s-info-fg" },
    ...(fortaleza ? [{ icon: Award, label: "FORTALEZA", value: fortaleza.mean.toFixed(1), sub: cap(fortaleza.name), tone: "bg-primary-tint text-primary" }] : []),
    ...(reforzar && reforzar.name !== fortaleza?.name ? [{ icon: TriangleAlert, label: "A REFORZAR", value: reforzar.mean.toFixed(1), sub: cap(reforzar.name), tone: "bg-s-error text-s-error-fg" }] : []),
  ];

  const firstName = name.split(" ")[0] || "estudiante";

  return (
    <div className="min-h-screen bg-bg">
      <header className="flex h-14 items-center justify-between border-b border-line bg-card px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-sm font-extrabold text-white">E</span>
          <span className="text-sm font-bold tracking-wide text-ink">EDUSYNC</span>
          {name && <span className="hidden text-xs text-subtle sm:block">· Seguimiento · {name}</span>}
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-[11px] font-bold text-primary">{initialsOf(name || "??")}</span>
      </header>

      <div className="flex flex-col gap-6 px-6 py-7 sm:px-8">
        {/* header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold tracking-[0.18em] text-primary">SEGUIMIENTO LONGITUDINAL</span>
            <h1 className="text-[28px] font-extrabold -tracking-[0.02em] text-ink">La trayectoria de {firstName}</h1>
            <p className="text-sm text-subtle">
              {points.length} {points.length === 1 ? "periodo registrado" : "periodos registrados"} ·
              {tendencia >= 0 ? " tendencia al alza." : " atención: tendencia a la baja."}
            </p>
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
                <span className="text-xs text-subtle">Escala 3.0–5.0 · línea de tendencia</span>
              </div>
              <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${tendencia >= 0 ? "bg-s-success text-s-success-fg" : "bg-s-error text-s-error-fg"}`}>
                <TrendingUp className={`h-3 w-3 ${tendencia < 0 ? "rotate-180" : ""}`} /> {tendencia >= 0 ? "+" : ""}{tendencia.toFixed(1)} acumulado
              </span>
            </div>
            <div className="relative">
              <svg viewBox="0 0 900 280" className="w-full" preserveAspectRatio="none" style={{ height: 280 }}>
                {GRID.map((y, i) => (
                  <line key={y} x1={20} y1={y} x2={900} y2={y} stroke={i === 2 ? "#5749F4" : "var(--line)"} strokeOpacity={i === 2 ? 0.35 : 1} strokeWidth={1} />
                ))}
                {areaPath && <path d={areaPath} fill="#5749F4" fillOpacity={0.15} />}
                {linePath && <path d={linePath} fill="none" stroke="#5749F4" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />}
                {coords.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={i === coords.length - 1 ? 8 : 5.5} fill={i === coords.length - 1 ? "#5749F4" : "var(--card)"} stroke="#5749F4" strokeWidth={i === coords.length - 1 ? 4 : 2.5} />
                ))}
              </svg>
              <div className="pointer-events-none absolute inset-y-0 left-0 flex flex-col justify-between py-[24px] text-[10px] font-medium text-subtle">
                {YLABS.map((l) => <span key={l}>{l}</span>)}
              </div>
            </div>
            <div className="flex justify-between px-2">
              {coords.map((p) => (
                <div key={p.period} className="flex flex-col items-center gap-0.5">
                  <span className="text-[11px] font-bold text-ink">{p.avg.toFixed(1)}</span>
                  <span className="text-[10px] text-subtle">{p.period}</span>
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
          </div>
        </div>

        {/* evolución por materia */}
        <div className="flex flex-col gap-4 rounded-[20px] border border-line bg-card p-6">
          <h3 className="text-base font-semibold text-ink">Evolución por materia</h3>
          <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
            {subjects.map((m) => (
              <div key={m.name} className="flex items-center gap-3 border-b border-line py-2 last:border-0">
                <span className="flex-1 text-[13px] font-medium text-ink">{cap(m.name)}</span>
                <span className="text-[13px] text-subtle">{m.from.toFixed(1)}</span>
                <span className="text-subtle">→</span>
                <span className="text-[13px] font-bold text-ink">{m.to.toFixed(1)}</span>
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

function avg(xs: number[]) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}
