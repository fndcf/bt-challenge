import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { GeneroJogador, NivelJogador } from "@/types/jogador";
import { getArenaPublicService } from "@/services";
import { JogadorPublico } from "@/services/arenaPublicService";

// ============== TIPOS ==============

interface RankingListProps {
  arenaSlug?: string;
  limitPorNivel?: number; // Top X quando showPagination=false (padrão: 10)
  showPagination?: boolean; // Mostrar todos com paginação? (padrão: false)
  itensPorPagina?: number; // Quantos por página quando showPagination=true (padrão: 20)
  className?: string;
}

// ============== STYLED COMPONENTS ==============

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const RankingSection = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
`;

const HeaderContent = styled.div`
  flex: 1;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;

  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const Subtitle = styled.p`
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: #6b7280;
`;

// ============== TABS ==============

const TabsContainer = styled.div`
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #e5e7eb;

  @media (max-width: 768px) {
    border-bottom: none;
  }
`;

const TabsList = styled.div`
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: #f3f4f6;
  }

  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 2px;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
    overflow-x: visible;
  }
`;

const Tab = styled.button<{ $active: boolean; $genero: GeneroJogador }>`
  padding: 0.75rem 1.25rem;
  border: none;
  background: none;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  position: relative;

  @media (min-width: 769px) {
    border-bottom: 3px solid transparent;
    color: ${(props) => (props.$active ? "#111827" : "#6b7280")};

    &:hover {
      color: #111827;
    }

    ${(props) =>
      props.$active &&
      (props.$genero === GeneroJogador.MASCULINO
        ? `border-bottom-color: #3b82f6;`
        : `border-bottom-color: #ec4899;`)}
  }

  @media (max-width: 768px) {
    width: 100%;
    padding: 0.875rem 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    text-align: left;
    display: flex;
    align-items: center;
    justify-content: space-between;

    ${(props) =>
      props.$active
        ? props.$genero === GeneroJogador.MASCULINO
          ? `
        background: #eff6ff;
        border-color: #3b82f6;
        color: #1e40af;
      `
          : `
        background: #fce7f3;
        border-color: #ec4899;
        color: #be185d;
      `
        : `
        background: white;
        color: #374151;
      `}

    &:hover {
      ${(props) => !props.$active && `background: #f9fafb;`}
    }
  }
`;

const TabBadge = styled.span<{ $genero: GeneroJogador }>`
  margin-left: 0.5rem;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;

  ${(props) =>
    props.$genero === GeneroJogador.MASCULINO
      ? `
    background: #dbeafe;
    color: #1e40af;
  `
      : `
    background: #fce7f3;
    color: #be185d;
  `}

  @media (max-width: 768px) {
    margin-left: auto;
  }
`;

// ============== RANKING LIST ==============

const RankingList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const RankingItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    transform: translateX(4px);
  }

  @media (max-width: 768px) {
    padding: 0.875rem;
    gap: 0.75rem;
  }
`;

const RankingPosicao = styled.div<{ $posicao: number }>`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;

  ${(props) => {
    if (props.$posicao === 1) {
      return `
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        color: white;
        font-size: 1.25rem;
      `;
    } else if (props.$posicao === 2) {
      return `
        background: linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%);
        color: white;
      `;
    } else if (props.$posicao === 3) {
      return `
        background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
        color: white;
      `;
    } else {
      return `
        background: #e5e7eb;
        color: #374151;
      `;
    }
  }}

  @media (max-width: 768px) {
    width: 2rem;
    height: 2rem;
    font-size: 0.875rem;
  }
`;

const RankingInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const RankingNome = styled.div`
  font-weight: 600;
  color: #111827;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 768px) {
    font-size: 0.9375rem;
  }
`;

const RankingStats = styled.div`
  display: flex;
  gap: 1rem;
  flex-shrink: 0;

  @media (max-width: 768px) {
    gap: 0.375rem;
  }
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
  min-width: 50px;

  @media (max-width: 768px) {
    min-width: 28px;
  }
`;

const StatValue = styled.div`
  font-size: 0.875rem;
  font-weight: 700;
  color: #111827;

  @media (max-width: 768px) {
    font-size: 0.75rem;
  }
`;

const StatLabel = styled.div`
  font-size: 0.625rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.025em;

  @media (max-width: 768px) {
    font-size: 0.5rem;
  }
`;

// ============== PAGINAÇÃO ==============

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.75rem;
  }
