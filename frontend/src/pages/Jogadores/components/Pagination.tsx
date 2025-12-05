/**
 * Responsabilidade única: Controles de paginação
 */

import React from "react";
import * as S from "../Jogadores.styles";

export interface PaginationProps {
  paginaAtual: number;
  totalPaginas: number;
  temMais: boolean;
  offset: number;
  onPaginaAnterior: () => void;
  onProximaPagina: () => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  paginaAtual,
  totalPaginas,
  temMais,
  offset,
  onPaginaAnterior,
  onProximaPagina,
}) => {
  // Não exibir paginação se houver apenas 1 página
  if (totalPaginas <= 1) {
    return null;
  }

  return (
    <S.PaginationContainer>
      <S.PaginationButton onClick={onPaginaAnterior} disabled={offset === 0}>
        ← Anterior
      </S.PaginationButton>
      <S.PaginationInfo>
        Página {paginaAtual} de {totalPaginas}
      </S.PaginationInfo>
      <S.PaginationButton onClick={onProximaPagina} disabled={!temMais}>
        Próxima →
      </S.PaginationButton>
    </S.PaginationContainer>
  );
};

export default Pagination;
