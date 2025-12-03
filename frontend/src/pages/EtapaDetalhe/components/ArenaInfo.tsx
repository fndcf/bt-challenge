/**
 * ArenaInfo.tsx
 *
 * Responsabilidade única: Card lateral com informações da arena
 */

import React from "react";
import { ArenaPublica } from "@/services/arenaPublicService";
import * as S from "../EtapaDetalhe.styles";

export interface ArenaInfoProps {
  arena: ArenaPublica;
}

export const ArenaInfo: React.FC<ArenaInfoProps> = ({ arena }) => {
  return (
    <S.Card>
      <S.CardHeader>
        <S.CardTitle>Arena</S.CardTitle>
      </S.CardHeader>
      <S.InfoBox>
        <S.InfoLabel>Nome</S.InfoLabel>
        <S.InfoValue>{arena.nome}</S.InfoValue>
      </S.InfoBox>
    </S.Card>
  );
};

export default ArenaInfo;
