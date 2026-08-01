"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft, GraduationCap, type LucideIcon } from "lucide-react";
import { ALL_ROUTES, type Route } from "@/lib/nav";
import { apiGet } from "@/lib/api";

const Ctx = createContext<{ open: () => void }>({ open: () => {} });
export const useCommandMenu = () => useContext(Ctx);

type Item =
  | { kind: "route"; route: Route }
  | { kind: "person"; id: string; name: string; group: string };

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function CommandMenuProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [people, setPeople] = useState<Item[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
  }, []);

  const routeItems = useMemo<Item[]>(() => {
    const q = norm(query.trim());
    const list = !q ? ALL_ROUTES : ALL_ROUTES.filter((r) => norm(`${r.label} ${r.group} ${r.keywords ?? ""}`).includes(q));
    return list.map((route) => ({ kind: "route", route }));
  }, [query]);
  const results = useMemo<Item[]>(() => [...routeItems, ...people], [routeItems, people]);

  // Búsqueda de personas (estudiantes) con debounce → salta a su ficha.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setPeople([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await apiGet<{ data: { id: string; user: { firstName: string; lastName: string }; gradeGroup?: { name?: string } }[] }>(`/students?search=${encodeURIComponent(q)}&limit=6`);
        setPeople((r.data ?? []).map((s) => ({ kind: "person", id: s.id, name: `${s.user.firstName} ${s.user.lastName}`, group: s.gradeGroup?.name ?? "Estudiante" })));
      } catch { setPeople([]); }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  // Atajo global ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Enfoca el input al abrir
  useEffect(() => {
    if (open) {
      setActive(0);
      // espera al render del modal
      const t = setTimeout(() => inputRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
  }, [open]);

  const go = useCallback(
    (item: Item) => {
      close();
      router.push(item.kind === "route" ? item.route.href : `/estudiantes/${item.id}`);
    },
    [close, router]
  );

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[active];
      if (r) go(r);
    }
  };

  return (
    <Ctx.Provider value={{ open: () => setOpen(true) }}>
      {children}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[12vh] backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={onListKey}
          >
            {/* input */}
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="h-[18px] w-[18px] shrink-0 text-subtle" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                placeholder="Buscar pantalla, módulo o acción…"
                className="h-12 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
              />
              <kbd className="rounded-md border border-line bg-surface px-1.5 py-0.5 text-[11px] font-semibold text-subtle">
                Esc
              </kbd>
            </div>

            {/* resultados */}
            <div className="max-h-[320px] overflow-y-auto p-2">
              {results.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-subtle">
                  Sin resultados para “{query}”.
                </div>
              ) : (
                results.map((item, i) => {
                  const Icon: LucideIcon = item.kind === "route" ? item.route.icon : GraduationCap;
                  const label = item.kind === "route" ? item.route.label : item.name;
                  const group = item.kind === "route" ? item.route.group : `${item.group} · estudiante`;
                  const key = item.kind === "route" ? item.route.href : `p-${item.id}`;
                  return (
                    <button
                      key={key}
                      onClick={() => go(item)}
                      onMouseMove={() => setActive(i)}
                      className={`flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left transition-colors ${
                        i === active ? "bg-surface" : ""
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          i === active ? "bg-primary-tint text-primary" : "bg-surface text-subtle"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex flex-1 flex-col">
                        <span className="text-[13px] font-semibold text-ink">{label}</span>
                        <span className="text-[11px] text-subtle">{group}</span>
                      </span>
                      {i === active && <CornerDownLeft className="h-3.5 w-3.5 text-muted" />}
                    </button>
                  );
                })
              )}
            </div>

            {/* footer */}
            <div className="flex items-center gap-4 border-t border-line bg-surface px-4 py-2.5 text-[11px] text-subtle">
              <span className="flex items-center gap-1"><kbd className="rounded border border-line bg-card px-1">↑</kbd><kbd className="rounded border border-line bg-card px-1">↓</kbd> navegar</span>
              <span className="flex items-center gap-1"><kbd className="rounded border border-line bg-card px-1">↵</kbd> abrir</span>
              <span className="ml-auto">{results.length} resultados</span>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
