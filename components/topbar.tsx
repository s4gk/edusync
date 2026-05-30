"use client";

import { PanelLeftClose, PanelLeftOpen, ChevronRight, Search, ChevronDown, Bell } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSidebar } from "@/components/sidebar-context";

export function Topbar() {
  const { collapsed, toggle } = useSidebar();
  return (
    <header className="flex h-[68px] shrink-0 items-center gap-4 border-b border-line bg-card px-6">
      {/* left: collapse + breadcrumbs */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={toggle}
          aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
          title={collapsed ? "Expandir menú" : "Contraer menú"}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink transition-colors hover:bg-line-soft"
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
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

      {/* spacer — centro liberado */}
      <div className="flex-1" />

      {/* right cluster */}
      <div className="flex items-center gap-2">
        {/* buscador compacto */}
        <button className="flex h-9 items-center gap-2 rounded-full border border-line bg-surface pl-3 pr-2 text-subtle transition-colors hover:bg-line-soft">
          <Search className="h-[18px] w-[18px]" />
          <span className="hidden text-sm sm:inline">Buscar</span>
          <kbd className="rounded-md border border-line bg-card px-1.5 py-0.5 text-[11px] font-semibold">
            ⌘K
          </kbd>
        </button>

        <button className="hidden items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 transition-colors hover:bg-surface md:flex">
          <span className="text-xs font-medium text-ink">Año lectivo 2025</span>
          <ChevronDown className="h-3.5 w-3.5 text-subtle" />
        </button>

        <ThemeToggle />

        <button
          aria-label="Notificaciones"
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-surface text-ink transition-colors hover:bg-line-soft"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2.5 top-2 h-2.5 w-2.5 rounded-full border-[1.5px] border-card bg-danger" />
        </button>
      </div>
    </header>
  );
}
