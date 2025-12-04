/**
 * EtapaHeader.tsx
 *
 * Responsabilidade única: Header com breadcrumb, título e badges da etapa
 */

import React from "react";
import { EtapaPublica } from "@/services/arenaPublicService";
import { getStatusLabel } from "@/utils/formatters";
import * as S from "../EtapaDetalhe.styles";

export interface EtapaHeaderProps {
  slug: string;
  arenaName: string;
  etapa: EtapaPublica;
  onBack: () => void;
}

export const EtapaHeader: React.FC<EtapaHeaderProps> = ({
  slug,
  arenaName,
  etapa,
  onBack,
}) => {
  return (
    <S.TopBar>
      <S.TopBarInner>
        {/* Breadcrumbs */}
        <S.Breadcrumbs>
          <S.BreadLink to={`/arena/${slug}`}>{arenaName}</S.BreadLink>
          <S.BreadSep>›</S.BreadSep>
          <S.BreadCurrent>{etapa.nome}</S.BreadCurrent>
        </S.Breadcrumbs>

        {/* Title and Actions */}
        <S.HeaderRow>
          <S.TitleArea>
            <S.PageTitle>
              #{etapa.numero} {etapa.nome}
            </S.PageTitle>

            {/* Badge de Status */}
            <S.BadgeGroup>
              <S.Badge $variant={etapa.status}>
                {getStatusLabel(etapa.status)}
              </S.Badge>
            </S.BadgeGroup>
          </S.TitleArea>

          <S.BackButton onClick={onBack}>← Voltar</S.BackButton>
        </S.HeaderRow>
      </S.TopBarInner>
    </S.TopBar>
  );
};

export default EtapaHeader;
