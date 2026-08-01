"use client";

import { useCallback, useEffect, useState } from "react";
import { Banknote, Download, TrendingUp, Check, CircleAlert, Loader2, TriangleAlert, Wallet } from "lucide-react";
import { apiGet } from "@/lib/api";
import { getCurrentYear, initials } from "@/lib/academic";

type Summary = { billed: number; collected: number; portfolio: number; overdueCount: number; pendingCount: number };
type Monthly = { month: number; billed: number; collected: number; overdue: number };
type Invoice = {
  id: string; amount: string; month: number; status: "PENDING" | "PAID" | "OVERDUE" | "IN_ARREARS"; dueDate: string;
  student: { user: { firstName: string; lastName: string } };
  payment: { receiptNumber: string; paidAt: string; amount: string } | null;
};
type Paginated<T> = { data: T[]; meta: { total: number } };

const MONTHS = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const cop = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
const copM = (n: number) => `$ ${(n / 1_000_000).toLocaleString("es-CO", { maximumFractionDigits: 1 })} M`;

const STATUS: Record<string, { label: string; chip: string; icon: typeof Check }> = {
  PAID: { label: "Pagada", chip: "bg-s-success text-s-success-fg", icon: Check },
  PENDING: { label: "Pendiente", chip: "bg-s-warning text-s-warning-fg", icon: CircleAlert },
  OVERDUE: { label: "Vencida", chip: "bg-s-error text-s-error-fg", icon: CircleAlert },
  IN_ARREARS: { label: "En mora", chip: "bg-s-error text-s-error-fg", icon: CircleAlert },
};
const AVATARS = ["#7C3AED", "#0EA5E9", "#10B981", "#F59E0B", "#EC4899", "#6366F1"];

