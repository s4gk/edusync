"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, Mail, Phone, BookOpen, Award, Clock, LayoutGrid, Users, Star, Plus, TriangleAlert, Check,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { getCurrentYear, getGroups, type Group } from "@/lib/academic";
import { Modal, FormField, inputCls } from "@/components/modal";
import { ProfileGrid, DocumentsList, FichaHeader, type DocItem } from "@/components/profile-view";
import { PersonActions } from "@/components/person-actions";
import { EditPersonModal } from "@/components/edit-person-modal";

type Slot = { id: string; dayOfWeek: number; block: number; room: string | null };
type Subject = { id: string; name: string; hoursPerWeek: number; gradeGroup: { id: string; name: string; gradeLevel: number; _count: { students: number } } | null; scheduleSlots: Slot[] };
type Teacher = {
  id: string; speciality: string | null;
  user: { id: string; firstName: string; lastName: string; email: string; phone: string | null; avatarUrl: string | null; status: string; profile?: Record<string, unknown> | null; documents?: DocItem[] };
  subjects: Subject[];
  directedGroups: { id: string; name: string; gradeLevel: number }[];
};

const STATUS_META: Record<string, { label: string; chip: string }> = {
  ACTIVE: { label: "Activo", chip: "bg-s-success text-s-success-fg" },
  INACTIVE: { label: "Inactivo", chip: "bg-surface text-subtle" },
  SUSPENDED: { label: "Suspendido", chip: "bg-s-error text-s-error-fg" },
  PENDING: { label: "Pendiente", chip: "bg-s-warning text-s-warning-fg" },
};
const DAYS = [{ n: 1, l: "Lunes" }, { n: 2, l: "Martes" }, { n: 3, l: "Miércoles" }, { n: 4, l: "Jueves" }, { n: 5, l: "Viernes" }];
const BLOCKS = [1, 2, 3, 4, 5, 6];
const initialsOf = (f: string, l: string) => `${f?.[0] ?? ""}${l?.[0] ?? ""}`.toUpperCase();

