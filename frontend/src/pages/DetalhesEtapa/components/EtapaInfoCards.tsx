/**
 * Responsabilidade única: Renderizar cards de informações da etapa
 */

import React from "react";
import { Etapa, TipoChaveamentoReiDaPraia, TipoFormacaoEquipe, FormatoEtapa } from "@/types/etapa";
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
  isSuperX?: boolean;
  isTeams?: boolean;
}

export const EtapaInfoCards: React.FC<EtapaInfoCardsProps> = ({
  etapa,
  progresso,
  isReiDaPraia,
  isSuperX = false,
  isTeams = false,
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

  // Helper para formatar tipo de formação de equipe
  const getTipoFormacaoEquipeLabel = (
    tipo?: TipoFormacaoEquipe
  ): string => {
    if (!tipo) return "Não definido";
    switch (tipo) {
      case TipoFormacaoEquipe.MESMO_NIVEL:
        return "Mesmo Nível";
      case TipoFormacaoEquipe.BALANCEADO:
        return "Balanceado";
      case TipoFormacaoEquipe.MANUAL:
        return "Manual";
      default:
        return "Não definido";
    }
  };

  // Helper para formatar formato da etapa
  const getFormatoLabel = (): string => {
    if (etapa.formato === FormatoEtapa.REI_DA_PRAIA) {
      return "Rei da Praia";
    }
    if (etapa.formato === FormatoEtapa.SUPER_X) {
      return `Super ${etapa.varianteSuperX || 8}`;
    }
    if (etapa.formato === FormatoEtapa.TEAMS) {
      return `Teams ${etapa.varianteTeams || 4}`;
    }
    return "Dupla Fixa";
  };

  // Calcular número de grupos para TEAMS (baseado em inscritos e variante)
  const calcularNumGruposTeams = (): number => {
    const jogadoresPorEquipe = etapa.varianteTeams || 4;
    const numEquipes = Math.floor(etapa.totalInscritos / jogadoresPorEquipe);
    if (numEquipes <= 5) return 1; // Todos contra todos
    if (numEquipes <= 8) return 2;
    if (numEquipes <= 12) return 3;
    if (numEquipes <= 16) return 4;
    if (numEquipes <= 20) return 5;
    if (numEquipes <= 24) return 6;
    if (numEquipes <= 28) return 7;
    return 8;
  };

  // Verificar se TEAMS tem fase de grupos ou é todos contra todos
  const teamsTemFaseGrupos = (): boolean => {
    const jogadoresPorEquipe = etapa.varianteTeams || 4;
    const numEquipes = Math.floor(etapa.totalInscritos / jogadoresPorEquipe);
    return numEquipes > 5;
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

        {/* Grupos / Equipes */}
        <S.Card>
          <S.CardIconRow>
            <S.CardInfo>
              <S.CardLabel>
                {isTeams
                  ? "Equipes"
                  : isSuperX
                  ? "Grupo Único"
                  : isReiDaPraia
                  ? "Grupos de 4"
                  : "Grupos"}
              </S.CardLabel>
              <S.CardValue>
                {isTeams
                  ? Math.floor(etapa.totalInscritos / (etapa.varianteTeams || 4))
                  : isSuperX
                  ? 1
                  : etapa.qtdGrupos || 0}
              </S.CardValue>
            </S.CardInfo>
          </S.CardIconRow>

          <S.CardContent>
            {isTeams ? (
              <>
                <p>• {etapa.varianteTeams || 4} jogadores por equipe</p>
                <p>
                  • {etapa.varianteTeams === 4 ? "2 jogos por confronto" : "3 jogos por confronto"}
                </p>
                {teamsTemFaseGrupos() ? (
                  <p>• {calcularNumGruposTeams()} grupos + eliminatórias</p>
                ) : (
                  <p>• Todos contra todos</p>
                )}
              </>
            ) : isSuperX ? (
              <>
                <p>• {etapa.varianteSuperX || 8} jogadores</p>
                <p>
                  • {etapa.varianteSuperX === 8 ? "7 rodadas" : "11 rodadas"}
                </p>
                <p>• Duplas rotativas</p>
              </>
            ) : isReiDaPraia ? (
              <>
                <p>• 4 jogadores por grupo</p>
                <p>• 3 partidas por grupo</p>
              </>
            ) : (
              <p>• {etapa.jogadoresPorGrupo} duplas por grupo</p>
            )}
            {etapa.chavesGeradas ? (
              <p style={{ color: "#22c55e", fontWeight: 500 }}>
                {isTeams ? "✓ Equipes geradas" : "✓ Chaves geradas"}
              </p>
            ) : (
              <p style={{ color: "#9ca3af" }}>
                {isTeams ? "Equipes nao geradas" : "Chaves nao geradas"}
              </p>
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
              <span style={{ fontWeight: 500 }}>Formato:</span>
              <span>{getFormatoLabel()}</span>
            </p>

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

            {etapa.nivel && (
              <p
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.5rem",
                }}
              >
                <span style={{ fontWeight: 500 }}>Nível:</span>
                <span>{getNivelLabel(etapa.nivel)}</span>
              </p>
            )}

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

            {isTeams && etapa.tipoFormacaoEquipe && (
              <p
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span style={{ fontWeight: 500 }}>Formação Equipes:</span>
                <span>{getTipoFormacaoEquipeLabel(etapa.tipoFormacaoEquipe)}</span>
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
