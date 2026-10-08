"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FileBadge, Search, Loader2, TriangleAlert, GraduationCap, Wallet, ScrollText, Download,
} from "lucide-react";
import { apiGet, getAccessToken } from "@/lib/api";
import { getCurrentYear, getGroups, initials, type Group } from "@/lib/academic";

type StudentRow = { id: string; user: { firstName: string; lastName: string }; enrollmentCode?: string };
type Paginated<T> = { data: T[] };

const AVATARS = [
  "bg-blue-100 text-blue-700", "bg-amber-100 text-amber-700", "bg-pink-100 text-pink-700", "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700", "bg-teal-100 text-teal-700", "bg-orange-100 text-orange-700", "bg-sky-100 text-sky-700",
];
const nameOf = (s: StudentRow) => `${s.user.firstName} ${s.user.lastName}`;

const TYPES = [
  { id: "estudio", label: "Constancia de estudio", desc: "Certifica matrícula y grado en el año actual.", icon: GraduationCap },
  { id: "notas", label: "Certificado de calificaciones", desc: "Promedio por área y desempeño.", icon: ScrollText },
  { id: "paz-y-salvo", label: "Paz y salvo financiero", desc: "Estado de cartera del estudiante.", icon: Wallet },
] as const;

export default function CertificadosPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState("");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<StudentRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const year = await getCurrentYear();
        if (!year) throw new Error("Sin año lectivo.");
        const gs = await getGroups(year.id);
        setGroups(gs);
        if (gs[0]) setGroupId(gs[0].id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo cargar.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadStudents = useCallback(async (gid: string) => {
    if (!gid) { setStudents([]); return; }
    setLoadingStudents(true);
    try {
      const r = await apiGet<Paginated<StudentRow>>(`/students?gradeGroupId=${gid}&limit=200`);
      setStudents(r.data ?? []);
    } catch {
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  useEffect(() => { setSelected(null); loadStudents(groupId); }, [groupId, loadStudents]);

  const filtered = students.filter((s) => nameOf(s).toLowerCase().includes(query.trim().toLowerCase()));

  const generate = async (type: string) => {
    if (!selected) return;
    setBusy(type);
    setError(null);
    try {
      const res = await fetch(`/api/certificates/${type}/${selected.id}`, {
        headers: { Authorization: `Bearer ${getAccessToken() ?? ""}` },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.message?.message || j?.message || "No se pudo generar el certificado.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}_${selected.enrollmentCode || selected.id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar el certificado.");
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center gap-2 px-8 py-24 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>;
  }

  return (
    <div className="flex flex-col gap-5 px-8 py-7">
      {/* header */}
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-bold tracking-[0.18em] text-primary">SECRETARÍA</span>
        <h1 className="text-[28px] font-bold -tracking-[0.02em] text-ink">Certificados y constancias</h1>
        <p className="text-[13px] text-subtle">Selecciona un estudiante y genera su documento en PDF.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-s-error px-3.5 py-2.5 text-[13px] font-medium text-s-error-fg">
          <TriangleAlert className="h-4 w-4" /> {error}
          <button onClick={() => setError(null)} className="ml-auto text-xs underline">cerrar</button>
        </div>
      )}

      <div className="flex flex-col gap-5 lg:flex-row">
        {/* selector de estudiante */}
        <div className="flex w-full flex-col gap-3 lg:w-[340px] lg:shrink-0">
          <label className="flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-1.5 text-xs">
            <span className="font-medium text-subtle">Grupo</span>
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="flex-1 bg-transparent text-[13px] font-semibold text-ink outline-none">
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </label>
          <div className="flex h-10 items-center gap-2 rounded-lg border border-line bg-card px-3.5">
            <Search className="h-4 w-4 text-subtle" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar estudiante…" className="flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted" />
          </div>
          <div className="flex max-h-[60vh] flex-col gap-1.5 overflow-y-auto">
            {loadingStudents ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>
            ) : filtered.length === 0 ? (
              <p className="py-10 text-center text-sm text-subtle">Sin estudiantes.</p>
            ) : (
              filtered.map((s, i) => {
                const on = selected?.id === s.id;
                return (
                  <button key={s.id} onClick={() => setSelected(s)} className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors ${on ? "border-primary bg-primary/5" : "border-line hover:border-primary/40"}`}>
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${AVATARS[i % AVATARS.length]}`}>{initials(s.user.firstName, s.user.lastName)}</span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[13px] font-medium text-ink">{nameOf(s)}</span>
                      <span className="truncate text-[11px] text-subtle">{s.enrollmentCode ?? "—"}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* tipos de certificado */}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-card py-20 text-center text-sm text-subtle">
              <FileBadge className="h-7 w-7 text-muted" /> Selecciona un estudiante para generar sus certificados.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 rounded-2xl border border-line bg-card p-5">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-base font-bold text-white">{initials(selected.user.firstName, selected.user.lastName)}</span>
                <div className="flex flex-col">
                  <h2 className="text-lg font-bold text-ink">{nameOf(selected)}</h2>
                  <span className="text-[12px] text-subtle">Código {selected.enrollmentCode ?? "—"}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {TYPES.map((t) => {
                  const Icon = t.icon;
                  const loadingThis = busy === t.id;
                  return (
                    <div key={t.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-5">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-tint text-primary"><Icon className="h-5 w-5" /></span>
                      <div className="flex flex-1 flex-col gap-1">
                        <span className="text-[14px] font-bold text-ink">{t.label}</span>
                        <span className="text-[12px] leading-relaxed text-subtle">{t.desc}</span>
                      </div>
                      <button
                        onClick={() => generate(t.id)}
                        disabled={!!busy}
                        className="flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        {loadingThis ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Generar PDF
                      </button>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-subtle">El PDF se descarga automáticamente. Documento oficial firmado por Secretaría Académica.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
