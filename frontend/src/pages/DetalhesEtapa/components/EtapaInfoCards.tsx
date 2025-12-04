/**
 * EtapaInfoCards.tsx
 *
 * Responsabilidade única: Renderizar cards de informações da etapa
 */

import React from "react";
import { Etapa, TipoChaveamentoReiDaPraia } from "@/types/etapa";
import {
  formatarData,
  getNivelLabel,
  getGeneroLabel,
} from "@/utils/formatters";
import * as S from "../DetalhesEtapa.styles";

interface EtapaInfoCardsProps {
  etapa: Etapa;
  progresso: number;
  isReiDaPraia: boolean;
}

export const EtapaInfoCards: React.FC<EtapaInfoCardsProps> = ({
  etapa,
  progresso,
  isReiDaPraia,
}) => {
  // Helper para formatar tipo de chaveamento
  const getTipoChaveamentoLabel = (
    tipo?: TipoChaveamentoReiDaPraia
  ): string => {
    if (!tipo) return "Não definido";
    switch (tipo) {
      case TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES:
        return "Melhores com Melhores";
      case TipoChaveamentoReiDaPraia.PAREAMENTO_POR_RANKING:
        return "Pareamento por Ranking";
      case TipoChaveamentoReiDaPraia.SORTEIO_ALEATORIO:
        return "Sorteio Aleatório";
      default:
        return "Não definido";
    }
  };

  return (
    <>
      {/* Cards Principais */}
      <S.Grid $cols={3}>
        {/* Inscritos */}
        <S.Card>
          <S.CardIconRow>
            <S.CardInfo>
              <S.CardLabel>Inscritos</S.CardLabel>
              <S.CardValue>
                {etapa.totalInscritos} / {etapa.maxJogadores}
              </S.CardValue>
            </S.CardInfo>
          </S.CardIconRow>

          <S.ProgressBar>
            <S.ProgressBarTrack>
              <S.ProgressBarFill $progress={progresso} />
            </S.ProgressBarTrack>
            <S.ProgressText>{progresso}% preenchido</S.ProgressText>
          </S.ProgressBar>
        </S.Card>

        {/* Grupos */}
        <S.Card>
          <S.CardIconRow>
            <S.CardInfo>
              <S.CardLabel>
                {isReiDaPraia ? "Grupos de 4" : "Grupos"}
              </S.CardLabel>
              <S.CardValue>{etapa.qtdGrupos || 0}</S.CardValue>
            </S.CardInfo>
          </S.CardIconRow>

          <S.CardContent>
            {isReiDaPraia ? (
              <>
                <p>• 4 jogadores por grupo</p>
                <p>• 3 partidas por grupo</p>
              </>
            ) : (
              <p>• {etapa.jogadoresPorGrupo} duplas por grupo</p>
            )}
            {etapa.chavesGeradas ? (
              <p style={{ color: "#22c55e", fontWeight: 500 }}>
                ✓ Chaves geradas
              </p>
            ) : (
              <p style={{ color: "#9ca3af" }}>Chaves não geradas</p>
            )}
          </S.CardContent>
        </S.Card>

        {/* Realização */}
        <S.Card>
          <S.CardIconRow>
            <S.CardInfo>
              <S.CardLabel>Realização</S.CardLabel>
              <S.CardValue style={{ fontSize: "1.125rem" }}>
                {formatarData(etapa.dataRealizacao)}
              </S.CardValue>
            </S.CardInfo>
          </S.CardIconRow>

          <S.CardContent>
            {etapa.local && (
              <p
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.5rem",
                }}
              >
                <span>📍 {etapa.local}</span>
              </p>
            )}

            <p
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.5rem",
              }}
            >
              <span style={{ fontWeight: 500 }}>Gênero:</span>
              <span>{getGeneroLabel(etapa.genero)}</span>
            </p>

            <p
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom:
                  isReiDaPraia && etapa.tipoChaveamento ? "0.5rem" : "0",
              }}
            >
              <span style={{ fontWeight: 500 }}>Nível:</span>
              <span>{getNivelLabel(etapa.nivel)}</span>
            </p>

            {isReiDaPraia && etapa.tipoChaveamento && (
              <p
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span style={{ fontWeight: 500 }}>Chaveamento:</span>
                <span>{getTipoChaveamentoLabel(etapa.tipoChaveamento)}</span>
              </p>
            )}
          </S.CardContent>
        </S.Card>
      </S.Grid>

      {/* Informações Detalhadas */}
      <S.Grid $cols={2}>
        {/* Datas */}
        <S.Card>
          <S.CardTitle>Datas Importantes</S.CardTitle>

          <S.InfoList>
            <S.InfoRow>
              <S.InfoLabel>Início das inscrições:</S.InfoLabel>
              <S.InfoValue>{formatarData(etapa.dataInicio)}</S.InfoValue>
            </S.InfoRow>

            <S.InfoRow>
              <S.InfoLabel>Fim das inscrições:</S.InfoLabel>
              <S.InfoValue>{formatarData(etapa.dataFim)}</S.InfoValue>
            </S.InfoRow>

            <S.InfoRow $highlight>
              <S.InfoLabel>Data de realização:</S.InfoLabel>
              <S.InfoValue $color="#3b82f6">
                {formatarData(etapa.dataRealizacao)}
              </S.InfoValue>
            </S.InfoRow>
          </S.InfoList>
        </S.Card>

        {/* Estatísticas */}
        <S.Card>
          <S.CardTitle> Estatísticas</S.CardTitle>

          <S.InfoList>
            <S.InfoRow>
              <S.InfoLabel>Total de inscritos:</S.InfoLabel>
              <S.InfoValue>{etapa.totalInscritos}</S.InfoValue>
            </S.InfoRow>

            <S.InfoRow>
              <S.InfoLabel>Vagas disponíveis:</S.InfoLabel>
              <S.InfoValue>
                {etapa.maxJogadores - etapa.totalInscritos}
              </S.InfoValue>
            </S.InfoRow>

            <S.InfoRow>
              <S.InfoLabel>Taxa de ocupação:</S.InfoLabel>
              <S.InfoValue $color={progresso === 100 ? "#22c55e" : "#3b82f6"}>
                {progresso}%
              </S.InfoValue>
            </S.InfoRow>
          </S.InfoList>
        </S.Card>
      </S.Grid>

      {/* Descrição */}
      {etapa.descricao && (
        <S.Card>
          <S.CardTitle>Descrição</S.CardTitle>
          <S.CardContent>
            <p>{etapa.descricao}</p>
          </S.CardContent>
        </S.Card>
      )}
    </>
  );
};

export default EtapaInfoCards;