export default function FinanzasPage() {
  const [yearId, setYearId] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [monthly, setMonthly] = useState<Monthly[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState<"PAID" | "OVERDUE">("PAID");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const year = await getCurrentYear();
        if (!year) throw new Error("Sin año lectivo");
        setYearId(year.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error de contexto."); setLoading(false);
      }
    })();
  }, []);

  const loadCore = useCallback(async () => {
    if (!yearId) return;
    setLoading(true); setError(null);
    try {
      const [s, m] = await Promise.all([
        apiGet<Summary>(`/finance/summary/${yearId}`),
        apiGet<Monthly[]>(`/finance/monthly/${yearId}`),
      ]);
      setSummary(s); setMonthly(m);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar las finanzas.");
    } finally {
      setLoading(false);
    }
  }, [yearId]);

  useEffect(() => { loadCore(); }, [loadCore]);

  const loadInvoices = useCallback(async () => {
    if (!yearId) return;
    try {
      const res = await apiGet<Paginated<Invoice>>(`/finance/invoices?academicYearId=${yearId}&status=${filter}&limit=20`);
      setInvoices(res.data);
    } catch { setInvoices([]); }
  }, [yearId, filter]);

  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  const collectRate = summary && summary.billed > 0 ? Math.round((summary.collected / summary.billed) * 100) : 0;
  const maxBar = Math.max(1, ...monthly.map((m) => Math.max(m.billed, m.collected)));

  const KPIS = summary ? [
    { label: "Cartera por cobrar", value: copM(summary.portfolio), chip: `${summary.overdueCount} vencidas`, tone: "bg-s-warning text-s-warning-fg", spark: "bg-primary", accent: false },
    { label: "Facturado (año)", value: copM(summary.billed), chip: `${summary.pendingCount} pendientes`, tone: "bg-s-info text-s-info-fg", spark: "bg-blue-500", accent: false },
    { label: "Recaudado (año)", value: copM(summary.collected), chip: "acumulado", tone: "bg-s-success text-s-success-fg", spark: "bg-emerald-500", accent: false },
    { label: "Tasa de cobro", value: `${collectRate}%`, chip: collectRate >= 80 ? "saludable" : "atención", tone: collectRate >= 80 ? "bg-s-success text-s-success-fg" : "bg-s-error text-s-error-fg", spark: "bg-blue-500", accent: collectRate < 80 },
  ] : [];

  return (
    <div className="flex flex-col gap-5 px-7 py-8">
      {/* header */}
      <div className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold tracking-[0.18em] text-primary">FINANZAS</span>
          <h1 className="text-[28px] font-bold text-ink">Cartera y cobros</h1>
          <p className="text-[13px] text-subtle">Resumen financiero del año lectivo en curso</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="flex h-[38px] items-center gap-2 rounded-[10px] border border-line px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface"><Banknote className="h-4 w-4" /> Conciliar PSE</button>
          <button className="flex h-[38px] items-center gap-2 rounded-[10px] border border-line px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface"><Download className="h-4 w-4" /> Exportar</button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Cargando finanzas…</div>
      ) : error ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-s-error-fg"><TriangleAlert className="h-4 w-4" /> {error}</div>
      ) : (
        <>
          {/* KPI strip */}
          <div className="flex flex-wrap gap-3">
            {KPIS.map((k) => (
              <div key={k.label} className="relative flex min-w-[200px] flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-card">
                {k.accent && <span className="h-[3px] w-full bg-danger" />}
                <div className="flex flex-1 flex-col gap-2.5 p-[18px]">
                  <span className="text-xs font-medium text-subtle">{k.label}</span>
                  <span className="text-[28px] font-bold leading-none text-ink">{k.value}</span>
                  <div className="flex items-center justify-between">
                    <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${k.tone}`}><TrendingUp className="h-3 w-3" /> {k.chip}</span>
                    <div className="flex h-[18px] items-end gap-[3px]">{[0.5, 0.75, 0.95].map((o, i) => <span key={i} className={`w-2.5 rounded-sm ${k.spark}`} style={{ height: 10 + i * 4, opacity: o }} />)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* recaudo mes a mes */}
          <div className="flex flex-col gap-4 rounded-2xl border border-line bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-sm font-semibold text-ink">Facturado vs. recaudado por mes</h3>
                <p className="text-xs text-subtle">Comparativo mensual del año lectivo</p>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5 text-subtle"><span className="h-2.5 w-2.5 rounded-sm bg-line-soft" /> Facturado</span>
                <span className="flex items-center gap-1.5 text-subtle"><span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Recaudado</span>
              </div>
            </div>
            {monthly.length === 0 ? (
              <span className="py-8 text-center text-xs text-subtle">Sin facturación registrada todavía.</span>
            ) : (
              <div className="flex items-end gap-4" style={{ height: 220 }}>
                {monthly.map((m) => (
                  <div key={m.month} className="flex flex-1 flex-col items-center gap-1.5">
                    <span className="text-[10px] font-bold text-primary">{copM(m.collected)}</span>
                    <div className="flex w-full flex-1 items-end justify-center gap-1">
                      <span className="w-1/2 rounded-t-md bg-line-soft" style={{ height: `${(m.billed / maxBar) * 100}%` }} title={`Facturado ${cop(m.billed)}`} />
                      <span className="w-1/2 rounded-t-md bg-primary" style={{ height: `${(m.collected / maxBar) * 100}%` }} title={`Recaudado ${cop(m.collected)}`} />
                    </div>
                    <span className="text-[11px] text-subtle">{MONTHS[m.month]}</span>
                    {m.overdue > 0 && <span className="text-[9px] font-semibold text-rose-600">{m.overdue} venc.</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* facturas */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div className="flex items-center gap-2.5">
                <Wallet className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-ink">Facturas</h3>
              </div>
              <div className="flex items-center gap-1 rounded-[10px] bg-surface p-1">
                {([["PAID", "Pagadas"], ["OVERDUE", "Vencidas"]] as const).map(([id, label]) => (
                  <button key={id} onClick={() => setFilter(id)}
                    className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${filter === id ? "bg-card font-semibold text-ink shadow-card" : "font-medium text-subtle hover:text-ink"}`}>{label}</button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 border-b border-line bg-surface px-5 py-3 text-[11px] font-bold tracking-[0.1em] text-subtle">
              <span className="flex-1">ESTUDIANTE</span>
              <span className="w-[90px]">MES</span>
              <span className="w-[150px]">RECIBO</span>
              <span className="w-[130px] text-right">VALOR</span>
              <span className="w-[120px]">ESTADO</span>
            </div>

            {invoices.length === 0 ? (
              <div className="py-12 text-center text-sm text-subtle">No hay facturas {filter === "PAID" ? "pagadas" : "vencidas"}.</div>
            ) : invoices.map((inv, i) => {
              const st = STATUS[inv.status] ?? STATUS.PENDING;
              const StIcon = st.icon;
              const name = `${inv.student.user.firstName} ${inv.student.user.lastName}`;
              return (
                <div key={inv.id} className={`flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface/50 ${i < invoices.length - 1 ? "border-b border-line" : ""}`}>
                  <div className="flex flex-1 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: AVATARS[i % AVATARS.length] }}>{initials(inv.student.user.firstName, inv.student.user.lastName)}</span>
                    <span className="text-[13px] font-semibold text-ink">{name}</span>
                  </div>
                  <span className="w-[90px] text-[13px] text-subtle">{MONTHS[inv.month]}</span>
                  <span className="w-[150px] text-xs text-subtle">{inv.payment?.receiptNumber ?? "—"}</span>
                  <span className="w-[130px] text-right text-sm font-bold text-ink">{cop(Number(inv.amount))}</span>
                  <div className="w-[120px]"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.chip}`}><StIcon className="h-2.5 w-2.5" /> {st.label}</span></div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
