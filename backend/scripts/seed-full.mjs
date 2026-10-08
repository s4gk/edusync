// Seed integral vía API viva: notas (logros→actividades→scores), asistencia,
// finanzas (tarifas→facturas→pagos) y boletines. Idempotente best-effort.
// Uso: node backend/scripts/seed-full.mjs
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
const D = (r) => J(r.body)?.data ?? J(r.body);
const ok = (r) => [200, 201].includes(r.status);

// nota pseudo-aleatoria determinista 2.0–5.0 a partir de índices
const noteFor = (a, b, c) => {
  const seed = (a * 31 + b * 17 + c * 7) % 100;            // 0–99
  return Math.round((2.4 + (seed / 99) * 2.6) * 10) / 10;  // 2.4–5.0, 1 decimal
};

const ACHS = [
  { name: "Ser", weightPercent: 30, acts: ["Autoevaluación", "Actitud y convivencia"] },
  { name: "Hacer", weightPercent: 40, acts: ["Taller práctico", "Proyecto"] },
  { name: "Saber", weightPercent: 30, acts: ["Quiz", "Parcial"] },
];
const ATT_STATUSES = ["PRESENT", "PRESENT", "PRESENT", "PRESENT", "LATE", "ABSENT", "EXCUSED"];

(async () => {
  const login = await req("/api/auth/login", { method: "POST", body: { email: "admin@school.edu.co", password: "Admin1234!" } });
  const token = D(login)?.accessToken;
  if (!token) { console.error("auth falló", login.body); process.exit(1); }

  const years = D(await req("/api/academic/years", { token }));
  const year = years.find((y) => y.isCurrent) ?? years[0];
  console.log(`Año lectivo: ${year.year} (${year.id})`);

  const groups = D(await req(`/api/academic/years/${year.id}/groups`, { token }));
  console.log(`Grupos: ${groups.length}`);

  const PERIODS = [1, 2]; // sembramos P1 y P2

  // ─────────────────────────── NOTAS ───────────────────────────
  let achCreated = 0, actCreated = 0, scoreBatches = 0;
  for (const g of groups) {
    const subjects = D(await req(`/api/academic/groups/${g.id}/subjects`, { token })) || [];
    const students = D(await req(`/api/students?gradeGroupId=${g.id}&limit=100`, { token }))?.data || [];
    if (!students.length) continue;

    for (let si = 0; si < subjects.length; si++) {
      const subj = subjects[si];
      for (const periodNumber of PERIODS) {
        // ¿ya tiene logros este subject+periodo? → saltar (idempotente)
        const existing = D(await req(`/api/grades/achievements?subjectId=${subj.id}&periodNumber=${periodNumber}`, { token })) || [];
        if (existing.length >= ACHS.length) continue;

        for (let ai = 0; ai < ACHS.length; ai++) {
          const a = ACHS[ai];
          const ra = await req("/api/grades/achievements", { method: "POST", token, body: { subjectId: subj.id, periodNumber, name: a.name, weightPercent: a.weightPercent } });
          const achId = D(ra)?.id;
          if (!achId) { if (achCreated < 3) console.log("  ach falló:", ra.status, ra.body.slice(0, 100)); continue; }
          achCreated++;

          for (let ti = 0; ti < a.acts.length; ti++) {
            const ract = await req("/api/grades/activities", { method: "POST", token, body: { achievementId: achId, name: a.acts[ti], weightPercent: 50, maxScore: 5 } });
            const actId = D(ract)?.id;
            if (!actId) continue;
            actCreated++;

            const scores = students.map((st, idx) => ({ studentId: st.id, score: noteFor(si + periodNumber, ai * 2 + ti, idx) }));
            const rs = await req("/api/grades/scores", { method: "POST", token, body: { activityId: actId, scores } });
            if (ok(rs)) scoreBatches++;
          }
        }
      }
    }
    console.log(`  notas · grupo ${g.name} ok`);
  }
  console.log(`Notas → logros: ${achCreated} · actividades: ${actCreated} · lotes de notas: ${scoreBatches}`);

  // ─────────────────────────── ASISTENCIA ───────────────────────────
  // 8 días lectivos en abril/mayo 2026 por cada materia.
  const DATES = ["04-07", "04-14", "04-21", "04-28", "05-05", "05-12", "05-19", "05-26"].map((d) => `${year.year}-${d}`);
  let attBatches = 0;
  for (const g of groups) {
    const subjects = D(await req(`/api/academic/groups/${g.id}/subjects`, { token })) || [];
    const students = D(await req(`/api/students?gradeGroupId=${g.id}&limit=100`, { token }))?.data || [];
    if (!students.length) continue;
    for (let si = 0; si < subjects.length; si++) {
      const subj = subjects[si];
      // ¿ya hay asistencia para esta materia? → saltar
      const ex = D(await req(`/api/attendance?subjectId=${subj.id}&limit=1`, { token }));
      if (ex?.meta?.total > 0) continue;
      for (let di = 0; di < DATES.length; di++) {
        const entries = students.map((st, idx) => ({ studentId: st.id, status: ATT_STATUSES[(si + di + idx) % ATT_STATUSES.length] }));
        const r = await req("/api/attendance", { method: "POST", token, body: { subjectId: subj.id, date: DATES[di], entries } });
        if (ok(r)) attBatches++;
      }
    }
    console.log(`  asistencia · grupo ${g.name} ok`);
  }
  console.log(`Asistencia → lotes registrados: ${attBatches}`);

  // ─────────────────────────── FINANZAS ───────────────────────────
  // Tarifas por grado, facturas feb–may, pagos para ~70%.
  const gradeLevels = [...new Set(groups.map((g) => g.gradeLevel))];
  for (const gl of gradeLevels) {
    const monthly = 300000 + gl * 15000;
    await req("/api/finance/tuition", { method: "POST", token, body: { academicYearId: year.id, gradeLevel: gl, enrollmentFee: monthly * 1.5, monthlyFee: monthly, lateFeePercent: 3 } });
  }
  let genTotal = 0;
  for (const month of [2, 3, 4, 5]) {
    const due = `${year.year}-${String(month).padStart(2, "0")}-10`;
    const r = await req("/api/finance/invoices/generate", { method: "POST", token, body: { academicYearId: year.id, month, dueDate: due } });
    const n = D(r)?.generated ?? D(r)?.count ?? (Array.isArray(D(r)) ? D(r).length : 0);
    genTotal += Number(n) || 0;
    if (!ok(r)) console.log(`  generate mes ${month}: ${r.status} ${r.body.slice(0, 100)}`);
  }
  console.log(`Finanzas → tarifas: ${gradeLevels.length} grados · facturas generadas: ${genTotal}`);

  // pagar ~70% de las facturas pendientes
  let paid = 0, recCtr = 0;
  let page = 1;
  while (true) {
    const inv = D(await req(`/api/finance/invoices?academicYearId=${year.id}&status=PENDING&page=${page}&limit=100`, { token }));
    const list = inv?.data || [];
    if (!list.length) break;
    for (const f of list) {
      if (Math.abs((f.id.charCodeAt(0) + f.id.charCodeAt(1))) % 10 < 7) { // ~70%
        recCtr++;
        const rec = `REC-${year.year}-${String(recCtr).padStart(4, "0")}`;
        const amount = Number(f.amount);
        const r = await req("/api/finance/payments", { method: "POST", token, body: { invoiceId: f.id, receiptNumber: rec, paidAt: `${year.year}-${String(f.month).padStart(2, "0")}-08`, amount } });
        if (ok(r)) paid++;
      }
    }
    if (list.length < 100) break;
    page++;
  }
  console.log(`Finanzas → pagos registrados: ${paid}`);

  // ─────────────────────────── BOLETINES ───────────────────────────
  let queued = 0;
  for (const g of groups) {
    const r = await req(`/api/report-cards/generate/group/${g.id}`, { method: "POST", token, body: { periodNumber: 1 } });
    const n = D(r)?.queued ?? 0;
    queued += Number(n) || 0;
  }
  console.log(`Boletines → encolados (P1): ${queued} (el worker los procesa en background)`);

  console.log("\n✅ Seed integral completo.");
})();
