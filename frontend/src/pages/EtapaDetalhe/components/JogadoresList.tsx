/**
 * JogadoresList.tsx
 *
 * Responsabilidade única: Card com lista paginada de jogadores inscritos
 */

import React, { useState, useMemo } from "react";
import { JogadorPublico } from "@/services/arenaPublicService";
import * as S from "../EtapaDetalhe.styles";

export interface JogadoresListProps {
  slug: string;
  jogadores: JogadorPublico[];
  itensPorPagina?: number;
}

export const JogadoresList: React.FC<JogadoresListProps> = ({
  slug,
  jogadores,
  itensPorPagina = 10,
}) => {
  const [paginaAtual, setPaginaAtual] = useState(1);

  // Calcular paginação
  const totalPaginas = Math.ceil(jogadores.length / itensPorPagina);
  const indiceInicio = (paginaAtual - 1) * itensPorPagina;
  const indiceFim = indiceInicio + itensPorPagina;

  // Jogadores da página atual
  const jogadoresPaginados = useMemo(() => {
    return jogadores.slice(indiceInicio, indiceFim);
  }, [jogadores, indiceInicio, indiceFim]);

  // Handlers
  const irParaPagina = (pagina: number) => {
    if (pagina >= 1 && pagina <= totalPaginas) {
      setPaginaAtual(pagina);
    }
  };

  const proximaPagina = () => irParaPagina(paginaAtual + 1);
  const paginaAnterior = () => irParaPagina(paginaAtual - 1);

  return (
    <S.Card>
      <S.CardHeader>
        <S.CardTitle>Jogadores Inscritos ({jogadores.length})</S.CardTitle>
      </S.CardHeader>

      {jogadores.length === 0 ? (
        <S.EmptyBox>
          <S.EmptyText>Nenhum jogador inscrito</S.EmptyText>
        </S.EmptyBox>
      ) : (
        <>
          <S.PlayersList>
            {jogadoresPaginados.map((player, idx) => {
              const numeroGlobal = indiceInicio + idx + 1;
              return (
                <S.PlayerItem
                  key={player.id}
                  to={`/arena/${slug}/jogador/${player.id}`}
                >
                  <S.PlayerNum>{player.seed || numeroGlobal}</S.PlayerNum>
                  <S.PlayerInfo>
                    <S.PlayerName>{player.nome}</S.PlayerName>
                    {player.ranking && (
                      <S.PlayerRank>Ranking: #{player.ranking}</S.PlayerRank>
                    )}
                  </S.PlayerInfo>
                </S.PlayerItem>
              );
            })}
          </S.PlayersList>

          {/* Paginação - só exibe se houver mais de uma página */}
          {totalPaginas > 1 && (
            <S.PaginationContainer>
              <S.PaginationInfo>
                Mostrando {indiceInicio + 1}-
                {Math.min(indiceFim, jogadores.length)} de {jogadores.length}
              </S.PaginationInfo>

              <S.PaginationButtons>
                <S.PaginationButton
                  onClick={paginaAnterior}
                  disabled={paginaAtual === 1}
                  aria-label="Página anterior"
                >
                  ←
                </S.PaginationButton>

                {/* Páginas visíveis */}
                {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                  .filter((p) => {
                    // Mostrar: primeira, última, atual, e adjacentes
                    if (p === 1 || p === totalPaginas) return true;
                    if (Math.abs(p - paginaAtual) <= 1) return true;
                    return false;
                  })
                  .map((pagina, idx, array) => {
                    // Adicionar "..." se houver gap
                    const items = [];
                    if (idx > 0 && pagina - array[idx - 1] > 1) {
                      items.push(
                        <S.PaginationInfo key={`gap-${pagina}`}>
                          ...
                        </S.PaginationInfo>
                      );
                    }
                    items.push(
                      <S.PaginationButton
                        key={pagina}
                        $active={pagina === paginaAtual}
                        onClick={() => irParaPagina(pagina)}
                      >
                        {pagina}
                      </S.PaginationButton>
                    );
                    return items;
                  })}

                <S.PaginationButton
                  onClick={proximaPagina}
                  disabled={paginaAtual === totalPaginas}
                  aria-label="Próxima página"
                >
                  →
                </S.PaginationButton>
              </S.PaginationButtons>
            </S.PaginationContainer>
          )}
        </>
      )}
    </S.Card>
  );
};

export default JogadoresList;
