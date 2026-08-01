"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, BookOpen, MessageSquareWarning, Wallet, Users, Send, Sparkles, GraduationCap,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { initials, fullName, scaleOf } from "@/lib/academic";
import { ProfileGrid, DocumentsList, type DocItem } from "@/components/profile-view";
import { PersonActions } from "@/components/person-actions";
import { EditPersonModal } from "@/components/edit-person-modal";

type Student = {
  id: string; enrollmentCode?: string; documentId?: string; birthDate?: string; address?: string; gradeGroupId?: string | null;
  user: { id: string; firstName: string; lastName: string; email?: string; phone?: string | null; status?: string; avatarUrl?: string | null; profile?: Record<string, unknown> | null; documents?: DocItem[] };
  gradeGroup?: { id?: string; name?: string } | null;
  guardians?: { isPrimary?: boolean; guardian: { user: { firstName: string; lastName: string; phone?: string } } }[];
};
type Grade = { id: string; score: number | string; subject?: { name: string } };
type Observation = { id: string; type: string; content: string; date?: string; createdAt?: string };

const OBS_TYPES: { id: string; label: string }[] = [
  { id: "ACADEMIC", label: "Académica" },
  { id: "DISCIPLINARY_POSITIVE", label: "Reconocimiento" },
  { id: "DISCIPLINARY_NEUTRAL", label: "Neutral" },
  { id: "DISCIPLINARY_MILD", label: "Falta leve" },
  { id: "DISCIPLINARY_SERIOUS", label: "Falta grave" },
  { id: "DISCIPLINARY_VERY_SERIOUS", label: "Falta muy grave" },
];
const OBS_LABEL: Record<string, string> = Object.fromEntries(OBS_TYPES.map((t) => [t.id, t.label]));

// #9 banco de comentarios — frases frecuentes por categoría.
const PHRASES: Record<string, string[]> = {
  ACADEMIC: [
    "Muestra excelente disposición y compromiso con su proceso de aprendizaje.",
    "Debe reforzar hábitos de estudio y entrega oportuna de trabajos.",
    "Participa activamente y aporta ideas valiosas en clase.",
    "Se recomienda acompañamiento en casa para afianzar los temas vistos.",
  ],
  DISCIPLINARY_POSITIVE: [
    "Destaca por su liderazgo positivo y respeto hacia sus compañeros.",
    "Reconocimiento por su colaboración y buen comportamiento durante el periodo.",
  ],
  DISCIPLINARY_MILD: [
    "Presenta interrupciones frecuentes durante la clase; se hace llamado de atención.",
    "Debe mejorar la puntualidad y el cumplimiento de las normas del aula.",
  ],
  DISCIPLINARY_SERIOUS: [
    "Se cita al acudiente para tratar la situación presentada y acordar compromisos.",
  ],
};

