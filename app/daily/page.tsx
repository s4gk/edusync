"use client";

import { useEffect, useState } from "react";
import {
  Archive, Share2, Printer, Download, ShieldAlert, CreditCard, Wallet, FileText,
  Users, GraduationCap, ClipboardList, MailCheck, ArrowRight, Loader2, RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/components/auth-context";

/* ---------------- datos del backend ---------------- */

type Announcement = { id: string; title?: string; publishedAt?: string | null; author?: { firstName: string; lastName: string } | null };
type AdminDash = {
  type?: string;
  overview?: { totalStudents: number; totalTeachers: number; totalUsers: number; activeEnrollments: number };
  finance?: { pendingInvoices: number; overdueInvoices: number; collectedThisMonth: number; billedThisMonth: number };
  recentAnnouncements?: Announcement[];
  currentYear?: { id: string; year: number } | null;
};

const fmtNum = (n: number) => n.toLocaleString("es-CO");
const fmtCOP = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0, notation: "compact" }).format(n);

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

/* ---------------- página ---------------- */

export default function DailyPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AdminDash | null>(null);
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState("");

  useEffect(() => {
    let alive = true;
    apiGet<AdminDash>("/dashboard")
      .then((d) => alive && setData(d))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    setToday(cap(new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-card text-sm text-subtle">
        <Loader2 className="h-4 w-4 animate-spin" /> Preparando la edición de hoy…
      </div>
    );
  }

  if (data?.type !== "admin" || !data.overview || !data.finance) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-card px-6 text-center">
        <ShieldAlert className="h-7 w-7 text-subtle" />
        <p className="text-sm font-medium text-ink">Esta edición es para rectoría y dirección.</p>
      </div>
    );
  }

  const o = data.overview;
  const f = data.finance;
  const announcements = data.recentAnnouncements ?? [];
  const hour = new Date().getHours();
  const saludo = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const nombre = user ? `${user.firstName} ${user.lastName}`.trim() : "";

  const kpis: { label: string; value: string; icon: LucideIcon }[] = [
    { label: "Estudiantes", value: fmtNum(o.totalStudents), icon: Users },
    { label: "Docentes", value: fmtNum(o.totalTeachers), icon: GraduationCap },
    { label: "Matrículas activas", value: fmtNum(o.activeEnrollments), icon: ClipboardList },
    { label: "Recaudo del mes", value: fmtCOP(f.collectedThisMonth), icon: Wallet },
    { label: "Facturas pendientes", value: fmtNum(f.pendingInvoices), icon: FileText },
    { label: "Facturas vencidas", value: fmtNum(f.overdueInvoices), icon: CreditCard },
  ];

  const todos: { icon: LucideIcon; title: string; sub: string; tone: string }[] = [];
  if (f.overdueInvoices > 0)
    todos.push({ icon: CreditCard, title: `${fmtNum(f.overdueInvoices)} facturas vencidas`, sub: "Cartera en mora — programar recordatorios", tone: "bg-s-error text-s-error-fg" });
  if (f.pendingInvoices > 0)
    todos.push({ icon: FileText, title: `${fmtNum(f.pendingInvoices)} facturas por cobrar`, sub: "Pendientes de pago este periodo", tone: "bg-s-warning text-s-warning-fg" });
  if (f.billedThisMonth > 0)
    todos.push({ icon: Wallet, title: `${fmtCOP(f.collectedThisMonth)} recaudado de ${fmtCOP(f.billedThisMonth)}`, sub: "Recaudo vs. facturado del mes", tone: "bg-s-info text-s-info-fg" });

  return (
    <div className="min-h-screen bg-card">
      {/* ====== top bar ====== */}
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-line bg-card px-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-sm font-extrabold text-white">E</span>
          <span className="text-sm font-extrabold tracking-[0.18em] text-ink">EDUSYNC</span>
          <span className="h-4 w-px bg-line" />
          <span className="text-[10px] font-semibold tracking-[0.18em] text-subtle">DAILY</span>
        </div>
        <span className="flex h-8 items-center gap-1.5 text-xs text-subtle"><RefreshCw className="h-3 w-3" /> Datos en vivo</span>
      </header>

      {/* ====== editorial header ====== */}
      <section className="flex flex-col gap-5 px-8 py-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {data.currentYear && <span className="font-bold tracking-[0.18em] text-primary">AÑO LECTIVO {data.currentYear.year}</span>}
            <span className="h-4 w-px bg-line" />
            <span className="text-subtle">{today}</span>
          </div>
          <div className="flex items-center gap-1">
            {[Archive, Share2, Printer].map((Icon, i) => (
              <button key={i} className="flex h-8 w-8 items-center justify-center rounded-lg text-subtle hover:bg-surface"><Icon className="h-3.5 w-3.5" /></button>
            ))}
          </div>
        </div>
        <h1 className="max-w-3xl text-[40px] font-bold leading-[1.05] -tracking-[0.025em] text-ink">
          {saludo}{nombre ? `, ${nombre}` : ""}.
        </h1>
        <p className="max-w-3xl text-[17px] leading-relaxed text-subtle">
          {fmtNum(o.totalStudents)} estudiantes, {fmtNum(o.totalTeachers)} docentes y {fmtNum(f.overdueInvoices)} facturas vencidas. Esto es lo que importa hoy.
        </p>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
          <button className="flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90">
            <Download className="h-3.5 w-3.5" /> Exportar PDF
          </button>
        </div>
      </section>

      {/* ====== KPIs ====== */}
      <section className="px-8 pb-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="flex flex-col gap-2.5 rounded-2xl border border-line bg-card p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-primary"><Icon className="h-4 w-4" /></span>
                <span className="text-[22px] font-bold -tracking-[0.02em] text-ink">{k.value}</span>
                <span className="text-[11px] font-medium text-subtle">{k.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ====== hero row: para revisar + comunicados ====== */}
      <section className="flex flex-col gap-5 px-8 pb-10 xl:flex-row">
        {/* para revisar hoy */}
        <div className="flex flex-1 flex-col gap-4 rounded-3xl border border-line bg-card p-8">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold tracking-[0.18em] text-primary">PARA REVISAR HOY</span>
            <h2 className="text-2xl font-bold -tracking-[0.01em] text-ink">Lo prioritario</h2>
          </div>
          <div className="flex flex-col gap-2.5">
            {todos.length === 0 ? (
              <div className="flex flex-col items-center gap-1 py-10 text-center">
                <Wallet className="h-6 w-6 text-subtle" />
                <p className="text-sm font-medium text-ink">Sin pendientes financieros</p>
                <p className="text-xs text-subtle">No hay cartera vencida ni facturas por cobrar.</p>
              </div>
            ) : (
              todos.map((t) => {
                const Icon = t.icon;
                return (
                  <div key={t.title} className="flex items-center gap-3.5 rounded-2xl bg-surface p-3.5">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.tone}`}><Icon className="h-5 w-5" /></span>
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-semibold text-ink">{t.title}</span>
                      <span className="text-xs text-subtle">{t.sub}</span>
                    </div>
                    <a href="/finanzas" className="rounded-lg border border-line px-3 py-1.5 text-[11px] font-semibold text-ink hover:bg-card">Ver</a>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* comunicados recientes */}
        <div className="flex w-full flex-col overflow-hidden rounded-3xl border border-line bg-card xl:w-[440px] xl:shrink-0">
          <div className="flex items-center justify-between border-b border-line px-6 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="text-base font-semibold text-ink">Comunicados recientes</span>
              <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-white">{announcements.length}</span>
            </div>
            <a href="/comunicaciones" className="flex items-center gap-1 text-xs font-semibold text-primary">Ver todo <ArrowRight className="h-3 w-3" /></a>
          </div>
          <div className="flex flex-col">
            {announcements.length === 0 ? (
              <div className="flex flex-col items-center gap-1 py-12 text-center">
                <MailCheck className="h-6 w-6 text-subtle" />
                <p className="text-sm font-medium text-ink">Sin comunicados recientes</p>
              </div>
            ) : (
              announcements.map((a, i) => (
                <div key={a.id} className={`flex gap-3 px-5 py-3.5 ${i < announcements.length - 1 ? "border-b border-line" : ""}`}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary"><MailCheck className="h-4 w-4" /></span>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-ink">{a.title ?? "Comunicado"}</span>
                      <span className="shrink-0 text-[11px] text-subtle">{relativeTime(a.publishedAt)}</span>
                    </div>
                    {a.author && <span className="text-xs text-subtle">Por {a.author.firstName} {a.author.lastName}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
