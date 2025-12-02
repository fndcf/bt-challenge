/**
 * CabecasTab.tsx
 *
 * Responsabilidade única: Renderizar aba de cabeças de chave
 */

import React from "react";
import { Etapa, Inscricao, StatusEtapa } from "@/types/etapa";
import { GerenciarCabecasDeChave } from "@/components/etapas/GerenciarCabecasDeChave";
import * as S from "../DetalhesEtapa.styles";

interface CabecasTabProps {
  etapa: Etapa & { inscricoes?: Inscricao[] };
  onUpdate: () => void;
}

export const CabecasTab: React.FC<CabecasTabProps> = ({ etapa, onUpdate }) => {
  // Antes de encerrar inscrições
  if (etapa.status === StatusEtapa.INSCRICOES_ABERTAS) {
    return (
      <S.Card>
        <S.CardTitle>👑 Cabeças de Chave</S.CardTitle>
        <S.CardContent>
          <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
            As cabeças de chave podem ser gerenciadas após encerrar as inscrições.
          </p>
          <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>
            💡 <strong>O que são cabeças de chave?</strong>
            <br />
            São os jogadores mais fortes que serão distribuídos em grupos diferentes
            para equilibrar a competição.
          </p>
        </S.CardContent>
      </S.Card>
    );
  }

  // Após gerar chaves - modo readonly
  if (etapa.chavesGeradas) {
    return (
      <GerenciarCabecasDeChave
        arenaId={etapa.arenaId}
        etapaId={etapa.id}
        inscricoes={etapa.inscricoes || []}
        formato={etapa.formato}
        totalInscritos={etapa.totalInscritos}
        qtdGrupos={etapa.qtdGrupos}
        onUpdate={onUpdate}
        readOnly={true}
      />
    );
  }

  // Inscrições encerradas mas chaves ainda não geradas - modo edição
  return (
    <GerenciarCabecasDeChave
      arenaId={etapa.arenaId}
      etapaId={etapa.id}
      inscricoes={etapa.inscricoes || []}
      formato={etapa.formato}
      totalInscritos={etapa.totalInscritos}
      qtdGrupos={etapa.qtdGrupos}
      onUpdate={onUpdate}
      readOnly={false}
    />
  );
};

export default CabecasTab;
