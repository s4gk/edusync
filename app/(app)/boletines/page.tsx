"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Send, Loader2, TriangleAlert, GraduationCap, FileText, RefreshCw, CheckCheck } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { getCurrentYear, getGroups, initials, type Group } from "@/lib/academic";
import { useAuth } from "@/components/auth-context";

type ReportCard = {
  id: string; studentId: string; period: string; pdfUrl: string | null; isPublished: boolean;
  student: { user: { firstName: string; lastName: string }; enrollmentCode: string };
  gradeGroup: { name: string; gradeLevel: number };
};
type GradeRow = { subjectId: string; score: string; scale: string; subject: { name: string } };

const SCALE: Record<string, { label: string; chip: string }> = {
  SUPERIOR: { label: "Superior", chip: "bg-s-success text-s-success-fg" },
  ALTO: { label: "Alto", chip: "bg-s-info text-s-info-fg" },
  BASICO: { label: "Básico", chip: "bg-s-warning text-s-warning-fg" },
  BAJO: { label: "Bajo", chip: "bg-s-error text-s-error-fg" },
};
const AVATARS = [
  "bg-blue-100 text-blue-700", "bg-amber-100 text-amber-700", "bg-pink-100 text-pink-700", "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700", "bg-teal-100 text-teal-700", "bg-orange-100 text-orange-700", "bg-sky-100 text-sky-700",
];

