/**
 * ChavesReiDaPraia - Componente para exibir grupos e partidas do formato Rei da Praia
 *
 * Diferenças do Dupla Fixa:
 * - Estatísticas individuais por jogador
 * - Grupos sempre com 4 jogadores
 * - 3 partidas por grupo (todas as combinações de duplas)
 * - Apenas 1 set por partida
 */

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import reiDaPraiaService from "../../services/reiDaPraiaService";
import { Grupo } from "../../types/chave";
import {
  EstatisticasJogador,
  TipoChaveamentoReiDaPraia,
} from "../../types/reiDaPraia";
import { PartidasGrupoReiDaPraia } from "./PartidasGrupoReiDaPraia"; // Criar depois
import { FaseEliminatoriaReiDaPraia } from "./FaseEliminatoriaReiDaPraia"; // Criar depois

interface ChavesReiDaPraiaProps {
  etapaId: string;
  arenaId?: string;
  tipoChaveamento?: TipoChaveamentoReiDaPraia;
}

type AbaAtiva = "grupos" | "eliminatoria";

// ============== STYLED COMPONENTS ==============

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;

  @media (min-width: 768px) {
    padding: 1.5rem;
  }
`;

const TabsContainer = styled.div`
  border-bottom: 2px solid #e9d5ff;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    border-bottom: none;
  }
`;

const TabsList = styled.nav`
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const Tab = styled.button<{ $isActive: boolean }>`
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  border-bottom: 3px solid
    ${(props) => (props.$isActive ? "#7c3aed" : "transparent")};
  color: ${(props) => (props.$isActive ? "#7c3aed" : "#6b7280")};
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    color: #7c3aed;
  }

  @media (max-width: 768px) {
    width: 100%;
    padding: 0.875rem 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    text-align: left;
    background: ${(props) => (props.$isActive ? "#faf5ff" : "white")};
    border-color: ${(props) => (props.$isActive ? "#7c3aed" : "#e5e7eb")};
    border-bottom: 1px solid
      ${(props) => (props.$isActive ? "#7c3aed" : "#e5e7eb")};

    &:hover {
      background: ${(props) => (props.$isActive ? "#faf5ff" : "#f9fafb")};
    }
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: #581c87;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (min-width: 768px) {
    font-size: 2rem;
  }
`;

const Stats = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const GruposGrid = styled.div`
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const GrupoCard = styled.div`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid #e9d5ff;
`;

const GrupoHeader = styled.div`
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  padding: 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
`;

const GrupoNome = styled.h3`
  color: white;
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (min-width: 768px) {
    font-size: 1.5rem;
  }
`;

const GrupoBadge = styled.div`
  background: rgba(255, 255, 255, 0.2);
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
`;

const JogadoresList = styled.div`
  > * + * {
    border-top: 1px solid #f3f4f6;
  }
`;

const JogadorItem = styled.div<{ $classificado?: boolean }>`
  padding: 1.25rem;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  transition: background 0.2s;
  background: ${(props) => (props.$classificado ? "#faf5ff" : "transparent")};

  &:hover {
    background: ${(props) => (props.$classificado ? "#f3e8ff" : "#f9fafb")};
  }

  @media (min-width: 768px) {
    align-items: center;
    gap: 1.5rem;
  }
`;

const PosicaoBadge = styled.div<{ $posicao: number }>`
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  background: ${(props) => {
    if (props.$posicao === 1) return "#fef08a"; // Ouro
    if (props.$posicao === 2) return "#e5e7eb"; // Prata
    if (props.$posicao === 3) return "#fed7aa"; // Bronze
    return "#ddd6fe"; // Roxo claro
  }};
  color: ${(props) => {
    if (props.$posicao === 1) return "#854d0e";
    if (props.$posicao === 2) return "#374151";
    if (props.$posicao === 3) return "#9a3412";
    return "#6d28d9";
  }};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;

  @media (min-width: 768px) {
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1rem;
  }
`;

const JogadorContent = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  @media (min-width: 1025px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;
  }
`;

