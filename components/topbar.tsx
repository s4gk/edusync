"use client";

import { PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSidebar } from "@/components/sidebar-context";
import { useCommandMenu } from "@/components/command-menu";
import { Breadcrumb } from "@/components/breadcrumb";
import { Notifications } from "@/components/notifications";

export function Topbar() {
  const { collapsed, toggle } = useSidebar();
  const cmd = useCommandMenu();

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
        <Breadcrumb />
      </div>

      {/* spacer — empuja el cluster a la derecha */}
      <div className="flex-1" />

      {/* right cluster */}
      <div className="flex items-center gap-2">
        {/* búsqueda ancha, alineada a la derecha */}
        <button
          onClick={cmd.open}
          className="flex h-10 w-64 items-center gap-2.5 rounded-full border border-line bg-surface px-4 text-subtle transition-colors hover:bg-line-soft lg:w-80"
        >
          <Search className="h-[18px] w-[18px] shrink-0" />
          <span className="truncate text-sm">Buscar estudiantes, profesores…</span>
          <kbd className="ml-auto hidden shrink-0 rounded-md border border-line bg-card px-1.5 py-0.5 text-[11px] font-semibold sm:inline">
            ⌘K
          </kbd>
        </button>

        <ThemeToggle />

        <Notifications />
      </div>
    </header>
  );
}
