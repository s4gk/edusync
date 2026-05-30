"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EllipsisVertical, User, Settings, LifeBuoy, LogOut } from "lucide-react";
import { useDismiss } from "@/components/use-dismiss";

export function ProfileMenu({ collapsed }: { collapsed: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <div className="relative" ref={ref}>
      {collapsed ? (
        <button
          onClick={() => setOpen((o) => !o)}
          title="María Rojas · Rectora"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line-soft bg-line-soft text-[13px] font-semibold text-ink transition-colors hover:bg-line"
        >
          MR
        </button>
      ) : (
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-2.5 rounded-[10px] p-1 text-left transition-colors hover:bg-surface"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line-soft bg-line-soft text-[13px] font-semibold text-ink">
            MR
          </span>
          <span className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-[13px] font-bold text-ink">María Rojas</span>
            <span className="truncate text-[11px] font-medium text-subtle">Rectora</span>
          </span>
          <EllipsisVertical className="h-4 w-4 shrink-0 text-subtle" />
        </button>
      )}

      {open && (
        <div
          className={`absolute bottom-full z-40 mb-2 flex w-56 flex-col overflow-hidden rounded-xl border border-line bg-card p-1.5 shadow-2xl ${
            collapsed ? "left-0" : "left-1 right-1 w-auto"
          }`}
        >
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-tint text-[13px] font-bold text-primary">MR</span>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-ink">María Rojas</span>
              <span className="text-[11px] text-subtle">maria.rojas@colegiosanmateo.edu.co</span>
            </div>
          </div>
          <div className="my-1 h-px bg-line" />
          <button onClick={() => go("/configuracion")} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-ink transition-colors hover:bg-surface">
            <User className="h-4 w-4 text-subtle" /> Mi perfil
          </button>
          <button onClick={() => go("/configuracion")} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-ink transition-colors hover:bg-surface">
            <Settings className="h-4 w-4 text-subtle" /> Configuración
          </button>
          <button onClick={() => go("/estados")} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-ink transition-colors hover:bg-surface">
            <LifeBuoy className="h-4 w-4 text-subtle" /> Ayuda y soporte
          </button>
          <div className="my-1 h-px bg-line" />
          <button onClick={() => go("/login")} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-danger transition-colors hover:bg-s-error/30">
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
