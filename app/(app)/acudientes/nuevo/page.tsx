"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Loader2, TriangleAlert, Check, Users2,
  Search, UserPlus, Star, X, KeyRound, Copy,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { TextField, SelectField, SectionTitle } from "@/components/form-fields";
import { Stepper } from "@/components/stepper";
import { AvatarUpload, FileDrop, type UploadedFile } from "@/components/uploads";
import { DOCUMENT_TYPES, GENDERS, BLOOD_TYPES, EDUCATION_LEVELS, YES_NO } from "@/lib/forms";

const STEPS = ["Identidad", "Contacto", "Parentesco", "Estudiantes", "Documentos", "Revisar"];
const RELATIONS = ["Madre", "Padre", "Abuelo/a", "Tío/a", "Hermano/a", "Tutor legal", "Otro"];
const DOC_CATS = [
  { key: "documento_identidad", label: "Documento de identidad" },
  { key: "otros", label: "Otros soportes" },
];

type StudentHit = { id: string; enrollmentCode: string; user: { firstName: string; lastName: string }; gradeGroup?: { name: string } | null };
type LinkedStudent = { studentId: string; name: string; isPrimary: boolean };

const initialsOf = (f: string, l: string) => `${f?.[0] ?? ""}${l?.[0] ?? ""}`.toUpperCase();

