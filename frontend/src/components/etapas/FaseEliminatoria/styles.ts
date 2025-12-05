import styled from "styled-components";
import { StatusConfrontoEliminatorio } from "@/types/chave";

// ============== LAYOUT ==============

export const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (min-width: 768px) {
    padding: 1.5rem;
  }
`;

export const Header = styled.div`
  background: linear-gradient(135deg, #2563eb 0%, #9333ea 100%);
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  color: white;

  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;

    @media (min-width: 768px) {
      font-size: 2rem;
    }
  }

  p {
    color: #dbeafe;
    margin: 0;
    font-size: 0.875rem;

    @media (min-width: 768px) {
      font-size: 1rem;
    }
  }
`;

export const ActionsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

export const Button = styled.button<{
  $variant?: "primary" | "danger" | "warning" | "gray";
}>`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 600;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.2s;

  @media (min-width: 768px) {
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
  }

  ${(props) => {
    switch (props.$variant) {
      case "danger":
        return `
          background: #ef4444;
          color: white;
          &:hover:not(:disabled) { background: #dc2626; }
        `;
      case "warning":
        return `
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          font-weight: 700;
          &:hover:not(:disabled) {
            background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
          }
        `;
      case "gray":
        return `
          background: #f3f4f6;
          color: #374151;
          &:hover:not(:disabled) { background: #e5e7eb; }
        `;
      default:
        return `
          background: #2563eb;
          color: white;
          &:hover:not(:disabled) { background: #1d4ed8; }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const Controls = styled.div`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

export const ToggleGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

export const ToggleButton = styled.button<{ $active: boolean }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  ${(props) =>
    props.$active
      ? `
    background: #2563eb;
    color: white;
  `
      : `
    background: #f3f4f6;
    color: #374151;
    &:hover { background: #e5e7eb; }
  `}
`;

export const Select = styled.select`
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;

  &:focus {
    outline: none;
    ring: 2px;
    ring-color: #2563eb;
  }
`;

export const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
`;

export const Spinner = styled.div`
  width: 2rem;
  height: 2rem;
  border: 3px solid #dbeafe;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export const ErrorBox = styled.div`
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 1rem;
  color: #991b1b;
  text-align: center;
`;

export const EmptyStateCard = styled.div`
  max-width: 42rem;
  margin: 0 auto;
  padding: 1.5rem;
`;

export const EmptyStateContent = styled.div`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  text-align: center;
`;

export const EmptyTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 1rem 0;

  @media (min-width: 768px) {
    font-size: 1.25rem;
  }
`;

export const AlertBox = styled.div<{ $variant: "success" | "warning" }>`
  border-radius: 0.5rem;
  padding: 1rem;
  text-align: left;

  & + & {
    margin-top: 1rem;
  }

  ${(props) =>
    props.$variant === "success"
      ? `
    background: #dcfce7;
    border: 1px solid #bbf7d0;
    color: #166534;
  `
      : `
    background: #fef3c7;
    border: 1px solid #fde68a;
    color: #92400e;
  `}

  h4 {
    font-size: 0.875rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
  }

  p {
    margin: 0;
    font-size: 0.8125rem;
    line-height: 1.5;
  }

  p + p {
    margin-top: 0.25rem;
  }
`;

export const InfoBox = styled.div`
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #d1d5db;
  padding: 1rem;
  margin-top: 0.75rem;
`;

export const InfoText = styled.p`
  font-size: 0.8125rem;
  color: #374151;
  margin: 0 0 0.5rem 0;

  strong {
    color: #166534;
    font-weight: 600;
  }
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-top: 1.5rem;
  flex-wrap: wrap;
`;

export const HintText = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin: 1rem 0 0 0;
`;

// ============== FASE CARDS ==============

export const FaseCard = styled.div`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
`;

export const FaseHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
`;

export const FaseTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0;

  @media (min-width: 768px) {
    font-size: 1.25rem;
  }
`;

export const FaseStatus = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
`;

export const ConfrontosList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const ConfrontoCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

export const ConfrontoHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

export const ConfrontoInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const StatusInfo = styled.span`
  display: flex;

  @media (max-width: 414px) {
    display: none;
  }
`;

export const ConfrontoLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
`;

export const StatusBadge = styled.span<{ $status: StatusConfrontoEliminatorio }>`
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;

  ${(props) => {
    switch (props.$status) {
      case StatusConfrontoEliminatorio.BYE:
        return `background: #dcfce7; color: #166534;`;
      case StatusConfrontoEliminatorio.FINALIZADA:
        return `background: #dcfce7; color: #166534;`;
      default:
        return `background: #fef3c7; color: #92400e;`;
    }
  }}
`;

export const ConfrontoContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const ByeBox = styled.div`
  background: #dcfce7;
  border: 2px solid #86efac;
  border-radius: 0.5rem;
  padding: 1.5rem;
  text-align: center;
`;

export const ByeTeam = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: #166534;
  margin-bottom: 0.25rem;
`;

export const ByeOrigin = styled.div`
  font-size: 0.75rem;
  color: #16a34a;
  margin-top: 0.25rem;
`;

export const ByeLabel = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #86efac;
  font-size: 0.75rem;
  font-weight: 600;
  color: #15803d;
`;

export const DuplaRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const DuplaNome = styled.span<{ $isWinner?: boolean }>`
  font-weight: ${(props) => (props.$isWinner ? 700 : 500)};
  color: ${(props) => (props.$isWinner ? "#16a34a" : "#374151")};
  font-size: 0.875rem;

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

export const DuplaOrigemText = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.125rem;
`;

export const Score = styled.span`
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
`;

export const VsSeparator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  span {
    font-size: 0.75rem;
    color: #9ca3af;
    font-weight: 600;
  }
`;

export const PlacarDetalhado = styled.div`
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f3f4f6;
`;

export const PlacarInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;

  span:first-child {
    font-weight: 600;
  }
`;

export const ActionSection = styled.div`
  margin-top: 1rem;
`;

export const ActionButton = styled.button<{
  $variant?: "register" | "edit" | "disabled";
}>`
  width: 100%;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  ${(props) => {
    switch (props.$variant) {
      case "register":
        return `
          background: #2563eb;
          color: white;
          &:hover { background: #1d4ed8; }
        `;
      case "edit":
        return `
          background: #f59e0b;
          color: white;
          &:hover { background: #d97706; }
        `;
      case "disabled":
        return `
          background: #9ca3af;
          color: #e5e7eb;
          cursor: not-allowed;
        `;
      default:
        return `
          background: #2563eb;
          color: white;
          &:hover { background: #1d4ed8; }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// ============== BRACKET ==============

export const BracketContainer = styled.div`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  overflow-x: auto;
`;

export const BracketContent = styled.div`
  display: flex;
  gap: 2rem;
  min-width: max-content;
`;

export const BracketColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 250px;
`;

export const BracketTitle = styled.div`
  text-align: center;
  font-weight: 700;
  color: #111827;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #2563eb;
  font-size: 0.875rem;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

export const BracketMatches = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  flex: 1;
  gap: 1rem;
`;

export const BracketMatch = styled.div`
  border: 2px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.75rem;
  background: #f9fafb;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

export const BracketStatus = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 0.5rem;
`;

export const BracketBye = styled.div`
  text-align: center;
`;

export const BracketTeam = styled.div<{ $isWinner?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.25rem 0;
  font-size: 0.875rem;

  span:first-child {
    ${(props) =>
      props.$isWinner &&
      `
      font-weight: 700;
      color: #16a34a;
    `}
  }

  span:last-child {
    font-weight: 700;
  }
`;

export const BracketDivider = styled.div`
  border-top: 1px solid #d1d5db;
  margin: 0.25rem 0;
`;

export const ChampionBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 250px;
`;

export const ChampionTitle = styled.div`
  text-align: center;
  font-weight: 700;
  color: #111827;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #f59e0b;
  font-size: 0.875rem;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

export const ChampionCard = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
`;

export const ChampionContent = styled.div`
  width: 100%;
  border: 4px solid #f59e0b;
  border-radius: 0.5rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  text-align: center;
`;

export const ChampionName = styled.div`
  font-size: 1.125rem;
  font-weight: 700;
  color: #92400e;

  @media (min-width: 768px) {
    font-size: 1.25rem;
  }
`;

export const ChampionScore = styled.div`
  font-size: 0.875rem;
  color: #b45309;
  margin-top: 0.5rem;
`;
