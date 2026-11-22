/**
 * Componente reutilizável de paginação
 */

import React from "react";
import styled from "styled-components";
import { Button } from "../Button";
import { theme } from "@/styles/theme";

const { texto, superficie, acao } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

// ============== STYLES ==============

const Container = styled.nav`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.spacing[4]};
  margin-top: ${theme.spacing[6]};
  padding-top: ${theme.spacing[6]};
  border-top: 1px solid ${superficie.borda};

  @media (min-width: ${theme.breakpoints.md}) {
    flex-direction: row;
    justify-content: space-between;
  }
`;

const Info = styled.div`
  font-size: ${fontSize.sm};
  color: ${texto.secundario};

  strong {
    font-weight: ${fontWeight.semibold};
    color: ${texto.principal};
  }
`;

const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing[2]};
`;

const Numbers = styled.div`
  display: flex;
  gap: ${theme.spacing[1]};
`;

const PageNumber = styled.button<{ $active: boolean }>`
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid
    ${({ $active }) => ($active ? acao.primaria : superficie.bordaForte)};
  border-radius: ${theme.borderRadius.md};
  background: ${({ $active }) => ($active ? acao.primaria : superficie.fundo)};
  color: ${({ $active }) => ($active ? texto.inverso : texto.principal)};
  font-family: inherit;
  font-size: ${fontSize.sm};
  font-weight: ${({ $active }) =>
    $active ? fontWeight.semibold : fontWeight.medium};
  cursor: pointer;

  &:hover {
    border-color: ${acao.primaria};
    ${({ $active }) => !$active && `background: ${acao.fundoClaro};`}
  }

  &:focus-visible {
    outline: 2px solid ${acao.primaria};
    outline-offset: 2px;
  }
`;

const Reticencias = styled.span`
  align-self: center;
  min-width: 1.5rem;
  text-align: center;
  color: ${texto.secundario};
`;

// ============== COMPONENT ==============

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

const MAX_VISIVEIS = 5;

/** Páginas mostradas; "..." marca o intervalo escondido */
const getPaginas = (atual: number, total: number): (number | "...")[] => {
  if (total <= MAX_VISIVEIS) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (atual <= 3) return [1, 2, 3, 4, "...", total];
  if (atual >= total - 2) {
    return [1, "...", total - 3, total - 2, total - 1, total];
  }
  return [1, "...", atual - 1, atual, atual + 1, "...", total];
};

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  if (totalPages <= 1) {
    return null;
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <Container aria-label="Paginação">
      <Info>
        Mostrando <strong>{startItem}</strong> a <strong>{endItem}</strong> de{" "}
        <strong>{totalItems}</strong> {totalItems === 1 ? "item" : "itens"}
      </Info>

      <Controls>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          ← Anterior
        </Button>

        <Numbers>
          {getPaginas(currentPage, totalPages).map((page, index) =>
            page === "..." ? (
              <Reticencias key={`reticencias-${index}`}>...</Reticencias>
            ) : (
              <PageNumber
                key={page}
                type="button"
                $active={page === currentPage}
                aria-current={page === currentPage ? "page" : undefined}
                onClick={() => onPageChange(page)}
              >
                {page}
              </PageNumber>
            )
          )}
        </Numbers>

        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Próxima →
        </Button>
      </Controls>
    </Container>
  );
};

export default Pagination;
