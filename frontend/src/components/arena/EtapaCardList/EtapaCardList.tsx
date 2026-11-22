/**
 * Responsabilidade única: Renderizar lista de etapas
 */

import React from "react";
import { EtapaCardItem } from "./EtapaCardItem";
import { Cartao, Grade } from "@/components/layout/Pagina";
import { EmptyState } from "@/components/ui";
import { EtapaPublica } from "@/services/arenaPublicService";

interface EtapaCardListProps {
  etapas: EtapaPublica[];
  arenaSlug: string;
}

export const EtapaCardList: React.FC<EtapaCardListProps> = ({
  etapas,
  arenaSlug,
}) => {
  if (etapas.length === 0) {
    return (
      <Cartao>
        <EmptyState
          titulo="Nenhuma Etapa Disponível"
          descricao="Não há etapas cadastradas no momento. Fique atento para novos torneios!"
        />
      </Cartao>
    );
  }

  return (
    <Grade $preencher>
      {etapas.map((etapa) => (
        <EtapaCardItem key={etapa.id} etapa={etapa} arenaSlug={arenaSlug} />
      ))}
    </Grade>
  );
};

export default EtapaCardList;
