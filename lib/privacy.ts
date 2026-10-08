import { apiGet, apiPost } from "@/lib/api";

export type Finalidad = { key: string; label: string; descripcion: string };

export type Politica = {
  version: string;
  responsable: {
    nombre: string;
    nit: string;
    direccion: string;
    ciudad: string;
    telefono: string;
    correo: string;
  };
  finalidades: Finalidad[];
  finalidadesOpcionales: string[];
  derechos: string[];
  avisoMenores: string;
  avisoSensibles: string;
  conservacion: string;
  configuracion: { completa: boolean; faltantes: string[] };
};

export type Consentimiento = {
  id: string;
  subjectUserId: string;
  policyVersion: string;
  purposes: string[];
  sensitiveDataAccepted: boolean;
  imageRightsAccepted: boolean;
  isMinor: boolean;
  signedByName: string;
  signedByRole: string;
  signedByDocument: string | null;
  channel: string;
  ipAddress: string | null;
  acceptedAt: string;
  revokedAt: string | null;
  revokedReason: string | null;
};

export type Historial = {
  vigente: Consentimiento | null;
  desactualizado: boolean;
  historial: Consentimiento[];
  versionVigente: string;
};

export type FilaCumplimiento = {
  userId: string;
  nombre: string;
  email: string;
  role: string;
  estado: "VIGENTE" | "DESACTUALIZADA" | "SIN_AUTORIZACION";
  acceptedAt: string | null;
  policyVersion: string | null;
  signedByName: string | null;
};

export type Cumplimiento = {
  versionVigente: string;
  total: number;
  vigentes: number;
  desactualizadas: number;
  sinAutorizacion: number;
  filas: FilaCumplimiento[];
};

/** Lo que un asistente recoge para poder registrar la autorización. */
export type ConsentDraft = {
  purposes: string[];
  sensitiveDataAccepted: boolean;
  imageRightsAccepted: boolean;
  signedByName: string;
  signedByRole: string;
  signedByDocument: string;
};

export const getPolitica = () => apiGet<Politica>("/privacy/policy");
export const getHistorial = (userId: string) => apiGet<Historial>(`/privacy/consents/${userId}`);
export const getCumplimiento = (role?: string) =>
  apiGet<Cumplimiento>(`/privacy/compliance${role ? `?role=${role}` : ""}`);

export const registrarConsentimiento = (
  subjectUserId: string,
  draft: ConsentDraft,
  channel: string,
) =>
  apiPost<Consentimiento>("/privacy/consents", {
    subjectUserId,
    purposes: draft.purposes,
    sensitiveDataAccepted: draft.sensitiveDataAccepted,
    imageRightsAccepted: draft.imageRightsAccepted,
    signedByName: draft.signedByName.trim(),
    signedByRole: draft.signedByRole.trim(),
    ...(draft.signedByDocument.trim() ? { signedByDocument: draft.signedByDocument.trim() } : {}),
    channel,
  });

export const revocarConsentimiento = (id: string, reason?: string) =>
  apiPost<Consentimiento>(`/privacy/consents/${id}/revoke`, reason ? { reason } : {});

/** Una autorización sirve si tiene al menos una finalidad y consta quién la
 *  otorgó — sin firmante no hay prueba de nada. */
export const consentCompleto = (d: ConsentDraft) =>
  d.purposes.length > 0 && d.signedByName.trim().length > 1 && d.signedByRole.trim().length > 0;

export const draftVacio = (): ConsentDraft => ({
  purposes: [],
  sensitiveDataAccepted: false,
  imageRightsAccepted: false,
  signedByName: "",
  signedByRole: "",
  signedByDocument: "",
});
