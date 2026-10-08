import Link from "next/link";
import { Hammer, ArrowLeft, type LucideIcon } from "lucide-react";

export function ComingSoon({
  eyebrow,
  title,
  description,
  icon: Icon = Hammer,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col gap-6 px-8 py-7">
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-bold tracking-[0.18em] text-primary">{eyebrow}</span>
        <h1 className="text-[28px] font-bold -tracking-[0.02em] text-ink">{title}</h1>
      </div>

      <div className="flex min-h-[440px] flex-1 flex-col items-center justify-center gap-5 rounded-2xl border border-line bg-card p-8 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-tint text-primary">
          <Icon className="h-9 w-9" />
        </span>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold -tracking-[0.01em] text-ink">Próximamente</h2>
          <p className="max-w-md text-sm leading-relaxed text-subtle">{description}</p>
        </div>
        <span className="rounded-full bg-surface px-3 py-1.5 text-[11px] font-semibold text-subtle">
          En construcción · módulo del diseño
        </span>
        <Link
          href="/dashboard"
          className="flex h-10 items-center gap-2 rounded-[10px] border border-line px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-surface"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
