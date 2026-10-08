/* ============================================================
   Tesorería — tarifas, facturación y recaudo.

   El backend ya tenía todo esto expuesto; la pantalla solo leía. Aquí quedan
   centralizadas las operaciones que hace contabilidad/secretaría a diario:
   fijar tarifas por grado, generar la facturación del mes y registrar pagos
   con número de recibo.
   ============================================================ */
import { apiGet, apiPost } from "@/lib/api";

export type InvoiceStatus = "PENDING" | "PAID" | "OVERDUE" | "IN_ARREARS";

export type Invoice = {
  id: string;
  amount: string;
  lateFee?: string | null;
  month: number;
  status: InvoiceStatus;
  dueDate: string;
  student: {
    id?: string;
    gradeGroup?: { name: string; gradeLevel: number } | null;
    user: { firstName: string; lastName: string };
  };
  payment: { receiptNumber: string; paidAt: string; amount: string } | null;
};

export type FinanceSummary = {
  billed: number; collected: number; portfolio: number;
  overdueCount: number; pendingCount: number;
};
export type MonthlyRow = { month: number; billed: number; collected: number; overdue: number };
export type TuitionConfig = {
  id: string; gradeLevel: number;
  enrollmentFee: string | number;
  monthlyFee: string | number;
  lateFeePercent: string | number;
};
export type Paginated<T> = { data: T[]; meta: { total: number; page: number; limit: number; totalPages: number } };

export const MONTHS = [
  "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
export const MONTHS_SHORT = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export const cop = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n || 0);
export const copCompact = (n: number) =>
  `$ ${((n || 0) / 1_000_000).toLocaleString("es-CO", { maximumFractionDigits: 1 })} M`;

/** Total real a cobrar: valor de la factura más la mora acumulada. */
export const invoiceTotal = (inv: Invoice) => Number(inv.amount) + Number(inv.lateFee ?? 0);

export const STATUS_META: Record<InvoiceStatus, { label: string; chip: string }> = {
  PAID: { label: "Pagada", chip: "bg-s-success text-s-success-fg" },
  PENDING: { label: "Pendiente", chip: "bg-s-warning text-s-warning-fg" },
  OVERDUE: { label: "Vencida", chip: "bg-s-error text-s-error-fg" },
  IN_ARREARS: { label: "En mora", chip: "bg-s-error text-s-error-fg" },
};

/* ---- lecturas ---- */
export const getSummary = (yearId: string) => apiGet<FinanceSummary>(`/finance/summary/${yearId}`);
export const getMonthly = (yearId: string) => apiGet<MonthlyRow[]>(`/finance/monthly/${yearId}`);
export const getTuition = (yearId: string) => apiGet<TuitionConfig[]>(`/finance/tuition/${yearId}`);

export async function getInvoices(params: {
  academicYearId: string; status?: string; month?: number; page?: number; limit?: number;
}): Promise<Paginated<Invoice>> {
  const q = new URLSearchParams({ academicYearId: params.academicYearId });
  if (params.status) q.set("status", params.status);
  if (params.month) q.set("month", String(params.month));
  q.set("page", String(params.page ?? 1));
  q.set("limit", String(params.limit ?? 50));
  return apiGet<Paginated<Invoice>>(`/finance/invoices?${q}`);
}

/* ---- operaciones ---- */
export const upsertTuition = (input: {
  academicYearId: string; gradeLevel: number;
  enrollmentFee: number; monthlyFee: number; lateFeePercent?: number;
}) => apiPost<TuitionConfig>("/finance/tuition", input);

/** Devuelve cuántas facturas creó y cuántas omitió (ya existían o el grado no
 *  tiene tarifa configurada). */
export const generateInvoices = (input: {
  academicYearId: string; month: number; dueDate: string; gradeGroupId?: string;
}) => apiPost<{ created: number; skipped: number }>("/finance/invoices/generate", input);

export const registerPayment = (input: {
  invoiceId: string; receiptNumber: string; paidAt: string; amount: number;
}) => apiPost("/finance/payments", input);

/** Número de recibo sugerido: REC-<año>-<consecutivo del día>. Es solo una
 *  propuesta editable — cada colegio numera a su manera. */
export function suggestReceipt(seq: number): string {
  const y = new Date().getFullYear();
  return `REC-${y}-${String(seq).padStart(4, "0")}`;
}

/** Descarga un CSV con BOM para que Excel respete las tildes. */
export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // Separador `;`: es el que espera Excel en configuración regional española.
  const csv = rows.map((r) => r.map(esc).join(";")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
