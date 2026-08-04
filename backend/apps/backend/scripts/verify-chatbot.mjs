// Verificación del agente de WhatsApp SIN gastar un solo token de LLM.
//
// Lo que importa comprobar aquí no es que el modelo redacte bien: es que un
// acudiente no pueda ver, por ningún camino, los datos del hijo de otro. Ese
// filtro es de código, así que se puede probar con el motor apagado — y debe
// probarse, porque un fallo ahí es una fuga de datos de un menor.
//
// Levanta el contexto real de Nest (los mismos servicios que usa el bot) y llama
// a los toolsets a mano.
//
// Uso:  node scripts/verify-chatbot.mjs

import { NestFactory } from '@nestjs/core';

const { AppModule } = await import('../dist/apps/backend/src/app.module.js');
const { ChatbotIdentityService, normalizarTelefono } = await import(
  '../dist/apps/backend/src/modules/chatbot/chatbot-identity.service.js'
);
const { AcudienteToolset } = await import(
  '../dist/apps/backend/src/modules/chatbot/toolsets/acudiente.toolset.js'
);
const { PublicoToolset } = await import(
  '../dist/apps/backend/src/modules/chatbot/toolsets/publico.toolset.js'
);
const { AdminToolset } = await import(
  '../dist/apps/backend/src/modules/chatbot/toolsets/admin.toolset.js'
);
const { PrismaService } = await import('../dist/apps/backend/src/prisma/prisma.service.js');

let fallos = 0;
const ok = (t) => console.log(`  ✓ ${t}`);
const mal = (t, d) => { fallos++; console.log(`  ✗ ${t}${d ? ` — ${d}` : ''}`); };

/** Contexto mínimo como el que arma el motor al llamar una herramienta. */
function ctx(user, permisos = user.permissions) {
  return {
    user,
    convKey: `kapso:${user.meta?.telefono ?? 'x'}`,
    committing: false,
    can: (p) => permisos.includes(p),
    canStrict: (p) => permisos.includes(p),
    preparePending: () => 'PREPARADO',
    sendDocument: async () => true,
    audit: async () => {},
  };
}

const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
const prisma = app.get(PrismaService);
const identidad = app.get(ChatbotIdentityService);
const acudiente = app.get(AcudienteToolset);
const publico = app.get(PublicoToolset);
const admin = app.get(AdminToolset);

console.log('\n── Normalización de teléfonos ──');
for (const [entrada, esperado] of [
  ['+57 300 111 2233', '573001112233'],
  ['3001112233', '573001112233'],
  ['57-300-111-2233', '573001112233'],
  ['573001112233', '573001112233'],
  ['123', null],
  [null, null],
]) {
  const r = normalizarTelefono(entrada);
  r === esperado ? ok(`${entrada} → ${r}`) : mal(`${entrada} → ${r}`, `esperaba ${esperado}`);
}

console.log('\n── Identidad por teléfono ──');
// Dos acudientes de estudiantes DISTINTOS. Si se toman los dos primeros sin
// más, salen la madre y el padre del mismo estudiante (el seed crea ambos) y la
// prueba de aislamiento no prueba nada: el "hijo ajeno" sería el propio.
const todos = await prisma.guardian.findMany({
  include: { user: true, students: { include: { student: { include: { user: true } } } } },
});
const a = todos.find((g) => g.students.length > 0 && g.user.phone);
const b = a
  ? todos.find(
      (g) =>
        g.user.phone &&
        g.students.length > 0 &&
        !g.students.some((v) => a.students.some((w) => w.studentId === v.studentId)),
    )
  : null;

