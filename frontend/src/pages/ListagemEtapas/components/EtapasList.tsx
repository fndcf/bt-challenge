/**
 * Responsabilidade única: Renderizar lista de etapas com estados (loading, error, empty)
 */

import React from "react";
import { Etapa } from "@/types/etapa";
import { EtapaCard } from "@/components/etapas/EtapaCard";
import * as S from "../ListagemEtapas.styles";

interface EtapasListProps {
  etapas: Etapa[];
  loading: boolean;
  error: string | null;
  temFiltrosAtivos: boolean;
  onCriarClick: () => void;
}

export const EtapasList: React.FC<EtapasListProps> = ({
  etapas,
  loading,
  error,
  temFiltrosAtivos,
  onCriarClick,
}) => {
  // Loading state
  if (loading) {
    return (
      <S.LoadingContainer>
        <S.Spinner />
      </S.LoadingContainer>
    );
  }

  return (
    <>
      {/* Error state */}
      {error && <S.ErrorBox>{error}</S.ErrorBox>}

      {/* Empty state */}
      {etapas.length === 0 ? (
        <S.EmptyState>
          <S.EmptyTitle>Nenhuma etapa encontrada</S.EmptyTitle>
          <S.EmptyText>
            {temFiltrosAtivos
              ? "Não há etapas com os filtros selecionados."
              : "Comece criando sua primeira etapa!"}
          </S.EmptyText>
          {!temFiltrosAtivos && (
            <S.CreateButton onClick={onCriarClick}>
              Criar Primeira Etapa
            </S.CreateButton>
          )}
        </S.EmptyState>
      ) : (
        // List of etapas
        <S.EtapasGrid>
          {etapas.map((etapa) => (
            <EtapaCard key={etapa.id} etapa={etapa} />
          ))}
        </S.EtapasGrid>
      )}
    </>
  );
};

export default EtapasList;
