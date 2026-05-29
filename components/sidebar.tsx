"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChevronsUpDown,
  LayoutDashboard,
  Users,
  ClipboardList,
  GraduationCap,
  CalendarCheck,
  FileText,
  MessageSquareWarning,
  Wallet,
  Mail,
  ChartNoAxesColumn,
  ShieldCheck,
  Settings,
  LifeBuoy,
  MessageCircle,
  EllipsisVertical,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: { text: string; tone: "primary" | "muted" };
};

const GENERAL: NavItem[] = [
  { label: "Inicio", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Usuarios", icon: Users, href: "/usuarios" },
  { label: "Matrículas", icon: ClipboardList, href: "/matriculas" },
  { label: "Académico", icon: GraduationCap, href: "/academico" },
  { label: "Asistencia", icon: CalendarCheck, href: "/asistencia" },
  { label: "Calificaciones", icon: FileText, href: "/calificaciones" },
  { label: "Observaciones", icon: MessageSquareWarning, href: "/observaciones" },
];

const OPERACION: NavItem[] = [
  {
    label: "Finanzas",
    icon: Wallet,
    href: "/finanzas",
    badge: { text: "12", tone: "primary" },
  },
  {
    label: "Comunicaciones",
    icon: Mail,
    href: "/comunicaciones",
    badge: { text: "3", tone: "muted" },
  },
  { label: "Reportes", icon: ChartNoAxesColumn, href: "/reportes" },
  { label: "Auditoría", icon: ShieldCheck, href: "/auditoria" },
  { label: "Configuración", icon: Settings, href: "/configuracion" },
];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`relative flex h-10 items-center gap-3 rounded-[10px] px-3 transition-colors ${
        active ? "bg-surface" : "hover:bg-surface/60"
      }`}
    >
      {active && (
        <span className="absolute left-0 h-5 w-[3px] rounded-sm bg-primary" />
      )}
      <Icon
        className={`h-[18px] w-[18px] shrink-0 ${
          active ? "text-primary" : "text-muted"
        }`}
      />
      <span
        className={`flex-1 text-sm ${
          active ? "font-semibold text-ink" : "font-medium text-muted"
        }`}
      >
        {item.label}
      </span>
      {item.badge && (
        <span
          className={`flex h-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
            item.badge.tone === "primary"
              ? "bg-primary text-white"
              : "border border-line-soft bg-surface text-ink"
          }`}
        >
          {item.badge.text}
        </span>
      )}
    </Link>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2 py-2 text-[11px] font-bold tracking-wide text-subtle">
      {children}
    </p>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || (href === "/dashboard" && pathname === "/");

  return (
    <aside className="flex w-[268px] shrink-0 flex-col border-r border-line-soft bg-card">
      {/* brand */}
      <div className="flex items-center gap-3 px-5 pb-4 pt-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary text-base font-bold text-white">
          E
        </div>
        <div className="flex flex-col">
          <span className="text-[15px] font-bold leading-tight text-ink">
            Edusync
          </span>
          <span className="text-[11px] font-medium text-subtle">
            Colegio San Mateo
          </span>
        </div>
      </div>

      {/* year selector */}
      <div className="px-5 pb-4">
        <button className="flex h-[38px] w-full items-center gap-2 rounded-[10px] border border-line-soft bg-card px-3 transition-colors hover:bg-surface">
          <CalendarDays className="h-4 w-4 text-subtle" />
          <span className="flex-1 text-left text-[13px] font-semibold text-ink">
            Año lectivo 2025
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 text-subtle" />
        </button>
      </div>

      <div className="h-px bg-line-soft" />

      {/* nav */}
      <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-3">
        <SectionTitle>GENERAL</SectionTitle>
        {GENERAL.map((item) => (
          <NavLink key={item.label} item={item} active={isActive(item.href)} />
        ))}

        <div className="h-3" />
        <SectionTitle>OPERACIÓN</SectionTitle>
        {OPERACION.map((item) => (
          <NavLink key={item.label} item={item} active={isActive(item.href)} />
        ))}
      </nav>

      {/* support card */}
      <div className="px-4 pb-3 pt-3.5">
        <div className="flex flex-col gap-2.5 rounded-[14px] border border-line-soft bg-surface p-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-line-soft bg-card">
              <LifeBuoy className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-ink">
                Soporte 24/7
              </span>
              <span className="text-[11px] font-medium text-subtle">
                Estamos para ayudarte
              </span>
            </div>
          </div>
          <button className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary text-[13px] font-semibold text-white transition-opacity hover:opacity-90">
            <MessageCircle className="h-3.5 w-3.5" />
            Contactar
          </button>
        </div>
      </div>

      <div className="h-px bg-line-soft" />

      {/* profile */}
      <div className="flex items-center gap-2.5 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-line-soft bg-line-soft text-[13px] font-semibold text-ink">
          MR
        </div>
        <div className="flex flex-1 flex-col">
          <span className="text-[13px] font-bold text-ink">María Rojas</span>
          <span className="text-[11px] font-medium text-subtle">Rectora</span>
        </div>
        <button className="flex h-7 w-7 items-center justify-center rounded-lg text-subtle hover:bg-surface">
          <EllipsisVertical className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
