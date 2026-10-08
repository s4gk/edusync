"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Send, Sparkles, MessageSquareWarning, Users, BookOpen, GraduationCap, TriangleAlert } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { Modal } from "@/components/modal";
import { scaleOf } from "@/lib/academic";
import { useAuth } from "@/components/auth-context";

type StudentInfo = {
  id: string; enrollmentCode?: string; documentId?: string;
  user: { firstName: string; lastName: string };
  gradeGroup?: { name?: string } | null;
  guardians?: { isPrimary?: boolean; guardian: { user: { firstName: string; lastName: string; phone?: string | null } } }[];
};
type Grade = { id: string; score: number | string; subject?: { name: string } };
type Observation = { id: string; type: string; content: string; date?: string; createdAt?: string };

const OBS_TYPES = [
  { id: "ACADEMIC", label: "Académica" },
  { id: "DISCIPLINARY_POSITIVE", label: "Reconocimiento" },
  { id: "DISCIPLINARY_NEUTRAL", label: "Neutral" },
  { id: "DISCIPLINARY_MILD", label: "Falta leve" },
  { id: "DISCIPLINARY_SERIOUS", label: "Falta grave" },
  { id: "DISCIPLINARY_VERY_SERIOUS", label: "Falta muy grave" },
];
const OBS_LABEL: Record<string, string> = Object.fromEntries(OBS_TYPES.map((t) => [t.id, t.label]));
const PHRASES: Record<string, string[]> = {
  ACADEMIC: [
    "Muestra excelente disposición y compromiso con su proceso de aprendizaje.",
    "Debe reforzar hábitos de estudio y entrega oportuna de trabajos.",
    "Participa activamente y aporta ideas valiosas en clase.",
  ],
  DISCIPLINARY_POSITIVE: [
    "Destaca por su liderazgo positivo y respeto hacia sus compañeros.",
    "Reconocimiento por su colaboración y buen comportamiento durante el periodo.",
  ],
  DISCIPLINARY_MILD: [
    "Presenta interrupciones frecuentes durante la clase; se hace llamado de atención.",
    "Debe mejorar la puntualidad y el cumplimiento de las normas del aula.",
  ],
  DISCIPLINARY_SERIOUS: ["Se cita al acudiente para tratar la situación presentada y acordar compromisos."],
};
const initialsOf = (f: string, l: string) => `${f?.[0] ?? ""}${l?.[0] ?? ""}`.toUpperCase();

