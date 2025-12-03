/**
 * FormatoDisplay.tsx
 *
 * Responsabilidade única: Exibir formato da etapa (read-only) e permitir edição de chaveamento
 */

import React from "react";
import { FormatoEtapa } from "@/types/etapa";
import { TipoChaveamentoReiDaPraia } from "@/types/reiDaPraia";
import * as S from "../EditarEtapa.styles";

export interface FormatoDisplayProps {
  formato: FormatoEtapa;
  tipoChaveamento?: TipoChaveamentoReiDaPraia;
  chavesGeradas: boolean;
  onTipoChaveamentoChange: (tipo: TipoChaveamentoReiDaPraia) => void;
}

export const FormatoDisplay: React.FC<FormatoDisplayProps> = ({
  formato,
  tipoChaveamento,
  chavesGeradas,
  onTipoChaveamentoChange,
}) => {
  const isReiDaPraia = formato === FormatoEtapa.REI_DA_PRAIA;

  return (
    <S.GridContainer2>
      {/* Card de Formato (Read-only) */}
      <S.InfoCard>
        <S.InfoContent>
          <S.InfoLabel>Formato</S.InfoLabel>
          <S.InfoValue>
            {isReiDaPraia ? "Rei da Praia" : "Dupla Fixa"}
          </S.InfoValue>
        </S.InfoContent>
      </S.InfoCard>

      {/* Chaveamento - Editável até gerar eliminatória */}
      {isReiDaPraia && (
        <S.Field>
          <S.Label>
            Tipo de Chaveamento <S.Required>*</S.Required>
          </S.Label>
          <S.Select
            required
            disabled={chavesGeradas}
            value={tipoChaveamento || ""}
            onChange={(e) =>
              onTipoChaveamentoChange(e.target.value as TipoChaveamentoReiDaPraia)
            }
          >
            <option value={TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES}>
              Melhores com Melhores
            </option>
            <option value={TipoChaveamentoReiDaPraia.PAREAMENTO_POR_RANKING}>
              Pareamento por Ranking
            </option>
            <option value={TipoChaveamentoReiDaPraia.SORTEIO_ALEATORIO}>
              Sorteio Aleatório
            </option>
          </S.Select>
          <S.HelperText>
            Define como as duplas serão formadas na fase eliminatória
          </S.HelperText>
        </S.Field>
      )}
    </S.GridContainer2>
  );
};

export default FormatoDisplay;
