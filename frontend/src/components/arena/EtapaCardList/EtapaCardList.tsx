/**
 * Responsabilidade única: Renderizar lista de etapas
 */

import React from "react";
import styled from "styled-components";
import { EtapaPublica } from "@/services/arenaPublicService";
import { EtapaCardItem } from "./EtapaCardItem";

interface EtapaCardListProps {
  etapas: EtapaPublica[];
  arenaSlug: string;
}

const EtapasGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 3rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const EmptyState = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 3rem 2rem;
  text-align: center;

  @media (min-width: 768px) {
    padding: 4rem 3rem;
  }
`;

const EmptyTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;

  @media (min-width: 768px) {
    font-size: 1.875rem;
  }
`;

const EmptyText = styled.p`
  color: #6b7280;
  font-size: 1rem;
  margin: 0;

  @media (min-width: 768px) {
    font-size: 1.125rem;
  }
`;

export const EtapaCardList: React.FC<EtapaCardListProps> = ({
  etapas,
  arenaSlug,
}) => {
  if (etapas.length === 0) {
    return (
      <EmptyState>
        <EmptyTitle>Nenhuma Etapa Disponível</EmptyTitle>
        <EmptyText>
          Não há etapas cadastradas no momento. Fique atento para novos
          torneios!
        </EmptyText>
      </EmptyState>
    );
  }

  return (
    <EtapasGrid>
      {etapas.map((etapa) => (
        <EtapaCardItem key={etapa.id} etapa={etapa} arenaSlug={arenaSlug} />
      ))}
    </EtapasGrid>
  );
};

export default EtapaCardList;
