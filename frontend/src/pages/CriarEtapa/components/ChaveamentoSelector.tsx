/**
 * ChaveamentoSelector.tsx
 *
 * Responsabilidade única: Seletor de tipo de chaveamento para Rei da Praia
 */

import React from "react";
import { TipoChaveamentoReiDaPraia } from "@/types/reiDaPraia";
import * as S from "../CriarEtapa.styles";

export interface ChaveamentoSelectorProps {
  tipoChaveamento: TipoChaveamentoReiDaPraia;
  onTipoChange: (tipo: TipoChaveamentoReiDaPraia) => void;
}

export const ChaveamentoSelector: React.FC<ChaveamentoSelectorProps> = ({
  tipoChaveamento,
  onTipoChange,
}) => {
  return (
    <S.Card>
      <S.CardTitle>Chaveamento da Fase Eliminatória</S.CardTitle>
      <S.HelperText style={{ marginBottom: "1rem" }}>
        Como as duplas serão formadas na fase eliminatória
      </S.HelperText>

      <S.ChaveamentoSelector>
        {/* Opção 1: Melhores com Melhores */}
        <S.ChaveamentoOption
          $selected={
            tipoChaveamento ===
            TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES
          }
          onClick={() =>
            onTipoChange(TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES)
          }
        >
          <S.ChaveamentoTitle
            $selected={
              tipoChaveamento ===
              TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES
            }
          >
            Melhores com Melhores
          </S.ChaveamentoTitle>
          <S.ChaveamentoDescription>
            Duplas extremas: 1º+2º vs 3º+4º
          </S.ChaveamentoDescription>
        </S.ChaveamentoOption>

        {/* Opção 2: Pareamento por Ranking */}
        <S.ChaveamentoOption
          $selected={
            tipoChaveamento ===
            TipoChaveamentoReiDaPraia.PAREAMENTO_POR_RANKING
          }
          onClick={() =>
            onTipoChange(TipoChaveamentoReiDaPraia.PAREAMENTO_POR_RANKING)
          }
        >
          <S.ChaveamentoTitle
            $selected={
              tipoChaveamento ===
              TipoChaveamentoReiDaPraia.PAREAMENTO_POR_RANKING
            }
          >
            Pareamento por Ranking
          </S.ChaveamentoTitle>
          <S.ChaveamentoDescription>
            Duplas equilibradas: 1º lugar + 2º lugar
          </S.ChaveamentoDescription>
        </S.ChaveamentoOption>

        {/* Opção 3: Sorteio Aleatório */}
        <S.ChaveamentoOption
          $selected={
            tipoChaveamento ===
            TipoChaveamentoReiDaPraia.SORTEIO_ALEATORIO
          }
          onClick={() =>
            onTipoChange(TipoChaveamentoReiDaPraia.SORTEIO_ALEATORIO)
          }
        >
          <S.ChaveamentoTitle
            $selected={
              tipoChaveamento ===
              TipoChaveamentoReiDaPraia.SORTEIO_ALEATORIO
            }
          >
            Sorteio Aleatório
          </S.ChaveamentoTitle>
          <S.ChaveamentoDescription>
            Sorteio protegido entre classificados
          </S.ChaveamentoDescription>
        </S.ChaveamentoOption>
      </S.ChaveamentoSelector>
    </S.Card>
  );
};

export default ChaveamentoSelector;
