import { ForbiddenException } from '@nestjs/common';
import { Role } from '@school/shared';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Utilidades de "scope" por profesor.
 *
 * Un usuario es "teacher-only" cuando entre sus roles está TEACHER y NINGUNO
 * privilegiado. Para esos usuarios, las consultas se filtran a lo que les
 * pertenece (sus materias y, por extensión, sus grupos/estudiantes). Los roles
 * privilegiados ven todo (sin filtro).
 */

export type ReqUser = { id: string; role?: string; roles?: string[] };

const PRIVILEGED: string[] = [
  Role.SUPER_ADMIN,
  Role.RECTOR,
  Role.COORDINATOR_ACADEMIC,
  Role.COORDINATOR_CONVIVENCIA,
  Role.SECRETARY,
  Role.ACCOUNTANT,
];

export function rolesOf(user?: ReqUser): string[] {
  if (!user) return [];
  return user.roles ?? (user.role ? [user.role] : []);
}

/** ¿Debe acotarse la vista de este usuario a sus propias materias? */
export function isTeacherOnly(user?: ReqUser): boolean {
  const roles = rolesOf(user);
  return roles.includes(Role.TEACHER) && !roles.some((r) => PRIVILEGED.includes(r));
}

/** Teacher.id del usuario (o null si no tiene perfil docente). */
export async function teacherIdFor(prisma: PrismaService, user?: ReqUser): Promise<string | null> {
  if (!user?.id) return null;
  const t = await prisma.teacher.findUnique({ where: { userId: user.id }, select: { id: true } });
  return t?.id ?? null;
}

/**
 * Si el usuario es teacher-only, devuelve su teacherId (lanzando 403 si no tiene
 * perfil docente). Si no, devuelve null → sin filtro (ve todo).
 */
export async function teacherScope(prisma: PrismaService, user?: ReqUser): Promise<string | null> {
  if (!isTeacherOnly(user)) return null;
  const teacherId = await teacherIdFor(prisma, user);
  if (!teacherId) throw new ForbiddenException('El usuario no tiene un perfil docente asociado');
  return teacherId;
}