export default function FichaDocentePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const [t, setT] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // asignar materia
  const [groups, setGroups] = useState<Group[]>([]);
  const [open, setOpen] = useState(false);
  const [aGroup, setAGroup] = useState("");
  const [aName, setAName] = useState("");
  const [aHours, setAHours] = useState("1");
  const [aSaving, setASaving] = useState(false);
  const [aError, setAError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setT(await apiGet<Teacher>(`/teachers/${id}`)); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudo cargar el docente."); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { if (id) load(); }, [id, load]);
  useEffect(() => {
    (async () => { try { const y = await getCurrentYear(); if (y) setGroups(await getGroups(y.id)); } catch { /* */ } })();
  }, []);

  const assign = async () => {
    if (!aGroup || !aName.trim()) { setAError("Elige grupo y nombre de la materia."); return; }
    setASaving(true); setAError(null);
    try {
      await apiPost("/academic/subjects", { name: aName.trim(), gradeGroupId: aGroup, teacherId: id, hoursPerWeek: Number(aHours) || 1 });
      setOpen(false); setAName(""); setAGroup(""); setAHours("1");
      await load();
    } catch (e) {
      setAError(e instanceof Error ? e.message : "No se pudo asignar la materia.");
    } finally { setASaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center gap-2 px-8 py-24 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Cargando ficha…</div>;
  if (error || !t) return <div className="flex items-center justify-center px-8 py-24 text-sm text-s-error-fg">{error ?? "No encontrado"}</div>;

  const sm = STATUS_META[t.user.status] ?? { label: t.user.status, chip: "bg-surface text-subtle" };
  const horas = t.subjects.reduce((a, s) => a + (s.hoursPerWeek || 0), 0);
  const groupIds = [...new Set(t.subjects.map((s) => s.gradeGroup?.id).filter(Boolean))] as string[];
  const estudiantes = groupIds.reduce((a, gid) => a + (t.subjects.find((s) => s.gradeGroup?.id === gid)?.gradeGroup?._count.students ?? 0), 0);

  const slotMap = new Map<string, { name: string; group?: string; room: string | null }>();
  t.subjects.forEach((s) => s.scheduleSlots.forEach((sl) => slotMap.set(`${sl.dayOfWeek}-${sl.block}`, { name: s.name, group: s.gradeGroup?.name, room: sl.room })));
  const hasSchedule = slotMap.size > 0;

  return (
    <div className="flex flex-col gap-5 px-8 py-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Link href="/profesores" className="flex w-fit items-center gap-1.5 text-[13px] font-semibold text-subtle transition-colors hover:text-ink"><ArrowLeft className="h-4 w-4" /> Docentes</Link>
        <PersonActions userId={t.user.id} status={t.user.status} onEdit={() => setEditOpen(true)} onChanged={load} />
      </div>

      <FichaHeader avatarUrl={t.user.avatarUrl} initials={initialsOf(t.user.firstName, t.user.lastName)} name={`${t.user.firstName} ${t.user.lastName}`}
        badges={<>
          {t.speciality && <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5" /> {t.speciality}</span>}
          <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {t.user.email}</span>
          {t.user.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {t.user.phone}</span>}
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${sm.chip}`}>{sm.label}</span>
        </>} />

      {t.directedGroups.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-s-warning px-4 py-2.5 text-[13px] text-s-warning-fg">
          <Star className="h-4 w-4 fill-current" /> <span className="font-semibold">Director de grupo:</span> {t.directedGroups.map((g) => g.name).join(", ")}
        </div>
      )}

      {/* carga académica */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Horas / semana", value: String(horas), icon: Clock },
          { label: "Grupos", value: String(groupIds.length), icon: LayoutGrid },
          { label: "Estudiantes", value: String(estudiantes), icon: Users },
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

      {/* horario semanal */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
        <div className="border-b border-line bg-surface px-5 py-3 text-[13px] font-bold text-ink">Horario semanal</div>
        {!hasSchedule ? (
          <div className="py-8 text-center text-sm text-subtle">Sin horario asignado. Se define en Horarios.</div>
        ) : (
          <div className="overflow-x-auto p-3">
            <table className="w-full border-separate border-spacing-1 text-center">
              <thead>
                <tr>
                  <th className="w-10" />
                  {DAYS.map((d) => <th key={d.n} className="px-2 py-1 text-[11px] font-bold tracking-wide text-subtle">{d.l}</th>)}
                </tr>
              </thead>
              <tbody>
                {BLOCKS.map((b) => (
                  <tr key={b}>
                    <td className="text-[11px] font-bold text-subtle">{b}ª</td>
                    {DAYS.map((d) => {
                      const cell = slotMap.get(`${d.n}-${b}`);
                      return (
                        <td key={d.n} className="min-w-[96px]">
                          {cell ? (
                            <div className="flex flex-col rounded-lg bg-primary/10 px-2 py-1.5 text-left">
                              <span className="truncate text-[11px] font-semibold text-primary">{cell.name}</span>
                              <span className="truncate text-[10px] text-subtle">{cell.group}{cell.room ? ` · ${cell.room}` : ""}</span>
                            </div>
                          ) : <div className="h-9 rounded-lg bg-surface/40" />}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5 xl:flex-row">
        <div className="flex flex-1 flex-col gap-5">
          <ProfileGrid profile={t.user.profile} />
          <DocumentsList documents={t.user.documents} />
        </div>
        <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-line bg-card xl:w-[360px] xl:shrink-0">
          <div className="flex items-center justify-between border-b border-line bg-surface px-5 py-3">
            <span className="text-[13px] font-bold text-ink">Materias ({t.subjects.length})</span>
            <button onClick={() => { setAError(null); setOpen(true); }} className="flex h-7 items-center gap-1.5 rounded-lg bg-primary px-2.5 text-[12px] font-semibold text-white transition-opacity hover:opacity-90">
              <Plus className="h-3.5 w-3.5" /> Asignar
            </button>
          </div>
          {t.subjects.length === 0 ? (
            <div className="py-8 text-center text-sm text-subtle">Sin materias asignadas.</div>
          ) : t.subjects.map((s, i) => (
            <div key={s.id} className={`flex items-center gap-2.5 px-5 py-3 ${i < t.subjects.length - 1 ? "border-b border-line" : ""}`}>
              <BookOpen className="h-4 w-4 shrink-0 text-primary" />
              <span className="flex-1 text-[13px] text-ink">{s.name} <span className="text-subtle">· {s.hoursPerWeek}h</span></span>
              {s.gradeGroup && <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-subtle">{s.gradeGroup.name}</span>}
            </div>
          ))}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Asignar materia" subtitle={`Para ${t.user.firstName} ${t.user.lastName}`}>
        <FormField label="Grupo">
          <select className={inputCls} value={aGroup} onChange={(e) => setAGroup(e.target.value)}>
            <option value="">Selecciona…</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </FormField>
        <div className="flex gap-3">
          <FormField label="Materia"><input className={inputCls} value={aName} onChange={(e) => setAName(e.target.value)} placeholder="Matemáticas" /></FormField>
          <FormField label="Horas/semana"><input className={inputCls} type="number" min={1} value={aHours} onChange={(e) => setAHours(e.target.value)} /></FormField>
        </div>
        {aError && <div className="flex items-center gap-2 rounded-lg bg-s-error px-3 py-2 text-[13px] text-s-error-fg"><TriangleAlert className="h-4 w-4" /> {aError}</div>}
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={() => setOpen(false)} className="flex h-9 items-center rounded-lg border border-line px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">Cancelar</button>
          <button onClick={assign} disabled={aSaving} className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40">
            {aSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Asignar
          </button>
        </div>
      </Modal>

      <EditPersonModal open={editOpen} onClose={() => setEditOpen(false)} kind="teacher" userId={t.user.id}
        initial={{ firstName: t.user.firstName, lastName: t.user.lastName, email: t.user.email, phone: t.user.phone, avatarUrl: t.user.avatarUrl, profile: t.user.profile, speciality: t.speciality }}
        onSaved={load} />
    </div>
  );
}
