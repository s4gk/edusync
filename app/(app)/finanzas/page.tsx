import {
  Banknote,
  Download,
  Megaphone,
  TrendingUp,
  ArrowUpRight,
  ArrowRight,
  Check,
  CircleAlert,
  X,
  MoreHorizontal,
  SlidersHorizontal,
} from "lucide-react";

/* ---------------- datos ---------------- */

type Tone = "success" | "error" | "warning" | "info" | "primary";

const CHIP: Record<Tone, string> = {
  success: "bg-s-success text-s-success-fg",
  error: "bg-s-error text-s-error-fg",
  warning: "bg-s-warning text-s-warning-fg",
  info: "bg-s-info text-s-info-fg",
  primary: "bg-primary text-white",
};

const KPIS = [
  { label: "Cartera total", value: "$ 142,5 M", chip: "+6.4%", chipTone: "warning" as Tone, spark: "bg-primary", trend: TrendingUp },
  { label: "Vencida 30+", value: "$ 64,2 M", chip: "+12 familias", chipTone: "error" as Tone, spark: "bg-rose-500", trend: ArrowUpRight, accent: true },
  { label: "Recaudo del mes", value: "$ 318,7 M", chip: "+8.2%", chipTone: "success" as Tone, spark: "bg-emerald-500", trend: TrendingUp },
  { label: "Tasa de cobro", value: "92.3%", chip: "+1.1%", chipTone: "info" as Tone, spark: "bg-blue-500", trend: TrendingUp },
];

const AGING = [
  { label: "Al día", value: "$ 78,3 M", h: 0.95, color: "bg-emerald-400" },
  { label: "1–15 d", value: "$ 22,1 M", h: 0.42, color: "bg-blue-400" },
  { label: "16–30 d", value: "$ 14,6 M", h: 0.31, color: "bg-amber-300" },
  { label: "31–60 d", value: "$ 11,2 M", h: 0.25, color: "bg-orange-400" },
  { label: "61–90 d", value: "$ 8,4 M", h: 0.19, color: "bg-rose-400" },
  { label: "+90 d", value: "$ 7,9 M", h: 0.17, color: "bg-rose-700" },
];

const LEGEND = [
  { label: "Total cartera", value: "$ 142,5 M" },
  { label: "Mora promedio", value: "38 días" },
  { label: "Familias al día", value: "826 / 1.184" },
];

const PROMESAS = [
  { color: "#7C3AED", initials: "LC", name: "Familia López Castaño", sub: "Acuerdo · 2 cuotas", amount: "$ 640.000", chip: "Vence 28 may", chipTone: "warning" as Tone },
  { color: "#0EA5E9", initials: "RP", name: "Familia Rojas Pulido", sub: "Acuerdo · 3 cuotas", amount: "$ 1,20 M", chip: "Vence 30 may", chipTone: "info" as Tone },
  { color: "#10B981", initials: "MV", name: "Familia Méndez Vargas", sub: "Acuerdo · 1 cuota", amount: "$ 215.000", chip: "Al día", chipTone: "success" as Tone },
  { color: "#F59E0B", initials: "GR", name: "Familia Gil Reyes", sub: "Acuerdo · 4 cuotas", amount: "$ 2,10 M", chip: "Vence 02 jun", chipTone: "info" as Tone },
  { color: "#EC4899", initials: "TQ", name: "Familia Torres Quintero", sub: "Acuerdo · 2 cuotas", amount: "$ 480.000", chip: "Atrasada", chipTone: "error" as Tone },
];

const PAY_TABS = [
  { label: "Recibidos", active: true },
  { label: "Pendientes" },
  { label: "Devueltos" },
];

type EstadoPago = "Confirmado" | "Pendiente" | "Devuelto";

const ESTADO: Record<EstadoPago, { chip: string; icon: typeof Check }> = {
  Confirmado: { chip: "bg-s-success text-s-success-fg", icon: Check },
  Pendiente: { chip: "bg-s-warning text-s-warning-fg", icon: CircleAlert },
  Devuelto: { chip: "bg-s-error text-s-error-fg", icon: X },
};

type Pago = {
  fecha: string;
  color: string;
  initials: string;
  familia: string;
  estudiante: string;
  concepto: string;
  conceptoTone: Tone;
  canal: string;
  valor: string;
  estado: EstadoPago;
};

