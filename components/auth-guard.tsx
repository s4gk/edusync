"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth-context";
import { homeForRole, isFamilyRole } from "@/lib/home";

/**
 * Protege las rutas del grupo (app): mientras se valida la sesión muestra un
 * loader; si no hay usuario autenticado redirige a /login conservando el
 * destino para volver tras iniciar sesión. Reacciona también al logout, porque
 * al limpiarse el usuario el efecto vuelve a disparar la redirección.
 *
 * Además saca de aquí a acudientes y estudiantes: (app) es la consola del
 * colegio y a ellos les mostraría un menú de administración donde casi todo
 * responde 403. Su sitio es su propia vista.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const familia = isFamilyRole(user?.role);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const next = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${next}`);
      return;
    }
    if (familia) router.replace(homeForRole(user.role));
  }, [loading, user, familia, pathname, router]);

  if (loading || !user || familia) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Cargando" />
      </div>
    );
  }

  return <>{children}</>;
}
