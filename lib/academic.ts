/* ============================================================
   Helpers de contexto académico — año vigente, grupos y materias.
   Centraliza los selectores que comparten varias pantallas.
   ============================================================ */
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

export type AcademicYear = { id: string; year: number; isCurrent?: boolean };
export type Group = {
  id: string; name: string; gradeLevel: number;
  directorId?: string | null;
  director?: { id: string; user: { firstName: string; lastName: string } } | null;
  _count?: { students: number; subjects?: number };
};
export type Subject = { id: string; name: string; teacherId: string; teacher?: { user?: { firstName: string; lastName: string } } };
export type AcademicPeriod = { id: string; name: string; periodNumber: number; status?: string; startDate?: string; endDate?: string; isClosed?: boolean };

/** Número del periodo vigente hoy (por fechas); cae al primero abierto o al 1. */
export function currentPeriodNumber(periods: AcademicPeriod[]): number {
  if (!periods.length) return 1;
  const today = new Date().toISOString().slice(0, 10);
  const byDate = periods.find((p) => (p.startDate ?? "").slice(0, 10) <= today && today <= (p.endDate ?? "").slice(0, 10));
  return (byDate ?? periods.find((p) => !p.isClosed) ?? periods[0]).periodNumber;
}

export const PERIODS = [1, 2, 3, 4] as const;
export const periodLabel = (n: number) => `Periodo ${n}`;
export const periodTag = (n: number) => `P${n}`;

/** Año lectivo vigente (o el más reciente). */
export async function getCurrentYear(): Promise<AcademicYear | null> {
  const years = await apiGet<AcademicYear[]>("/academic/years");
  if (!years?.length) return null;
  return years.find((y) => y.isCurrent) ?? years[0];
}

/** Grupos del año vigente, ordenados por grado y nombre. */
export async function getGroups(yearId: string): Promise<Group[]> {
  const gs = await apiGet<Group[]>(`/academic/years/${yearId}/groups`);
  return gs.sort((a, b) => a.gradeLevel - b.gradeLevel || a.name.localeCompare(b.name));
}

/** Materias de un grupo. */
export async function getSubjects(groupId: string): Promise<Subject[]> {
  return apiGet<Subject[]>(`/academic/groups/${groupId}/subjects`);
}

/** Etiqueta legible del grado (0 = Preescolar). */
export const gradeLabel = (n: number) => (n === 0 ? "Preescolar" : `Grado ${n}`);

/* ---- administración de grupos ---- */
export async function createGroup(input: { name: string; gradeLevel: number; academicYearId: string }) {
  return apiPost<Group>("/academic/groups", input);
}
export async function updateGroup(id: string, input: { name?: string; gradeLevel?: number; directorId?: string }) {
  return apiPut<Group>(`/academic/groups/${id}`, input);
}
export async function deleteGroup(id: string) {
  return apiDelete(`/academic/groups/${id}`);
}

/** Asigna (o mueve) un estudiante a un grupo. */
export async function assignStudentToGroup(studentId: string, gradeGroupId: string) {
  return apiPut(`/students/${studentId}`, { gradeGroupId });
}

/* ---- administración de materias (pensum del grupo) ---- */
export type TeacherLite = { id: string; name: string };
export async function getTeachers(): Promise<TeacherLite[]> {
  return apiGet<TeacherLite[]>("/schedule/teachers");
}
export async function createSubject(input: { name: string; gradeGroupId: string; teacherId: string }) {
  return apiPost<Subject>("/academic/subjects", input);
}
export async function updateSubject(id: string, input: { name?: string; teacherId?: string }) {
  return apiPut<Subject>(`/academic/subjects/${id}`, input);
}
export async function deleteSubject(id: string) {
  return apiDelete(`/academic/subjects/${id}`);
}

/** Periodos definidos del año. */
export async function getPeriods(yearId: string): Promise<AcademicPeriod[]> {
  try {
    const ps = await apiGet<AcademicPeriod[]>(`/academic/years/${yearId}/periods`);
    return ps.sort((a, b) => a.periodNumber - b.periodNumber);
  } catch {
    return [];
  }
}

export const fullName = (u?: { firstName: string; lastName: string } | null) =>
  u ? `${u.firstName} ${u.lastName}` : "—";
export const initials = (f?: string, l?: string) => `${f?.[0] ?? ""}${l?.[0] ?? ""}`.toUpperCase();

/** Color de chip por escala colombiana (S/A/Bs/Bj) a partir de nota 0-5. */
export function scaleOf(p: number | null | undefined): { txt: string; label: string; chip: string } {
  if (p == null) return { txt: "—", label: "Sin nota", chip: "bg-surface text-subtle" };
  if (p >= 4.6) return { txt: "S", label: "Superior", chip: "bg-s-success text-s-success-fg" };
  if (p >= 4.0) return { txt: "A", label: "Alto", chip: "bg-s-info text-s-info-fg" };
  if (p >= 3.0) return { txt: "Bs", label: "Básico", chip: "bg-surface text-ink" };
  return { txt: "Bj", label: "Bajo", chip: "bg-s-error text-s-error-fg" };
}
