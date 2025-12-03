/**
 * FormatoSelector.tsx
 *
 * Responsabilidade única: Seletor de formato do torneio (Dupla Fixa ou Rei da Praia)
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
          <S.FormatoTitle
            $selected={formatoAtual === FormatoEtapa.DUPLA_FIXA}
          >
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
      </S.FormatoSelector>
    </S.Card>
  );
};

export default FormatoSelector;
