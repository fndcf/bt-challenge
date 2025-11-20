/**
 * RankingList - Componente reutilizável de ranking
 * Pode ser usado em qualquer lugar: Dashboard, ArenaPublica, página dedicada
 */

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { arenaService, JogadorPublico } from "../services/arenaService";

// ============== TIPOS ==============

interface RankingListProps {
  arenaSlug?: string; // Slug da arena
  limit?: number; // Quantos jogadores mostrar por página (padrão: 10)
  showPagination?: boolean; // Mostrar paginação? (padrão: true)
  showHeader?: boolean; // Mostrar header com título? (padrão: true)
  title?: string; // Título customizado (padrão: "🏅 Ranking de Jogadores")
  emptyMessage?: string; // Mensagem quando vazio
  className?: string; // Para estilização externa
}

// ============== STYLED COMPONENTS ==============

const Container = styled.div`
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
  justify-content: space-between;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    margin-bottom: 1rem;
  }
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 768px) {
    font-size: 1.125rem;
  }
`;

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
    flex-wrap: wrap; /* ✅ NOVO: Permite quebra de linha no mobile */
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

  @media (max-width: 768px) {
    flex: 1 1 100%; /* ✅ NOVO: Ocupa linha inteira no mobile */
  }
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

const RankingNivel = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.25rem;

  @media (max-width: 768px) {
    font-size: 0.8125rem;
  }
`;

const RankingPontos = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 600;
  color: #667eea;
  font-size: 0.875rem;
  white-space: nowrap;

  @media (max-width: 768px) {
    font-size: 0.8125rem;
  }
`;
const RankingStats = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;

  @media (min-width: 768px) {
    margin-top: 0;
    margin-left: auto;
    padding-left: 1rem;
  }
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
  min-width: 50px;

  @media (max-width: 768px) {
    min-width: 45px;
  }
`;

const StatValue = styled.div`
  font-size: 0.875rem;
  font-weight: 700;
  color: #111827;

  @media (max-width: 768px) {
    font-size: 0.8125rem;
  }
`;

const StatLabel = styled.div`
  font-size: 0.625rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.025em;

  @media (max-width: 768px) {
    font-size: 0.5625rem;
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

  p {
    margin: 0 0 1rem 0;
    font-size: 0.875rem;
  }

  a {
    color: #667eea;
    text-decoration: none;
    font-weight: 600;

    &:hover {
      color: #5568d3;
    }
  }
`;

const ErrorContainer = styled.div`
  text-align: center;
  padding: 2rem;
  color: #dc2626;

  p {
    margin: 0;
    font-size: 0.875rem;
  }
`;

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
    border-color: #667eea;
    color: #667eea;
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

// ============== COMPONENTE ==============

const RankingListComponent: React.FC<RankingListProps> = ({
  arenaSlug,
  limit = 10,
  showPagination = true,
  showHeader = true,
  title = "🏅 Ranking de Jogadores",
  emptyMessage = "Nenhum jogador ranqueado ainda.",
  className,
}) => {
  const [ranking, setRanking] = useState<JogadorPublico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  // Carregar ranking
  useEffect(() => {
    const carregarRanking = async () => {
      // Se não tem arena slug, apenas não carrega (não mostra erro)
      if (!arenaSlug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // Se quer paginar, busca limit * 10 (ou um número grande)
        // Se não quer paginar, busca só o limit
        const totalParaBuscar = showPagination ? 999 : limit;

        const rankingData = await arenaService.getRankingPublico(
          arenaSlug,
          totalParaBuscar
        );

        const rankingPaginado = showPagination
          ? rankingData.slice(offset, offset + limit)
          : rankingData.slice(0, limit);

        setRanking(rankingPaginado);
        setTotal(rankingData.length);
      } catch (err: any) {
        console.error("Erro ao carregar ranking:", err);
        setError(err.message || "Erro ao carregar ranking");
      } finally {
        setLoading(false);
      }
    };

    carregarRanking();
  }, [arenaSlug, limit, offset, showPagination]);

  // Handlers de paginação
  const handleAnterior = () => {
    if (offset > 0) {
      setOffset(offset - limit);
    }
  };

  const handleProxima = () => {
    setOffset(offset + limit);
  };

  const paginaAtual = Math.floor(offset / limit) + 1;
  const totalPaginas = Math.ceil(total / limit);
  const temProxima = offset + limit < total;

  return (
    <Container className={className}>
      {/* Header */}
      {showHeader && (
        <Header>
          <Title>{title}</Title>
        </Header>
      )}

      {/* Loading */}
      {loading && <LoadingContainer>Carregando ranking...</LoadingContainer>}

      {/* Error */}
      {!loading && error && (
        <ErrorContainer>
          <p>{error}</p>
        </ErrorContainer>
      )}

      {/* Empty */}
      {!loading && !error && ranking.length === 0 && (
        <EmptyContainer>
          <p>{emptyMessage}</p>
        </EmptyContainer>
      )}

      {/* Lista */}
      {!loading && !error && ranking.length > 0 && (
        <>
          <RankingList>
            {ranking.map((jogador, index) => {
              const posicao = offset + index + 1;

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
                  <RankingPosicao $posicao={posicao}>
                    {posicao <= 3 ? (
                      <>
                        {posicao === 1 && "🥇"}
                        {posicao === 2 && "🥈"}
                        {posicao === 3 && "🥉"}
                      </>
                    ) : (
                      posicao
                    )}
                  </RankingPosicao>

                  {/* Info básica */}
                  <RankingInfo>
                    <RankingNome>
                      {jogador.jogadorNome ||
                        jogador.nome ||
                        `Jogador #${posicao}`}
                    </RankingNome>
                    {(jogador.jogadorNivel || jogador.nivel) && (
                      <RankingNivel>
                        Nível: {jogador.jogadorNivel || jogador.nivel}
                      </RankingNivel>
                    )}
                  </RankingInfo>

                  {/* ✅ NOVO: Estatísticas detalhadas */}
                  <RankingStats>
                    {/* Etapas */}
                    {jogador.etapasParticipadas !== undefined && (
                      <StatItem>
                        <StatValue>{jogador.etapasParticipadas}</StatValue>
                        <StatLabel>Etapas</StatLabel>
                      </StatItem>
                    )}

                    {/* Vitórias */}
                    {jogador.vitorias !== undefined && (
                      <StatItem>
                        <StatValue style={{ color: "#16a34a" }}>
                          {jogador.vitorias}
                        </StatValue>
                        <StatLabel>V</StatLabel>
                      </StatItem>
                    )}

                    {/* Derrotas */}
                    {jogador.derrotas !== undefined && (
                      <StatItem>
                        <StatValue style={{ color: "#dc2626" }}>
                          {jogador.derrotas}
                        </StatValue>
                        <StatLabel>D</StatLabel>
                      </StatItem>
                    )}

                    {/* Pontos */}
                    {(jogador.pontos !== undefined ||
                      jogador.ranking !== undefined) && (
                      <StatItem>
                        <StatValue
                          style={{ color: "#667eea", fontWeight: 800 }}
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
          {showPagination && total > limit && (
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
    </Container>
  );
};

export default RankingListComponent;
