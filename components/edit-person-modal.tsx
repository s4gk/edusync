"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, TriangleAlert } from "lucide-react";
import { apiPut, apiGet } from "@/lib/api";
import { getCurrentYear, getGroups, type Group } from "@/lib/academic";
import { Modal, FormField, inputCls } from "@/components/modal";
import { TextField, SelectField, SectionTitle } from "@/components/form-fields";
import { AvatarUpload } from "@/components/uploads";
import { DOCUMENT_TYPES, GENDERS, BLOOD_TYPES, EDUCATION_LEVELS, CONTRACT_TYPES } from "@/lib/forms";

export type PersonKind = "student" | "teacher" | "guardian" | "staff";

const RELATIONS = ["Madre", "Padre", "Abuelo/a", "Tío/a", "Hermano/a", "Tutor legal", "Otro"];
const STAFF_ROLES = [
  { value: "RECTOR", label: "Rector" },
  { value: "COORDINATOR_ACADEMIC", label: "Coord. Académico" },
  { value: "COORDINATOR_CONVIVENCIA", label: "Coord. Convivencia" },
  { value: "SECRETARY", label: "Secretaría" },
  { value: "ACCOUNTANT", label: "Contabilidad" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
];
const STATUSES = [
  { value: "ACTIVE", label: "Activo" },
  { value: "INACTIVE", label: "Inactivo" },
  { value: "SUSPENDED", label: "Suspendido" },
];

export type EditInitial = {
  firstName: string; lastName: string; email: string; phone?: string | null; avatarUrl?: string | null;
  profile?: Record<string, unknown> | null;
  // student (columnas)
  documentId?: string; enrollmentCode?: string; birthDate?: string; address?: string; gradeGroupId?: string | null;
  // role-específicos
  speciality?: string | null; relation?: string; role?: string; status?: string;
};

const initialsOf = (f: string, l: string) => `${f?.[0] ?? ""}${l?.[0] ?? ""}`.toUpperCase();
const dateOnly = (v?: string | null) => (v ? String(v).slice(0, 10) : "");

export function EditPersonModal({
  open, onClose, kind, userId, studentId, initial, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  kind: PersonKind;
  userId: string;
  studentId?: string;
  initial: EditInitial;
  onSaved: () => void;
}) {
  const prof = (initial.profile ?? {}) as Record<string, string | undefined>;
  const isStudent = kind === "student";

  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial.avatarUrl ?? null);

  // documento / nacimiento / dirección — para estudiante son columnas; para el resto van en profile
  const [documentId, setDocumentId] = useState(isStudent ? (initial.documentId ?? "") : (prof.documentId ?? ""));
  const [birthDate, setBirthDate] = useState(dateOnly(isStudent ? initial.birthDate : prof.birthDate));
  const [address, setAddress] = useState(isStudent ? (initial.address ?? "") : (prof.address ?? ""));

  // resto del perfil (común)
  const [p, setP] = useState<Record<string, string>>(() => ({ ...(initial.profile as Record<string, string>) }));
  const set = (k: string) => (v: string) => setP((s) => ({ ...s, [k]: v }));

  // específicos por rol
  const [enrollmentCode, setEnrollmentCode] = useState(initial.enrollmentCode ?? "");
  const [gradeGroupId, setGradeGroupId] = useState(initial.gradeGroupId ?? "");
  const [speciality, setSpeciality] = useState(initial.speciality ?? "");
  const [relation, setRelation] = useState(initial.relation ?? "");
  const [role, setRole] = useState(initial.role ?? "");
  const [status, setStatus] = useState(initial.status ?? "ACTIVE");

  const [groups, setGroups] = useState<Group[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !isStudent) return;
    (async () => { try { const y = await getCurrentYear(); if (y) setGroups(await getGroups(y.id)); } catch { /* */ } })();
  }, [open, isStudent]);

  // re-sincroniza los campos cada vez que se abre (datos frescos tras guardar)
  useEffect(() => {
    if (!open) return;
    const pr = (initial.profile ?? {}) as Record<string, string | undefined>;
    setFirstName(initial.firstName); setLastName(initial.lastName); setEmail(initial.email);
    setPhone(initial.phone ?? ""); setAvatarUrl(initial.avatarUrl ?? null);
    setDocumentId(isStudent ? (initial.documentId ?? "") : (pr.documentId ?? ""));
    setBirthDate(dateOnly(isStudent ? initial.birthDate : pr.birthDate));
    setAddress(isStudent ? (initial.address ?? "") : (pr.address ?? ""));
    setP({ ...(initial.profile as Record<string, string>) });
    setEnrollmentCode(initial.enrollmentCode ?? ""); setGradeGroupId(initial.gradeGroupId ?? "");
    setSpeciality(initial.speciality ?? ""); setRelation(initial.relation ?? "");
    setRole(initial.role ?? ""); setStatus(initial.status ?? "ACTIVE");
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const save = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) { setError("Nombre, apellido y correo son obligatorios."); return; }
    setSaving(true); setError(null);
    try {
      // perfil = base + comunes editados; para no-estudiante también doc/nac/dirección
      const profile: Record<string, unknown> = { ...prof, ...p };
      if (!isStudent) { profile.documentId = documentId; profile.birthDate = birthDate; profile.address = address; }
      // limpia vacíos
      for (const k of Object.keys(profile)) if (profile[k] === "" || profile[k] == null) delete profile[k];

      const userBody: Record<string, unknown> = {
        firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(),
        phone: phone.trim() || null, avatarUrl: avatarUrl || null, profile,
      };
      if (kind === "teacher") userBody.speciality = speciality.trim();
      if (kind === "guardian" && relation) userBody.relation = relation;
      if (kind === "staff") { userBody.role = role; userBody.status = status; }
      await apiPut(`/users/${userId}`, userBody);

      if (isStudent && studentId) {
        await apiPut(`/students/${studentId}`, {
          ...(enrollmentCode.trim() ? { enrollmentCode: enrollmentCode.trim() } : {}),
          ...(documentId.trim() ? { documentId: documentId.trim() } : {}),
          ...(birthDate ? { birthDate } : {}),
          address: address.trim() || undefined,
          gradeGroupId: gradeGroupId || undefined,
        });
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Editar ficha" subtitle={`${initial.firstName} ${initial.lastName}`} width={560}>
      <AvatarUpload value={avatarUrl} onChange={setAvatarUrl} initials={initialsOf(firstName, lastName)} />

      <SectionTitle>IDENTIDAD</SectionTitle>
      <div className="flex gap-3">
        <TextField label="Nombres" value={firstName} onChange={setFirstName} />
        <TextField label="Apellidos" value={lastName} onChange={setLastName} />
      </div>
      <div className="flex gap-3">
        <SelectField label="Tipo de documento" value={p.documentType ?? ""} onChange={set("documentType")} options={DOCUMENT_TYPES} />
        <TextField label="Número de documento" value={documentId} onChange={setDocumentId} />
      </div>
      <div className="flex gap-3">
        <SelectField label="Sexo" value={p.gender ?? ""} onChange={set("gender")} options={GENDERS} />
        <TextField label="Fecha de nacimiento" type="date" value={birthDate} onChange={setBirthDate} />
      </div>
      <div className="flex gap-3">
        <TextField label="Nacionalidad" value={p.nationality ?? ""} onChange={set("nationality")} />
        <SelectField label="Grupo sanguíneo (RH)" value={p.bloodType ?? ""} onChange={set("bloodType")} options={BLOOD_TYPES} />
      </div>

      <SectionTitle>CONTACTO</SectionTitle>
      <TextField label="Correo" type="email" value={email} onChange={setEmail} />
      <div className="flex gap-3">
        <TextField label="Celular" value={phone} onChange={setPhone} />
        <TextField label="Teléfono fijo" value={p.landline ?? ""} onChange={set("landline")} />
      </div>
      <TextField label="Dirección" value={address} onChange={setAddress} />
      <div className="flex gap-3">
        <TextField label="Barrio" value={p.neighborhood ?? ""} onChange={set("neighborhood")} />
        <TextField label="Ciudad" value={p.city ?? ""} onChange={set("city")} />
        <TextField label="Departamento" value={p.department ?? ""} onChange={set("department")} />
      </div>

      {kind === "student" && (
        <>
          <SectionTitle>MATRÍCULA</SectionTitle>
          <div className="flex gap-3">
            <TextField label="Código de matrícula" value={enrollmentCode} onChange={setEnrollmentCode} />
            <FormField label="Grupo">
              <select className={inputCls} value={gradeGroupId ?? ""} onChange={(e) => setGradeGroupId(e.target.value)}>
                <option value="">Sin asignar</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </FormField>
          </div>
        </>
      )}
      {kind === "teacher" && (
        <>
          <SectionTitle>PROFESIONAL</SectionTitle>
          <div className="flex gap-3">
            <TextField label="Especialidad / área" value={speciality} onChange={setSpeciality} />
            <SelectField label="Nivel educativo" value={p.educationLevel ?? ""} onChange={set("educationLevel")} options={EDUCATION_LEVELS} />
          </div>
          <SelectField label="Tipo de vinculación" value={p.contractType ?? ""} onChange={set("contractType")} options={CONTRACT_TYPES} />
        </>
      )}
      {kind === "guardian" && (
        <>
          <SectionTitle>RELACIÓN</SectionTitle>
          <div className="flex gap-3">
            <SelectField label="Parentesco" value={relation} onChange={setRelation} options={RELATIONS} />
            <TextField label="Ocupación" value={p.occupation ?? ""} onChange={set("occupation")} />
          </div>
        </>
      )}
      {kind === "staff" && (
        <>
          <SectionTitle>CARGO</SectionTitle>
          <div className="flex gap-3">
            <SelectField label="Cargo" value={role} onChange={setRole} options={STAFF_ROLES} />
            <SelectField label="Estado" value={status} onChange={setStatus} options={STATUSES} />
          </div>
        </>
      )}

      {error && <div className="flex items-center gap-2 rounded-lg bg-s-error px-3 py-2 text-[13px] text-s-error-fg"><TriangleAlert className="h-4 w-4" /> {error}</div>}
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onClose} className="flex h-9 items-center rounded-lg border border-line px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">Cancelar</button>
        <button onClick={save} disabled={saving} className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Guardar cambios
        </button>
      </div>
    </Modal>
  );
}
