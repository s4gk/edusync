"use client";

import { createContext, useContext, useEffect, useState } from "react";

type SidebarCtx = { collapsed: boolean; toggle: () => void };

const Ctx = createContext<SidebarCtx>({ collapsed: false, toggle: () => {} });

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  // Restaura la preferencia guardada después de montar (evita mismatch de hidratación).
  useEffect(() => {
    try {
      if (localStorage.getItem("edusync-sidebar") === "collapsed") setCollapsed(true);
    } catch {
      // localStorage puede no estar disponible
    }
  }, []);

  const toggle = () =>
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem("edusync-sidebar", next ? "collapsed" : "expanded");
      } catch {
        // ignore
      }
      return next;
    });

  return <Ctx.Provider value={{ collapsed, toggle }}>{children}</Ctx.Provider>;
}

export const useSidebar = () => useContext(Ctx);
