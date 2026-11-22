/**
 * Responsabilidade única: Renderizar aba de cabeças de chave
 */

import React from "react";
import { GerenciarCabecasDeChave } from "@/components/etapas/GerenciarCabecasDeChave";
import { Alert } from "@/components/ui";
import { Etapa, Inscricao, StatusEtapa } from "@/types/etapa";
import { getQtdGrupos } from "@/utils/etapa";
import { Cartao, CartaoTitulo, Texto } from "@/components/layout/Pagina";

interface CabecasTabProps {
  etapa: Etapa & { inscricoes?: Inscricao[] };
  onUpdate: () => void;
}

export const CabecasTab: React.FC<CabecasTabProps> = ({ etapa, onUpdate }) => {
  if (etapa.status === StatusEtapa.INSCRICOES_ABERTAS) {
    return (
      <Cartao>
        <CartaoTitulo>Cabeças de Chave</CartaoTitulo>
        <Texto>
          As cabeças de chave podem ser gerenciadas após encerrar as inscrições.
        </Texto>
        <Alert title="O que são cabeças de chave?">
          São os jogadores mais fortes que serão distribuídos em grupos
          diferentes para equilibrar a competição.
        </Alert>
      </Cartao>
    );
  }

  return (
    <GerenciarCabecasDeChave
      arenaId={etapa.arenaId}
      etapaId={etapa.id}
      inscricoes={etapa.inscricoes || []}
      formato={etapa.formato}
      totalInscritos={etapa.totalInscritos}
      qtdGrupos={getQtdGrupos(etapa)}
      onUpdate={onUpdate}
      // Depois de gerar as chaves, só visualização
      readOnly={!!etapa.chavesGeradas}
    />
  );
};

export default CabecasTab;
