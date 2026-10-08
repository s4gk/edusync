"use client";

import { useState } from "react";
import { ChevronDown, Check, CalendarDays } from "lucide-react";
import { useDismiss } from "@/components/use-dismiss";

const YEARS = ["2025", "2024", "2023"];

export function YearSelect() {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState("2025");
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));

  return (
    <div className="relative hidden md:block" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 transition-colors hover:bg-surface"
      >
        <span className="text-xs font-medium text-ink">Año lectivo {year}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-subtle transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-40 flex w-48 flex-col overflow-hidden rounded-xl border border-line bg-card p-1.5 shadow-2xl">
          <span className="px-2.5 py-1.5 text-[10px] font-bold tracking-wide text-subtle">AÑO LECTIVO</span>
          {YEARS.map((y) => (
            <button
              key={y}
              onClick={() => {
                setYear(y);
                setOpen(false);
              }}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-ink transition-colors hover:bg-surface"
            >
              <CalendarDays className="h-4 w-4 text-subtle" />
              <span className="flex-1">{y}</span>
              {y === year && <Check className="h-3.5 w-3.5 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
