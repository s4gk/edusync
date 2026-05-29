import {
  Search,
  User,
  Bell,
  ShieldCheck,
  Palette,
  GraduationCap,
  Calendar,
  Users,
  Plug,
  Database,
  Code,
  Upload,
  Trash2,
  Signature,
  Smartphone,
  KeyRound,
  Monitor,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

/* ---------------- datos ---------------- */

type NavItem = { label: string; icon: LucideIcon; active?: boolean };

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "CUENTA",
    items: [
      { label: "Perfil y cuenta", icon: User, active: true },
      { label: "Notificaciones", icon: Bell },
      { label: "Seguridad y privacidad", icon: ShieldCheck },
      { label: "Apariencia e idioma", icon: Palette },
    ],
  },
  {
    group: "COLEGIO",
    items: [
      { label: "Configuración académica", icon: GraduationCap },
      { label: "Año lectivo y periodos", icon: Calendar },
      { label: "Roles y permisos", icon: Users },
    ],
  },
  {
    group: "AVANZADO",
    items: [
      { label: "Integraciones", icon: Plug },
      { label: "Datos y exportaciones", icon: Database },
      { label: "API y webhooks", icon: Code },
    ],
  },
];

const SECURITY = [
  { icon: Smartphone, title: "Autenticación en 2 pasos (2FA)", sub: "Activo · usando Google Authenticator desde el 12 marzo 2025", toggle: true },
  { icon: KeyRound, title: "Contraseña", sub: "Actualizada hace 28 días · fuerza alta", action: "Cambiar" },
  { icon: Monitor, title: "Sesiones activas", sub: "3 dispositivos · MacBook Pro · iPhone 15 · iPad Air", action: "Administrar" },
];

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <label className="text-xs font-semibold text-ink">{label}</label>
      <div className="flex h-[42px] items-center rounded-lg border border-line bg-card px-3.5 text-[13px] font-medium text-ink">
        {value}
      </div>
    </div>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span className={`flex h-[22px] w-10 items-center rounded-full p-0.5 ${on ? "bg-primary" : "bg-line-soft"}`}>
      <span className={`h-[18px] w-[18px] rounded-full bg-white transition-transform ${on ? "translate-x-[18px]" : ""}`} />
    </span>
  );
}

/* ---------------- página ---------------- */

export default function ConfiguracionPage() {
  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      {/* ====== sub-nav de ajustes ====== */}
      <aside className="flex w-full flex-col gap-4 border-b border-line bg-card p-5 lg:w-[260px] lg:shrink-0 lg:border-b-0 lg:border-r">
        <h2 className="text-lg font-extrabold -tracking-[0.01em] text-ink">Configuración</h2>
        <div className="flex h-[34px] items-center gap-2 rounded-lg bg-surface px-2.5">
          <Search className="h-3.5 w-3.5 text-subtle" />
          <span className="text-xs text-subtle">Buscar ajustes</span>
        </div>
        {NAV.map((section) => (
          <div key={section.group} className="flex flex-col gap-1">
            <span className="px-2 py-1 text-[10px] font-bold tracking-[0.18em] text-subtle">{section.group}</span>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${
                    item.active ? "bg-surface font-bold text-ink" : "font-medium text-ink hover:bg-surface/60"
                  }`}
                >
                  <Icon className={`h-[15px] w-[15px] ${item.active ? "text-primary" : "text-subtle"}`} />
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}
      </aside>

      {/* ====== contenido ====== */}
      <div className="flex flex-1 flex-col gap-6 px-6 py-8 lg:px-10">
        {/* header */}
        <div className="flex items-end justify-between gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold tracking-[0.18em] text-primary">CONFIGURACIÓN · CUENTA</span>
            <h1 className="text-[28px] font-bold -tracking-[0.02em] text-ink">Perfil y cuenta</h1>
            <p className="text-[13px] text-subtle">Gestiona tu información personal, credenciales y firma digital</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-s-success px-2.5 py-1 text-[11px] font-bold text-s-success-fg">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-700" />
              Guardado hace 2 min
            </span>
            <button className="flex h-9 items-center rounded-lg bg-primary px-4 text-[13px] font-bold text-white transition-opacity hover:opacity-90">
              Guardar cambios
            </button>
          </div>
        </div>

        {/* profile card */}
        <div className="flex flex-col gap-6 rounded-2xl border border-line bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-4xl font-extrabold text-white">
              MR
            </span>
            <div className="flex flex-col gap-2">
              <span className="text-[22px] font-bold -tracking-[0.01em] text-ink">María Rojas</span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-[11px] font-bold text-primary">
                  <ShieldCheck className="h-3 w-3" /> Rectora
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-subtle">
                  maria.rojas@colegiosanmateo.edu.co
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-semibold text-ink transition-colors hover:bg-surface">
              <Upload className="h-3 w-3" /> Cambiar foto
            </button>
            <button className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-danger hover:bg-s-error/40">
              <Trash2 className="h-3 w-3" /> Eliminar
            </button>
          </div>
        </div>

        {/* información básica */}
        <div className="flex flex-col gap-[18px] rounded-2xl border border-line bg-card p-6">
          <h3 className="text-sm font-bold text-ink">Información básica</h3>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Field label="Nombres" value="María" />
            <Field label="Apellidos" value="Rojas Pérez" />
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Field label="Documento" value="CC 52.847.392" />
            <Field label="Teléfono" value="+57 310 482 9173" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-ink">Firma digital</label>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-line bg-surface px-4 py-3">
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-medium italic -tracking-[0.04em] text-ink">María Rojas</span>
                <span className="text-[10px] font-medium text-subtle">Verificada por Edusync · CRC #FE-2025-08471</span>
              </div>
              <button className="flex h-9 items-center gap-1.5 rounded-lg border border-line bg-card px-3 text-[11px] font-semibold text-ink transition-colors hover:bg-surface">
                <Signature className="h-3 w-3" /> Regenerar firma
              </button>
            </div>
          </div>
        </div>

        {/* seguridad */}
        <div className="flex flex-col gap-3.5 rounded-2xl border border-line bg-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-ink">Seguridad de la cuenta</h3>
              <span className="text-xs text-subtle">Tu cuenta protege información de 1.284 estudiantes</span>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-s-success px-2.5 py-1 text-[11px] font-bold text-s-success-fg">
              <ShieldCheck className="h-3 w-3" /> Nivel alto
            </span>
          </div>
          {SECURITY.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="flex items-center gap-3 rounded-[10px] bg-surface p-3.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-card text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="flex flex-1 flex-col">
                  <span className="text-[13px] font-bold text-ink">{s.title}</span>
                  <span className="text-[11px] text-subtle">{s.sub}</span>
                </div>
                {s.toggle ? (
                  <Toggle on />
                ) : (
                  <button className="flex h-8 items-center rounded-lg border border-line bg-card px-3 text-[11px] font-semibold text-ink transition-colors hover:bg-surface">
                    {s.action}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* zona delicada */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-danger bg-s-error p-[18px]">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-danger text-white">
            <TriangleAlert className="h-4 w-4" />
          </span>
          <div className="flex flex-1 flex-col">
            <span className="text-[13px] font-bold text-s-error-fg">Zona delicada</span>
            <span className="text-[11px] text-s-error-fg/90">
              Cerrar sesión en todos los dispositivos o solicitar exportación completa de tus datos
            </span>
          </div>
          <button className="flex h-9 items-center rounded-lg border border-danger bg-card px-3.5 text-xs font-bold text-danger transition-colors hover:bg-surface">
            Acciones avanzadas
          </button>
        </div>
      </div>
    </div>
  );
}
