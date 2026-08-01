"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Sparkles,
  Mail,
  Check,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Globe,
  ChevronDown,
  Loader2,
  TriangleAlert,
} from "lucide-react";
import { useAuth } from "@/components/auth-context";
import { ApiError } from "@/lib/api";

const FOOTER_LINKS = ["Términos", "Privacidad", "Estatus del sistema"];

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Destino tras autenticar: respeta el ?next= que dejó el guard, si es seguro;
  // si no, aterriza por rol (docente → su clase, resto → dashboard).
  function resolveDestination(role?: string) {
    if (typeof window !== "undefined") {
      const next = new URLSearchParams(window.location.search).get("next");
      // Solo rutas internas absolutas, para evitar redirecciones abiertas.
      if (next && next.startsWith("/") && !next.startsWith("//")) return next;
    }
    return role === "TEACHER" ? "/clase" : "/dashboard";
  }

  // Si ya hay sesión activa, no tiene sentido mostrar el login.
  useEffect(() => {
    if (!loading && user) router.replace(resolveDestination(user.role));
  }, [loading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await login(email.trim(), password);
      router.replace(resolveDestination(res.user.role));
    } catch (err) {
      const msg =
        err instanceof ApiError && err.status === 401
          ? "Correo o contraseña incorrectos."
          : err instanceof ApiError
            ? err.message
            : "No se pudo conectar con el servidor.";
      setError(msg);
      setSubmitting(false);
    }
  }

  return (
    <main className="flex h-screen w-full flex-col overflow-hidden lg:flex-row">
      {/* ---------- Panel visual (izquierda) ---------- */}
      <aside className="relative flex w-full flex-col justify-between gap-8 overflow-hidden p-10 text-white lg:w-[680px] lg:shrink-0 lg:p-12">
        {/* imagen de fondo (reemplazable por una foto en /public) */}
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/login-bg.svg')" }}
        />
        {/* overlay para legibilidad del texto */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-black/20" />

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

        {/* bottom: tagline */}
        <div className="relative max-w-md">
          <p className="text-2xl font-semibold leading-[1.3] -tracking-[0.01em]">
            La plataforma que conecta a toda tu comunidad educativa.
          </p>
        </div>
      </aside>

      {/* ---------- Panel formulario (derecha) ---------- */}
      <section className="flex w-full flex-1 flex-col justify-between gap-6 overflow-y-auto bg-card px-6 py-8 sm:px-12 lg:px-20 lg:py-12">
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
        <div className="mx-auto flex w-full max-w-md flex-col gap-6">
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
                  placeholder="Tu contraseña"
                  className="w-full bg-transparent text-base font-semibold tracking-wider text-ink outline-none placeholder:font-medium placeholder:tracking-normal placeholder:text-line"
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

            {/* error */}
            {error && (
              <div className="flex items-center gap-2 rounded-[10px] bg-s-error px-3.5 py-2.5 text-[13px] font-medium text-s-error-fg">
                <TriangleAlert className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* submit */}
            <button
              type="submit"
              disabled={submitting || !emailValid || password.length < 1}
              className="flex h-[52px] items-center justify-center gap-2 rounded-[10px] bg-primary text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-[15px] w-[15px] animate-spin" /> Ingresando…
                </>
              ) : (
                <>
                  Iniciar sesión
                  <ArrowRight className="h-[15px] w-[15px]" />
                </>
              )}
            </button>

            {/* acceso rápido de docente: entra directo a su clase actual */}
            <button
              type="button"
              onClick={() => router.push("/clase")}
              className="flex h-11 items-center justify-center gap-2 rounded-[10px] border border-line text-[13px] font-semibold text-ink transition-colors hover:bg-surface"
            >
              Entrar como docente
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
