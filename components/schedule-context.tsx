"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { type Assignments, seedAssignments, slotKey, courseById } from "@/lib/schedule";

const STORAGE_KEY = "edusync-horarios";

type Ctx = {
  assignments: Assignments;
  assign: (teacherId: string, day: number, block: number, courseId: string | null) => void;
  courseFor: (teacherId: string, day: number, block: number) => ReturnType<typeof courseById>;
  reset: () => void;
};

const ScheduleCtx = createContext<Ctx>({
  assignments: {},
  assign: () => {},
  courseFor: () => undefined,
  reset: () => {},
});

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const [assignments, setAssignments] = useState<Assignments>(() => seedAssignments());

  // Carga lo guardado al montar (evita mismatch de hidratación usando la semilla en el primer render).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setAssignments(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const persist = useCallback((next: Assignments) => {
    setAssignments(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const assign = useCallback(
    (teacherId: string, day: number, block: number, courseId: string | null) => {
      setAssignments((prev) => {
        const next = { ...prev };
        const k = slotKey(teacherId, day, block);
        if (courseId) next[k] = courseId;
        else delete next[k];
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    []
  );

  const courseFor = useCallback(
    (teacherId: string, day: number, block: number) => courseById(assignments[slotKey(teacherId, day, block)]),
    [assignments]
  );

  const reset = useCallback(() => persist(seedAssignments()), [persist]);

  return (
    <ScheduleCtx.Provider value={{ assignments, assign, courseFor, reset }}>{children}</ScheduleCtx.Provider>
  );
}

export const useSchedule = () => useContext(ScheduleCtx);
