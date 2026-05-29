import {
  BookOpen,
  ArrowUpRight,
  Inbox,
  FolderOpen,
  UserPlus,
  Upload,
  Loader,
  LoaderCircle,
  TriangleAlert,
  CloudOff,
  RefreshCw,
  LifeBuoy,
  Map as MapIcon,
  House,
  Search,
} from "lucide-react";

/* ---------------- página ---------------- */

export default function EstadosPage() {
  return (
    <div className="flex flex-col gap-8 px-6 py-8 lg:px-12">
      {/* ====== header ====== */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold tracking-[0.18em] text-primary">DESIGN SYSTEM · ESTADOS</span>
          <h1 className="text-[32px] font-extrabold -tracking-[0.025em] text-ink">Estados del sistema</h1>
          <p className="text-sm text-subtle">
            Vacíos, carga, error y 404 — patrones consistentes con tono cálido en Edusync
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1.5 text-[11px] font-bold text-subtle">
            <BookOpen className="h-3 w-3" /> 4 patrones · v2.1
          </span>
          <button className="flex h-9 items-center gap-1.5 rounded-lg border border-line px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">
            Ver en Storybook
            <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* ====== grid 2x2 ====== */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* --- vacío --- */}
        <div className="flex h-[400px] flex-col gap-5 rounded-[18px] border border-line bg-card p-8">
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-surface px-2.5 py-1.5 text-[9px] font-bold tracking-[0.14em] text-subtle">
            <Inbox className="h-3 w-3" /> ESTADO VACÍO
          </span>
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <span className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-surface text-subtle">
              <FolderOpen className="h-9 w-9" />
            </span>
            <div className="flex flex-col gap-2">
              <h3 className="text-[17px] font-bold -tracking-[0.01em] text-ink">Aún no hay estudiantes en 6°A</h3>
              <p className="max-w-[340px] text-[13px] leading-relaxed text-subtle">
                Cuando matricules estudiantes en este grupo, aparecerán aquí ordenados por apellido.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-[13px] font-bold text-white transition-opacity hover:opacity-90">
                <UserPlus className="h-3.5 w-3.5" /> Matricular estudiante
              </button>
              <button className="flex h-9 items-center gap-1.5 rounded-lg border border-line px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">
                <Upload className="h-3.5 w-3.5" /> Importar CSV
              </button>
            </div>
          </div>
        </div>

        {/* --- carga / skeleton --- */}
        <div className="flex h-[400px] flex-col gap-5 rounded-[18px] border border-line bg-card p-8">
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-surface px-2.5 py-1.5 text-[9px] font-bold tracking-[0.14em] text-subtle">
            <Loader className="h-3 w-3" /> CARGANDO · SKELETON
          </span>
          <div className="flex flex-1 flex-col gap-2.5">
            <div className="flex flex-col gap-2">
              <span className="h-[18px] w-[220px] animate-pulse rounded-md bg-surface" />
              <span className="h-3 w-full max-w-[340px] animate-pulse rounded-md bg-surface opacity-70" />
            </div>
            {[1, 0.85].map((op, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-surface p-3.5" style={{ opacity: op }}>
                <span className="h-9 w-9 animate-pulse rounded-full bg-card opacity-70" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <span className="h-3 w-40 animate-pulse rounded-md bg-card opacity-80" />
                  <span className="h-2.5 w-56 animate-pulse rounded-md bg-card opacity-60" />
                </div>
                <span className="h-5 w-12 animate-pulse rounded-md bg-card opacity-60" />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2">
            <LoaderCircle className="h-3.5 w-3.5 animate-spin text-primary" />
            <span className="text-xs font-semibold text-subtle">Cargando 1.284 estudiantes…</span>
          </div>
        </div>

        {/* --- error --- */}
        <div className="flex h-[400px] flex-col gap-5 rounded-[18px] border border-line bg-card p-8">
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-s-error px-2.5 py-1.5 text-[9px] font-bold tracking-[0.14em] text-s-error-fg">
            <TriangleAlert className="h-3 w-3" /> ESTADO DE ERROR
          </span>
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <span className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-s-error text-s-error-fg">
              <CloudOff className="h-9 w-9" />
            </span>
            <div className="flex flex-col gap-2">
              <h3 className="text-[17px] font-bold -tracking-[0.01em] text-ink">No pudimos cargar las notas</h3>
              <p className="max-w-[340px] text-[13px] leading-relaxed text-subtle">
                Perdimos contacto con el servidor por un instante. Tus cambios están guardados en local.
              </p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1.5 text-[10px]">
              <span className="font-medium text-subtle">Código:</span>
              <span className="font-bold text-ink">ED-503 · 08:14:32 UTC-5</span>
            </span>
            <div className="flex items-center gap-2">
              <button className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-[13px] font-bold text-white transition-opacity hover:opacity-90">
                <RefreshCw className="h-3.5 w-3.5" /> Reintentar
              </button>
              <button className="flex h-9 items-center gap-1.5 rounded-lg border border-line px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">
                <LifeBuoy className="h-3.5 w-3.5" /> Reportar a soporte
              </button>
            </div>
          </div>
        </div>

        {/* --- 404 --- */}
        <div
          className="flex h-[400px] flex-col gap-5 rounded-[18px] border border-line p-8"
          style={{ background: "linear-gradient(135deg, var(--card) 0%, var(--surface) 100%)" }}
        >
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-surface px-2.5 py-1.5 text-[9px] font-bold tracking-[0.14em] text-subtle">
            <MapIcon className="h-3 w-3" /> PÁGINA NO ENCONTRADA
          </span>
          <div className="flex flex-1 flex-col items-center justify-center gap-3.5 text-center">
            <span className="text-[108px] font-black leading-none -tracking-[0.06em] text-primary">404</span>
            <div className="flex flex-col gap-2">
              <h3 className="text-[17px] font-bold -tracking-[0.01em] text-ink">Esta página perdió el bus del colegio</h3>
              <p className="max-w-[360px] text-[13px] leading-relaxed text-subtle">
                La URL que buscas no existe o se movió. Volvamos al panel para que no te quedes en la lluvia.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-[13px] font-bold text-white transition-opacity hover:opacity-90">
                <House className="h-3.5 w-3.5" /> Ir al panel
              </button>
              <button className="flex h-9 items-center gap-1.5 rounded-lg border border-line bg-card px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">
                <Search className="h-3.5 w-3.5" /> Buscar en el sistema
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
