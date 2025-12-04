import React from "react";
import { StatusConfrontoEliminatorio } from "@/types/chave";
import { StatusBadge as StyledStatusBadge } from "../styles";

interface StatusBadgeProps {
  status: StatusConfrontoEliminatorio;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const labels = {
    [StatusConfrontoEliminatorio.BYE]: "BYE",
    [StatusConfrontoEliminatorio.AGENDADA]: "Aguardando",
    [StatusConfrontoEliminatorio.FINALIZADA]: "Finalizada",
  };

  return (
    <StyledStatusBadge $status={status}>{labels[status]}</StyledStatusBadge>
  );
};
