"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Sparkles,
  Chrome,
  Square,
  Mail,
  Check,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Globe,
  ChevronDown,
} from "lucide-react";

const VISUAL_GRADIENT =
  "linear-gradient(135deg, #1A0E5C 0%, #5749F4 55%, #7C5BFF 100%)";

const STATS = [
  { value: "4,8★", label: "Promedio acudientes" },
  { value: "127", label: "Colegios en Colombia" },
  { value: "68k", label: "Estudiantes activos" },
  { value: "99,98%", label: "Uptime SLA" },
];

const FOOTER_LINKS = ["Términos", "Privacidad", "Estatus del sistema"];

export default function LoginPage() {
  const [email, setEmail] = useState("maria.rojas@colegiosanmateo.edu.co");
  const [password, setPassword] = useState("contraseña");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Maqueta: aquí se conectaría con el backend de autenticación de Edusync.
    alert(`Iniciando sesión como:\n${email}`);
  }

  return (
    <main className="flex min-h-screen w-full flex-col lg:flex-row">
      {/* ---------- Panel visual (izquierda) ---------- */}
      <aside
        className="relative flex w-full flex-col justify-between gap-8 overflow-hidden p-10 text-white lg:w-[680px] lg:shrink-0 lg:p-12"
        style={{ background: VISUAL_GRADIENT }}
      >
        {/* brillo decorativo */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/5 blur-3xl" />

        {/* top: logo + sello */}
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white text-lg font-extrabold text-primary">
              E
            </div>
            <span className="text-sm font-extrabold tracking-[0.2em]">
              EDUSYNC
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-white/80">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="text-[11px] font-medium">
              Plataforma segura · Min. Educación Nacional
            </span>
          </div>
        </div>

        {/* middle: testimonial */}
        <div className="relative flex flex-col gap-6">
          <div className="flex flex-col gap-3.5">
            <span className="font-black leading-[0.6] text-white/30 text-[96px]">
              “
            </span>
            <p className="max-w-xl text-2xl font-semibold leading-[1.35] -tracking-[0.01em]">
              Edusync nos devolvió el tiempo que se nos iba en papelería para
              usarlo en lo que de verdad importa: nuestros estudiantes.
            </p>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-white/70 bg-white/10 text-sm font-bold">
              MR
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold">María Rojas</span>
              <span className="text-[11px] text-white/70">
                Rectora · Colegio San Mateo, Bogotá
              </span>
            </div>
          </div>
        </div>

        {/* bottom: stats */}
        <div className="relative grid grid-cols-2 gap-6 sm:flex sm:justify-between">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col gap-0.5">
              <span className="text-2xl font-extrabold -tracking-[0.02em]">
                {s.value}
              </span>
              <span className="text-[10px] font-medium tracking-wider text-white/70">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </aside>

      {/* ---------- Panel formulario (derecha) ---------- */}
      <section className="flex w-full flex-1 flex-col justify-between gap-8 bg-card px-6 py-10 sm:px-12 lg:px-20 lg:py-16">
        {/* top: ¿Eres nuevo? */}
        <div className="flex items-center justify-end gap-2">
          <span className="text-[13px] text-subtle">¿Eres nuevo aquí?</span>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface"
          >
            Solicitar acceso
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* middle: formulario */}
        <div className="mx-auto flex w-full max-w-md flex-col gap-8">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-[11px] font-bold tracking-[0.18em]">
                BIENVENIDA DE NUEVO
              </span>
            </div>
            <h1 className="text-[38px] font-extrabold leading-[1.05] -tracking-[0.03em]">
              Inicia sesión en
              <br />
              Edusync
            </h1>
            <p className="text-sm text-subtle">
              Usa el correo institucional que te asignó tu colegio.
            </p>
          </div>

          {/* social */}
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-[10px] border border-line py-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface"
            >
              <Chrome className="h-4 w-4" />
              Continuar con Google
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-[10px] border border-line py-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface"
            >
              <Square className="h-3.5 w-3.5" />
              Microsoft 365
            </button>
          </div>

          {/* divider */}
          <div className="flex items-center gap-3.5">
            <span className="h-px flex-1 bg-line" />
            <span className="text-[10px] font-bold tracking-[0.18em] text-subtle">
              O CON CORREO
            </span>
            <span className="h-px flex-1 bg-line" />
          </div>

          {/* form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* email */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-xs font-semibold text-ink"
              >
                Correo institucional
              </label>
              <div className="flex h-12 items-center gap-2.5 rounded-[10px] border border-line px-4 transition-colors focus-within:border-primary">
                <Mail className="h-[15px] w-[15px] shrink-0 text-subtle" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@tucolegio.edu.co"
                  className="w-full bg-transparent text-sm font-medium text-ink outline-none placeholder:text-line"
                />
                {emailValid && (
                  <Check className="h-[15px] w-[15px] shrink-0 text-success" />
                )}
              </div>
            </div>

            {/* password */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold text-ink"
                >
                  Contraseña
                </label>
                <button
                  type="button"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  ¿La olvidaste?
                </button>
              </div>
              <div className="flex h-12 items-center gap-2.5 rounded-[10px] border-[1.5px] border-primary px-4">
                <Lock className="h-[15px] w-[15px] shrink-0 text-primary" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-base font-semibold tracking-wider text-ink outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="shrink-0 text-subtle transition-colors hover:text-ink"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-[15px] w-[15px]" />
                  ) : (
                    <Eye className="h-[15px] w-[15px]" />
                  )}
                </button>
              </div>
            </div>

            {/* remember + 2FA */}
            <div className="flex items-center justify-between gap-2.5">
              <label className="flex cursor-pointer select-none items-center gap-2">
                <span
                  className={`flex h-[18px] w-[18px] items-center justify-center rounded-[5px] transition-colors ${
                    remember ? "bg-primary" : "border border-line"
                  }`}
                >
                  {remember && <Check className="h-3 w-3 text-white" />}
                </span>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="sr-only"
                />
                <span className="text-xs font-medium text-ink">
                  Mantener sesión iniciada por 7 días
                </span>
              </label>
              <div className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-2">
                <ShieldCheck className="h-[11px] w-[11px] text-success" />
                <span className="text-[10px] font-bold tracking-wide text-subtle">
                  2FA activo
                </span>
              </div>
            </div>

            {/* submit */}
            <button
              type="submit"
              className="flex h-[52px] items-center justify-center gap-2 rounded-[10px] bg-primary text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Iniciar sesión
              <ArrowRight className="h-[15px] w-[15px]" />
            </button>
          </form>
        </div>

        {/* footer */}
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex flex-wrap items-center gap-3.5">
            <span className="text-[11px] text-subtle">© 2025 Edusync</span>
            {FOOTER_LINKS.map((link) => (
              <button
                key={link}
                type="button"
                className="text-[11px] font-medium text-ink hover:underline"
              >
                {link}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 text-ink"
          >
            <Globe className="h-3 w-3 text-subtle" />
            <span className="text-[11px] font-medium">Español (Colombia)</span>
            <ChevronDown className="h-[11px] w-[11px] text-subtle" />
          </button>
        </div>
      </section>
    </main>
  );
}
