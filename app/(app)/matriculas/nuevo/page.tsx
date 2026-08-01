"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Loader2, TriangleAlert, Check, GraduationCap,
  Search, UserPlus, Star, X, KeyRound, Copy,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { getCurrentYear, getGroups, type Group } from "@/lib/academic";
import { FormField, inputCls } from "@/components/modal";
import { TextField, SelectField, SectionTitle } from "@/components/form-fields";
import { Stepper } from "@/components/stepper";
import { AvatarUpload, FileDrop, type UploadedFile } from "@/components/uploads";
import {
  DOCUMENT_TYPES, GENDERS, BLOOD_TYPES, JORNADAS, STRATA, ETHNICITIES, YES_NO, GRADES,
} from "@/lib/forms";

const STEPS = ["Identidad", "Contacto", "Salud", "Matrícula", "Acudientes", "Documentos", "Revisar"];

const DOC_CATS = [
  { key: "registro_civil", label: "Registro civil" },
  { key: "documento_identidad", label: "Documento de identidad" },
  { key: "boletin_anterior", label: "Boletín año anterior" },
  { key: "carnet_eps", label: "Carné EPS / vacunas" },
  { key: "otros", label: "Otros soportes" },
];

type GuardianHit = { id: string; relation: string; user: { firstName: string; lastName: string; email: string } };
type LinkedGuardian = { guardianId: string; name: string; relation: string; isPrimary: boolean };

const initialsOf = (f: string, l: string) => `${f?.[0] ?? ""}${l?.[0] ?? ""}`.toUpperCase();

