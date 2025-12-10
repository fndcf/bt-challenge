/**
 * Responsabilidade única: Card com informações gerais da etapa
 */

import React from "react";
import { EtapaPublica } from "@/services/arenaPublicService";
import {
  formatarData,
  getFormatoLabel,
  getNivelLabel,
  getGeneroLabel,
} from "@/utils/formatters";
import * as S from "../EtapaDetalhe.styles";

export interface EtapaInfoProps {
  etapa: EtapaPublica;
  totalJogadores: number;
}

export const EtapaInfo: React.FC<EtapaInfoProps> = ({
  etapa,
  totalJogadores,
}) => {
  return (
    <S.Card>
      <S.CardHeader>
        <S.CardTitle>Informações da Etapa</S.CardTitle>
      </S.CardHeader>

      <S.InfoGrid>
        {/* Data */}
        <S.InfoBox>
          <S.InfoLabel>Data</S.InfoLabel>
          <S.InfoValue>{formatarData(etapa.dataRealizacao)}</S.InfoValue>
        </S.InfoBox>

        {/* Formato */}
        <S.InfoBox>
          <S.InfoLabel>Formato</S.InfoLabel>
          <S.InfoValue>{getFormatoLabel(etapa.formato, etapa.varianteSuperX)}</S.InfoValue>
        </S.InfoBox>

        {/* Nível */}
        {etapa.nivel && (
          <S.InfoBox>
            <S.InfoLabel>Nível</S.InfoLabel>
            <S.InfoValue>{getNivelLabel(etapa.nivel)}</S.InfoValue>
          </S.InfoBox>
        )}

        {/* Gênero */}
        {etapa.genero && (
          <S.InfoBox>
            <S.InfoLabel>Gênero</S.InfoLabel>
            <S.InfoValue>{getGeneroLabel(etapa.genero)}</S.InfoValue>
          </S.InfoBox>
        )}

        {/* Jogadores */}
        <S.InfoBox>
          <S.InfoLabel>Jogadores</S.InfoLabel>
          <S.InfoValue>{totalJogadores} inscritos</S.InfoValue>
        </S.InfoBox>
      </S.InfoGrid>

      {/* Descrição */}
      {etapa.descricao && <S.Desc>{etapa.descricao}</S.Desc>}
    </S.Card>
  );
};

export default EtapaInfo;
