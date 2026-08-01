"use client";

import { FileText, ImageIcon, IdCard } from "lucide-react";
import { PROFILE_LABELS, PROFILE_ORDER, docCategoryLabel } from "@/lib/profile-fields";

export type DocItem = { id: string; category: string; name: string; fileUrl: string; mimeType?: string | null; uploadedAt?: string };

/** Cuadrícula de los datos del perfil (User.profile) presentes, con etiquetas legibles. */
export function ProfileGrid({ profile, title = "Datos personales" }: { profile: Record<string, unknown> | null | undefined; title?: string }) {
  const entries = profile
    ? PROFILE_ORDER.filter((k) => profile[k] != null && String(profile[k]).trim() !== "")
        .map((k) => [k, String(profile[k])] as const)
    : [];

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
      <div className="border-b border-line bg-surface px-5 py-3 text-[13px] font-bold text-ink">{title}</div>
      {entries.length === 0 ? (
        <div className="py-8 text-center text-sm text-subtle">Sin datos adicionales registrados.</div>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-3.5 p-5 sm:grid-cols-2">
          {entries.map(([k, v]) => (
            <div key={k} className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-subtle">{PROFILE_LABELS[k] ?? k}</span>
              <span className="text-[13px] text-ink">{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const isImg = (mime?: string | null) => !!mime && mime.startsWith("image/");

/** Lista de documentos adjuntos con enlace para abrir. */
export function DocumentsList({ documents }: { documents: DocItem[] | null | undefined }) {
  const docs = documents ?? [];
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
      <div className="border-b border-line bg-surface px-5 py-3 text-[13px] font-bold text-ink">Documentos ({docs.length})</div>
      {docs.length === 0 ? (
        <div className="py-8 text-center text-sm text-subtle">Sin documentos adjuntos.</div>
      ) : (
        <div className="flex flex-col">
          {docs.map((d, i) => (
            <a key={d.id} href={d.fileUrl} target="_blank" rel="noopener noreferrer"
              className={`flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface/60 ${i < docs.length - 1 ? "border-b border-line" : ""}`}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface text-subtle">
                {isImg(d.mimeType) ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[13px] font-medium text-ink">{d.name}</span>
                <span className="text-[11px] text-subtle">{docCategoryLabel(d.category)}</span>
              </div>
              <IdCard className="h-3.5 w-3.5 shrink-0 text-muted" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/** Encabezado reutilizable: avatar + nombre + subtítulos. */
export function FichaHeader({
  avatarUrl, initials, name, badges, tone = "primary",
}: {
  avatarUrl?: string | null;
  initials: string;
  name: string;
  badges: React.ReactNode;
  tone?: "primary" | "info" | "warning";
}) {
  const toneCls = tone === "info" ? "bg-s-info text-s-info-fg" : tone === "warning" ? "bg-s-warning text-s-warning-fg" : "bg-primary text-white";
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-card p-5">
      <span className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-full text-lg font-bold ${toneCls}`}>
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : initials}
      </span>
      <div className="flex flex-1 flex-col gap-1">
        <h1 className="text-[22px] font-bold -tracking-[0.01em] text-ink">{name}</h1>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-subtle">{badges}</span>
      </div>
    </div>
  );
}
