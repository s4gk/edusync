"use client";

import { useCallback, useEffect, useState } from "react";
import { StickyNote, Plus, Square, CheckSquare, Trash2, Loader2 } from "lucide-react";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

type Reminder = { id: string; text: string; done: boolean };

export function RemindersCard() {
  const [items, setItems] = useState<Reminder[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try { setItems(await apiGet<Reminder[]>("/reminders")); } catch { /* */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!text.trim()) return;
    setAdding(true);
    try { await apiPost("/reminders", { text: text.trim() }); setText(""); await load(); }
    catch { /* */ } finally { setAdding(false); }
  };
  const toggle = async (id: string) => { try { await apiPut(`/reminders/${id}/toggle`); await load(); } catch { /* */ } };
  const remove = async (id: string) => { try { await apiDelete(`/reminders/${id}`); await load(); } catch { /* */ } };

  const pending = items.filter((r) => !r.done).length;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-5">
      <span className="flex items-center gap-2 text-sm font-bold text-ink">
        <StickyNote className="h-4 w-4 text-primary" /> Recordatorios
        {pending > 0 && <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">{pending}</span>}
      </span>
      <div className="flex items-center gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Ej. traer material para 6A…" maxLength={280}
          className="h-9 flex-1 rounded-lg border border-line bg-card px-3 text-[13px] text-ink outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted" />
        <button onClick={add} disabled={adding || !text.trim()} className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white transition-opacity hover:opacity-90 disabled:opacity-40">
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>
      {loading ? (
        <span className="py-3 text-center text-[12px] text-subtle">Cargando…</span>
      ) : items.length === 0 ? (
        <span className="py-3 text-center text-[12px] text-subtle">Sin recordatorios. Anota lo que no quieras olvidar.</span>
      ) : (
        <div className="flex flex-col gap-1.5">
          {items.map((r) => (
            <div key={r.id} className="group flex items-center gap-2.5 rounded-lg border border-line px-3 py-2">
              <button onClick={() => toggle(r.id)} className="shrink-0 text-subtle transition-colors hover:text-primary">
                {r.done ? <CheckSquare className="h-4 w-4 text-emerald-600" /> : <Square className="h-4 w-4" />}
              </button>
              <span className={`flex-1 text-[13px] ${r.done ? "text-muted line-through" : "text-ink"}`}>{r.text}</span>
              <button onClick={() => remove(r.id)} className="shrink-0 text-subtle opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
