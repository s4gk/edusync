"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Calendar, Check, X, Clock3, FileCheck, LogOut, Loader2, Save, CheckCheck, ClipboardList,
  MessageSquare, MessageSquarePlus, CheckCircle2, TriangleAlert,
} from "lucide-react";
import { apiPost } from "@/lib/api";
import { initials } from "@/lib/academic";

export type Mark = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | "EVASION";

export type AttRosterRow = { studentId: string; name: string; percentage?: number };
export type AttRecord = {
  id?: string; studentId: string; date: string; status: string; notes?: string | null;
};

const MARKS: { key: Mark; label: string; icon: typeof Check; on: string; dot: string; pill: string }[] = [
  { key: "PRESENT", label: "Asistió", icon: Check, on: "bg-emerald-500 text-white", dot: "text-emerald-600", pill: "bg-emerald-50 text-emerald-700" },
  { key: "ABSENT", label: "Ausente", icon: X, on: "bg-rose-500 text-white", dot: "text-rose-600", pill: "bg-rose-50 text-rose-700" },
  { key: "LATE", label: "Tarde", icon: Clock3, on: "bg-amber-500 text-white", dot: "text-amber-600", pill: "bg-amber-50 text-amber-700" },
  { key: "EXCUSED", label: "Justificado", icon: FileCheck, on: "bg-blue-500 text-white", dot: "text-blue-600", pill: "bg-blue-50 text-blue-700" },
  { key: "EVASION", label: "Evasión", icon: LogOut, on: "bg-orange-500 text-white", dot: "text-orange-600", pill: "bg-orange-50 text-orange-700" },
];

// Mapea el estado guardado (incluye PERMISSION) a uno de los 5 checks.
const STATUS_TO_MARK: Record<string, Mark> = {
  PRESENT: "PRESENT", ABSENT: "ABSENT", LATE: "LATE", EXCUSED: "EXCUSED", PERMISSION: "EXCUSED", EVASION: "EVASION",
};

const AVATARS = [
  "bg-blue-100 text-blue-700", "bg-amber-100 text-amber-700", "bg-pink-100 text-pink-700", "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700", "bg-teal-100 text-teal-700", "bg-orange-100 text-orange-700", "bg-sky-100 text-sky-700",
];

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/* ============================================================
   Tabla interactiva para TOMAR asistencia (compartida entre la
   vista del rector /asistencia y la del docente /clase).
   Tres checks por estudiante (Asistió / No asistió / Evasión) + observación.
   Guarda en lote vía POST /attendance.
   ============================================================ */
