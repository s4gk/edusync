"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Save,
  Check,
  ChevronDown,
  Table2,
  PieChart,
  Loader2,
  TriangleAlert,
  AlertTriangle,
  BookOpen,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  Download,
} from "lucide-react";
import { apiPost } from "@/lib/api";
import {
  getCurrentYear,
  getGroups,
  getSubjects,
  getPeriods,
  currentPeriodNumber,
  initials,
  scaleOf,
  type Group,
  type Subject,
} from "@/lib/academic";
import { apiGet, apiPut, apiDelete } from "@/lib/api";
import { Modal, FormField, inputCls } from "@/components/modal";
import { useAuth } from "@/components/auth-context";
import { StudentQuickView } from "@/components/student-quick-view";

/* ---------------- tipos del backend ---------------- */

type ScoreCell = { studentId: string; name: string; score: number | null };
type Activity = { id: string; name: string; weightPercent: string | number; maxScore: string | number; scores: ScoreCell[] };
type Achievement = { id: string; name: string; weightPercent: string | number; activities: Activity[] };
type Matrix = { subjectId: string; periodNumber: number; achievements: Achievement[] };

const AVATARS = [
  "bg-blue-100 text-blue-700", "bg-amber-100 text-amber-700", "bg-pink-100 text-pink-700",
  "bg-emerald-100 text-emerald-700", "bg-violet-100 text-violet-700", "bg-teal-100 text-teal-700",
  "bg-red-100 text-red-700", "bg-yellow-100 text-yellow-700", "bg-sky-100 text-sky-700", "bg-orange-100 text-orange-700",
];

const num = (v: string): number | null => {
  const n = parseFloat(v.replace(",", "."));
  return isNaN(n) ? null : n;
};
const W = (v: string | number) => Number(v) || 0;

function cellBg(v: number | null): string {
  if (v === null) return "bg-transparent";
  if (v >= 4.5) return "bg-s-success";
  if (v < 3.0) return "bg-s-error";
  return "bg-surface";
}
function cellText(v: number | null): string {
  if (v === null) return "text-subtle";
  if (v >= 4.5) return "text-s-success-fg";
  if (v < 3.0) return "text-s-error-fg";
  return "text-ink";
}

/* nota ponderada de un estudiante a partir de la matriz (logros×actividades) */
function studentDefinitiva(m: Matrix, studentId: string, draft: Record<string, string>): number | null {
  let acc = 0, totW = 0;
  for (const ach of m.achievements) {
    let aAcc = 0, aW = 0;
    for (const act of ach.activities) {
      const key = `${act.id}:${studentId}`;
      const raw = draft[key];
      const v = raw !== undefined ? num(raw) : act.scores.find((s) => s.studentId === studentId)?.score ?? null;
      if (v !== null) { aAcc += v * W(act.weightPercent); aW += W(act.weightPercent); }
    }
    if (aW > 0) { acc += (aAcc / aW) * W(ach.weightPercent); totW += W(ach.weightPercent); }
  }
  return totW > 0 ? acc / totW : null;
}

