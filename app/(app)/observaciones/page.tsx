import { MessageSquareWarning } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export default function ObservacionesPage() {
  return (
    <ComingSoon
      eyebrow="ACADÉMICO"
      title="Observaciones"
      description="Aquí vivirá el registro de observaciones disciplinarias y de convivencia: seguimiento por estudiante, tipificación de faltas y notificación a acudientes."
      icon={MessageSquareWarning}
    />
  );
}
