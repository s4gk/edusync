/* Etiquetas legibles para las claves del perfil (User.profile JSON) y categorías de documentos. */

export const PROFILE_LABELS: Record<string, string> = {
  documentType: "Tipo de documento",
  documentId: "Número de documento",
  secondName: "Segundo nombre",
  secondLastName: "Segundo apellido",
  gender: "Sexo",
  birthDate: "Fecha de nacimiento",
  birthPlace: "Lugar de nacimiento",
  nationality: "Nacionalidad",
  bloodType: "Grupo sanguíneo (RH)",
  landline: "Teléfono fijo",
  address: "Dirección",
  neighborhood: "Barrio",
  city: "Ciudad",
  department: "Departamento",
  // salud / población
  eps: "EPS / aseguradora",
  medicalConditions: "Condiciones médicas",
  disability: "Discapacidad",
  stratum: "Estrato",
  sisben: "SISBÉN",
  ethnicity: "Etnia / grupo poblacional",
  isVictim: "Víctima del conflicto",
  // académico (estudiante)
  jornada: "Jornada",
  previousSchool: "Institución de procedencia",
  previousGrade: "Último grado cursado",
  // laboral (acudiente)
  occupation: "Ocupación / profesión",
  company: "Empresa / lugar de trabajo",
  workPhone: "Teléfono laboral",
  educationLevel: "Nivel educativo",
  livesWithStudent: "Vive con el estudiante",
  isFinancialResponsible: "Responsable económico",
  // docente
  escalafon: "Escalafón",
  title: "Título profesional",
  hireDate: "Fecha de ingreso",
  contractType: "Tipo de vinculación",
  // personal
  area: "Dependencia / área",
};

/** Orden de presentación de las claves del perfil. */
export const PROFILE_ORDER = Object.keys(PROFILE_LABELS);

export const DOC_CATEGORY_LABELS: Record<string, string> = {
  registro_civil: "Registro civil",
  documento_identidad: "Documento de identidad",
  boletin_anterior: "Boletín año anterior",
  carnet_eps: "Carné EPS / vacunas",
  hoja_vida: "Hoja de vida",
  titulo: "Título / diplomas",
  otros: "Otros soportes",
};
export const docCategoryLabel = (c: string) => DOC_CATEGORY_LABELS[c] ?? c;
