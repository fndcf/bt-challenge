/**
 * EtapaCard.styles.ts
 * Estilos para o card de etapa
 */

import styled from "styled-components";
import { Link } from "react-router-dom";

export const EtapaCard = styled.div`
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.15);
  }

  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

export const EtapaHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

export const EtapaNumero = styled.div`
  background: linear-gradient(135deg, #134e5e 0%, #71b280 100%);
  color: white;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.25rem;
  flex-shrink: 0;
`;

export const EtapaStatus = styled.span<{ $status: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;

  ${(props) => {
    switch (props.$status) {
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
`;

export const EtapaNome = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;

  @media (min-width: 768px) {
    font-size: 1.5rem;
  }
`;

export const EtapaInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

export const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;

  strong {
    color: #374151;
    font-weight: 600;
  }

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

export const EtapaDescricao = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.6;
  margin: 0 0 1rem 0;

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

export const VerMaisButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #2563eb;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  text-decoration: none;
  transition: all 0.2s;
  width: 100%;

  &:hover {
    background: #1d4ed8;
  }

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;