export function TakeTable({
  subjectId, roster, records, onSaved, fixedDate, onStudentClick,
}: {
  subjectId: string;
  roster: AttRosterRow[];
  records: AttRecord[];
  onSaved: () => Promise<void> | void;
  fixedDate?: string;
  onStudentClick?: (studentId: string) => void;
}) {
  const [date, setDate] = useState<string>(fixedDate ?? todayISO());
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [openNote, setOpenNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => { if (fixedDate) setDate(fixedDate); }, [fixedDate]);

  // Pre-cargar el estado de la fecha seleccionada desde lo que ya exista.
  useEffect(() => {
    const onDate = records.filter((r) => r.date.slice(0, 10) === date);
    const byStudent = new Map(onDate.map((r) => [r.studentId, r]));
    const nextMarks: Record<string, Mark> = {};
    const nextNotes: Record<string, string> = {};
    for (const s of roster) {
      const rec = byStudent.get(s.studentId);
      nextMarks[s.studentId] = (rec ? STATUS_TO_MARK[rec.status] : undefined) ?? "PRESENT";
      if (rec?.notes) nextNotes[s.studentId] = rec.notes;
    }
    setMarks(nextMarks);
    setNotes(nextNotes);
    setMsg(null);
    setOpenNote(null);
  }, [date, roster, records]);

  const counts = useMemo(() => {
    const c = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0, EVASION: 0 } as Record<Mark, number>;
    roster.forEach((s) => { c[marks[s.studentId] ?? "PRESENT"]++; });
    return c;
  }, [marks, roster]);

  const setAll = (m: Mark) => setMarks(Object.fromEntries(roster.map((s) => [s.studentId, m])));

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const entries = roster.map((s) => ({
        studentId: s.studentId,
        status: marks[s.studentId] ?? "PRESENT",
        notes: notes[s.studentId]?.trim() || undefined,
      }));
      await apiPost("/attendance", { subjectId, date, entries });
      setMsg({ ok: true, text: `Asistencia guardada — ${roster.length} estudiantes.` });
      await onSaved();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "No se pudo guardar." });
    } finally {
      setSaving(false);
    }
  };

  if (!roster.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center text-sm text-subtle">
        <ClipboardList className="h-6 w-6 text-muted" /> Este grupo no tiene estudiantes matriculados.
      </div>
    );
  }

  const pretty = new Date(date + "T00:00:00").toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="flex flex-col gap-3">
      {/* toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-card px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs">
            <Calendar className="h-3.5 w-3.5 text-subtle" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-[13px] font-semibold text-ink outline-none" />
          </label>
          <span className="text-[12px] capitalize text-subtle">{pretty}</span>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
            {MARKS.map((m) => {
              const Icon = m.icon;
              return <span key={m.key} className={`flex items-center gap-1 rounded-full px-2 py-1 ${m.pill}`}><Icon className="h-3 w-3" />{counts[m.key]}</span>;
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setAll("PRESENT")}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-1.5 text-[12px] font-semibold text-ink hover:bg-surface">
            <CheckCheck className="h-3.5 w-3.5 text-emerald-600" /> Todos asistieron
          </button>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-60">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Guardar
          </button>
        </div>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[13px] font-medium ${msg.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
          {msg.ok ? <CheckCircle2 className="h-4 w-4" /> : <TriangleAlert className="h-4 w-4" />} {msg.text}
        </div>
      )}

      {/* tabla */}
      <div className="overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-surface text-[11px] font-semibold uppercase tracking-wide text-subtle">
              <th className="w-10 px-3 py-2.5 text-center">#</th>
              <th className="w-full px-2 py-2.5">Estudiante</th>
              <th className="px-3 py-2.5 text-right">Estado</th>
              <th className="px-3 py-2.5 text-right">Obs.</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((s, i) => {
              const cur = marks[s.studentId] ?? "PRESENT";
              const hasNote = !!notes[s.studentId]?.trim();
              const isOpen = openNote === s.studentId;
              return (
                <Fragment key={s.studentId}>
                  <tr className="border-b border-line/70 transition-colors last:border-0 hover:bg-surface/50">
                    <td className="px-3 py-2 text-center text-[12px] font-medium text-muted">{i + 1}</td>
                    <td className="px-2 py-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${AVATARS[i % AVATARS.length]}`}>{initials(...(s.name.split(" ") as [string, string]))}</span>
                        {onStudentClick ? (
                          <button onClick={() => onStudentClick(s.studentId)} className="min-w-0 truncate text-left text-[13px] font-medium text-ink transition-colors hover:text-primary hover:underline" title={`Ver ficha de ${s.name}`}>{s.name}</button>
                        ) : (
                          <span className="min-w-0 truncate text-[13px] font-medium text-ink" title={s.name}>{s.name}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="inline-flex overflow-hidden rounded-lg border border-line">
                        {MARKS.map((m, idx) => {
                          const Icon = m.icon;
                          const active = cur === m.key;
                          return (
                            <button key={m.key} onClick={() => setMarks((p) => ({ ...p, [s.studentId]: m.key }))}
                              title={m.label}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-semibold transition-colors ${idx > 0 ? "border-l border-line" : ""} ${active ? m.on : "bg-card text-subtle hover:bg-surface"}`}>
                              <Icon className={`h-3.5 w-3.5 ${active ? "" : m.dot}`} />
                              <span className="hidden lg:inline">{m.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button onClick={() => setOpenNote(isOpen ? null : s.studentId)}
                        title={hasNote ? notes[s.studentId] : "Agregar observación"}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold transition-colors ${hasNote ? "border-primary/30 bg-primary/10 text-primary" : "border-line bg-card text-subtle hover:bg-surface"}`}>
                        {hasNote ? <MessageSquare className="h-3.5 w-3.5" /> : <MessageSquarePlus className="h-3.5 w-3.5" />}
                        {hasNote ? "Ver" : "Nota"}
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="border-b border-line/70 bg-surface/40">
                      <td />
                      <td colSpan={3} className="px-4 py-3">
                        <textarea autoFocus rows={2}
                          value={notes[s.studentId] ?? ""}
                          onChange={(e) => setNotes((p) => ({ ...p, [s.studentId]: e.target.value }))}
                          placeholder={`Observación para ${s.name.split(" ")[0]}…`}
                          className="w-full resize-none rounded-lg border border-line bg-card px-3 py-2 text-[13px] text-ink outline-none focus:border-primary" />
                        <div className="mt-1.5 flex justify-end gap-2">
                          <button onClick={() => { setNotes((p) => { const n = { ...p }; delete n[s.studentId]; return n; }); setOpenNote(null); }}
                            className="rounded-md px-2.5 py-1 text-[12px] font-medium text-subtle hover:text-rose-600">Borrar</button>
                          <button onClick={() => setOpenNote(null)}
                            className="rounded-md bg-primary px-3 py-1 text-[12px] font-semibold text-white hover:opacity-90">Listo</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="px-1 text-[11px] text-muted">Por defecto todos quedan en “Asistió”; marca solo las excepciones y guarda. Vuelve a guardar para corregir un día ya registrado.</p>
    </div>
  );
}
