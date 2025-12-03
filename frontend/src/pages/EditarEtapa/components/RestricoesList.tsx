/**
 * RestricoesList.tsx
 *
 * Responsabilidade única: Exibir alertas de restrições na edição
 */

import React from "react";
import { FormatoEtapa } from "@/types/etapa";
import * as S from "../EditarEtapa.styles";

export interface RestricaoItem {
  texto: string;
}

export interface RestrictionsListProps {
  formato: FormatoEtapa;
  chavesGeradas: boolean;
  temInscritos: boolean;
}

export const RestricoesList: React.FC<RestrictionsListProps> = ({
  chavesGeradas,
  temInscritos,
}) => {

  // Se chaves já foram geradas, não pode editar nada
  if (chavesGeradas) {
    return (
      <S.AlertCard $variant="error">
        <S.AlertText>
          Esta etapa não pode ser editada pois as chaves já foram geradas
        </S.AlertText>
      </S.AlertCard>
    );
  }

  // Se tem inscritos mas chaves não foram geradas
  if (temInscritos) {
    return (
      <S.AlertCard $variant="warning">
        <S.AlertText>
          Esta etapa já possui inscritos. Algumas alterações são restritas:
        </S.AlertText>
        <S.AlertList>
          <li>Não é possível alterar o nível ou gênero</li>
          <li>Não é possível diminuir o número máximo de jogadores</li>
        </S.AlertList>
      </S.AlertCard>
    );
  }

  // Sem restrições
  return null;
};

export default RestricoesList;
