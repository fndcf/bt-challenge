import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { getSuperXService } from "@/services";
import { Grupo } from "@/types/chave";
import { EstatisticasJogador } from "@/types/reiDaPraia";
import { VarianteSuperX } from "@/types/etapa";
import { PartidasSuperX } from "../PartidasSuperX";
import { LoadingOverlay } from "@/components/ui";

interface ChavesSuperXProps {
  etapaId: string;
  arenaId?: string;
  varianteSuperX?: VarianteSuperX;
  etapaFinalizada?: boolean;
}

// ============== STYLED COMPONENTS ==============

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;

  @media (min-width: 768px) {
    padding: 1.5rem;
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

const VarianteBadge = styled.span`
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
`;

const Stats = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const GrupoCard = styled.div`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid #e5e7eb;
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

const JogadorItem = styled.div`
  padding: 1.25rem;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  transition: background 0.2s;

  &:hover {
    background: #f9fafb;
  }

  @media (min-width: 768px) {
    align-items: center;
    gap: 1.5rem;
  }
`;

const PosicaoBadge = styled.div`
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  background: #dbeafe;
  color: #2563eb;
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
    align-items: flex-start;
    justify-content: space-between;
    gap: 2rem;
  }
`;

const JogadorInfo = styled.div`
  min-width: 0;

  @media (min-width: 1024px) {
    flex: 1 1 65%;
    max-width: 75%;
  }
`;

const JogadorNome = styled.div`
  font-weight: 600;
  color: #111827;
  font-size: 0.9375rem;
  margin-bottom: 0.25rem;
  overflow-wrap: break-word;
  word-wrap: break-word;
  hyphens: auto;

  @media (min-width: 768px) {
    font-size: 1rem;
  }

  @media (min-width: 768px) and (max-width: 1023px) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  @media (min-width: 1024px) {
    white-space: normal;
  }
`;

const JogadorMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const NivelText = styled.div`
  font-size: 0.8125rem;
  color: #6b7280;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;

  @media (min-width: 1024px) {
    display: flex;
    gap: 1.5rem;
  }
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  min-width: 60px;
`;

const StatLabel = styled.div`
  font-size: 0.6875rem;
  color: #9ca3af;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  @media (min-width: 768px) {
    font-size: 0.75rem;
  }
