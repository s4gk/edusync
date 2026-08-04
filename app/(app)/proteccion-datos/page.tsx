"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Loader2, ShieldCheck, ShieldAlert, ShieldX, TriangleAlert, ExternalLink,
  Download, Search, FileSignature, History, Undo2,
} from "lucide-react";
import { Modal } from "@/components/modal";
import { ConsentForm } from "@/components/consent-form";
import {
  consentCompleto, draftVacio, getCumplimiento, getHistorial, getPolitica,
  registrarConsentimiento, revocarConsentimiento,
  type ConsentDraft, type Cumplimiento, type FilaCumplimiento, type Historial, type Politica,
} from "@/lib/privacy";

/**
 * Tablero de habeas data (Ley 1581 de 2012).
 *
 * Poder guardar una autorización no es cumplir: el colegio necesita saber a
 * QUIÉN le falta. Por eso la pantalla arranca en el hueco (sin autorización) y
 * no en el total.
 */

const ROLES = [
  { key: "", label: "Todos los roles" },
  { key: "STUDENT", label: "Estudiantes" },
  { key: "GUARDIAN", label: "Acudientes" },
  { key: "TEACHER", label: "Docentes" },
  { key: "SUPER_ADMIN", label: "Super Admin" },
  { key: "RECTOR", label: "Rectoría" },
  { key: "COORDINATOR_ACADEMIC", label: "Coord. académica" },
  { key: "COORDINATOR_CONVIVENCIA", label: "Coord. convivencia" },
  { key: "SECRETARY", label: "Secretaría" },
  { key: "ACCOUNTANT", label: "Contabilidad" },
];
const roleLabel = (r: string) => ROLES.find((x) => x.key === r)?.label ?? r;

const ESTADOS = {
  VIGENTE: { label: "Vigente", cls: "bg-s-success text-s-success-fg", Icon: ShieldCheck },
  DESACTUALIZADA: { label: "Versión anterior", cls: "bg-s-warning text-s-warning-fg", Icon: ShieldAlert },
  SIN_AUTORIZACION: { label: "Sin autorización", cls: "bg-s-error text-s-error-fg", Icon: ShieldX },
} as const;

