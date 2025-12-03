/**
 * DetalhesEtapa.styles.ts
 * Estilos da página de detalhes da etapa
 */

import styled, { keyframes } from "styled-components";

// ============== ANIMATIONS ==============

export const spin = keyframes`
  to { transform: rotate(360deg); }
`;

// ============== LAYOUT ==============

export const Container = styled.div`
  max-width: 72rem;
  margin: 0 auto;
  padding: 2rem 1rem;

  @media (min-width: 640px) {
    padding: 2rem 1.5rem;
  }

  @media (min-width: 1024px) {
    padding: 2rem 2rem;
  }
`;

// ============== LOADING & ERROR ==============

export const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
`;

export const LoadingContent = styled.div`
  text-align: center;
`;

export const Spinner = styled.div`
  width: 3rem;
  height: 3rem;
  border: 2px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
  margin: 0 auto 1rem;
`;

export const LoadingText = styled.p`
  color: #6b7280;
  margin: 0;
`;

export const ErrorContainer = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 1.5rem;
  text-align: center;
`;

export const ErrorText = styled.p`
  color: #991b1b;
  font-weight: 500;
  margin: 0 0 1rem 0;
`;

// ============== HEADER ==============

export const Header = styled.div`
  margin-bottom: 2rem;
`;

export const BackButton = styled.button`
  color: #6b7280;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  transition: color 0.2s;

  &:hover {
    color: #111827;
  }
`;

export const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

export const HeaderContent = styled.div`
  flex: 1;
`;

export const Title = styled.h1`
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

export const Subtitle = styled.p`
  color: #6b7280;
  margin: 0.5rem 0 0 0;
  font-size: 0.9375rem;
`;

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

export const ActionButton = styled.button<{ $variant?: "primary" | "danger" }>`
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: none;

  ${(props) =>
    props.$variant === "danger"
      ? `
    background: #dc2626;
    color: white;

    &:hover {
      background: #b91c1c;
    }
  `
      : `
    background: #3b82f6;
    color: white;

    &:hover {
      background: #2563eb;
    }
  `}
`;

export const FormatoBadge = styled.span<{ $formato: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: #f3f4f6;
  color: #4b5563;
`;

// ============== TABS ==============

export const TabsContainer = styled.div`
  margin-bottom: 1.5rem;
`;

export const TabsNav = styled.div`
  border-bottom: 1px solid #e5e7eb;

  @media (max-width: 768px) {
    border-bottom: none;
  }
`;

export const TabsList = styled.nav`
  display: flex;
  gap: 2rem;
  margin-bottom: -1px;
  overflow-x: auto;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: #f3f4f6;
  }

  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 2px;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
    overflow-x: visible;
    margin-bottom: 0;
  }
`;

export const Tab = styled.button<{ $active: boolean }>`
  white-space: nowrap;
  padding: 1rem 0.25rem;
  border: none;
  border-bottom: 2px solid
    ${(props) => (props.$active ? "#3b82f6" : "transparent")};
  background: none;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  color: ${(props) => (props.$active ? "#3b82f6" : "#6b7280")};

  &:hover {
    color: ${(props) => (props.$active ? "#3b82f6" : "#374151")};
    border-bottom-color: ${(props) => (props.$active ? "#3b82f6" : "#d1d5db")};
  }

  @media (max-width: 768px) {
    width: 100%;
    padding: 0.875rem 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    text-align: left;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: ${(props) => (props.$active ? "#eff6ff" : "white")};
    border-color: ${(props) => (props.$active ? "#3b82f6" : "#e5e7eb")};
    border-bottom: 1px solid
      ${(props) => (props.$active ? "#3b82f6" : "#e5e7eb")};

    &:hover {
      background: ${(props) => (props.$active ? "#eff6ff" : "#f9fafb")};
      border-bottom-color: ${(props) =>
        props.$active ? "#3b82f6" : "#e5e7eb"};
    }
  }
`;

export const TabBadge = styled.span`
  margin-left: 0.375rem;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  background: #dbeafe;
  color: #2563eb;

  @media (max-width: 768px) {
    margin-left: auto;
    margin-right: 0;
  }
`;

// ============== CARDS & GRID ==============

export const Grid = styled.div<{ $cols?: number }>`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(${(props) => props.$cols || 3}, 1fr);
  }
`;

export const Card = styled.div<{ $variant?: "purple" }>`
  background: ${(props) => (props.$variant === "purple" ? "#faf5ff" : "white")};
  border-radius: 0.5rem;
  border: 1px solid
    ${(props) => (props.$variant === "purple" ? "#e9d5ff" : "#e5e7eb")};
  padding: 1.5rem;
`;

export const CardIconRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

export const CardInfo = styled.div`
  flex: 1;
`;

export const CardLabel = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
`;

export const CardValue = styled.p`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
`;

export const CardContent = styled.div`
  font-size: 0.875rem;
  color: #6b7280;

  p {
    margin: 0;
  }

  p + p {
    margin-top: 0.5rem;
  }
`;

export const CardTitle = styled.h2<{ $variant?: "purple" }>`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${(props) => (props.$variant === "purple" ? "#7c3aed" : "#111827")};
  margin: 0 0 1rem 0;
`;

// ============== PROGRESS BAR ==============

export const ProgressBar = styled.div`
  margin-bottom: 0.5rem;
