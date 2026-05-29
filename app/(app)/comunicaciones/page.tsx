import { Mail } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export default function ComunicacionesPage() {
  return (
    <ComingSoon
      eyebrow="OPERACIÓN"
      title="Comunicaciones"
      description="Centro de mensajería con acudientes y docentes: circulares, plantillas, envíos por Email + App + SMS y seguimiento de lectura."
      icon={Mail}
    />
  );
}