export default function CalificacionesPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === "TEACHER";
  const [groups, setGroups] = useState<Group[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [groupId, setGroupId] = useState<string>("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [period, setPeriod] = useState<number>(1);

  const [matrix, setMatrix] = useState<Matrix | null>(null);
  const [activeAch, setActiveAch] = useState<string>("");
  const [tab, setTab] = useState<"libro" | "resumen">("libro");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [unsaved, setUnsaved] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const counter = useRef(0);

  // #3 copiar logros desde otra materia/periodo
  const [copyOpen, setCopyOpen] = useState(false);
  const [srcGroupId, setSrcGroupId] = useState("");
  const [srcSubjects, setSrcSubjects] = useState<Subject[]>([]);
  const [srcSubjectId, setSrcSubjectId] = useState("");
  const [srcPeriod, setSrcPeriod] = useState(1);
  const [copying, setCopying] = useState(false);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);

  // agregar logro (Saber/Hacer) y columna (actividad)
  const [achOpen, setAchOpen] = useState(false);
  const [achName, setAchName] = useState("");
  const [achWeight, setAchWeight] = useState("");
  const [achBusy, setAchBusy] = useState(false);
  const [achErr, setAchErr] = useState<string | null>(null);
  const [colOpen, setColOpen] = useState(false);
  const [colName, setColName] = useState("");
  const [colWeight, setColWeight] = useState("");
  const [colBusy, setColBusy] = useState(false);
  const [colErr, setColErr] = useState<string | null>(null);
  const [quickId, setQuickId] = useState<string | null>(null);
  const [editAch, setEditAch] = useState<{ id: string; name: string; weight: string } | null>(null);
  const [editCol, setEditCol] = useState<{ id: string; name: string; weight: string } | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [editErr, setEditErr] = useState<string | null>(null);

  // contexto académico inicial
  useEffect(() => {
    (async () => {
      try {
        const year = await getCurrentYear();
        if (!year) throw new Error("Sin año lectivo");
        const gs = await getGroups(year.id);
        setGroups(gs);
        if (gs[0]) setGroupId(gs[0].id);
        // periodo vigente por fecha → el docente queda fijo en él
        try { setPeriod(currentPeriodNumber(await getPeriods(year.id))); } catch { /* deja P1 */ }
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo cargar el contexto académico.");
        setLoading(false);
      }
    })();
  }, []);

  // materias al cambiar de grupo
  useEffect(() => {
    if (!groupId) return;
    (async () => {
      const subs = await getSubjects(groupId);
      setSubjects(subs);
      setSubjectId(subs[0]?.id ?? "");
    })();
  }, [groupId]);

  // carga de la matriz
  const load = useCallback(async () => {
    if (!subjectId) return;
    setLoading(true);
    setError(null);
    try {
      const m = await apiGet<Matrix>(`/grades/matrix?subjectId=${subjectId}&periodNumber=${period}`);
      setMatrix(m);
      setActiveAch((prev) => (m.achievements.find((a) => a.id === prev) ? prev : m.achievements[0]?.id ?? ""));
      setDraft({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar las calificaciones.");
      setMatrix(null);
    } finally {
      setLoading(false);
    }
  }, [subjectId, period]);

  useEffect(() => { load(); }, [load]);

  const students = useMemo(() => {
    const first = matrix?.achievements[0]?.activities[0]?.scores ?? [];
    return first.map((s) => ({ id: s.studentId, name: s.name }));
  }, [matrix]);

  const ach = matrix?.achievements.find((a) => a.id === activeAch) ?? null;

  const setGrade = (activityId: string, studentId: string, value: string) => {
    if (value !== "" && !/^\d{0,1}([.,]\d{0,1})?$/.test(value)) return;
    setDraft((d) => ({ ...d, [`${activityId}:${studentId}`]: value }));
    setUnsaved(true);
  };
  const cellValue = (act: Activity, studentId: string): string => {
    const key = `${act.id}:${studentId}`;
    if (draft[key] !== undefined) return draft[key];
    const v = act.scores.find((s) => s.studentId === studentId)?.score;
    return v == null ? "" : String(v);
  };

  // #2 navegación con teclado: Enter/↓ baja, ↑ sube (misma actividad).
  const focusCell = (activityId: string, idx: number) => {
    const el = document.getElementById(`g-${activityId}-${idx}`) as HTMLInputElement | null;
    if (el) { el.focus(); el.select(); }
  };
  const onCellKey = (e: React.KeyboardEvent, activityId: string, idx: number) => {
    if (e.key === "Enter" || e.key === "ArrowDown") { e.preventDefault(); focusCell(activityId, idx + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); focusCell(activityId, idx - 1); }
  };
  // #1 pegar desde Excel: una columna (separada por saltos de línea/tab) se rellena hacia abajo.
  const onCellPaste = (e: React.ClipboardEvent, activityId: string, startIdx: number) => {
    const text = e.clipboardData.getData("text");
    if (!text) return;
    e.preventDefault();
    const vals = text.split(/[\r\n\t]+/).map((t) => t.trim()).filter((t) => t !== "");
    if (!vals.length) return;
    setDraft((d) => {
      const nd = { ...d };
      vals.forEach((val, k) => {
        const st = students[startIdx + k];
        if (!st) return;
        const cleaned = val.replace(",", ".");
        const n = parseFloat(cleaned);
        if (!Number.isNaN(n)) nd[`${activityId}:${st.id}`] = String(Math.max(0, Math.min(5, n)));
      });
      return nd;
    });
    setUnsaved(true);
  };

  const persist = useCallback(async (silent: boolean) => {
    if (!matrix) return;
    // agrupa los cambios por actividad
    const byActivity: Record<string, { studentId: string; score: number }[]> = {};
    for (const [key, raw] of Object.entries(draft)) {
      const v = num(raw);
      if (v === null) continue;
      const [activityId, studentId] = key.split(":");
      (byActivity[activityId] ??= []).push({ studentId, score: Math.max(0, Math.min(5, v)) });
    }
    const activityIds = Object.keys(byActivity);
    if (!activityIds.length) { setUnsaved(false); return; }
    if (silent) setAutoSaving(true); else { setSaving(true); setError(null); }
    try {
      for (const activityId of activityIds) {
        await apiPost("/grades/scores", { activityId, scores: byActivity[activityId] });
      }
      setSavedAt(new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }));
      setUnsaved(false);
      if (!silent) await load(); // el guardado manual reconcilia con el backend
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : "No se pudieron guardar las notas.");
    } finally {
      if (silent) setAutoSaving(false); else setSaving(false);
    }
  }, [matrix, draft, load]);

  const save = () => persist(false);

  // #3 copiar logros+actividades de una materia/periodo origen al actual.
  const openCopy = () => {
    setSrcGroupId(groupId); setSrcSubjects(subjects); setSrcSubjectId(""); setSrcPeriod(1); setCopyMsg(null); setCopyOpen(true);
  };
  const onSrcGroup = async (gid: string) => {
    setSrcGroupId(gid); setSrcSubjectId("");
    try { setSrcSubjects(await getSubjects(gid)); } catch { setSrcSubjects([]); }
  };
  const doCopy = async () => {
    if (!srcSubjectId || !subjectId) return;
    setCopying(true); setCopyMsg(null);
    try {
      const src = await apiGet<Matrix>(`/grades/matrix?subjectId=${srcSubjectId}&periodNumber=${srcPeriod}`);
      if (!src.achievements.length) { setCopyMsg("La materia origen no tiene logros en ese periodo."); setCopying(false); return; }
      let nA = 0, nAct = 0;
      for (const ach of src.achievements) {
        const created = await apiPost<{ id: string }>("/grades/achievements", {
          subjectId, periodNumber: period, name: ach.name, weightPercent: W(ach.weightPercent),
        });
        nA += 1;
        for (const act of ach.activities) {
          await apiPost("/grades/activities", {
            achievementId: created.id, name: act.name, weightPercent: W(act.weightPercent), maxScore: Number(act.maxScore) || 5,
          });
          nAct += 1;
        }
      }
      setCopyMsg(`Copiados ${nA} logros y ${nAct} actividades.`);
      await load();
    } catch (e) {
      setCopyMsg(e instanceof Error ? e.message : "No se pudo copiar.");
    } finally {
      setCopying(false);
    }
  };

  // crear logro (Saber / Hacer) en la materia/periodo actual
  const openAch = () => { setAchName(""); setAchWeight(""); setAchErr(null); setAchOpen(true); };
  const createAch = async () => {
    if (!achName.trim()) { setAchErr("Escribe el nombre del logro."); return; }
    if (!subjectId) { setAchErr("Selecciona una materia primero."); return; }
    setAchBusy(true); setAchErr(null);
    try {
      const created = await apiPost<{ id: string }>("/grades/achievements", {
        subjectId, periodNumber: period, name: achName.trim(), weightPercent: Number(achWeight) || 0,
      });
      setAchOpen(false);
      await load();
      setActiveAch(created.id);
    } catch (e) {
      setAchErr(e instanceof Error ? e.message : "No se pudo crear el logro.");
    } finally { setAchBusy(false); }
  };

  // crear columna (actividad) dentro del logro activo
  const openCol = () => { setColName(""); setColWeight(""); setColErr(null); setColOpen(true); };
  const createCol = async () => {
    if (!colName.trim()) { setColErr("Escribe el nombre de la evaluación."); return; }
    if (!activeAch) { setColErr("Selecciona un logro primero."); return; }
    setColBusy(true); setColErr(null);
    try {
      await apiPost("/grades/activities", {
        achievementId: activeAch, name: colName.trim(), weightPercent: Number(colWeight) || 0, maxScore: 5,
      });
      setColOpen(false);
      await load();
    } catch (e) {
      setColErr(e instanceof Error ? e.message : "No se pudo crear la evaluación.");
    } finally { setColBusy(false); }
  };

  // editar / eliminar logros y evaluaciones
  const saveEditAch = async () => {
    if (!editAch?.name.trim()) { setEditErr("Escribe el nombre del logro."); return; }
    setEditBusy(true); setEditErr(null);
    try { await apiPut(`/grades/achievements/${editAch.id}`, { name: editAch.name.trim(), weightPercent: Number(editAch.weight) || 0 }); setEditAch(null); await load(); }
    catch (e) { setEditErr(e instanceof Error ? e.message : "No se pudo guardar."); }
    finally { setEditBusy(false); }
  };
  const removeAch = async (id: string) => {
    if (!confirm("¿Eliminar este logro y todas sus evaluaciones?")) return;
    try { await apiDelete(`/grades/achievements/${id}`); setEditAch(null); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudo eliminar el logro."); }
  };
  const saveEditCol = async () => {
    if (!editCol?.name.trim()) { setEditErr("Escribe el nombre de la evaluación."); return; }
    setEditBusy(true); setEditErr(null);
    try { await apiPut(`/grades/activities/${editCol.id}`, { name: editCol.name.trim(), weightPercent: Number(editCol.weight) || 0 }); setEditCol(null); await load(); }
    catch (e) { setEditErr(e instanceof Error ? e.message : "No se pudo guardar."); }
    finally { setEditBusy(false); }
  };
  const removeCol = async (id: string) => {
    if (!confirm("¿Eliminar esta evaluación y sus notas?")) return;
    try { await apiDelete(`/grades/activities/${id}`); setEditCol(null); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudo eliminar la evaluación."); }
  };

  // #2 autoguardado: 1.2s después del último cambio.
  useEffect(() => {
    if (!unsaved) return;
    const t = setTimeout(() => persist(true), 1200);
    return () => clearTimeout(t);
  }, [unsaved, persist]);

  const groupAvg = useMemo(() => {
    if (!matrix) return null;
    const ds = students.map((s) => studentDefinitiva(matrix, s.id, draft)).filter((v): v is number => v !== null);
    return ds.length ? ds.reduce((a, b) => a + b, 0) / ds.length : null;
  }, [matrix, students, draft]);

  const enRiesgo = useMemo(() => {
    if (!matrix) return [] as { id: string; name: string; def: number }[];
    return students
      .map((s) => ({ ...s, def: studentDefinitiva(matrix, s.id, draft) }))
      .filter((s): s is { id: string; name: string; def: number } => s.def !== null && s.def < 3.0);
  }, [matrix, students, draft]);

  const subjectName = subjects.find((s) => s.id === subjectId)?.name ?? "";
  const groupName = groups.find((g) => g.id === groupId)?.name ?? "";
  const dirty = Object.keys(draft).length > 0;

  // exportar la planilla a CSV (abre en Excel) — estudiantes × evaluaciones + definitiva
  const exportCSV = () => {
    if (!matrix || !students.length) return;
    const cols: { label: string; act: Activity }[] = [];
    matrix.achievements.forEach((a) => a.activities.forEach((act) => cols.push({ label: `${a.name}: ${act.name}`, act })));
    const header = ["Estudiante", ...cols.map((c) => c.label), "Definitiva"];
    const rows = students.map((s) => {
      const cells = cols.map((c) => cellValue(c.act, s.id) || "");
      const def = studentDefinitiva(matrix, s.id, draft);
      return [s.name, ...cells, def == null ? "" : def.toFixed(1)];
    });
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `planilla_${subjectName}_${groupName}_P${period}.csv`.replace(/\s+/g, "_");
    a.click();
    URL.revokeObjectURL(url);
  };

  const Selector = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { id: string; label: string }[] }) => (
    <label className="flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-1.5 text-xs">
      <span className="font-medium text-subtle">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-transparent text-[13px] font-semibold text-ink outline-none">
        {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </label>
  );

  return (
    <div className="flex flex-col gap-5 px-8 py-7">
      {/* header */}
      <div className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold tracking-[0.18em] text-primary">ACADÉMICO</span>
          <h1 className="text-[28px] font-bold -tracking-[0.02em] text-ink">Libro de calificaciones</h1>
          <p className="text-[13px] text-subtle">{subjectName ? `${subjectName} · ${groupName} · Periodo ${period}` : "Selecciona grupo, materia y periodo"}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              disabled={!matrix || students.length === 0}
              className="flex h-9 items-center gap-2 rounded-[10px] border border-line px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" /> Exportar
            </button>
            <button
              onClick={save}
              disabled={!dirty || saving}
              className="flex h-9 items-center gap-2 rounded-[10px] bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Guardar cambios
            </button>
          </div>
          {autoSaving ? (
            <span className="flex items-center gap-1 text-[11px] text-subtle"><Loader2 className="h-3 w-3 animate-spin" /> guardando…</span>
          ) : unsaved ? (
            <span className="text-[11px] text-amber-600">cambios sin guardar · se guardan solos</span>
          ) : savedAt ? (
            <span className="flex items-center gap-1 text-[11px] text-subtle"><Check className="h-3 w-3 text-emerald-600" /> guardado {savedAt}</span>
          ) : null}
        </div>
      </div>

      {/* selectores */}
      <div className="flex flex-wrap items-center gap-2">
        <Selector label={isTeacher ? "Curso" : "Grado"} value={groupId} onChange={setGroupId} options={groups.map((g) => ({ id: g.id, label: g.name }))} />
        {!isTeacher && (
          <Selector label="Materia" value={subjectId} onChange={setSubjectId} options={subjects.map((s) => ({ id: s.id, label: s.name }))} />
        )}
        {isTeacher && subjects.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {subjects.map((s) => (
              <button key={s.id} onClick={() => setSubjectId(s.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${subjectId === s.id ? "border border-primary bg-primary/10 text-primary" : "border border-line text-subtle hover:bg-surface"}`}>
                {s.name}
              </button>
            ))}
          </div>
        )}
        {!isTeacher ? (
          <Selector label="Periodo" value={String(period)} onChange={(v) => setPeriod(Number(v))} options={[1, 2, 3, 4].map((n) => ({ id: String(n), label: `P${n}` }))} />
        ) : (
          <span className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs text-subtle">
            Periodo actual <span className="rounded-md bg-primary/10 px-1.5 py-0.5 font-bold text-primary">P{period}</span>
          </span>
        )}
      </div>

      {/* tabs */}
      <div className="flex items-center gap-1 border-b border-line">
        {([["libro", "Libro de notas", Table2], ["resumen", "Resumen", PieChart]] as const).map(([id, label, Icon]) => {
          const on = tab === id;
          return (
            <button key={id} onClick={() => setTab(id)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm transition-colors ${on ? "border-primary font-semibold text-ink" : "border-transparent font-medium text-subtle hover:text-ink"}`}>
              <Icon className={`h-4 w-4 ${on ? "text-primary" : ""}`} /> {label}
              {id === "resumen" && enRiesgo.length > 0 && <span className="rounded-full bg-s-error px-1.5 py-0.5 text-[10px] font-bold text-s-error-fg">{enRiesgo.length}</span>}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Cargando calificaciones…</div>
      ) : error ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-s-error-fg"><TriangleAlert className="h-4 w-4" /> {error}</div>
      ) : !matrix || matrix.achievements.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center text-sm text-subtle">
          <BookOpen className="h-6 w-6 text-muted" /> No hay logros definidos para esta materia en el periodo {period}.
          {subjectId && (
            <button onClick={openAch} className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90">
              <Plus className="h-3.5 w-3.5" /> Agregar logro
            </button>
          )}
        </div>
      ) : tab === "libro" ? (
        <>
          {/* selector de logro */}
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={openAch} className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10" title="Agregar un logro (Saber / Hacer)">
              <Plus className="h-3.5 w-3.5" /> Agregar logro
            </button>
            <button onClick={openCopy} className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-subtle transition-colors hover:bg-surface" title="Copiar logros de otra materia/periodo">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Copiar logros
            </button>
            {matrix.achievements.map((a) => {
              const on = a.id === activeAch;
              return (
                <button key={a.id} onClick={() => setActiveAch(a.id)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${on ? "border border-primary bg-primary/10 text-primary" : "border border-line text-subtle hover:bg-surface"}`}>
                  {a.name}
                  <span className={`rounded-full px-1.5 text-[10px] font-bold ${on ? "bg-primary text-white" : "bg-surface text-subtle"}`}>{W(a.weightPercent)}%</span>
                </button>
              );
            })}
          </div>

          {/* tabla del logro activo */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
            <div className="flex flex-wrap items-center gap-2 border-b border-line p-4 text-xs text-subtle">
              <BookOpen className="h-4 w-4 text-primary" />
              Calificando <span className="font-semibold text-ink">{ach?.name}</span> · {ach?.activities.length} actividades · pesa {W(ach?.weightPercent ?? 0)}% en la definitiva
              {ach && (
                <span className="flex items-center gap-0.5">
                  <button onClick={() => { setEditErr(null); setEditAch({ id: ach.id, name: ach.name, weight: String(W(ach.weightPercent)) }); }} title="Editar logro" className="flex h-7 w-7 items-center justify-center rounded-md text-subtle transition-colors hover:bg-surface hover:text-ink"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => removeAch(ach.id)} title="Eliminar logro" className="flex h-7 w-7 items-center justify-center rounded-md text-subtle transition-colors hover:bg-surface hover:text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
                </span>
              )}
              <div className="ml-auto flex items-center gap-2">
                <span className="hidden items-center gap-1 text-[11px] text-muted lg:flex">📋 Pega desde Excel · ⏎/↑↓ para moverte · se guarda solo</span>
                <button onClick={openCol} className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[12px] font-semibold text-white transition-opacity hover:opacity-90">
                  <Plus className="h-3.5 w-3.5" /> Nueva evaluación
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-max">
                <div className="flex items-stretch border-b border-line bg-surface text-[10px] font-bold tracking-[0.1em] text-subtle">
                  <span className="flex w-[220px] shrink-0 items-center border-r border-line px-5 py-3">ESTUDIANTE</span>
                  {ach?.activities.map((act) => (
                    <div key={act.id} onClick={() => { setEditErr(null); setEditCol({ id: act.id, name: act.name, weight: String(W(act.weightPercent)) }); }} title="Editar evaluación"
                      className="group flex w-[120px] shrink-0 cursor-pointer flex-col items-center justify-center gap-0.5 border-r border-line px-2 py-2 transition-colors hover:bg-surface">
                      <span className="line-clamp-2 w-full break-words text-center text-[11px] font-bold leading-tight text-ink" title={act.name}>{act.name}</span>
                      <span className="flex items-center gap-1 text-[9px] text-subtle">{W(act.weightPercent)}% <Pencil className="h-2.5 w-2.5 opacity-0 transition-opacity group-hover:opacity-70" /></span>
                    </div>
                  ))}
                  <span className="flex w-[100px] shrink-0 items-center justify-center px-2 py-3 text-center text-ink">PROMEDIO</span>
                </div>

                {students.map((s, i) => {
                  const def = matrix ? studentDefinitiva(matrix, s.id, draft) : null;
                  const sc = scaleOf(def);
                  return (
                    <div key={s.id} className={`flex items-stretch ${i < students.length - 1 ? "border-b border-line" : ""}`}>
                      <div className="flex w-[220px] shrink-0 items-center gap-2.5 border-r border-line px-5 py-2">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${AVATARS[i % AVATARS.length]}`}>{initials(...s.name.split(" "))}</span>
                        <button onClick={() => setQuickId(s.id)} className="min-w-0 truncate text-left text-[13px] font-semibold text-ink transition-colors hover:text-primary hover:underline" title={`Ver ficha de ${s.name}`}>{s.name}</button>
                      </div>
                      {ach?.activities.map((act) => {
                        const raw = cellValue(act, s.id);
                        const v = num(raw);
                        return (
                          <div key={act.id} className="flex w-[120px] shrink-0 items-center justify-center border-r border-line py-2">
                            <div className={`rounded-md ${cellBg(v)}`}>
                              <input id={`g-${act.id}-${i}`} value={raw}
                                onChange={(e) => setGrade(act.id, s.id, e.target.value)}
                                onKeyDown={(e) => onCellKey(e, act.id, i)}
                                onPaste={(e) => onCellPaste(e, act.id, i)}
                                inputMode="decimal" placeholder="–"
                                className={`h-7 w-14 appearance-none rounded-md bg-transparent text-center text-[13px] font-semibold tabular-nums outline-none transition-colors placeholder:text-muted focus:ring-2 focus:ring-primary/40 ${cellText(v)}`} />
                            </div>
                          </div>
                        );
                      })}
                      <div className="flex w-[100px] shrink-0 items-center justify-center py-2">
                        <span className={`rounded-full px-2 py-1 text-[12px] font-bold tabular-nums ${sc.chip}`}>{def === null ? "—" : def.toFixed(1)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-line bg-surface px-5 py-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-subtle">Definitiva grupo: <span className="font-semibold text-ink">{groupAvg === null ? "—" : groupAvg.toFixed(1)}</span></span>
                <span className="text-subtle">·</span>
                <span className="font-medium text-danger">{enRiesgo.length} en riesgo</span>
              </div>
              <span className="text-[11px] text-subtle">{students.length} estudiantes</span>
            </div>
          </div>
        </>
      ) : (
        /* resumen */
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Definitiva grupo", value: groupAvg === null ? "—" : groupAvg.toFixed(1), tone: "text-ink" },
              { label: "Estudiantes en riesgo", value: String(enRiesgo.length), tone: "text-danger" },
              { label: "Aprobados (≥ 3.0)", value: `${students.length - enRiesgo.length}/${students.length}`, tone: "text-emerald-600" },
              { label: "Logros", value: String(matrix.achievements.length), tone: "text-ink" },
            ].map((k) => (
              <div key={k.label} className="flex flex-col gap-1.5 rounded-2xl border border-line bg-card p-5">
                <span className="text-[11px] font-medium text-subtle">{k.label}</span>
                <span className={`text-[28px] font-bold leading-none ${k.tone}`}>{k.value}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-5 xl:flex-row">
            <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-line bg-card p-5">
              <h3 className="text-sm font-semibold text-ink">Promedio del grupo por logro</h3>
              {matrix.achievements.map((a) => {
                const vals = students.map((s) => {
                  let acc = 0, w = 0;
                  for (const act of a.activities) {
                    const raw = cellValue(act, s.id); const v = num(raw);
                    if (v !== null) { acc += v * W(act.weightPercent); w += W(act.weightPercent); }
                  }
                  return w ? acc / w : null;
                }).filter((v): v is number => v !== null);
                const avg = vals.length ? vals.reduce((x, y) => x + y, 0) / vals.length : null;
                return (
                  <div key={a.id} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 text-[13px] font-medium text-ink">{a.name}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
                      <span className="block h-full rounded-full bg-primary" style={{ width: `${((avg ?? 0) / 5) * 100}%` }} />
                    </span>
                    <span className="w-10 text-right text-[13px] font-bold text-ink">{avg === null ? "—" : avg.toFixed(1)}</span>
                    <span className="w-9 text-right text-[11px] text-subtle">{W(a.weightPercent)}%</span>
                  </div>
                );
              })}
            </div>
            <div className="flex w-full flex-col gap-3 rounded-2xl border border-line bg-card p-5 xl:w-[360px] xl:shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-ink">Estudiantes en riesgo</h3>
                <span className="flex items-center gap-1 rounded-full bg-s-error px-1.5 py-0.5 text-[10px] font-bold text-s-error-fg"><AlertTriangle className="h-2.5 w-2.5" /> {enRiesgo.length}</span>
              </div>
              {enRiesgo.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2.5">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold ${AVATARS[i % AVATARS.length]}`}>{initials(...s.name.split(" "))}</span>
                  <span className="flex-1 text-[13px] font-medium text-ink">{s.name}</span>
                  <span className="text-[12px] font-bold text-danger">Def. {s.def.toFixed(1)}</span>
                </div>
              ))}
              {enRiesgo.length === 0 && <span className="text-xs text-subtle">Ningún estudiante por debajo de 3.0 🎉</span>}
              <div className="mt-2 flex items-center gap-1.5 rounded-xl bg-surface p-3 text-xs text-subtle">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Notas calculadas en vivo desde el backend (logros × actividades ponderadas).
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== modal copiar logros ===== */}
      <Modal open={copyOpen} onClose={() => setCopyOpen(false)} title="Copiar logros" subtitle={`Hacia ${subjectName} · Periodo ${period}`} width={520}>
        <p className="text-[12px] text-subtle">Selecciona la materia y periodo de donde copiar los logros y sus actividades (sin las notas).</p>
        <FormField label="Grupo origen">
          <select value={srcGroupId} onChange={(e) => onSrcGroup(e.target.value)} className={inputCls}>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </FormField>
        <FormField label="Materia origen">
          <select value={srcSubjectId} onChange={(e) => setSrcSubjectId(e.target.value)} className={inputCls}>
            <option value="">Selecciona…</option>
            {srcSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </FormField>
        <FormField label="Periodo origen">
          <select value={srcPeriod} onChange={(e) => setSrcPeriod(Number(e.target.value))} className={inputCls}>
            {[1, 2, 3, 4].map((n) => <option key={n} value={n}>Periodo {n}</option>)}
          </select>
        </FormField>
        {copyMsg && <p className="rounded-lg bg-surface px-3 py-2 text-[12px] text-ink">{copyMsg}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={() => setCopyOpen(false)} className="h-9 rounded-lg border border-line px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">Cerrar</button>
          <button onClick={doCopy} disabled={copying || !srcSubjectId} className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40">
            {copying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Copiar
          </button>
        </div>
      </Modal>

      {/* ===== modal agregar logro ===== */}
      <Modal open={achOpen} onClose={() => setAchOpen(false)} title="Agregar logro" subtitle={`${subjectName || "Materia"} · Periodo ${period}`}>
        <FormField label="Nombre del logro">
          <input className={inputCls} value={achName} onChange={(e) => setAchName(e.target.value)} placeholder="Saber" />
        </FormField>
        <div className="flex flex-wrap gap-1.5">
          {["Saber", "Hacer"].map((n) => (
            <button key={n} type="button" onClick={() => setAchName(n)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${achName === n ? "border border-primary bg-primary/10 text-primary" : "border border-line text-subtle hover:bg-surface"}`}>
              {n}
            </button>
          ))}
        </div>
        <FormField label="Peso en la definitiva (%)">
          <input className={inputCls} type="number" min={0} max={100} value={achWeight} onChange={(e) => setAchWeight(e.target.value)} placeholder="50" />
        </FormField>
        {achErr && <div className="flex items-center gap-2 rounded-lg bg-s-error px-3 py-2 text-[13px] text-s-error-fg"><TriangleAlert className="h-4 w-4" /> {achErr}</div>}
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={() => setAchOpen(false)} className="h-9 rounded-lg border border-line px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">Cancelar</button>
          <button onClick={createAch} disabled={achBusy} className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40">
            {achBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Crear logro
          </button>
        </div>
      </Modal>

      {/* ===== modal nueva evaluación ===== */}
      <Modal open={colOpen} onClose={() => setColOpen(false)} title="Nueva evaluación" subtitle={`Logro: ${ach?.name ?? "—"}`}>
        <FormField label="Nombre de la evaluación">
          <input className={inputCls} value={colName} onChange={(e) => setColName(e.target.value)} placeholder="Quiz 1 · Taller · Exposición…" />
        </FormField>
        <FormField label="Peso dentro del logro (%)">
          <input className={inputCls} type="number" min={0} max={100} value={colWeight} onChange={(e) => setColWeight(e.target.value)} placeholder="25" />
        </FormField>
        {colErr && <div className="flex items-center gap-2 rounded-lg bg-s-error px-3 py-2 text-[13px] text-s-error-fg"><TriangleAlert className="h-4 w-4" /> {colErr}</div>}
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={() => setColOpen(false)} className="h-9 rounded-lg border border-line px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">Cancelar</button>
          <button onClick={createCol} disabled={colBusy} className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40">
            {colBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Crear evaluación
          </button>
        </div>
      </Modal>

      {/* ===== editar logro ===== */}
      <Modal open={!!editAch} onClose={() => setEditAch(null)} title="Editar logro" subtitle={subjectName || undefined}>
        {editAch && (
          <>
            <FormField label="Nombre del logro"><input className={inputCls} value={editAch.name} onChange={(e) => setEditAch({ ...editAch, name: e.target.value })} /></FormField>
            <FormField label="Peso en la definitiva (%)"><input className={inputCls} type="number" min={0} max={100} value={editAch.weight} onChange={(e) => setEditAch({ ...editAch, weight: e.target.value })} /></FormField>
            {editErr && <div className="flex items-center gap-2 rounded-lg bg-s-error px-3 py-2 text-[13px] text-s-error-fg"><TriangleAlert className="h-4 w-4" /> {editErr}</div>}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button onClick={() => removeAch(editAch.id)} className="flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] font-semibold text-danger transition-colors hover:bg-s-error"><Trash2 className="h-3.5 w-3.5" /> Eliminar</button>
              <div className="flex gap-2">
                <button onClick={() => setEditAch(null)} className="h-9 rounded-lg border border-line px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">Cancelar</button>
                <button onClick={saveEditAch} disabled={editBusy} className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40">{editBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Guardar</button>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* ===== editar evaluación ===== */}
      <Modal open={!!editCol} onClose={() => setEditCol(null)} title="Editar evaluación" subtitle={ach?.name ? `Logro: ${ach.name}` : undefined}>
        {editCol && (
          <>
            <FormField label="Nombre de la evaluación"><input className={inputCls} value={editCol.name} onChange={(e) => setEditCol({ ...editCol, name: e.target.value })} /></FormField>
            <FormField label="Peso dentro del logro (%)"><input className={inputCls} type="number" min={0} max={100} value={editCol.weight} onChange={(e) => setEditCol({ ...editCol, weight: e.target.value })} /></FormField>
            {editErr && <div className="flex items-center gap-2 rounded-lg bg-s-error px-3 py-2 text-[13px] text-s-error-fg"><TriangleAlert className="h-4 w-4" /> {editErr}</div>}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button onClick={() => removeCol(editCol.id)} className="flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] font-semibold text-danger transition-colors hover:bg-s-error"><Trash2 className="h-3.5 w-3.5" /> Eliminar</button>
              <div className="flex gap-2">
                <button onClick={() => setEditCol(null)} className="h-9 rounded-lg border border-line px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">Cancelar</button>
                <button onClick={saveEditCol} disabled={editBusy} className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40">{editBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Guardar</button>
              </div>
            </div>
          </>
        )}
      </Modal>

      <StudentQuickView open={!!quickId} studentId={quickId} onClose={() => setQuickId(null)} />
    </div>
  );
}
