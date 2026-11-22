/**
 * Ranking de um gênero, com uma aba por nível
 */

import React, { useState } from "react";
import styled from "styled-components";
import LoadingSpinner from "@/components/common/LoadingSpinner/LoadingSpinner";
import { SecaoPublica } from "@/components/torneio";
import { Alert, Badge, Button, EmptyState, Tabs } from "@/components/ui";
import { JogadorPublico } from "@/services/arenaPublicService";
import { theme } from "@/styles/theme";
import { GeneroJogador, NivelJogador } from "@/types/jogador";
import { getGeneroLabel, getNivelLabel } from "@/utils/formatters";
import { RankingItem } from "./RankingItem";

interface RankingPorGeneroProps {
  genero: GeneroJogador.MASCULINO | GeneroJogador.FEMININO;
  arenaSlug?: string;
  limitPorNivel: number;
  showPagination: boolean;
  itensPorPagina: number;
  getRanking: (genero: GeneroJogador, nivel: NivelJogador) => JogadorPublico[];
  getContador: (genero: GeneroJogador, nivel: NivelJogador) => number;
  loading: boolean;
  error: string | null;
}

const Conteudo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[4]};
`;

const Lista = styled.ol`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[2]};
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Carregando = styled.div`
  padding: ${theme.spacing[8]} 0;
`;

const Paginacao = styled.nav`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing[3]};
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.semantic.texto.secundario};
`;

const RotuloAba = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing[2]};
`;

export const RankingPorGenero: React.FC<RankingPorGeneroProps> = ({
  genero,
  arenaSlug,
  limitPorNivel,
  showPagination,
  itensPorPagina,
  getRanking,
  getContador,
  loading,
  error,
}) => {
  const [nivelAtivo, setNivelAtivo] = useState<NivelJogador>(
    NivelJogador.INTERMEDIARIO
  );
  const [pagina, setPagina] = useState(1);

  const titulo = `Ranking ${getGeneroLabel(genero)}`;
  const rankingCompleto = getRanking(genero, nivelAtivo);
  const totalPaginas = Math.ceil(rankingCompleto.length / itensPorPagina);
  const inicio = showPagination ? (pagina - 1) * itensPorPagina : 0;
  const ranking = rankingCompleto.slice(
    inicio,
    inicio + (showPagination ? itensPorPagina : limitPorNivel)
  );

  const handleNivelChange = (nivel: NivelJogador) => {
    setPagina(1);
    setNivelAtivo(nivel);
  };

  const renderRanking = () => {
    if (loading) {
      return (
        <Carregando>
          <LoadingSpinner message="Carregando..." />
        </Carregando>
      );
    }
    if (error) {
      return <Alert variant="error">{`Erro: ${error}`}</Alert>;
    }
    if (ranking.length === 0) {
      return (
        <EmptyState
          titulo={`Nenhum jogador ${getGeneroLabel(
            genero
          ).toLowerCase()} ${getNivelLabel(
            nivelAtivo
          ).toLowerCase()} ranqueado ainda.`}
        />
      );
    }

    return (
      <Lista>
        {ranking.map((jogador, index) => (
          <li key={jogador.id}>
            <RankingItem
              jogador={jogador}
              posicao={inicio + index + 1}
              arenaSlug={arenaSlug}
            />
          </li>
        ))}
      </Lista>
    );
  };

  return (
    <SecaoPublica
      titulo={titulo}
      selo={
        <Badge genero={genero} aria-hidden="true">
          {genero === GeneroJogador.MASCULINO ? "♂" : "♀"}
        </Badge>
      }
      descricao={
        showPagination
          ? `${rankingCompleto.length} jogadores - ${itensPorPagina} por página`
          : `Top ${limitPorNivel} jogadores por nível`
      }
    >
      <Conteudo>
        <Tabs
          rotulo={`Nível do ${titulo}`}
          abas={Object.values(NivelJogador).map((nivel) => ({
            id: nivel,
            label: (
              <RotuloAba>
                {getNivelLabel(nivel)}
                <Badge>{getContador(genero, nivel)}</Badge>
              </RotuloAba>
            ),
          }))}
          ativa={nivelAtivo}
          onChange={handleNivelChange}
        />

        {renderRanking()}

        {!loading && !error && showPagination && totalPaginas > 1 && (
          <Paginacao aria-label={`Páginas do ${titulo}`}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagina(pagina - 1)}
              disabled={pagina === 1}
            >
              ← Anterior
            </Button>
            <span>{`Página ${pagina} de ${totalPaginas}`}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagina(pagina + 1)}
              disabled={pagina >= totalPaginas}
            >
              Próxima →
            </Button>
          </Paginacao>
        )}
      </Conteudo>
    </SecaoPublica>
  );
};
