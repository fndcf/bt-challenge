/**
 * Pagination.tsx
 *
 * Componente reutilizável de paginação
 */

import React from "react";
import styled from "styled-components";

// ============== STYLES ==============

const Container = styled.div`
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
  }
`;

const Info = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;

  strong {
    color: #111827;
    font-weight: 600;
  }

  @media (min-width: 768px) {
    text-align: left;
  }
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;

  @media (min-width: 768px) {
    justify-content: flex-end;
  }
`;

const Button = styled.button<{ disabled?: boolean }>`
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${(props) => (props.disabled ? "#9ca3af" : "#2563eb")};
  background: ${(props) => (props.disabled ? "#f3f4f6" : "white")};
  border: 1px solid ${(props) => (props.disabled ? "#e5e7eb" : "#d1d5db")};
  border-radius: 0.375rem;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  transition: all 0.2s;

  &:hover {
    background: ${(props) => (props.disabled ? "#f3f4f6" : "#f9fafb")};
    border-color: ${(props) => (props.disabled ? "#e5e7eb" : "#2563eb")};
  }

  &:active {
    transform: ${(props) => (props.disabled ? "none" : "scale(0.98)")};
  }
`;

const Numbers = styled.div`
  display: flex;
  gap: 0.25rem;
`;

const PageNumber = styled.button<{ $active?: boolean }>`
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: ${(props) => (props.$active ? "600" : "500")};
  color: ${(props) => (props.$active ? "white" : "#374151")};
  background: ${(props) => (props.$active ? "#2563eb" : "white")};
  border: 1px solid ${(props) => (props.$active ? "#2563eb" : "#d1d5db")};
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(props) => (props.$active ? "#1d4ed8" : "#f9fafb")};
    border-color: #2563eb;
  }

  &:active {
    transform: scale(0.95);
  }
`;

// ============== COMPONENT ==============

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages.map((page, index) => {
      if (page === "...") {
        return (
          <PageNumber key={`ellipsis-${index}`} disabled>
            ...
          </PageNumber>
        );
      }

      return (
        <PageNumber
          key={page}
          $active={page === currentPage}
          onClick={() => onPageChange(page as number)}
        >
          {page}
        </PageNumber>
      );
    });
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <Container>
      <Info>
        Mostrando <strong>{startItem}</strong> a <strong>{endItem}</strong> de{" "}
        <strong>{totalItems}</strong> {totalItems === 1 ? "item" : "itens"}
      </Info>

      <Controls>
        <Button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          ← Anterior
        </Button>

        <Numbers>{renderPageNumbers()}</Numbers>

        <Button
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
