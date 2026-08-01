"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiGet, apiPost, setAccessToken, getAccessToken } from "@/lib/api";

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  status?: string;
  mustChangePassword?: boolean;
};

type LoginResult = { accessToken: string; user: AuthUser; mustChangePassword?: boolean };

type AuthCtx = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  login: async () => {
    throw new Error("AuthProvider ausente");
  },
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Al montar: si hay token guardado, valida la sesión con /auth/me.
  useEffect(() => {
    (async () => {
      if (getAccessToken()) {
        try {
          const me = await apiGet<AuthUser>("/auth/me");
          setUser(me);
        } catch {
          setAccessToken(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiPost<LoginResult>("/auth/login", { email, password });
    setAccessToken(res.accessToken);
    setUser(res.user);
    return res;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiPost("/auth/logout", {});
    } catch {
      // ignore
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
