"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, Mail, MailCheck } from "lucide-react";
import { api } from "@/lib/api";

export default function OlvidePage() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await api("/auth/forgot-password", { method: "POST", body: { email } });
      // El backend responde lo mismo exista o no la cuenta, así que aquí
      // tampoco distinguimos: decir "ese correo no está registrado" convertiría
      // esta pantalla en un directorio de quién trabaja o estudia en el colegio.
      setEnviado(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos procesar la solicitud.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-card px-6 py-12">
      <div className="flex w-full max-w-md flex-col gap-6">
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-[13px] font-semibold text-subtle transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a iniciar sesión
        </Link>

        {enviado ? (
          <div className="flex flex-col gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-s-success">
              <MailCheck className="h-5 w-5 text-s-success-fg" />
            </div>
            <h1 className="text-[32px] font-extrabold leading-[1.1] -tracking-[0.03em]">
              Revisa tu correo
            </h1>
            <p className="text-sm leading-relaxed text-subtle">
              Si <span className="font-semibold text-ink">{email}</span> corresponde a una cuenta
              activa, te enviamos un enlace para elegir una contraseña nueva. Vence en 60 minutos y
              solo se puede usar una vez.
            </p>
            <p className="text-[13px] leading-relaxed text-subtle">
              ¿No te llegó? Revisa la carpeta de correo no deseado, o{" "}
              <button
                type="button"
                onClick={() => setEnviado(false)}
                className="font-semibold text-primary hover:underline"
              >
                inténtalo de nuevo
              </button>
              .
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2.5">
              <h1 className="text-[32px] font-extrabold leading-[1.1] -tracking-[0.03em]">
                ¿Olvidaste tu contraseña?
              </h1>
              <p className="text-sm text-subtle">
                Escribe tu correo institucional y te enviamos un enlace para crear una nueva.
              </p>
            </div>

            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-xs font-semibold text-ink">
                  Correo institucional
                </label>
                <div className="flex h-12 items-center gap-2.5 rounded-[10px] border border-line px-4 transition-colors focus-within:border-primary">
                  <Mail className="h-[15px] w-[15px] shrink-0 text-subtle" />
                  <input
                    id="email"
                    type="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@tucolegio.edu.co"
                    className="w-full bg-transparent text-sm font-medium text-ink outline-none placeholder:text-line"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-[10px] bg-s-error px-3.5 py-2.5 text-[13px] font-medium text-s-error-fg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={enviando || !emailValido}
                className="flex h-[52px] items-center justify-center gap-2 rounded-[10px] bg-primary text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {enviando ? (
                  <>
                    <Loader2 className="h-[15px] w-[15px] animate-spin" /> Enviando…
                  </>
                ) : (
                  <>
                    Enviar enlace
                    <ArrowRight className="h-[15px] w-[15px]" />
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
