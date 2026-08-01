import {
  LayoutDashboard,
  BookUser,
  Briefcase,
  FileText,
  CalendarCheck,
  BookText,
  MessageSquareWarning,
  Wallet,
  Mail,
  Settings,
  GraduationCap,
  LayoutGrid,
  FileBadge,
  Award,
  Lock,
  ClipboardCheck,
  Upload,
  Newspaper,
  BarChart3,
  CircleDashed,
  Sparkles,
  IdCard,
  LineChart,
  Smartphone,
  Users2,
  HardDrive,
  type LucideIcon,
} from "lucide-react";

export type Route = {
  label: string;
  href: string;
  group: string;
  icon: LucideIcon;
  keywords?: string;
};

/** Rutas internas (con sidebar). Orden = como se agrupan en el menú. */
export const ROUTES: Route[] = [
  { label: "Inicio", href: "/dashboard", group: "General", icon: LayoutDashboard, keywords: "dashboard resumen panel" },
  { label: "Pendientes", href: "/pendientes", group: "General", icon: ClipboardCheck, keywords: "tareas alertas riesgo lo que falta hoy" },
  { label: "Calificaciones", href: "/calificaciones", group: "Académico", icon: FileText, keywords: "notas libro" },
  { label: "Asistencia", href: "/asistencia", group: "Académico", icon: CalendarCheck, keywords: "lista presentes" },
  { label: "Boletines", href: "/boletines", group: "Académico", icon: BookText, keywords: "reporte periodo" },
  { label: "Cierre de periodo", href: "/periodos", group: "Académico", icon: Lock, keywords: "cerrar periodo bloquear notas reabrir" },
  { label: "Cierre de año", href: "/cierre", group: "Académico", icon: Award, keywords: "promocion consolidado acta definitiva promovido reprobado" },
  { label: "Observaciones", href: "/observaciones", group: "Académico", icon: MessageSquareWarning, keywords: "disciplina convivencia" },
  { label: "Estudiantes", href: "/estudiantes", group: "Administración", icon: GraduationCap, keywords: "alumnos matricula inscripcion ficha directorio estudiante" },
  { label: "Docentes", href: "/profesores", group: "Administración", icon: BookUser, keywords: "profesores maestros especialidad docente nuevo" },
  { label: "Acudientes", href: "/acudientes", group: "Administración", icon: Users2, keywords: "padres familia tutor responsable acudiente registrar" },
  { label: "Personal", href: "/personal", group: "Administración", icon: Briefcase, keywords: "rector coordinador secretaria contabilidad administrativo staff cuentas usuarios" },
  { label: "Cursos", href: "/grupos", group: "Administración", icon: LayoutGrid, keywords: "cursos grupos salones asignar estudiantes salon" },
  { label: "Importar", href: "/importar", group: "Administración", icon: Upload, keywords: "onboarding csv masivo carga estudiantes" },
  { label: "Reportes", href: "/reportes", group: "Operación", icon: BarChart3, keywords: "analitica indicadores rendimiento" },
  { label: "Finanzas", href: "/finanzas", group: "Operación", icon: Wallet, keywords: "cartera cobros pagos pension" },
  { label: "Comunicaciones", href: "/comunicaciones", group: "Operación", icon: Mail, keywords: "mensajes circulares" },
  { label: "Certificados", href: "/certificados", group: "Operación", icon: FileBadge, keywords: "constancia estudio notas paz y salvo pdf secretaria" },
  { label: "Drive", href: "/drive", group: "Operación", icon: HardDrive, keywords: "archivos carpetas recursos compartido subir documentos" },
  { label: "Configuración", href: "/configuracion", group: "Operación", icon: Settings, keywords: "ajustes perfil cuenta" },
];

/** Vistas especiales (pantalla completa, sin sidebar). */
export const EXTRA_ROUTES: Route[] = [
  { label: "Vista Profesor", href: "/profesor", group: "Vistas", icon: GraduationCap, keywords: "docente mi dia" },
  { label: "Estados del sistema", href: "/estados", group: "Vistas", icon: CircleDashed, keywords: "vacio error 404" },
  { label: "Daily — Morning Edition", href: "/daily", group: "Vistas", icon: Newspaper, keywords: "briefing portada" },
  { label: "Family Recap", href: "/recap", group: "Vistas", icon: Sparkles, keywords: "boletin editorial camila" },
  { label: "Coach (IA)", href: "/coach", group: "Vistas", icon: Sparkles, keywords: "chat ia familiar" },
  { label: "Mi Tarjeta del Periodo", href: "/tarjeta", group: "Vistas", icon: IdCard, keywords: "gamificada estudiante" },
  { label: "Trayectoria", href: "/trayectoria", group: "Vistas", icon: LineChart, keywords: "seguimiento longitudinal" },
  { label: "App Acudiente (móvil)", href: "/app-acudiente", group: "Vistas", icon: Smartphone, keywords: "movil padres" },
];

export const ALL_ROUTES = [...ROUTES, ...EXTRA_ROUTES];

/** Subtítulo por defecto para el breadcrumb de cada pantalla. */
const SUBTITLES: Record<string, string> = {
  "/dashboard": "Resumen general",
};

/** Devuelve las migas para una ruta: [grupo?, label, sub?]. */
export function breadcrumbFor(pathname: string): { group?: string; label: string; sub?: string } {
  const route = ALL_ROUTES.find((r) => r.href === pathname || (r.href === "/dashboard" && pathname === "/"));
  if (!route) return { label: "Inicio" };
  return {
    group: route.group !== "General" && route.group !== "Vistas" ? route.group : undefined,
    label: route.label,
    sub: SUBTITLES[route.href],
  };
}
