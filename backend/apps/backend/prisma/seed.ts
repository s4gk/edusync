import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin1234!', 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@school.edu.co' },
    update: {},
    create: {
      email: 'admin@school.edu.co',
      passwordHash,
      role: 'SUPER_ADMIN',
      firstName: 'Super',
      lastName: 'Admin',
    },
  });

  const rector = await prisma.user.upsert({
    where: { email: 'rector@school.edu.co' },
    update: {},
    create: {
      email: 'rector@school.edu.co',
      passwordHash,
      role: 'RECTOR',
      firstName: 'Carlos',
      lastName: 'Rectorado',
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: 'profesor@school.edu.co' },
    update: {},
    create: {
      email: 'profesor@school.edu.co',
      passwordHash,
      role: 'TEACHER',
      firstName: 'María',
      lastName: 'González',
    },
  });

  await prisma.teacher.upsert({
    where: { userId: teacher.id },
    update: {},
    create: { userId: teacher.id, speciality: 'Matemáticas' },
  });

  const currentYear = new Date().getFullYear();
  const academicYear = await prisma.academicYear.upsert({
    where: { year: currentYear },
    update: {},
    create: {
      year: currentYear,
      startDate: new Date(`${currentYear}-01-20`),
      endDate: new Date(`${currentYear}-11-30`),
      isCurrent: true,
      isOpen: true,
    },
  });

  await prisma.gradeGroup.upsert({
    where: { name_academicYearId: { name: '6A', academicYearId: academicYear.id } },
    update: {},
    create: {
      name: '6A',
      gradeLevel: 6,
      academicYearId: academicYear.id,
    },
  });

  console.log('✅ Seed completado');
  console.log('  admin@school.edu.co  / Admin1234!');
  console.log('  rector@school.edu.co / Admin1234!');
  console.log('  profesor@school.edu.co / Admin1234!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
