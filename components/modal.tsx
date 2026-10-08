"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

/** Modal sencillo con backdrop. Cierra con Escape o clic fuera. */
export function Modal({ open, onClose, title, subtitle, children, width = 460 }: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-[8vh]" onClick={onClose}>
      <div className="flex w-full flex-col rounded-2xl border border-line bg-card shadow-2xl" style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-bold text-ink">{title}</h2>
            {subtitle && <p className="text-xs text-subtle">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-surface hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-4 p-5">{children}</div>
      </div>
    </div>
  );
}

/** Campo de formulario etiquetado. */
export function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-ink">{label}</span>
      {children}
    </label>
  );
}

export const inputCls = "h-[42px] rounded-lg border border-line bg-card px-3.5 text-[13px] text-ink outline-none transition-shadow focus:ring-2 focus:ring-primary/40 placeholder:text-muted";
