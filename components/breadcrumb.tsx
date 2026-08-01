"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { breadcrumbFor } from "@/lib/nav";

export function Breadcrumb() {
  const pathname = usePathname();
  const { group, label, sub } = breadcrumbFor(pathname);
  const isHome = label === "Inicio" && !sub;

  return (
    <nav className="flex items-center gap-1.5 text-sm">
      <Link href="/dashboard" className="text-subtle transition-colors hover:text-ink">
        Inicio
      </Link>
      {group && (
        <>
          <ChevronRight className="h-4 w-4 text-line" />
          <span className="text-subtle">{group}</span>
        </>
      )}
      {!isHome && (
        <>
          <ChevronRight className="h-4 w-4 text-line" />
          <span className="font-semibold text-ink">{sub ?? label}</span>
        </>
      )}
    </nav>
  );
}
