import React from "react";
import styled from "styled-components";
import { theme } from "@/styles/theme";
import { GeneroJogador } from "@/types/jogador";
import { RankingPorGenero } from "./components/RankingPorGenero";
import { useRankingCache } from "./useRankingCache";

interface RankingListProps {
  arenaSlug?: string;
  /** Top X quando não há paginação */
  limitPorNivel?: number;
  /** Mostra todos, com paginação */
  showPagination?: boolean;
  itensPorPagina?: number;
  className?: string;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[8]};
`;

const GENEROS = [GeneroJogador.MASCULINO, GeneroJogador.FEMININO] as const;

const RankingList: React.FC<RankingListProps> = ({
  arenaSlug,
  limitPorNivel = 10,
  showPagination = false,
  itensPorPagina = 20,
  className,
}) => {
  // Cache compartilhado: carrega todos os níveis e gêneros de uma vez
  const { getRanking, getContador, loading, error } = useRankingCache({
    arenaSlug,
  });

  return (
    <Container className={className}>
      {GENEROS.map((genero) => (
        <RankingPorGenero
          key={genero}
          genero={genero}
          arenaSlug={arenaSlug}
          limitPorNivel={limitPorNivel}
          showPagination={showPagination}
          itensPorPagina={itensPorPagina}
          getRanking={getRanking}
          getContador={getContador}
          loading={loading}
          error={error}
        />
      ))}
    </Container>
  );
};

export default RankingList;