`;

const PaginationButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: white;
  color: #374151;
  padding: 0.625rem 1.25rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 120px;

  &:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #134e5e;
    color: #134e5e;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const PaginationInfo = styled.span`
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;

  @media (max-width: 768px) {
    order: -1;
  }
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  font-size: 0.875rem;
`;

const EmptyContainer = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  font-size: 0.875rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px dashed #d1d5db;
`;

// ============== COMPONENTE INDIVIDUAL ==============

interface RankingPorGeneroProps {
  genero: GeneroJogador;
  arenaSlug?: string;
  limitPorNivel?: number;
  showPagination?: boolean;
  itensPorPagina?: number;
}

const RankingPorGenero: React.FC<RankingPorGeneroProps> = ({
  genero,
  arenaSlug,
  limitPorNivel = 10,
  showPagination = false,
  itensPorPagina = 20,
}) => {
  const arenaPublicService = getArenaPublicService();
  const [nivelAtivo, setNivelAtivo] = useState<NivelJogador>(
    NivelJogador.INTERMEDIARIO
  );
  const [ranking, setRanking] = useState<JogadorPublico[]>([]);
  const [rankingCompleto, setRankingCompleto] = useState<JogadorPublico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [offset, setOffset] = useState(0);
  const [contadores, setContadores] = useState<Record<NivelJogador, number>>({
    [NivelJogador.INICIANTE]: 0,
    [NivelJogador.INTERMEDIARIO]: 0,
    [NivelJogador.AVANCADO]: 0,
  });

  useEffect(() => {
    setOffset(0); // Reset offset ao trocar de nível
    carregarRanking();
  }, [arenaSlug, genero, nivelAtivo]);

  const carregarRanking = async () => {
    if (!arenaSlug) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Buscar ranking completo filtrado por gênero e nível
      const rankingData = await arenaPublicService.buscarRanking(
        arenaSlug,
        999, // Buscar todos
        genero,
        nivelAtivo
      );

      setRankingCompleto(rankingData);

      // Se tem paginação, mostra slice; senão mostra limit
      if (showPagination) {
        setRanking(rankingData.slice(offset, offset + itensPorPagina));
      } else {
        setRanking(rankingData.slice(0, limitPorNivel));
      }

      // Buscar contadores para os badges
      const contadoresTemp: Record<NivelJogador, number> = {
        [NivelJogador.INICIANTE]: 0,
        [NivelJogador.INTERMEDIARIO]: 0,
        [NivelJogador.AVANCADO]: 0,
      };

      for (const nivel of Object.values(NivelJogador)) {
        const rankingNivel = await arenaPublicService.buscarRanking(
          arenaSlug,
          999,
          genero,
          nivel
        );
        contadoresTemp[nivel] = rankingNivel.length;
      }

      setContadores(contadoresTemp);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar ranking");
    } finally {
      setLoading(false);
    }
  };

  // Atualizar slice quando offset muda
  useEffect(() => {
    if (showPagination && rankingCompleto.length > 0) {
      setRanking(rankingCompleto.slice(offset, offset + itensPorPagina));
    }
  }, [offset, rankingCompleto, showPagination, itensPorPagina]);

  const getNivelLabel = (nivel: NivelJogador) => {
    const labels = {
      [NivelJogador.INICIANTE]: " Iniciante",
      [NivelJogador.INTERMEDIARIO]: " Intermediário",
      [NivelJogador.AVANCADO]: " Avançado",
    };
    return labels[nivel];
  };

  const handleAnterior = () => {
    if (offset > 0) {
      setOffset(offset - itensPorPagina);
    }
  };

  const handleProxima = () => {
    if (offset + itensPorPagina < rankingCompleto.length) {
      setOffset(offset + itensPorPagina);
    }
  };

  const paginaAtual = Math.floor(offset / itensPorPagina) + 1;
  const totalPaginas = Math.ceil(rankingCompleto.length / itensPorPagina);
  const temProxima = offset + itensPorPagina < rankingCompleto.length;

  return (
    <RankingSection>
      {/* Header */}
      <Header>
        <HeaderContent>
          <Title>
            Ranking{" "}
            {genero === GeneroJogador.MASCULINO ? "Masculino" : "Feminino"}
          </Title>
          <Subtitle>
            {showPagination
              ? `${rankingCompleto.length} jogadores - ${itensPorPagina} por página`
              : `Top ${limitPorNivel} jogadores por nível`}
          </Subtitle>
        </HeaderContent>
      </Header>

      {/* Tabs de Nível */}
      <TabsContainer>
        <TabsList>
          {Object.values(NivelJogador).map((nivel) => (
            <Tab
              key={nivel}
              $active={nivelAtivo === nivel}
              $genero={genero}
              onClick={() => setNivelAtivo(nivel)}
            >
              <span>{getNivelLabel(nivel)}</span>
              <TabBadge $genero={genero}>{contadores[nivel]}</TabBadge>
            </Tab>
          ))}
        </TabsList>
      </TabsContainer>

      {/* Conteúdo */}
      {loading && <LoadingContainer>Carregando...</LoadingContainer>}

      {!loading && error && <EmptyContainer>Erro: {error}</EmptyContainer>}

      {!loading && !error && ranking.length === 0 && (
        <EmptyContainer>
          Nenhum jogador {genero.toLowerCase()} {nivelAtivo.toLowerCase()}{" "}
          ranqueado ainda.
        </EmptyContainer>
      )}

      {!loading && !error && ranking.length > 0 && (
        <>
          <RankingList>
            {ranking.map((jogador, index) => {
              // Posição real considerando offset
              const posicaoReal = offset + index + 1;

              return (
                <RankingItem
                  key={jogador.id}
                  to={
                    arenaSlug
                      ? `/arena/${arenaSlug}/jogador/${
                          jogador.jogadorId || jogador.id
                        }`
                      : "#"
                  }
                >
                  {/* Posição */}
                  <RankingPosicao $posicao={posicaoReal}>
                    {posicaoReal <= 3 ? (
                      <>
                        {posicaoReal === 1 && "1"}
                        {posicaoReal === 2 && "2"}
                        {posicaoReal === 3 && "3"}
                      </>
                    ) : (
                      posicaoReal
                    )}
                  </RankingPosicao>

                  {/* Info */}
                  <RankingInfo>
                    <RankingNome>
                      {jogador.jogadorNome ||
                        jogador.nome ||
                        `Jogador #${posicaoReal}`}
                    </RankingNome>
                  </RankingInfo>

                  {/* Stats */}
                  <RankingStats>
                    {jogador.etapasParticipadas !== undefined && (
                      <StatItem>
                        <StatValue>{jogador.etapasParticipadas}</StatValue>
                        <StatLabel>Etapas</StatLabel>
                      </StatItem>
                    )}

                    {jogador.vitorias !== undefined && (
                      <StatItem>
                        <StatValue style={{ color: "#16a34a" }}>
                          {jogador.vitorias}
                        </StatValue>
                        <StatLabel>V</StatLabel>
                      </StatItem>
                    )}

                    {jogador.derrotas !== undefined && (
                      <StatItem>
                        <StatValue style={{ color: "#dc2626" }}>
                          {jogador.derrotas}
                        </StatValue>
                        <StatLabel>D</StatLabel>
                      </StatItem>
                    )}

                    {(jogador.pontos !== undefined ||
                      jogador.ranking !== undefined) && (
                      <StatItem>
                        <StatValue
                          style={{ color: "#134e5e", fontWeight: 800 }}
                        >
                          {jogador.pontos || jogador.ranking}
                        </StatValue>
                        <StatLabel>Pts</StatLabel>
                      </StatItem>
                    )}
                  </RankingStats>
                </RankingItem>
              );
            })}
          </RankingList>

          {/* Paginação */}
          {showPagination && rankingCompleto.length > itensPorPagina && (
            <Pagination>
              <PaginationButton
                onClick={handleAnterior}
                disabled={offset === 0}
              >
                ← Anterior
              </PaginationButton>
              <PaginationInfo>
                Página {paginaAtual} de {totalPaginas}
              </PaginationInfo>
              <PaginationButton onClick={handleProxima} disabled={!temProxima}>
                Próxima →
              </PaginationButton>
            </Pagination>
          )}
        </>
      )}
    </RankingSection>
  );
};

// ============== COMPONENTE PRINCIPAL ==============

const RankingListComponent: React.FC<RankingListProps> = ({
  arenaSlug,
  limitPorNivel = 10,
  showPagination = false,
  itensPorPagina = 20,
  className,
}) => {
  return (
    <Container className={className}>
      {/* Ranking Masculino */}
      <RankingPorGenero
        genero={GeneroJogador.MASCULINO}
        arenaSlug={arenaSlug}
        limitPorNivel={limitPorNivel}
        showPagination={showPagination}
        itensPorPagina={itensPorPagina}
      />

      {/* Ranking Feminino */}
      <RankingPorGenero
        genero={GeneroJogador.FEMININO}
        arenaSlug={arenaSlug}
        limitPorNivel={limitPorNivel}
        showPagination={showPagination}
        itensPorPagina={itensPorPagina}
      />
    </Container>
  );
};

export default RankingListComponent;
