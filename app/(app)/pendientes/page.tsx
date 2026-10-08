"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2, Lock, ShieldAlert, BellRing, CheckCircle2, ArrowRight, TriangleAlert, ClipboardCheck,
} from "lucide-react";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { getCurrentYear, initials } from "@/lib/academic";

type Period = { id: string; name: string; periodNumber: number; isClosed: boolean };
type Validation = { canClose: boolean; totalIssues: number; issues: any[] };
type AtRisk = { studentId: string; name: string; gradeGroup?: { name?: string }; bajoCount?: number };

export default function PendientesPage() {
  const [loading, setLoading] = useState(true);
  const [openPeriods, setOpenPeriods] = useState<Period[]>([]);
  const [currentP, setCurrentP] = useState<number | null>(null);
  const [validation, setValidation] = useState<Validation | null>(null);
  const [atRisk, setAtRisk] = useState<AtRisk[]>([]);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [runningAlerts, setRunningAlerts] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const y = await getCurrentYear();
        if (!y) return;
        const periods = await apiGet<Period[]>(`/academic/years/${y.id}/periods`);
        const open = periods.filter((p) => !p.isClosed).sort((a, b) => a.periodNumber - b.periodNumber);
        setOpenPeriods(open);
        const pn = open[0]?.periodNumber ?? periods[0]?.periodNumber ?? 1;
        setCurrentP(pn);
        await Promise.all([
          apiGet<Validation>(`/grades/validate-close?academicYearId=${y.id}&periodNumber=${pn}`).then(setValidation).catch(() => {}),
          apiGet<AtRisk[]>(`/reports/at-risk?academicYearId=${y.id}&period=P${pn}`).then(setAtRisk).catch(() => {}),
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const runAlerts = async () => {
    setRunningAlerts(true); setAlertMsg(null);
    try {
      const r = await apiPost<{ created: number }>("/notifications/run-alerts", {});
      setAlertMsg(r.created > 0 ? `Se enviaron ${r.created} alertas a los acudientes.` : "Sin alertas nuevas: no hay estudiantes que cumplan las reglas ahora mismo.");
    } catch (e) {
      setAlertMsg(e instanceof ApiError ? e.message : "No se pudo generar las alertas.");
    } finally {
      setRunningAlerts(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center gap-2 px-8 py-24 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Cargando pendientes…</div>;

  return (
    <div className="flex flex-col gap-5 px-8 py-7">
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-bold tracking-[0.18em] text-primary">HOY</span>
        <h1 className="text-[28px] font-bold -tracking-[0.02em] text-ink">Lo que te falta hoy</h1>
        <p className="text-[13px] text-subtle">Pendientes accionables del colegio.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* notas faltantes del periodo */}
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-5">
          <span className="flex items-center gap-2 text-[13px] font-bold text-ink"><ClipboardCheck className="h-4 w-4 text-primary" /> Notas del periodo {currentP}</span>
          {validation == null ? (
            <span className="text-[13px] text-subtle">No disponible.</span>
          ) : validation.canClose ? (
            <span className="flex items-center gap-2 text-[13px] text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Todas las actividades tienen notas. Listo para cerrar.</span>
          ) : (
            <>
              <span className="flex items-center gap-2 text-[13px] text-amber-600"><TriangleAlert className="h-4 w-4" /> {validation.totalIssues} actividades con notas incompletas.</span>
              <Link href="/periodos" className="flex w-fit items-center gap-1 text-[12px] font-semibold text-primary">Ir a cerrar periodo <ArrowRight className="h-3 w-3" /></Link>
            </>
          )}
        </div>

        {/* periodos abiertos */}
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-5">
          <span className="flex items-center gap-2 text-[13px] font-bold text-ink"><Lock className="h-4 w-4 text-primary" /> Periodos abiertos</span>
          {openPeriods.length === 0 ? (
            <span className="text-[13px] text-subtle">Todos los periodos están cerrados.</span>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5">
                {openPeriods.map((p) => <span key={p.id} className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-ink">{p.name}</span>)}
              </div>
              <Link href="/periodos" className="flex w-fit items-center gap-1 text-[12px] font-semibold text-primary">Gestionar cierres <ArrowRight className="h-3 w-3" /></Link>
            </>
          )}
        </div>

        {/* estudiantes en riesgo + alertas */}
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-[13px] font-bold text-ink"><ShieldAlert className="h-4 w-4 text-rose-600" /> Estudiantes en riesgo (periodo {currentP}) · {atRisk.length}</span>
            <button onClick={runAlerts} disabled={runningAlerts} className="flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50">
              {runningAlerts ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BellRing className="h-3.5 w-3.5" />} Generar alertas a acudientes
            </button>
          </div>
          {alertMsg && <p className="rounded-lg bg-surface px-3 py-2 text-[12px] text-ink">{alertMsg}</p>}
          {atRisk.length === 0 ? (
            <span className="text-[13px] text-subtle">Ningún estudiante con 2+ áreas en bajo este periodo. 🎉</span>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {atRisk.map((s, i) => (
                <Link key={s.studentId} href={`/estudiantes/${s.studentId}`} className="flex items-center gap-2.5 rounded-xl border border-line px-3 py-2 transition-colors hover:border-primary/40">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-s-error text-[11px] font-bold text-s-error-fg">{initials(...s.name.split(" "))}</span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[13px] font-medium text-ink">{s.name}</span>
                    <span className="text-[11px] text-subtle">{s.gradeGroup?.name ?? ""}{s.bajoCount ? ` · ${s.bajoCount} áreas` : ""}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
          <p className="text-[11px] text-subtle">Las alertas crean notificaciones in-app para el acudiente principal (bajo rendimiento e inasistencia). Tip: puede agendarse para correr automático.</p>
        </div>
      </div>
    </div>
  );
}
