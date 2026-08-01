"use client";

import { useState } from "react";
import { User, Bell, ShieldCheck, Palette, GraduationCap, Calendar, Users, Plug, Database, Code, KeyRound, Loader2, Check, TriangleAlert, type LucideIcon } from "lucide-react";
import { useAuth } from "@/components/auth-context";
import { apiPost } from "@/lib/api";
import { initials } from "@/lib/academic";

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super administrador", RECTOR: "Rector(a)", COORDINATOR_ACADEMIC: "Coordinación académica",
  ACCOUNTANT: "Contabilidad", SECRETARY: "Secretaría", TEACHER: "Docente", GUARDIAN: "Acudiente", STUDENT: "Estudiante",
};

const NAV: { group: string; items: { label: string; icon: LucideIcon; active?: boolean }[] }[] = [
  { group: "CUENTA", items: [{ label: "Perfil y cuenta", icon: User, active: true }, { label: "Notificaciones", icon: Bell }, { label: "Seguridad y privacidad", icon: ShieldCheck }, { label: "Apariencia e idioma", icon: Palette }] },
  { group: "COLEGIO", items: [{ label: "Configuración académica", icon: GraduationCap }, { label: "Año lectivo y periodos", icon: Calendar }, { label: "Roles y permisos", icon: Users }] },
  { group: "AVANZADO", items: [{ label: "Integraciones", icon: Plug }, { label: "Datos y exportaciones", icon: Database }, { label: "API y webhooks", icon: Code }] },
];

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <label className="text-xs font-semibold text-ink">{label}</label>
      <div className="flex h-[42px] items-center rounded-lg border border-line bg-card px-3.5 text-[13px] font-medium text-ink">{value}</div>
    </div>
  );
}

export default function ConfiguracionPage() {
  const { user } = useAuth();
  const [cur, setCur] = useState("");
  const [nw, setNw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async () => {
    setMsg(null);
    if (nw.length < 8) { setMsg({ ok: false, text: "La nueva contraseña debe tener al menos 8 caracteres." }); return; }
    if (nw !== confirm) { setMsg({ ok: false, text: "La confirmación no coincide." }); return; }
    setBusy(true);
    try {
      await apiPost("/auth/change-password", { currentPassword: cur, newPassword: nw });
      setMsg({ ok: true, text: "Contraseña actualizada correctamente." });
      setCur(""); setNw(""); setConfirm("");
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "No se pudo actualizar la contraseña." });
    } finally { setBusy(false); }
  };

  const name = user ? `${user.firstName} ${user.lastName}` : "—";
  const roleLabel = user ? (ROLE_LABEL[user.role] ?? user.role) : "—";

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <aside className="flex w-full flex-col gap-4 border-b border-line bg-card p-5 lg:w-[260px] lg:shrink-0 lg:border-b-0 lg:border-r">
        <h2 className="text-lg font-extrabold -tracking-[0.01em] text-ink">Configuración</h2>
        {NAV.map((section) => (
          <div key={section.group} className="flex flex-col gap-1">
            <span className="px-2 py-1 text-[10px] font-bold tracking-[0.18em] text-subtle">{section.group}</span>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.label} className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${item.active ? "bg-surface font-bold text-ink" : "font-medium text-ink hover:bg-surface/60"}`}>
                  <Icon className={`h-[15px] w-[15px] ${item.active ? "text-primary" : "text-subtle"}`} /> {item.label}
                </button>
              );
            })}
          </div>
        ))}
      </aside>

      <div className="flex flex-1 flex-col gap-6 px-6 py-8 lg:px-10">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold tracking-[0.18em] text-primary">CONFIGURACIÓN · CUENTA</span>
          <h1 className="text-[28px] font-bold -tracking-[0.02em] text-ink">Perfil y cuenta</h1>
          <p className="text-[13px] text-subtle">Tu información personal y credenciales</p>
        </div>

        {/* profile card */}
        <div className="flex flex-col gap-6 rounded-2xl border border-line bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-4xl font-extrabold text-white">{user ? initials(user.firstName, user.lastName) : "—"}</span>
            <div className="flex flex-col gap-2">
              <span className="text-[22px] font-bold -tracking-[0.01em] text-ink">{name}</span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-[11px] font-bold text-primary"><ShieldCheck className="h-3 w-3" /> {roleLabel}</span>
                <span className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-subtle">{user?.email ?? "—"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* información básica */}
        <div className="flex flex-col gap-[18px] rounded-2xl border border-line bg-card p-6">
          <h3 className="text-sm font-bold text-ink">Información básica</h3>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Field label="Nombres" value={user?.firstName ?? "—"} />
            <Field label="Apellidos" value={user?.lastName ?? "—"} />
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Field label="Correo" value={user?.email ?? "—"} />
            <Field label="Rol" value={roleLabel} />
          </div>
        </div>

        {/* cambio de contraseña — funcional */}
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-card p-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-surface text-primary"><KeyRound className="h-4 w-4" /></span>
            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-ink">Cambiar contraseña</h3>
              <span className="text-xs text-subtle">Mínimo 8 caracteres</span>
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-xs font-semibold text-ink">Contraseña actual</span>
              <input type="password" value={cur} onChange={(e) => setCur(e.target.value)} className="h-[42px] rounded-lg border border-line bg-card px-3.5 text-[13px] text-ink outline-none focus:ring-2 focus:ring-primary/40" />
            </label>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-xs font-semibold text-ink">Nueva contraseña</span>
              <input type="password" value={nw} onChange={(e) => setNw(e.target.value)} className="h-[42px] rounded-lg border border-line bg-card px-3.5 text-[13px] text-ink outline-none focus:ring-2 focus:ring-primary/40" />
            </label>
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-xs font-semibold text-ink">Confirmar nueva contraseña</span>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-[42px] rounded-lg border border-line bg-card px-3.5 text-[13px] text-ink outline-none focus:ring-2 focus:ring-primary/40" />
            </label>
          </div>
          {msg && (
            <div className={`flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-[13px] font-medium ${msg.ok ? "bg-s-success text-s-success-fg" : "bg-s-error text-s-error-fg"}`}>
              {msg.ok ? <Check className="h-4 w-4" /> : <TriangleAlert className="h-4 w-4" />} {msg.text}
            </div>
          )}
          <div>
            <button onClick={submit} disabled={busy || !cur || !nw} className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Actualizar contraseña
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