export default function NuevoAcudientePage() {
  const [step, setStep] = useState(0);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [relation, setRelation] = useState("Madre");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [p, setP] = useState<Record<string, string>>({});
  const set = (k: string) => (v: string) => setP((s) => ({ ...s, [k]: v }));

  const [search, setSearch] = useState("");
  const [hits, setHits] = useState<StudentHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [linked, setLinked] = useState<LinkedStudent[]>([]);

  const [docs, setDocs] = useState<Record<string, UploadedFile[]>>({});

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ name: string; password?: string } | null>(null);

  useEffect(() => {
    if (step !== 3) return;
    const id = setTimeout(async () => {
      if (!search.trim()) { setHits([]); return; }
      setSearching(true);
      try {
        const res = await apiGet<{ data: StudentHit[] }>(`/students?search=${encodeURIComponent(search.trim())}&limit=6`);
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
    if (step === 0) return p.documentType && p.documentId && firstName.trim() && lastName.trim() && p.birthDate;
    if (step === 1) return email.trim() && mobile.trim();
    if (step === 2) return relation;
    return true;
  }, [step, p.documentType, p.documentId, p.birthDate, firstName, lastName, email, mobile, relation]);

  const toggleLink = (s: StudentHit) => {
    setLinked((prev) => prev.some((l) => l.studentId === s.id)
      ? prev.filter((l) => l.studentId !== s.id)
      : [...prev, { studentId: s.id, name: `${s.user.firstName} ${s.user.lastName}`, isPrimary: prev.length === 0 }]);
  };
  const setPrimary = (studentId: string) => setLinked((prev) => prev.map((l) => ({ ...l, isPrimary: l.studentId === studentId })));

  const submit = async () => {
    setError(null);
    setSaving(true);
    try {
      const profile = Object.fromEntries(Object.entries(p).filter(([, v]) => v && v.trim()));
      const res = await apiPost<{ temporaryPassword?: string }>("/guardians", {
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        relation,
        ...(mobile.trim() ? { phone: mobile.trim() } : {}),
        ...(avatarUrl ? { avatarUrl } : {}),
        ...(Object.keys(profile).length ? { profile } : {}),
        ...(allDocs.length ? { documents: allDocs } : {}),
        ...(linked.length ? { students: linked.map((l) => ({ studentId: l.studentId, isPrimary: l.isPrimary })) } : {}),
      });
      setDone({ name: `${firstName.trim()} ${lastName.trim()}`, password: res.temporaryPassword });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo registrar el acudiente.");
    } finally { setSaving(false); }
  };

  if (done) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-5 px-8 py-20 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-s-success text-s-success-fg"><Check className="h-7 w-7" /></span>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-ink">¡{done.name} quedó registrado!</h1>
          <p className="text-[13px] text-subtle">El acudiente ya puede ver a sus estudiantes vinculados.</p>
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
          <Link href="/acudientes" className="flex h-9 items-center rounded-lg border border-line px-4 text-[13px] font-semibold text-ink hover:bg-surface">Ver acudientes</Link>
          <button onClick={() => window.location.reload()} className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white hover:opacity-90"><UserPlus className="h-3.5 w-3.5" /> Otro acudiente</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-8 py-7">
      <div className="flex flex-col gap-3">
        <Link href="/acudientes" className="flex w-fit items-center gap-1.5 text-[12px] font-medium text-subtle hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" /> Acudientes</Link>
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-s-warning text-s-warning-fg"><Users2 className="h-5 w-5" /></span>
          <div className="flex flex-col">
            <h1 className="text-[22px] font-bold -tracking-[0.02em] text-ink">Nuevo acudiente</h1>
            <p className="text-[12px] text-subtle">Ficha completa. Los campos con * son obligatorios.</p>
          </div>
        </div>
      </div>

      <Stepper steps={STEPS} current={step} />

      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-card p-6">
        {step === 0 && (
          <>
            <AvatarUpload value={avatarUrl} onChange={setAvatarUrl} initials={initialsOf(firstName, lastName)} />
            <div className="flex gap-3">
              <SelectField label="Tipo de documento" required value={p.documentType ?? ""} onChange={set("documentType")} options={DOCUMENT_TYPES} />
              <TextField label="Número de documento" required value={p.documentId ?? ""} onChange={set("documentId")} placeholder="43000000" />
            </div>
            <div className="flex gap-3">
              <TextField label="Primer nombre" required value={firstName} onChange={setFirstName} placeholder="María" />
              <TextField label="Segundo nombre" value={p.secondName ?? ""} onChange={set("secondName")} />
            </div>
            <div className="flex gap-3">
              <TextField label="Primer apellido" required value={lastName} onChange={setLastName} placeholder="Gómez" />
              <TextField label="Segundo apellido" value={p.secondLastName ?? ""} onChange={set("secondLastName")} />
            </div>
            <div className="flex gap-3">
              <SelectField label="Sexo" value={p.gender ?? ""} onChange={set("gender")} options={GENDERS} />
              <TextField label="Fecha de nacimiento" required type="date" value={p.birthDate ?? ""} onChange={set("birthDate")} />
            </div>
            <div className="flex gap-3">
              <TextField label="Nacionalidad" value={p.nationality ?? ""} onChange={set("nationality")} placeholder="Colombiana" />
              <SelectField label="Grupo sanguíneo (RH)" value={p.bloodType ?? ""} onChange={set("bloodType")} options={BLOOD_TYPES} />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <TextField label="Correo" required type="email" value={email} onChange={setEmail} placeholder="maria.gomez@gmail.com" />
            <div className="flex gap-3">
              <TextField label="Celular" required value={mobile} onChange={setMobile} placeholder="+57 300 000 0000" />
              <TextField label="Teléfono fijo" value={p.landline ?? ""} onChange={set("landline")} placeholder="604 000 0000" />
            </div>
            <TextField label="Dirección" value={p.address ?? ""} onChange={set("address")} placeholder="Cra 10 # 20-30" />
            <div className="flex gap-3">
              <TextField label="Barrio" value={p.neighborhood ?? ""} onChange={set("neighborhood")} />
              <TextField label="Ciudad" value={p.city ?? ""} onChange={set("city")} placeholder="Medellín" />
              <TextField label="Departamento" value={p.department ?? ""} onChange={set("department")} placeholder="Antioquia" />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <SectionTitle>RELACIÓN CON EL ESTUDIANTE</SectionTitle>
            <div className="flex gap-3">
              <SelectField label="Parentesco" required value={relation} onChange={setRelation} options={RELATIONS} placeholder="Selecciona…" />
              <SelectField label="¿Vive con el estudiante?" value={p.livesWithStudent ?? ""} onChange={set("livesWithStudent")} options={YES_NO} />
            </div>
            <SelectField label="¿Responsable económico?" value={p.isFinancialResponsible ?? ""} onChange={set("isFinancialResponsible")} options={YES_NO} />
            <SectionTitle>DATOS LABORALES</SectionTitle>
            <div className="flex gap-3">
              <TextField label="Ocupación / profesión" value={p.occupation ?? ""} onChange={set("occupation")} placeholder="Ingeniera" />
              <SelectField label="Nivel educativo" value={p.educationLevel ?? ""} onChange={set("educationLevel")} options={EDUCATION_LEVELS} />
            </div>
            <div className="flex gap-3">
              <TextField label="Empresa / lugar de trabajo" value={p.company ?? ""} onChange={set("company")} />
              <TextField label="Teléfono laboral" value={p.workPhone ?? ""} onChange={set("workPhone")} />
            </div>
          </>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-3">
            <div className="flex h-[42px] items-center gap-2 rounded-lg border border-line bg-card px-3">
              <Search className="h-4 w-4 text-subtle" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Busca un estudiante por nombre o documento…" className="flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted" />
              {searching && <Loader2 className="h-4 w-4 animate-spin text-subtle" />}
            </div>
            {hits.length > 0 && (
              <div className="flex flex-col gap-1">
                {hits.map((s) => {
                  const isLinked = linked.some((l) => l.studentId === s.id);
                  return (
                    <button key={s.id} type="button" onClick={() => toggleLink(s)}
                      className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors ${isLinked ? "border-primary bg-primary/5" : "border-line hover:bg-surface"}`}>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-s-info text-[11px] font-bold text-s-info-fg">{initialsOf(s.user.firstName, s.user.lastName)}</span>
                      <div className="flex flex-1 flex-col">
                        <span className="text-[13px] font-semibold text-ink">{s.user.firstName} {s.user.lastName}</span>
                        <span className="text-[11px] text-subtle">{s.enrollmentCode}{s.gradeGroup ? ` · ${s.gradeGroup.name}` : ""}</span>
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
                  <div key={l.studentId} className="flex items-center gap-2 rounded-lg bg-card px-3 py-2">
                    <span className="flex-1 text-[13px] font-medium text-ink">{l.name}</span>
                    <button type="button" onClick={() => setPrimary(l.studentId)} title="Acudiente principal de este estudiante"
                      className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold ${l.isPrimary ? "bg-s-warning text-s-warning-fg" : "text-subtle hover:bg-surface"}`}>
                      <Star className={`h-3 w-3 ${l.isPrimary ? "fill-current" : ""}`} /> {l.isPrimary ? "Principal" : "Hacer principal"}
                    </button>
                    <button type="button" onClick={() => toggleLink({ id: l.studentId } as StudentHit)} className="text-subtle hover:text-danger"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg bg-surface px-3 py-2.5 text-[12px] text-subtle">Opcional. Puedes vincular estudiantes ahora o después.</p>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4">
            {DOC_CATS.map((c) => (
              <div key={c.key} className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink">{c.label}</span>
                <FileDrop value={docs[c.key] ?? []} onChange={(next) => setDocs((d) => ({ ...d, [c.key]: next }))} />
              </div>
            ))}
          </div>
        )}

        {step === 5 && (
          <div className="flex flex-col gap-3 text-[13px]">
            <Row label="Acudiente" value={`${firstName} ${lastName}`} />
            <Row label="Documento" value={`${p.documentType ?? ""} ${p.documentId ?? ""}`.trim()} />
            <Row label="Correo / celular" value={`${email} · ${mobile}`} />
            <Row label="Parentesco" value={relation} />
            <Row label="Ocupación" value={p.occupation || "—"} />
            <Row label="Estudiantes" value={linked.length ? linked.map((l) => l.name).join(", ") : "Ninguno"} />
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
            className="flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Registrar acudiente</button>
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
