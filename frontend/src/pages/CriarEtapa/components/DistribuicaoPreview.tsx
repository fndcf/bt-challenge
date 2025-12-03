/**
 * DistribuicaoPreview.tsx
 *
 * Responsabilidade única: Preview da distribuição de grupos baseado no formato
 */

import React from "react";
import { FormatoEtapa } from "@/types/etapa";
import { TipoChaveamentoReiDaPraia } from "@/types/reiDaPraia";
import { DistribuicaoDuplaFixa, DistribuicaoReiDaPraia } from "../hooks/useCriarEtapa";
import * as S from "../CriarEtapa.styles";

export interface DistribuicaoPreviewProps {
  formato: FormatoEtapa;
  tipoChaveamento: TipoChaveamentoReiDaPraia;
  infoDuplaFixa: DistribuicaoDuplaFixa;
  infoReiDaPraia: DistribuicaoReiDaPraia;
}

export const DistribuicaoPreview: React.FC<DistribuicaoPreviewProps> = ({
  formato,
  tipoChaveamento,
  infoDuplaFixa,
  infoReiDaPraia,
}) => {
  // Preview para Rei da Praia
  if (formato === FormatoEtapa.REI_DA_PRAIA) {
    return (
      <S.PreviewCard>
        <S.PreviewTitle>
          Distribuição Rei da Praia
        </S.PreviewTitle>

        {infoReiDaPraia.valido ? (
          <S.PreviewContent>
            <S.PreviewRow>
              <span>
                <strong>{infoReiDaPraia.totalJogadores}</strong>{" "}
                jogadores
              </span>
              <span>→</span>
              <span>
                <strong>{infoReiDaPraia.qtdGrupos}</strong>{" "}
                {infoReiDaPraia.qtdGrupos === 1 ? "grupo" : "grupos"}
              </span>
            </S.PreviewRow>

            <S.PreviewBox>{infoReiDaPraia.descricao}</S.PreviewBox>

            <S.PreviewNote>
              Cada grupo: 4 jogadores, 3 partidas
            </S.PreviewNote>
            <S.PreviewNote>
              Chaveamento:{" "}
              {tipoChaveamento ===
              TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES
                ? "Melhores com Melhores"
                : tipoChaveamento ===
                  TipoChaveamentoReiDaPraia.PAREAMENTO_POR_RANKING
                ? "Pareamento por Ranking"
                : "Sorteio Aleatório"}
            </S.PreviewNote>
          </S.PreviewContent>
        ) : (
          <S.PreviewRow>
            {infoReiDaPraia.descricao}
          </S.PreviewRow>
        )}
      </S.PreviewCard>
    );
  }

  // Preview para Dupla Fixa
  return (
    <S.PreviewCard>
      <S.PreviewTitle>
        Distribuição de Grupos
      </S.PreviewTitle>

      {infoDuplaFixa.valido ? (
        <S.PreviewContent>
          <S.PreviewRow>
            <span>
              <strong>{infoDuplaFixa.totalDuplas}</strong> duplas
            </span>
            <span>→</span>
            <span>
              <strong>{infoDuplaFixa.qtdGrupos}</strong>{" "}
              {infoDuplaFixa.qtdGrupos === 1 ? "grupo" : "grupos"}
            </span>
          </S.PreviewRow>

          <S.PreviewBox>{infoDuplaFixa.descricao}</S.PreviewBox>

          <S.PreviewNote>
            Grupos com 3 duplas cada (mínimo)
          </S.PreviewNote>
        </S.PreviewContent>
      ) : (
        <S.PreviewRow>
          {infoDuplaFixa.descricao}
        </S.PreviewRow>
      )}
    </S.PreviewCard>
  );
};

export default DistribuicaoPreview;