const fecha = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function ProteccionDatosPage() {
  const [data, setData] = useState<Cumplimiento | null>(null);
  const [pol, setPol] = useState<Politica | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [role, setRole] = useState("");
  const [estado, setEstado] = useState<"" | keyof typeof ESTADOS>("");
  const [q, setQ] = useState("");

  const [firmar, setFirmar] = useState<FilaCumplimiento | null>(null);
  const [verHistorial, setVerHistorial] = useState<FilaCumplimiento | null>(null);

  const cargar = async (r = role) => {
    setLoading(true);
    try {
      setData(await getCumplimiento(r || undefined));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el cumplimiento.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPolitica().then(setPol).catch(() => {});
  }, []);
  useEffect(() => {
    cargar(role);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const filas = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (data?.filas ?? []).filter(
      (f) =>
        (!estado || f.estado === estado) &&
        (!t || f.nombre.toLowerCase().includes(t) || f.email.toLowerCase().includes(t)),
    );
  }, [data, estado, q]);

  const exportar = () => {
    const cab = ["Nombre", "Correo", "Rol", "Estado", "Fecha", "Versión", "Firmó"];
    const filasCsv = filas.map((f) => [
      f.nombre, f.email, roleLabel(f.role), ESTADOS[f.estado].label,
      f.acceptedAt ? new Date(f.acceptedAt).toISOString().slice(0, 10) : "",
      f.policyVersion ?? "", f.signedByName ?? "",
    ]);
    // BOM: sin él Excel abre los acentos rotos.
    const csv = "﻿" + [cab, ...filasCsv].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `habeas_data_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-5 px-8 py-7">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold tracking-[0.12em] text-subtle">OPERACIÓN</span>
          <h1 className="text-[22px] font-bold -tracking-[0.02em] text-ink">Protección de datos</h1>
          <p className="text-[12px] text-subtle">
            Autorizaciones de tratamiento (Ley 1581 de 2012). Política vigente v{data?.versionVigente ?? pol?.version ?? "—"} ·{" "}
            <Link href="/privacidad" target="_blank" className="inline-flex items-center gap-0.5 font-semibold text-primary hover:underline">
              ver el texto <ExternalLink className="h-3 w-3" />
            </Link>
          </p>
        </div>
        <button onClick={exportar} disabled={!filas.length}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-line px-3.5 text-[13px] font-semibold text-ink hover:bg-surface disabled:opacity-40">
          <Download className="h-3.5 w-3.5" /> Exportar
        </button>
      </div>

      {pol && !pol.configuracion.completa && (
        <div className="flex items-start gap-2 rounded-xl bg-s-warning px-4 py-3 text-[12px] leading-relaxed text-s-warning-fg">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            La política no tiene los datos del responsable: falta <b>{pol.configuracion.faltantes.join(", ")}</b> en el
            entorno del backend. Sin NIT ni correo de contacto el titular no sabe a dónde dirigir una consulta o un
            reclamo, y el aviso no cumple. Configúralos antes de recoger autorizaciones reales.
          </span>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        <Kpi label="Titulares activos" value={data?.total ?? 0} />
        <Kpi label="Con autorización vigente" value={data?.vigentes ?? 0} tone="success" />
        <Kpi label="Versión anterior" value={data?.desactualizadas ?? 0} tone="warning" />
        <Kpi label="Sin autorización" value={data?.sinAutorizacion ?? 0} tone="error" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex h-9 flex-1 min-w-[220px] items-center gap-2 rounded-lg border border-line bg-card px-3">
          <Search className="h-3.5 w-3.5 text-subtle" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o correo…"
            className="flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted" />
        </div>
        <select value={role} onChange={(e) => setRole(e.target.value)}
          className="h-9 rounded-lg border border-line bg-card px-3 text-[13px] text-ink outline-none">
          {ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
        </select>
        <div className="flex items-center gap-1">
          {([["", "Todos"], ...Object.entries(ESTADOS).map(([k, v]) => [k, v.label])] as [string, string][]).map(([k, label]) => (
            <button key={k} onClick={() => setEstado(k as any)}
              className={`h-9 rounded-lg px-3 text-[12px] font-semibold transition-colors ${estado === k ? "bg-primary text-white" : "border border-line text-subtle hover:bg-surface"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-s-error px-3 py-2 text-[13px] text-s-error-fg">
          <TriangleAlert className="h-4 w-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-subtle">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando autorizaciones…
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-card">
          <div className="flex items-center gap-3 border-b border-line px-4 py-2.5 text-[11px] font-bold tracking-[0.08em] text-subtle">
            <span className="min-w-0 flex-1">TITULAR</span>
            <span className="w-[150px] shrink-0">ROL</span>
            <span className="w-[160px] shrink-0">ESTADO</span>
            <span className="w-[110px] shrink-0">FECHA</span>
            <span className="w-[170px] shrink-0">FIRMÓ</span>
            <span className="w-[150px]" />
          </div>
          {filas.length === 0 ? (
            <p className="px-4 py-14 text-center text-[13px] text-subtle">Nadie coincide con el filtro.</p>
          ) : (
            filas.map((f) => {
              const e = ESTADOS[f.estado];
              return (
                <div key={f.userId} className="flex items-center gap-3 border-b border-line px-4 py-2.5 text-[13px] last:border-b-0 hover:bg-surface/50">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-semibold text-ink">{f.nombre}</span>
                    <span className="truncate text-[11px] text-subtle">{f.email}</span>
                  </div>
                  <span className="w-[150px] shrink-0 text-[12px] text-subtle">{roleLabel(f.role)}</span>
                  <span className="w-[160px] shrink-0">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${e.cls}`}>
                      <e.Icon className="h-3 w-3" /> {e.label}
                    </span>
                  </span>
                  <span className="w-[110px] shrink-0 text-[12px] text-subtle">{fecha(f.acceptedAt)}</span>
                  <span className="w-[170px] shrink-0 truncate text-[12px] text-subtle">{f.signedByName ?? "—"}</span>
                  <span className="flex w-[150px] shrink-0 justify-end gap-1.5">
                    <button onClick={() => setFirmar(f)}
                      className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-2.5 text-[12px] font-semibold text-white hover:opacity-90">
                      <FileSignature className="h-3.5 w-3.5" /> {f.estado === "SIN_AUTORIZACION" ? "Registrar" : "Renovar"}
                    </button>
                    <button onClick={() => setVerHistorial(f)} title="Historial"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-subtle hover:bg-surface hover:text-ink">
                      <History className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}

      {firmar && (
        <FirmarModal fila={firmar} onClose={() => setFirmar(null)} onSaved={() => { setFirmar(null); cargar(); }} />
      )}
      {verHistorial && (
        <HistorialModal fila={verHistorial} onClose={() => setVerHistorial(null)} onChanged={() => cargar()} />
      )}
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number; tone?: "success" | "warning" | "error" }) {
  const color = tone === "success" ? "text-s-success-fg" : tone === "warning" ? "text-s-warning-fg" : tone === "error" ? "text-danger" : "text-ink";
  return (
    <div className="flex flex-col gap-0.5 rounded-2xl border border-line bg-card px-4 py-3.5">
      <span className={`text-[24px] font-bold -tracking-[0.02em] ${color}`}>{value}</span>
      <span className="text-[12px] text-subtle">{label}</span>
    </div>
  );
}

/**
 * Registrar una autorización a nombre de alguien que ya está en el sistema.
 * El canal por omisión es `papel`: en un colegio la mayoría de las firmas
 * llegan en el formato de matrícula, y anotarlas como si se hubieran firmado en
 * la web falsearía la evidencia.
 */
function FirmarModal({ fila, onClose, onSaved }: { fila: FilaCumplimiento; onClose: () => void; onSaved: () => void }) {
  const esTercero = fila.role === "STUDENT";
  const [draft, setDraft] = useState<ConsentDraft>(draftVacio());
  const [canal, setCanal] = useState("papel");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardar = async () => {
    setSaving(true);
    setError(null);
    try {
      await registrarConsentimiento(fila.userId, draft, canal);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo registrar la autorización.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Autorización de ${fila.nombre}`}
      subtitle={esTercero ? "Estudiante: firma su representante legal." : roleLabel(fila.role)} width={620}>
      <div className="flex flex-col gap-4">
        <ConsentForm value={draft} onChange={setDraft} titular={fila.nombre} isMinor={esTercero} firmaTercero={esTercero} />

        <div className="flex flex-col gap-1.5 rounded-xl border border-line p-3.5">
          <span className="text-[11px] font-bold tracking-[0.12em] text-subtle">CÓMO SE FIRMÓ</span>
          <div className="flex gap-1.5">
            {[
              { k: "papel", l: "En papel (formato físico)" },
              { k: "presencial", l: "Presencial en secretaría" },
              { k: "web-admin", l: "Registrada por administración" },
            ].map((o) => (
              <button key={o.k} onClick={() => setCanal(o.k)}
                className={`h-8 rounded-lg px-3 text-[12px] font-semibold transition-colors ${canal === o.k ? "bg-primary text-white" : "border border-line text-subtle hover:bg-surface"}`}>
                {o.l}
              </button>
            ))}
          </div>
          <p className="text-[11px] leading-relaxed text-subtle">
            Si la firma llegó en papel, conserva el soporte físico o escaneado: este registro prueba qué se autorizó y
            cuándo, el papel prueba la firma.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-s-error px-3 py-2 text-[13px] text-s-error-fg">
            <TriangleAlert className="h-4 w-4" /> {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="flex h-9 items-center rounded-lg border border-line px-4 text-[13px] font-semibold text-ink hover:bg-surface">Cancelar</button>
          <button onClick={guardar} disabled={saving || !consentCompleto(draft)}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-40">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Registrar autorización
          </button>
        </div>
      </div>
    </Modal>
  );
}

function HistorialModal({ fila, onClose, onChanged }: { fila: FilaCumplimiento; onClose: () => void; onChanged: () => void }) {
  const [h, setH] = useState<Historial | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = () => getHistorial(fila.userId).then(setH).catch((e) => setError(e instanceof Error ? e.message : "No se pudo cargar."));
  useEffect(() => { cargar(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [fila.userId]);

  const revocar = async (id: string) => {
    const reason = window.prompt("Motivo de la revocación (queda registrado):") ?? undefined;
    try {
      await revocarConsentimiento(id, reason);
      await cargar();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo revocar.");
    }
  };

  return (
    <Modal open onClose={onClose} title={`Historial de ${fila.nombre}`} subtitle="Las autorizaciones no se borran: se revocan." width={560}>
      <div className="flex flex-col gap-3">
        {error && <div className="rounded-lg bg-s-error px-3 py-2 text-[13px] text-s-error-fg">{error}</div>}
        {!h ? (
          <div className="flex items-center gap-2 py-8 text-[13px] text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>
        ) : h.historial.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-subtle">Este titular nunca ha otorgado una autorización.</p>
        ) : (
          h.historial.map((c) => (
            <div key={c.id} className={`flex flex-col gap-1.5 rounded-xl border p-3.5 ${c.revokedAt ? "border-line bg-surface/50" : "border-primary/40"}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-ink">
                  {fecha(c.acceptedAt)} · v{c.policyVersion}
                  {c.policyVersion !== h.versionVigente && <span className="ml-1.5 text-[11px] font-medium text-s-warning-fg">(versión anterior)</span>}
                </span>
                {c.revokedAt ? (
                  <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-subtle">Revocada {fecha(c.revokedAt)}</span>
                ) : (
                  <button onClick={() => revocar(c.id)} className="flex items-center gap-1 text-[12px] font-semibold text-danger hover:underline">
                    <Undo2 className="h-3.5 w-3.5" /> Revocar
                  </button>
                )}
              </div>
              <span className="text-[12px] text-subtle">
                Firmó <b className="text-ink">{c.signedByName}</b> ({c.signedByRole}
                {c.signedByDocument ? ` · ${c.signedByDocument}` : ""}) · canal {c.channel}
                {c.isMinor ? " · titular menor de edad" : ""}
              </span>
              <span className="text-[12px] text-subtle">
                Finalidades: {c.purposes.join(", ") || "—"}
                {c.sensitiveDataAccepted ? " · datos sensibles" : ""}
                {c.imageRightsAccepted ? " · uso de imagen" : ""}
              </span>
              {c.revokedReason && <span className="text-[12px] text-subtle">Motivo de revocación: {c.revokedReason}</span>}
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}
