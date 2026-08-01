"use client";

import { Check } from "lucide-react";

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex flex-1 items-center gap-1.5">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold transition-colors ${
                  done
                    ? "bg-primary text-white"
                    : active
                    ? "bg-primary/10 text-primary ring-2 ring-primary"
                    : "bg-surface text-subtle"
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={`hidden text-[12px] font-semibold sm:block ${active || done ? "text-ink" : "text-subtle"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span className={`h-px flex-1 ${done ? "bg-primary" : "bg-line"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
