import React from "react";
import { Badge, BadgeTom } from "@/components/ui";
import { StatusEtapa } from "@/types/etapa";

interface StatusBadgeProps {
  status: StatusEtapa;
  className?: string;
}

// Status da etapa -> cor de status (nunca cor de formato).
// Chaves geradas, em andamento e fase eliminatória são todos "em curso".
const CONFIG: Record<StatusEtapa, { label: string; tom: BadgeTom }> = {
  [StatusEtapa.INSCRICOES_ABERTAS]: { label: "Inscrições Abertas", tom: "sucesso" },
  [StatusEtapa.INSCRICOES_ENCERRADAS]: { label: "Inscrições Encerradas", tom: "aviso" },
  [StatusEtapa.CHAVES_GERADAS]: { label: "Chaves Geradas", tom: "info" },
  [StatusEtapa.EM_ANDAMENTO]: { label: "Em Andamento", tom: "info" },
  [StatusEtapa.FASE_ELIMINATORIA]: { label: "Fase Eliminatória", tom: "info" },
  [StatusEtapa.FINALIZADA]: { label: "Finalizada", tom: "neutro" },
  [StatusEtapa.CANCELADA]: { label: "Cancelada", tom: "erro" },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = "",
}) => {
  const config = CONFIG[status] ?? { label: status, tom: "neutro" as BadgeTom };

  return (
    <Badge tom={config.tom} className={className}>
      {config.label}
    </Badge>
  );
};

export default StatusBadge;
