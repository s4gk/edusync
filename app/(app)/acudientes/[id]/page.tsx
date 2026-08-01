"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail, Phone, Heart, GraduationCap, Star } from "lucide-react";
import { apiGet } from "@/lib/api";
import { ProfileGrid, DocumentsList, FichaHeader, type DocItem } from "@/components/profile-view";
import { PersonActions } from "@/components/person-actions";
import { EditPersonModal } from "@/components/edit-person-modal";

type Guardian = {
  id: string;
  relation: string;
  user: { id: string; firstName: string; lastName: string; email: string; phone: string | null; avatarUrl: string | null; status: string; profile?: Record<string, unknown> | null; documents?: DocItem[] };
  students: { isPrimary: boolean; student: { id: string; enrollmentCode: string; user: { firstName: string; lastName: string }; gradeGroup: { name: string } | null } }[];
};

const initialsOf = (f: string, l: string) => `${f?.[0] ?? ""}${l?.[0] ?? ""}`.toUpperCase();

export default function FichaAcudientePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const [g, setG] = useState<Guardian | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(async () => {
    try { setG(await apiGet<Guardian>(`/guardians/${id}`)); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudo cargar el acudiente."); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { if (id) load(); }, [id, load]);

  if (loading) return <div className="flex items-center justify-center gap-2 px-8 py-24 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Cargando ficha…</div>;
  if (error || !g) return <div className="flex items-center justify-center px-8 py-24 text-sm text-s-error-fg">{error ?? "No encontrado"}</div>;

  return (
    <div className="flex flex-col gap-5 px-8 py-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Link href="/acudientes" className="flex w-fit items-center gap-1.5 text-[13px] font-semibold text-subtle transition-colors hover:text-ink"><ArrowLeft className="h-4 w-4" /> Acudientes</Link>
        <PersonActions userId={g.user.id} status={g.user.status} onEdit={() => setEditOpen(true)} onChanged={load} />
      </div>

      <FichaHeader tone="warning" avatarUrl={g.user.avatarUrl} initials={initialsOf(g.user.firstName, g.user.lastName)} name={`${g.user.firstName} ${g.user.lastName}`}
        badges={<>
          <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {g.relation}</span>
          <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {g.user.email}</span>
          {g.user.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {g.user.phone}</span>}
        </>} />

      <div className="flex flex-col gap-5 xl:flex-row">
        <div className="flex flex-1 flex-col gap-5">
          <ProfileGrid profile={g.user.profile} />
          <DocumentsList documents={g.user.documents} />
        </div>
        <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-line bg-card xl:w-[360px] xl:shrink-0">
          <div className="border-b border-line bg-surface px-5 py-3 text-[13px] font-bold text-ink">Estudiantes vinculados ({g.students.length})</div>
          {g.students.length === 0 ? (
            <div className="py-8 text-center text-sm text-subtle">Sin estudiantes vinculados.</div>
          ) : g.students.map((s, i) => (
            <Link key={s.student.id} href={`/estudiantes/${s.student.id}`}
              className={`flex items-center gap-2.5 px-5 py-3 transition-colors hover:bg-surface/60 ${i < g.students.length - 1 ? "border-b border-line" : ""}`}>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-s-info text-[11px] font-bold text-s-info-fg">{initialsOf(s.student.user.firstName, s.student.user.lastName)}</span>
              <div className="flex flex-1 flex-col">
                <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">{s.student.user.firstName} {s.student.user.lastName}{s.isPrimary && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}</span>
                <span className="flex items-center gap-1 text-[11px] text-subtle"><GraduationCap className="h-3 w-3" /> {s.student.gradeGroup?.name ?? "Sin grupo"} · {s.student.enrollmentCode}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <EditPersonModal open={editOpen} onClose={() => setEditOpen(false)} kind="guardian" userId={g.user.id}
        initial={{ firstName: g.user.firstName, lastName: g.user.lastName, email: g.user.email, phone: g.user.phone, avatarUrl: g.user.avatarUrl, profile: g.user.profile, relation: g.relation }}
        onSaved={load} />
    </div>
  );
}