const PAGOS: Pago[] = [
  { fecha: "23/05 · 08:12", color: "#7C3AED", initials: "GC", familia: "Familia Gómez Castaño", estudiante: "Mariana G. · 7°B", concepto: "Pensión mayo", conceptoTone: "info", canal: "Bancolombia PSE", valor: "$ 480.000", estado: "Confirmado" },
  { fecha: "23/05 · 07:54", color: "#0EA5E9", initials: "RP", familia: "Familia Rojas Patiño", estudiante: "Andrés R. · 9°A", concepto: "Matrícula 2026", conceptoTone: "primary", canal: "Davivienda", valor: "$ 2.350.000", estado: "Confirmado" },
  { fecha: "23/05 · 07:21", color: "#10B981", initials: "MV", familia: "Familia Méndez Vargas", estudiante: "Sofía M. · 3°B", concepto: "Transporte", conceptoTone: "warning", canal: "Bancolombia PSE", valor: "$ 215.000", estado: "Pendiente" },
  { fecha: "22/05 · 18:42", color: "#F59E0B", initials: "SO", familia: "Familia Suárez Ortiz", estudiante: "Tomás S. · 11°A", concepto: "Restaurante", conceptoTone: "success", canal: "Nequi", valor: "$ 86.000", estado: "Confirmado" },
  { fecha: "22/05 · 16:08", color: "#EC4899", initials: "TQ", familia: "Familia Torres Quintero", estudiante: "Camila T. · 5°C", concepto: "Pensión mayo", conceptoTone: "info", canal: "Bancolombia PSE", valor: "$ 480.000", estado: "Devuelto" },
  { fecha: "22/05 · 11:33", color: "#6366F1", initials: "CJ", familia: "Familia Castro Jiménez", estudiante: "Daniel C. · 8°A", concepto: "Matrícula 2026", conceptoTone: "primary", canal: "Davivienda", valor: "$ 1.840.000", estado: "Pendiente" },
];

/* ---------------- página ---------------- */

