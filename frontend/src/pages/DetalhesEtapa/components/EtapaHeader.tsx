/**
 * EtapaHeader.tsx
 *
 * Responsabilidade única: Renderizar cabeçalho da etapa com ações
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { Etapa, FormatoEtapa } from "@/types/etapa";
import { StatusBadge } from "@/components/etapas/StatusBadge";
import { formatarData } from "@/utils/formatters";
import * as S from "../DetalhesEtapa.styles";

interface EtapaHeaderProps {
  etapa: Etapa;
  onEditar: () => void;
  onExcluir: () => void;
}

export const EtapaHeader: React.FC<EtapaHeaderProps> = ({
  etapa,
  onEditar,
  onExcluir,
}) => {
  const navigate = useNavigate();

  const formatoLabel =
    etapa.formato === FormatoEtapa.REI_DA_PRAIA ? "Rei da Praia" : "Dupla Fixa";

  return (
    <S.Header>
      <S.BackButton onClick={() => navigate("/admin/etapas")}>
        ← Voltar para etapas
      </S.BackButton>

      <S.HeaderRow>
        <S.HeaderContent>
          <S.Title>
            {etapa.nome}
            <StatusBadge status={etapa.status} />
            <S.FormatoBadge $formato={etapa.formato}>
              {formatoLabel}
            </S.FormatoBadge>
          </S.Title>
          <S.Subtitle>
            {formatarData(etapa.dataRealizacao)}
            {etapa.local && ` • ${etapa.local}`}
          </S.Subtitle>
        </S.HeaderContent>

        <S.HeaderActions>
          <S.ActionButton onClick={onEditar}>Editar</S.ActionButton>
          <S.ActionButton $variant="danger" onClick={onExcluir}>
            Excluir
          </S.ActionButton>
        </S.HeaderActions>
      </S.HeaderRow>
    </S.Header>
  );
};

export default EtapaHeader;
