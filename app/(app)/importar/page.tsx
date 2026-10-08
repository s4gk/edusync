"use client";

import { useEffect, useState } from "react";
import { Upload, Download, Loader2, CheckCircle2, XCircle, TriangleAlert, Users } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/components/auth-context";
import { getCurrentYear, getGroups, type Group } from "@/lib/academic";

type Row = { nombre: string; apellido: string; email: string; documento: string; codigo: string; nacimiento: string; grupo: string };
type Result = { row: Row; ok: boolean; msg: string };

const HEADERS = ["nombre", "apellido", "email", "documento", "codigo", "nacimiento", "grupo"];
const TEMPLATE = `${HEADERS.join(",")}\nJuan,Pérez,juan.perez@colegio.edu.co,1020304050,2026-101,2012-04-18,6A\nMaría,Gómez,maria.gomez@colegio.edu.co,1020304051,2026-102,2012-09-02,6A`;

function parseCsv(text: string): Row[] {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const head = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = (name: string) => head.indexOf(name);
  return lines.slice(1).map((line) => {
    const c = line.split(",").map((x) => x.trim());
    const get = (n: string) => { const i = idx(n); return i >= 0 ? (c[i] ?? "") : ""; };
    return {
      nombre: get("nombre"), apellido: get("apellido"), email: get("email"),
      documento: get("documento"), codigo: get("codigo"), nacimiento: get("nacimiento"), grupo: get("grupo"),
    };
  }).filter((r) => r.nombre && r.apellido && r.email);
}

export default function ImportarPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [yearId, setYearId] = useState("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    (async () => {
      const y = await getCurrentYear().catch(() => null);
      if (!y) return;
      setYearId(y.id);
      setGroups(await getGroups(y.id).catch(() => []));
    })();
  }, []);

  const onText = (t: string) => { setText(t); setRows(parseCsv(t)); setResults([]); };
  const onFile = async (f: File | null) => { if (f) onText(await f.text()); };

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([TEMPLATE], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "plantilla_estudiantes.csv"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  const groupId = (name: string) => groups.find((g) => g.name.toLowerCase() === name.trim().toLowerCase())?.id;

  const importar = async () => {
    setRunning(true); setResults([]);
    const out: Result[] = [];
    for (const r of rows) {
      try {
        const userRes = await apiPost<{ id: string }>("/users", {
          firstName: r.nombre, lastName: r.apellido, email: r.email, role: "STUDENT",
        });
        await apiPost("/students", {
          userId: userRes.id,
          enrollmentCode: r.codigo,
          documentId: r.documento,
          birthDate: r.nacimiento,
          gradeGroupId: groupId(r.grupo),
        });
        out.push({ row: r, ok: true, msg: "Creado" });
      } catch (e) {
        out.push({ row: r, ok: false, msg: e instanceof Error ? e.message : "Error" });
      }
      setResults([...out]);
    }
    setRunning(false);
  };

  const okCount = results.filter((r) => r.ok).length;

  return (
    <div className="flex flex-col gap-5 px-8 py-7">
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-bold tracking-[0.18em] text-primary">ONBOARDING</span>
        <h1 className="text-[28px] font-bold -tracking-[0.02em] text-ink">Importar estudiantes (CSV)</h1>
        <p className="text-[13px] text-subtle">Crea estudiantes en lote desde una hoja de cálculo. Crea el usuario y la ficha de cada uno.</p>
      </div>

      {!isSuperAdmin && (
        <div className="flex items-center gap-2 rounded-lg bg-s-warning px-3.5 py-2.5 text-[13px] font-medium text-s-warning-fg">
          <TriangleAlert className="h-4 w-4" /> La importación requiere rol Super Administrador.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={downloadTemplate} className="flex h-9 items-center gap-2 rounded-lg border border-line px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">
          <Download className="h-3.5 w-3.5" /> Descargar plantilla
        </button>
        <label className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-line px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">
          <Upload className="h-3.5 w-3.5" /> Subir archivo CSV
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[12px] font-semibold text-ink">…o pega el CSV aquí (con encabezados: {HEADERS.join(", ")})</span>
        <textarea value={text} onChange={(e) => onText(e.target.value)} rows={5} placeholder={TEMPLATE}
          className="rounded-lg border border-line bg-card px-3 py-2 font-mono text-[12px] text-ink outline-none focus:ring-2 focus:ring-primary/40" />
      </div>

      {rows.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-[13px] font-bold text-ink"><Users className="h-4 w-4 text-primary" /> {rows.length} estudiantes detectados</span>
            <button onClick={importar} disabled={!isSuperAdmin || running} className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40">
              {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Importar {rows.length}
            </button>
          </div>

          <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
            <div className="flex items-center gap-3 border-b border-line bg-surface px-5 py-2.5 text-[10px] font-bold tracking-[0.1em] text-subtle">
              <span className="w-6" /><span className="flex-1">NOMBRE</span><span className="w-48">EMAIL</span><span className="w-24">GRUPO</span><span className="w-40">ESTADO</span>
            </div>
            {rows.map((r, i) => {
              const res = results[i];
              const grpOk = !r.grupo || !!groupId(r.grupo);
              return (
                <div key={i} className="flex items-center gap-3 border-b border-line px-5 py-2 last:border-0 text-[12px]">
                  <span className="w-6 text-subtle">{i + 1}</span>
                  <span className="flex-1 truncate font-medium text-ink">{r.nombre} {r.apellido}</span>
                  <span className="w-48 truncate text-subtle">{r.email}</span>
                  <span className={`w-24 truncate ${grpOk ? "text-subtle" : "text-rose-600"}`}>{r.grupo || "—"}{!grpOk && " ⚠"}</span>
                  <span className="w-40 truncate">
                    {res ? (
                      res.ok
                        ? <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> {res.msg}</span>
                        : <span className="flex items-center gap-1 text-rose-600" title={res.msg}><XCircle className="h-3.5 w-3.5" /> {res.msg.slice(0, 28)}</span>
                    ) : <span className="text-subtle">pendiente</span>}
                  </span>
                </div>
              );
            })}
          </div>

          {results.length > 0 && !running && (
            <p className="text-[13px] text-subtle">Resultado: <span className="font-semibold text-emerald-600">{okCount} creados</span> · {results.length - okCount} con error.</p>
          )}
          <p className="text-[11px] text-subtle">Cada fila crea un usuario (rol estudiante, contraseña autogenerada) y su ficha. El grupo se vincula por nombre exacto (⚠ = grupo no encontrado, queda sin asignar).</p>
        </div>
      )}
    </div>
  );
}
