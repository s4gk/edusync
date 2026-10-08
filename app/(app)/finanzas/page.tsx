"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Banknote, Download, TrendingUp, Check, CircleAlert, Loader2, TriangleAlert,
  Wallet, Receipt, FilePlus2, Settings2, Search, X,
} from "lucide-react";
import { Modal, FormField, inputCls } from "@/components/modal";
import { useAuth } from "@/components/auth-context";
import { getCurrentYear, getGroups, gradeLabel, initials, type Group } from "@/lib/academic";
import {
  MONTHS, MONTHS_SHORT, STATUS_META, cop, copCompact, downloadCSV, generateInvoices,
  getInvoices, getMonthly, getSummary, getTuition, invoiceTotal, registerPayment,
  suggestReceipt, upsertTuition,
  type FinanceSummary, type Invoice, type MonthlyRow, type TuitionConfig,
} from "@/lib/finance";

const AVATARS = ["#7C3AED", "#0EA5E9", "#10B981", "#F59E0B", "#EC4899", "#6366F1"];
const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });

/** Roles que pueden mover plata. Contabilidad y secretaría registran; el resto
 *  solo consulta. El backend lo vuelve a validar — esto es para no mostrar
 *  botones que van a responder 403. */
const CAN_OPERATE = new Set(["SUPER_ADMIN", "RECTOR", "ACCOUNTANT", "SECRETARY"]);

type Tab = "PENDING" | "OVERDUE" | "PAID" | "ALL";
const TABS: { id: Tab; label: string }[] = [
  { id: "PENDING", label: "Por cobrar" },
  { id: "OVERDUE", label: "Vencidas" },
  { id: "PAID", label: "Pagadas" },
  { id: "ALL", label: "Todas" },
];

