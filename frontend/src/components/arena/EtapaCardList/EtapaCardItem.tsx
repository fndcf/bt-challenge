/**
 * Responsabilidade única: Renderizar um card individual de etapa
 */

import React from "react";
import { EtapaPublica } from "@/services/arenaPublicService";
import {
  getFormatoLabel,
  getStatusLabel,
  getNivelLabel,
  getGeneroLabel,
  formatarData,
} from "@/utils/formatters";
import * as S from "./EtapaCard.styles";

interface EtapaCardItemProps {
  etapa: EtapaPublica;
  arenaSlug: string;
}

export const EtapaCardItem: React.FC<EtapaCardItemProps> = ({
  etapa,
  arenaSlug,
}) => {
  return (
    <S.EtapaCard>
      <S.EtapaHeader>
        <S.EtapaNumero>#{etapa.numero}</S.EtapaNumero>
        <S.EtapaStatus $status={etapa.status}>
          {getStatusLabel(etapa.status)}
        </S.EtapaStatus>
      </S.EtapaHeader>

      <S.EtapaNome>{etapa.nome}</S.EtapaNome>

      <S.EtapaInfo>
        <S.InfoItem>
          <strong>Data:</strong> {formatarData(etapa.dataRealizacao)}
        </S.InfoItem>

        {etapa.nivel && (
          <S.InfoItem>
            <strong>Nível:</strong> {getNivelLabel(etapa.nivel)}
          </S.InfoItem>
        )}

        {etapa.genero && (
          <S.InfoItem>
            <strong>Gênero:</strong> {getGeneroLabel(etapa.genero)}
          </S.InfoItem>
        )}

        {etapa.totalJogadores !== undefined && (
          <S.InfoItem>
            <strong>Jogadores:</strong> {etapa.totalJogadores}
          </S.InfoItem>
        )}

        <S.InfoItem>
          <strong>Formato:</strong> {getFormatoLabel(etapa.formato)}
        </S.InfoItem>
      </S.EtapaInfo>

      {etapa.descricao && (
        <S.EtapaDescricao>{etapa.descricao}</S.EtapaDescricao>
      )}

      <S.VerMaisButton to={`/arena/${arenaSlug}/etapa/${etapa.id}`}>
        Ver Detalhes
      </S.VerMaisButton>
    </S.EtapaCard>
  );
};

export default EtapaCardItem;
