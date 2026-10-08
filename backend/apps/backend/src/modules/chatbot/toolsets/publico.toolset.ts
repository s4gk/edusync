import { Injectable } from '@nestjs/common';
import type { Toolset, ToolContext, ToolDef } from '@s4gk/wa-agent';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Lo que se le puede contar a un número desconocido: información de admisiones,
 * y nada más.
 *
 * Este toolset es deliberadamente pobre. Quien escribe sin estar registrado
 * puede ser un padre interesado en matricular… o cualquiera. Todo lo que hay
 * aquí es información que el colegio publicaría en su página; ni un dato de un
 * estudiante, ni la confirmación de que alguien estudia aquí.
 */
@Injectable()
export class PublicoToolset implements Toolset {
  constructor(private readonly prisma: PrismaService) {}

  definitions(): ToolDef[] {
    return [
      {
        name: 'informacion_de_admisiones',
        description:
          'Información general para quien pregunta por admisiones: grados que ofrece el colegio, cupos y cómo iniciar el proceso. Úsala para cualquier pregunta sobre matricularse o inscribir a un hijo.',
        input_schema: { type: 'object', properties: {} },
      },
      {
        name: 'datos_de_contacto',
        description:
          'Cómo comunicarse con el colegio: horario de atención y canales. Úsala cuando pregunten dónde queda, en qué horario atienden o cómo hablar con alguien.',
        input_schema: { type: 'object', properties: {} },
      },
    ];
  }

  async execute(name: string): Promise<string> {
    switch (name) {
      case 'informacion_de_admisiones': return this.admisiones();
      case 'datos_de_contacto': return this.contacto();
      default: return `Herramienta desconocida: ${name}`;
    }
  }

  private async admisiones(): Promise<string> {
    const colegio = process.env.SCHOOL_NAME || 'el colegio';

    // Los grados salen de los cursos que existen de verdad, no de una lista
    // escrita a mano: si el colegio abre un grado nuevo, esto se entera solo.
    const grupos = await this.prisma.gradeGroup.findMany({
      select: { gradeLevel: true },
      distinct: ['gradeLevel'],
      orderBy: { gradeLevel: 'asc' },
    });

    const nombreGrado = (n: number) => (n === 0 ? 'Preescolar' : `${n}º`);
    const grados = grupos.map((g) => nombreGrado(g.gradeLevel)).join(', ');

    return [
      `${colegio} ofrece los grados: ${grados || 'consultar con secretaría'}.`,
      'Para iniciar el proceso de admisión se necesita: registro civil del estudiante, documento de identidad del acudiente, y el boletín del último año cursado.',
      'La disponibilidad de cupos por grado la confirma la secretaría del colegio.',
    ].join('\n');
  }

  private async contacto(): Promise<string> {
    const colegio = process.env.SCHOOL_NAME || 'El colegio';
    const horario = process.env.SCHOOL_HOURS || 'lunes a viernes, 7:00 a. m. a 4:00 p. m.';
    const direccion = process.env.SCHOOL_ADDRESS;
    const telefono = process.env.SCHOOL_PHONE;

    return [
      `${colegio} atiende ${horario}.`,
      direccion ? `Dirección: ${direccion}.` : null,
      telefono ? `Teléfono: ${telefono}.` : null,
      'Por este mismo chat puedo darte información de admisiones.',
    ].filter(Boolean).join('\n');
  }
}
