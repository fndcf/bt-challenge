/**
 * JogadorPerfil.styles.ts
 *
 * Responsabilidade única: Styled components para página de perfil do jogador
 */

import styled from "styled-components";
import { Link } from "react-router-dom";

// ============== PAGE CONTAINER ==============

export const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #134e5e 0%, #71b280 100%);
`;

// ============== HEADER ==============

export const Header = styled.header`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
`;

export const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 1.5rem;

  @media (min-width: 768px) {
    padding: 1.5rem 2rem;
  }
`;

export const Breadcrumb = styled.nav`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;

  a {
    color: #2563eb;
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: #1d4ed8;
    }
  }

  span {
    color: #374151;
    font-weight: 600;
  }

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

export const HeaderInfo = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
`;

export const BackButton = styled.button`
  background: #f3f4f6;
  color: #374151;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: #e5e7eb;
  }

  @media (min-width: 768px) {
    font-size: 0.9375rem;
    padding: 0.875rem 2rem;
  }
`;

// ============== CONTAINER ==============

export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;

  @media (min-width: 768px) {
    padding: 3rem 1.5rem;
  }
`;

// ============== PROFILE HEADER ==============

export const ProfileHeader = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1.5rem;

  @media (min-width: 768px) {
    flex-direction: row;
    text-align: left;
    padding: 3rem;
  }
`;

export const Avatar = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #134e5e 0%, #71b280 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;

  @media (min-width: 768px) {
    width: 120px;
    height: 120px;
    font-size: 3rem;
  }
`;

export const ProfileInfo = styled.div`
  flex: 1;

  h1 {
    font-size: 1.75rem;
    font-weight: 800;
    color: #111827;
    margin: 0 0 0.5rem 0;

    @media (min-width: 768px) {
      font-size: 2.25rem;
    }
  }

  p {
    color: #6b7280;
    margin: 0;
    font-size: 1rem;

    @media (min-width: 768px) {
      font-size: 1.125rem;
    }
  }
`;

export const GeneroTag = styled.span<{ $genero: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: capitalize;
  background: ${(props) =>
    props.$genero === "masculino" ? "#dbeafe" : "#fce7f3"};
  color: ${(props) =>
    props.$genero === "masculino" ? "#1e40af" : "#9f1239"};
`;

export const NivelTag = styled.span<{ $nivel: string; $genero?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: capitalize;
  background: ${(props) =>
    props.$genero === "masculino" ? "#dbeafe" : "#fce7f3"};
  color: ${(props) =>
    props.$genero === "masculino" ? "#1e40af" : "#9f1239"};
`;

export const BadgeGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.75rem;
`;

// ============== STATS ==============

export const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

export const StatCard = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-4px);
  }
`;

export const StatValue = styled.div`
  font-size: 2.25rem;
  font-weight: 800;
  color: #111827;
  margin-bottom: 0.25rem;

  @media (min-width: 768px) {
    font-size: 2.5rem;
  }
`;

export const StatLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

// ============== CARDS ==============

export const Card = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  grid-column: 1 / -1;

  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

export const CardTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (min-width: 768px) {
    font-size: 1.5rem;
  }
`;

// ============== HISTÓRICO ==============

export const HistoricoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const HistoricoItem = styled(Link)`
  display: block;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 0.75rem;
  border-left: 4px solid #2563eb;
  transition: all 0.2s;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    background: #f3f4f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

export const HistoricoHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

export const EtapaNome = styled.div`
  font-weight: 600;
  color: #111827;
  font-size: 1rem;

  @media (min-width: 768px) {
    font-size: 1.125rem;
  }
`;

export const HistoricoDetalhes = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

// ============== EMPTY STATE ==============

export const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
`;

export const EmptyText = styled.p`
  color: #6b7280;
  font-size: 1rem;
`;

// ============== LOADING ==============

export const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: white;
`;

export const Spinner = styled.div`
  width: 3rem;
  height: 3rem;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export const LoadingText = styled.p`
  font-size: 1.125rem;
  font-weight: 500;
`;

// ============== ERROR ==============

export const ErrorCard = styled(Card)`
  text-align: center;
  grid-column: 1 / -1;
`;

export const ErrorIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

export const ErrorTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
`;

export const ErrorText = styled.p`
  color: #6b7280;
  margin: 0 0 1.5rem 0;
`;

export const ErrorButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #2563eb;
  color: white;
  padding: 0.875rem 2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #1d4ed8;
  }
`;