export default function FinanzasPage() {
  return (
    <div className="flex flex-col gap-5 px-7 py-8">
      {/* ====== header ====== */}
      <div className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold tracking-[0.18em] text-primary">FINANZAS</span>
          <h1 className="text-[28px] font-bold text-ink">Cartera y cobros</h1>
          <p className="text-[13px] text-subtle">Saldo total por cobrar · actualizado hoy 08:14</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="flex h-[38px] items-center gap-2 rounded-[10px] border border-line px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">
            <Banknote className="h-4 w-4" />
            Conciliar pagos PSE
          </button>
          <button className="flex h-[38px] items-center gap-2 rounded-[10px] border border-line px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">
            <Download className="h-4 w-4" />
            Exportar cartera
          </button>
          <button className="flex h-[38px] items-center gap-2 rounded-[10px] bg-primary px-3.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90">
            <Megaphone className="h-4 w-4" />
            Iniciar gestión de cobro
          </button>
        </div>
      </div>

      {/* ====== KPI strip ====== */}
      <div className="flex gap-3">
        {KPIS.map((k) => {
          const Trend = k.trend;
          return (
            <div key={k.label} className="relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-card">
              {k.accent && <span className="h-[3px] w-full bg-danger" />}
              <div className="flex flex-1 flex-col gap-2.5 p-[18px]">
                <span className="text-xs font-medium text-subtle">{k.label}</span>
                <span className="text-[28px] font-bold leading-none text-ink">{k.value}</span>
                <div className="flex items-center justify-between">
                  <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${CHIP[k.chipTone]}`}>
                    <Trend className="h-3 w-3" />
                    {k.chip}
                  </span>
                  <div className="flex h-[18px] items-end gap-[3px]">
                    {[0.5, 0.75, 0.95].map((o, i) => (
                      <span key={i} className={`w-2.5 rounded-sm ${k.spark}`} style={{ height: 10 + i * 4, opacity: o }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ====== aging + promesas ====== */}
      <div className="flex flex-col gap-5 xl:flex-row">
        {/* aging */}
        <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-line bg-card p-5">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-0.5">
              <h3 className="text-sm font-semibold text-ink">Cartera por antigüedad</h3>
              <p className="text-xs text-subtle">Distribución de saldos por días de mora</p>
            </div>
            <span className="rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-semibold text-subtle">
              Mayo 2025
            </span>
          </div>
          <div className="flex gap-5">
            {/* barras */}
            <div className="flex flex-1 items-end gap-2.5" style={{ height: 240 }}>
              {AGING.map((a) => (
                <div key={a.label} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-[11px] font-bold text-ink">{a.value}</span>
                  <div className="flex w-full flex-1 items-end">
                    <span className={`w-full rounded-t-md ${a.color}`} style={{ height: `${a.h * 100}%` }} />
                  </div>
                  <span className="text-[11px] text-subtle">{a.label}</span>
                </div>
              ))}
            </div>
            {/* leyenda */}
            <div className="flex w-40 flex-col gap-4 border-l border-line pl-4 pt-2">
              {LEGEND.map((l) => (
                <div key={l.label} className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-subtle">{l.label}</span>
                  <span className="text-lg font-bold text-ink">{l.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* promesas */}
        <div className="flex w-full flex-col gap-3.5 rounded-2xl border border-line bg-card p-5 xl:w-[360px] xl:shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">Promesas de pago activas</h3>
            <span className="rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-bold text-primary">
              18 activas
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {PROMESAS.map((p) => (
              <div key={p.name} className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-surface/60">
                <span
                  className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{ background: p.color }}
                >
                  {p.initials}
                </span>
                <div className="flex flex-1 flex-col">
                  <span className="text-[13px] font-semibold text-ink">{p.name}</span>
                  <span className="text-[11px] text-subtle">{p.sub}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[13px] font-bold text-ink">{p.amount}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${CHIP[p.chipTone]}`}>
                    {p.chip}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button className="flex h-[38px] items-center justify-center gap-2 rounded-[10px] border border-line text-[13px] font-semibold text-ink transition-colors hover:bg-surface">
            Ver todas las promesas
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ====== pagos recientes ====== */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-semibold text-ink">Pagos recientes</h3>
            <span className="text-xs text-subtle">· 47 hoy · $ 12,8 M</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-[10px] bg-surface p-1">
              {PAY_TABS.map((t) => (
                <button
                  key={t.label}
                  className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                    t.active ? "bg-card font-semibold text-ink shadow-card" : "font-medium text-subtle hover:text-ink"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <button className="flex h-8 w-9 items-center justify-center rounded-lg border border-line text-ink transition-colors hover:bg-surface">
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* header columnas */}
        <div className="flex items-center gap-3 border-b border-line bg-surface px-3.5 py-3">
          <span className="w-[120px] text-[11px] font-bold tracking-[0.1em] text-subtle">FECHA</span>
          <span className="flex-1 text-[11px] font-bold tracking-[0.1em] text-subtle">FAMILIA</span>
          <span className="w-[150px] text-[11px] font-bold tracking-[0.1em] text-subtle">CONCEPTO</span>
          <span className="w-[150px] text-[11px] font-bold tracking-[0.1em] text-subtle">CANAL</span>
          <span className="w-[110px] text-right text-[11px] font-bold tracking-[0.1em] text-subtle">VALOR</span>
          <span className="w-[120px] text-[11px] font-bold tracking-[0.1em] text-subtle">ESTADO</span>
          <span className="w-5" />
        </div>

        {/* filas */}
        {PAGOS.map((p, i) => {
          const est = ESTADO[p.estado];
          const EstIcon = est.icon;
          return (
            <div
              key={i}
              className={`flex items-center gap-3 px-3.5 py-3.5 transition-colors hover:bg-surface/50 ${
                i < PAGOS.length - 1 ? "border-b border-line" : ""
              }`}
            >
              <span className="w-[120px] text-xs text-subtle">{p.fecha}</span>
              <div className="flex flex-1 items-center gap-2.5">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{ background: p.color }}
                >
                  {p.initials}
                </span>
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-ink">{p.familia}</span>
                  <span className="text-[11px] text-subtle">{p.estudiante}</span>
                </div>
              </div>
              <div className="w-[150px]">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${CHIP[p.conceptoTone]}`}>
                  {p.concepto}
                </span>
              </div>
              <span className="w-[150px] text-xs font-medium text-ink">{p.canal}</span>
              <span className="w-[110px] text-right text-sm font-bold text-ink">{p.valor}</span>
              <div className="w-[120px]">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${est.chip}`}>
                  <EstIcon className="h-2.5 w-2.5" />
                  {p.estado}
                </span>
              </div>
              <button className="flex w-5 items-center justify-center text-subtle hover:text-ink">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