export default function FinanzasPage() {
  const { user } = useAuth();
  const puedeOperar = !!user && CAN_OPERATE.has(user.role);

  const [yearId, setYearId] = useState("");
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [monthly, setMonthly] = useState<MonthlyRow[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [tab, setTab] = useState<Tab>("PENDING");
  const [monthFilter, setMonthFilter] = useState(0);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // modales
  const [payFor, setPayFor] = useState<Invoice | null>(null);
  const [genOpen, setGenOpen] = useState(false);
  const [tuitionOpen, setTuitionOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const year = await getCurrentYear();
        if (!year) throw new Error("No hay un año lectivo configurado. Créalo en Configuración → Año lectivo.");
        setYearId(year.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error de contexto.");
        setLoading(false);
      }
    })();
  }, []);

  const loadCore = useCallback(async () => {
    if (!yearId) return;
    setLoading(true); setError(null);
    try {
      const [s, m] = await Promise.all([getSummary(yearId), getMonthly(yearId)]);
      setSummary(s); setMonthly(m);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar las finanzas.");
    } finally { setLoading(false); }
  }, [yearId]);

  useEffect(() => { loadCore(); }, [loadCore]);

  const loadInvoices = useCallback(async () => {
    if (!yearId) return;
    setLoadingList(true);
    try {
      const res = await getInvoices({
        academicYearId: yearId,
        status: tab === "ALL" ? undefined : tab,
        month: monthFilter || undefined,
        limit: 200,
      });
      setInvoices(res.data);
      setTotal(res.meta?.total ?? res.data.length);
    } catch {
      setInvoices([]); setTotal(0);
    } finally { setLoadingList(false); }
  }, [yearId, tab, monthFilter]);

  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  const refreshAll = async () => { await Promise.all([loadCore(), loadInvoices()]); };

  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(null), 4000); };

  const visibles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter((i) =>
      `${i.student.user.firstName} ${i.student.user.lastName}`.toLowerCase().includes(q) ||
      (i.payment?.receiptNumber ?? "").toLowerCase().includes(q));
  }, [invoices, query]);

  const sumaVisible = useMemo(() => visibles.reduce((a, i) => a + invoiceTotal(i), 0), [visibles]);

  const collectRate = summary && summary.billed > 0 ? Math.round((summary.collected / summary.billed) * 100) : 0;
  const maxBar = Math.max(1, ...monthly.map((m) => Math.max(m.billed, m.collected)));

  const exportar = () => {
    const rows: (string | number)[][] = [
      ["Estudiante", "Curso", "Mes", "Vence", "Valor", "Mora", "Total", "Estado", "Recibo", "Pagado el"],
      ...visibles.map((i) => [
        `${i.student.user.firstName} ${i.student.user.lastName}`,
        i.student.gradeGroup?.name ?? "",
        MONTHS[i.month] ?? i.month,
        i.dueDate?.slice(0, 10) ?? "",
        Number(i.amount),
        Number(i.lateFee ?? 0),
        invoiceTotal(i),
        STATUS_META[i.status]?.label ?? i.status,
        i.payment?.receiptNumber ?? "",
        i.payment?.paidAt?.slice(0, 10) ?? "",
      ]),
    ];
    downloadCSV(`cartera_${TABS.find((t) => t.id === tab)?.label ?? tab}_${today()}.csv`, rows);
  };

  const KPIS = summary ? [
    { label: "Cartera por cobrar", value: copCompact(summary.portfolio), chip: `${summary.overdueCount} vencidas`, tone: "bg-s-warning text-s-warning-fg", spark: "bg-primary", accent: summary.overdueCount > 0 },
    { label: "Facturado (año)", value: copCompact(summary.billed), chip: `${summary.pendingCount} pendientes`, tone: "bg-s-info text-s-info-fg", spark: "bg-blue-500", accent: false },
    { label: "Recaudado (año)", value: copCompact(summary.collected), chip: "acumulado", tone: "bg-s-success text-s-success-fg", spark: "bg-emerald-500", accent: false },
    { label: "Tasa de cobro", value: `${collectRate}%`, chip: collectRate >= 80 ? "saludable" : "atención", tone: collectRate >= 80 ? "bg-s-success text-s-success-fg" : "bg-s-error text-s-error-fg", spark: "bg-blue-500", accent: collectRate < 80 },
  ] : [];

  return (
    <div className="flex flex-col gap-5 px-7 py-8">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold tracking-[0.18em] text-primary">FINANZAS</span>
          <h1 className="text-[28px] font-bold text-ink">Cartera y cobros</h1>
          <p className="text-[13px] text-subtle">Resumen financiero del año lectivo en curso</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {puedeOperar && (
            <>
              <button onClick={() => setTuitionOpen(true)} className="flex h-[38px] items-center gap-2 rounded-[10px] border border-line px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">
                <Settings2 className="h-4 w-4" /> Tarifas
              </button>
              <button onClick={() => setGenOpen(true)} className="flex h-[38px] items-center gap-2 rounded-[10px] border border-line px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">
                <FilePlus2 className="h-4 w-4" /> Generar facturación
              </button>
            </>
          )}
          <button onClick={exportar} disabled={!visibles.length} className="flex h-[38px] items-center gap-2 rounded-[10px] border border-line px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface disabled:opacity-40">
            <Download className="h-4 w-4" /> Exportar
          </button>
        </div>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-xl bg-s-success px-4 py-2.5 text-[13px] font-semibold text-s-success-fg">
          <Check className="h-4 w-4" /> {toast}
        </div>
      )}

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
                  <button key={m.month} onClick={() => setMonthFilter(monthFilter === m.month ? 0 : m.month)}
                    title={`Ver facturas de ${MONTHS[m.month]}`}
                    className={`flex flex-1 flex-col items-center gap-1.5 rounded-lg py-1 transition-colors hover:bg-surface ${monthFilter === m.month ? "bg-surface" : ""}`}>
                    <span className="text-[10px] font-bold text-primary">{copCompact(m.collected)}</span>
                    <div className="flex w-full flex-1 items-end justify-center gap-1">
                      <span className="w-1/2 rounded-t-md bg-line-soft" style={{ height: `${(m.billed / maxBar) * 100}%` }} title={`Facturado ${cop(m.billed)}`} />
                      <span className="w-1/2 rounded-t-md bg-primary" style={{ height: `${(m.collected / maxBar) * 100}%` }} title={`Recaudado ${cop(m.collected)}`} />
                    </div>
                    <span className="text-[11px] text-subtle">{MONTHS_SHORT[m.month]}</span>
                    {m.overdue > 0 && <span className="text-[9px] font-semibold text-rose-600">{m.overdue} venc.</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* facturas */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
              <div className="flex items-center gap-2.5">
                <Wallet className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-ink">Facturas</h3>
                <span className="text-xs text-subtle">
                  {loadingList ? "cargando…" : `${visibles.length} de ${total} · ${cop(sumaVisible)}`}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {monthFilter > 0 && (
                  <button onClick={() => setMonthFilter(0)} className="flex items-center gap-1 rounded-full bg-primary-tint px-2.5 py-1 text-[11px] font-semibold text-primary">
                    {MONTHS[monthFilter]} <X className="h-3 w-3" />
                  </button>
                )}
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar estudiante o recibo"
                    className="h-8 w-[220px] rounded-lg border border-line bg-card pl-8 pr-3 text-[12px] text-ink outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted" />
                </div>
                <div className="flex items-center gap-1 rounded-[10px] bg-surface p-1">
                  {TABS.map((t) => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${tab === t.id ? "bg-card font-semibold text-ink shadow-card" : "font-medium text-subtle hover:text-ink"}`}>{t.label}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 border-b border-line bg-surface px-5 py-3 text-[11px] font-bold tracking-[0.1em] text-subtle">
              <span className="flex-1">ESTUDIANTE</span>
              <span className="w-[70px]">MES</span>
              <span className="w-[100px]">VENCE</span>
              <span className="w-[130px] text-right">TOTAL</span>
              <span className="w-[110px]">ESTADO</span>
              <span className="w-[140px]">{puedeOperar ? "ACCIÓN" : "RECIBO"}</span>
            </div>

            {loadingList ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Cargando facturas…</div>
            ) : visibles.length === 0 ? (
              <div className="py-12 text-center text-sm text-subtle">
                No hay facturas {TABS.find((t) => t.id === tab)?.label.toLowerCase()}{monthFilter ? ` en ${MONTHS[monthFilter]}` : ""}.
              </div>
            ) : visibles.map((inv, i) => {
              const st = STATUS_META[inv.status] ?? STATUS_META.PENDING;
              const StIcon = inv.status === "PAID" ? Check : CircleAlert;
              const name = `${inv.student.user.firstName} ${inv.student.user.lastName}`;
              const mora = Number(inv.lateFee ?? 0);
              return (
                <div key={inv.id} className={`flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface/50 ${i < visibles.length - 1 ? "border-b border-line" : ""}`}>
                  <div className="flex flex-1 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: AVATARS[i % AVATARS.length] }}>
                      {initials(inv.student.user.firstName, inv.student.user.lastName)}
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-[13px] font-semibold text-ink">{name}</span>
                      {inv.student.gradeGroup && <span className="text-[11px] text-subtle">{inv.student.gradeGroup.name}</span>}
                    </div>
                  </div>
                  <span className="w-[70px] text-[13px] text-subtle">{MONTHS_SHORT[inv.month]}</span>
                  <span className="w-[100px] text-[12px] text-subtle">{inv.dueDate ? fmtDate(inv.dueDate) : "—"}</span>
                  <div className="flex w-[130px] flex-col items-end">
                    <span className="text-sm font-bold text-ink">{cop(invoiceTotal(inv))}</span>
                    {mora > 0 && <span className="text-[10px] font-semibold text-rose-600">+{cop(mora)} mora</span>}
                  </div>
                  <div className="w-[110px]"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.chip}`}><StIcon className="h-2.5 w-2.5" /> {st.label}</span></div>
                  <div className="w-[140px]">
                    {inv.payment ? (
                      <span className="text-[11px] text-subtle" title={`Pagado el ${fmtDate(inv.payment.paidAt)}`}>{inv.payment.receiptNumber}</span>
                    ) : puedeOperar ? (
                      <button onClick={() => setPayFor(inv)} className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[12px] font-semibold text-white transition-opacity hover:opacity-90">
                        <Receipt className="h-3.5 w-3.5" /> Registrar pago
                      </button>
                    ) : <span className="text-[11px] text-muted">—</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {payFor && (
        <PaymentModal invoice={payFor} onClose={() => setPayFor(null)}
          onDone={async (recibo) => { setPayFor(null); flash(`Pago registrado · recibo ${recibo}`); await refreshAll(); }} />
      )}
      {genOpen && (
        <GenerateModal yearId={yearId} onClose={() => setGenOpen(false)}
          onDone={async (msg) => { setGenOpen(false); flash(msg); await refreshAll(); }} />
      )}
      {tuitionOpen && (
        <TuitionModal yearId={yearId} onClose={() => setTuitionOpen(false)} onSaved={() => flash("Tarifas actualizadas.")} />
      )}
    </div>
  );
}

/* ══════════ Registrar pago ══════════ */

function PaymentModal({ invoice, onClose, onDone }: {
  invoice: Invoice; onClose: () => void; onDone: (recibo: string) => void;
}) {
  const debido = invoiceTotal(invoice);
  const [receipt, setReceipt] = useState(suggestReceipt(Math.floor(Date.now() / 1000) % 10000));
  const [paidAt, setPaidAt] = useState(today());
  const [amount, setAmount] = useState(String(debido));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const monto = Number(amount);
  const parcial = monto > 0 && monto < debido;

  const submit = async () => {
    setErr(null);
    if (!receipt.trim()) { setErr("El número de recibo es obligatorio."); return; }
    if (!(monto > 0)) { setErr("El valor pagado debe ser mayor que cero."); return; }
    setBusy(true);
    try {
      await registerPayment({ invoiceId: invoice.id, receiptNumber: receipt.trim(), paidAt, amount: monto });
      onDone(receipt.trim());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo registrar el pago.");
    } finally { setBusy(false); }
  };

  const name = `${invoice.student.user.firstName} ${invoice.student.user.lastName}`;

  return (
    <Modal open onClose={onClose} title="Registrar pago" subtitle={`${name} · ${MONTHS[invoice.month]}`} width={480}>
      <div className="flex items-center justify-between rounded-xl bg-surface px-4 py-3">
        <span className="text-xs font-medium text-subtle">Valor de la factura</span>
        <div className="flex flex-col items-end">
          <span className="text-[17px] font-bold text-ink">{cop(debido)}</span>
          {Number(invoice.lateFee ?? 0) > 0 && (
            <span className="text-[11px] text-rose-600">incluye {cop(Number(invoice.lateFee))} de mora</span>
          )}
        </div>
      </div>

      <FormField label="Número de recibo">
        <input className={inputCls} value={receipt} onChange={(e) => setReceipt(e.target.value)} placeholder="REC-2026-0001" />
      </FormField>
      <div className="flex gap-3">
        <div className="flex-1"><FormField label="Fecha de pago">
          <input type="date" className={inputCls} value={paidAt} max={today()} onChange={(e) => setPaidAt(e.target.value)} />
        </FormField></div>
        <div className="flex-1"><FormField label="Valor pagado">
          <input type="number" min={0} step={1000} className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </FormField></div>
      </div>

      {parcial && (
        <div className="flex items-start gap-2 rounded-lg bg-s-warning px-3 py-2 text-[12px] text-s-warning-fg">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Abono parcial: quedan <b>{cop(debido - monto)}</b> por cobrar. La factura se marcará como pagada de todos modos, así que registra el saldo por fuera si tu colegio lleva abonos.
        </div>
      )}
      {err && <div className="flex items-center gap-2 rounded-lg bg-s-error px-3 py-2 text-[13px] text-s-error-fg"><TriangleAlert className="h-4 w-4" /> {err}</div>}

      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onClose} className="flex h-9 items-center rounded-lg border border-line px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">Cancelar</button>
        <button onClick={submit} disabled={busy} className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Receipt className="h-3.5 w-3.5" />} Registrar
        </button>
      </div>
    </Modal>
  );
}

