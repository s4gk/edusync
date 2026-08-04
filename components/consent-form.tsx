"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Info, Loader2, ShieldCheck, TriangleAlert } from "lucide-react";
import { FormField, inputCls } from "@/components/modal";
import { getPolitica, type ConsentDraft, type Politica } from "@/lib/privacy";

/**
 * Autorización de tratamiento de datos (Ley 1581 de 2012). Se usa como un paso
 * dentro de los asistentes de registro.
 *
 * Ninguna casilla viene marcada. La ley pide consentimiento expreso e
 * inequívoco, y una casilla premarcada no prueba que alguien haya decidido
 * nada: prueba que nadie la desmarcó.
 */
export function ConsentForm({
  value,
  onChange,
  isMinor = false,
  titular,
  /** Quién está firmando: el propio titular o un tercero (acudiente). */
  firmaTercero = false,
}: {
  value: ConsentDraft;
  onChange: (d: ConsentDraft) => void;
  isMinor?: boolean;
  titular?: string;
  firmaTercero?: boolean;
}) {
  const [pol, setPol] = useState<Politica | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setPol(await getPolitica());
      } catch {
        /* la pantalla sigue usable: el texto completo está en /privacidad */
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const set = <K extends keyof ConsentDraft>(k: K, v: ConsentDraft[K]) =>
    onChange({ ...value, [k]: v });

  const esenciales = (pol?.finalidades ?? []).filter(
    (f) => !(pol?.finalidadesOpcionales ?? []).includes(f.key),
  );
  const opcionales = (pol?.finalidades ?? []).filter((f) =>
    (pol?.finalidadesOpcionales ?? []).includes(f.key),
  );

  const marcarEsenciales = (on: boolean) => {
    const claves = esenciales.map((f) => f.key);
    const resto = value.purposes.filter((p) => !claves.includes(p));
    onChange({ ...value, purposes: on ? [...resto, ...claves] : resto });
  };
  const esencialesMarcadas =
    esenciales.length > 0 && esenciales.every((f) => value.purposes.includes(f.key));

  const marcarSensibles = (on: boolean) => {
    const claves = opcionales.map((f) => f.key);
    const resto = value.purposes.filter((p) => !claves.includes(p));
    onChange({
      ...value,
      sensitiveDataAccepted: on,
      purposes: on ? [...resto, ...claves] : resto,
    });
  };

  if (cargando) {
    return (
      <div className="flex items-center gap-2 py-8 text-[13px] text-subtle">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando la política de tratamiento…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2.5 rounded-xl border border-line bg-surface/60 p-3.5">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-semibold text-ink">
            Autorización de tratamiento de datos personales
          </span>
          <p className="text-[12px] leading-relaxed text-subtle">
            {pol?.responsable.nombre ?? "El colegio"} trata los datos personales conforme a la Ley
            1581 de 2012 y el Decreto 1377 de 2013.{" "}
            <Link
              href="/privacidad"
              target="_blank"
              className="inline-flex items-center gap-0.5 font-semibold text-primary hover:underline"
            >
              Leer la política completa <ExternalLink className="h-3 w-3" />
            </Link>
          </p>
        </div>
      </div>

      {pol && !pol.configuracion.completa && (
        <div className="flex items-start gap-2 rounded-lg bg-s-warning px-3 py-2.5 text-[12px] leading-relaxed text-s-warning-fg">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            La política aún no tiene los datos del responsable ({pol.configuracion.faltantes.join(", ")}).
            Se puede firmar, pero el aviso queda incompleto: configúralos antes de usar esto con
            familias reales.
          </span>
        </div>
      )}

      {isMinor && pol && (
        <div className="flex items-start gap-2 rounded-lg bg-s-info px-3 py-2.5 text-[12px] leading-relaxed text-s-info-fg">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{pol.avisoMenores}</span>
        </div>
      )}

      {/* ── Finalidades propias del servicio educativo ── */}
      <div className="flex flex-col gap-2 rounded-xl border border-line p-3.5">
        <span className="text-[11px] font-bold tracking-[0.12em] text-subtle">
          FINALIDADES DEL TRATAMIENTO
        </span>
        <ul className="flex flex-col gap-1.5">
          {esenciales.map((f) => (
            <li key={f.key} className="flex flex-col">
              <span className="text-[12px] font-semibold text-ink">{f.label}</span>
              <span className="text-[11px] leading-relaxed text-subtle">{f.descripcion}</span>
            </li>
          ))}
        </ul>
        <Check
          checked={esencialesMarcadas}
          onChange={marcarEsenciales}
          label={`Autorizo el tratamiento de los datos${titular ? ` de ${titular}` : ""} para las finalidades listadas arriba.`}
          strong
        />
      </div>

      {/* ── Datos sensibles: opcional y con la advertencia obligatoria ── */}
      {opcionales.length > 0 && (
        <div className="flex flex-col gap-2 rounded-xl border border-line p-3.5">
          <span className="text-[11px] font-bold tracking-[0.12em] text-subtle">
            DATOS SENSIBLES · OPCIONAL
          </span>
          <p className="text-[11px] leading-relaxed text-subtle">{pol?.avisoSensibles}</p>
          <Check
            checked={value.sensitiveDataAccepted}
            onChange={marcarSensibles}
            label="Autorizo el tratamiento de los datos de salud, discapacidad, pertenencia étnica y condición de víctima."
          />
        </div>
      )}

      {/* ── Uso de imagen ── */}
      <div className="flex flex-col gap-2 rounded-xl border border-line p-3.5">
        <span className="text-[11px] font-bold tracking-[0.12em] text-subtle">
          USO DE IMAGEN · OPCIONAL
        </span>
        <p className="text-[11px] leading-relaxed text-subtle">
          Fotografías y videos de actividades escolares en carteleras, redes sociales y material
          institucional. Negarse no afecta la matrícula ni la participación en las actividades.
        </p>
        <Check
          checked={value.imageRightsAccepted}
          onChange={(v) => set("imageRightsAccepted", v)}
          label="Autorizo el uso de la imagen con fines institucionales."
        />
      </div>

      {/* ── Quién firma ── */}
      <div className="flex flex-col gap-3 rounded-xl border border-line p-3.5">
        <span className="text-[11px] font-bold tracking-[0.12em] text-subtle">QUIÉN AUTORIZA</span>
        <p className="text-[11px] leading-relaxed text-subtle">
          {firmaTercero
            ? "Nombre y documento del representante legal que otorga la autorización. Queda como prueba de quién firmó."
            : "Nombre y documento de quien otorga la autorización."}
        </p>
        <div className="flex gap-3">
          <FormField label="Nombre completo *">
            <input
              className={inputCls}
              value={value.signedByName}
              onChange={(e) => set("signedByName", e.target.value)}
              placeholder="Marta Lucía Rojas"
            />
          </FormField>
          <FormField label="Documento">
            <input
              className={inputCls}
              value={value.signedByDocument}
              onChange={(e) => set("signedByDocument", e.target.value)}
              placeholder="43111222"
            />
          </FormField>
        </div>
        <FormField label="En calidad de *">
          <select
            className={inputCls}
            value={value.signedByRole}
            onChange={(e) => set("signedByRole", e.target.value)}
          >
            <option value="">Selecciona…</option>
            {(firmaTercero
              ? ["Madre", "Padre", "Representante legal", "Acudiente autorizado"]
              : ["Titular de los datos", "Representante legal"]
            ).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </FormField>
      </div>
    </div>
  );
}

function Check({
  checked,
  onChange,
  label,
  strong,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  strong?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-lg bg-surface/60 px-3 py-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
      />
      <span
        className={`text-[12px] leading-relaxed ${strong ? "font-semibold text-ink" : "text-ink"}`}
      >
        {label}
      </span>
    </label>
  );
}
