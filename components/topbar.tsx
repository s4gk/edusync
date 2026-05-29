"use client";

import {
  PanelLeftClose,
  ChevronRight,
  Search,
  ChevronDown,
  Bell,
  LifeBuoy,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function Topbar() {
  return (
    <header className="flex h-[68px] shrink-0 items-center gap-4 border-b border-line bg-card px-6">
      {/* left: collapse + breadcrumbs */}
      <div className="flex items-center gap-2.5">
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink transition-colors hover:bg-line-soft">
          <PanelLeftClose className="h-4 w-4" />
        </button>
        <span className="h-6 w-px bg-line" />
        <nav className="flex items-center gap-1.5 text-sm">
          <span className="text-subtle">Inicio</span>
          <ChevronRight className="h-4 w-4 text-line" />
          <span className="text-subtle">Dashboard</span>
          <ChevronRight className="h-4 w-4 text-line" />
          <span className="font-semibold text-ink">Resumen general</span>
        </nav>
      </div>

      {/* center: search */}
      <div className="flex flex-1 justify-center px-4">
        <div className="flex h-10 w-full max-w-xl items-center gap-2.5 rounded-full border border-line bg-surface px-4">
          <Search className="h-[18px] w-[18px] text-subtle" />
          <input
            placeholder="Buscar estudiantes, profesores, documentos…"
            className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-subtle"
          />
          <kbd className="rounded-md border border-line bg-card px-1.5 py-0.5 text-[11px] font-semibold text-subtle">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* right cluster */}
      <div className="flex items-center gap-1.5">
        <button className="flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 transition-colors hover:bg-surface">
          <span className="text-xs font-medium text-ink">Año lectivo 2025</span>
          <ChevronDown className="h-3.5 w-3.5 text-subtle" />
        </button>
        <ThemeToggle />
        <button className="relative flex h-10 w-10 items-center justify-center rounded-full bg-surface text-ink transition-colors hover:bg-line-soft">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2.5 top-2 h-2.5 w-2.5 rounded-full border-[1.5px] border-card bg-danger" />
        </button>
        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-ink transition-colors hover:bg-line-soft">
          <LifeBuoy className="h-4 w-4" />
        </button>
        <span className="mx-1 h-6 w-px bg-line" />
        <button className="flex items-center gap-2 rounded-full py-0.5 pl-0.5 pr-1 transition-colors hover:bg-surface">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line-soft bg-line-soft text-xs font-medium text-ink">
            MR
          </span>
          <span className="flex flex-col items-start">
            <span className="text-xs font-semibold text-ink">María Rojas</span>
            <span className="text-[10px] font-medium text-subtle">Rectora</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-subtle" />
        </button>
      </div>
    </header>
  );
}