export function StudentQuickView({ open, onClose, studentId }: { open: boolean; onClose: () => void; studentId: string | null }) {
  const { user } = useAuth();
  // El docente solo puede registrar académicas y reconocimientos; el resto es de Convivencia.
  const allowedTypes = user?.role === "TEACHER"
    ? OBS_TYPES.filter((t) => t.id === "ACADEMIC" || t.id === "DISCIPLINARY_POSITIVE")
    : OBS_TYPES;

  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [obs, setObs] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(false);

  const [obsType, setObsType] = useState("ACADEMIC");
  const [obsText, setObsText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadObs = useCallback(async () => {
    if (!studentId) return;
    try { setObs(await apiGet<Observation[]>(`/observations/student/${studentId}`)); } catch { /* */ }
  }, [studentId]);

  useEffect(() => {
    if (!open || !studentId) return;
    setLoading(true); setError(null); setObsText(""); setObsType("ACADEMIC");
    (async () => {
      try {
        const st = await apiGet<StudentInfo>(`/students/${studentId}`);
        setStudent(st);
        await Promise.all([
          apiGet<Grade[]>(`/grades?studentId=${studentId}`).then(setGrades).catch(() => setGrades([])),
          loadObs(),
        ]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo cargar el estudiante.");
      } finally { setLoading(false); }
    })();
  }, [open, studentId, loadObs]);

  // promedio por materia → promedio general
  const bySubject = new Map<string, { sum: number; n: number }>();
  for (const g of grades) {
    const s = Number(g.score);
    if (!Number.isFinite(s)) continue;
    const k = g.subject?.name ?? "—";
    const e = bySubject.get(k) ?? { sum: 0, n: 0 };
    e.sum += s; e.n += 1; bySubject.set(k, e);
  }
  const subjAvgs = [...bySubject.values()].map(({ sum, n }) => sum / n);
  const promedio = subjAvgs.length ? subjAvgs.reduce((a, b) => a + b, 0) / subjAvgs.length : null;
  const primary = student?.guardians?.find((g) => g.isPrimary) ?? student?.guardians?.[0];

  const addObs = async () => {
    if (!obsText.trim() || !studentId) return;
    setSaving(true); setError(null);
    try {
      await apiPost("/observations", { studentId, type: obsType, content: obsText.trim() });
      setObsText("");
      await loadObs();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la observación.");
    } finally { setSaving(false); }
  };

  const name = student ? `${student.user.firstName} ${student.user.lastName}` : "";

  return (
    <Modal open={open} onClose={onClose} title="Estudiante" subtitle={name || undefined} width={560}>
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>
      ) : !student ? (
        <div className="py-10 text-center text-sm text-s-error-fg">{error ?? "No disponible"}</div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* encabezado */}
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-s-info text-sm font-bold text-s-info-fg">{initialsOf(student.user.firstName, student.user.lastName)}</span>
            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-ink">{name}</span>
              <span className="flex items-center gap-2 text-[11px] text-subtle">
                <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" /> {student.gradeGroup?.name ?? "Sin grupo"}</span>
                {student.enrollmentCode && <span>· {student.enrollmentCode}</span>}
              </span>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="flex flex-col items-center gap-0.5 rounded-xl border border-line bg-card py-3">
              <span className={`rounded-full px-2 py-0.5 text-[13px] font-bold ${scaleOf(promedio).chip}`}>{promedio == null ? "—" : promedio.toFixed(1)}</span>
              <span className="text-[10px] text-subtle">Promedio</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 rounded-xl border border-line bg-card py-3">
              <span className="text-[17px] font-bold text-ink">{bySubject.size}</span>
              <span className="flex items-center gap-1 text-[10px] text-subtle"><BookOpen className="h-3 w-3" /> Materias</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 rounded-xl border border-line bg-card py-3">
              <span className="text-[17px] font-bold text-ink">{obs.length}</span>
              <span className="flex items-center gap-1 text-[10px] text-subtle"><MessageSquareWarning className="h-3 w-3" /> Observ.</span>
            </div>
          </div>

          {/* acudiente */}
          <div className="flex items-center gap-2 rounded-xl border border-line bg-surface/50 px-3 py-2.5">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-[12px] text-subtle">Acudiente:</span>
            {primary ? (
              <span className="text-[12px] font-medium text-ink">{primary.guardian.user.firstName} {primary.guardian.user.lastName}{primary.guardian.user.phone ? ` · ${primary.guardian.user.phone}` : ""}</span>
            ) : <span className="text-[12px] text-subtle">Sin acudiente registrado.</span>}
          </div>

          {/* observador */}
          <div className="flex flex-col gap-2 rounded-xl bg-surface p-3">
            <span className="flex items-center gap-1.5 text-[12px] font-bold text-ink"><MessageSquareWarning className="h-3.5 w-3.5 text-primary" /> Anotar observación</span>
            <select value={obsType} onChange={(e) => setObsType(e.target.value)} className="h-9 rounded-lg border border-line bg-card px-2.5 text-[13px] font-semibold text-ink outline-none">
              {allowedTypes.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            {(PHRASES[obsType]?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {PHRASES[obsType].map((p, i) => (
                  <button key={i} onClick={() => setObsText((t) => (t ? t + " " : "") + p)} title={p}
                    className="flex items-center gap-1 rounded-full border border-line bg-card px-2 py-1 text-[11px] text-subtle transition-colors hover:border-primary/40 hover:text-ink">
                    <Sparkles className="h-3 w-3 text-primary" /> {p.length > 30 ? p.slice(0, 30) + "…" : p}
                  </button>
                ))}
              </div>
            )}
            <textarea value={obsText} onChange={(e) => setObsText(e.target.value)} rows={2} placeholder="Escribe o usa una frase…"
              className="rounded-lg border border-line bg-card px-3 py-2 text-[13px] text-ink outline-none focus:ring-2 focus:ring-primary/40" />
            <span className="text-[10px] text-muted">Las faltas graves/muy graves notifican automáticamente al acudiente.</span>
            <button onClick={addObs} disabled={saving || !obsText.trim()} className="flex h-9 items-center justify-center gap-2 rounded-lg bg-primary text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Registrar observación
            </button>
            {error && <span className="flex items-center gap-1 text-[11px] text-s-error-fg"><TriangleAlert className="h-3 w-3" /> {error}</span>}
          </div>

          {/* historial */}
          <div className="flex max-h-[32vh] flex-col gap-2 overflow-y-auto">
            {obs.length === 0 ? (
              <span className="py-3 text-center text-[12px] text-subtle">Sin observaciones.</span>
            ) : obs.map((o) => (
              <div key={o.id} className="flex flex-col gap-1 rounded-xl border border-line p-2.5">
                <span className="flex items-center justify-between">
                  <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold text-subtle">{OBS_LABEL[o.type] ?? o.type}</span>
                  <span className="text-[10px] text-subtle">{o.date ? new Date(o.date).toLocaleDateString("es-CO") : ""}</span>
                </span>
                <span className="text-[12px] leading-relaxed text-ink">{o.content}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