const JogadorInfo = styled.div`
  min-width: 0;

  @media (min-width: 1024px) {
    flex: 1 1 40%;
    max-width: 50%;
  }
`;

const JogadorNome = styled.div`
  font-weight: 600;
  color: #111827;
  font-size: 0.9375rem;
  margin-bottom: 0.25rem;
  overflow-wrap: break-word;
  word-wrap: break-word;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const JogadorMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const NivelBadge = styled.span<{ $nivel?: string }>`
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-weight: 500;

  ${(props) => {
    if (!props.$nivel) {
      return `
        background: #f3f4f6;
        color: #6b7280;
      `;
    }

    switch (props.$nivel) {
      case "iniciante":
        return `
          background: #dcfce7;
          color: #166534;
        `;
      case "intermediario":
        return `
          background: #fef9c3;
          color: #854d0e;
        `;
      case "avancado":
        return `
          background: #fee2e2;
          color: #991b1b;
        `;
      default:
        return `
          background: #f3f4f6;
          color: #6b7280;
        `;
    }
  }}
`;

const ClassificadoBadge = styled.span`
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  background: #ddd6fe;
  color: #6d28d9;
  font-weight: 600;
`;

// Estatísticas em GRID no mobile, inline no desktop
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(5, 1fr);
  }

  @media (min-width: 1024px) {
    display: flex;
    gap: 1rem;
  }
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
  min-width: 45px;
  padding: 0.375rem;
  background: #faf5ff;
  border-radius: 0.375rem;

  @media (min-width: 1024px) {
    background: transparent;
    padding: 0;
  }
`;

const StatLabel = styled.div`
  font-size: 0.625rem;
  color: #9ca3af;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  @media (min-width: 768px) {
    font-size: 0.6875rem;
  }
`;

const StatValue = styled.div<{
  $variant?: "primary" | "success" | "error" | "neutral";
}>`
  font-weight: 700;
  font-size: ${(props) =>
    props.$variant === "primary" ? "1.125rem" : "0.875rem"};

  color: ${(props) => {
    switch (props.$variant) {
      case "primary":
        return "#7c3aed";
      case "success":
        return "#16a34a";
      case "error":
        return "#dc2626";
      default:
        return "#374151";
    }
  }};

  @media (min-width: 768px) {
    font-size: ${(props) =>
      props.$variant === "primary" ? "1.25rem" : "1rem"};
  }
`;

const GrupoFooter = styled.div`
  background: #faf5ff;
  padding: 1rem 1.25rem;
  border-top: 1px solid #e9d5ff;
`;

const FooterInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  font-size: 0.8125rem;
  color: #6b7280;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const CompletoBadge = styled.span`
  background: #ddd6fe;
  color: #6d28d9;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
`;

const VerPartidasButton = styled.button`
  width: 100%;
  background: #7c3aed;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.2s;

  &:hover {
    background: #6d28d9;
  }

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

const PartidasContainer = styled.div`
  margin-top: 1rem;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem;
`;

const Spinner = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid #ede9fe;
  border-top-color: #7c3aed;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const ErrorContainer = styled.div`
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 1rem;
  color: #991b1b;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
  font-size: 0.9375rem;
