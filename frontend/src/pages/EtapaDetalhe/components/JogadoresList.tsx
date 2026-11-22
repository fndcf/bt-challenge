/**
 * Responsabilidade única: Card com lista paginada de jogadores inscritos
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { SecaoPublica } from "@/components/torneio";
import { EmptyState, Pagination } from "@/components/ui";
import { JogadorPublico } from "@/services/arenaPublicService";
import { theme } from "@/styles/theme";

export interface JogadoresListProps {
  slug: string;
  jogadores: JogadorPublico[];
  itensPorPagina?: number;
}

const { texto, superficie, acao } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

const Lista = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 16rem), 1fr));
  gap: ${theme.spacing[2]};
`;

const Jogador = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[3]};
  min-height: 44px;
  padding: ${theme.spacing[2]} ${theme.spacing[3]};
  border: 1px solid ${superficie.borda};
  border-radius: ${theme.borderRadius.md};
  color: ${texto.principal};
  font-weight: ${fontWeight.semibold};
  text-decoration: none;

  &:hover {
    border-color: ${acao.primaria};
  }

  &:focus-visible {
    outline: 2px solid ${acao.primaria};
    outline-offset: 1px;
  }

  small {
    display: block;
    font-size: ${fontSize.sm};
    font-weight: ${fontWeight.normal};
    color: ${texto.secundario};
  }
`;

const Numero = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: ${theme.borderRadius.full};
  background: ${acao.fundoClaro};
  color: ${acao.primaria};
  font-size: ${fontSize.sm};
  font-weight: ${fontWeight.bold};
`;

export const JogadoresList: React.FC<JogadoresListProps> = ({
  slug,
  jogadores,
  itensPorPagina = 12,
}) => {
  const [pagina, setPagina] = useState(1);

  const inicio = (pagina - 1) * itensPorPagina;

  return (
    <SecaoPublica titulo={`Jogadores Inscritos (${jogadores.length})`}>
      {jogadores.length === 0 ? (
        <EmptyState titulo="Nenhum jogador inscrito" />
      ) : (
        <>
          <Lista>
            {jogadores
              .slice(inicio, inicio + itensPorPagina)
              .map((jogador, indice) => (
                <Jogador
                  key={jogador.id}
                  to={`/arena/${slug}/jogador/${jogador.id}`}
                >
                  <Numero>{jogador.seed || inicio + indice + 1}</Numero>
                  <span>
                    {jogador.nome}
                    {jogador.ranking && (
                      <small>Ranking: #{jogador.ranking}</small>
                    )}
                  </span>
                </Jogador>
              ))}
          </Lista>

          <Pagination
            currentPage={pagina}
            totalPages={Math.ceil(jogadores.length / itensPorPagina)}
            totalItems={jogadores.length}
            itemsPerPage={itensPorPagina}
            onPageChange={setPagina}
          />
        </>
      )}
    </SecaoPublica>
  );
};

export default JogadoresList;
