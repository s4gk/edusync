// Siembra el horario semanal (L–V, 6 bloques) para cada grupo, usando sus materias.
// Evita cruces de docente (un docente no puede estar en dos grupos en el mismo bloque).
// Va contra el backend dev en :5055 por defecto.
import http from "node:http";

const PORT = process.env.API_PORT ? Number(process.env.API_PORT) : 5055;
const API = { host: "localhost", port: PORT };
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
const D = (r) => { try { return JSON.parse(r.body)?.data ?? JSON.parse(r.body); } catch { return null; } };

const DAYS = [1, 2, 3, 4, 5];
const BLOCKS = [1, 2, 3, 4, 5, 6];
const ROOMS = ["101", "102", "203", "204", "205", "Lab 1"];

(async () => {
  const token = D(await req("/api/auth/login", { method: "POST", body: { email: "admin@school.edu.co", password: "Admin1234!" } }))?.accessToken;
  if (!token) { console.error("auth falló"); process.exit(1); }

  const years = D(await req("/api/academic/years", { token }));
  const year = years.find((y) => y.isCurrent) ?? years[0];
  const groups = D(await req(`/api/academic/years/${year.id}/groups`, { token }));
  console.log(`Año ${year.year} · ${groups.length} grupos`);

  // materias por grupo (cada subject trae teacherId)
  const groupSubjects = {};
  for (const g of groups) {
    groupSubjects[g.id] = D(await req(`/api/academic/groups/${g.id}/subjects`, { token })) || [];
  }

  const teacherBusy = new Set(); // teacherId|day|block
  let created = 0, skipped = 0, conflicts = 0;

  for (let gi = 0; gi < groups.length; gi++) {
    const g = groups[gi];
    const subs = groupSubjects[g.id];
    if (!subs.length) continue;
    for (const day of DAYS) {
      for (let bi = 0; bi < BLOCKS.length; bi++) {
        const block = BLOCKS[bi];
        // rota el orden de materias por grupo+día para repartir y evitar choques
        const order = subs.map((_, i) => subs[(i + gi + day) % subs.length]);
        let placed = false;
        for (const subj of order) {
          const key = `${subj.teacherId}|${day}|${block}`;
          if (teacherBusy.has(key)) continue; // ese docente ya está ocupado ese bloque
          const r = await req("/api/schedule", { method: "POST", token, body: { subjectId: subj.id, dayOfWeek: day, block, room: ROOMS[bi % ROOMS.length] } });
          if ([200, 201].includes(r.status)) { teacherBusy.add(key); created++; placed = true; break; }
          else { conflicts++; }
        }
        if (!placed) skipped++;
      }
    }
    console.log(`  ${g.name}: ok`);
  }
  console.log(`\nHorario → slots creados: ${created} · celdas sin cupo: ${skipped} · choques evitados: ${conflicts}`);
})();
