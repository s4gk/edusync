"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail, Phone, Briefcase } from "lucide-react";
import { apiGet } from "@/lib/api";
import { ProfileGrid, DocumentsList, FichaHeader, type DocItem } from "@/components/profile-view";
import { PersonActions } from "@/components/person-actions";
import { EditPersonModal } from "@/components/edit-person-modal";

const ROLE_LABELS: Record<string, string> = {
  RECTOR: "Rector", COORDINATOR_ACADEMIC: "Coord. Académico", COORDINATOR_CONVIVENCIA: "Coord. Convivencia",
  SECRETARY: "Secretaría", ACCOUNTANT: "Contabilidad", SUPER_ADMIN: "Super Admin",
  TEACHER: "Docente", STUDENT: "Estudiante", GUARDIAN: "Acudiente",
};
const STATUS_LABELS: Record<string, string> = { ACTIVE: "Activo", INACTIVE: "Inactivo", SUSPENDED: "Suspendido", PENDING: "Pendiente" };

type User = {
  id: string; firstName: string; lastName: string; email: string; phone: string | null;
  role: string; status: string; avatarUrl: string | null;
  profile?: Record<string, unknown> | null; documents?: DocItem[];
};

const initialsOf = (f: string, l: string) => `${f?.[0] ?? ""}${l?.[0] ?? ""}`.toUpperCase();

export default function FichaPersonalPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const [u, setU] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(async () => {
    try { setU(await apiGet<User>(`/users/${id}`)); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudo cargar la cuenta."); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { if (id) load(); }, [id, load]);

  if (loading) return <div className="flex items-center justify-center gap-2 px-8 py-24 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Cargando ficha…</div>;
  if (error || !u) return <div className="flex items-center justify-center px-8 py-24 text-sm text-s-error-fg">{error ?? "No encontrado"}</div>;

  return (
    <div className="flex flex-col gap-5 px-8 py-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Link href="/personal" className="flex w-fit items-center gap-1.5 text-[13px] font-semibold text-subtle transition-colors hover:text-ink"><ArrowLeft className="h-4 w-4" /> Personal</Link>
        <PersonActions userId={u.id} status={u.status} onEdit={() => setEditOpen(true)} onChanged={load} />
      </div>

      <FichaHeader avatarUrl={u.avatarUrl} initials={initialsOf(u.firstName, u.lastName)} name={`${u.firstName} ${u.lastName}`}
        badges={<>
          <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {ROLE_LABELS[u.role] ?? u.role}</span>
          <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {u.email}</span>
          {u.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {u.phone}</span>}
          <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-subtle">{STATUS_LABELS[u.status] ?? u.status}</span>
        </>} />

      <div className="flex flex-col gap-5">
        <ProfileGrid profile={u.profile} />
        <DocumentsList documents={u.documents} />
      </div>

      <EditPersonModal open={editOpen} onClose={() => setEditOpen(false)} kind="staff" userId={u.id}
        initial={{ firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone, avatarUrl: u.avatarUrl, profile: u.profile, role: u.role, status: u.status }}
        onSaved={load} />
    </div>
  );
}