`;

const StatValue = styled.div<{
  $variant?: "primary" | "success" | "error" | "neutral";
}>`
  font-weight: 700;
  font-size: ${(props) =>
    props.$variant === "primary" ? "1.25rem" : "0.9375rem"};

  color: ${(props) => {
    switch (props.$variant) {
      case "primary":
        return "#2563eb";
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
      props.$variant === "primary" ? "1.5rem" : "1.125rem"};
  }
`;

const GrupoFooter = styled.div`
  background: #f9fafb;
  padding: 1rem 1.25rem;
  border-top: 1px solid #e5e7eb;
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
  background: #dcfce7;
  color: #15803d;
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
  border: 3px solid #dbeafe;
  border-top-color: #2563eb;
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
  background: #dbeafe;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1.5rem;

  h4 {
    color: #1e40af;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    font-size: 0.9375rem;
  }

  p {
    color: #1e40af;
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  ul {
    margin: 0.5rem 0 0 0;
    padding-left: 1.25rem;
    color: #1e40af;
    font-size: 0.875rem;
  }

  li {
    margin-top: 0.25rem;
  }
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

const getVarianteInfo = (
  variante?: VarianteSuperX
): { nome: string; rodadas: number } => {
  switch (variante) {
    case VarianteSuperX.SUPER_8:
      return { nome: "Super 8", rodadas: 7 };
    case VarianteSuperX.SUPER_12:
      return { nome: "Super 12", rodadas: 11 };
    default:
      return { nome: "Super X", rodadas: 0 };
  }
};

// ============== COMPONENTE ==============

export const ChavesSuperX: React.FC<ChavesSuperXProps> = ({
  etapaId,
  varianteSuperX,
  etapaFinalizada = false,
}) => {
  const superXService = getSuperXService();
  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [jogadores, setJogadores] = useState<EstatisticasJogador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarPartidas, setMostrarPartidas] = useState(false);

  // Estado global de loading para operações críticas que bloqueiam toda a tela
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalLoadingMessage, setGlobalLoadingMessage] = useState("");

  const varianteInfo = getVarianteInfo(varianteSuperX);

  useEffect(() => {
    carregarChaves();
  }, [etapaId]);

  const carregarChaves = async () => {
    try {
      setLoading(true);
      setError(null);

      const [grupoData, jogadoresData] = await Promise.all([
        superXService.buscarGrupo(etapaId),
        superXService.buscarJogadores(etapaId),
      ]);

      setGrupo(grupoData);
      setJogadores(jogadoresData);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar chaves");
    } finally {
      setLoading(false);
    }
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

  if (!grupo) {
    return (
      <Container>
        <EmptyState>Nenhuma chave gerada ainda</EmptyState>
      </Container>
    );
  }

  // Calcular total de partidas baseado na variante
  const totalPartidas =
    varianteSuperX === VarianteSuperX.SUPER_12
      ? varianteInfo.rodadas * 3 // Super 12: 3 partidas por rodada
      : varianteInfo.rodadas * 2; // Super 8: 2 partidas por rodada

  return (
    <Container>
      <Header>
        <Title>
          {varianteInfo.nome}
          <VarianteBadge>Grupo Unico</VarianteBadge>
        </Title>
        <Stats>
          {jogadores.length} jogadores • {varianteInfo.rodadas} rodadas •{" "}
          {totalPartidas} partidas
        </Stats>
      </Header>

      <GrupoCard>
        <GrupoHeader>
          <GrupoNome>{grupo.nome || "Grupo Principal"}</GrupoNome>
          <GrupoBadge>{jogadores.length} jogadores</GrupoBadge>
        </GrupoHeader>

        <JogadoresList>
          {jogadores.length === 0 ? (
            <EmptyState>Nenhum jogador neste grupo</EmptyState>
          ) : (
            jogadores
              // ============== ORDENACAO ==============
              .sort((a, b) => {
                // 1. Posicao do grupo (se definida pelo backend)
                if (
                  a.posicaoGrupo !== undefined &&
                  b.posicaoGrupo !== undefined
                ) {
                  return a.posicaoGrupo - b.posicaoGrupo;
                }

                // 2. Pontos (3 por vitoria)
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

                // 6. Alfabetico
                return a.jogadorNome.localeCompare(b.jogadorNome);
              })
              // ============== RENDERIZACAO ==============
              .map((jogador, index) => (
                <JogadorItem
                  key={
                    jogador.id || jogador.jogadorId || `${grupo.id}-${index}`
                  }
                >
                  <PosicaoBadge>{index + 1}</PosicaoBadge>

                  <JogadorContent>
                    <JogadorInfo>
                      <JogadorNome>{jogador.jogadorNome}</JogadorNome>
                      <JogadorMeta>
                        {jogador.jogadorNivel && (
                          <NivelText>
                            Nivel: {getNivelLabel(jogador.jogadorNivel)}
                          </NivelText>
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
                            {jogador.vitoriasGrupo}-{jogador.derrotasGrupo}
                          </StatValue>
                        </StatItem>

                        <StatItem>
                          <StatLabel>GF-GC</StatLabel>
                          <StatValue>
                            {jogador.gamesVencidosGrupo}-
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

        <GrupoFooter>
          <FooterInfo>
            <span>
              {grupo.partidasFinalizadas || 0} / {totalPartidas} partidas
            </span>
            {grupo.completo && <CompletoBadge>Completo</CompletoBadge>}
          </FooterInfo>

          <VerPartidasButton
            onClick={() => setMostrarPartidas(!mostrarPartidas)}
          >
            {mostrarPartidas ? "▼ Ocultar Partidas" : "Ver Partidas"}
          </VerPartidasButton>

          {mostrarPartidas && (
            <PartidasContainer>
              <PartidasSuperX
                etapaId={etapaId}
                grupoId={grupo.id}
                grupoNome={grupo.nome || "Grupo Principal"}
                onAtualizarGrupos={carregarChaves}
                etapaFinalizada={etapaFinalizada}
                setGlobalLoading={setGlobalLoading}
                setGlobalLoadingMessage={setGlobalLoadingMessage}
              />
            </PartidasContainer>
          )}
        </GrupoFooter>
      </GrupoCard>

      <InfoCard>
        <h4>Formato {varianteInfo.nome}</h4>
        <p>
          Torneio com grupo unico onde cada jogador forma duplas diferentes a
          cada rodada. Sao {varianteInfo.rodadas} rodadas, garantindo que cada
          jogador jogue com todos os outros como parceiro.
        </p>
        <ul>
          <li>
            Classificacao por pontos (3 por vitoria), depois saldo de games
          </li>
          <li>Todos os jogadores jogam em todas as rodadas</li>
          <li>Nao ha fase eliminatoria - o campeonato e decidido no grupo</li>
        </ul>
      </InfoCard>

      {/* Loading Overlay Global - Bloqueia toda a tela */}
      <LoadingOverlay isLoading={globalLoading} message={globalLoadingMessage} />
    </Container>
  );
};

export default ChavesSuperX;
