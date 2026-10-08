import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Identidad de la institución (nombre, NIT, resolución de aprobación, rector…).
 *
 * Antes vivía SOLO en variables de entorno, lo que significaba que cambiar el
 * NIT que sale impreso en una constancia exigía entrar por SSH al servidor,
 * editar el .env y reiniciar el proceso. Un colegio no opera así: el dato lo
 * conoce la rectoría, no el que administra el servidor.
 *
 * Ahora se guarda en la tabla `settings` (clave/valor) y el .env queda como
 * respaldo — si nunca se configuró desde la interfaz, se sigue leyendo del
 * entorno, así que ninguna instalación existente cambia de comportamiento.
 */

export const SCHOOL_FIELDS = [
  'name',
  'nit',
  'dane',
  'resolution',
  'address',
  'city',
  'department',
  'phone',
  'email',
  'website',
  'rector',
  'privacyEmail',
  'calendar',
  'character',
] as const;

export type SchoolField = (typeof SCHOOL_FIELDS)[number];
export type SchoolProfile = Record<SchoolField, string>;

/** Respaldo por entorno, para no romper instalaciones que ya lo tenían así. */
const ENV_FALLBACK: Record<SchoolField, string | undefined> = {
  name: process.env.SCHOOL_NAME,
  nit: process.env.SCHOOL_NIT,
  dane: process.env.SCHOOL_DANE,
  resolution: process.env.SCHOOL_RESOLUTION,
  address: process.env.SCHOOL_ADDRESS,
  city: process.env.SCHOOL_CITY,
  department: process.env.SCHOOL_DEPARTMENT,
  phone: process.env.SCHOOL_PHONE,
  email: process.env.SCHOOL_EMAIL,
  website: process.env.SCHOOL_WEBSITE,
  rector: process.env.SCHOOL_RECTOR,
  privacyEmail: process.env.PRIVACY_CONTACT_EMAIL || process.env.SMTP_FROM,
  calendar: process.env.SCHOOL_CALENDAR,
  character: process.env.SCHOOL_CHARACTER,
};

const KEY = (f: string) => `school.${f}`;

/** Campos sin los cuales un documento oficial sale incompleto o con datos que
 *  no son de la institución. El front los marca en rojo. */
const REQUERIDOS: SchoolField[] = ['name', 'nit', 'address', 'city', 'rector', 'privacyEmail'];

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Perfil completo. Las claves ausentes quedan como cadena vacía, nunca
   *  `undefined`: quien imprime un certificado decide qué omitir, y omitir es
   *  siempre mejor que imprimir el NIT de otro colegio. */
  async getSchool(): Promise<SchoolProfile> {
    const rows = await this.prisma.setting.findMany({
      where: { key: { startsWith: 'school.' } },
    });
    const stored = new Map(rows.map((r) => [r.key, r.value]));

    const out = {} as SchoolProfile;
    for (const f of SCHOOL_FIELDS) {
      out[f] = (stored.get(KEY(f)) ?? ENV_FALLBACK[f] ?? '').trim();
    }
    return out;
  }

  /** Qué falta para que los documentos oficiales salgan completos. */
  async getSchoolStatus() {
    const school = await this.getSchool();
    const faltantes = REQUERIDOS.filter((f) => !school[f]);
    return { school, completa: faltantes.length === 0, faltantes };
  }

  /** Guarda solo las claves enviadas (merge, no reemplazo): la pantalla puede
   *  editar una sección sin arrastrar el resto del formulario. */
  async updateSchool(patch: Partial<SchoolProfile>): Promise<SchoolProfile> {
    const entries = SCHOOL_FIELDS.filter((f) => patch[f] !== undefined).map((f) => ({
      key: KEY(f),
      value: String(patch[f] ?? '').trim(),
    }));

    if (entries.length) {
      await this.prisma.$transaction(
        entries.map((e) =>
          this.prisma.setting.upsert({
            where: { key: e.key },
            create: { key: e.key, value: e.value },
            update: { value: e.value },
          }),
        ),
      );
    }
    return this.getSchool();
  }

  /** Nombre para plantillas. Vale la pena tenerlo aparte: lo piden el chatbot,
   *  el correo y los PDF, y siempre necesitan un texto, nunca vacío. */
  async schoolName(): Promise<string> {
    const { name } = await this.getSchool();
    return name || 'el colegio';
  }
}
