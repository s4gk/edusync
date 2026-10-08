/**
 * A dónde pertenece cada rol.
 *
 * El panel del grupo `(app)` es la consola del colegio: menú de administración,
 * finanzas, cursos, personal. Una familia no tiene nada que hacer ahí —además de
 * que casi todo le respondería 403— así que acudientes y estudiantes tienen su
 * propia entrada y el guard los devuelve a ella si caen dentro.
 */

import { useEffect, useState } from "react";
import { getPolitica } from "@/lib/privacy";

/**
 * Nombre del colegio, tomado de la única configuración que ya existe: la del
 * responsable del tratamiento en el backend (`SCHOOL_NAME`). Así el nombre que
 * sale en el menú es el mismo que sale en los PDF, los correos, el asistente de
 * WhatsApp y la política de datos, y se cambia en un solo sitio.
 */
export function useSchoolName(fallback = "Colegio") {
  const [nombre, setNombre] = useState<string | null>(null);
  useEffect(() => {
    let vivo = true;
    getPolitica()
      .then((p) => vivo && setNombre(p.responsable.nombre))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);
  return nombre ?? fallback;
}

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  RECTOR: "Rectoría",
  COORDINATOR_ACADEMIC: "Coordinación académica",
  COORDINATOR_CONVIVENCIA: "Coordinación de convivencia",
  SECRETARY: "Secretaría",
  ACCOUNTANT: "Contabilidad",
  TEACHER: "Docente",
  GUARDIAN: "Acudiente",
  STUDENT: "Estudiante",
};

export const roleLabel = (role?: string) => (role ? (ROLE_LABELS[role] ?? role) : "");

/** Roles que NO usan la consola administrativa. */
export const FAMILY_ROLES = ["GUARDIAN", "STUDENT"];

export const isFamilyRole = (role?: string) => !!role && FAMILY_ROLES.includes(role);

/** Pantalla de inicio de cada rol tras autenticarse. */
export function homeForRole(role?: string) {
  switch (role) {
    case "TEACHER":
      return "/clase";
    case "GUARDIAN":
      return "/app-acudiente";
    case "STUDENT":
      return "/tarjeta";
    default:
      return "/dashboard";
  }
}
