/* ============================================================
   Módulo de Horarios — ahora respaldado por el backend (/api/schedule).
   Aquí quedan solo los helpers estáticos (bloques, días, tiempo, color).
   Los datos (docentes, materias, slots) vienen de la API vía schedule-context.
   ============================================================ */

export type Block = { id: number; label: string; start: string; end: string };

export const BLOCKS: Block[] = [
  { id: 1, label: "1ª hora", start: "06:30", end: "07:30" },
  { id: 2, label: "2ª hora", start: "07:30", end: "08:30" },
  { id: 3, label: "3ª hora", start: "08:30", end: "09:30" },
  { id: 4, label: "4ª hora", start: "09:30", end: "10:30" },
  { id: 5, label: "5ª hora", start: "10:30", end: "11:30" },
  { id: 6, label: "6ª hora", start: "11:30", end: "12:30" },
];

export type Day = { idx: number; label: string; short: string };

/** idx = Date.getDay() (Lun=1 … Vie=5). */
export const DAYS: Day[] = [
  { idx: 1, label: "Lunes", short: "Lun" },
  { idx: 2, label: "Martes", short: "Mar" },
  { idx: 3, label: "Miércoles", short: "Mié" },
  { idx: 4, label: "Jueves", short: "Jue" },
  { idx: 5, label: "Viernes", short: "Vie" },
];

/* ---------- tipos de la API ---------- */

export type ApiSubject = { id: string; name: string; gradeGroupId: string; gradeGroup: { id: string; name: string; gradeLevel: number } };
export type ApiTeacher = { id: string; userId: string; name: string; speciality: string; assignedHours: number; groups: string[]; subjects: ApiSubject[] };
export type ApiSlot = {
  id: string;
  subjectId: string;
  dayOfWeek: number;
  block: number;
  room: string | null;
  subject: {
    id: string; name: string; gradeGroupId: string;
    gradeGroup: { id: string; name: string; gradeLevel: number };
    teacher?: { user?: { firstName: string; lastName: string } };
  };
};

/** "Curso" derivado de un slot (lo que pinta la grilla). */
export type Course = { slotId: string; subjectId: string; materia: string; grado: string; gradeGroupId: string; aula: string; color: string };

const PALETTE = ["#6366F1", "#8B5CF6", "#0EA5E9", "#F59E0B", "#EC4899", "#10B981", "#14B8A6", "#EF4444", "#A855F7", "#3B82F6"];
const NAMED: Record<string, string> = {
  "Matemáticas": "#6366F1", "Lengua Castellana": "#EC4899", "Ciencias Naturales": "#10B981",
  "Ciencias Sociales": "#F59E0B", "Inglés": "#14B8A6", "Educación Física": "#0EA5E9",
  "Educación Artística": "#A855F7", "Tecnología e Informática": "#3B82F6",
};
export function colorFor(name: string): string {
  if (NAMED[name]) return NAMED[name];
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function slotToCourse(slot: ApiSlot): Course {
  return {
    slotId: slot.id,
    subjectId: slot.subjectId,
    materia: slot.subject.name,
    grado: slot.subject.gradeGroup.name,
    gradeGroupId: slot.subject.gradeGroupId,
    aula: slot.room ?? "—",
    color: colorFor(slot.subject.name),
  };
}

/* ---------- helpers de tiempo ---------- */

export const timeToMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export const fmt = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  const ap = h < 12 ? "a.m." : "p.m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ap}`;
};

export const isSchoolDay = (d: Date) => d.getDay() >= 1 && d.getDay() <= 5;

/** Bloque en curso según la hora (o null si está fuera de los bloques). */
export function currentBlock(now: Date): Block | null {
  const m = now.getHours() * 60 + now.getMinutes();
  return BLOCKS.find((b) => m >= timeToMin(b.start) && m < timeToMin(b.end)) ?? null;
}

/** Estado de un bloque respecto a la hora actual del día visible. */
export function blockStatus(block: Block, now: Date, isToday: boolean): "done" | "current" | "next" | "upcoming" {
  if (!isToday) return "upcoming";
  const m = now.getHours() * 60 + now.getMinutes();
  if (m >= timeToMin(block.end)) return "done";
  if (m >= timeToMin(block.start)) return "current";
  return "upcoming";
}
