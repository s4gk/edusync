// Seed de usuarios vía API viva (sin dependencias). Crea un set realista
// de personal del colegio. Idempotente: si el email ya existe, lo omite.
import http from "node:http";

const API = { host: "localhost", port: 5000 };

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
        res.on("end", () => resolve({ status: res.statusCode, body: s }));
      },
    );
    r.on("error", reject);
    if (data) r.write(data);
    r.end();
  });
}

const USERS = [
  { email: "rectoria@colegio.edu.co", role: "RECTOR", firstName: "Patricia", lastName: "Salazar", phone: "+573001112233" },
  { email: "coord.academica@colegio.edu.co", role: "COORDINATOR_ACADEMIC", firstName: "Andrés", lastName: "Mejía", phone: "+573001112234" },
  { email: "coord.convivencia@colegio.edu.co", role: "COORDINATOR_CONVIVENCIA", firstName: "Liliana", lastName: "Ospina", phone: "+573001112235" },
  { email: "secretaria@colegio.edu.co", role: "SECRETARY", firstName: "Diana", lastName: "López", phone: "+573001112236" },
  { email: "contabilidad@colegio.edu.co", role: "ACCOUNTANT", firstName: "Jorge", lastName: "Ramírez", phone: "+573001112237" },
  { email: "carlos.rios@colegio.edu.co", role: "TEACHER", firstName: "Carlos", lastName: "Ríos", phone: "+573001112240" },
  { email: "ana.mejia@colegio.edu.co", role: "TEACHER", firstName: "Ana", lastName: "Mejía", phone: "+573001112241" },
  { email: "jorge.mendoza@colegio.edu.co", role: "TEACHER", firstName: "Jorge", lastName: "Mendoza", phone: "+573001112242" },
  { email: "laura.botero@colegio.edu.co", role: "TEACHER", firstName: "Laura", lastName: "Botero", phone: "+573001112243" },
  { email: "felipe.vargas@colegio.edu.co", role: "TEACHER", firstName: "Felipe", lastName: "Vargas", phone: "+573001112244" },
  { email: "gabriela.franco@colegio.edu.co", role: "TEACHER", firstName: "Gabriela", lastName: "Franco", phone: "+573001112245" },
  { email: "mauricio.duque@colegio.edu.co", role: "TEACHER", firstName: "Mauricio", lastName: "Duque", phone: "+573001112246" },
  { email: "natalia.ospina@colegio.edu.co", role: "TEACHER", firstName: "Natalia", lastName: "Ospina", phone: "+573001112247" },
  { email: "ricardo.pena@colegio.edu.co", role: "TEACHER", firstName: "Ricardo", lastName: "Peña", phone: "+573001112248" },
  { email: "valeria.cruz@colegio.edu.co", role: "GUARDIAN", firstName: "Valeria", lastName: "Cruz", phone: "+573001112250" },
  { email: "samuel.acosta@colegio.edu.co", role: "GUARDIAN", firstName: "Samuel", lastName: "Acosta", phone: "+573001112251" },
  { email: "tatiana.mora@colegio.edu.co", role: "GUARDIAN", firstName: "Tatiana", lastName: "Mora", phone: "+573001112252" },
];

(async () => {
  const login = await req("/api/auth/login", {
    method: "POST",
    body: { email: "admin@school.edu.co", password: "Admin1234!" },
  });
  const token = JSON.parse(login.body)?.data?.accessToken;
  if (!token) {
    console.error("No se pudo autenticar:", login.body);
    process.exit(1);
  }

  let created = 0,
    skipped = 0,
    failed = 0;
  for (const u of USERS) {
    const res = await req("/api/users", {
      method: "POST",
      token,
      body: { ...u, password: "Demo1234!", mustChangePassword: false },
    });
    if (res.status === 201 || res.status === 200) created++;
    else if (res.status === 409 || /exist|duplicad/i.test(res.body)) skipped++;
    else {
      failed++;
      console.log(`  ⚠ ${u.email} → ${res.status} ${res.body.slice(0, 120)}`);
    }
  }
  console.log(`\nUsuarios → creados: ${created} · omitidos(ya existían): ${skipped} · fallidos: ${failed}`);

  const list = await req("/api/users?limit=100", { token });
  const total = JSON.parse(list.body)?.data?.meta?.total;
  console.log(`Total usuarios en la DB ahora: ${total}`);
})();
