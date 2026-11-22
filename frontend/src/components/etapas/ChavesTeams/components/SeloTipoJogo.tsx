/**
 * Selo do tipo de jogo do confronto (FEM, MASC, MISTO, DECIDER)
 */

import React from "react";
import { Badge } from "@/components/ui";
import { TipoJogoTeams } from "@/types/teams";
import { getTipoJogoLabel } from "@/utils/teams";

export const SeloTipoJogo: React.FC<{ tipo?: TipoJogoTeams | null }> = ({
  tipo,
}) => {
  if (!tipo) return null;

  const label = getTipoJogoLabel(tipo);
  if (tipo === TipoJogoTeams.FEMININO || tipo === TipoJogoTeams.MASCULINO) {
    return <Badge genero={tipo}>{label}</Badge>;
  }
  return (
    <Badge tom={tipo === TipoJogoTeams.DECIDER ? "aviso" : "neutro"}>
      {label}
    </Badge>
  );
};