export default function BoletinesPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === "TEACHER";
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState("");
  const [period, setPeriod] = useState(1);
  const [cards, setCards] = useState<ReportCard[]>([]);
  const [selected, setSelected] = useState<ReportCard | null>(null);
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const year = await getCurrentYear();
        if (!year) throw new Error("Sin año lectivo");
        const gs = await getGroups(year.id);
        setGroups(gs);
        if (gs[0]) setGroupId(gs[0].id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error de contexto."); setLoading(false);
      }
    })();
  }, []);

  const load = useCallback(async () => {
    if (!groupId) return;
    setLoading(true); setError(null);
    try {
      const rc = await apiGet<ReportCard[]>(`/report-cards?gradeGroupId=${groupId}&period=P${period}`);
      setCards(rc);
      setSelected((prev) => rc.find((c) => c.id === prev?.id) ?? rc[0] ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar los boletines.");
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [groupId, period]);

  useEffect(() => { load(); }, [load]);

  // notas del estudiante seleccionado (para la vista previa)
  useEffect(() => {
    if (!selected) { setGrades([]); return; }
    (async () => {
      try {
        const g = await apiGet<GradeRow[]>(`/grades?studentId=${selected.studentId}&periodNumber=${period}`);
        setGrades(g);
      } catch { setGrades([]); }
    })();
  }, [selected, period]);

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const generateGroup = async () => {
    if (!groupId) return;
    setBusy("gen"); setError(null);
    try {
      const r = await apiPost<{ queued: number }>(`/report-cards/generate/group/${groupId}`, { periodNumber: period });
      flash(`Generación encolada: ${r.queued} boletines. Recargando…`);
      setTimeout(load, 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar.");
    } finally { setBusy(null); }
  };

  const publishAll = async () => {
    if (!groupId) return;
    setBusy("pubAll"); setError(null);
    try {
      await apiPost(`/report-cards/publish-all/${groupId}`, { period: `P${period}` });
      flash("Boletines publicados para acudientes.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo publicar.");
    } finally { setBusy(null); }
  };

  const publishOne = async (id: string) => {
    setBusy(id);
    try { await apiPost(`/report-cards/${id}/publish`, {}); flash("Boletín publicado."); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudo publicar."); }
    finally { setBusy(null); }
  };

  const groupName = groups.find((g) => g.id === groupId)?.name ?? "";
  const avg = grades.length ? grades.reduce((a, g) => a + Number(g.score), 0) / grades.length : null;
  const publishedCount = cards.filter((c) => c.isPublished).length;

  return (
    <div className="flex flex-col gap-5 px-7 py-6">
      {/* header */}
      <div className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold tracking-[0.18em] text-primary">CIERRE DE PERIODO {period}</span>
          <h1 className="text-[28px] font-bold -tracking-[0.02em] text-ink">Boletines académicos</h1>
          <p className="text-[13px] text-subtle">{cards.length} boletines · {publishedCount} publicados {groupName ? `· ${groupName}` : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-1.5 text-xs">
            <span className="font-medium text-subtle">Grado</span>
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="bg-transparent text-[13px] font-semibold text-ink outline-none">
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-1.5 text-xs">
            <span className="font-medium text-subtle">Periodo</span>
            <select value={period} onChange={(e) => setPeriod(Number(e.target.value))} className="bg-transparent text-[13px] font-semibold text-ink outline-none">
              {[1, 2, 3, 4].map((n) => <option key={n} value={n}>P{n}</option>)}
            </select>
          </label>
          {!isTeacher && (
            <button onClick={publishAll} disabled={!cards.length || busy === "pubAll"} className="flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40">
              {busy === "pubAll" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Publicar todos
            </button>
          )}
        </div>
      </div>

      {toast && <div className="rounded-xl border border-emerald-300 bg-s-success px-4 py-2.5 text-[13px] font-medium text-s-success-fg">{toast}</div>}
      {error && <div className="flex items-center gap-2 rounded-xl border border-line bg-s-error px-4 py-2.5 text-[13px] text-s-error-fg"><TriangleAlert className="h-4 w-4" /> {error}</div>}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Cargando boletines…</div>
      ) : (
        <div className="flex flex-col gap-4 xl:flex-row">
          {/* izquierda: estudiantes */}
          <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-line bg-card xl:w-[300px] xl:shrink-0">
            <div className="flex items-center justify-between border-b border-line p-4">
              <span className="text-sm font-semibold text-ink">Estudiantes</span>
              <span className="text-[11px] text-subtle">{groupName} · {cards.length}</span>
            </div>
            <div className="flex max-h-[640px] flex-col gap-1 overflow-y-auto p-2">
              {cards.length === 0 ? (
                <div className="flex flex-col items-center gap-2 p-8 text-center text-xs text-subtle">
                  <GraduationCap className="h-6 w-6 text-muted" /> No hay boletines generados{isTeacher ? " para este grupo." : "."}
                  {!isTeacher && (
                    <button onClick={generateGroup} disabled={busy === "gen"} className="mt-1 flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-white disabled:opacity-40">
                      {busy === "gen" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Generar grupo
                    </button>
                  )}
                </div>
              ) : cards.map((c, i) => {
                const on = c.id === selected?.id;
                return (
                  <button key={c.id} onClick={() => setSelected(c)} className={`flex items-center gap-2.5 rounded-[10px] p-2.5 text-left transition-colors ${on ? "bg-surface" : "hover:bg-surface/60"}`}>
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${AVATARS[i % AVATARS.length]}`}>{initials(c.student.user.firstName, c.student.user.lastName)}</span>
                    <div className="flex flex-1 flex-col">
                      <span className="text-[13px] font-semibold text-ink">{c.student.user.firstName} {c.student.user.lastName}</span>
                      <span className="text-[11px] text-subtle">{c.student.enrollmentCode}</span>
                    </div>
                    <span className={`h-2 w-2 rounded-full ${c.isPublished ? "bg-emerald-500" : "bg-amber-500"}`} title={c.isPublished ? "Publicado" : "Generado"} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* centro: vista previa */}
          <div className="flex flex-1 flex-col gap-3 rounded-2xl bg-surface p-5">
            <span className="text-xs font-medium text-subtle">Vista previa del boletín</span>
            {!selected ? (
              <div className="flex flex-1 items-center justify-center py-20 text-sm text-subtle">Selecciona un estudiante.</div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-line bg-card shadow-card">
                <div className="flex items-center gap-3.5 px-6 py-5 text-white" style={{ background: "var(--grad-primary)" }}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15"><GraduationCap className="h-6 w-6" /></span>
                  <div className="flex flex-1 flex-col">
                    <span className="text-base font-bold tracking-wide">COLEGIO EDUSYNC</span>
                    <span className="text-[11px] text-white/80">Boletín · {selected.gradeGroup.name} · Periodo {period}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-white/70">Promedio</span>
                    <span className="text-xl font-bold">{avg === null ? "—" : avg.toFixed(1)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 border-b border-line px-6 py-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-s-info text-xs font-bold text-s-info-fg">{initials(selected.student.user.firstName, selected.student.user.lastName)}</span>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-ink">{selected.student.user.firstName} {selected.student.user.lastName}</span>
                    <span className="text-xs text-subtle">{selected.gradeGroup.name} · {selected.student.enrollmentCode}</span>
                  </div>
                  <span className={`ml-auto rounded-full px-2.5 py-1 text-[11px] font-semibold ${selected.isPublished ? "bg-s-success text-s-success-fg" : "bg-s-warning text-s-warning-fg"}`}>{selected.isPublished ? "Publicado" : "Sin publicar"}</span>
                </div>

                <div className="flex items-center gap-2 bg-surface px-6 py-2.5 text-[10px] font-bold tracking-[0.1em] text-subtle">
                  <span className="flex-1">ÁREA / ASIGNATURA</span>
                  <span className="w-14 text-center">DEF.</span>
                  <span className="w-[88px] text-right">DESEMPEÑO</span>
                </div>
                {grades.length === 0 ? (
                  <div className="px-6 py-8 text-center text-xs text-subtle">Sin notas finales registradas para este periodo.</div>
                ) : grades.map((g) => {
                  const sc = SCALE[g.scale] ?? { label: g.scale, chip: "bg-surface text-ink" };
                  return (
                    <div key={g.subjectId} className="flex items-center gap-2 border-b border-line px-6 py-3">
                      <span className="flex-1 text-[13px] font-medium text-ink">{g.subject.name}</span>
                      <span className="w-14 text-center text-[13px] font-bold tabular-nums text-ink">{Number(g.score).toFixed(1)}</span>
                      <span className="flex w-[88px] justify-end"><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${sc.chip}`}>{sc.label}</span></span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* derecha: acciones */}
          <div className="flex w-full flex-col gap-3 rounded-2xl border border-line bg-card p-5 xl:w-[300px] xl:shrink-0">
            <span className="text-sm font-semibold text-ink">Acciones</span>
            {!isTeacher && (
              <button onClick={generateGroup} disabled={busy === "gen"} className="flex h-10 items-center justify-center gap-2 rounded-[10px] border border-line text-[13px] font-semibold text-ink transition-colors hover:bg-surface disabled:opacity-40">
                {busy === "gen" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Regenerar grupo
              </button>
            )}
            {selected && (
              <>
                {selected.pdfUrl && (
                  <a href={selected.pdfUrl} target="_blank" rel="noreferrer" className="flex h-10 items-center justify-center gap-2 rounded-[10px] border border-line text-[13px] font-semibold text-ink transition-colors hover:bg-surface">
                    <Download className="h-4 w-4" /> Descargar PDF
                  </a>
                )}
                {!selected.isPublished && (
                  <button onClick={() => publishOne(selected.id)} disabled={busy === selected.id} className="flex h-10 items-center justify-center gap-2 rounded-[10px] bg-primary text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40">
                    {busy === selected.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />} Publicar este boletín
                  </button>
                )}
              </>
            )}
            <div className="mt-1 flex flex-col gap-2 rounded-xl bg-surface p-3.5">
              <span className="text-[9px] font-bold tracking-[0.12em] text-subtle">RESUMEN DEL GRUPO</span>
              <div className="flex items-center justify-between text-[13px]"><span className="text-subtle">Generados</span><span className="font-semibold text-ink">{cards.length}</span></div>
              <div className="flex items-center justify-between text-[13px]"><span className="text-subtle">Publicados</span><span className="font-semibold text-emerald-600">{publishedCount}</span></div>
              <div className="flex items-center justify-between text-[13px]"><span className="text-subtle">Pendientes</span><span className="font-semibold text-amber-600">{cards.length - publishedCount}</span></div>
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-surface p-3 text-[11px] text-subtle">
              <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              Los PDFs se generan en segundo plano. Si acabas de regenerar, recarga en unos segundos.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
