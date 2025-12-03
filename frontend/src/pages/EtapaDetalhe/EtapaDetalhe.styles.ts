/**
 * EtapaDetalhe.styles.ts
 *
 * Estilos centralizados para a página de detalhes da etapa
 */

import styled from "styled-components";
import { Link } from "react-router-dom";

// ============== PAGE LAYOUT ==============

export const Page = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #134e5e 0%, #71b280 100%);
`;

export const TopBar = styled.header`
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 50;
`;

export const TopBarInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 10px 16px;

  @media (min-width: 768px) {
    padding: 12px 24px;
  }
`;

export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 16px;

  @media (min-width: 768px) {
    padding: 24px 24px;
  }
`;

export const Layout = styled.div`
  display: grid;
  gap: 24px;
  grid-template-columns: 1fr;

  @media (min-width: 1024px) {
    grid-template-columns: minmax(0, 1fr) 360px;
    gap: 32px;
  }
`;

export const Main = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
  overflow: hidden;
`;

export const Aside = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;

  @media (min-width: 1024px) {
    position: sticky;
    top: 80px;
    align-self: start;
  }
`;

// ============== BREADCRUMBS ==============

export const Breadcrumbs = styled.nav`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (min-width: 768px) {
    font-size: 13px;
    margin-bottom: 10px;
  }
`;

export const BreadLink = styled(Link)`
  color: #3b82f6;
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    color: #2563eb;
  }
`;

export const BreadSep = styled.span`
  color: #d1d5db;
`;

export const BreadCurrent = styled.span`
  color: #1f2937;
  font-weight: 600;
`;

// ============== HEADER ==============

export const HeaderRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
`;

export const TitleArea = styled.div`
  flex: 1;
  min-width: 0;
`;

export const PageTitle = styled.h1`
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 6px 0;

  @media (min-width: 768px) {
    font-size: 20px;
    margin-bottom: 8px;
  }
`;

export const BadgeGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 4px;
`;

export const Badge = styled.span<{ $variant: string }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  ${(props) => {
    switch (props.$variant) {
      case "aberta":
        return `
          background: #dcfce7;
          color: #166534;
        `;
      case "em_andamento":
        return `
          background: #dbeafe;
          color: #1e40af;
        `;
      case "finalizada":
        return `
          background: #f3f4f6;
          color: #6b7280;
        `;
      default:
        return `
          background: #fef3c7;
          color: #92400e;
        `;
    }
  }}

  @media (min-width: 768px) {
    font-size: 12px;
    padding: 6px 14px;
  }
`;

export const NivelBadge = styled.span<{ $nivel: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;

  ${(props) => {
    switch (props.$nivel) {
      case "iniciante":
        return `background: #dcfce7; color: #166534;`;
      case "intermediario":
        return `background: #dbeafe; color: #1e40af;`;
      case "avancado":
        return `background: #fed7aa; color: #9a3412;`;
      default:
        return `background: #f3f4f6; color: #6b7280;`;
    }
  }}

  @media (min-width: 768px) {
    font-size: 12px;
    padding: 5px 12px;
  }
`;

export const GeneroBadge = styled.span<{ $genero: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;

  ${(props) => {
    switch (props.$genero) {
      case "masculino":
        return `background: #dbeafe; color: #1e40af;`;
      case "feminino":
        return `background: #fce7f3; color: #9f1239;`;
      default:
        return `background: #f3f4f6; color: #6b7280;`;
    }
  }}

  @media (min-width: 768px) {
    font-size: 12px;
    padding: 5px 12px;
  }
`;

export const BackButton = styled.button`
  background: #f3f4f6;
  color: #374151;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.8125rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: #e5e7eb;
  }

  @media (min-width: 768px) {
    font-size: 0.875rem;
    padding: 0.625rem 1.25rem;
  }
`;

// ============== CARDS ==============

export const Card = styled.div`
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  min-width: 0;
  overflow: hidden;

  @media (min-width: 768px) {
    padding: 24px;
  }
`;

export const CardHeader = styled.div`
  margin-bottom: 20px;
`;

export const CardTitle = styled.h2`
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;

  @media (min-width: 768px) {
    font-size: 18px;
  }
`;

// ============== INFO GRID ==============

export const InfoGrid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const InfoBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  overflow: hidden;
`;

export const InfoLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  @media (min-width: 768px) {
    font-size: 12px;
  }
`;

export const InfoValue = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  word-wrap: break-word;
  overflow-wrap: break-word;

  @media (min-width: 768px) {
    font-size: 16px;
  }
`;

export const Desc = styled.p`
  color: #6b7280;
  line-height: 1.6;
  margin: 16px 0 0 0;
  font-size: 14px;

  @media (min-width: 768px) {
    font-size: 15px;
  }
`;

// ============== PLAYERS LIST ==============

export const PlayersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const PlayerItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    transform: translateX(4px);
  }

  @media (min-width: 768px) {
    padding: 14px;
  }
`;

export const PlayerNum = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #134e5e 0%, #71b280 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;

  @media (min-width: 768px) {
    width: 40px;
    height: 40px;
    font-size: 14px;
  }
`;

export const PlayerInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const PlayerName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (min-width: 768px) {
    font-size: 15px;
  }
`;

export const PlayerRank = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;

  @media (min-width: 768px) {
    font-size: 13px;
  }
`;

// ============== EMPTY STATE ==============

export const EmptyBox = styled.div`
  text-align: center;
  padding: 32px 16px;
  color: #9ca3af;
`;

export const EmptyText = styled.p`
  font-size: 14px;
  margin: 0;
`;

// ============== LOADING ==============

export const Loading = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: white;
`;

export const Spinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export const LoadingText = styled.p`
  font-size: 16px;
  font-weight: 500;
`;

// ============== ERROR ==============

export const ErrorCard = styled(Card)`
  text-align: center;
`;

export const ErrorIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
`;

export const ErrorTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
`;

export const ErrorText = styled.p`
  font-size: 15px;
  color: #6b7280;
  margin: 0 0 20px 0;
`;

export const ErrorBtn = styled(Link)`
  display: inline-flex;
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border-radius: 10px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    background: #2563eb;
  }
`;

// ============== PAGINATION ==============

export const PaginationContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 12px;
  }
`;

export const PaginationInfo = styled.div`
  font-size: 13px;
  color: #6b7280;

  @media (min-width: 768px) {
    font-size: 14px;
  }
`;

export const PaginationButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const PaginationButton = styled.button<{ $active?: boolean }>`
  min-width: 36px;
  height: 36px;
  padding: 0 12px;
  border: 1px solid ${(props) => (props.$active ? "#3b82f6" : "#d1d5db")};
  background: ${(props) => (props.$active ? "#3b82f6" : "white")};
  color: ${(props) => (props.$active ? "white" : "#374151")};
  border-radius: 8px;
  font-size: 14px;
  font-weight: ${(props) => (props.$active ? "600" : "500")};
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: ${(props) => (props.$active ? "#2563eb" : "#f3f4f6")};
    border-color: ${(props) => (props.$active ? "#2563eb" : "#9ca3af")};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (min-width: 768px) {
    min-width: 40px;
    height: 40px;
  }
`;

export const ShowMoreButton = styled.button`
  width: 100%;
  padding: 12px;
  margin-top: 16px;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e5e7eb;
  }

  @media (min-width: 768px) {
    font-size: 15px;
    padding: 14px;
  }
`;
