"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LayoutGrid, Plus, Pencil, Trash2, Users, Search, Loader2, TriangleAlert,
  UserPlus, Check, GraduationCap, BookOpen, FileBadge, Star,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { Modal, FormField, inputCls } from "@/components/modal";
import {
  getCurrentYear, getGroups, getSubjects, createGroup, updateGroup, deleteGroup,
  assignStudentToGroup, getTeachers, createSubject, updateSubject, deleteSubject,
  gradeLabel, initials, fullName,
  type Group, type Subject, type TeacherLite,
} from "@/lib/academic";

type StudentRow = {
  id: string;
  user: { firstName: string; lastName: string };
  enrollmentCode?: string;
  gradeGroupId?: string | null;
  gradeGroup?: { id?: string; name: string } | null;
};
type Paginated<T> = { data: T[]; meta?: { total: number } };

const AVATARS = [
  "bg-blue-100 text-blue-700", "bg-amber-100 text-amber-700", "bg-pink-100 text-pink-700", "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700", "bg-teal-100 text-teal-700", "bg-orange-100 text-orange-700", "bg-sky-100 text-sky-700",
];
const nameOf = (s: StudentRow) => `${s.user.firstName} ${s.user.lastName}`;

export default function GruposPage() {
  const [yearId, setYearId] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [roster, setRoster] = useState<StudentRow[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // modal de grupo (crear / editar)
  const [groupModal, setGroupModal] = useState<{ open: boolean; editing?: Group } | null>(null);
  const [gName, setGName] = useState("");
  const [gLevel, setGLevel] = useState(1);
  const [savingGroup, setSavingGroup] = useState(false);

  // modal agregar estudiantes
  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);

  // boletines masivos
  const [bolOpen, setBolOpen] = useState(false);
  const [bolPeriod, setBolPeriod] = useState(1);
  const [bolBusy, setBolBusy] = useState(false);
  const [bolMsg, setBolMsg] = useState<string | null>(null);

  // materias (pensum) del grupo
  const [teachers, setTeachers] = useState<TeacherLite[]>([]);
  const [subjectModal, setSubjectModal] = useState<{ open: boolean; editing?: Subject } | null>(null);
  const [sName, setSName] = useState("");
  const [sTeacherId, setSTeacherId] = useState("");
  const [savingSubject, setSavingSubject] = useState(false);

  const selected = groups.find((g) => g.id === selectedId) ?? null;

  const loadGroups = useCallback(async (yid: string) => {
    const gs = await getGroups(yid);
    setGroups(gs);
    return gs;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const year = await getCurrentYear();
        if (!year) throw new Error("Sin año lectivo vigente.");
        setYearId(year.id);
        getTeachers().then(setTeachers).catch(() => {});
        const gs = await loadGroups(year.id);
        if (gs[0]) setSelectedId(gs[0].id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo cargar.");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadGroups]);

  // roster + materias del grupo seleccionado
  const loadDetail = useCallback(async (gid: string) => {
    if (!gid) { setRoster([]); setSubjects([]); return; }
    setLoadingDetail(true);
    try {
      const [r, subs] = await Promise.all([
        apiGet<Paginated<StudentRow>>(`/students?gradeGroupId=${gid}&limit=200`),
        getSubjects(gid).catch(() => []),
      ]);
      setRoster(r.data ?? []);
      setSubjects(subs);
    } catch {
      setRoster([]); setSubjects([]);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => { loadDetail(selectedId); }, [selectedId, loadDetail]);

  /* ---- crear / editar grupo ---- */
  const openCreate = () => { setGName(""); setGLevel(1); setGroupModal({ open: true }); };
  const openEdit = (g: Group) => { setGName(g.name); setGLevel(g.gradeLevel); setGroupModal({ open: true, editing: g }); };

  const saveGroup = async () => {
    const name = gName.trim();
    if (!name) return;
    setSavingGroup(true);
    try {
      if (groupModal?.editing) {
        await updateGroup(groupModal.editing.id, { name, gradeLevel: gLevel });
      } else {
        const created = await createGroup({ name, gradeLevel: gLevel, academicYearId: yearId });
        const gs = await loadGroups(yearId);
        setSelectedId(created?.id ?? gs[0]?.id ?? "");
      }
      await loadGroups(yearId);
      setGroupModal(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el grupo.");
    } finally {
      setSavingGroup(false);
    }
  };

  const removeGroup = async (g: Group) => {
    if (!confirm(`¿Eliminar el grupo "${g.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteGroup(g.id);
      const gs = await loadGroups(yearId);
      if (selectedId === g.id) setSelectedId(gs[0]?.id ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar (¿tiene estudiantes o materias?).");
    }
  };

  /* ---- agregar estudiantes ---- */
  const openAdd = () => { setQuery(""); setResults([]); setAddOpen(true); searchStudents(""); };

  const searchStudents = useCallback(async (q: string) => {
    setSearching(true);
    try {
      const qs = q.trim() ? `&search=${encodeURIComponent(q.trim())}` : "";
      const r = await apiGet<Paginated<StudentRow>>(`/students?limit=50${qs}`);
      setResults(r.data ?? []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const assign = async (s: StudentRow) => {
    if (!selectedId) return;
    setAssigning(s.id);
    try {
      await assignStudentToGroup(s.id, selectedId);
      // refleja el cambio localmente + refresca roster y conteos
      setResults((rs) => rs.map((x) => (x.id === s.id ? { ...x, gradeGroupId: selectedId, gradeGroup: { name: selected?.name ?? "" } } : x)));
      await Promise.all([loadDetail(selectedId), loadGroups(yearId)]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo asignar el estudiante.");
    } finally {
      setAssigning(null);
    }
  };

  /* ---- boletines masivos del grupo ---- */
  const generarBoletines = async () => {
    if (!selectedId) return;
    setBolBusy(true); setBolMsg(null);
    try {
      await apiPost(`/report-cards/generate/group/${selectedId}`, { periodNumber: bolPeriod });
      setBolMsg(`Generación encolada para el periodo ${bolPeriod}. Los PDF estarán listos en unos minutos en Boletines.`);
    } catch (e) {
      setBolMsg(e instanceof Error ? e.message : "No se pudo encolar la generación.");
    } finally {
      setBolBusy(false);
    }
  };

  /* ---- materias (pensum) ---- */
  const openCreateSubject = () => { setSName(""); setSTeacherId(teachers[0]?.id ?? ""); setSubjectModal({ open: true }); };
  const openEditSubject = (s: Subject) => { setSName(s.name); setSTeacherId(s.teacherId); setSubjectModal({ open: true, editing: s }); };

  const saveSubject = async () => {
    const name = sName.trim();
    if (!name || !sTeacherId || !selectedId) return;
    setSavingSubject(true);
    try {
      if (subjectModal?.editing) {
        await updateSubject(subjectModal.editing.id, { name, teacherId: sTeacherId });
      } else {
        await createSubject({ name, gradeGroupId: selectedId, teacherId: sTeacherId });
      }
      await loadDetail(selectedId);
      setSubjectModal(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la materia.");
    } finally {
      setSavingSubject(false);
    }
  };

  const removeSubject = async (s: Subject) => {
    if (!confirm(`¿Eliminar la materia "${s.name}"? Se borrarán sus logros y notas asociadas.`)) return;
    try {
      await deleteSubject(s.id);
      await loadDetail(selectedId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar la materia.");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center gap-2 px-8 py-24 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Cargando grupos…</div>;
  }

  return (
    <div className="flex flex-col gap-5 px-8 py-7">
      {/* header */}
      <div className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold tracking-[0.18em] text-primary">ADMINISTRACIÓN</span>
          <h1 className="text-[28px] font-bold -tracking-[0.02em] text-ink">Cursos</h1>
          <p className="text-[13px] text-subtle">Crea los cursos del año lectivo y asígnales estudiantes.</p>
        </div>
        <button onClick={openCreate} className="flex h-9 items-center gap-2 rounded-[10px] bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90">
          <Plus className="h-3.5 w-3.5" /> Nuevo grupo
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-s-error px-3.5 py-2.5 text-[13px] font-medium text-s-error-fg">
          <TriangleAlert className="h-4 w-4" /> {error}
          <button onClick={() => setError(null)} className="ml-auto text-xs underline">cerrar</button>
        </div>
      )}

      <div className="flex flex-col gap-5 lg:flex-row">
        {/* ===== lista de grupos ===== */}
        <div className="flex w-full flex-col gap-2.5 lg:w-[300px] lg:shrink-0">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-card py-12 text-center text-sm text-subtle">
              <LayoutGrid className="h-6 w-6 text-muted" /> Aún no hay grupos. Crea el primero.
            </div>
          ) : (
            groups.map((g) => {
              const on = g.id === selectedId;
              return (
                <div key={g.id} className={`group flex items-center gap-3 rounded-2xl border bg-card p-4 transition-colors ${on ? "border-primary ring-1 ring-primary/30" : "border-line hover:border-primary/40"}`}>
                  <button onClick={() => setSelectedId(g.id)} className="flex flex-1 items-center gap-3 text-left">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold ${on ? "bg-primary text-white" : "bg-primary-tint text-primary"}`}>{g.name.slice(0, 3)}</span>
                    <div className="flex flex-col">
                      <span className="text-[15px] font-bold text-ink">{g.name}</span>
                      <span className="text-[11px] text-subtle">{gradeLabel(g.gradeLevel)} · {g._count?.students ?? 0} estudiantes</span>
                    </div>
                  </button>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(g)} title="Editar" className="flex h-7 w-7 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-surface hover:text-ink"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => removeGroup(g)} title="Eliminar" className="flex h-7 w-7 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-s-error hover:text-s-error-fg"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ===== detalle del grupo ===== */}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-card py-20 text-center text-sm text-subtle">
              <GraduationCap className="h-7 w-7 text-muted" /> Selecciona un grupo para ver sus estudiantes.
            </div>
          ) : (
            <>
              {/* encabezado del grupo */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-card p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-base font-extrabold text-white">{selected.name.slice(0, 3)}</span>
                  <div className="flex flex-col">
                    <h2 className="text-lg font-bold text-ink">{selected.name}</h2>
                    <span className="flex items-center gap-3 text-[12px] text-subtle">
                      <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {roster.length} estudiantes</span>
                      <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {subjects.length} materias</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setBolMsg(null); setBolOpen(true); }} className="flex h-9 items-center gap-2 rounded-[10px] border border-line px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">
                    <FileBadge className="h-3.5 w-3.5" /> Boletines
                  </button>
                  <button onClick={openAdd} className="flex h-9 items-center gap-2 rounded-[10px] border border-primary bg-primary/5 px-3.5 text-[13px] font-semibold text-primary transition-colors hover:bg-primary/10">
                    <UserPlus className="h-3.5 w-3.5" /> Agregar estudiantes
                  </button>
                </div>
              </div>

              {/* director de grupo (titular) */}
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-card px-5 py-3">
                <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink"><Star className="h-4 w-4 text-amber-500" /> Director de grupo</span>
                <select
                  value={selected.director?.id ?? ""}
                  onChange={async (e) => { await updateGroup(selected.id, { directorId: e.target.value }); await loadGroups(yearId); }}
                  className="h-9 min-w-[220px] flex-1 rounded-lg border border-line bg-card px-3 text-[13px] text-ink outline-none focus:ring-2 focus:ring-primary/40">
                  <option value="">Sin asignar</option>
                  {teachers.map((tt) => <option key={tt.id} value={tt.id}>{tt.name}</option>)}
                </select>
              </div>

              {/* roster */}
              <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
                <div className="flex items-center gap-2 border-b border-line bg-surface px-5 py-3 text-[11px] font-bold tracking-[0.1em] text-subtle">
                  <span className="flex-1">ESTUDIANTE</span><span className="w-32">CÓDIGO</span>
                </div>
                {loadingDetail ? (
                  <div className="flex items-center justify-center gap-2 py-12 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>
                ) : roster.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-subtle">
                    <Users className="h-6 w-6 text-muted" /> Este grupo aún no tiene estudiantes. Usa “Agregar estudiantes”.
                  </div>
                ) : (
                  roster.map((s, i) => (
                    <div key={s.id} className={`flex items-center gap-3 px-5 py-2.5 ${i < roster.length - 1 ? "border-b border-line" : ""}`}>
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${AVATARS[i % AVATARS.length]}`}>{initials(s.user.firstName, s.user.lastName)}</span>
                      <span className="flex-1 truncate text-[13px] font-medium text-ink">{nameOf(s)}</span>
                      <span className="w-32 truncate text-[12px] text-subtle">{s.enrollmentCode ?? "—"}</span>
                    </div>
                  ))
                )}
              </div>

              {/* materias (pensum) */}
              <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
                <div className="flex items-center justify-between gap-2 border-b border-line bg-surface px-5 py-3">
                  <span className="flex items-center gap-2 text-[13px] font-bold text-ink"><BookOpen className="h-4 w-4 text-primary" /> Materias del grupo</span>
                  <button onClick={openCreateSubject} disabled={teachers.length === 0} className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[12px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40">
                    <Plus className="h-3.5 w-3.5" /> Agregar materia
                  </button>
                </div>
                {loadingDetail ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>
                ) : subjects.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-subtle">
                    <BookOpen className="h-6 w-6 text-muted" /> {teachers.length === 0 ? "Registra docentes para poder crear materias." : "Aún no hay materias. Agrega la primera."}
                  </div>
                ) : (
                  subjects.map((s, i) => (
                    <div key={s.id} className={`group flex items-center gap-3 px-5 py-2.5 ${i < subjects.length - 1 ? "border-b border-line" : ""}`}>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-tint text-primary"><BookOpen className="h-4 w-4" /></span>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-[13px] font-semibold text-ink">{s.name}</span>
                        <span className="truncate text-[11px] text-subtle">{fullName(s.teacher?.user)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditSubject(s)} title="Editar" className="flex h-7 w-7 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-surface hover:text-ink"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => removeSubject(s)} title="Eliminar" className="flex h-7 w-7 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-s-error hover:text-s-error-fg"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ===== modal crear/editar grupo ===== */}
      <Modal
        open={!!groupModal?.open}
        onClose={() => setGroupModal(null)}
        title={groupModal?.editing ? "Editar grupo" : "Nuevo grupo"}
        subtitle={groupModal?.editing ? "Actualiza el nombre o el grado." : "Define el nombre y el grado del curso."}
      >
        <FormField label="Nombre del grupo">
          <input value={gName} onChange={(e) => setGName(e.target.value)} placeholder="Ej: 10A" className={inputCls} autoFocus />
        </FormField>
        <FormField label="Grado">
          <select value={gLevel} onChange={(e) => setGLevel(Number(e.target.value))} className={inputCls}>
            {Array.from({ length: 12 }).map((_, n) => <option key={n} value={n}>{gradeLabel(n)}</option>)}
          </select>
        </FormField>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={() => setGroupModal(null)} className="h-9 rounded-lg border border-line px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">Cancelar</button>
          <button onClick={saveGroup} disabled={savingGroup || !gName.trim()} className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40">
            {savingGroup ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Guardar
          </button>
        </div>
      </Modal>

      {/* ===== modal agregar estudiantes ===== */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={`Agregar estudiantes · ${selected?.name ?? ""}`}
        subtitle="Busca estudiantes y asígnalos a este grupo. Si ya están en otro grupo, se moverán aquí."
        width={560}
      >
        <div className="flex h-11 items-center gap-2 rounded-lg border border-line bg-card px-3.5">
          <Search className="h-4 w-4 text-subtle" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); searchStudents(e.target.value); }}
            placeholder="Buscar por nombre…"
            className="flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted"
            autoFocus
          />
          {searching && <Loader2 className="h-4 w-4 animate-spin text-subtle" />}
        </div>

        <div className="flex max-h-[44vh] flex-col gap-1.5 overflow-y-auto">
          {results.length === 0 && !searching ? (
            <p className="py-8 text-center text-sm text-subtle">Sin resultados.</p>
          ) : (
            results.map((s, i) => {
              const here = s.gradeGroupId === selectedId;
              const elsewhere = !!s.gradeGroupId && s.gradeGroupId !== selectedId;
              return (
                <div key={s.id} className="flex items-center gap-2.5 rounded-xl border border-line bg-card px-3 py-2">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${AVATARS[i % AVATARS.length]}`}>{initials(s.user.firstName, s.user.lastName)}</span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[13px] font-medium text-ink">{nameOf(s)}</span>
                    {elsewhere && <span className="text-[11px] text-amber-600">Actualmente en {s.gradeGroup!.name}</span>}
                  </div>
                  {here ? (
                    <span className="flex items-center gap-1 rounded-lg bg-s-success px-2.5 py-1.5 text-[12px] font-semibold text-s-success-fg"><Check className="h-3.5 w-3.5" /> En el grupo</span>
                  ) : (
                    <button onClick={() => assign(s)} disabled={assigning === s.id} className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[12px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50">
                      {assigning === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} {elsewhere ? "Mover aquí" : "Agregar"}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Modal>

      {/* ===== modal crear/editar materia ===== */}
      <Modal
        open={!!subjectModal?.open}
        onClose={() => setSubjectModal(null)}
        title={subjectModal?.editing ? "Editar materia" : "Nueva materia"}
        subtitle={`Grupo ${selected?.name ?? ""}`}
      >
        <FormField label="Nombre de la materia">
          <input value={sName} onChange={(e) => setSName(e.target.value)} placeholder="Ej: Matemáticas" className={inputCls} autoFocus />
        </FormField>
        <FormField label="Docente">
          <select value={sTeacherId} onChange={(e) => setSTeacherId(e.target.value)} className={inputCls}>
            {teachers.length === 0 && <option value="">Sin docentes registrados</option>}
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </FormField>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={() => setSubjectModal(null)} className="h-9 rounded-lg border border-line px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">Cancelar</button>
          <button onClick={saveSubject} disabled={savingSubject || !sName.trim() || !sTeacherId} className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40">
            {savingSubject ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Guardar
          </button>
        </div>
      </Modal>

      {/* ===== modal boletines masivos ===== */}
      <Modal open={bolOpen} onClose={() => setBolOpen(false)} title={`Generar boletines · ${selected?.name ?? ""}`} subtitle="Encola la generación de los PDF de todo el grupo.">
        <FormField label="Periodo">
          <select value={bolPeriod} onChange={(e) => setBolPeriod(Number(e.target.value))} className={inputCls}>
            {[1, 2, 3, 4].map((n) => <option key={n} value={n}>Periodo {n}</option>)}
          </select>
        </FormField>
        {bolMsg && <p className="rounded-lg bg-surface px-3 py-2 text-[12px] text-ink">{bolMsg}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={() => setBolOpen(false)} className="h-9 rounded-lg border border-line px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">Cerrar</button>
          <button onClick={generarBoletines} disabled={bolBusy} className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40">
            {bolBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileBadge className="h-3.5 w-3.5" />} Generar boletines
          </button>
        </div>
      </Modal>
    </div>
  );
}