`;

export const ProgressBarTrack = styled.div`
  width: 100%;
  height: 0.75rem;
  background: #e5e7eb;
  border-radius: 9999px;
  overflow: hidden;
`;

export const ProgressBarFill = styled.div<{ $progress: number }>`
  height: 100%;
  border-radius: 9999px;
  transition: all 0.3s;
  width: ${(props) => props.$progress}%;
  background: ${(props) =>
    props.$progress === 100
      ? "#22c55e"
      : props.$progress >= 75
      ? "#eab308"
      : "#3b82f6"};
`;

export const ProgressText = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
`;

// ============== INFO ==============

export const InfoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const InfoRow = styled.div<{ $highlight?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;

  ${(props) =>
    props.$highlight &&
    `
    padding-top: 0.75rem;
    border-top: 1px solid #e5e7eb;
  `}
`;

export const InfoLabel = styled.span`
  font-size: 0.875rem;
  color: #6b7280;
`;

export const InfoValue = styled.span<{ $color?: string }>`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${(props) => props.$color || "#111827"};
`;

// ============== ACTIONS ==============

export const ActionsSection = styled.div`
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
`;

export const ActionsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

export const Button = styled.button<{
  $variant?: "blue" | "orange" | "green" | "purple" | "red" | "gray";
  $fullWidth?: boolean;
}>`
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  ${(props) => props.$fullWidth && "width: 100%;"}

  ${(props) => {
    switch (props.$variant) {
      case "blue":
        return `
          background: #3b82f6;
          color: white;
          &:hover { background: #2563eb; }
        `;
      case "orange":
        return `
          background: #f97316;
          color: white;
          &:hover { background: #ea580c; }
        `;
      case "green":
        return `
          background: #22c55e;
          color: white;
          &:hover { background: #16a34a; }
        `;
      case "purple":
        return `
          background: #a855f7;
          color: white;
          &:hover { background: #9333ea; }
        `;
      case "red":
        return `
          background: #dc2626;
          color: white;
          &:hover { background: #b91c1c; }
        `;
      case "gray":
        return `
          background: #6b7280;
          color: white;
          &:hover { background: #4b5563; }
        `;
      default:
        return `
          background: #3b82f6;
          color: white;
          &:hover { background: #2563eb; }
        `;
    }
  }}
`;

// ============== ALERT ==============

export const Alert = styled.div<{
  $variant: "orange" | "red" | "blue" | "yellow" | "green" | "purple";
}>`
  margin-top: 1rem;
  border-radius: 0.5rem;
  padding: 1rem;
  font-size: 0.875rem;

  ${(props) => {
    switch (props.$variant) {
      case "orange":
        return `
          background: #fff7ed;
          border: 1px solid #fed7aa;
          color: #9a3412;
        `;
      case "red":
        return `
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        `;
      case "blue":
        return `
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1e40af;
        `;
      case "yellow":
        return `
          background: #fefce8;
          border: 1px solid #fef08a;
          color: #854d0e;
        `;
      case "green":
        return `
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        `;
      case "purple":
        return `
          background: #faf5ff;
          border: 1px solid #e9d5ff;
          color: #6b21a8;
        `;
    }
  }}

  p {
    margin: 0;
  }

  p + p {
    margin-top: 0.5rem;
  }

  ul {
    margin: 0.25rem 0 0 0;
    padding-left: 1.5rem;
  }

  li {
    margin-top: 0.25rem;
  }
`;

// ============== INSCRICOES ==============

export const InscricoesHeader = styled.div`
  padding-top: 1.5rem;
  padding-bottom: 1.5rem;
`;

export const InscricoesEmpty = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;

  p {
    color: #6b7280;
    margin: 0;
  }

  button {
    margin-top: 1rem;
  }
`;

export const InscricoesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

export const InscricaoCard = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
`;

export const InscricaoInfo = styled.div`
  flex: 1;
`;

export const InscricaoNome = styled.p`
  font-weight: 500;
  color: #111827;
  margin: 0 0 0.25rem 0;
`;

export const InscricaoNivel = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
`;

export const CancelButton = styled.button`
  flex-shrink: 0;
  padding: 0.5rem;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  color: #dc2626;
  background: white;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.2s;

  &:hover {
    color: #b91c1c;
    background: #fef2f2;
    border-color: #fecaca;
  }
`;

// ============== SELECTION ==============

export const SelectionBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  gap: 1rem;
  flex-wrap: wrap;
`;

export const SelectionInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

export const SelectionCount = styled.span`
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
`;

export const SelectAllButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f9fafb;
    border-color: #9ca3af;
  }
`;

export const DeleteSelectedButton = styled.button<{ disabled?: boolean }>`
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  background: ${(props) => (props.disabled ? "#d1d5db" : "#dc2626")};
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  border: none;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background: ${(props) => (props.disabled ? "#d1d5db" : "#b91c1c")};
  }
`;

export const CheckboxWrapper = styled.label`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
`;

export const Checkbox = styled.input.attrs({ type: "checkbox" })`
  width: 1.125rem;
  height: 1.125rem;
  cursor: pointer;
  accent-color: #3b82f6;
`;

export const InscricaoCardSelectable = styled(InscricaoCard)<{
  $selected?: boolean;
}>`
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }

  ${(props) =>
    props.$selected &&
    `
    background: #f0f9ff;
    border-color: #bae6fd;

    &:hover {
      background: #f0f9ff;
    }
  `}
`;
