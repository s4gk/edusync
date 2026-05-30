/* ============================================================
   Modelo del módulo de Horarios (mock, sin backend).
   Jornada: lunes a viernes, 6 bloques de 1 h, 6:30–12:30.
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

export type Course = { id: string; materia: string; grado: string; aula: string; color: string };

export const COURSES: Course[] = [
  { id: "m6a", materia: "Matemáticas", grado: "6°A", aula: "204", color: "#6366F1" },
  { id: "m7b", materia: "Matemáticas", grado: "7°B", aula: "204", color: "#6366F1" },
  { id: "m8b", materia: "Matemáticas", grado: "8°B", aula: "204", color: "#6366F1" },
  { id: "m9a", materia: "Matemáticas", grado: "9°A", aula: "205", color: "#6366F1" },
  { id: "m10c", materia: "Matemáticas", grado: "10°C", aula: "205", color: "#6366F1" },
  { id: "m11a", materia: "Matemáticas", grado: "11°A", aula: "206", color: "#6366F1" },
  { id: "geo8", materia: "Geometría", grado: "8°B", aula: "204", color: "#8B5CF6" },
  { id: "est10", materia: "Estadística", grado: "10°C", aula: "205", color: "#0EA5E9" },
  { id: "soc8", materia: "Ciencias Sociales", grado: "8°B", aula: "102", color: "#F59E0B" },
  { id: "len7", materia: "Lengua Castellana", grado: "7°B", aula: "110", color: "#EC4899" },
  { id: "nat9", materia: "Ciencias Naturales", grado: "9°A", aula: "Lab 1", color: "#10B981" },
  { id: "ing11", materia: "Inglés", grado: "11°A", aula: "108", color: "#14B8A6" },
];

export const courseById = (id: string | undefined) => COURSES.find((c) => c.id === id);

export type Teacher = { id: string; name: string; materia: string; initials: string };

export const TEACHERS: Teacher[] = [
  { id: "t1", name: "Carlos Ríos", materia: "Matemáticas", initials: "CR" },
  { id: "t2", name: "Ana Mejía", materia: "Ciencias Sociales", initials: "AM" },
  { id: "t3", name: "Jorge Mendoza", materia: "Ciencias Naturales", initials: "JM" },
  { id: "t4", name: "Laura Botero", materia: "Lengua Castellana", initials: "LB" },
];

/** Profesor "logueado" para la vista Mi día. */
export const CURRENT_TEACHER_ID = "t1";

/* ---------- claves del store: teacher|day|block ---------- */

export type Assignments = Record<string, string>;
export const slotKey = (teacherId: string, day: number, block: number) => `${teacherId}|${day}|${block}`;

/** Horario semilla (lo que vería precargado, editable por la admin). */
export function seedAssignments(): Assignments {
  const a: Assignments = {};
  const t1week: Record<number, string[]> = {
    1: ["m6a", "m7b", "m8b", "geo8", "m9a", "m11a"],
    2: ["m8b", "m9a", "m10c", "m6a", "m7b", "est10"],
    3: ["m7b", "m8b", "geo8", "m11a", "m9a", "m6a"],
    4: ["m9a", "m10c", "m11a", "m8b", "m6a", "m7b"],
    5: ["m6a", "m8b", "m7b", "m9a", "est10", "m11a"],
  };
  for (const day of DAYS) {
    t1week[day.idx].forEach((courseId, i) => {
      a[slotKey("t1", day.idx, BLOCKS[i].id)] = courseId;
    });
  }
  // un par de bloques de ejemplo para otra profe
  a[slotKey("t2", 1, 1)] = "soc8";
  a[slotKey("t2", 1, 3)] = "soc8";
  a[slotKey("t2", 2, 2)] = "soc8";
  return a;
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

/* ---------- roster por curso (mock determinista) ---------- */

const NAME_POOL = [
  "Ana Castillo", "Bryan Méndez", "Carolina Ríos", "Daniel Ortiz", "Esteban Lozano",
  "Felipe Vargas", "Gabriela Franco", "Hugo Bermúdez", "Isabella Pérez", "Jaime Salcedo",
  "Karen Duarte", "Luis Pardo", "Mariana Gómez", "Nicolás Rojas", "Olga Suárez",
  "Pablo Restrepo", "Quintín Ávila", "Renata Silva", "Samuel Acosta", "Tatiana Mora",
  "Uriel Cano", "Valeria Cruz", "Wilmer Díaz", "Ximena León", "Yeison Parra",
  "Zoe Ramírez", "Andrés Patiño", "Brenda Soto", "Camilo Vega", "Diana Castaño",
  "Emilio Torres", "Fernanda Gil", "Gustavo Niño", "Helena Quintero", "Iván Bravo",
  "Julieta Ramos", "Kevin Hoyos", "Lucía Mejía", "Mateo Vélez", "Natalia Ospina",
];

const initialsOf = (name: string) => name.split(" ").map((p) => p[0]).join("").slice(0, 2);

export type RosterStudent = { id: string; name: string; initials: string };

/** Lista de estudiantes de un curso (determinista por id → estable). */
export function rosterFor(courseId: string): RosterStudent[] {
  let h = 0;
  for (const ch of courseId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const start = h % NAME_POOL.length;
  const n = 26 + (h % 7); // 26–32 estudiantes
  const out: RosterStudent[] = [];
  for (let i = 0; i < n; i++) {
    const name = NAME_POOL[(start + i) % NAME_POOL.length];
    out.push({ id: `${courseId}-${i}`, name, initials: initialsOf(name) });
  }
  return out;
}