export default function NuevoEstudiantePage() {
  const [step, setStep] = useState(0);
  const [groups, setGroups] = useState<Group[]>([]);

  // núcleo (columnas)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState("");
  const [enrollmentCode, setEnrollmentCode] = useState("");
  const [gradeGroupId, setGradeGroupId] = useState("");
  const [address, setAddress] = useState("");

  // perfil extendido (JSON)
  const [p, setP] = useState<Record<string, string>>({});
  const set = (k: string) => (v: string) => setP((s) => ({ ...s, [k]: v }));

  // acudientes
  const [search, setSearch] = useState("");
  const [hits, setHits] = useState<GuardianHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [linked, setLinked] = useState<LinkedGuardian[]>([]);

  // documentos
  const [docs, setDocs] = useState<Record<string, UploadedFile[]>>({});

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ name: string; password?: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const year = await getCurrentYear();
        if (year) setGroups(await getGroups(year.id));
      } catch { /* selector secundario */ }
    })();
  }, []);

  useEffect(() => {
    if (step !== 4) return;
    const id = setTimeout(async () => {
      if (!search.trim()) { setHits([]); return; }
      setSearching(true);
      try {
        const res = await apiGet<{ data: GuardianHit[] }>(`/guardians?search=${encodeURIComponent(search.trim())}&limit=6`);
        setHits(res.data);
      } catch { setHits([]); } finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(id);
  }, [search, step]);

  const allDocs = useMemo(
    () => DOC_CATS.flatMap((c) => (docs[c.key] ?? []).map((f) => ({ category: c.key, name: f.name, fileUrl: f.url, mimeType: f.mimeType, size: f.size }))),
    [docs],
  );

  const canNext = useMemo(() => {
    if (step === 0) return p.documentType && documentId.trim() && firstName.trim() && lastName.trim() && birthDate;
    if (step === 1) return email.trim() && mobile.trim();
    if (step === 3) return enrollmentCode.trim();
    return true;
  }, [step, p.documentType, documentId, firstName, lastName, birthDate, email, mobile, enrollmentCode]);

  const toggleLink = (g: GuardianHit) => {
    setLinked((prev) => prev.some((l) => l.guardianId === g.id)
      ? prev.filter((l) => l.guardianId !== g.id)
      : [...prev, { guardianId: g.id, name: `${g.user.firstName} ${g.user.lastName}`, relation: g.relation, isPrimary: prev.length === 0 }]);
  };
  const setPrimary = (guardianId: string) => setLinked((prev) => prev.map((l) => ({ ...l, isPrimary: l.guardianId === guardianId })));

  const submit = async () => {
    setError(null);
    setSaving(true);
    try {
      const profile = Object.fromEntries(Object.entries(p).filter(([, v]) => v && v.trim()));
      const userRes = await apiPost<{ user: { id: string }; temporaryPassword?: string }>("/users", {
        email: email.trim(),
        role: "STUDENT",
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        ...(mobile.trim() ? { phone: mobile.trim() } : {}),
        ...(avatarUrl ? { avatarUrl } : {}),
        ...(allDocs.length ? { documents: allDocs } : {}),
        ...(Object.keys(profile).length ? { profile } : {}),
        mustChangePassword: false,
      });
      const studentRes = await apiPost<{ id: string }>("/students", {
        userId: userRes.user.id,
        enrollmentCode: enrollmentCode.trim(),
        documentId: documentId.trim(),
        birthDate,
        ...(gradeGroupId ? { gradeGroupId } : {}),
        ...(address.trim() ? { address: address.trim() } : {}),
      });
      for (const l of linked) {
        await apiPost(`/students/${studentRes.id}/guardians`, { guardianId: l.guardianId, isPrimary: l.isPrimary });
      }
      setDone({ name: `${firstName.trim()} ${lastName.trim()}`, password: userRes.temporaryPassword });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear la matrícula.");
    } finally { setSaving(false); }
  };

  if (done) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-5 px-8 py-20 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-s-success text-s-success-fg"><Check className="h-7 w-7" /></span>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-ink">¡{done.name} quedó matriculado!</h1>
          <p className="text-[13px] text-subtle">El estudiante ya aparece en el directorio.</p>
        </div>
        {done.password && (
          <div className="flex w-full flex-col gap-1.5 rounded-xl border border-line bg-card p-4 text-left">
            <span className="flex items-center gap-1.5 text-[12px] font-semibold text-ink"><KeyRound className="h-3.5 w-3.5" /> Contraseña temporal</span>
            <div className="flex items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2">
              <code className="text-[13px] font-bold text-ink">{done.password}</code>
              <button onClick={() => navigator.clipboard?.writeText(done.password!)} className="text-subtle hover:text-ink"><Copy className="h-4 w-4" /></button>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <Link href="/estudiantes" className="flex h-9 items-center rounded-lg border border-line px-4 text-[13px] font-semibold text-ink hover:bg-surface">Ver estudiantes</Link>
          <button onClick={() => window.location.reload()} className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white hover:opacity-90"><UserPlus className="h-3.5 w-3.5" /> Otro estudiante</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-8 py-7">
      <div className="flex flex-col gap-3">
        <Link href="/estudiantes" className="flex w-fit items-center gap-1.5 text-[12px] font-medium text-subtle hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" /> Estudiantes</Link>
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><GraduationCap className="h-5 w-5" /></span>
          <div className="flex flex-col">
            <h1 className="text-[22px] font-bold -tracking-[0.02em] text-ink">Nuevo estudiante</h1>
            <p className="text-[12px] text-subtle">Ficha de matrícula completa. Los campos con * son obligatorios.</p>
          </div>
        </div>
      </div>

      <Stepper steps={STEPS} current={step} />

      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-card p-6">
        {/* 0 — IDENTIDAD */}
        {step === 0 && (
          <>
            <AvatarUpload value={avatarUrl} onChange={setAvatarUrl} initials={initialsOf(firstName, lastName)} />
            <div className="flex gap-3">
              <SelectField label="Tipo de documento" required value={p.documentType ?? ""} onChange={set("documentType")} options={DOCUMENT_TYPES} />
              <TextField label="Número de documento" required value={documentId} onChange={setDocumentId} placeholder="1010000000" />
            </div>
            <div className="flex gap-3">
              <TextField label="Primer nombre" required value={firstName} onChange={setFirstName} placeholder="Ana" />
              <TextField label="Segundo nombre" value={p.secondName ?? ""} onChange={set("secondName")} placeholder="María" />
            </div>
            <div className="flex gap-3">
              <TextField label="Primer apellido" required value={lastName} onChange={setLastName} placeholder="Castillo" />
              <TextField label="Segundo apellido" value={p.secondLastName ?? ""} onChange={set("secondLastName")} placeholder="Rojas" />
            </div>
            <div className="flex gap-3">
              <SelectField label="Sexo" value={p.gender ?? ""} onChange={set("gender")} options={GENDERS} />
              <TextField label="Fecha de nacimiento" required type="date" value={birthDate} onChange={setBirthDate} />
            </div>
            <div className="flex gap-3">
              <TextField label="Lugar de nacimiento" value={p.birthPlace ?? ""} onChange={set("birthPlace")} placeholder="Medellín, Antioquia" />
              <TextField label="Nacionalidad" value={p.nationality ?? ""} onChange={set("nationality")} placeholder="Colombiana" />
            </div>
            <SelectField label="Grupo sanguíneo (RH)" value={p.bloodType ?? ""} onChange={set("bloodType")} options={BLOOD_TYPES} />
          </>
        )}

        {/* 1 — CONTACTO */}
        {step === 1 && (
          <>
            <TextField label="Correo" required type="email" value={email} onChange={setEmail} placeholder="ana.castillo@estudiante.edu.co" />
            <div className="flex gap-3">
              <TextField label="Celular" required value={mobile} onChange={setMobile} placeholder="+57 300 000 0000" />
              <TextField label="Teléfono fijo" value={p.landline ?? ""} onChange={set("landline")} placeholder="604 000 0000" />
            </div>
            <TextField label="Dirección" value={address} onChange={setAddress} placeholder="Cra 10 # 20-30" />
            <div className="flex gap-3">
              <TextField label="Barrio" value={p.neighborhood ?? ""} onChange={set("neighborhood")} placeholder="El Poblado" />
              <TextField label="Ciudad" value={p.city ?? ""} onChange={set("city")} placeholder="Medellín" />
              <TextField label="Departamento" value={p.department ?? ""} onChange={set("department")} placeholder="Antioquia" />
            </div>
          </>
        )}

        {/* 2 — SALUD Y POBLACIÓN */}
        {step === 2 && (
          <>
            <SectionTitle>SALUD</SectionTitle>
            <div className="flex gap-3">
              <TextField label="EPS / aseguradora" value={p.eps ?? ""} onChange={set("eps")} placeholder="Sura" />
              <SelectField label="¿Tiene alguna discapacidad?" value={p.disability ?? ""} onChange={set("disability")} options={YES_NO} />
            </div>
            <FormField label="Alergias / condiciones médicas">
              <textarea className={`${inputCls} h-20 py-2`} value={p.medicalConditions ?? ""} onChange={(e) => set("medicalConditions")(e.target.value)} placeholder="Asma, alergia a la penicilina, etc." />
            </FormField>
            <SectionTitle>POBLACIÓN</SectionTitle>
            <div className="flex gap-3">
              <SelectField label="Estrato" value={p.stratum ?? ""} onChange={set("stratum")} options={STRATA} />
              <TextField label="SISBÉN (grupo)" value={p.sisben ?? ""} onChange={set("sisben")} placeholder="A1, B2…" />
            </div>
            <div className="flex gap-3">
              <SelectField label="Etnia / grupo poblacional" value={p.ethnicity ?? ""} onChange={set("ethnicity")} options={ETHNICITIES} />
              <SelectField label="¿Víctima del conflicto?" value={p.isVictim ?? ""} onChange={set("isVictim")} options={YES_NO} />
            </div>
          </>
        )}

        {/* 3 — MATRÍCULA */}
        {step === 3 && (
          <>
            <div className="flex gap-3">
              <TextField label="Código de matrícula" required value={enrollmentCode} onChange={setEnrollmentCode} placeholder="2026-031" />
              <SelectField label="Jornada" value={p.jornada ?? ""} onChange={set("jornada")} options={JORNADAS} />
            </div>
            <FormField label="Grupo (opcional)">
              <select className={inputCls} value={gradeGroupId} onChange={(e) => setGradeGroupId(e.target.value)}>
                <option value="">Sin asignar — lo asigna administración</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </FormField>
            <div className="flex gap-3">
              <TextField label="Institución de procedencia" value={p.previousSchool ?? ""} onChange={set("previousSchool")} placeholder="Colegio anterior" />
              <SelectField label="Último grado cursado" value={p.previousGrade ?? ""} onChange={set("previousGrade")} options={GRADES} />
            </div>
          </>
        )}

        {/* 4 — ACUDIENTES */}
        {step === 4 && (
          <div className="flex flex-col gap-3">
            <div className="flex h-[42px] items-center gap-2 rounded-lg border border-line bg-card px-3">
              <Search className="h-4 w-4 text-subtle" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Busca un acudiente por nombre o correo…" className="flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted" />
              {searching && <Loader2 className="h-4 w-4 animate-spin text-subtle" />}
            </div>
            {hits.length > 0 && (
              <div className="flex flex-col gap-1">
                {hits.map((g) => {
                  const isLinked = linked.some((l) => l.guardianId === g.id);
                  return (
                    <button key={g.id} type="button" onClick={() => toggleLink(g)}
                      className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors ${isLinked ? "border-primary bg-primary/5" : "border-line hover:bg-surface"}`}>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-s-warning text-[11px] font-bold text-s-warning-fg">{initialsOf(g.user.firstName, g.user.lastName)}</span>
                      <div className="flex flex-1 flex-col">
                        <span className="text-[13px] font-semibold text-ink">{g.user.firstName} {g.user.lastName}</span>
                        <span className="text-[11px] text-subtle">{g.relation} · {g.user.email}</span>
                      </div>
                      {isLinked ? <Check className="h-4 w-4 text-primary" /> : <UserPlus className="h-4 w-4 text-subtle" />}
                    </button>
                  );
                })}
              </div>
            )}
            {linked.length > 0 ? (
              <div className="flex flex-col gap-1.5 rounded-xl border border-line bg-surface/50 p-3">
                <span className="text-[11px] font-bold tracking-[0.1em] text-subtle">VINCULADOS ({linked.length})</span>
                {linked.map((l) => (
                  <div key={l.guardianId} className="flex items-center gap-2 rounded-lg bg-card px-3 py-2">
                    <span className="flex-1 text-[13px] font-medium text-ink">{l.name} <span className="text-subtle">· {l.relation}</span></span>
                    <button type="button" onClick={() => setPrimary(l.guardianId)} title="Marcar como principal"
                      className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold ${l.isPrimary ? "bg-s-warning text-s-warning-fg" : "text-subtle hover:bg-surface"}`}>
                      <Star className={`h-3 w-3 ${l.isPrimary ? "fill-current" : ""}`} /> {l.isPrimary ? "Principal" : "Hacer principal"}
                    </button>
                    <button type="button" onClick={() => toggleLink({ id: l.guardianId } as GuardianHit)} className="text-subtle hover:text-danger"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg bg-surface px-3 py-2.5 text-[12px] text-subtle">Opcional. ¿El acudiente aún no existe? Regístralo en <Link href="/acudientes/nuevo" className="font-semibold text-primary">Acudientes</Link> y vuelve aquí.</p>
            )}
          </div>
        )}

        {/* 5 — DOCUMENTOS */}
        {step === 5 && (
          <div className="flex flex-col gap-4">
            {DOC_CATS.map((c) => (
              <div key={c.key} className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink">{c.label}</span>
                <FileDrop value={docs[c.key] ?? []} onChange={(next) => setDocs((d) => ({ ...d, [c.key]: next }))} />
              </div>
            ))}
          </div>
        )}

        {/* 6 — REVISAR */}
        {step === 6 && (
          <div className="flex flex-col gap-3 text-[13px]">
            <Row label="Estudiante" value={`${firstName} ${p.secondName ?? ""} ${lastName} ${p.secondLastName ?? ""}`.replace(/\s+/g, " ").trim()} />
            <Row label="Documento" value={`${p.documentType ?? ""} ${documentId}`.trim()} />
            <Row label="Nacimiento" value={`${birthDate}${p.birthPlace ? ` · ${p.birthPlace}` : ""}`} />
            <Row label="Correo / celular" value={`${email} · ${mobile}`} />
            <Row label="EPS" value={p.eps || "—"} />
            <Row label="Código / jornada" value={`${enrollmentCode}${p.jornada ? ` · ${p.jornada}` : ""}`} />
            <Row label="Grupo" value={groups.find((g) => g.id === gradeGroupId)?.name ?? "Sin asignar"} />
            <Row label="Acudientes" value={linked.length ? linked.map((l) => l.name).join(", ") : "Ninguno"} />
            <Row label="Documentos" value={`${allDocs.length} archivo(s)`} />
          </div>
        )}

        {error && <div className="flex items-center gap-2 rounded-lg bg-s-error px-3 py-2 text-[13px] text-s-error-fg"><TriangleAlert className="h-4 w-4" /> {error}</div>}
      </div>

      <div className="flex items-center justify-between">
        <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
          className="flex h-10 items-center gap-1.5 rounded-lg border border-line px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-surface disabled:opacity-40"><ArrowLeft className="h-4 w-4" /> Atrás</button>
        {step < STEPS.length - 1 ? (
          <button onClick={() => canNext && setStep((s) => s + 1)} disabled={!canNext}
            className="flex h-10 items-center gap-1.5 rounded-lg bg-primary px-5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40">Siguiente <ArrowRight className="h-4 w-4" /></button>
        ) : (
          <button onClick={submit} disabled={saving}
            className="flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Matricular</button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line pb-2 last:border-0">
      <span className="text-subtle">{label}</span>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  );
}
