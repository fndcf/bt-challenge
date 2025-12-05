import styled from "styled-components";

// ============== CONTAINER ==============

export const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;

  @media (min-width: 640px) {
    padding: 1.5rem;
  }

  @media (min-width: 1024px) {
    padding: 2rem;
  }
`;

// ============== HEADER ==============

export const Header = styled.div`
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
`;

export const HeaderContent = styled.div`
  margin-bottom: 1rem;

  @media (min-width: 768px) {
    margin-bottom: 0;
  }
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

export const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #2563eb;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;

  &:hover {
    background: #1d4ed8;
  }

  @media (min-width: 768px) {
    width: auto;
    font-size: 1rem;
  }
`;

// ============== ESTATÍSTICAS ==============

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 2rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(5, 1fr);
  }
`;

export const StatCard = styled.div<{ $variant?: "purple" | "blue" }>`
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

export const StatContent = styled.div`
  flex: 1;
`;

export const StatLabel = styled.p<{ $color?: string }>`
  font-size: 0.875rem;
  color: ${(props) => props.$color || "#6b7280"};
  margin: 0 0 0.25rem 0;
`;

export const StatValue = styled.p<{ $color?: string }>`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${(props) => props.$color || "#111827"};
  margin: 0;

  @media (min-width: 768px) {
    font-size: 2rem;
  }
`;

// ============== FILTROS ==============

export const FiltersCard = styled.div`
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  padding: 1rem;
  margin-bottom: 1.5rem;
`;

export const FiltersContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (min-width: 768px) {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
  }
`;

export const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
  }
`;

export const FilterLabel = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
`;

export const Select = styled.select`
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: #374151;
  background: white;
  cursor: pointer;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  @media (min-width: 768px) {
    min-width: 180px;
  }
`;

export const ClearButton = styled.button`
  font-size: 0.875rem;
  color: #6b7280;
  background: none;
  border: none;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;

  &:hover {
    color: #111827;
  }
`;

// ============== CONTEÚDO ==============

export const ErrorBox = styled.div`
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
`;

export const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
`;

export const EmptyTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;

  @media (min-width: 768px) {
    font-size: 1.5rem;
  }
`;

export const EmptyText = styled.p`
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  font-size: 0.875rem;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

export const EtapasGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

export const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
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

// ============== PAGINAÇÃO ==============

export const PaginationContainer = styled.div`
  margin-top: 2rem;
  padding: 1.5rem 0;
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

export const PaginationInfo = styled.div`
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

export const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;

  @media (min-width: 768px) {
    justify-content: flex-end;
  }
`;

export const PaginationButton = styled.button<{ disabled?: boolean }>`
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

export const PaginationNumbers = styled.div`
  display: flex;
  gap: 0.25rem;
`;

export const PaginationNumber = styled.button<{ $active?: boolean }>`
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
