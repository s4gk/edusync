/* ============================================================
   Configuración institucional — identidad del colegio, año lectivo,
   periodos y escala de valoración.

   Todo esto existía en el backend sin ninguna pantalla que lo tocara: para
   abrir un año lectivo nuevo, definir los periodos o fijar la escala del
   Decreto 1290 había que entrar por API. Aquí quedan los helpers.
   ============================================================ */
import { apiGet, apiPost, apiPut } from "@/lib/api";
import type { AcademicPeriod, AcademicYear } from "@/lib/academic";

/* ---- identidad de la institución ---- */

export type SchoolProfile = {
  name: string; nit: string; dane: string; resolution: string;
  address: string; city: string; department: string;
  phone: string; email: string; website: string;
  rector: string; privacyEmail: string;
  calendar: string; character: string;
};

export type SchoolStatus = { school: SchoolProfile; completa: boolean; faltantes: string[] };

export const getSchool = () => apiGet<SchoolStatus>("/settings/school");
export const saveSchool = (patch: Partial<SchoolProfile>) => apiPut<SchoolProfile>("/settings/school", patch);

/** Etiquetas de los campos, en el orden en que se muestran. */
export const SCHOOL_FIELDS: { key: keyof SchoolProfile; label: string; hint?: string; required?: boolean }[] = [
  { key: "name", label: "Nombre de la institución", required: true },
  { key: "nit", label: "NIT", hint: "Con dígito de verificación", required: true },
  { key: "dane", label: "Código DANE" },
  { key: "resolution", label: "Resolución de aprobación", hint: "La que expide la Secretaría de Educación" },
  { key: "address", label: "Dirección", required: true },
  { key: "city", label: "Ciudad", required: true },
  { key: "department", label: "Departamento" },
  { key: "phone", label: "Teléfono" },
  { key: "email", label: "Correo institucional" },
  { key: "website", label: "Sitio web" },
  { key: "rector", label: "Rector(a)", hint: "Nombre que firma constancias y certificados", required: true },
  { key: "privacyEmail", label: "Correo para habeas data", hint: "A donde escriben las familias por sus datos personales", required: true },
  { key: "calendar", label: "Calendario", hint: "A o B" },
  { key: "character", label: "Carácter", hint: "Académico, técnico…" },
];

/* ---- año lectivo ---- */

export const listYears = () => apiGet<AcademicYear[]>("/academic/years");

export const createYear = (input: { year: number; startDate: string; endDate: string; isCurrent?: boolean }) =>
  apiPost<AcademicYear>("/academic/years", input);

export const updateYear = (id: string, input: { startDate?: string; endDate?: string; isCurrent?: boolean; isOpen?: boolean }) =>
  apiPut<AcademicYear>(`/academic/years/${id}`, input);

/* ---- periodos ---- */

export const createPeriod = (input: {
  academicYearId: string; name: string; periodNumber: number;
  startDate: string; endDate: string; weightPercent: number;
}) => apiPost<AcademicPeriod>("/academic/periods", input);

export const updatePeriod = (id: string, input: {
  name?: string; startDate?: string; endDate?: string; weightPercent?: number;
}) => apiPut<AcademicPeriod>(`/academic/periods/${id}`, input);

/** Cuatro periodos iguales repartidos dentro del año — el arranque habitual.
 *  Las fechas se pueden ajustar después una por una. */
export function suggestPeriods(startDate: string, endDate: string, count = 4) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const span = Math.max(1, end - start);
  const paso = span / count;
  const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
  const ORD = ["Primer", "Segundo", "Tercer", "Cuarto", "Quinto", "Sexto"];
  return Array.from({ length: count }, (_, i) => ({
    name: `${ORD[i] ?? `Periodo ${i + 1}`} Periodo`,
    periodNumber: i + 1,
    startDate: iso(start + paso * i),
    // Un día antes de que empiece el siguiente, para que no se solapen.
    endDate: iso(start + paso * (i + 1) - 86_400_000),
    weightPercent: Math.round((100 / count) * 100) / 100,
  }));
}

/* ---- escala de valoración (Decreto 1290) ---- */

export type ScaleKey = "SUPERIOR" | "ALTO" | "BASICO" | "BAJO";
export type GradeScaleRow = { id?: string; scale: ScaleKey; minScore: string | number; maxScore: string | number };

export const SCALE_LABEL: Record<ScaleKey, string> = {
  SUPERIOR: "Desempeño superior",
  ALTO: "Desempeño alto",
  BASICO: "Desempeño básico",
  BAJO: "Desempeño bajo",
};
export const SCALE_CHIP: Record<ScaleKey, string> = {
  SUPERIOR: "bg-s-success text-s-success-fg",
  ALTO: "bg-s-info text-s-info-fg",
  BASICO: "bg-surface text-ink",
  BAJO: "bg-s-error text-s-error-fg",
};
export const SCALE_ORDER: ScaleKey[] = ["SUPERIOR", "ALTO", "BASICO", "BAJO"];

/** La misma escala que el backend aplica por defecto cuando el año no tiene
 *  ninguna configurada. Sirve de punto de partida en la pantalla. */
export const DEFAULT_SCALE: GradeScaleRow[] = [
  { scale: "SUPERIOR", minScore: 4.6, maxScore: 5.0 },
  { scale: "ALTO", minScore: 4.0, maxScore: 4.59 },
  { scale: "BASICO", minScore: 3.0, maxScore: 3.99 },
  { scale: "BAJO", minScore: 1.0, maxScore: 2.99 },
];

export const getGradeScales = (yearId: string) => apiGet<GradeScaleRow[]>(`/academic/years/${yearId}/grade-scales`);

export const saveGradeScales = (academicYearId: string, scales: { scale: ScaleKey; minScore: number; maxScore: number }[]) =>
  apiPost<GradeScaleRow[]>("/academic/grade-scales", { academicYearId, scales });

/** Revisa que la escala cubra 1.0–5.0 sin huecos ni traslapes. Un hueco deja
 *  notas sin desempeño en el boletín; un traslape las deja con dos. */
export function validateScale(rows: { scale: ScaleKey; minScore: number; maxScore: number }[]): string[] {
  const errs: string[] = [];
  const ordenadas = [...rows].sort((a, b) => b.minScore - a.minScore);

  for (const r of ordenadas) {
    if (r.minScore > r.maxScore) errs.push(`${SCALE_LABEL[r.scale]}: el mínimo es mayor que el máximo.`);
  }
  if (ordenadas.length && Math.abs(ordenadas[0].maxScore - 5) > 0.001) {
    errs.push("El desempeño más alto debe llegar hasta 5.0.");
  }
  for (let i = 0; i < ordenadas.length - 1; i++) {
    const arriba = ordenadas[i];
    const abajo = ordenadas[i + 1];
    const brecha = Math.round((arriba.minScore - abajo.maxScore) * 100) / 100;
    if (brecha > 0.011) errs.push(`Queda un hueco entre ${SCALE_LABEL[abajo.scale]} y ${SCALE_LABEL[arriba.scale]}: ninguna nota entre ${abajo.maxScore} y ${arriba.minScore} tendría desempeño.`);
    if (brecha < 0) errs.push(`${SCALE_LABEL[abajo.scale]} y ${SCALE_LABEL[arriba.scale]} se traslapan.`);
  }
  return errs;
}
