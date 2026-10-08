// Seed académico vía API viva: grupos, periodos y estudiantes (con usuario
// + matrícula en un grupo). Idempotente best-effort.
import http from "node:http";

const API = { host: "localhost", port: 5000 };
function req(path, { method = "GET", body, token } = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const r = http.request(
      { ...API, path, method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}) } },
      (res) => { let s = ""; res.on("data", (d) => (s += d)); res.on("end", () => resolve({ status: res.statusCode, body: s })); },
    );
    r.on("error", reject); if (data) r.write(data); r.end();
  });
}
const J = (s) => { try { return JSON.parse(s); } catch { return null; } };

const NAMES = [
  "Ana Castillo","Bryan Méndez","Carolina Ríos","Daniel Ortiz","Esteban Lozano","Fernanda Gil",
  "Gabriel Soto","Helena Quintero","Iván Bravo","Julieta Ramos","Kevin Hoyos","Lucía Mejía",
  "Mateo Vélez","Natalia Ospina","Óscar Patiño","Paula Restrepo","Quentin Ávila","Renata Silva",
  "Samuel Acosta","Tatiana Mora","Uriel Cano","Valentina Cruz","Wílmer Díaz","Ximena León",
  "Yeison Parra","Zoe Ramírez","Andrés Niño","Brenda Castaño","Camilo Vega","Diana Torres",
];

(async () => {
  const login = await req("/api/auth/login", { method: "POST", body: { email: "admin@school.edu.co", password: "Admin1234!" } });
  const token = J(login.body)?.data?.accessToken;
  if (!token) { console.error("auth falló", login.body); process.exit(1); }

  const years = J((await req("/api/academic/years", { token })).body).data;
  const year = years[0];
  console.log("Año:", year.year, year.id);

  // --- grupos ---
  const wantGroups = [["6A",6],["6B",6],["7A",7],["8A",8],["9A",9],["10A",10],["11A",11]];
  for (const [name, gradeLevel] of wantGroups) {
    const r = await req("/api/academic/groups", { method: "POST", token, body: { name, gradeLevel, academicYearId: year.id } });
    if (![200,201].includes(r.status) && !/exist|duplicad|unique/i.test(r.body)) console.log(`  grupo ${name} → ${r.status} ${r.body.slice(0,90)}`);
  }
  const groups = J((await req(`/api/academic/years/${year.id}/groups`, { token })).body).data;
  const groupByName = Object.fromEntries(groups.map((g) => [g.name, g.id]));
  console.log("Grupos:", groups.map((g) => g.name).join(", "));

  // --- periodos (4) ---
  const periods = [
    ["Primer Periodo",1,`${year.year}-01-20`,`${year.year}-03-31`,25],
    ["Segundo Periodo",2,`${year.year}-04-01`,`${year.year}-06-15`,25],
    ["Tercer Periodo",3,`${year.year}-07-01`,`${year.year}-09-15`,25],
    ["Cuarto Periodo",4,`${year.year}-09-16`,`${year.year}-11-30`,25],
  ];
  for (const [name,periodNumber,startDate,endDate,weightPercent] of periods) {
    const r = await req("/api/academic/periods", { method: "POST", token, body: { academicYearId: year.id, name, periodNumber, startDate, endDate, weightPercent } });
    if (![200,201].includes(r.status) && !/exist|duplicad|unique/i.test(r.body)) console.log(`  periodo ${name} → ${r.status} ${r.body.slice(0,90)}`);
  }

  // --- estudiantes ---
  const groupNames = Object.keys(groupByName);
  let created = 0, skipped = 0, failed = 0;
  for (let i = 0; i < NAMES.length; i++) {
    const [firstName, lastName] = NAMES[i].split(" ");
    const slug = NAMES[i].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ /g, ".");
    const email = `${slug}@estudiante.colegio.edu.co`;
    const gradeGroupId = groupByName[groupNames[i % groupNames.length]];

    const ru = await req("/api/users", { method: "POST", token, body: { email, role: "STUDENT", firstName, lastName, password: "Demo1234!", mustChangePassword: false } });
    let userId = J(ru.body)?.data?.id;
    if (!userId) {
      // ya existía: búscalo
      const f = J((await req(`/api/users?search=${encodeURIComponent(email)}&limit=1`, { token })).body);
      userId = f?.data?.data?.[0]?.id;
    }
    if (!userId) { failed++; continue; }

    const code = `${year.year}-${String(i + 1).padStart(3, "0")}`;
    const doc = String(1010000000 + i * 7919);
    const birthDate = `${year.year - (10 + (i % 6))}-0${(i % 9) + 1}-1${i % 9}`;
    const rs = await req("/api/students", { method: "POST", token, body: { userId, enrollmentCode: code, documentId: doc, birthDate, gradeGroupId } });
    if ([200,201].includes(rs.status)) created++;
    else if (/exist|duplicad|unique|already/i.test(rs.body)) skipped++;
    else { failed++; if (failed <= 3) console.log(`  estudiante ${NAMES[i]} → ${rs.status} ${rs.body.slice(0,120)}`); }
  }
  console.log(`\nEstudiantes → creados: ${created} · omitidos: ${skipped} · fallidos: ${failed}`);
  const total = J((await req("/api/students?limit=1", { token })).body)?.data?.meta?.total;
  console.log("Total estudiantes en la DB ahora:", total);
})();
