/**
 * Política de tratamiento de datos personales — Ley 1581 de 2012, Decreto 1377
 * de 2013.
 *
 * El texto vive en código y no en la base a propósito: la versión que una
 * familia aceptó tiene que poder reconstruirse tal cual años después, y un
 * texto editable desde el panel se reescribe sin dejar rastro. Cambiar la
 * política = editar este archivo Y subir POLICY_VERSION; las autorizaciones
 * viejas quedan apuntando a la versión anterior, que es justo lo que se quiere.
 */

import type { SchoolProfile } from '../settings/settings.service';

export const POLICY_VERSION = '1.0';

/** Datos del responsable del tratamiento. Vienen de Configuración → Datos de la
 *  institución (que a su vez respalda en el .env): cambian por institución y el
 *  NIT no se inventa — sin él el aviso queda incompleto frente a la SIC. */
export function responsable(school: SchoolProfile) {
  return {
    nombre: school.name || 'Institución educativa',
    nit: school.nit,
    direccion: school.address,
    ciudad: school.city,
    telefono: school.phone,
    correo: school.privacyEmail || school.email,
  };
}

/** ¿Está completo el aviso? Si falta el NIT o el correo de contacto, la
 *  política se puede mostrar pero NO cumple: el titular no tendría a dónde
 *  dirigir una consulta o un reclamo. El front usa esto para advertirlo, y
 *  nombra los campos como se llaman en la pantalla de Configuración. */
export function configuracionCompleta(school: SchoolProfile) {
  const r = responsable(school);
  const faltantes: string[] = [];
  if (!school.name) faltantes.push('Nombre de la institución');
  if (!r.nit) faltantes.push('NIT');
  if (!r.direccion) faltantes.push('Dirección');
  if (!r.correo) faltantes.push('Correo para habeas data');
  return { completa: faltantes.length === 0, faltantes };
}

export type Finalidad = { key: string; label: string; descripcion: string };

/** Finalidades del tratamiento. Deben ser específicas: "para todo lo que el
 *  colegio necesite" no es una finalidad válida. */
export const FINALIDADES: Finalidad[] = [
  {
    key: 'academica',
    label: 'Gestión académica',
    descripcion:
      'Matrícula, registro de calificaciones y asistencia, boletines, certificados y constancias, y el reporte a las autoridades educativas que la ley exige.',
  },
  {
    key: 'convivencia',
    label: 'Convivencia escolar',
    descripcion:
      'Observador del estudiante y seguimiento de situaciones de convivencia conforme a la Ley 1620 de 2013 y al Manual de Convivencia.',
  },
  {
    key: 'comunicaciones',
    label: 'Comunicación con la familia',
    descripcion:
      'Envío de circulares, citaciones, notificaciones académicas y de asistencia por correo electrónico, WhatsApp o la plataforma.',
  },
  {
    key: 'administrativa',
    label: 'Gestión administrativa y financiera',
    descripcion: 'Facturación de matrícula y pensiones, cartera y soportes contables.',
  },
  {
    key: 'salud',
    label: 'Atención en salud y emergencias',
    descripcion:
      'Datos de EPS, tipo de sangre, alergias y condiciones médicas, usados únicamente para atender una urgencia o un accidente escolar.',
  },
];

/** Finalidades que NO se pueden dar por aceptadas en bloque. */
export const FINALIDADES_OPCIONALES = ['salud'];

export const DERECHOS = [
  'Conocer, actualizar y rectificar sus datos personales.',
  'Solicitar prueba de la autorización otorgada.',
  'Ser informado sobre el uso que se ha dado a sus datos.',
  'Presentar quejas ante la Superintendencia de Industria y Comercio por infracciones a la ley.',
  'Revocar la autorización o solicitar la supresión de los datos, salvo cuando exista un deber legal o contractual de conservarlos.',
  'Acceder gratuitamente a sus datos personales.',
];

/**
 * Datos de menores (Art. 7 de la Ley 1581 y Art. 12 del Decreto 1377). El
 * tratamiento está prohibido salvo que responda al interés superior del niño y
 * respete sus derechos fundamentales; la autorización la otorga el
 * representante legal, previo ejercicio del derecho del menor a ser escuchado.
 */
export const AVISO_MENORES =
  'El estudiante es menor de edad. La autorización la otorga su representante legal. ' +
  'El tratamiento responde al interés superior del niño, niña o adolescente, respeta sus derechos ' +
  'fundamentales y se limita a lo necesario para prestar el servicio educativo. Se ha garantizado al ' +
  'menor su derecho a ser escuchado sobre el tratamiento de sus datos.';

/** Los datos sensibles se piden aparte y con esta advertencia obligatoria. */
export const AVISO_SENSIBLES =
  'Los datos de salud, discapacidad, pertenencia étnica y condición de víctima del conflicto son datos ' +
  'sensibles. Usted NO está obligado a autorizar su tratamiento, y negarse no afecta la matrícula ni la ' +
  'prestación del servicio educativo. Se recogen únicamente para atender emergencias y para los reportes ' +
  'que la ley exige al sector educativo.';

export const CONSERVACION =
  'Los datos académicos se conservan de forma indefinida porque el colegio está obligado a expedir ' +
  'certificados y constancias de estudio en cualquier momento posterior al retiro o grado del estudiante. ' +
  'Los demás datos se conservan mientras exista la relación y durante los términos legales aplicables.';

export function politica(school: SchoolProfile) {
  return {
    version: POLICY_VERSION,
    responsable: responsable(school),
    finalidades: FINALIDADES,
    finalidadesOpcionales: FINALIDADES_OPCIONALES,
    derechos: DERECHOS,
    avisoMenores: AVISO_MENORES,
    avisoSensibles: AVISO_SENSIBLES,
    conservacion: CONSERVACION,
    configuracion: configuracionCompleta(school),
  };
}
