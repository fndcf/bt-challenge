/**
 * Fase eliminatória do Rei da Praia
 */

import React from "react";
import { EliminatoriaTela } from "../FaseEliminatoria/components/EliminatoriaTela";
import { useFaseEliminatoriaReiDaPraia } from "./hooks/useFaseEliminatoriaReiDaPraia";
import { Badge } from "@/components/ui";
import { Grupo } from "@/types/chave";
import { FormatoEtapa } from "@/types/etapa";
import { TipoChaveamentoReiDaPraia } from "@/types/reiDaPraia";

interface FaseEliminatoriaReiDaPraiaProps {
  etapaId: string;
  arenaId: string;
  grupos: Grupo[];
  etapaTipoChaveamento?: TipoChaveamentoReiDaPraia;
  melhorDe3?: boolean;
  // Geração bloqueada por empate: o pai recarrega e o painel de empates abre o modal
  onEmpatePendente?: () => void;
  // Empate pendente já conhecido: bloqueia gerar/encerrar
  bloqueadoPorEmpate?: boolean;
}

export const FaseEliminatoriaReiDaPraia: React.FC<
  FaseEliminatoriaReiDaPraiaProps
> = ({
  etapaId,
  grupos,
  etapaTipoChaveamento,
  melhorDe3 = false,
  onEmpatePendente,
  bloqueadoPorEmpate = false,
}) => {
  const { tipoChaveamento, ...dados } = useFaseEliminatoriaReiDaPraia({
    etapaId,
    grupos,
    etapaTipoChaveamento,
    onEmpatePendente,
  });

  return (
    <EliminatoriaTela
      dados={dados}
      formato={FormatoEtapa.REI_DA_PRAIA}
      titulo="Fase Eliminatória - Rei da Praia"
      resumo="Duplas formadas pelos classificados individuais!"
      tituloFinalizada="Etapa Rei da Praia Finalizada!"
      detalhe={
        tipoChaveamento && (
          <>
            <span>Tipo de Chaveamento:</span>
            <Badge formato={FormatoEtapa.REI_DA_PRAIA}>{tipoChaveamento}</Badge>
          </>
        )
      }
      melhorDe3={melhorDe3}
      bloqueadoPorEmpate={bloqueadoPorEmpate}
    />
  );
};

export default FaseEliminatoriaReiDaPraia;
