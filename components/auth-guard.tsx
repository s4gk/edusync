"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth-context";

/**
 * Protege las rutas del grupo (app): mientras se valida la sesión muestra un
 * loader; si no hay usuario autenticado redirige a /login conservando el
 * destino para volver tras iniciar sesión. Reacciona también al logout, porque
 * al limpiarse el usuario el efecto vuelve a disparar la redirección.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      const next = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${next}`);
    }
  }, [loading, user, pathname, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Cargando" />
      </div>
    );
  }

  return <>{children}</>;
}
