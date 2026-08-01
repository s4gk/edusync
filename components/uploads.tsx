"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, FileText, ImageIcon, X, Loader2, Camera, TriangleAlert } from "lucide-react";
import { apiUpload } from "@/lib/api";

/** Referencia a un archivo ya subido vía POST /uploads. */
export type UploadedFile = { url: string; name: string; mimeType?: string; size?: number };

async function uploadOne(file: File): Promise<UploadedFile> {
  const fd = new FormData();
  fd.append("file", file);
  return apiUpload<UploadedFile>("/uploads", fd);
}

const prettySize = (n?: number) => {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

const isImg = (mime?: string) => !!mime && mime.startsWith("image/");

/* ───────────────────────── Zona de documentos (multi-archivo) ───────────────────────── */

export function FileDrop({
  value,
  onChange,
  accept = "image/*,application/pdf",
  hint = "Imágenes o PDF · máx 10MB",
}: {
  value: UploadedFile[];
  onChange: (next: UploadedFile[]) => void;
  accept?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      setError(null);
      setBusy(true);
      try {
        const uploaded: UploadedFile[] = [];
        for (const f of Array.from(files)) uploaded.push(await uploadOne(f));
        onChange([...value, ...uploaded]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo subir el archivo.");
      } finally {
        setBusy(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [value, onChange],
  );

  return (
    <div className="flex flex-col gap-2.5">
      <div
        onClick={() => !busy && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-4 py-6 text-center transition-colors ${
          drag ? "border-primary bg-primary/5" : "border-line hover:bg-surface"
        }`}
      >
        {busy ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          <Upload className="h-5 w-5 text-subtle" />
        )}
        <span className="text-[13px] font-semibold text-ink">
          {busy ? "Subiendo…" : "Arrastra archivos o haz clic"}
        </span>
        <span className="text-[11px] text-subtle">{hint}</span>
        <input ref={inputRef} type="file" accept={accept} multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-s-error px-3 py-2 text-[12px] text-s-error-fg">
          <TriangleAlert className="h-3.5 w-3.5" /> {error}
        </div>
      )}

      {value.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {value.map((f, i) => (
            <div key={f.url} className="flex items-center gap-2.5 rounded-lg border border-line bg-card px-3 py-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface text-subtle">
                {isImg(f.mimeType) ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[13px] font-medium text-ink">{f.name}</span>
                {f.size ? <span className="text-[11px] text-subtle">{prettySize(f.size)}</span> : null}
              </div>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-subtle transition-colors hover:bg-surface hover:text-danger"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Foto de perfil (una imagen, preview circular) ───────────────────────── */

export function AvatarUpload({
  value,
  onChange,
  initials = "",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  initials?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = async (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    setError(null);
    setBusy(true);
    try {
      const up = await uploadOne(f);
      onChange(up.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir la foto.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-line bg-s-info text-lg font-bold text-s-info-fg">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Foto" className="h-full w-full object-cover" />
          ) : (
            initials || <Camera className="h-6 w-6 text-subtle" />
          )}
        </div>
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-[12px] font-semibold text-ink transition-colors hover:bg-surface"
          >
            <Camera className="h-3.5 w-3.5" /> {value ? "Cambiar" : "Subir foto"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="flex h-8 items-center rounded-lg px-2.5 text-[12px] font-medium text-subtle transition-colors hover:text-danger"
            >
              Quitar
            </button>
          )}
        </div>
        {error ? (
          <span className="text-[11px] text-s-error-fg">{error}</span>
        ) : (
          <span className="text-[11px] text-subtle">JPG, PNG o WEBP · máx 10MB</span>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handle(e.target.files)} />
      </div>
    </div>
  );
}