`;

const InfoCard = styled.div`
  background: #faf5ff;
  border: 1px solid #e9d5ff;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1.5rem;

  h4 {
    color: #6d28d9;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    font-size: 0.9375rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  p {
    color: #7c3aed;
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  ul {
    margin: 0.5rem 0 0 0;
    padding-left: 1.25rem;
    color: #7c3aed;
    font-size: 0.875rem;
  }

  li {
    margin-top: 0.25rem;
  }
`;

const CombinacoesInfo = styled.div`
  background: white;
  border: 1px solid #e9d5ff;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1rem;
`;

const CombinacoesTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #6d28d9;
  margin: 0 0 0.75rem 0;
`;

const CombinacoesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const CombinacaoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.8125rem;
  color: #374151;
  padding: 0.5rem;
  background: #faf5ff;
  border-radius: 0.375rem;
`;

const CombinacaoNumero = styled.span`
  background: #7c3aed;
  color: white;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
`;

// ============== HELPERS ==============

const getNivelLabel = (nivel?: string): string => {
  if (!nivel) {
    return "Não informado";
  }

  switch (nivel) {
    case "iniciante":
      return "Iniciante";
    case "intermediario":
      return "Intermediário";
    case "avancado":
      return "Avançado";
    default:
      return nivel;
  }
};

// ============== COMPONENTE ==============

export const ChavesReiDaPraia: React.FC<ChavesReiDaPraiaProps> = ({
  etapaId,
  arenaId,
  tipoChaveamento,
}) => {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [jogadores, setJogadores] = useState<EstatisticasJogador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grupoSelecionado, setGrupoSelecionado] = useState<string | null>(null);
  const [eliminatoriaExiste, setEliminatoriaExiste] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>("grupos");

  useEffect(() => {
    carregarChaves();
  }, [etapaId, abaAtiva]);

  const carregarChaves = async () => {
    try {
      setLoading(true);
      setError(null);

      const [gruposData, jogadoresData] = await Promise.all([
        reiDaPraiaService.buscarGrupos(etapaId),
        reiDaPraiaService.buscarJogadores(etapaId),
      ]);

      setGrupos(gruposData);
      setJogadores(jogadoresData);

      // Verificar se existe fase eliminatória
      try {
        const confrontos =
          await reiDaPraiaService.buscarConfrontosEliminatorios(etapaId);
        setEliminatoriaExiste(confrontos && confrontos.length > 0);
      } catch {
        setEliminatoriaExiste(false);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao carregar chaves");
    } finally {
      setLoading(false);
    }
  };

  const toggleGrupo = (grupoId: string) => {
    setGrupoSelecionado((prev) => (prev === grupoId ? null : grupoId));
  };

  if (loading) {
    return (
      <LoadingContainer>
        <Spinner />
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorContainer>
          <strong>Erro:</strong> {error}
        </ErrorContainer>
      </Container>
    );
  }

  if (grupos.length === 0) {
    return (
      <Container>
        <EmptyState>👑 Nenhuma chave gerada ainda</EmptyState>
      </Container>
    );
  }

  // Calcular total de partidas (3 por grupo)
  const totalPartidas = grupos.length * 3;

  return (
    <Container>
      <TabsContainer>
        <TabsList>
          <Tab
            $isActive={abaAtiva === "grupos"}
            onClick={() => setAbaAtiva("grupos")}
          >
            👑 Fase de Grupos
          </Tab>
          <Tab
            $isActive={abaAtiva === "eliminatoria"}
            onClick={() => setAbaAtiva("eliminatoria")}
          >
            🏆 Eliminatória
          </Tab>
        </TabsList>
      </TabsContainer>

      {abaAtiva === "grupos" ? (
        <>
          <Header>
            <Title>👑 Grupos Rei da Praia</Title>
            <Stats>
              {grupos.length} grupos • {jogadores.length} jogadores •{" "}
              {totalPartidas} partidas
            </Stats>
          </Header>

          <GruposGrid>
            {grupos.map((grupo) => {
              const jogadoresDoGrupo = jogadores.filter(
                (j) => j.grupoId === grupo.id
              );

              return (
                <GrupoCard key={grupo.id}>
                  <GrupoHeader>
                    <GrupoNome>
                      <span>👑</span>
                      {grupo.nome}
                    </GrupoNome>
                    <GrupoBadge>{jogadoresDoGrupo.length} jogadores</GrupoBadge>
                  </GrupoHeader>

                  <JogadoresList>
                    {jogadoresDoGrupo.length === 0 ? (
                      <EmptyState>Nenhum jogador neste grupo</EmptyState>
                    ) : (
                      jogadoresDoGrupo
                        // ============== ORDENAÇÃO ==============
                        .sort((a, b) => {
                          // 1. Posição do grupo (se definida pelo backend)
                          if (
                            a.posicaoGrupo !== undefined &&
                            b.posicaoGrupo !== undefined
                          ) {
                            return a.posicaoGrupo - b.posicaoGrupo;
                          }

                          // 2. Pontos (3 por vitória)
                          if (a.pontosGrupo !== b.pontosGrupo) {
                            return b.pontosGrupo - a.pontosGrupo;
                          }

                          // 3. Saldo de games
                          if (a.saldoGamesGrupo !== b.saldoGamesGrupo) {
                            return b.saldoGamesGrupo - a.saldoGamesGrupo;
                          }

                          // 4. Games vencidos
                          if (a.gamesVencidosGrupo !== b.gamesVencidosGrupo) {
                            return b.gamesVencidosGrupo - a.gamesVencidosGrupo;
                          }

                          // 5. Saldo de sets
                          if (a.saldoSetsGrupo !== b.saldoSetsGrupo) {
                            return b.saldoSetsGrupo - a.saldoSetsGrupo;
                          }

                          // 6. Alfabético
                          return a.jogadorNome.localeCompare(b.jogadorNome);
                        })
                        // ============== RENDERIZAÇÃO ==============
                        .map((jogador, index) => (
                          <JogadorItem
                            key={
                              jogador.id ||
                              jogador.jogadorId ||
                              `${grupo.id}-${index}`
                            }
                            $classificado={jogador.classificado}
                          >
                            <PosicaoBadge $posicao={index + 1}>
                              {index + 1}
                            </PosicaoBadge>

                            <JogadorContent>
                              <JogadorInfo>
                                <JogadorNome>{jogador.jogadorNome}</JogadorNome>
                                <JogadorMeta>
                                  {jogador.jogadorNivel && (
                                    <NivelBadge $nivel={jogador.jogadorNivel}>
                                      {getNivelLabel(jogador.jogadorNivel)}
                                    </NivelBadge>
                                  )}
                                  {jogador.classificado && (
                                    <ClassificadoBadge>
                                      ✓ Classificado
                                    </ClassificadoBadge>
                                  )}
                                </JogadorMeta>
                              </JogadorInfo>

                              {jogador.jogosGrupo > 0 && (
                                <StatsGrid>
                                  <StatItem>
                                    <StatLabel>PTS</StatLabel>
                                    <StatValue $variant="primary">
                                      {jogador.pontosGrupo}
                                    </StatValue>
                                  </StatItem>

                                  <StatItem>
                                    <StatLabel>V-D</StatLabel>
                                    <StatValue>
                                      {jogador.vitoriasGrupo}-
                                      {jogador.derrotasGrupo}
                                    </StatValue>
                                  </StatItem>

                                  <StatItem>
                                    <StatLabel>GF</StatLabel>
                                    <StatValue>
                                      {jogador.gamesVencidosGrupo}
                                    </StatValue>
                                  </StatItem>

                                  <StatItem>
                                    <StatLabel>GC</StatLabel>
                                    <StatValue>
                                      {jogador.gamesPerdidosGrupo}
                                    </StatValue>
                                  </StatItem>

                                  <StatItem>
                                    <StatLabel>SG</StatLabel>
                                    <StatValue
                                      $variant={
                                        jogador.saldoGamesGrupo > 0
                                          ? "success"
                                          : jogador.saldoGamesGrupo < 0
                                          ? "error"
                                          : "neutral"
                                      }
                                    >
                                      {jogador.saldoGamesGrupo > 0 ? "+" : ""}
                                      {jogador.saldoGamesGrupo}
                                    </StatValue>
                                  </StatItem>
                                </StatsGrid>
                              )}
                            </JogadorContent>
                          </JogadorItem>
                        ))
                    )}
                  </JogadoresList>

                  {/* Mostrar combinações de partidas */}
                  {jogadoresDoGrupo.length === 4 && (
                    <CombinacoesInfo>
                      <CombinacoesTitle>
                        🎾 Combinações de Partidas
                      </CombinacoesTitle>
                      <CombinacoesList>
                        <CombinacaoItem>
                          <CombinacaoNumero>1</CombinacaoNumero>
                          <span>
                            <strong>
                              {jogadoresDoGrupo[0]?.jogadorNome?.split(" ")[0]}{" "}
                              +{" "}
                              {jogadoresDoGrupo[1]?.jogadorNome?.split(" ")[0]}
                            </strong>{" "}
                            vs{" "}
                            <strong>
                              {jogadoresDoGrupo[2]?.jogadorNome?.split(" ")[0]}{" "}
                              +{" "}
                              {jogadoresDoGrupo[3]?.jogadorNome?.split(" ")[0]}
                            </strong>
                          </span>
                        </CombinacaoItem>
                        <CombinacaoItem>
                          <CombinacaoNumero>2</CombinacaoNumero>
                          <span>
                            <strong>
                              {jogadoresDoGrupo[0]?.jogadorNome?.split(" ")[0]}{" "}
                              +{" "}
                              {jogadoresDoGrupo[2]?.jogadorNome?.split(" ")[0]}
                            </strong>{" "}
                            vs{" "}
                            <strong>
                              {jogadoresDoGrupo[1]?.jogadorNome?.split(" ")[0]}{" "}
                              +{" "}
                              {jogadoresDoGrupo[3]?.jogadorNome?.split(" ")[0]}
                            </strong>
                          </span>
                        </CombinacaoItem>
                        <CombinacaoItem>
                          <CombinacaoNumero>3</CombinacaoNumero>
                          <span>
                            <strong>
                              {jogadoresDoGrupo[0]?.jogadorNome?.split(" ")[0]}{" "}
                              +{" "}
                              {jogadoresDoGrupo[3]?.jogadorNome?.split(" ")[0]}
                            </strong>{" "}
                            vs{" "}
                            <strong>
                              {jogadoresDoGrupo[1]?.jogadorNome?.split(" ")[0]}{" "}
                              +{" "}
                              {jogadoresDoGrupo[2]?.jogadorNome?.split(" ")[0]}
                            </strong>
                          </span>
                        </CombinacaoItem>
                      </CombinacoesList>
                    </CombinacoesInfo>
                  )}

                  <GrupoFooter>
                    <FooterInfo>
                      <span>{grupo.partidasFinalizadas || 0} / 3 partidas</span>
                      {grupo.completo && (
                        <CompletoBadge>✓ Completo</CompletoBadge>
                      )}
                    </FooterInfo>

                    <VerPartidasButton onClick={() => toggleGrupo(grupo.id)}>
                      {grupoSelecionado === grupo.id
                        ? "🔼 Ocultar Partidas"
                        : "🎾 Ver Partidas"}
                    </VerPartidasButton>

                    {grupoSelecionado === grupo.id && (
                      <PartidasContainer>
                        <PartidasGrupoReiDaPraia
                          etapaId={etapaId}
                          grupoId={grupo.id}
                          grupoNome={grupo.nome}
                          onAtualizarGrupos={carregarChaves}
                          eliminatoriaExiste={eliminatoriaExiste}
                        />
                      </PartidasContainer>
                    )}
                  </GrupoFooter>
                </GrupoCard>
              );
            })}
          </GruposGrid>

          <InfoCard>
            <h4>👑 Formato Rei da Praia</h4>
            <p>
              Cada grupo tem 4 jogadores que formam duplas diferentes em cada
              partida. São 3 partidas por grupo, garantindo que cada jogador
              jogue com todos os outros.
            </p>
            <ul>
              <li>
                <strong>3 pontos</strong> por vitória
              </li>
              <li>
                <strong>1 set</strong> por partida (apenas 1 set)
              </li>
              <li>Classificação por pontos, depois saldo de games</li>
            </ul>
          </InfoCard>
        </>
      ) : (
        <FaseEliminatoriaReiDaPraia
          etapaId={etapaId}
          arenaId={arenaId || ""}
          grupos={grupos}
          etapaTipoChaveamento={tipoChaveamento}
        />
      )}
    </Container>
  );
};

export default ChavesReiDaPraia;
