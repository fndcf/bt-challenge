/**
 * ChavesEtapa - Versão responsiva e equilibrada
 */

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import chaveService from "@/services/chaveService";
import { Dupla, Grupo } from "@/types/chave";
import { PartidasGrupo } from "../PartidasGrupo";
import { FaseEliminatoria } from "../FaseEliminatoria";
import etapaService from "@/services/etapaService";

interface ChavesEtapaProps {
  etapaId: string;
  arenaId?: string;
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
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 2rem;

  /* MOBILE: Remove borda */
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

  /* MOBILE: Layout vertical */
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
    ${(props) => (props.$isActive ? "#2563eb" : "transparent")};
  color: ${(props) => (props.$isActive ? "#2563eb" : "#6b7280")};
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    color: #2563eb;
  }

  /* MOBILE: Botões verticais */
  @media (max-width: 768px) {
    width: 100%;
    padding: 0.875rem 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    text-align: left;
    background: ${(props) => (props.$isActive ? "#eff6ff" : "white")};
    border-color: ${(props) => (props.$isActive ? "#2563eb" : "#e5e7eb")};
    border-bottom: 1px solid
      ${(props) => (props.$isActive ? "#2563eb" : "#e5e7eb")};

    &:hover {
      background: ${(props) => (props.$isActive ? "#eff6ff" : "#f9fafb")};
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

  /* TABLET: Também 2 colunas (antes era só a partir de 1024px) */
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const GrupoCard = styled.div`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid #e5e7eb;
`;

const GrupoHeader = styled.div`
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
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

const DuplasList = styled.div`
  > * + * {
    border-top: 1px solid #f3f4f6;
  }
`;

const DuplaItem = styled.div`
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

const DuplaContent = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  /* DESKTOP: Só fica horizontal a partir de 1024px */
  @media (min-width: 1025px) {
    align-items: flex-start;
    justify-content: space-between;
    gap: 2rem;
  }
`;

const DuplaInfo = styled.div`
  min-width: 0;

  @media (min-width: 1024px) {
    flex: 1 1 65%;
    max-width: 75%;
  }
`;

const JogadoresNome = styled.div`
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

  /* TABLET: Linha única se couber */
  @media (min-width: 768px) and (max-width: 1023px) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  /* DESKTOP: Pode quebrar normalmente */
  @media (min-width: 1024px) {
    white-space: normal;
  }
`;

const NivelText = styled.div`
  font-size: 0.8125rem;
  color: #6b7280;
`;

// Estatísticas em GRID 2x2 no mobile, inline no desktop
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;

  /* DESKTOP: Inline só a partir de 1024px */
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
  background: #2563eb;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.2s;

  &:hover {
    background: #1d4ed8;
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
`;

// ============== COMPONENTE ==============

export const ChavesEtapa: React.FC<ChavesEtapaProps> = ({
  etapaId,
  arenaId,
}) => {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [duplas, setDuplas] = useState<Dupla[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grupoSelecionado, setGrupoSelecionado] = useState<string | null>(null);
  const [eliminatoriaExiste, setEliminatoriaExiste] = useState(false);
  const [etapaFinalizada, setEtapaFinalizada] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>("grupos");

  useEffect(() => {
    carregarChaves();
  }, [etapaId, abaAtiva]);

  const carregarChaves = async () => {
    try {
      setLoading(true);
      setError(null);

      const [gruposData, duplasData] = await Promise.all([
        chaveService.buscarGrupos(etapaId),
        chaveService.buscarDuplas(etapaId),
      ]);

      setGrupos(gruposData);
      setDuplas(duplasData);

      try {
        const etapa = await etapaService.buscarPorId(etapaId);
        if (etapa) {
          setEtapaFinalizada(etapa.status === "finalizada");
        }
      } catch {}

      try {
        const confrontos = await chaveService.buscarConfrontosEliminatorios(
          etapaId
        );
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
        <EmptyState> Nenhuma chave gerada ainda</EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <TabsContainer>
        <TabsList>
          <Tab
            $isActive={abaAtiva === "grupos"}
            onClick={() => setAbaAtiva("grupos")}
          >
            Fase de Grupos
          </Tab>
          <Tab
            $isActive={abaAtiva === "eliminatoria"}
            onClick={() => setAbaAtiva("eliminatoria")}
          >
            Eliminatória
          </Tab>
        </TabsList>
      </TabsContainer>

      {abaAtiva === "grupos" ? (
        <>
          <Header>
            <Title>Grupos e Duplas</Title>
            <Stats>
              {grupos.length} grupos • {duplas.length} duplas
            </Stats>
          </Header>

          <GruposGrid>
            {grupos.map((grupo) => {
              const duplasDoGrupo = duplas.filter(
                (d) => d.grupoId === grupo.id
              );

              return (
                <GrupoCard key={grupo.id}>
                  <GrupoHeader>
                    <GrupoNome>{grupo.nome}</GrupoNome>
                    <GrupoBadge>{duplasDoGrupo.length} duplas</GrupoBadge>
                  </GrupoHeader>

                  <DuplasList>
                    {duplasDoGrupo.length === 0 ? (
                      <EmptyState>Nenhuma dupla neste grupo</EmptyState>
                    ) : (
                      duplasDoGrupo
                        // ============== ORDENAÇÃO ==============
                        .sort((a, b) => {
                          //  Se tem posição definida pelo backend, usar ela!
                          if (
                            a.posicaoGrupo !== undefined &&
                            b.posicaoGrupo !== undefined
                          ) {
                            return a.posicaoGrupo - b.posicaoGrupo;
                          }

                          // ⚠️ FALLBACK: Se posicaoGrupo não existe ainda
                          // 1. Pontos
                          if (a.pontos !== b.pontos) {
                            return b.pontos - a.pontos;
                          }

                          // 2. Saldo de games
                          if (a.saldoGames !== b.saldoGames) {
                            return b.saldoGames - a.saldoGames;
                          }

                          // 3. Saldo de sets
                          if (a.saldoSets !== b.saldoSets) {
                            return b.saldoSets - a.saldoSets;
                          }

                          // 4. Games vencidos
                          if (a.gamesVencidos !== b.gamesVencidos) {
                            return b.gamesVencidos - a.gamesVencidos;
                          }

                          // 5. Desempate final: ordem alfabética
                          const nomeA = `${a.jogador1Nome} & ${a.jogador2Nome}`;
                          const nomeB = `${b.jogador1Nome} & ${b.jogador2Nome}`;
                          return nomeA.localeCompare(nomeB);
                        })
                        // ============== RENDERIZAÇÃO ==============
                        .map((dupla, index) => (
                          <DuplaItem key={dupla.id}>
                            <PosicaoBadge>{index + 1}</PosicaoBadge>

                            <DuplaContent>
                              <DuplaInfo>
                                <JogadoresNome>
                                  {dupla.jogador1Nome} & {dupla.jogador2Nome}
                                </JogadoresNome>
                                <NivelText>
                                  Nível: {dupla.jogador1Nivel}
                                </NivelText>
                              </DuplaInfo>

                              {dupla.jogos > 0 && (
                                <StatsGrid>
                                  <StatItem>
                                    <StatLabel>PTS</StatLabel>
                                    <StatValue $variant="primary">
                                      {dupla.pontos}
                                    </StatValue>
                                  </StatItem>

                                  <StatItem>
                                    <StatLabel>V-D</StatLabel>
                                    <StatValue>
                                      {dupla.vitorias}-{dupla.derrotas}
                                    </StatValue>
                                  </StatItem>

                                  <StatItem>
                                    <StatLabel>GF-GC</StatLabel>
                                    <StatValue>
                                      {dupla.gamesVencidos}-
                                      {dupla.gamesPerdidos}
                                    </StatValue>
                                  </StatItem>

                                  <StatItem>
                                    <StatLabel>SG</StatLabel>
                                    <StatValue
                                      $variant={
                                        dupla.saldoGames > 0
                                          ? "success"
                                          : dupla.saldoGames < 0
                                          ? "error"
                                          : "neutral"
                                      }
                                    >
                                      {dupla.saldoGames > 0 ? "+" : ""}
                                      {dupla.saldoGames}
                                    </StatValue>
                                  </StatItem>
                                </StatsGrid>
                              )}
                            </DuplaContent>
                          </DuplaItem>
                        ))
                    )}
                  </DuplasList>

                  <GrupoFooter>
                    <FooterInfo>
                      <span>
                        {grupo.partidasFinalizadas} / {grupo.totalPartidas}{" "}
                        partidas
                      </span>
                      {grupo.completo && (
                        <CompletoBadge> Completo</CompletoBadge>
                      )}
                    </FooterInfo>

                    <VerPartidasButton onClick={() => toggleGrupo(grupo.id)}>
                      {grupoSelecionado === grupo.id
                        ? " Ocultar Partidas"
                        : " Ver Partidas"}
                    </VerPartidasButton>

                    {grupoSelecionado === grupo.id && (
                      <PartidasContainer>
                        <PartidasGrupo
                          etapaId={etapaId}
                          grupoId={grupo.id}
                          grupoNome={grupo.nome}
                          onAtualizarGrupos={carregarChaves}
                          eliminatoriaExiste={eliminatoriaExiste}
                          etapaFinalizada={etapaFinalizada}
                        />
                      </PartidasContainer>
                    )}
                  </GrupoFooter>
                </GrupoCard>
              );
            })}
          </GruposGrid>

          <InfoCard>
            <h4> Fase de Grupos</h4>
            <p>
              Cada dupla joga contra todas as outras duplas do seu grupo. As
              duplas com melhor campanha classificam para a próxima fase.
            </p>
          </InfoCard>
        </>
      ) : (
        <FaseEliminatoria
          etapaId={etapaId}
          arenaId={arenaId || ""}
          grupos={grupos}
        />
      )}
    </Container>
  );
};

export default ChavesEtapa;
