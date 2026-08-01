"use client";

import { useCallback, useEffect, useState } from "react";
import { Lock, LockOpen, Loader2, TriangleAlert, CheckCircle2, CalendarClock, ShieldAlert } from "lucide-react";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { useAuth } from "@/components/auth-context";
import { getCurrentYear } from "@/lib/academic";
import { Modal, FormField, inputCls } from "@/components/modal";

type Period = {
  id: string; name: string; periodNumber: number;
  weightPercent: string | number; startDate?: string; endDate?: string;
  isClosed: boolean; closedAt?: string | null;
};
type Issue = { groupName: string; subjectName: string; teacherName: string; achievementName?: string; activityName?: string; missing: number };
type Validation = { canClose: boolean; totalIssues: number; issues: Issue[] };

const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "—");

export default function PeriodosPage() {
  const { user } = useAuth();
  const role = user?.role ?? "";
  const canClose = ["SUPER_ADMIN", "RECTOR", "COORDINATOR_ACADEMIC"].includes(role);
  const canReopen = ["SUPER_ADMIN", "RECTOR"].includes(role);

  const [year, setYear] = useState<{ id: string; year: number } | null>(null);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // cerrar
  const [closeFor, setCloseFor] = useState<Period | null>(null);
  const [validation, setValidation] = useState<Validation | null>(null);
  const [validating, setValidating] = useState(false);
  const [closing, setClosing] = useState(false);
  const [confirmAnyway, setConfirmAnyway] = useState(false);

  // reabrir
  const [reopenFor, setReopenFor] = useState<Period | null>(null);
  const [justification, setJustification] = useState("");
  const [reopening, setReopening] = useState(false);

  const loadPeriods = useCallback(async (yid: string) => {
    const ps = await apiGet<Period[]>(`/academic/years/${yid}/periods`);
    setPeriods([...ps].sort((a, b) => a.periodNumber - b.periodNumber));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const y = await getCurrentYear();
        if (!y) throw new Error("Sin año lectivo.");
        setYear(y);
        await loadPeriods(y.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo cargar.");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadPeriods]);

  const openClose = async (p: Period) => {
    setCloseFor(p); setValidation(null); setConfirmAnyway(false); setValidating(true);
    try {
      const v = await apiGet<Validation>(`/grades/validate-close?academicYearId=${year!.id}&periodNumber=${p.periodNumber}`);
      setValidation(v);
    } catch {
      setValidation({ canClose: true, totalIssues: 0, issues: [] }); // si la validación falla, no bloquea
    } finally {
      setValidating(false);
    }
  };

  const doClose = async () => {
    if (!closeFor) return;
    setClosing(true); setError(null);
    try {
      await apiPost(`/academic/periods/${closeFor.id}/close`, {});
      await loadPeriods(year!.id);
      setCloseFor(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo cerrar el periodo.");
    } finally {
      setClosing(false);
    }
  };

  const doReopen = async () => {
    if (!reopenFor || !justification.trim()) return;
    setReopening(true); setError(null);
    try {
      await apiPost(`/academic/periods/${reopenFor.id}/reopen`, { justification: justification.trim() });
      await loadPeriods(year!.id);
      setReopenFor(null); setJustification("");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo reabrir el periodo.");
    } finally {
      setReopening(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center gap-2 px-8 py-24 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Cargando periodos…</div>;
  }

  return (
    <div className="flex flex-col gap-5 px-8 py-7">
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-bold tracking-[0.18em] text-primary">ACADÉMICO</span>
        <h1 className="text-[28px] font-bold -tracking-[0.02em] text-ink">Cierre de periodo</h1>
        <p className="text-[13px] text-subtle">{year ? `Año ${year.year} — cerrar un periodo bloquea la edición de notas y asistencia.` : ""}</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-s-error px-3.5 py-2.5 text-[13px] font-medium text-s-error-fg">
          <TriangleAlert className="h-4 w-4" /> {error}
          <button onClick={() => setError(null)} className="ml-auto text-xs underline">cerrar</button>
        </div>
      )}

      {periods.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-card py-16 text-center text-sm text-subtle">
          <CalendarClock className="h-6 w-6 text-muted" /> No hay periodos definidos para este año.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {periods.map((p) => (
            <div key={p.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-5">
              <div className="flex items-center justify-between">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-extrabold ${p.isClosed ? "bg-surface text-subtle" : "bg-primary-tint text-primary"}`}>P{p.periodNumber}</span>
                {p.isClosed ? (
                  <span className="flex items-center gap-1 rounded-full bg-surface px-2 py-1 text-[10px] font-bold text-subtle"><Lock className="h-3 w-3" /> Cerrado</span>
                ) : (
                  <span className="flex items-center gap-1 rounded-full bg-s-success px-2 py-1 text-[10px] font-bold text-s-success-fg"><LockOpen className="h-3 w-3" /> Abierto</span>
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[15px] font-bold text-ink">{p.name}</span>
                <span className="text-[11px] text-subtle">Peso {Number(p.weightPercent) || 0}% · {fmtDate(p.startDate)} – {fmtDate(p.endDate)}</span>
                {p.isClosed && p.closedAt && <span className="text-[11px] text-subtle">Cerrado el {fmtDate(p.closedAt)}</span>}
              </div>
              {p.isClosed ? (
                canReopen ? (
                  <button onClick={() => { setReopenFor(p); setJustification(""); }} className="flex h-9 items-center justify-center gap-2 rounded-lg border border-line text-[13px] font-semibold text-ink transition-colors hover:bg-surface">
                    <LockOpen className="h-3.5 w-3.5" /> Reabrir
                  </button>
                ) : (
                  <span className="text-[11px] text-subtle">Solo Rectoría puede reabrir.</span>
                )
              ) : canClose ? (
                <button onClick={() => openClose(p)} className="flex h-9 items-center justify-center gap-2 rounded-lg bg-primary text-[13px] font-semibold text-white transition-opacity hover:opacity-90">
                  <Lock className="h-3.5 w-3.5" /> Validar y cerrar
                </button>
              ) : (
                <span className="text-[11px] text-subtle">Solo Coordinación/Rectoría puede cerrar.</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ===== modal cerrar (con validación previa) ===== */}
      <Modal
        open={!!closeFor}
        onClose={() => setCloseFor(null)}
        title={`Cerrar ${closeFor?.name ?? ""}`}
        subtitle="Validación previa: notas faltantes por actividad."
        width={620}
      >
        {validating ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Validando notas del periodo…</div>
        ) : validation?.canClose ? (
          <div className="flex items-center gap-2.5 rounded-xl bg-s-success px-4 py-3 text-[13px] font-medium text-s-success-fg">
            <CheckCircle2 className="h-5 w-5 shrink-0" /> Todas las actividades tienen notas registradas. El periodo está listo para cerrar.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 rounded-xl bg-s-warning px-4 py-3 text-[13px] font-medium text-s-warning-fg">
              <ShieldAlert className="h-5 w-5 shrink-0" /> Hay {validation?.totalIssues} actividades con notas incompletas.
            </div>
            <div className="flex max-h-[34vh] flex-col gap-1.5 overflow-y-auto">
              {validation?.issues.map((it, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-line bg-card px-3 py-2 text-[12px]">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-semibold text-ink">{it.groupName} · {it.subjectName}</span>
                    <span className="truncate text-subtle">{it.activityName ?? it.achievementName} — {it.teacherName}</span>
                  </div>
                  <span className="shrink-0 rounded-full bg-s-error px-2 py-0.5 text-[11px] font-bold text-s-error-fg">faltan {it.missing}</span>
                </div>
              ))}
            </div>
            <label className="flex items-center gap-2 text-[12px] text-ink">
              <input type="checkbox" checked={confirmAnyway} onChange={(e) => setConfirmAnyway(e.target.checked)} />
              Entiendo y deseo cerrar el periodo de todas formas.
            </label>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={() => setCloseFor(null)} className="h-9 rounded-lg border border-line px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">Cancelar</button>
          <button
            onClick={doClose}
            disabled={closing || validating || (!validation?.canClose && !confirmAnyway)}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {closing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />} Cerrar periodo
          </button>
        </div>
      </Modal>

      {/* ===== modal reabrir ===== */}
      <Modal
        open={!!reopenFor}
        onClose={() => setReopenFor(null)}
        title={`Reabrir ${reopenFor?.name ?? ""}`}
        subtitle="La reapertura es excepcional y queda registrada en auditoría."
      >
        <FormField label="Justificación">
          <textarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Motivo de la reapertura…"
            rows={3}
            className={`${inputCls} h-auto py-2.5`}
            autoFocus
          />
        </FormField>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={() => setReopenFor(null)} className="h-9 rounded-lg border border-line px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">Cancelar</button>
          <button onClick={doReopen} disabled={reopening || !justification.trim()} className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40">
            {reopening ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LockOpen className="h-3.5 w-3.5" />} Reabrir periodo
          </button>
        </div>
      </Modal>
    </div>
  );
}