/* ══════════ Generar facturación del mes ══════════ */

function GenerateModal({ yearId, onClose, onDone }: {
  yearId: string; onClose: () => void; onDone: (msg: string) => void;
}) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(now.getFullYear(), now.getMonth(), 10);
    return d.toISOString().slice(0, 10);
  });
  const [groupId, setGroupId] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { getGroups(yearId).then(setGroups).catch(() => setGroups([])); }, [yearId]);

  const submit = async () => {
    setErr(null); setBusy(true);
    try {
      const res = await generateInvoices({ academicYearId: yearId, month, dueDate, gradeGroupId: groupId || undefined });
      const creadas = res?.created ?? 0;
      const omitidas = res?.skipped ?? 0;
      onDone(
        creadas === 0
          ? `No se creó ninguna factura (${omitidas} omitidas: ya existían o el grado no tiene tarifa).`
          : `${creadas} factura${creadas === 1 ? "" : "s"} generada${creadas === 1 ? "" : "s"} para ${MONTHS[month]}${omitidas ? ` · ${omitidas} omitidas` : ""}.`,
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo generar la facturación.");
    } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} title="Generar facturación" subtitle="Crea las facturas del mes para los estudiantes activos." width={480}>
      <div className="flex gap-3">
        <div className="flex-1"><FormField label="Mes a facturar">
          <select className={inputCls} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.slice(1).map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </FormField></div>
        <div className="flex-1"><FormField label="Fecha límite de pago">
          <input type="date" className={inputCls} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </FormField></div>
      </div>
      <FormField label="Alcance">
        <select className={inputCls} value={groupId} onChange={(e) => setGroupId(e.target.value)}>
          <option value="">Todos los cursos</option>
          {groups.map((g) => <option key={g.id} value={g.id}>{g.name} · {gradeLabel(g.gradeLevel)}</option>)}
        </select>
      </FormField>

      <div className="flex items-start gap-2 rounded-lg bg-s-info px-3 py-2 text-[12px] text-s-info-fg">
        <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        No se duplica nada: si un estudiante ya tiene factura de ese mes, se omite. Los grados sin tarifa configurada también se omiten — revísalos primero en <b>Tarifas</b>.
      </div>
      {err && <div className="flex items-center gap-2 rounded-lg bg-s-error px-3 py-2 text-[13px] text-s-error-fg"><TriangleAlert className="h-4 w-4" /> {err}</div>}

      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onClose} className="flex h-9 items-center rounded-lg border border-line px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">Cancelar</button>
        <button onClick={submit} disabled={busy} className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FilePlus2 className="h-3.5 w-3.5" />} Generar
        </button>
      </div>
    </Modal>
  );
}

