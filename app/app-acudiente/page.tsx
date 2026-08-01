"use client";

import { useEffect, useState } from "react";
import {
  Signal, Wifi, BatteryFull, Bell, ChevronDown, Wallet, FileText, House,
  Sparkles, MessageCircle, BookOpen, Loader2, GraduationCap, type LucideIcon,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/components/auth-context";
import { useDismiss } from "@/components/use-dismiss";

/* ---------------- datos del backend ---------------- */

type Grade = { id: string; score: number | string; subject?: { name: string } };
type Invoice = { id: string; studentId: string; status: string };
type Child = { id: string; name: string; gradeGroup?: { name?: string }; isPrimary?: boolean };
type GuardianDash = {
  type?: string;
  students?: Child[];
  pendingInvoices?: Invoice[];
  unreadNotifications?: number;
};
type Notif = { id: string; title: string; body: string; isRead: boolean; createdAt: string };

const initialsOf = (name: string) => name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

function relativeTime(iso?: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const min = Math.round(Math.max(0, Date.now() - then) / 60000);
  if (min < 1) return "hace un momento";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "hace 1 día" : `hace ${d} días`;
}

const TABS: { icon: LucideIcon; label: string; active?: boolean }[] = [
  { icon: House, label: "Hoy", active: true },
  { icon: FileText, label: "Notas" },
  { icon: MessageCircle, label: "Mensajes" },
  { icon: Wallet, label: "Pagos" },
];

export default function AppAcudientePage() {
  const { user } = useAuth();
  const [dash, setDash] = useState<GuardianDash | null>(null);
  const [childIdx, setChildIdx] = useState(0);
  const [grades, setGrades] = useState<Grade[] | null>(null);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [unsupported, setUnsupported] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useDismiss<HTMLDivElement>(menuOpen, () => setMenuOpen(false));

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await apiGet<GuardianDash>("/dashboard");
        if (!alive) return;
        if (d.type !== "guardian" || !d.students?.length) {
          setUnsupported(true);
          return;
        }
        setDash(d);
        const initial = Math.max(0, d.students.findIndex((s) => s.isPrimary));
        setChildIdx(initial);
        apiGet<{ data: Notif[] }>("/notifications").then((r) => alive && setNotifs(r?.data ?? [])).catch(() => {});
      } catch {
        if (alive) setUnsupported(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const child = dash?.students?.[childIdx];

  useEffect(() => {
    if (!child) return;
    let alive = true;
    apiGet<Grade[]>(`/grades?studentId=${child.id}`).then((g) => alive && setGrades(g)).catch(() => alive && setGrades([]));
    return () => { alive = false; };
  }, [child?.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-surface text-sm text-subtle">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
      </div>
    );
  }
  if (unsupported || !child) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-surface px-6 text-center">
        <GraduationCap className="h-7 w-7 text-subtle" />
        <p className="text-sm font-medium text-ink">Esta app es para acudientes.</p>
      </div>
    );
  }

  // Promedio por materia → promedio general + conteo de materias.
  const bySubject = new Map<string, { sum: number; n: number }>();
  for (const g of grades ?? []) {
    const name = g.subject?.name ?? "—";
    const s = Number(g.score);
    if (!Number.isFinite(s)) continue;
    const e = bySubject.get(name) ?? { sum: 0, n: 0 };
    e.sum += s; e.n += 1;
    bySubject.set(name, e);
  }
  const subjectAvgs = [...bySubject.values()].map(({ sum, n }) => sum / n);
  const promedio = subjectAvgs.length ? subjectAvgs.reduce((a, b) => a + b, 0) / subjectAvgs.length : null;

  const childInvoices = (dash?.pendingInvoices ?? []).filter((i) => i.studentId === child.id);
  const pension = childInvoices.some((i) => i.status === "OVERDUE")
    ? { label: "En mora", color: "text-rose-700" }
    : childInvoices.length
      ? { label: "Pendiente", color: "text-amber-700" }
      : { label: "Al día", color: "text-emerald-700" };

  const stats: { icon: LucideIcon; value: string; label: string; color: string }[] = [
    { icon: BookOpen, value: promedio != null ? promedio.toFixed(1) : "—", label: "Promedio", color: "text-primary" },
    { icon: GraduationCap, value: String(bySubject.size), label: "Materias", color: "text-primary" },
    { icon: Wallet, value: pension.label, label: "Pensión", color: pension.color },
  ];

  const saludoNombre = user?.firstName ?? child.name.split(" ")[0];
  const childFirst = child.name.split(" ")[0];

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-0 sm:p-8">
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
            <button className="relative flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink">
              <Bell className="h-[15px] w-[15px]" />
              {(dash?.unreadNotifications ?? 0) > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />}
            </button>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">{initialsOf(saludoNombre)}</span>
          </div>
        </div>

        {/* scroll content */}
        <div className="flex flex-1 flex-col gap-[18px] overflow-y-auto px-5 py-4">
          {/* greeting */}
          <div className="flex flex-col gap-1">
            <span className="text-[13px] font-medium text-subtle">Hola, {saludoNombre}</span>
            <h1 className="text-2xl font-extrabold leading-tight -tracking-[0.02em] text-ink">
              {dash!.students!.length > 1 ? `Tus ${dash!.students!.length} estudiantes` : `El progreso de ${childFirst}`}
            </h1>
          </div>

          {/* student card (+ selector si hay varios) */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => dash!.students!.length > 1 && setMenuOpen((o) => !o)}
              className="flex w-full items-center gap-3 rounded-[18px] p-4 text-left text-white"
              style={{ background: "var(--grad-primary)" }}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-base font-extrabold text-primary">{initialsOf(child.name)}</span>
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-bold">{child.name}</span>
                <span className="flex items-center gap-2 text-[11px] text-white/80">
                  {child.gradeGroup?.name ?? "—"}
                  {promedio != null && <><span>·</span> <span className="font-semibold">Promedio {promedio.toFixed(1)}</span></>}
                </span>
              </div>
              {dash!.students!.length > 1 && (
                <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/15"><ChevronDown className="h-3.5 w-3.5" /></span>
              )}
            </button>
            {menuOpen && (
              <div className="absolute left-0 right-0 top-[72px] z-10 flex flex-col overflow-hidden rounded-2xl border border-line bg-card p-1.5 shadow-2xl">
                {dash!.students!.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => { setChildIdx(i); setMenuOpen(false); setGrades(null); }}
                    className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] ${i === childIdx ? "bg-surface font-semibold text-ink" : "text-ink hover:bg-surface"}`}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-tint text-[10px] font-bold text-primary">{initialsOf(s.name)}</span>
                    <span className="flex-1">{s.name}</span>
                    <span className="text-[11px] text-subtle">{s.gradeGroup?.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* quick stats */}
          <div className="flex gap-2.5">
            {stats.map((s) => {
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

          {/* novedades */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-ink">Novedades</span>
              {(dash?.unreadNotifications ?? 0) > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-white">{dash!.unreadNotifications} nuevas</span>
              )}
            </div>
            {notifs.length === 0 ? (
              <div className="flex flex-col items-center gap-1 rounded-[14px] border border-dashed border-line bg-card py-8 text-center">
                <Sparkles className="h-5 w-5 text-subtle" />
                <span className="text-xs text-subtle">No hay novedades por ahora.</span>
              </div>
            ) : (
              notifs.slice(0, 8).map((n) => (
                <div key={n.id} className="flex items-start gap-3 rounded-[14px] border border-line bg-card p-3.5">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${n.isRead ? "bg-surface text-subtle" : "bg-s-info text-s-info-fg"}`}><Bell className="h-3.5 w-3.5" /></span>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="text-xs font-bold text-ink">{n.title}</span>
                    <span className="text-[11px] text-subtle">{n.body}</span>
                    <span className="text-[10px] text-subtle">{relativeTime(n.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
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
