/**
 * Fase eliminatória da Dupla Fixa
 */

import React from "react";
import { Grupo } from "@/types/chave";
import { FormatoEtapa } from "@/types/etapa";
import { EliminatoriaTela } from "./components/EliminatoriaTela";
import { useFaseEliminatoria } from "./hooks/useFaseEliminatoria";

interface FaseEliminatoriaProps {
  etapaId: string;
  arenaId: string;
  grupos: Grupo[];
  melhorDe3?: boolean;
  // Empate pendente nos grupos: bloqueia gerar/encerrar
  bloqueadoPorEmpate?: boolean;
}

export const FaseEliminatoria: React.FC<FaseEliminatoriaProps> = ({
  etapaId,
  grupos,
  melhorDe3 = false,
  bloqueadoPorEmpate = false,
}) => {
  const dados = useFaseEliminatoria({ etapaId, grupos });

  return (
    <EliminatoriaTela
      dados={dados}
      formato={FormatoEtapa.DUPLA_FIXA}
      titulo="Fase Eliminatória"
      resumo="Confrontos mata-mata até o campeão!"
      tituloFinalizada="Etapa Finalizada!"
      melhorDe3={melhorDe3}
      bloqueadoPorEmpate={bloqueadoPorEmpate}
    />
  );
};

export default FaseEliminatoria;
