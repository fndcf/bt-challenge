/**
 * Responsabilidade única: Exibir controles de paginação
 */

import React from "react";
import * as S from "../ListagemEtapas.styles";

export interface PaginationProps {
  paginaAtual: number;
  totalPaginas: number;
  totalEtapas: number;
  etapasPorPagina: number;
  onProximaPagina: () => void;
  onPaginaAnterior: () => void;
  onIrParaPagina: (pagina: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  paginaAtual,
  totalPaginas,
  totalEtapas,
  etapasPorPagina,
  onProximaPagina,
  onPaginaAnterior,
  onIrParaPagina,
}) => {
  // Se não há etapas ou só há uma página, não mostra paginação
  if (totalEtapas === 0 || totalPaginas <= 1) {
    return null;
  }

  const inicio = (paginaAtual - 1) * etapasPorPagina + 1;
  const fim = Math.min(paginaAtual * etapasPorPagina, totalEtapas);

  // Gerar números de páginas para exibir (máximo 5 páginas visíveis)
  const gerarNumerosPaginas = () => {
    const paginas: number[] = [];
    const maxPaginasVisiveis = 5;

    if (totalPaginas <= maxPaginasVisiveis) {
      // Se tem 5 ou menos páginas, mostra todas
      for (let i = 1; i <= totalPaginas; i++) {
        paginas.push(i);
      }
    } else {
      // Mostra páginas ao redor da página atual
      let inicio = Math.max(1, paginaAtual - 2);
      let fim = Math.min(totalPaginas, paginaAtual + 2);

      // Ajusta se estiver no início
      if (paginaAtual <= 3) {
        fim = maxPaginasVisiveis;
      }

      // Ajusta se estiver no fim
      if (paginaAtual >= totalPaginas - 2) {
        inicio = totalPaginas - maxPaginasVisiveis + 1;
      }

      for (let i = inicio; i <= fim; i++) {
        paginas.push(i);
      }
    }

    return paginas;
  };

  const numerosPaginas = gerarNumerosPaginas();

  return (
    <S.PaginationContainer>
      <S.PaginationInfo>
        Exibindo <strong>{inicio}</strong> a <strong>{fim}</strong> de{" "}
        <strong>{totalEtapas}</strong> etapas
      </S.PaginationInfo>

      <S.PaginationControls>
        {/* Botão Anterior */}
        <S.PaginationButton
          onClick={onPaginaAnterior}
          disabled={paginaAtual === 1}
        >
          ← Anterior
        </S.PaginationButton>

        {/* Números das páginas */}
        <S.PaginationNumbers>
          {numerosPaginas.map((numero) => (
            <S.PaginationNumber
              key={numero}
              $active={numero === paginaAtual}
              onClick={() => onIrParaPagina(numero)}
            >
              {numero}
            </S.PaginationNumber>
          ))}
        </S.PaginationNumbers>

        {/* Botão Próxima */}
        <S.PaginationButton
          onClick={onProximaPagina}
          disabled={paginaAtual === totalPaginas}
        >
          Próxima →
        </S.PaginationButton>
      </S.PaginationControls>
    </S.PaginationContainer>
  );
};

export default Pagination;
