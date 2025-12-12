/**
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

  const getFormatoLabel = () => {
    if (etapa.formato === FormatoEtapa.REI_DA_PRAIA) {
      return "Rei da Praia";
    }
    if (etapa.formato === FormatoEtapa.SUPER_X) {
      return `Super ${etapa.varianteSuperX || 8}`;
    }
    if (etapa.formato === FormatoEtapa.TEAMS) {
      return `Teams ${etapa.varianteTeams || 4}`;
    }
    return "Dupla Fixa";
  };

  const formatoLabel = getFormatoLabel();

  return (
    <S.Header>
      <S.BackButton onClick={() => navigate("/admin/etapas")}>
        ← Voltar para etapas
      </S.BackButton>

      <S.HeaderRow>
        <S.HeaderContent>
          <S.TitleWrapper>
            <S.Title>{etapa.nome}</S.Title>
            <S.BadgesRow>
              <StatusBadge status={etapa.status} />
              <S.FormatoBadge $formato={etapa.formato}>
                {formatoLabel}
              </S.FormatoBadge>
            </S.BadgesRow>
          </S.TitleWrapper>
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
