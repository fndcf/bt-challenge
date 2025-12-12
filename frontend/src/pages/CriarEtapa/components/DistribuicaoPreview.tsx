/**
 * Responsabilidade única: Preview da distribuição de grupos baseado no formato
 */

import React from "react";
import { FormatoEtapa } from "@/types/etapa";
import { TipoChaveamentoReiDaPraia } from "@/types/reiDaPraia";
import {
  DistribuicaoDuplaFixa,
  DistribuicaoReiDaPraia,
  DistribuicaoSuperX,
  DistribuicaoTeams,
} from "../hooks/useCriarEtapa";
import * as S from "../CriarEtapa.styles";

export interface DistribuicaoPreviewProps {
  formato: FormatoEtapa;
  tipoChaveamento: TipoChaveamentoReiDaPraia;
  infoDuplaFixa: DistribuicaoDuplaFixa;
  infoReiDaPraia: DistribuicaoReiDaPraia;
  infoSuperX?: DistribuicaoSuperX;
  infoTeams?: DistribuicaoTeams;
}

export const DistribuicaoPreview: React.FC<DistribuicaoPreviewProps> = ({
  formato,
  tipoChaveamento,
  infoDuplaFixa,
  infoReiDaPraia,
  infoSuperX,
  infoTeams,
}) => {
  // Preview para Super X
  if (formato === FormatoEtapa.SUPER_X && infoSuperX) {
    return (
      <S.PreviewCard>
        <S.PreviewTitle>Distribuição Super {infoSuperX.variante}</S.PreviewTitle>

        <S.PreviewContent>
          <S.PreviewRow>
            <span>
              <strong>{infoSuperX.totalJogadores}</strong> jogadores
            </span>
            <span>→</span>
            <span>
              <strong>1</strong> grupo único
            </span>
          </S.PreviewRow>

          <S.PreviewBox>{infoSuperX.descricao}</S.PreviewBox>

          <S.PreviewNote>
            Duplas rotativas a cada rodada - todos jogam com todos
          </S.PreviewNote>
          <S.PreviewNote>
            Sem fase eliminatória - classificação final individual
          </S.PreviewNote>
        </S.PreviewContent>
      </S.PreviewCard>
    );
  }

  // Preview para TEAMS
  if (formato === FormatoEtapa.TEAMS && infoTeams) {
    return (
      <S.PreviewCard>
        <S.PreviewTitle>Distribuição TEAMS {infoTeams.variante}</S.PreviewTitle>

        {infoTeams.valido ? (
          <S.PreviewContent>
            <S.PreviewRow>
              <span>
                <strong>{infoTeams.totalJogadores}</strong> jogadores
              </span>
              <span>→</span>
              <span>
                <strong>{infoTeams.totalEquipes}</strong>{" "}
                {infoTeams.totalEquipes === 1 ? "equipe" : "equipes"}
              </span>
            </S.PreviewRow>

            <S.PreviewBox>{infoTeams.descricao}</S.PreviewBox>

            <S.PreviewNote>
              {infoTeams.jogadoresPorEquipe} jogadores por equipe
            </S.PreviewNote>
            <S.PreviewNote>
              {infoTeams.jogosPorConfronto} jogos por confronto
              {infoTeams.variante === 4 ? " (+ decider se 1-1)" : ""}
            </S.PreviewNote>
            <S.PreviewNote>
              Todos contra todos - vitória no confronto = 3 pontos
            </S.PreviewNote>
          </S.PreviewContent>
        ) : (
          <S.PreviewRow>{infoTeams.descricao}</S.PreviewRow>
        )}
      </S.PreviewCard>
    );
  }

  // Preview para Rei da Praia
  if (formato === FormatoEtapa.REI_DA_PRAIA) {
    return (
      <S.PreviewCard>
        <S.PreviewTitle>Distribuição Rei da Praia</S.PreviewTitle>

        {infoReiDaPraia.valido ? (
          <S.PreviewContent>
            <S.PreviewRow>
              <span>
                <strong>{infoReiDaPraia.totalJogadores}</strong> jogadores
              </span>
              <span>→</span>
              <span>
                <strong>{infoReiDaPraia.qtdGrupos}</strong>{" "}
                {infoReiDaPraia.qtdGrupos === 1 ? "grupo" : "grupos"}
              </span>
            </S.PreviewRow>

            <S.PreviewBox>{infoReiDaPraia.descricao}</S.PreviewBox>

            <S.PreviewNote>Cada grupo: 4 jogadores, 3 partidas</S.PreviewNote>
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
          <S.PreviewRow>{infoReiDaPraia.descricao}</S.PreviewRow>
        )}
      </S.PreviewCard>
    );
  }

  // Preview para Dupla Fixa
  return (
    <S.PreviewCard>
      <S.PreviewTitle>Distribuição de Grupos</S.PreviewTitle>

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

          <S.PreviewNote>Grupos com 3 duplas cada (mínimo)</S.PreviewNote>
        </S.PreviewContent>
      ) : (
        <S.PreviewRow>{infoDuplaFixa.descricao}</S.PreviewRow>
      )}
    </S.PreviewCard>
  );
};

export default DistribuicaoPreview;
