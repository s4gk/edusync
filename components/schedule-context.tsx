"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { apiGet, apiPost, apiDelete, ApiError } from "@/lib/api";
import { slotToCourse, type ApiTeacher, type ApiSlot, type Course } from "@/lib/schedule";

type Ctx = {
  teachers: ApiTeacher[];
  loadingTeachers: boolean;
  currentTeacherId: string;
  setCurrentTeacherId: (id: string) => void;
  /** Carga (y cachea) los slots de un docente. */
  loadTeacher: (teacherId: string) => Promise<void>;
  /** Curso en una celda (requiere haber llamado loadTeacher antes). */
  courseFor: (teacherId: string, day: number, block: number) => Course | undefined;
  /** Asigna una materia a una celda. Devuelve mensaje de error si hay cruce. */
  assign: (teacherId: string, subjectId: string, day: number, block: number, room?: string) => Promise<string | null>;
  /** Quita un slot por id. */
  removeSlot: (teacherId: string, slotId: string) => Promise<void>;
  refreshTeachers: () => Promise<void>;
};

const ScheduleCtx = createContext<Ctx>({
  teachers: [], loadingTeachers: true, currentTeacherId: "", setCurrentTeacherId: () => {},
  loadTeacher: async () => {}, courseFor: () => undefined, assign: async () => null, removeSlot: async () => {}, refreshTeachers: async () => {},
});

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const [teachers, setTeachers] = useState<ApiTeacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [currentTeacherId, setCurrentTeacherId] = useState("");
  const [slotsByTeacher, setSlotsByTeacher] = useState<Record<string, ApiSlot[]>>({});
  const inflight = useRef<Set<string>>(new Set());

  const refreshTeachers = useCallback(async () => {
    try {
      const ts = await apiGet<ApiTeacher[]>("/schedule/teachers");
      setTeachers(ts);
      setCurrentTeacherId((prev) => prev || ts.find((t) => t.assignedHours > 0)?.id || ts[0]?.id || "");
    } catch {
      setTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  }, []);

  useEffect(() => { refreshTeachers(); }, [refreshTeachers]);

  const loadTeacher = useCallback(async (teacherId: string) => {
    if (!teacherId || inflight.current.has(teacherId)) return;
    inflight.current.add(teacherId);
    try {
      const slots = await apiGet<ApiSlot[]>(`/schedule?teacherId=${teacherId}`);
      setSlotsByTeacher((m) => ({ ...m, [teacherId]: slots }));
    } catch {
      setSlotsByTeacher((m) => ({ ...m, [teacherId]: [] }));
    } finally {
      inflight.current.delete(teacherId);
    }
  }, []);

  const courseFor = useCallback(
    (teacherId: string, day: number, block: number): Course | undefined => {
      const slot = (slotsByTeacher[teacherId] ?? []).find((s) => s.dayOfWeek === day && s.block === block);
      return slot ? slotToCourse(slot) : undefined;
    },
    [slotsByTeacher],
  );

  const reloadTeacher = useCallback(async (teacherId: string) => {
    try {
      const slots = await apiGet<ApiSlot[]>(`/schedule?teacherId=${teacherId}`);
      setSlotsByTeacher((m) => ({ ...m, [teacherId]: slots }));
    } catch { /* noop */ }
  }, []);

  const assign = useCallback(async (teacherId: string, subjectId: string, day: number, block: number, room?: string) => {
    try {
      await apiPost("/schedule", { subjectId, dayOfWeek: day, block, room });
      await Promise.all([reloadTeacher(teacherId), refreshTeachers()]);
      return null;
    } catch (e) {
      return e instanceof ApiError ? e.message : "No se pudo asignar";
    }
  }, [reloadTeacher, refreshTeachers]);

  const removeSlot = useCallback(async (teacherId: string, slotId: string) => {
    try {
      await apiDelete(`/schedule/${slotId}`);
      await Promise.all([reloadTeacher(teacherId), refreshTeachers()]);
    } catch { /* noop */ }
  }, [reloadTeacher, refreshTeachers]);

  return (
    <ScheduleCtx.Provider value={{ teachers, loadingTeachers, currentTeacherId, setCurrentTeacherId, loadTeacher, courseFor, assign, removeSlot, refreshTeachers }}>
      {children}
    </ScheduleCtx.Provider>
  );
}

export const useSchedule = () => useContext(ScheduleCtx);
