"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ScrollText, Loader2, TriangleAlert, Search, Download, ChevronLeft, ChevronRight,
  LogIn, LogOut, KeyRound, UserCog, GraduationCap, FileText, CalendarCheck,
  MessageSquareWarning, Lock, Wallet, ShieldCheck, Megaphone, Settings2, Layers, Bot,
  type LucideIcon,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import { initials } from "@/lib/academic";
import { downloadCSV } from "@/lib/finance";

/**
 * Trazabilidad — quién hizo qué y cuándo.
 *
 * La tabla existía y el endpoint también, pero no había pantalla: cuando una
 * familia reclama que le cambiaron una nota, o hay que responderle a la SIC
 * quién consultó unos datos, la respuesta tenía que salir de la base a mano.
 */

type AuditRow = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  newValues: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string; role: string } | null;
};
type Paginated = { data: AuditRow[]; meta: { total: number; page: number; limit: number; totalPages: number } };

const ACTION_LABEL: Record<string, string> = {
  LOGIN: "Inició sesión", LOGOUT: "Cerró sesión", PASSWORD_CHANGE: "Cambió su contraseña",
  PASSWORD_RESET: "Restableció una contraseña",
  USER_CREATE: "Creó una cuenta", USER_UPDATE: "Editó una cuenta", USER_DELETE: "Eliminó una cuenta",
  STUDENT_CREATE: "Matriculó un estudiante", STUDENT_UPDATE: "Editó un estudiante", STUDENT_DELETE: "Retiró un estudiante",
  GUARDIAN_CREATE: "Registró un acudiente",
  GRADE_SCORE_SAVE: "Guardó calificaciones",
  ACHIEVEMENT_CREATE: "Creó un logro", ACHIEVEMENT_UPDATE: "Editó un logro", ACHIEVEMENT_DELETE: "Eliminó un logro",
  ACTIVITY_CREATE: "Creó una evaluación", ACTIVITY_UPDATE: "Editó una evaluación", ACTIVITY_DELETE: "Eliminó una evaluación",
  ATTENDANCE_SAVE: "Registró asistencia",
  OBSERVATION_CREATE: "Anotó en el observador", OBSERVATION_UPDATE: "Editó una anotación", OBSERVATION_DELETE: "Borró una anotación",
  YEAR_CREATE: "Creó un año lectivo", YEAR_UPDATE: "Editó un año lectivo",
  PERIOD_CREATE: "Creó un periodo", PERIOD_UPDATE: "Editó un periodo",
  PERIOD_CLOSE: "Cerró un periodo", PERIOD_REOPEN: "Reabrió un periodo",
  GRADE_SCALE_SET: "Cambió la escala de valoración",
  GROUP_CREATE: "Creó un curso", GROUP_UPDATE: "Editó un curso", GROUP_DELETE: "Eliminó un curso",
  SUBJECT_CREATE: "Creó una materia", SUBJECT_UPDATE: "Editó una materia", SUBJECT_DELETE: "Eliminó una materia",
  REPORT_CARD_PUBLISH: "Publicó un boletín", REPORT_CARD_GENERATE: "Generó boletines",
  CERTIFICATE_ISSUE: "Expidió un certificado",
  PAYMENT_REGISTER: "Registró un pago", INVOICE_GENERATE: "Generó facturación", TUITION_SET: "Cambió las tarifas",
  CONSENT_REGISTER: "Registró una autorización de datos", CONSENT_REVOKE: "Revocó una autorización de datos",
  SETTINGS_UPDATE: "Cambió los datos de la institución",
  YEAR_PROMOTE: "Promovió estudiantes al año siguiente",
  ANNOUNCEMENT_PUBLISH: "Publicó un comunicado", ANNOUNCEMENT_DELETE: "Borró un comunicado",
};

const ENTITY_ICON: Record<string, LucideIcon> = {
  "Sesión": LogIn, "Usuario": UserCog, "Estudiante": GraduationCap, "Acudiente": UserCog,
  "Calificación": FileText, "Asistencia": CalendarCheck, "Observador": MessageSquareWarning,
  "Año lectivo": Layers, "Periodo": Lock, "Escala de valoración": Layers, "Promoción": GraduationCap,
  "Curso": Layers, "Materia": Layers, "Boletín": FileText, "Certificado": FileText,
  "Pago": Wallet, "Facturación": Wallet, "Tarifas": Wallet,
  "Habeas data": ShieldCheck, "Configuración": Settings2, "Comunicado": Megaphone,
  // El agente de WhatsApp audita con entity "whatsapp" y su propio `action`.
  whatsapp: Bot,
};

