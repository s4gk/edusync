"use client";

import { FormField, inputCls } from "@/components/modal";

type Opt = string | { value: string; label: string };

export function TextField({
  label, value, onChange, placeholder, type = "text", required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <FormField label={required ? `${label} *` : label}>
      <input className={inputCls} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </FormField>
  );
}

export function SelectField({
  label, value, onChange, options, placeholder = "Selecciona…", required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Opt[];
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <FormField label={required ? `${label} *` : label}>
      <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((o) => {
          const v = typeof o === "string" ? o : o.value;
          const l = typeof o === "string" ? o : o.label;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
    </FormField>
  );
}

/** Encabezado de una sub-sección dentro de un paso del asistente. */
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[11px] font-bold tracking-[0.12em] text-subtle">{children}</h3>;
}
