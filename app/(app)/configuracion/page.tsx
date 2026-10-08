"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  User, ShieldCheck, GraduationCap, Calendar, KeyRound, Loader2, Check,
  TriangleAlert, Building2, Ruler, Plus, CircleAlert, Lock, type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/components/auth-context";
import { apiPost } from "@/lib/api";
import { Modal, FormField, inputCls } from "@/components/modal";
import { initials, type AcademicPeriod, type AcademicYear } from "@/lib/academic";
import { getPeriods } from "@/lib/academic";
import {
  DEFAULT_SCALE, SCALE_CHIP, SCALE_LABEL, SCALE_ORDER, SCHOOL_FIELDS,
  createPeriod, createYear, getGradeScales, getSchool, listYears, saveGradeScales,
  saveSchool, suggestPeriods, updatePeriod, updateYear, validateScale,
  type GradeScaleRow, type SchoolProfile, type SchoolStatus, type ScaleKey,
} from "@/lib/settings";

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super administrador", RECTOR: "Rector(a)", COORDINATOR_ACADEMIC: "Coordinación académica",
  COORDINATOR_CONVIVENCIA: "Coordinación de convivencia",
  ACCOUNTANT: "Contabilidad", SECRETARY: "Secretaría", TEACHER: "Docente", GUARDIAN: "Acudiente", STUDENT: "Estudiante",
};

/** Solo rectoría toca la identidad del colegio y la estructura del año: lo que
 *  se cambia aquí sale impreso en boletines y constancias. */
const CAN_ADMIN = new Set(["SUPER_ADMIN", "RECTOR"]);

type SectionId = "cuenta" | "institucion" | "anio" | "escala";
const SECTIONS: { id: SectionId; label: string; icon: LucideIcon; group: string; adminOnly?: boolean }[] = [
  { id: "cuenta", label: "Perfil y cuenta", icon: User, group: "CUENTA" },
  { id: "institucion", label: "Datos de la institución", icon: Building2, group: "COLEGIO", adminOnly: true },
  { id: "anio", label: "Año lectivo y periodos", icon: Calendar, group: "COLEGIO", adminOnly: true },
  { id: "escala", label: "Escala de valoración", icon: Ruler, group: "COLEGIO", adminOnly: true },
];

const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "—");