/* ══════════ Tarifas por grado ══════════ */

function TuitionModal({ yearId, onClose, onSaved }: {
  yearId: string; onClose: () => void; onSaved: () => void;
}) {
  const [configs, setConfigs] = useState<TuitionConfig[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ enrollmentFee: "", monthlyFee: "", lateFeePercent: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cs, gs] = await Promise.all([getTuition(yearId), getGroups(yearId)]);
      setConfigs(cs); setGroups(gs);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudieron cargar las tarifas.");
    } finally { setLoading(false); }
  }, [yearId]);

  useEffect(() => { load(); }, [load]);

  // Un renglón por grado que exista en el año, tenga tarifa o no: el hueco es
  // justo lo que hay que ver — un grado sin tarifa no se factura.
  const niveles = useMemo(() => {
    const set = new Set<number>(groups.map((g) => g.gradeLevel));
    configs.forEach((c) => set.add(c.gradeLevel));
    return [...set].sort((a, b) => a - b);
  }, [groups, configs]);

  const configOf = (lvl: number) => configs.find((c) => c.gradeLevel === lvl) ?? null;

  const startEdit = (lvl: number) => {
    const c = configOf(lvl);
    setForm({
      enrollmentFee: c ? String(Number(c.enrollmentFee)) : "",
      monthlyFee: c ? String(Number(c.monthlyFee)) : "",
      lateFeePercent: c ? String(Number(c.lateFeePercent)) : "0",
    });
    setEditing(lvl); setErr(null);
  };

  const save = async () => {
    if (editing == null) return;
    setErr(null);
    const matricula = Number(form.enrollmentFee);
    const pension = Number(form.monthlyFee);
    const mora = Number(form.lateFeePercent || 0);
    if (!(matricula >= 0) || !(pension >= 0)) { setErr("Los valores deben ser números positivos."); return; }
    if (mora < 0 || mora > 100) { setErr("El porcentaje de mora debe estar entre 0 y 100."); return; }
    setBusy(true);
    try {
      await upsertTuition({ academicYearId: yearId, gradeLevel: editing, enrollmentFee: matricula, monthlyFee: pension, lateFeePercent: mora });
      setEditing(null);
      await load();
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo guardar la tarifa.");
    } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} title="Tarifas por grado" subtitle="Matrícula, pensión mensual y recargo por mora." width={640}>
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>
      ) : niveles.length === 0 ? (
        <div className="py-8 text-center text-sm text-subtle">Todavía no hay cursos creados en este año lectivo.</div>
      ) : (
        <div className="flex flex-col overflow-hidden rounded-xl border border-line">
          <div className="flex items-center gap-3 border-b border-line bg-surface px-4 py-2.5 text-[11px] font-bold tracking-[0.1em] text-subtle">
            <span className="flex-1">GRADO</span>
            <span className="w-[120px] text-right">MATRÍCULA</span>
            <span className="w-[120px] text-right">PENSIÓN</span>
            <span className="w-[70px] text-right">MORA</span>
            <span className="w-[80px]" />
          </div>
          {niveles.map((lvl, i) => {
            const c = configOf(lvl);
            const abierto = editing === lvl;
            return (
              <div key={lvl} className={`flex flex-col ${i < niveles.length - 1 ? "border-b border-line" : ""}`}>
                <div className="flex items-center gap-3 px-4 py-2.5">
                  <span className="flex-1 text-[13px] font-semibold text-ink">{gradeLabel(lvl)}</span>
                  {c ? (
                    <>
                      <span className="w-[120px] text-right text-[13px] text-ink">{cop(Number(c.enrollmentFee))}</span>
                      <span className="w-[120px] text-right text-[13px] font-semibold text-ink">{cop(Number(c.monthlyFee))}</span>
                      <span className="w-[70px] text-right text-[12px] text-subtle">{Number(c.lateFeePercent)}%</span>
                    </>
                  ) : (
                    <span className="w-[310px] text-right text-[12px] font-semibold text-s-warning-fg">Sin tarifa — no se factura</span>
                  )}
                  <div className="flex w-[80px] justify-end">
                    <button onClick={() => (abierto ? setEditing(null) : startEdit(lvl))}
                      className="rounded-lg border border-line px-2.5 py-1 text-[12px] font-semibold text-ink transition-colors hover:bg-surface">
                      {abierto ? "Cerrar" : c ? "Editar" : "Definir"}
                    </button>
                  </div>
                </div>

                {abierto && (
                  <div className="flex flex-col gap-3 bg-surface/60 px-4 py-3">
                    <div className="flex flex-wrap gap-3">
                      <div className="min-w-[150px] flex-1"><FormField label="Matrícula (anual)">
                        <input type="number" min={0} step={1000} className={inputCls} value={form.enrollmentFee} onChange={(e) => setForm({ ...form, enrollmentFee: e.target.value })} />
                      </FormField></div>
                      <div className="min-w-[150px] flex-1"><FormField label="Pensión (mensual)">
                        <input type="number" min={0} step={1000} className={inputCls} value={form.monthlyFee} onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })} />
                      </FormField></div>
                      <div className="w-[110px]"><FormField label="Mora %">
                        <input type="number" min={0} max={100} step={0.5} className={inputCls} value={form.lateFeePercent} onChange={(e) => setForm({ ...form, lateFeePercent: e.target.value })} />
                      </FormField></div>
                    </div>
                    {err && <div className="flex items-center gap-2 rounded-lg bg-s-error px-3 py-2 text-[12px] text-s-error-fg"><TriangleAlert className="h-3.5 w-3.5" /> {err}</div>}
                    <div className="flex justify-end">
                      <button onClick={save} disabled={busy} className="flex h-8 items-center gap-2 rounded-lg bg-primary px-3.5 text-[12px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40">
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Guardar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-start gap-2 rounded-lg bg-s-info px-3 py-2 text-[12px] text-s-info-fg">
        <Banknote className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        La pensión es la que se cobra al generar la facturación de cada mes. El recargo por mora se aplica cuando la fecha límite ya pasó.
      </div>
    </Modal>
  );
}
