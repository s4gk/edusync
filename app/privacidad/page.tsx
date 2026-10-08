"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, ShieldCheck, TriangleAlert } from "lucide-react";
import { getPolitica, type Politica } from "@/lib/privacy";

/**
 * Aviso de privacidad / política de tratamiento de datos.
 *
 * Vive FUERA de `(app)`: tiene que poder leerla quien todavía no tiene cuenta
 * —una familia que está decidiendo si autoriza— y el Decreto 1377 exige que sea
 * de acceso permanente y libre.
 */
export default function PrivacidadPage() {
  const [pol, setPol] = useState<Politica | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPolitica()
      .then(setPol)
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudo cargar la política."));
  }, []);

  if (error) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="text-sm text-subtle">{error}</p>
      </main>
    );
  }

  if (!pol) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-subtle" />
      </main>
    );
  }

  const r = pol.responsable;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-14">
      <div className="flex flex-col gap-4">
        <Link
          href="/login"
          className="flex w-fit items-center gap-1.5 text-[13px] font-semibold text-subtle transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver
        </Link>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div className="flex flex-col">
            <h1 className="text-[28px] font-extrabold leading-tight -tracking-[0.03em] text-ink">
              Política de tratamiento de datos personales
            </h1>
            <p className="text-[13px] text-subtle">
              {r.nombre} · Versión {pol.version} · Ley 1581 de 2012 y Decreto 1377 de 2013
            </p>
          </div>
        </div>
      </div>

      {!pol.configuracion.completa && (
        <div className="flex items-start gap-2 rounded-xl bg-s-warning px-4 py-3 text-[13px] leading-relaxed text-s-warning-fg">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Este aviso está incompleto: falta configurar {pol.configuracion.faltantes.join(", ")}.
            Sin los datos del responsable, el titular no tiene a dónde dirigir una consulta o un
            reclamo.
          </span>
        </div>
      )}

      <Seccion titulo="1. Responsable del tratamiento">
        <dl className="flex flex-col gap-1.5 text-[13px]">
          <Dato k="Institución" v={r.nombre} />
          <Dato k="NIT" v={r.nit} />
          <Dato k="Dirección" v={[r.direccion, r.ciudad].filter(Boolean).join(", ")} />
          <Dato k="Teléfono" v={r.telefono} />
          <Dato k="Correo para consultas y reclamos" v={r.correo} />
        </dl>
      </Seccion>

      <Seccion titulo="2. Finalidades del tratamiento">
        <ul className="flex flex-col gap-3">
          {pol.finalidades.map((f) => (
            <li key={f.key} className="flex flex-col gap-0.5">
              <span className="text-[13px] font-semibold text-ink">
                {f.label}
                {pol.finalidadesOpcionales.includes(f.key) && (
                  <span className="ml-2 rounded-full bg-s-info px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-s-info-fg">
                    Opcional
                  </span>
                )}
              </span>
              <span className="text-[13px] leading-relaxed text-subtle">{f.descripcion}</span>
            </li>
          ))}
        </ul>
      </Seccion>

      <Seccion titulo="3. Datos sensibles">
        <p className="text-[13px] leading-relaxed text-subtle">{pol.avisoSensibles}</p>
      </Seccion>

      <Seccion titulo="4. Datos de niños, niñas y adolescentes">
        <p className="text-[13px] leading-relaxed text-subtle">{pol.avisoMenores}</p>
      </Seccion>

      <Seccion titulo="5. Derechos del titular">
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          {pol.derechos.map((d) => (
            <li key={d} className="text-[13px] leading-relaxed text-subtle">
              {d}
            </li>
          ))}
        </ul>
      </Seccion>

      <Seccion titulo="6. Cómo ejercer los derechos">
        <p className="text-[13px] leading-relaxed text-subtle">
          Las consultas y reclamos se presentan {r.correo ? "al correo " : "al correo de contacto "}
          {r.correo && <span className="font-semibold text-ink">{r.correo}</span>}, indicando el
          nombre del titular, el motivo y los datos de contacto. Las consultas se atienden en un
          máximo de diez (10) días hábiles y los reclamos en quince (15) días hábiles, prorrogables
          conforme a la ley.
        </p>
      </Seccion>

      <Seccion titulo="7. Conservación de los datos">
        <p className="text-[13px] leading-relaxed text-subtle">{pol.conservacion}</p>
      </Seccion>

      <p className="border-t border-line pt-6 text-[12px] text-subtle">
        Versión {pol.version}. Las autorizaciones otorgadas quedan registradas contra la versión de
        la política vigente en el momento de la firma.
      </p>
    </main>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-[15px] font-bold text-ink">{titulo}</h2>
      {children}
    </section>
  );
}

function Dato({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-56 shrink-0 text-subtle">{k}</dt>
      <dd className="font-medium text-ink">{v || <span className="text-muted">Sin configurar</span>}</dd>
    </div>
  );
}