export default function ConfiguracionPage() {
  const { user } = useAuth();
  const esAdmin = !!user && CAN_ADMIN.has(user.role);
  const [section, setSection] = useState<SectionId>("cuenta");
  const [toast, setToast] = useState<string | null>(null);

  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(null), 4000); };
  const visibles = SECTIONS.filter((s) => !s.adminOnly || esAdmin);
  const grupos = [...new Set(visibles.map((s) => s.group))];

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <aside className="flex w-full flex-col gap-4 border-b border-line bg-card p-5 lg:w-[260px] lg:shrink-0 lg:border-b-0 lg:border-r">
        <h2 className="text-lg font-extrabold -tracking-[0.01em] text-ink">Configuración</h2>
        {grupos.map((g) => (
          <div key={g} className="flex flex-col gap-1">
            <span className="px-2 py-1 text-[10px] font-bold tracking-[0.18em] text-subtle">{g}</span>
            {visibles.filter((s) => s.group === g).map((s) => {
              const Icon = s.icon;
              const activo = section === s.id;
              return (
                <button key={s.id} onClick={() => setSection(s.id)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13px] transition-colors ${activo ? "bg-surface font-bold text-ink" : "font-medium text-ink hover:bg-surface/60"}`}>
                  <Icon className={`h-[15px] w-[15px] shrink-0 ${activo ? "text-primary" : "text-subtle"}`} /> {s.label}
                </button>
              );
            })}
          </div>
        ))}
      </aside>

      <div className="flex flex-1 flex-col gap-6 px-6 py-8 lg:px-10">
        {toast && (
          <div className="flex items-center gap-2 rounded-xl bg-s-success px-4 py-2.5 text-[13px] font-semibold text-s-success-fg">
            <Check className="h-4 w-4" /> {toast}
          </div>
        )}
        {section === "cuenta" && <CuentaSection user={user} onSaved={flash} />}
        {section === "institucion" && <InstitucionSection onSaved={flash} />}
        {section === "anio" && <AnioSection onSaved={flash} />}
        {section === "escala" && <EscalaSection onSaved={flash} />}
      </div>
    </div>
  );
}

function Header({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-bold tracking-[0.18em] text-primary">{eyebrow}</span>
      <h1 className="text-[28px] font-bold -tracking-[0.02em] text-ink">{title}</h1>
      <p className="text-[13px] text-subtle">{sub}</p>
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return <div className="flex items-center gap-2 rounded-lg bg-s-error px-3.5 py-2.5 text-[13px] font-medium text-s-error-fg"><TriangleAlert className="h-4 w-4 shrink-0" /> {msg}</div>;
}

/* ══════════ Perfil y cuenta ══════════ */

function CuentaSection({ user, onSaved }: { user: ReturnType<typeof useAuth>["user"]; onSaved: (t: string) => void }) {
  const [cur, setCur] = useState("");
  const [nw, setNw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    if (nw.length < 8) { setErr("La nueva contraseña debe tener al menos 8 caracteres."); return; }
    if (nw !== confirm) { setErr("La confirmación no coincide."); return; }
    setBusy(true);
    try {
      await apiPost("/auth/change-password", { currentPassword: cur, newPassword: nw });
      setCur(""); setNw(""); setConfirm("");
      onSaved("Contraseña actualizada correctamente.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo actualizar la contraseña.");
    } finally { setBusy(false); }
  };

  const name = user ? `${user.firstName} ${user.lastName}` : "—";
  const roleLabel = user ? (ROLE_LABEL[user.role] ?? user.role) : "—";

  return (
    <>
      <Header eyebrow="CONFIGURACIÓN · CUENTA" title="Perfil y cuenta" sub="Tu información personal y credenciales" />

      <div className="flex flex-col gap-6 rounded-2xl border border-line bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-4xl font-extrabold text-white">{user ? initials(user.firstName, user.lastName) : "—"}</span>
          <div className="flex flex-col gap-2">
            <span className="text-[22px] font-bold -tracking-[0.01em] text-ink">{name}</span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-[11px] font-bold text-primary"><ShieldCheck className="h-3 w-3" /> {roleLabel}</span>
              <span className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-subtle">{user?.email ?? "—"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-card p-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-surface text-primary"><KeyRound className="h-4 w-4" /></span>
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-ink">Cambiar contraseña</h3>
            <span className="text-xs text-subtle">Mínimo 8 caracteres</span>
          </div>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink">Contraseña actual</span>
            <input type="password" value={cur} onChange={(e) => setCur(e.target.value)} className={inputCls} />
          </label>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink">Nueva contraseña</span>
            <input type="password" value={nw} onChange={(e) => setNw(e.target.value)} className={inputCls} />
          </label>
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink">Confirmar nueva contraseña</span>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
          </label>
        </div>
        {err && <ErrorBox msg={err} />}
        <div>
          <button onClick={submit} disabled={busy || !cur || !nw} className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Actualizar contraseña
          </button>
        </div>
      </div>
    </>
  );
}

/* ══════════ Datos de la institución ══════════ */

function InstitucionSection({ onSaved }: { onSaved: (t: string) => void }) {
  const [status, setStatus] = useState<SchoolStatus | null>(null);
  const [form, setForm] = useState<Partial<SchoolProfile>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await getSchool();
      setStatus(s); setForm(s.school);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo cargar la configuración.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    setErr(null); setBusy(true);
    try {
      await saveSchool(form);
      await load();
      onSaved("Datos de la institución guardados.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudieron guardar los datos.");
    } finally { setBusy(false); }
  };

  return (
    <>
      <Header eyebrow="CONFIGURACIÓN · COLEGIO" title="Datos de la institución"
        sub="Es lo que sale impreso en constancias, certificados y en la política de tratamiento de datos." />

      {loading ? (
        <div className="flex items-center gap-2 py-16 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>
      ) : (
        <>
          {status && !status.completa && (
            <div className="flex items-start gap-2.5 rounded-xl bg-s-warning px-4 py-3 text-[13px] text-s-warning-fg">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Falta por diligenciar: <b>{status.faltantes.join(", ")}</b>. Sin estos datos las constancias salen
                incompletas y el aviso de habeas data no cumple con la Ley 1581.
              </span>
            </div>
          )}

          <div className="grid gap-4 rounded-2xl border border-line bg-card p-6 sm:grid-cols-2">
            {SCHOOL_FIELDS.map((f) => (
              <label key={f.key} className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink">
                  {f.label} {f.required && <span className="text-danger">*</span>}
                </span>
                <input className={inputCls} value={(form[f.key] as string) ?? ""}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                {f.hint && <span className="text-[11px] text-muted">{f.hint}</span>}
              </label>
            ))}
          </div>

          {err && <ErrorBox msg={err} />}
          <div>
            <button onClick={submit} disabled={busy} className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Guardar cambios
            </button>
          </div>
        </>
      )}
    </>
  );
}

/* ══════════ Año lectivo y periodos ══════════ */

function AnioSection({ onSaved }: { onSaved: (t: string) => void }) {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [newYearOpen, setNewYearOpen] = useState(false);
  const [periodFor, setPeriodFor] = useState<AcademicPeriod | "nuevo" | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const ys = (await listYears()).sort((a, b) => b.year - a.year);
      setYears(ys);
      setSelected((prev) => prev || ys.find((y) => y.isCurrent)?.id || ys[0]?.id || "");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudieron cargar los años lectivos.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const loadPeriods = useCallback(async () => {
    if (!selected) { setPeriods([]); return; }
    setPeriods(await getPeriods(selected));
  }, [selected]);
  useEffect(() => { loadPeriods(); }, [loadPeriods]);

  const year = years.find((y) => y.id === selected) ?? null;
  const pesoTotal = periods.reduce((a, p) => a + Number((p as { weightPercent?: number }).weightPercent ?? 0), 0);

  const marcarVigente = async () => {
    if (!year) return;
    setBusy(true);
    try {
      await updateYear(year.id, { isCurrent: true });
      await load();
      onSaved(`El año ${year.year} quedó como año lectivo vigente.`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo marcar como vigente.");
    } finally { setBusy(false); }
  };

  const crearSugeridos = async () => {
    if (!year) return;
    const y = year as AcademicYear & { startDate?: string; endDate?: string };
    if (!y.startDate || !y.endDate) { setErr("El año lectivo no tiene fechas de inicio y fin."); return; }
    setBusy(true); setErr(null);
    try {
      for (const p of suggestPeriods(y.startDate, y.endDate)) {
        await createPeriod({ academicYearId: year.id, ...p });
      }
      await loadPeriods();
      onSaved("Se crearon los 4 periodos del año. Ajusta las fechas si hace falta.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudieron crear los periodos.");
    } finally { setBusy(false); }
  };

  return (
    <>
      <Header eyebrow="CONFIGURACIÓN · COLEGIO" title="Año lectivo y periodos"
        sub="Abre el año, define sus periodos y el peso de cada uno en la nota final." />

      {loading ? (
        <div className="flex items-center gap-2 py-16 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2.5">
            {years.map((y) => (
              <button key={y.id} onClick={() => setSelected(y.id)}
                className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${selected === y.id ? "bg-primary font-bold text-white" : "border border-line font-medium text-ink hover:bg-surface"}`}>
                {y.year}
                {y.isCurrent && <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${selected === y.id ? "bg-white/20" : "bg-s-success text-s-success-fg"}`}>vigente</span>}
              </button>
            ))}
            <button onClick={() => setNewYearOpen(true)} className="flex items-center gap-1.5 rounded-full border border-dashed border-line px-3.5 py-1.5 text-[13px] font-semibold text-primary transition-colors hover:bg-surface">
              <Plus className="h-3.5 w-3.5" /> Nuevo año lectivo
            </button>
          </div>

          {!year ? (
            <div className="rounded-2xl border border-line bg-card py-14 text-center text-sm text-subtle">
              Todavía no hay ningún año lectivo. Crea el primero para poder matricular, calificar y facturar.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-card p-6">
                <div className="flex flex-col gap-1">
                  <span className="text-[20px] font-bold text-ink">Año lectivo {year.year}</span>
                  <span className="text-[13px] text-subtle">
                    {fmtDate((year as { startDate?: string }).startDate)} — {fmtDate((year as { endDate?: string }).endDate)}
                  </span>
                </div>
                {year.isCurrent ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-s-success px-3 py-1.5 text-[12px] font-bold text-s-success-fg"><Check className="h-3.5 w-3.5" /> Año vigente</span>
                ) : (
                  <button onClick={marcarVigente} disabled={busy} className="flex h-9 items-center gap-2 rounded-lg border border-line px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface disabled:opacity-40">
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Calendar className="h-3.5 w-3.5" />} Marcar como vigente
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-4 rounded-2xl border border-line bg-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <h3 className="text-sm font-bold text-ink">Periodos</h3>
                    <span className="text-xs text-subtle">
                      {periods.length
                        ? <>Los pesos suman <b className={Math.abs(pesoTotal - 100) < 0.01 ? "text-ink" : "text-danger"}>{pesoTotal}%</b>{Math.abs(pesoTotal - 100) >= 0.01 && " — deberían sumar 100%"}</>
                        : "Sin periodos definidos: no se pueden registrar notas."}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {periods.length === 0 && (
                      <button onClick={crearSugeridos} disabled={busy} className="flex h-9 items-center gap-2 rounded-lg border border-line px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface disabled:opacity-40">
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Crear 4 periodos
                      </button>
                    )}
                    <button onClick={() => setPeriodFor("nuevo")} className="flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90">
                      <Plus className="h-3.5 w-3.5" /> Agregar periodo
                    </button>
                  </div>
                </div>

                {periods.length > 0 && (
                  <div className="flex flex-col overflow-hidden rounded-xl border border-line">
                    <div className="flex items-center gap-3 border-b border-line bg-surface px-4 py-2.5 text-[11px] font-bold tracking-[0.1em] text-subtle">
                      <span className="w-[40px]">#</span>
                      <span className="flex-1">NOMBRE</span>
                      <span className="w-[200px]">FECHAS</span>
                      <span className="w-[70px] text-right">PESO</span>
                      <span className="w-[90px]">ESTADO</span>
                      <span className="w-[70px]" />
                    </div>
                    {periods.map((p, i) => (
                      <div key={p.id} className={`flex items-center gap-3 px-4 py-2.5 ${i < periods.length - 1 ? "border-b border-line" : ""}`}>
                        <span className="w-[40px] text-[13px] font-bold text-primary">P{p.periodNumber}</span>
                        <span className="flex-1 text-[13px] font-semibold text-ink">{p.name}</span>
                        <span className="w-[200px] text-[12px] text-subtle">{fmtDate(p.startDate)} — {fmtDate(p.endDate)}</span>
                        <span className="w-[70px] text-right text-[13px] font-semibold text-ink">{Number((p as { weightPercent?: number }).weightPercent ?? 0)}%</span>
                        <span className="w-[90px]">
                          {p.isClosed
                            ? <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-subtle"><Lock className="h-2.5 w-2.5" /> Cerrado</span>
                            : <span className="inline-flex rounded-full bg-s-success px-2 py-0.5 text-[11px] font-semibold text-s-success-fg">Abierto</span>}
                        </span>
                        <div className="flex w-[70px] justify-end">
                          <button onClick={() => setPeriodFor(p)} className="rounded-lg border border-line px-2.5 py-1 text-[12px] font-semibold text-ink transition-colors hover:bg-surface">Editar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[12px] text-muted">
                  Cerrar y reabrir periodos se hace en <b>Académico → Cierre de periodo</b>; aquí solo se definen.
                </p>
              </div>
            </>
          )}

          {err && <ErrorBox msg={err} />}
        </>
      )}

      {newYearOpen && (
        <NewYearModal existentes={years.map((y) => y.year)} onClose={() => setNewYearOpen(false)}
          onDone={async (y) => { setNewYearOpen(false); await load(); setSelected(y.id); onSaved(`Año lectivo ${y.year} creado.`); }} />
      )}
      {periodFor && year && (
        <PeriodModal yearId={year.id} period={periodFor === "nuevo" ? null : periodFor}
          siguienteNumero={Math.max(0, ...periods.map((p) => p.periodNumber)) + 1}
          onClose={() => setPeriodFor(null)}
          onDone={async (msg) => { setPeriodFor(null); await loadPeriods(); onSaved(msg); }} />
      )}
    </>
  );
}

function NewYearModal({ existentes, onClose, onDone }: {
  existentes: number[]; onClose: () => void; onDone: (y: AcademicYear) => void;
}) {
  const proximo = (existentes.length ? Math.max(...existentes) : new Date().getFullYear() - 1) + 1;
  const [year, setYear] = useState(proximo);
  const [startDate, setStartDate] = useState(`${proximo}-01-20`);
  const [endDate, setEndDate] = useState(`${proximo}-11-30`);
  const [isCurrent, setIsCurrent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    if (existentes.includes(year)) { setErr(`El año ${year} ya existe.`); return; }
    if (startDate >= endDate) { setErr("La fecha de inicio debe ser anterior a la de cierre."); return; }
    setBusy(true);
    try {
      onDone(await createYear({ year, startDate, endDate, isCurrent }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo crear el año lectivo.");
    } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} title="Nuevo año lectivo" subtitle="Después podrás crear sus periodos y sus cursos." width={460}>
      <FormField label="Año">
        <input type="number" min={2000} max={2100} className={inputCls} value={year} onChange={(e) => setYear(Number(e.target.value))} />
      </FormField>
      <div className="flex gap-3">
        <div className="flex-1"><FormField label="Inicio">
          <input type="date" className={inputCls} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </FormField></div>
        <div className="flex-1"><FormField label="Cierre">
          <input type="date" className={inputCls} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </FormField></div>
      </div>
      <label className="flex cursor-pointer items-center gap-2.5 rounded-lg bg-surface px-3.5 py-2.5">
        <input type="checkbox" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} className="h-4 w-4 accent-[color:var(--primary,#7C3AED)]" />
        <span className="text-[13px] text-ink">Marcarlo como el año vigente</span>
      </label>
      <p className="text-[12px] text-muted">
        El año vigente es el que usan por defecto matrículas, calificaciones y finanzas. Solo puede haber uno.
      </p>
      {err && <ErrorBox msg={err} />}
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onClose} className="flex h-9 items-center rounded-lg border border-line px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">Cancelar</button>
        <button onClick={submit} disabled={busy} className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Crear
        </button>
      </div>
    </Modal>
  );
}

function PeriodModal({ yearId, period, siguienteNumero, onClose, onDone }: {
  yearId: string; period: AcademicPeriod | null; siguienteNumero: number;
  onClose: () => void; onDone: (msg: string) => void;
}) {
  const p = period as (AcademicPeriod & { weightPercent?: number }) | null;
  const [name, setName] = useState(p?.name ?? `Periodo ${siguienteNumero}`);
  const [periodNumber, setPeriodNumber] = useState(p?.periodNumber ?? siguienteNumero);
  const [startDate, setStartDate] = useState(p?.startDate?.slice(0, 10) ?? today());
  const [endDate, setEndDate] = useState(p?.endDate?.slice(0, 10) ?? today());
  const [weight, setWeight] = useState(String(Number(p?.weightPercent ?? 25)));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    if (!name.trim()) { setErr("El nombre es obligatorio."); return; }
    if (startDate >= endDate) { setErr("La fecha de inicio debe ser anterior a la de cierre."); return; }
    const w = Number(weight);
    if (!(w >= 0 && w <= 100)) { setErr("El peso debe estar entre 0 y 100."); return; }
    setBusy(true);
    try {
      if (p) {
        await updatePeriod(p.id, { name: name.trim(), startDate, endDate, weightPercent: w });
        onDone("Periodo actualizado.");
      } else {
        await createPeriod({ academicYearId: yearId, name: name.trim(), periodNumber, startDate, endDate, weightPercent: w });
        onDone("Periodo creado.");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo guardar el periodo.");
    } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} title={p ? `Editar ${p.name}` : "Nuevo periodo"} width={460}>
      <FormField label="Nombre"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></FormField>
      {!p && (
        <FormField label="Número de periodo">
          <input type="number" min={1} max={6} className={inputCls} value={periodNumber} onChange={(e) => setPeriodNumber(Number(e.target.value))} />
        </FormField>
      )}
      <div className="flex gap-3">
        <div className="flex-1"><FormField label="Inicio">
          <input type="date" className={inputCls} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </FormField></div>
        <div className="flex-1"><FormField label="Cierre">
          <input type="date" className={inputCls} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </FormField></div>
      </div>
      <FormField label="Peso en la nota final (%)">
        <input type="number" min={0} max={100} step={0.5} className={inputCls} value={weight} onChange={(e) => setWeight(e.target.value)} />
      </FormField>
      <p className="text-[12px] text-muted">Entre todos los periodos el peso debe sumar 100%.</p>
      {err && <ErrorBox msg={err} />}
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onClose} className="flex h-9 items-center rounded-lg border border-line px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">Cancelar</button>
        <button onClick={submit} disabled={busy} className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Guardar
        </button>
      </div>
    </Modal>
  );
}

/* ══════════ Escala de valoración ══════════ */

function EscalaSection({ onSaved }: { onSaved: (t: string) => void }) {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [yearId, setYearId] = useState("");
  const [rows, setRows] = useState<GradeScaleRow[]>(DEFAULT_SCALE);
  const [guardada, setGuardada] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const ys = (await listYears()).sort((a, b) => b.year - a.year);
        setYears(ys);
        setYearId(ys.find((y) => y.isCurrent)?.id ?? ys[0]?.id ?? "");
      } catch (e) {
        setErr(e instanceof Error ? e.message : "No se pudieron cargar los años.");
      } finally { setLoading(false); }
    })();
  }, []);

  const load = useCallback(async () => {
    if (!yearId) return;
    try {
      const cfg = await getGradeScales(yearId);
      setGuardada(cfg.length > 0);
      setRows(cfg.length ? SCALE_ORDER.map((s) => cfg.find((c) => c.scale === s) ?? DEFAULT_SCALE.find((d) => d.scale === s)!) : DEFAULT_SCALE);
    } catch {
      setRows(DEFAULT_SCALE); setGuardada(false);
    }
  }, [yearId]);
  useEffect(() => { load(); }, [load]);

  const numericas = useMemo(
    () => rows.map((r) => ({ scale: r.scale, minScore: Number(r.minScore), maxScore: Number(r.maxScore) })),
    [rows],
  );
  const problemas = useMemo(() => validateScale(numericas), [numericas]);

  const setVal = (scale: ScaleKey, field: "minScore" | "maxScore", value: string) =>
    setRows((rs) => rs.map((r) => (r.scale === scale ? { ...r, [field]: value } : r)));

  const submit = async () => {
    setErr(null); setBusy(true);
    try {
      await saveGradeScales(yearId, numericas);
      await load();
      onSaved("Escala de valoración guardada.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo guardar la escala.");
    } finally { setBusy(false); }
  };

  return (
    <>
      <Header eyebrow="CONFIGURACIÓN · COLEGIO" title="Escala de valoración"
        sub="Cómo se traduce la nota numérica a desempeño en boletines y certificados (Decreto 1290 de 2009)." />

      {loading ? (
        <div className="flex items-center gap-2 py-16 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>
      ) : !years.length ? (
        <div className="rounded-2xl border border-line bg-card py-14 text-center text-sm text-subtle">
          Crea primero un año lectivo en <b>Año lectivo y periodos</b>.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2.5">
            {years.map((y) => (
              <button key={y.id} onClick={() => setYearId(y.id)}
                className={`rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${yearId === y.id ? "bg-primary font-bold text-white" : "border border-line font-medium text-ink hover:bg-surface"}`}>
                {y.year}
              </button>
            ))}
          </div>

          {!guardada && (
            <div className="flex items-start gap-2.5 rounded-xl bg-s-info px-4 py-3 text-[13px] text-s-info-fg">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              Este año no tiene escala propia: se está usando la nacional por defecto que se muestra abajo.
              Guárdala (o ajústala) para dejarla registrada.
            </div>
          )}

          <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
            <div className="flex items-center gap-3 border-b border-line bg-surface px-5 py-3 text-[11px] font-bold tracking-[0.1em] text-subtle">
              <span className="flex-1">DESEMPEÑO</span>
              <span className="w-[120px] text-center">DESDE</span>
              <span className="w-[120px] text-center">HASTA</span>
            </div>
            {SCALE_ORDER.map((s, i) => {
              const row = rows.find((r) => r.scale === s);
              if (!row) return null;
              return (
                <div key={s} className={`flex items-center gap-3 px-5 py-3 ${i < SCALE_ORDER.length - 1 ? "border-b border-line" : ""}`}>
                  <div className="flex flex-1 items-center gap-2.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${SCALE_CHIP[s]}`}>{SCALE_LABEL[s]}</span>
                  </div>
                  <input type="number" min={0} max={5} step={0.01} value={row.minScore}
                    onChange={(e) => setVal(s, "minScore", e.target.value)}
                    className={`${inputCls} w-[120px] text-center`} />
                  <input type="number" min={0} max={5} step={0.01} value={row.maxScore}
                    onChange={(e) => setVal(s, "maxScore", e.target.value)}
                    className={`${inputCls} w-[120px] text-center`} />
                </div>
              );
            })}
          </div>

          {problemas.length > 0 && (
            <div className="flex flex-col gap-1.5 rounded-xl bg-s-warning px-4 py-3 text-[13px] text-s-warning-fg">
              {problemas.map((p) => (
                <span key={p} className="flex items-start gap-2"><TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {p}</span>
              ))}
            </div>
          )}
          {err && <ErrorBox msg={err} />}

          <div className="flex items-center gap-3">
            <button onClick={submit} disabled={busy || problemas.length > 0} className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Guardar escala
            </button>
            <button onClick={() => setRows(DEFAULT_SCALE)} className="flex h-10 items-center gap-2 rounded-lg border border-line px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">
              <GraduationCap className="h-4 w-4" /> Restaurar la nacional
            </button>
          </div>
        </>
      )}
    </>
  );
}