/** Acciones que merecen resaltarse: tocan plata, borran, o abren lo cerrado. */
const CRITICAS = new Set([
  "YEAR_PROMOTE", "PERIOD_REOPEN", "USER_DELETE", "STUDENT_DELETE", "OBSERVATION_DELETE",
  "ACHIEVEMENT_DELETE", "ACTIVITY_DELETE", "GROUP_DELETE", "SUBJECT_DELETE",
  "PASSWORD_RESET", "GRADE_SCALE_SET", "TUITION_SET",
]);

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super admin", RECTOR: "Rectoría", COORDINATOR_ACADEMIC: "Coord. académica",
  COORDINATOR_CONVIVENCIA: "Coord. convivencia", SECRETARY: "Secretaría",
  ACCOUNTANT: "Contabilidad", TEACHER: "Docente", GUARDIAN: "Acudiente", STUDENT: "Estudiante",
};

const AREAS: { id: string; label: string; entidades: string[] }[] = [
  { id: "", label: "Todo", entidades: [] },
  { id: "notas", label: "Calificaciones", entidades: ["Calificación", "Boletín"] },
  { id: "personas", label: "Personas y cuentas", entidades: ["Usuario", "Estudiante", "Acudiente"] },
  { id: "convivencia", label: "Observador", entidades: ["Observador", "Asistencia"] },
  { id: "dinero", label: "Finanzas", entidades: ["Pago", "Facturación", "Tarifas"] },
  { id: "estructura", label: "Estructura y cierres", entidades: ["Año lectivo", "Periodo", "Curso", "Materia", "Escala de valoración", "Configuración", "Promoción"] },
  { id: "sesion", label: "Sesiones", entidades: ["Sesión"] },
  { id: "whatsapp", label: "Asistente WhatsApp", entidades: ["whatsapp"] },
  { id: "datos", label: "Habeas data", entidades: ["Habeas data", "Certificado"] },
];

