// Seed de ACUDIENTES vía API viva (sin dependencias externas).
//
// Por qué hace falta: la base tenía 0 acudientes, así que todo lo construido
// para ellos —la app del acudiente, las editoriales, las alertas y ahora el
// agente de WhatsApp— nunca se había podido probar contra datos reales. El
// acudiente es la punta del producto que ve la familia; sin uno solo en la
// base, no hay a quién responder.
//
// Crea un acudiente por estudiante (y un segundo acudiente para algunos, para
// que el caso "dos acudientes" también quede cubierto), con teléfono en E.164
// porque es la llave con la que el bot de WhatsApp resuelve quién escribe.
//
// Idempotente: si el correo ya existe, lo omite y sigue.
//
// Uso:  node scripts/seed-guardians.mjs
import http from "node:http";

const API = { host: "127.0.0.1", port: 5055 };
const ADMIN = { email: "admin@school.edu.co", password: "Admin1234!" };

// Prefijo reservado para pruebas: +57 300 000 00NN. Números FICTICIOS a
// propósito — un seed que mande WhatsApp a un número real de alguien sería
// exactamente el accidente que hay que evitar.
const TEL_BASE = 573000000000;

function req(path, { method = "GET", body, token } = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const r = http.request(
      {
        ...API,
        path,
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        let s = "";
        res.on("data", (d) => (s += d));
        res.on("end", () => {
          let parsed = null;
          try { parsed = JSON.parse(s); } catch { /* respuesta no-JSON */ }
          resolve({ status: res.statusCode, body: parsed, raw: s });
        });
      },
    );
    r.on("error", reject);
    if (data) r.write(data);
    r.end();
  });
}

const sinTildes = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");

const NOMBRES_M = ["María", "Luz", "Carmen", "Gloria", "Sandra", "Patricia", "Claudia", "Diana", "Yolanda", "Marta"];
const NOMBRES_H = ["Carlos", "Jorge", "Luis", "Fernando", "Álvaro", "Héctor", "Ramiro", "Óscar", "Julián", "Wilson"];

async function main() {
  const login = await req("/api/auth/login", { method: "POST", body: ADMIN });
  if (login.status !== 200) {
    console.error("✗ No se pudo autenticar como admin:", login.raw?.slice(0, 200));
    process.exit(1);
  }
  const token = login.body.data.accessToken;

  // El backend topa `limit` en 100, así que se pagina.
  const estudiantes = [];
  for (let pagina = 1; ; pagina++) {
    const est = await req(`/api/students?limit=100&page=${pagina}`, { token });
    if (est.status !== 200) {
      console.error("✗ No se pudieron listar estudiantes:", est.raw?.slice(0, 200));
      process.exit(1);
    }
    const lote = est.body.data?.data ?? est.body.data ?? [];
    estudiantes.push(...lote);
    if (lote.length < 100) break;
  }
  if (!estudiantes.length) {
    console.error("✗ No hay estudiantes en la base. Corre antes seed-academic.mjs.");
    process.exit(1);
  }
  console.log(`Estudiantes encontrados: ${estudiantes.length}`);

  let creados = 0, omitidos = 0, fallidos = 0, tel = TEL_BASE;

  for (const [i, e] of estudiantes.entries()) {
    // El apellido del acudiente sigue al del estudiante: así las fichas se leen
    // como una familia y no como nombres sueltos.
    const apellido = e.user?.lastName?.split(" ")[0] || "Familia";
    const nombreEst = e.user?.firstName || "estudiante";

    // Acudiente principal (madre) para todos.
    const madre = {
      firstName: NOMBRES_M[i % NOMBRES_M.length],
      lastName: apellido,
      relation: "Madre",
    };
    // Un segundo acudiente (padre) para uno de cada tres, para cubrir el caso.
    const padre = i % 3 === 0
      ? { firstName: NOMBRES_H[i % NOMBRES_H.length], lastName: apellido, relation: "Padre" }
      : null;

    for (const [orden, quien] of [madre, padre].filter(Boolean).entries()) {
      tel += 1;
      const email = `${sinTildes(quien.firstName)}.${sinTildes(quien.lastName)}${i}@familia.edu.co`;
      const dto = {
        email,
        firstName: quien.firstName,
        lastName: quien.lastName,
        relation: quien.relation,
        phone: `+${tel}`,
        password: "Acudiente2026!",
        profile: {
          tipoDocumento: "CC",
          documento: String(1000000000 + tel % 100000000),
          ciudad: "Bogotá",
          notas: `Acudiente de ${nombreEst} ${apellido}. Datos de demostración.`,
        },
        students: [{ studentId: e.id, isPrimary: orden === 0 }],
      };

      const r = await req("/api/guardians", { method: "POST", body: dto, token });
      if (r.status === 201 || r.status === 200) {
        creados++;
      } else if (r.status === 409) {
        omitidos++;
      } else {
        fallidos++;
        if (fallidos <= 3) console.error(`  ✗ ${email} → ${r.status} ${r.raw?.slice(0, 160)}`);
      }
    }
  }

  console.log(`\n✓ Acudientes creados: ${creados}   omitidos (ya existían): ${omitidos}   fallidos: ${fallidos}`);

  const verif = await req("/api/guardians?limit=1", { token });
  console.log(`Total de acudientes en la base: ${verif.body?.data?.total ?? "?"}`);
  console.log(`Credenciales de prueba: <correo generado> / Acudiente2026!`);
}

main().catch((e) => { console.error(e); process.exit(1); });