if (!a || !b) {
  mal('hacen falta 2 acudientes de estudiantes distintos para probar el aislamiento');
} else {

  const uA = await identidad.resolver(a.user.phone);
  uA.meta?.agente === 'acudiente' ? ok(`${a.user.phone} → agente acudiente (${uA.name})`) : mal('no resolvió como acudiente', uA.meta?.agente);

  const hijosA = uA.meta?.hijos ?? [];
  hijosA.length ? ok(`trae ${hijosA.length} estudiante(s): ${hijosA.map((h) => h.nombre).join(', ')}`) : mal('no trae estudiantes');

  // El desconocido NO puede caer en un agente con datos.
  const uX = await identidad.resolver('+573999999999');
  uX.meta?.agente === 'publico' && uX.permissions.length === 0
    ? ok('número desconocido → agente público, sin permisos')
    : mal('un número desconocido no cayó en el agente público', JSON.stringify(uX.meta));

  console.log('\n── AISLAMIENTO: ¿puede un acudiente ver al hijo de otro? ──');
  const hijoDeB = b.students[0]?.student;
  if (!hijoDeB) {
    mal('el segundo acudiente no tiene estudiante vinculado');
  } else {
    const nombreAjeno = `${hijoDeB.user.firstName} ${hijoDeB.user.lastName}`;

    // Se pide EXPLÍCITAMENTE el hijo del otro acudiente.
    const r = await acudiente.execute('consultar_notas', { estudiante: nombreAjeno }, ctx(uA));
    const filtrado = r.includes('No encontré') || r.includes('No tengo ningún estudiante');
    // Con un solo hijo la herramienta ignora el parámetro y responde por el suyo:
    // también es correcto, siempre que NO aparezcan los datos del ajeno.
    const noFiltra = hijosA.length === 1 && !r.includes(hijoDeB.user.firstName);

    filtrado || noFiltra
      ? ok(`pidió "${nombreAjeno}" (hijo de otro acudiente) y NO obtuvo sus datos`)
      : mal('¡FUGA! un acudiente obtuvo datos de un estudiante ajeno', r.slice(0, 160));

    // Sin el permiso, ninguna herramienta responde.
    const sinPermiso = await acudiente.execute('consultar_notas', {}, ctx(uA, []));
    sinPermiso === 'PERMISSION_DENIED' || sinPermiso === 'PERMISO_DENEGADO'
      ? ok('sin el permiso acudiente.consultar → PERMISO_DENEGADO')
      : mal('respondió sin permiso', sinPermiso.slice(0, 100));

    // El agente público no tiene ninguna herramienta que toque estudiantes.
    const herramientasPublicas = publico.definitions().map((d) => d.name);
    const tocaEstudiantes = herramientasPublicas.some((n) => /nota|asisten|pago|estudiante|observ/.test(n));
    !tocaEstudiantes
      ? ok(`el agente público solo expone: ${herramientasPublicas.join(', ')}`)
      : mal('el agente público expone herramientas con datos de estudiantes', herramientasPublicas.join(', '));

    // Un usuario público tampoco puede usar el toolset del acudiente.
    const intruso = await acudiente.execute('consultar_notas', {}, ctx(uX));
    intruso === 'PERMISO_DENEGADO'
      ? ok('un número público contra el toolset del acudiente → PERMISO_DENEGADO')
      : mal('un número público obtuvo respuesta del toolset del acudiente', intruso.slice(0, 100));
  }

  console.log('\n── Datos que devuelven las herramientas ──');
  for (const h of ['consultar_notas', 'consultar_asistencia', 'consultar_pagos', 'consultar_observaciones', 'datos_del_estudiante']) {
    const r = await acudiente.execute(h, {}, ctx(uA));
    typeof r === 'string' && r.length > 10 ? ok(`${h}: ${r.split('\n')[0].slice(0, 80)}`) : mal(h, r);
  }

  console.log('\n── Agente administrativo ──');
  const uAdmin = { id: 'x', name: 'Rectora', permissions: ['admin.consultar'], meta: { agente: 'administrativo' } };
  for (const h of ['resumen_del_colegio', 'estado_de_cartera', 'rendimiento_por_curso']) {
    const r = await admin.execute(h, {}, ctx(uAdmin));
    typeof r === 'string' && r.length > 10 ? ok(`${h}: ${r.split('\n')[1]?.slice(0, 70) ?? r.slice(0, 70)}`) : mal(h, r);
  }
}

console.log('\n── Agente público ──');
const rPub = await publico.execute('informacion_de_admisiones');
rPub.length > 20 ? ok(rPub.split('\n')[0].slice(0, 90)) : mal('admisiones', rPub);

await app.close();

console.log(`\n${fallos === 0 ? '✅ Todo correcto.' : `❌ ${fallos} comprobación(es) fallida(s).`}`);
process.exit(fallos === 0 ? 0 : 1);
