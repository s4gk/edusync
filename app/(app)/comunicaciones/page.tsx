"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Mail, Megaphone, Plus, Users, Loader2, TriangleAlert, CheckCircle2, Send, Trash2 } from "lucide-react";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { Modal, FormField, inputCls } from "@/components/modal";
import { getCurrentYear, getGroups, gradeLabel, type Group } from "@/lib/academic";

type Announcement = {
  id: string;
  title: string;
  body: string;
  target: string;
  gradeLevel: number | null;
  gradeGroupId: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  author?: { firstName: string; lastName: string };
};
type Paginated<T> = { data: T[]; meta: { total: number } };

const TARGET_LABEL: Record<string, string> = {
  ALL: "Toda la comunidad",
  GRADE_LEVEL: "Por grado",
  GRADE_GROUP: "Por grupo",
  STUDENT: "Estudiante",
};
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" });

/** Un comunicado publicado ya generó notificaciones a las familias: borrarlo no
 *  las deshace, así que se pide confirmación explícita. */
const CONFIRM_BORRAR =
  "Se eliminará el comunicado. Las notificaciones que ya recibieron las familias no se retiran. ¿Continuar?";

export default function ComunicacionesPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // crear comunicado
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", target: "ALL", gradeLevel: "", gradeGroupId: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [borrando, setBorrando] = useState<string | null>(null);

  // Cursos del año vigente: hacen falta para segmentar por grado o por curso.
  const [groups, setGroups] = useState<Group[]>([]);
  useEffect(() => {
    getCurrentYear()
      .then((y) => (y ? getGroups(y.id) : []))
      .then(setGroups)
      .catch(() => setGroups([]));
  }, []);

  const grados = useMemo(
    () => [...new Set(groups.map((g) => g.gradeLevel))].sort((a, b) => a - b),
    [groups],
  );
  const groupName = useCallback(
    (id: string | null) => groups.find((g) => g.id === id)?.name ?? "un curso",
    [groups],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<Announcement[] | Paginated<Announcement>>("/communications/announcements?limit=50");
      setItems(Array.isArray(res) ? res : res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar las comunicaciones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createAnnouncement = async () => {
    setFormError(null);
    if (!form.title.trim() || !form.body.trim()) { setFormError("Título y mensaje son obligatorios."); return; }
    if (form.target === "GRADE_LEVEL" && form.gradeLevel === "") { setFormError("Elige el grado al que va dirigido."); return; }
    if (form.target === "GRADE_GROUP" && !form.gradeGroupId) { setFormError("Elige el curso al que va dirigido."); return; }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        body: form.body.trim(),
        target: form.target,
      };
      if (form.target === "GRADE_LEVEL") payload.gradeLevel = Number(form.gradeLevel);
      if (form.target === "GRADE_GROUP") payload.gradeGroupId = form.gradeGroupId;

      const created = await apiPost<{ id: string }>("/communications/announcements", payload);
      // Publicar de inmediato: es lo que dispara las notificaciones a las
      // familias del segmento elegido.
      if (created?.id) await apiPost(`/communications/announcements/${created.id}/publish`, {});
      setModalOpen(false);
      setForm({ title: "", body: "", target: "ALL", gradeLevel: "", gradeGroupId: "" });
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "No se pudo publicar el comunicado.");
    } finally { setSaving(false); }
  };

  const removeAnnouncement = async (id: string) => {
    if (!window.confirm(CONFIRM_BORRAR)) return;
    setBorrando(id);
    try {
      await apiDelete(`/communications/announcements/${id}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar el comunicado.");
    } finally { setBorrando(null); }
  };

  /** Etiqueta del destinatario, con el grado/curso concreto cuando aplica. */
  const targetLabel = (a: Announcement) => {
    if (a.target === "GRADE_LEVEL" && a.gradeLevel != null) return gradeLabel(a.gradeLevel);
    if (a.target === "GRADE_GROUP") return `Curso ${groupName(a.gradeGroupId)}`;
    return TARGET_LABEL[a.target] ?? a.target;
  };

  return (
    <div className="flex flex-col gap-6 px-8 py-7">
      <div className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold tracking-[0.18em] text-primary">OPERACIÓN</span>
          <h1 className="text-[28px] font-bold -tracking-[0.02em] text-ink">Comunicaciones</h1>
          <p className="text-[13px] text-subtle">
            {loading ? "Cargando…" : `${items.length} comunicado${items.length === 1 ? "" : "s"} publicado${items.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90">
          <Plus className="h-3.5 w-3.5" />
          Nuevo comunicado
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-card py-16 text-sm text-subtle">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando comunicaciones…
        </div>
      ) : error ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-card py-16 text-sm text-s-error-fg">
          <TriangleAlert className="h-4 w-4" /> {error}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-card py-16 text-center text-sm text-subtle">
          <Mail className="h-6 w-6 text-muted" />
          Aún no hay comunicados publicados.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((a) => (
            <div key={a.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-tint text-primary">
                    <Megaphone className="h-5 w-5" />
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[15px] font-semibold text-ink">{a.title}</span>
                    <span className="flex items-center gap-1.5 text-[11px] text-subtle">
                      <Users className="h-3 w-3" /> {targetLabel(a)}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {a.isPublished && (
                    <span className="flex items-center gap-1 rounded-full bg-s-success px-2 py-0.5 text-[11px] font-semibold text-s-success-fg">
                      <CheckCircle2 className="h-3 w-3" /> Publicado
                    </span>
                  )}
                  <button onClick={() => removeAnnouncement(a.id)} disabled={borrando === a.id}
                    title="Eliminar comunicado"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-s-error hover:text-s-error-fg disabled:opacity-40">
                    {borrando === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <p className="text-[13px] leading-relaxed text-subtle">{a.body}</p>
              <div className="flex items-center gap-2 text-[11px] text-muted">
                <span>{fmtDate(a.publishedAt ?? a.createdAt)}</span>
                {a.author && (
                  <>
                    <span>·</span>
                    <span>{a.author.firstName} {a.author.lastName}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* modal nuevo comunicado */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo comunicado" subtitle="Se publica de inmediato y notifica a las familias del segmento elegido." width={520}>
        <FormField label="Título"><input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Reunión de padres de familia" /></FormField>
        <FormField label="Dirigido a">
          <select className={inputCls} value={form.target}
            onChange={(e) => setForm({ ...form, target: e.target.value, gradeLevel: "", gradeGroupId: "" })}>
            <option value="ALL">{TARGET_LABEL.ALL}</option>
            <option value="GRADE_LEVEL">{TARGET_LABEL.GRADE_LEVEL}</option>
            <option value="GRADE_GROUP">{TARGET_LABEL.GRADE_GROUP}</option>
          </select>
        </FormField>
        {form.target === "GRADE_LEVEL" && (
          <FormField label="Grado">
            <select className={inputCls} value={form.gradeLevel} onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })}>
              <option value="">Selecciona un grado…</option>
              {grados.map((g) => <option key={g} value={g}>{gradeLabel(g)}</option>)}
            </select>
          </FormField>
        )}
        {form.target === "GRADE_GROUP" && (
          <FormField label="Curso">
            <select className={inputCls} value={form.gradeGroupId} onChange={(e) => setForm({ ...form, gradeGroupId: e.target.value })}>
              <option value="">Selecciona un curso…</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name} · {gradeLabel(g.gradeLevel)}</option>)}
            </select>
          </FormField>
        )}
        <FormField label="Mensaje">
          <textarea rows={5} className={`${inputCls} h-auto py-2.5`} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Escribe el comunicado…" />
        </FormField>
        {formError && <div className="flex items-center gap-2 rounded-lg bg-s-error px-3 py-2 text-[13px] text-s-error-fg"><TriangleAlert className="h-4 w-4" /> {formError}</div>}
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={() => setModalOpen(false)} className="flex h-9 items-center rounded-lg border border-line px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">Cancelar</button>
          <button onClick={createAnnouncement} disabled={saving} className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Publicar
          </button>
        </div>
      </Modal>
    </div>
  );
}
