"use client";

import { useState } from "react";
import { Bell, GraduationCap, Wallet, TriangleAlert, MailCheck, type LucideIcon } from "lucide-react";
import { useDismiss } from "@/components/use-dismiss";

type Notif = { icon: LucideIcon; tone: string; title: string; sub: string; time: string; unread?: boolean };

const NOTIFS: Notif[] = [
  { icon: TriangleAlert, tone: "bg-s-error text-s-error-fg", title: "7 docentes sin subir notas", sub: "Cierre del Periodo 2 vence hoy 18:00", time: "12 min", unread: true },
  { icon: Wallet, tone: "bg-s-warning text-s-warning-fg", title: "Cartera 30+ días", sub: "63 familias · $ 142,5 M en mora", time: "1 h", unread: true },
  { icon: GraduationCap, tone: "bg-s-info text-s-info-fg", title: "Plan de refuerzo Química 11°A", sub: "7 estudiantes bajo 3.0", time: "2 h", unread: true },
  { icon: MailCheck, tone: "bg-s-success text-s-success-fg", title: "Circular enviada a 432 acudientes", sub: "Convivencia escolar · Email + App", time: "5 h" },
];

export function Notifications() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(NOTIFS);
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));
  const unread = items.filter((n) => n.unread).length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notificaciones"
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-surface text-ink transition-colors hover:bg-line-soft"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute right-2 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border-[1.5px] border-card bg-danger px-0.5 text-[9px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-40 flex w-[340px] flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-sm font-semibold text-ink">Notificaciones</span>
            {unread > 0 && (
              <button
                onClick={() => setItems((s) => s.map((n) => ({ ...n, unread: false })))}
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>
          <div className="flex max-h-[360px] flex-col overflow-y-auto">
            {items.map((n, i) => {
              const Icon = n.icon;
              return (
                <div
                  key={i}
                  className={`flex gap-3 px-4 py-3 ${i < items.length - 1 ? "border-b border-line" : ""} ${
                    n.unread ? "bg-surface/40" : ""
                  }`}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${n.tone}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-ink">{n.title}</span>
                      <span className="shrink-0 text-[10px] text-subtle">{n.time}</span>
                    </div>
                    <span className="text-[11px] leading-relaxed text-subtle">{n.sub}</span>
                  </div>
                  {n.unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </div>
              );
            })}
          </div>
          <button className="border-t border-line py-2.5 text-center text-xs font-semibold text-primary hover:bg-surface/50">
            Ver todas las notificaciones
          </button>
        </div>
      )}
    </div>
  );
}
