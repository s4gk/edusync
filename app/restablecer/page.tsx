"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, CircleCheck, Eye, EyeOff, Loader2, Lock, TriangleAlert } from "lucide-react";
import { api } from "@/lib/api";

const MINIMO = 8;

function Formulario() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [verClave, setVerClave] = useState(false);
  const [listo, setListo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const largoOk = password.length >= MINIMO;
  const coinciden = password.length > 0 && password === confirmacion;
  const puedeEnviar = largoOk && coinciden && token.length > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await api("/auth/reset-password", { method: "POST", body: { token, password } });
      setListo(true);
      setTimeout(() => router.replace("/login"), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos cambiar la contraseña.");
    } finally {
      setEnviando(false);
    }
  }

  // Sin token no hay nada que hacer aquí: el usuario llegó a mano o con un
  // enlace cortado por el cliente de correo.
  if (!token) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-s-error">
          <TriangleAlert className="h-5 w-5 text-s-error-fg" />
        </div>
        <h1 className="text-[32px] font-extrabold leading-[1.1] -tracking-[0.03em]">
          Enlace incompleto
        </h1>
        <p className="text-sm leading-relaxed text-subtle">
          Este enlace no trae el código de verificación. Puede que se haya cortado al copiarlo.
          Solicita uno nuevo y ábrelo directamente desde el correo.
        </p>
        <Link
          href="/olvide"
          className="flex h-[52px] items-center justify-center gap-2 rounded-[10px] bg-primary text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Solicitar un enlace nuevo
          <ArrowRight className="h-[15px] w-[15px]" />
        </Link>
      </div>
    );
  }

  if (listo) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-s-success">
          <CircleCheck className="h-5 w-5 text-s-success-fg" />
        </div>
        <h1 className="text-[32px] font-extrabold leading-[1.1] -tracking-[0.03em]">
          Contraseña actualizada
        </h1>
        <p className="text-sm leading-relaxed text-subtle">
          Ya puedes entrar con tu contraseña nueva. Te llevamos al inicio de sesión…
        </p>
        <Link
          href="/login"
          className="flex h-[52px] items-center justify-center gap-2 rounded-[10px] bg-primary text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Ir a iniciar sesión
          <ArrowRight className="h-[15px] w-[15px]" />
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2.5">
        <h1 className="text-[32px] font-extrabold leading-[1.1] -tracking-[0.03em]">
          Elige tu nueva contraseña
        </h1>
        <p className="text-sm text-subtle">
          Al guardarla se cerrarán las sesiones abiertas en otros dispositivos.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-xs font-semibold text-ink">
            Nueva contraseña
          </label>
          <div className="flex h-12 items-center gap-2.5 rounded-[10px] border border-line px-4 transition-colors focus-within:border-primary">
            <Lock className="h-[15px] w-[15px] shrink-0 text-subtle" />
            <input
              id="password"
              type={verClave ? "text" : "password"}
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={`Mínimo ${MINIMO} caracteres`}
              className="w-full bg-transparent text-sm font-medium text-ink outline-none placeholder:text-line"
            />
            <button
              type="button"
              onClick={() => setVerClave((v) => !v)}
              className="shrink-0 text-subtle transition-colors hover:text-ink"
              aria-label={verClave ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {verClave ? <EyeOff className="h-[15px] w-[15px]" /> : <Eye className="h-[15px] w-[15px]" />}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="confirmacion" className="text-xs font-semibold text-ink">
            Repite la contraseña
          </label>
          <div className="flex h-12 items-center gap-2.5 rounded-[10px] border border-line px-4 transition-colors focus-within:border-primary">
            <Lock className="h-[15px] w-[15px] shrink-0 text-subtle" />
            <input
              id="confirmacion"
              type={verClave ? "text" : "password"}
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              placeholder="La misma de arriba"
              className="w-full bg-transparent text-sm font-medium text-ink outline-none placeholder:text-line"
            />
            {coinciden && <Check className="h-[15px] w-[15px] shrink-0 text-success" />}
          </div>
        </div>

        <ul className="flex flex-col gap-1.5 text-[13px]">
          <Requisito ok={largoOk}>Al menos {MINIMO} caracteres</Requisito>
          <Requisito ok={coinciden}>Las dos contraseñas coinciden</Requisito>
        </ul>

        {error && (
          <div className="flex items-center gap-2 rounded-[10px] bg-s-error px-3.5 py-2.5 text-[13px] font-medium text-s-error-fg">
            <TriangleAlert className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={enviando || !puedeEnviar}
          className="flex h-[52px] items-center justify-center gap-2 rounded-[10px] bg-primary text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enviando ? (
            <>
              <Loader2 className="h-[15px] w-[15px] animate-spin" /> Guardando…
            </>
          ) : (
            <>
              Guardar contraseña
              <ArrowRight className="h-[15px] w-[15px]" />
            </>
          )}
        </button>
      </form>
    </>
  );
}

function Requisito({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-center gap-2 ${ok ? "text-success" : "text-subtle"}`}>
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
          ok ? "bg-success" : "border border-line"
        }`}
      >
        {ok && <Check className="h-2.5 w-2.5 text-white" />}
      </span>
      {children}
    </li>
  );
}

export default function RestablecerPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-card px-6 py-12">
      <div className="flex w-full max-w-md flex-col gap-6">
        {/* useSearchParams obliga a un límite de Suspense para que Next pueda
            prerenderizar la ruta en el build. */}
        <Suspense
          fallback={
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-subtle" />
            </div>
          }
        >
          <Formulario />
        </Suspense>
      </div>
    </main>
  );
}
