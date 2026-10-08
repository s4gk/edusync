import { redirect } from "next/navigation";

// La lista de estudiantes vive ahora en Administración → Estudiantes.
// Mantenemos la ruta para no romper enlaces antiguos; el wizard sigue en /matriculas/nuevo.
export default function MatriculasRedirect() {
  redirect("/estudiantes");
}
