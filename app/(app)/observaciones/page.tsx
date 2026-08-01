"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquareWarning, ChevronLeft, ChevronRight, Loader2, TriangleAlert, Plus } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { Modal, FormField, inputCls } from "@/components/modal";

type Obs = {
  id: string;
  type: string;
  content: string;
  date: string;
  student: { enrollmentCode: string; user: { firstName: string; lastName: string } };
};
type Paginated<T> = { data: T[]; meta: { total: number; page: number; limit: number; totalPages: number } };

const TYPE_META: Record<string, { label: string; chip: string }> = {
  ACADEMIC: { label: "Académica", chip: "bg-s-info text-s-info-fg" },
  DISCIPLINARY_POSITIVE: { label: "Positiva", chip: "bg-s-success text-s-success-fg" },
  DISCIPLINARY_NEUTRAL: { label: "Neutral", chip: "bg-surface text-subtle" },
  DISCIPLINARY_MILD: { label: "Falta leve", chip: "bg-s-warning text-s-warning-fg" },
  DISCIPLINARY_SERIOUS: { label: "Falta grave", chip: "bg-s-error text-s-error-fg" },
  DISCIPLINARY_VERY_SERIOUS: { label: "Muy grave", chip: "bg-s-error text-s-error-fg" },
};
const typeMeta = (t: string) => TYPE_META[t] ?? { label: t, chip: "bg-surface text-subtle" };
const initials = (f: string, l: string) => `${f?.[0] ?? ""}${l?.[0] ?? ""}`.toUpperCase();
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });

const TABS: { label: string; type: string | null }[] = [
  { label: "Todas", type: null },
  { label: "Académicas", type: "ACADEMIC" },
  { label: "Positivas", type: "DISCIPLINARY_POSITIVE" },
  { label: "Leves", type: "DISCIPLINARY_MILD" },
  { label: "Graves", type: "DISCIPLINARY_SERIOUS" },
];

const PAGE_SIZE = 12;

export default function ObservacionesPage() {
  const [items, setItems] = useState<Obs[]>([]);
  const [meta, setMeta] = useState<Paginated<Obs>["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(1);

  // crear observación
  const [modalOpen, setModalOpen] = useState(false);
  const [students, setStudents] = useState<{ id: string; label: string }[]>([]);
  const [form, setForm] = useState({ studentId: "", type: "ACADEMIC", content: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!modalOpen || students.length) return;
    apiGet<{ data: { id: string; enrollmentCode: string; user: { firstName: string; lastName: string } }[] }>("/students?limit=200")
      .then((r) => setStudents(r.data.map((s) => ({ id: s.id, label: `${s.user.firstName} ${s.user.lastName} · ${s.enrollmentCode}` }))))
      .catch(() => setStudents([]));
  }, [modalOpen, students.length]);

  const createObs = async () => {
    setFormError(null);
    if (!form.studentId) { setFormError("Selecciona un estudiante."); return; }
    if (!form.content.trim()) { setFormError("Escribe el contenido de la observación."); return; }
    setSaving(true);
    try {
      await apiPost("/observations", { studentId: form.studentId, type: form.type, content: form.content.trim() });
      setModalOpen(false);
      setForm({ studentId: "", type: "ACADEMIC", content: "" });
      setTab(0); setPage(1); load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "No se pudo crear la observación.");
    } finally { setSaving(false); }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      const type = TABS[tab].type;
      if (type) params.set("type", type);
      const res = await apiGet<Paginated<Obs>>(`/observations?${params.toString()}`);
      setItems(res.data);
      setMeta(res.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar las observaciones.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6 px-8 py-7">
      <div className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold tracking-[0.18em] text-primary">ACADÉMICO</span>
          <h1 className="text-[28px] font-bold -tracking-[0.02em] text-ink">Observaciones</h1>
          <p className="text-[13px] text-subtle">
            {meta ? `${meta.total.toLocaleString("es-CO")} observaciones registradas` : "Seguimiento académico y convivencial"}
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90">
          <Plus className="h-3.5 w-3.5" /> Nueva observación
        </button>
      </div>

      {/* filtros por tipo */}
      <div className="flex w-fit items-center gap-1 rounded-full bg-surface p-1">
        {TABS.map((t, i) => (
          <button
            key={t.label}
            onClick={() => { setTab(i); setPage(1); }}
            className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
              tab === i ? "border border-line bg-card font-semibold text-ink" : "font-medium text-subtle hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* lista */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-card py-16 text-sm text-subtle">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando observaciones…
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-card py-16 text-sm text-s-error-fg">
            <TriangleAlert className="h-4 w-4" /> {error}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-card py-16 text-center text-sm text-subtle">
            <MessageSquareWarning className="h-6 w-6 text-muted" />
            No hay observaciones en esta categoría.
          </div>
        ) : (
          items.map((o) => {
            const tm = typeMeta(o.type);
            return (
              <div key={o.id} className="flex gap-3.5 rounded-2xl border border-line bg-card p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-tint text-[12px] font-bold text-primary">
                  {initials(o.student.user.firstName, o.student.user.lastName)}
                </span>
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-ink">
                        {o.student.user.firstName} {o.student.user.lastName}
                      </span>
                      <span className="text-[11px] text-subtle">{o.student.enrollmentCode}</span>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tm.chip}`}>{tm.label}</span>
                  </div>
                  <p className="text-[13px] leading-relaxed text-subtle">{o.content}</p>
                  <span className="text-[11px] text-muted">{fmtDate(o.date)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* paginación */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2.5">
          <span className="text-xs text-subtle">Página {meta.page} de {meta.totalPages}</span>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={meta.page <= 1}
            className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-line text-subtle transition-colors hover:bg-surface disabled:opacity-40">
            <ChevronLeft className="h-3 w-3" />
          </button>
          <button onClick={() => setPage((p) => (p < meta.totalPages ? p + 1 : p))} disabled={meta.page >= meta.totalPages}
            className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-line text-ink transition-colors hover:bg-surface disabled:opacity-40">
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* modal nueva observación */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva observación" subtitle="Registro académico o convivencial del estudiante.">
        <FormField label="Estudiante">
          <select className={inputCls} value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
            <option value="">{students.length ? "Selecciona…" : "Cargando…"}</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </FormField>
        <FormField label="Tipo">
          <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </FormField>
        <FormField label="Contenido">
          <textarea rows={4} className={`${inputCls} h-auto py-2.5`} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Describe la observación…" />
        </FormField>
        {formError && <div className="flex items-center gap-2 rounded-lg bg-s-error px-3 py-2 text-[13px] text-s-error-fg"><TriangleAlert className="h-4 w-4" /> {formError}</div>}
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={() => setModalOpen(false)} className="flex h-9 items-center rounded-lg border border-line px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">Cancelar</button>
          <button onClick={createObs} disabled={saving} className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Registrar
          </button>
        </div>
      </Modal>
    </div>
  );
}
