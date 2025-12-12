/**
 * Responsabilidade única: Seletor de formato do torneio (Dupla Fixa, Rei da Praia, Super X ou TEAMS)
 */

import React from "react";
import { FormatoEtapa } from "@/types/etapa";
import * as S from "../CriarEtapa.styles";

export interface FormatoSelectorProps {
  formatoAtual: FormatoEtapa;
  onFormatoChange: (formato: FormatoEtapa) => void;
}

export const FormatoSelector: React.FC<FormatoSelectorProps> = ({
  formatoAtual,
  onFormatoChange,
}) => {
  return (
    <S.Card>
      <S.CardTitle>Formato do Torneio</S.CardTitle>

      <S.FormatoSelector>
        <S.FormatoOption
          $selected={formatoAtual === FormatoEtapa.DUPLA_FIXA}
          onClick={() => onFormatoChange(FormatoEtapa.DUPLA_FIXA)}
        >
          <S.FormatoTitle $selected={formatoAtual === FormatoEtapa.DUPLA_FIXA}>
            Dupla Fixa
          </S.FormatoTitle>
          <S.FormatoDescription>
            Jogadores formam duplas antes do torneio
          </S.FormatoDescription>
        </S.FormatoOption>

        <S.FormatoOption
          $selected={formatoAtual === FormatoEtapa.REI_DA_PRAIA}
          onClick={() => onFormatoChange(FormatoEtapa.REI_DA_PRAIA)}
        >
          <S.FormatoTitle
            $selected={formatoAtual === FormatoEtapa.REI_DA_PRAIA}
          >
            Rei da Praia
          </S.FormatoTitle>
          <S.FormatoDescription>
            4 jogadores por grupo, duplas rotativas
          </S.FormatoDescription>
        </S.FormatoOption>

        <S.FormatoOption
          $selected={formatoAtual === FormatoEtapa.SUPER_X}
          onClick={() => onFormatoChange(FormatoEtapa.SUPER_X)}
        >
          <S.FormatoTitle $selected={formatoAtual === FormatoEtapa.SUPER_X}>
            Super X
          </S.FormatoTitle>
          <S.FormatoDescription>
            8 ou 12 jogadores, duplas rotativas, sem eliminatória
          </S.FormatoDescription>
        </S.FormatoOption>

        <S.FormatoOption
          $selected={formatoAtual === FormatoEtapa.TEAMS}
          onClick={() => onFormatoChange(FormatoEtapa.TEAMS)}
        >
          <S.FormatoTitle $selected={formatoAtual === FormatoEtapa.TEAMS}>
            TEAMS
          </S.FormatoTitle>
          <S.FormatoDescription>
            Equipes de 4 ou 6 jogadores, todos contra todos
          </S.FormatoDescription>
        </S.FormatoOption>
      </S.FormatoSelector>
    </S.Card>
  );
};

export default FormatoSelector;
