"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Loader2, TriangleAlert, Check, Briefcase,
  UserPlus, KeyRound, Copy,
} from "lucide-react";
import { apiPost } from "@/lib/api";
import { TextField, SelectField } from "@/components/form-fields";
import { Stepper } from "@/components/stepper";
import { AvatarUpload, FileDrop, type UploadedFile } from "@/components/uploads";
import { DOCUMENT_TYPES, GENDERS, BLOOD_TYPES, CONTRACT_TYPES } from "@/lib/forms";

const STEPS = ["Identidad", "Contacto", "Cargo", "Documentos", "Revisar"];
const STAFF_ROLES = [
  { value: "RECTOR", label: "Rector" },
  { value: "COORDINATOR_ACADEMIC", label: "Coord. Académico" },
  { value: "COORDINATOR_CONVIVENCIA", label: "Coord. Convivencia" },
  { value: "SECRETARY", label: "Secretaría" },
  { value: "ACCOUNTANT", label: "Contabilidad" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
];
const roleLabel = (r: string) => STAFF_ROLES.find((x) => x.value === r)?.label ?? r;
const DOC_CATS = [
  { key: "hoja_vida", label: "Hoja de vida" },
  { key: "documento_identidad", label: "Documento de identidad" },
  { key: "otros", label: "Otros soportes" },
];
const initialsOf = (f: string, l: string) => `${f?.[0] ?? ""}${l?.[0] ?? ""}`.toUpperCase();

export default function NuevoPersonalPage() {
  const [step, setStep] = useState(0);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState("SECRETARY");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [p, setP] = useState<Record<string, string>>({});
  const set = (k: string) => (v: string) => setP((s) => ({ ...s, [k]: v }));

  const [docs, setDocs] = useState<Record<string, UploadedFile[]>>({});

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ name: string; password?: string } | null>(null);

  const allDocs = useMemo(
    () => DOC_CATS.flatMap((c) => (docs[c.key] ?? []).map((f) => ({ category: c.key, name: f.name, fileUrl: f.url, mimeType: f.mimeType, size: f.size }))),
    [docs],
  );

  const canNext = useMemo(() => {
    if (step === 0) return p.documentType && p.documentId && firstName.trim() && lastName.trim() && p.birthDate;
    if (step === 1) return email.trim() && mobile.trim();
    if (step === 2) return role;
    return true;
  }, [step, p.documentType, p.documentId, p.birthDate, firstName, lastName, email, mobile, role]);

  const submit = async () => {
    setError(null);
    setSaving(true);
    try {
      const profile = Object.fromEntries(Object.entries(p).filter(([, v]) => v && v.trim()));
      const res = await apiPost<{ user: { firstName: string; lastName: string }; temporaryPassword?: string }>("/users", {
        email: email.trim(),
        role,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        ...(mobile.trim() ? { phone: mobile.trim() } : {}),
        ...(avatarUrl ? { avatarUrl } : {}),
        ...(Object.keys(profile).length ? { profile } : {}),
        ...(allDocs.length ? { documents: allDocs } : {}),
      });
      setDone({ name: `${res.user.firstName} ${res.user.lastName}`, password: res.temporaryPassword });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear la cuenta.");
    } finally { setSaving(false); }
  };

  if (done) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-5 px-8 py-20 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-s-success text-s-success-fg"><Check className="h-7 w-7" /></span>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-ink">¡{done.name} quedó registrado!</h1>
          <p className="text-[13px] text-subtle">La cuenta administrativa ya está activa.</p>
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
          <Link href="/personal" className="flex h-9 items-center rounded-lg border border-line px-4 text-[13px] font-semibold text-ink hover:bg-surface">Ver personal</Link>
          <button onClick={() => window.location.reload()} className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white hover:opacity-90"><UserPlus className="h-3.5 w-3.5" /> Otra cuenta</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-8 py-7">
      <div className="flex flex-col gap-3">
        <Link href="/personal" className="flex w-fit items-center gap-1.5 text-[12px] font-medium text-subtle hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" /> Personal</Link>
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Briefcase className="h-5 w-5" /></span>
          <div className="flex flex-col">
            <h1 className="text-[22px] font-bold -tracking-[0.02em] text-ink">Nuevo personal</h1>
            <p className="text-[12px] text-subtle">Cuenta administrativa completa. Los campos con * son obligatorios.</p>
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
              <TextField label="Primer nombre" required value={firstName} onChange={setFirstName} placeholder="Diana" />
              <TextField label="Segundo nombre" value={p.secondName ?? ""} onChange={set("secondName")} />
            </div>
            <div className="flex gap-3">
              <TextField label="Primer apellido" required value={lastName} onChange={setLastName} placeholder="Restrepo" />
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
            <TextField label="Correo" required type="email" value={email} onChange={setEmail} placeholder="diana.restrepo@colegio.edu.co" />
            <div className="flex gap-3">
              <TextField label="Celular" required value={mobile} onChange={setMobile} placeholder="+57 300 000 0000" />
              <TextField label="Teléfono fijo" value={p.landline ?? ""} onChange={set("landline")} />
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
            <SelectField label="Cargo" required value={role} onChange={setRole} options={STAFF_ROLES} placeholder="Selecciona…" />
            <TextField label="Dependencia / área" value={p.area ?? ""} onChange={set("area")} placeholder="Rectoría, Secretaría académica…" />
            <div className="flex gap-3">
              <TextField label="Fecha de ingreso" type="date" value={p.hireDate ?? ""} onChange={set("hireDate")} />
              <SelectField label="Tipo de vinculación" value={p.contractType ?? ""} onChange={set("contractType")} options={CONTRACT_TYPES} />
            </div>
          </>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            {DOC_CATS.map((c) => (
              <div key={c.key} className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink">{c.label}</span>
                <FileDrop value={docs[c.key] ?? []} onChange={(next) => setDocs((d) => ({ ...d, [c.key]: next }))} />
              </div>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-3 text-[13px]">
            <Row label="Nombre" value={`${firstName} ${lastName}`} />
            <Row label="Documento" value={`${p.documentType ?? ""} ${p.documentId ?? ""}`.trim()} />
            <Row label="Correo / celular" value={`${email} · ${mobile}`} />
            <Row label="Cargo" value={roleLabel(role)} />
            <Row label="Dependencia" value={p.area || "—"} />
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
            className="flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Crear cuenta</button>
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
