"use client";

import { useState } from "react";
import { Pencil, KeyRound, Power, PowerOff, Loader2, Copy, Check } from "lucide-react";
import { apiPost, apiPut } from "@/lib/api";

/** Botones de la ficha: Editar + acciones de cuenta (reset contraseña, activar/inactivar). */
export function PersonActions({
  userId, status, onEdit, onChanged,
}: {
  userId: string;
  status?: string;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [temp, setTemp] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const isActive = (status ?? "ACTIVE") === "ACTIVE";

  const reset = async () => {
    setBusy("reset"); setErr(null);
    try {
      const r = await apiPost<{ temporaryPassword?: string }>(`/users/${userId}/reset-password`);
      setTemp(r.temporaryPassword ?? "—");
    } catch (e) { setErr(e instanceof Error ? e.message : "No se pudo restablecer."); }
    finally { setBusy(null); }
  };

  const toggle = async () => {
    setBusy("toggle"); setErr(null);
    try {
      await apiPut(`/users/${userId}`, { status: isActive ? "INACTIVE" : "ACTIVE" });
      onChanged();
    } catch (e) { setErr(e instanceof Error ? e.message : "No se pudo cambiar el estado."); }
    finally { setBusy(null); }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button onClick={onEdit} className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90">
          <Pencil className="h-3.5 w-3.5" /> Editar
        </button>
        <button onClick={reset} disabled={busy === "reset"} className="flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] font-semibold text-ink transition-colors hover:bg-surface disabled:opacity-50">
          {busy === "reset" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />} Restablecer contraseña
        </button>
        <button onClick={toggle} disabled={busy === "toggle"} className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-semibold transition-colors disabled:opacity-50 ${isActive ? "border-line text-danger hover:bg-s-error" : "border-line text-emerald-600 hover:bg-s-success"}`}>
          {busy === "toggle" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isActive ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
          {isActive ? "Inactivar" : "Activar"}
        </button>
      </div>
      {err && <span className="text-[11px] text-s-error-fg">{err}</span>}
      {temp && (
        <div className="flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-2">
          <KeyRound className="h-3.5 w-3.5 text-subtle" />
          <span className="text-[11px] text-subtle">Nueva contraseña:</span>
          <code className="text-[13px] font-bold text-ink">{temp}</code>
          <button onClick={() => navigator.clipboard?.writeText(temp)} className="text-subtle hover:text-ink"><Copy className="h-3.5 w-3.5" /></button>
          <button onClick={() => setTemp(null)} className="text-subtle hover:text-ink"><Check className="h-3.5 w-3.5" /></button>
        </div>
      )}
    </div>
  );
}
