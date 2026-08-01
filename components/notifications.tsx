"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useDismiss } from "@/components/use-dismiss";
import { apiGet, apiPatch } from "@/lib/api";

type Notif = { id: string; title: string; body: string; isRead: boolean; createdAt: string };
type NotifList = { data: Notif[]; meta: { total: number; unread: number } };

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  return `${d} d`;
}

export function Notifications() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));

  const refreshCount = useCallback(async () => {
    try {
      const r = await apiGet<{ count: number }>("/notifications/unread-count");
      setUnread(r.count);
    } catch {
      // silencioso: sin sesión o sin red
    }
  }, []);

  // conteo al montar + sondeo cada 60 s
  useEffect(() => {
    refreshCount();
    const id = setInterval(refreshCount, 60000);
    return () => clearInterval(id);
  }, [refreshCount]);

  // al abrir: carga la lista
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    apiGet<NotifList>("/notifications")
      .then((r) => { setItems(r.data); setUnread(r.meta.unread); })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [open]);

  const markAll = async () => {
    setItems((s) => s.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    try { await apiPatch("/notifications/read-all"); } catch { refreshCount(); }
  };

  const markOne = async (id: string) => {
    setItems((s) => s.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
    try { await apiPatch(`/notifications/${id}/read`); } catch { refreshCount(); }
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-label="Notificaciones"
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-surface text-ink transition-colors hover:bg-line-soft">
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute right-2 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border-[1.5px] border-card bg-danger px-0.5 text-[9px] font-bold text-white">{unread}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-40 flex w-[340px] flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-sm font-semibold text-ink">Notificaciones</span>
            {unread > 0 && <button onClick={markAll} className="text-[11px] font-semibold text-primary hover:underline">Marcar todas como leídas</button>}
          </div>
          <div className="flex max-h-[360px] flex-col overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-xs text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-xs text-subtle"><BellOff className="h-5 w-5 text-muted" /> Sin notificaciones</div>
            ) : items.map((n, i) => (
              <button key={n.id} onClick={() => !n.isRead && markOne(n.id)}
                className={`flex gap-3 px-4 py-3 text-left ${i < items.length - 1 ? "border-b border-line" : ""} ${!n.isRead ? "bg-surface/40" : ""}`}>
                <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${n.isRead ? "bg-surface text-subtle" : "bg-primary-tint text-primary"}`}>
                  <Bell className="h-4 w-4" />
                </span>
                <div className="flex flex-1 flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-ink">{n.title}</span>
                    <span className="shrink-0 text-[10px] text-subtle">{timeAgo(n.createdAt)}</span>
                  </div>
                  <span className="text-[11px] leading-relaxed text-subtle">{n.body}</span>
                </div>
                {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
