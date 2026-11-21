import React from "react";
import { Badge, BadgeTom } from "@/components/ui";
import { StatusConfrontoEliminatorio } from "@/types/chave";

interface StatusBadgeProps {
  status: StatusConfrontoEliminatorio;
}

const CONFIG: Record<StatusConfrontoEliminatorio, { label: string; tom: BadgeTom }> = {
  [StatusConfrontoEliminatorio.BYE]: { label: "BYE", tom: "neutro" },
  [StatusConfrontoEliminatorio.AGENDADA]: { label: "Aguardando", tom: "aviso" },
  [StatusConfrontoEliminatorio.FINALIZADA]: { label: "Finalizada", tom: "sucesso" },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = CONFIG[status];
  return <Badge tom={config.tom}>{config.label}</Badge>;
};
