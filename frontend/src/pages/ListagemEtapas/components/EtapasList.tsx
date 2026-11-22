/**
 * Responsabilidade única: Renderizar lista de etapas com estados (loading, error, empty)
 */

import React from "react";
import { EtapaCard } from "@/components/etapas/EtapaCard";
import { CarregandoPagina, Grade } from "@/components/layout/Pagina";
import { Alert, Button, EmptyState } from "@/components/ui";
import { Etapa } from "@/types/etapa";

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
  if (loading) {
    return <CarregandoPagina mensagem="Carregando etapas..." />;
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (etapas.length === 0) {
    return (
      <EmptyState
        titulo="Nenhuma etapa encontrada"
        descricao={
          temFiltrosAtivos
            ? "Não há etapas com os filtros selecionados."
            : "Comece criando sua primeira etapa!"
        }
        acao={
          !temFiltrosAtivos && (
            <Button onClick={onCriarClick}>Criar Primeira Etapa</Button>
          )
        }
      />
    );
  }

  return (
    <Grade $minimo="20rem" $preencher>
      {etapas.map((etapa) => (
        <EtapaCard key={etapa.id} etapa={etapa} />
      ))}
    </Grade>
  );
};

export default EtapasList;
