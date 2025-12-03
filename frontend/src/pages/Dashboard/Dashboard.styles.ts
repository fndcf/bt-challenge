/**
 * Dashboard.styles.ts
 *
 * Responsabilidade única: Styled components para Dashboard
 */

import styled from "styled-components";
import { Link } from "react-router-dom";

// ============== CONTAINER ==============

export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;

  @media (min-width: 640px) {
    padding: 1.5rem;
  }

  @media (min-width: 1024px) {
    padding: 2rem;
  }
`;

// ============== WELCOME BANNER ==============

export const WelcomeBanner = styled.div`
  background: linear-gradient(135deg, #134e5e 0%, #71b280 100%);
  border-radius: 12px;
  padding: 2rem;
  color: white;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;

  @media (max-width: 768px) {
    display: none;
  }
`;

export const WelcomeText = styled.div`
  h1 {
    margin: 0 0 0.5rem 0;
    font-size: 1.75rem;
  }

  p {
    margin: 0;
    opacity: 0.9;
  }
`;

export const ArenaBadge = styled.div`
  background: rgba(255, 255, 255, 0.15);
  padding: 1rem 1.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 1rem;

  span:first-child {
    font-size: 2rem;
  }

  div {
    p {
      margin: 0;
      font-weight: 600;
    }

    small {
      opacity: 0.8;
      font-size: 0.875rem;
    }
  }
`;

// ============== SECTION ==============

export const Section = styled.section`
  margin-bottom: 3rem;

  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 1.5rem 0;

    @media (max-width: 768px) {
      font-size: 1.25rem;
      margin-bottom: 1rem;
    }
  }
`;

// ============== STATS CARDS ==============

export const StatsGrid = styled.div`
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

export const StatCard = styled.div<{ $color: string }>`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 768px) {
    padding: 1.25rem;
  }
`;

export const StatIcon = styled.div<{ $color: string }>`
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  flex-shrink: 0;
  background: ${(props) => props.$color}15;
  color: ${(props) => props.$color};

  @media (max-width: 768px) {
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
  }
`;

export const StatContent = styled.div`
  flex: 1;

  p {
    margin: 0 0 0.25rem 0;
    font-size: 0.875rem;
    color: #6b7280;

    @media (max-width: 768px) {
      font-size: 0.8125rem;
    }
  }

  h3 {
    margin: 0;
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;

    @media (max-width: 768px) {
      font-size: 1.75rem;
    }
  }
`;

// ============== QUICK ACTIONS ==============

export const ActionsGrid = styled.div`
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

export const ActionCard = styled(Link)`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 768px) {
    padding: 1.25rem;
  }
`;

export const ActionContent = styled.div`
  flex: 1;

  h3 {
    margin: 0 0 0.25rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;

    @media (max-width: 768px) {
      font-size: 1rem;
    }
  }

  p {
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;

    @media (max-width: 768px) {
      font-size: 0.8125rem;
    }
  }
`;

export const ActionArrow = styled.div<{ $color: string }>`
  color: ${(props) => props.$color};
  font-size: 1.5rem;
  transition: transform 0.3s;

  ${ActionCard}:hover & {
    transform: translateX(4px);
  }
`;

// ============== LOADING & ERROR ==============

export const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
`;

export const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export const ErrorContainer = styled.div`
  background: #fef2f2;
  border: 1px solid #fee2e2;
  border-radius: 12px;
  padding: 1.5rem;
  color: #991b1b;
  text-align: center;

  p {
    margin: 0 0 1rem 0;
    font-weight: 600;
  }

  button {
    background: #dc2626;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: background 0.2s;

    &:hover {
      background: #b91c1c;
    }
  }
`;
