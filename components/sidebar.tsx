"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users2,
  GraduationCap,
  BookUser,
  Briefcase,
  CalendarCheck,
  CalendarRange,
  FileText,
  BookText,
  MessageSquareWarning,
  Wallet,
  Mail,
  Settings,
  ChevronDown,
  ListChecks,
  LayoutGrid,
  FileBadge,
  Award,
  Lock,
  ClipboardCheck,
  Upload,
  HardDrive,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import { useSidebar } from "@/components/sidebar-context";
import { ProfileMenu } from "@/components/profile-menu";
import { useAuth } from "@/components/auth-context";

type NavItem = {
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: { text: string; tone: "primary" | "muted" };
  soon?: boolean;
};

type NavGroup = { title: string; items: NavItem[] };

// Ítems superiores y grupos según rol.
const ADMIN_TOP: NavItem[] = [
  { label: "Inicio", icon: Home, href: "/dashboard" },
  { label: "Pendientes", icon: ClipboardCheck, href: "/pendientes" },
];
const TEACHER_TOP: NavItem[] = [
  { label: "Mi clase", icon: ListChecks, href: "/clase" },
  { label: "Mi día", icon: CalendarCheck, href: "/profesor" },
];

const ADMIN_GROUPS: NavGroup[] = [
  {
    title: "ACADÉMICO",
    items: [
      { label: "Horarios", icon: CalendarRange, href: "/horarios" },
      { label: "Calificaciones", icon: FileText, href: "/calificaciones" },
      { label: "Asistencia", icon: CalendarCheck, href: "/asistencia" },
      { label: "Boletines", icon: BookText, href: "/boletines" },
      { label: "Cierre de periodo", icon: Lock, href: "/periodos" },
      { label: "Cierre de año", icon: Award, href: "/cierre" },
      { label: "Observaciones", icon: MessageSquareWarning, href: "/observaciones", soon: true },
    ],
  },
  {
    title: "ADMINISTRACIÓN",
    items: [
      { label: "Estudiantes", icon: GraduationCap, href: "/estudiantes" },
      { label: "Docentes", icon: BookUser, href: "/profesores" },
      { label: "Acudientes", icon: Users2, href: "/acudientes" },
      { label: "Personal", icon: Briefcase, href: "/personal" },
      { label: "Cursos", icon: LayoutGrid, href: "/grupos" },
      { label: "Importar", icon: Upload, href: "/importar" },
    ],
  },
  {
    title: "OPERACIÓN",
    items: [
      { label: "Finanzas", icon: Wallet, href: "/finanzas", badge: { text: "12", tone: "primary" } },
      { label: "Comunicaciones", icon: Mail, href: "/comunicaciones", badge: { text: "3", tone: "muted" }, soon: true },
      { label: "Certificados", icon: FileBadge, href: "/certificados" },
      { label: "Drive", icon: HardDrive, href: "/drive" },
      { label: "Configuración", icon: Settings, href: "/configuracion" },
    ],
  },
];

// El docente toma asistencia desde "Mi clase"; el consolidado de /asistencia es administrativo y se le oculta.
const TEACHER_GROUPS: NavGroup[] = [
  {
    title: "ACADÉMICO",
    items: [
      { label: "Calificaciones", icon: FileText, href: "/calificaciones" },
      { label: "En riesgo", icon: ShieldAlert, href: "/riesgo" },
      { label: "Drive", icon: HardDrive, href: "/drive" },
    ],
  },
  {
    title: "CUENTA",
    items: [{ label: "Configuración", icon: Settings, href: "/configuracion" }],
  },
];

function NavLink({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  const Icon = item.icon;

  if (collapsed) {
    return (
      <Link
        href={item.href}
        title={item.label}
        className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] transition-colors ${
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
      className={`relative flex h-10 shrink-0 items-center gap-3 rounded-[10px] px-3 transition-colors ${
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
  const { user } = useAuth();
  const isTeacher = user?.role === "TEACHER";
  const TOP = isTeacher ? TEACHER_TOP : ADMIN_TOP;
  const GROUPS = isTeacher ? TEACHER_GROUPS : ADMIN_GROUPS;
  const isActive = (href: string) =>
    pathname === href || (href === "/dashboard" && pathname === "/");

  // Grupos abiertos por defecto (undefined = abierto); se pueden colapsar en modo expandido.
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (title: string) => setOpen((s) => ({ ...s, [title]: s[title] === false ? true : false }));

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-line-soft bg-card transition-[width] duration-200 ease-out ${
        collapsed ? "w-[76px]" : "w-[268px]"
      }`}
    >
      {/* brand — 67px + la línea de 1px = 68px, para alinear con el borde inferior del topbar */}
      <div className={`flex h-[67px] shrink-0 items-center gap-3 ${collapsed ? "justify-center px-0" : "px-5"}`}>
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
        className={`no-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden ${
          collapsed ? "items-center px-2.5 py-3" : "p-3"
        }`}
      >
        {TOP.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} collapsed={collapsed} />
        ))}

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
              const isOpen = open[group.title] !== false;
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
