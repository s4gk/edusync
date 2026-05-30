"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  CalendarCheck,
  CalendarRange,
  FileText,
  BookText,
  MessageSquareWarning,
  Wallet,
  Mail,
  Settings,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { useSidebar } from "@/components/sidebar-context";
import { ProfileMenu } from "@/components/profile-menu";

type NavItem = {
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: { text: string; tone: "primary" | "muted" };
  soon?: boolean;
};

type NavGroup = { title: string; items: NavItem[] };

const HOME: NavItem = { label: "Inicio", icon: LayoutDashboard, href: "/dashboard" };

const GROUPS: NavGroup[] = [
  {
    title: "ACADÉMICO",
    items: [
      { label: "Horarios", icon: CalendarRange, href: "/horarios" },
      { label: "Calificaciones", icon: FileText, href: "/calificaciones" },
      { label: "Asistencia", icon: CalendarCheck, href: "/asistencia" },
      { label: "Boletines", icon: BookText, href: "/boletines" },
      { label: "Observaciones", icon: MessageSquareWarning, href: "/observaciones", soon: true },
    ],
  },
  {
    title: "PERSONAS",
    items: [
      { label: "Usuarios", icon: Users, href: "/usuarios" },
      { label: "Matrículas", icon: ClipboardList, href: "/matriculas" },
    ],
  },
  {
    title: "OPERACIÓN",
    items: [
      { label: "Finanzas", icon: Wallet, href: "/finanzas", badge: { text: "12", tone: "primary" } },
      { label: "Comunicaciones", icon: Mail, href: "/comunicaciones", badge: { text: "3", tone: "muted" }, soon: true },
      { label: "Configuración", icon: Settings, href: "/configuracion" },
    ],
  },
];

function NavLink({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  const Icon = item.icon;

  if (collapsed) {
    return (
      <Link
        href={item.href}
        title={item.label}
        className={`relative flex h-10 w-10 items-center justify-center rounded-[10px] transition-colors ${
          active ? "bg-surface" : "hover:bg-surface/60"
        }`}
      >
        {active && <span className="absolute left-0 h-5 w-[3px] rounded-sm bg-primary" />}
        <Icon className={`h-[18px] w-[18px] ${active ? "text-primary" : "text-muted"}`} />
        {item.badge && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
        )}
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      className={`relative flex h-10 items-center gap-3 rounded-[10px] px-3 transition-colors ${
        active ? "bg-surface" : "hover:bg-surface/60"
      }`}
    >
      {active && <span className="absolute left-0 h-5 w-[3px] rounded-sm bg-primary" />}
      <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-primary" : "text-muted"}`} />
      <span className={`flex-1 text-sm ${active ? "font-semibold text-ink" : "font-medium text-muted"}`}>
        {item.label}
      </span>
      {item.soon && (
        <span className="rounded-full border border-line-soft px-1.5 text-[10px] font-semibold text-muted">
          Pronto
        </span>
      )}
      {item.badge && (
        <span
          className={`flex h-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
            item.badge.tone === "primary" ? "bg-primary text-white" : "border border-line-soft bg-surface text-ink"
          }`}
        >
          {item.badge.text}
        </span>
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const isActive = (href: string) =>
    pathname === href || (href === "/dashboard" && pathname === "/");

  // Todos los grupos abiertos por defecto; se pueden colapsar (solo en modo expandido).
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(GROUPS.map((g) => [g.title, true]))
  );
  const toggle = (title: string) => setOpen((s) => ({ ...s, [title]: !s[title] }));

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-line-soft bg-card transition-[width] duration-200 ease-out ${
        collapsed ? "w-[76px]" : "w-[268px]"
      }`}
    >
      {/* brand */}
      <div className={`flex items-center gap-3 pb-4 pt-6 ${collapsed ? "justify-center px-0" : "px-5"}`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary text-base font-bold text-white">
          E
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-[15px] font-bold leading-tight text-ink">Edusync</span>
            <span className="truncate text-[11px] font-medium text-subtle">Colegio San Mateo</span>
          </div>
        )}
      </div>

      <div className="h-px bg-line-soft" />

      {/* nav */}
      <nav
        className={`flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden ${
          collapsed ? "items-center px-2.5 py-3" : "p-3"
        }`}
      >
        <NavLink item={HOME} active={isActive(HOME.href)} collapsed={collapsed} />

        {collapsed
          ? GROUPS.map((group) => (
              <div key={group.title} className="flex w-full flex-col items-center gap-1">
                <span className="my-1.5 h-px w-7 bg-line-soft" />
                {group.items.map((item) => (
                  <NavLink key={item.label} item={item} active={isActive(item.href)} collapsed />
                ))}
              </div>
            ))
          : GROUPS.map((group) => {
              const isOpen = open[group.title];
              return (
                <div key={group.title} className="mt-2 flex flex-col">
                  <button
                    type="button"
                    onClick={() => toggle(group.title)}
                    className="flex items-center justify-between px-2 py-2 text-[11px] font-bold tracking-wide text-subtle transition-colors hover:text-ink"
                    aria-expanded={isOpen}
                  >
                    {group.title}
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
                  </button>
                  {isOpen && (
                    <div className="flex flex-col gap-1">
                      {group.items.map((item) => (
                        <NavLink key={item.label} item={item} active={isActive(item.href)} collapsed={false} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
      </nav>

      <div className="h-px bg-line-soft" />

      {/* profile */}
      <div className={`p-3 ${collapsed ? "flex justify-center" : ""}`}>
        <ProfileMenu collapsed={collapsed} />
      </div>
    </aside>
  );
}
