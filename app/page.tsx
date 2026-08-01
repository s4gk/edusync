"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth-context";

// Aterrizaje por rol: el docente entra directo a su clase (llamar a lista);
// el resto al dashboard. Sin sesión, al login.
export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    router.replace(user.role === "TEACHER" ? "/clase" : "/dashboard");
  }, [loading, user, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-bg">
      <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Cargando" />
    </div>
  );
}