export default function FichaEstudiantePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // alta de observación (#9)
  const [obsType, setObsType] = useState("ACADEMIC");
  const [obsText, setObsText] = useState("");
  const [savingObs, setSavingObs] = useState(false);

  const loadObs = useCallback(async () => {
    try { setObservations(await apiGet<Observation[]>(`/observations/student/${id}`)); } catch { /* */ }
  }, [id]);

  const reloadStudent = useCallback(async () => {
    try { setStudent(await apiGet<Student>(`/students/${id}`)); } catch { /* */ }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const st = await apiGet<Student>(`/students/${id}`);
        setStudent(st);
        await Promise.all([
          apiGet<Grade[]>(`/grades?studentId=${id}`).then(setGrades).catch(() => {}),
          loadObs(),
          apiGet<any>(`/finance/invoices/student/${id}/balance`).then(setBalance).catch(() => {}),
        ]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo cargar el estudiante.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, loadObs]);

  // promedio por materia
  const bySubject = new Map<string, { sum: number; n: number }>();
  for (const g of grades) {
    const name = g.subject?.name ?? "—";
    const s = Number(g.score);
    if (!Number.isFinite(s)) continue;
    const e = bySubject.get(name) ?? { sum: 0, n: 0 };
    e.sum += s; e.n += 1; bySubject.set(name, e);
  }
  const subjects = [...bySubject.entries()].map(([name, { sum, n }]) => ({ name, avg: sum / n })).sort((a, b) => b.avg - a.avg);
  const promedio = subjects.length ? subjects.reduce((a, b) => a + b.avg, 0) / subjects.length : null;

  const saldo = balance && typeof balance === "object"
    ? (balance.balance ?? balance.pending ?? balance.totalDue ?? balance.saldo ?? null)
    : null;

  const addObs = async () => {
    if (!obsText.trim()) return;
    setSavingObs(true); setError(null);
    try {
      await apiPost("/observations", { studentId: id, type: obsType, content: obsText.trim() });
      setObsText("");
      await loadObs();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la observación.");
    } finally {
      setSavingObs(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center gap-2 px-8 py-24 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Cargando ficha…</div>;
  if (error && !student) return <div className="flex items-center justify-center gap-2 px-8 py-24 text-sm text-s-error-fg">{error}</div>;
  if (!student) return null;

  const name = fullName(student.user);
  const primary = student.guardians?.find((g) => g.isPrimary) ?? student.guardians?.[0];

  return (
    <div className="flex flex-col gap-5 px-8 py-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Link href="/estudiantes" className="flex w-fit items-center gap-1.5 text-[13px] font-semibold text-subtle transition-colors hover:text-ink"><ArrowLeft className="h-4 w-4" /> Estudiantes</Link>
        <PersonActions userId={student.user.id} status={student.user.status} onEdit={() => setEditOpen(true)} onChanged={reloadStudent} />
      </div>

      {/* encabezado */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-card p-5">
        <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-primary text-lg font-bold text-white">
          {student.user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={student.user.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : initials(student.user.firstName, student.user.lastName)}
        </span>
        <div className="flex flex-1 flex-col">
          <h1 className="text-[22px] font-bold -tracking-[0.01em] text-ink">{name}</h1>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-subtle">
            <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> {student.gradeGroup?.name ?? "Sin grupo"}</span>
            {student.enrollmentCode && <span>Código {student.enrollmentCode}</span>}
            {student.documentId && <span>Doc. {student.documentId}</span>}
          </span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Promedio", value: promedio == null ? "—" : promedio.toFixed(1), icon: BookOpen },
          { label: "Materias", value: String(subjects.length), icon: BookOpen },
          { label: "Observaciones", value: String(observations.length), icon: MessageSquareWarning },
          { label: "Saldo (cartera)", value: saldo == null ? "—" : new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(saldo)), icon: Wallet },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-primary"><Icon className="h-4 w-4" /></span>
              <span className="text-[22px] font-bold leading-none text-ink">{k.value}</span>
              <span className="text-[11px] text-subtle">{k.label}</span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-5 xl:flex-row">
        {/* notas + acudiente */}
        <div className="flex flex-1 flex-col gap-5">
          <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
            <div className="border-b border-line bg-surface px-5 py-3 text-[13px] font-bold text-ink">Calificaciones por materia</div>
            {subjects.length === 0 ? (
              <div className="py-8 text-center text-sm text-subtle">Sin notas registradas.</div>
            ) : subjects.map((s, i) => {
              const sc = scaleOf(s.avg);
              return (
                <div key={s.name} className={`flex items-center gap-3 px-5 py-2.5 ${i < subjects.length - 1 ? "border-b border-line" : ""}`}>
                  <span className="flex-1 text-[13px] text-ink">{s.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[12px] font-bold tabular-nums ${sc.chip}`}>{s.avg.toFixed(1)}</span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-5">
            <span className="flex items-center gap-2 text-[13px] font-bold text-ink"><Users className="h-4 w-4 text-primary" /> Acudiente principal</span>
            {primary ? (
              <span className="text-[13px] text-subtle">{fullName(primary.guardian.user)} {primary.guardian.user.phone ? `· ${primary.guardian.user.phone}` : ""}</span>
            ) : <span className="text-[13px] text-subtle">Sin acudiente registrado.</span>}
          </div>

          <ProfileGrid profile={student.user.profile} />
          <DocumentsList documents={student.user.documents} />
        </div>

        {/* observaciones + banco de comentarios */}
        <div className="flex w-full flex-col gap-3 rounded-2xl border border-line bg-card p-5 xl:w-[440px] xl:shrink-0">
          <span className="flex items-center gap-2 text-[13px] font-bold text-ink"><MessageSquareWarning className="h-4 w-4 text-primary" /> Observador del estudiante</span>

          {/* alta con banco de comentarios */}
          <div className="flex flex-col gap-2 rounded-xl bg-surface p-3">
            <select value={obsType} onChange={(e) => setObsType(e.target.value)} className="h-9 rounded-lg border border-line bg-card px-2.5 text-[13px] font-semibold text-ink outline-none">
              {OBS_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            {(PHRASES[obsType]?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {PHRASES[obsType].map((p, i) => (
                  <button key={i} onClick={() => setObsText((t) => (t ? t + " " : "") + p)} title={p}
                    className="flex items-center gap-1 rounded-full border border-line bg-card px-2 py-1 text-[11px] text-subtle transition-colors hover:border-primary/40 hover:text-ink">
                    <Sparkles className="h-3 w-3 text-primary" /> {p.length > 32 ? p.slice(0, 32) + "…" : p}
                  </button>
                ))}
              </div>
            )}
            <textarea value={obsText} onChange={(e) => setObsText(e.target.value)} rows={3} placeholder="Escribe o usa una frase del banco…"
              className="rounded-lg border border-line bg-card px-3 py-2 text-[13px] text-ink outline-none focus:ring-2 focus:ring-primary/40" />
            <button onClick={addObs} disabled={savingObs || !obsText.trim()} className="flex h-9 items-center justify-center gap-2 rounded-lg bg-primary text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40">
              {savingObs ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Registrar observación
            </button>
            {error && <span className="text-[11px] text-s-error-fg">{error}</span>}
          </div>

          {/* historial */}
          <div className="flex max-h-[40vh] flex-col gap-2 overflow-y-auto">
            {observations.length === 0 ? (
              <span className="py-4 text-center text-[12px] text-subtle">Sin observaciones.</span>
            ) : observations.map((o) => (
              <div key={o.id} className="flex flex-col gap-1 rounded-xl border border-line p-3">
                <span className="flex items-center justify-between">
                  <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold text-subtle">{OBS_LABEL[o.type] ?? o.type}</span>
                  <span className="text-[10px] text-subtle">{o.date ? new Date(o.date).toLocaleDateString("es-CO") : ""}</span>
                </span>
                <span className="text-[12px] leading-relaxed text-ink">{o.content}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <EditPersonModal open={editOpen} onClose={() => setEditOpen(false)} kind="student" userId={student.user.id} studentId={student.id}
        initial={{
          firstName: student.user.firstName, lastName: student.user.lastName, email: student.user.email ?? "", phone: student.user.phone,
          avatarUrl: student.user.avatarUrl, profile: student.user.profile,
          documentId: student.documentId, enrollmentCode: student.enrollmentCode, birthDate: student.birthDate, address: student.address,
          gradeGroupId: student.gradeGroupId ?? student.gradeGroup?.id,
        }}
        onSaved={reloadStudent} />
    </div>
  );
}
