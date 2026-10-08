"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FolderPlus, Upload, Folder, FileText, ImageIcon, Loader2, TriangleAlert, Home, ChevronRight,
  Trash2, Download, HardDrive,
} from "lucide-react";
import { apiGet, apiPost, apiDelete, apiUpload } from "@/lib/api";
import { Modal, FormField, inputCls } from "@/components/modal";

type DriveUser = { id: string; firstName: string; lastName: string };
type DFolder = { id: string; name: string; createdBy?: DriveUser; _count?: { children: number; files: number } };
type DFile = { id: string; name: string; fileUrl: string; mimeType?: string | null; size?: number | null; uploadedBy?: DriveUser; createdAt: string };
type DriveData = { folder: DFolder | null; breadcrumbs: { id: string; name: string }[]; folders: DFolder[]; files: DFile[] };

const prettySize = (n?: number | null) => {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};
const isImg = (m?: string | null) => !!m && m.startsWith("image/");

export default function DrivePage() {
  const [folderId, setFolderId] = useState<string | null>(null);
  const [data, setData] = useState<DriveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [folderModal, setFolderModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await apiGet<DriveData>(`/drive${folderId ? `?folderId=${folderId}` : ""}`);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el drive.");
      setData(null);
    } finally { setLoading(false); }
  }, [folderId]);

  useEffect(() => { load(); }, [load]);

  const createFolder = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    try {
      await apiPost("/drive/folders", { name: newName.trim(), ...(folderId ? { parentId: folderId } : {}) });
      setFolderModal(false); setNewName("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear la carpeta.");
    } finally { setBusy(false); }
  };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true); setError(null);
    try {
      for (const f of Array.from(files)) {
        const up = await apiUpload<{ url: string; name: string; mimeType?: string; size?: number }>("/uploads", (() => { const fd = new FormData(); fd.append("file", f); return fd; })());
        await apiPost("/drive/files", { name: up.name, fileUrl: up.url, mimeType: up.mimeType, size: up.size, ...(folderId ? { folderId } : {}) });
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir el archivo.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const delFolder = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la carpeta "${name}" y todo su contenido?`)) return;
    try { await apiDelete(`/drive/folders/${id}`); await load(); } catch (e) { setError(e instanceof Error ? e.message : "No se pudo eliminar."); }
  };
  const delFile = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar el archivo "${name}"?`)) return;
    try { await apiDelete(`/drive/files/${id}`); await load(); } catch (e) { setError(e instanceof Error ? e.message : "No se pudo eliminar."); }
  };

  return (
    <div className="flex flex-col gap-6 px-8 py-7">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold tracking-[0.18em] text-primary">RECURSOS</span>
          <h1 className="flex items-center gap-2 text-[28px] font-bold -tracking-[0.02em] text-ink"><HardDrive className="h-6 w-6 text-primary" /> Drive</h1>
          <p className="text-[13px] text-subtle">Espacio compartido del colegio · carpetas y archivos</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setNewName(""); setFolderModal(true); }} className="flex h-9 items-center gap-2 rounded-lg border border-line px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">
            <FolderPlus className="h-3.5 w-3.5" /> Nueva carpeta
          </button>
          <button onClick={() => inputRef.current?.click()} disabled={uploading} className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50">
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Subir archivo
          </button>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
        </div>
      </div>

      {/* breadcrumbs */}
      <div className="flex flex-wrap items-center gap-1 text-[13px]">
        <button onClick={() => setFolderId(null)} className={`flex items-center gap-1 rounded-md px-2 py-1 font-semibold transition-colors ${folderId === null ? "text-ink" : "text-subtle hover:bg-surface hover:text-ink"}`}>
          <Home className="h-3.5 w-3.5" /> Inicio
        </button>
        {data?.breadcrumbs.map((b, i) => {
          const last = i === data.breadcrumbs.length - 1;
          return (
            <span key={b.id} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 text-muted" />
              <button onClick={() => setFolderId(b.id)} className={`rounded-md px-2 py-1 font-semibold transition-colors ${last ? "text-ink" : "text-subtle hover:bg-surface hover:text-ink"}`}>{b.name}</button>
            </span>
          );
        })}
      </div>

      {error && <div className="flex items-center gap-2 rounded-lg bg-s-error px-3 py-2 text-[13px] text-s-error-fg"><TriangleAlert className="h-4 w-4" /> {error}</div>}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>
      ) : !data || (data.folders.length === 0 && data.files.length === 0) ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line py-20 text-center text-sm text-subtle">
          <Folder className="h-8 w-8 text-muted" />
          Esta carpeta está vacía. Crea una carpeta o sube un archivo.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* carpetas */}
          {data.folders.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <span className="text-[11px] font-bold tracking-[0.1em] text-subtle">CARPETAS</span>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {data.folders.map((f) => (
                  <div key={f.id} className="group relative flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-card p-3.5 transition-colors hover:border-primary/40" onClick={() => setFolderId(f.id)}>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Folder className="h-5 w-5" /></span>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[13px] font-semibold text-ink">{f.name}</span>
                      <span className="text-[11px] text-subtle">{f._count?.files ?? 0} archivos · {f._count?.children ?? 0} carpetas</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); delFolder(f.id, f.name); }} className="absolute right-2 top-2 hidden h-7 w-7 items-center justify-center rounded-md text-subtle transition-colors hover:bg-surface hover:text-danger group-hover:flex"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* archivos */}
          {data.files.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <span className="text-[11px] font-bold tracking-[0.1em] text-subtle">ARCHIVOS</span>
              <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
                {data.files.map((f, i) => (
                  <div key={f.id} className={`group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface/50 ${i < data.files.length - 1 ? "border-b border-line" : ""}`}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface text-subtle">
                      {isImg(f.mimeType) ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[13px] font-medium text-ink">{f.name}</span>
                      <span className="text-[11px] text-subtle">{prettySize(f.size)}{f.uploadedBy ? ` · ${f.uploadedBy.firstName} ${f.uploadedBy.lastName}` : ""}</span>
                    </div>
                    <a href={f.fileUrl} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-md text-subtle transition-colors hover:bg-surface hover:text-ink" title="Abrir / descargar"><Download className="h-4 w-4" /></a>
                    <button onClick={() => delFile(f.id, f.name)} className="hidden h-8 w-8 items-center justify-center rounded-md text-subtle transition-colors hover:bg-surface hover:text-danger group-hover:flex"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={folderModal} onClose={() => setFolderModal(false)} title="Nueva carpeta" subtitle={data?.folder ? `Dentro de ${data.folder.name}` : "En la raíz"}>
        <FormField label="Nombre de la carpeta">
          <input className={inputCls} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Talleres 2026" autoFocus onKeyDown={(e) => e.key === "Enter" && createFolder()} />
        </FormField>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={() => setFolderModal(false)} className="h-9 rounded-lg border border-line px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-surface">Cancelar</button>
          <button onClick={createFolder} disabled={busy || !newName.trim()} className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FolderPlus className="h-3.5 w-3.5" />} Crear
          </button>
        </div>
      </Modal>
    </div>
  );
}