const LIMIT = 50;
const fmtWhen = (iso: string) =>
  new Date(iso).toLocaleString("es-CO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const describeAction = (a: string) => ACTION_LABEL[a] ?? a.replace(/_/g, " ").toLowerCase();

/** Resumen legible del payload, sin volcar el JSON crudo en la fila. */
function resumen(row: AuditRow): string {
  const v = row.newValues;
  if (!v || typeof v !== "object") return "";
  const partes: string[] = [];
  for (const [k, val] of Object.entries(v)) {
    if (val == null || val === "") continue;
    if (typeof val === "object") { partes.push(`${k}: …`); continue; }
    partes.push(`${k}: ${String(val).slice(0, 40)}`);
    if (partes.length >= 3) break;
  }
  return partes.join(" · ");
}

export default function AuditoriaPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [meta, setMeta] = useState<Paginated["meta"] | null>(null);
  const [page, setPage] = useState(1);
  const [area, setArea] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const q = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (from) q.set("from", new Date(`${from}T00:00:00`).toISOString());
      if (to) q.set("to", new Date(`${to}T23:59:59`).toISOString());
      const res = await apiGet<Paginated>(`/audit?${q}`);
      setRows(res.data); setMeta(res.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar la trazabilidad.");
      setRows([]); setMeta(null);
    } finally { setLoading(false); }
  }, [page, from, to]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [from, to]);

  // El filtro por área y la búsqueda se aplican sobre la página cargada: el
  // backend filtra por fecha (que es lo que acota el volumen de verdad).
  const visibles = useMemo(() => {
    const ents = AREAS.find((a) => a.id === area)?.entidades ?? [];
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (ents.length && !ents.includes(r.entity)) return false;
      if (!q) return true;
      const quien = r.user ? `${r.user.firstName} ${r.user.lastName} ${r.user.email}` : "";
      return `${quien} ${describeAction(r.action)} ${r.entity} ${resumen(r)}`.toLowerCase().includes(q);
    });
  }, [rows, area, query]);

  const exportar = () => {
    downloadCSV(`trazabilidad_${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Fecha", "Usuario", "Correo", "Rol", "Acción", "Área", "Detalle", "IP"],
      ...visibles.map((r) => [
        fmtWhen(r.createdAt),
        r.user ? `${r.user.firstName} ${r.user.lastName}` : "—",
        r.user?.email ?? "",
        r.user ? ROLE_LABEL[r.user.role] ?? r.user.role : "",
        describeAction(r.action),
        r.entity,
        resumen(r),
        r.ip ?? "",
      ]),
    ]);
  };

  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className="flex flex-col gap-5 px-7 py-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold tracking-[0.18em] text-primary">OPERACIÓN</span>
          <h1 className="text-[28px] font-bold -tracking-[0.02em] text-ink">Trazabilidad</h1>
          <p className="text-[13px] text-subtle">
            Quién hizo qué y cuándo. Se registran los cambios sobre notas, asistencia, observador,
            matrícula, dinero, cuentas y cierres.
          </p>
        </div>
        <button onClick={exportar} disabled={!visibles.length} className="flex h-[38px] items-center gap-2 rounded-[10px] border border-line px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface disabled:opacity-40">
          <Download className="h-4 w-4" /> Exportar
        </button>
      </div>

      {/* filtros */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-card p-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-subtle">Desde</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="h-9 rounded-lg border border-line bg-card px-3 text-[13px] text-ink outline-none focus:ring-2 focus:ring-primary/40" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-subtle">Hasta</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="h-9 rounded-lg border border-line bg-card px-3 text-[13px] text-ink outline-none focus:ring-2 focus:ring-primary/40" />
        </label>
        <div className="relative flex-1 min-w-[220px]">
          <span className="mb-1.5 block text-[11px] font-semibold text-subtle">Buscar</span>
          <Search className="pointer-events-none absolute bottom-2.5 left-3 h-3.5 w-3.5 text-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Persona, acción o dato"
            className="h-9 w-full rounded-lg border border-line bg-card pl-9 pr-3 text-[13px] text-ink outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted" />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {AREAS.map((a) => (
          <button key={a.id} onClick={() => setArea(a.id)}
            className={`rounded-full px-3 py-1.5 text-xs transition-colors ${area === a.id ? "border border-line bg-card font-semibold text-ink" : "font-medium text-subtle hover:text-ink"}`}>
            {a.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Cargando trazabilidad…</div>
      ) : error ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-s-error-fg"><TriangleAlert className="h-4 w-4" /> {error}</div>
      ) : visibles.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-card py-16 text-center text-sm text-subtle">
          <ScrollText className="h-6 w-6 text-muted" />
          No hay registros con estos filtros.
        </div>
      ) : (
        <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
          {visibles.map((r, i) => {
            const Icon = ENTITY_ICON[r.entity] ?? ScrollText;
            const critica = CRITICAS.has(r.action);
            const abierto = open === r.id;
            const det = resumen(r);
            return (
              <div key={r.id} className={i < visibles.length - 1 ? "border-b border-line" : ""}>
                <button onClick={() => setOpen(abierto ? null : r.id)}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-surface/50">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${critica ? "bg-s-error text-s-error-fg" : "bg-surface text-primary"}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[13px] text-ink">
                      <b>{r.user ? `${r.user.firstName} ${r.user.lastName}` : "Sistema"}</b>{" "}
                      {describeAction(r.action).toLowerCase()}
                    </span>
                    {det && <span className="truncate text-[11px] text-subtle">{det}</span>}
                  </div>
                  <span className="hidden w-[130px] shrink-0 text-[11px] text-subtle sm:block">{r.entity}</span>
                  <span className="hidden w-[120px] shrink-0 text-[11px] text-subtle md:block">
                    {r.user ? ROLE_LABEL[r.user.role] ?? r.user.role : "—"}
                  </span>
                  <span className="w-[150px] shrink-0 text-right text-[11px] text-subtle">{fmtWhen(r.createdAt)}</span>
                </button>

                {abierto && (
                  <div className="flex flex-col gap-2 border-t border-line bg-surface/60 px-5 py-3 text-[12px]">
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-subtle">
                      {r.user && (
                        <span className="flex items-center gap-1.5">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                            {initials(r.user.firstName, r.user.lastName)}
                          </span>
                          {r.user.email}
                        </span>
                      )}
                      {r.ip && <span>IP {r.ip}</span>}
                      {r.entityId && <span>ID {r.entityId}</span>}
                    </div>
                    {r.userAgent && <span className="truncate text-muted">{r.userAgent}</span>}
                    {r.newValues && (
                      <pre className="overflow-x-auto rounded-lg bg-card p-3 text-[11px] text-ink">
                        {JSON.stringify(r.newValues, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {meta && totalPages > 1 && (
        <div className="flex items-center justify-between text-[12px] text-subtle">
          <span>{meta.total} registros · página {meta.page} de {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
              className="flex h-8 items-center gap-1 rounded-lg border border-line px-3 font-semibold text-ink transition-colors hover:bg-surface disabled:opacity-40">
              <ChevronLeft className="h-3.5 w-3.5" /> Anterior
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="flex h-8 items-center gap-1 rounded-lg border border-line px-3 font-semibold text-ink transition-colors hover:bg-surface disabled:opacity-40">
              Siguiente <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
