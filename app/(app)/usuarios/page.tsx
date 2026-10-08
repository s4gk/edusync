import { redirect } from "next/navigation";

// La gestión de cuentas del staff vive ahora en Administración → Personal.
// Estudiantes, docentes y acudientes tienen sus propias secciones.
export default function UsuariosRedirect() {
  redirect("/personal");
}
