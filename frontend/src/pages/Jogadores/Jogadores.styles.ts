import styled from "styled-components";

// ============== CONTAINER ==============

export const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;

  @media (min-width: 768px) {
    padding: 1.5rem;
  }

  @media (min-width: 1024px) {
    padding: 2rem;
  }
`;

// ============== HEADER ==============

export const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

export const HeaderInfo = styled.div`
  flex: 1;
`;

export const Title = styled.h1`
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.25rem 0;

  @media (min-width: 768px) {
    font-size: 2.25rem;
  }
`;

export const Subtitle = styled.p`
  color: #6b7280;
  margin: 0;
  font-size: 0.875rem;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

export const NewButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #2563eb;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;

  &:hover {
    background: #1d4ed8;
  }

  @media (min-width: 768px) {
    width: auto;
  }
`;

// ============== ALERT ==============

export const Alert = styled.div<{ $type: "success" | "error" }>`
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;

  ${(props) =>
    props.$type === "success"
      ? `
    background: #dcfce7;
    border: 1px solid #bbf7d0;
    color: #166534;
  `
      : `
    background: #fee2e2;
    border: 1px solid #fecaca;
    color: #991b1b;
  `}
`;

export const AlertContent = styled.div`
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

export const AlertClose = styled.button`
  background: none;
  border: none;
  color: inherit;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  opacity: 0.7;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
`;

// ============== SEARCH BAR ==============

export const SearchContainer = styled.div`
  margin-bottom: 1.5rem;
`;

export const SearchInput = styled.input`
  width: 100%;
  padding: 0.875rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  color: #111827;
  background: white;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }

  @media (min-width: 768px) {
    padding: 1rem 1.25rem;
  }
`;

// ============== FILTROS ==============

export const FiltersContainer = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;

  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

export const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 1rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

export const FilterItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const FilterLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
`;

export const Select = styled.select`
  padding: 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  color: #111827;
  background: white;
  cursor: pointer;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  @media (min-width: 768px) {
    padding: 0.75rem 1rem;
  }
`;

export const ClearButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #f3f4f6;
  color: #374151;
  padding: 0.625rem 1rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;

  &:hover {
    background: #e5e7eb;
  }

  @media (min-width: 640px) {
    width: auto;
  }
`;

// ============== RESULTADO INFO ==============

export const ResultInfo = styled.div`
  margin-bottom: 1.5rem;

  p {
    color: #6b7280;
    font-size: 0.875rem;
    margin: 0;

    @media (min-width: 768px) {
      font-size: 0.9375rem;
    }
  }
`;

// ============== GRID ==============

export const JogadoresGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (min-width: 1280px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

// ============== LOADING ==============

export const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
  gap: 1rem;
`;

export const Spinner = styled.div`
  width: 3rem;
  height: 3rem;
  border: 4px solid #dbeafe;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export const LoadingMessage = styled.p`
  color: #6b7280;
  font-size: 0.9375rem;
`;

// ============== EMPTY STATE ==============

export const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 1rem;
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;

  @media (min-width: 768px) {
    padding: 5rem 2rem;
  }
`;

export const EmptyTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;

  @media (min-width: 768px) {
    font-size: 1.875rem;
  }
`;

export const EmptyText = styled.p`
  color: #6b7280;
  margin: 0 0 2rem 0;
  font-size: 0.9375rem;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

export const EmptyButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #2563eb;
  color: white;
  padding: 0.875rem 2rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #1d4ed8;
  }

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

// ============== PAGINAÇÃO ==============

export const PaginationContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem 0;

  @media (min-width: 640px) {
    flex-direction: row;
    justify-content: center;
  }
`;

export const PaginationButton = styled.button`
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
    border-color: #2563eb;
    color: #2563eb;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

export const PaginationInfo = styled.span`
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;
