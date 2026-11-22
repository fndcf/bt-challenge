/**
 * Responsabilidade única: Exibir alertas de restrições na edição
 */

import React from "react";
import { Alert } from "@/components/ui";

export interface RestrictionsListProps {
  chavesGeradas: boolean;
  temInscritos: boolean;
}

export const RestricoesList: React.FC<RestrictionsListProps> = ({
  chavesGeradas,
  temInscritos,
}) => {
  if (chavesGeradas) {
    return (
      <Alert variant="error">
        Esta etapa não pode ser editada pois as chaves já foram geradas
      </Alert>
    );
  }

  if (temInscritos) {
    return (
      <Alert variant="warning">
        <p>Esta etapa já possui inscritos. Algumas alterações são restritas:</p>
        <ul>
          <li>Não é possível alterar o nível ou gênero</li>
          <li>Não é possível diminuir o número máximo de jogadores</li>
        </ul>
      </Alert>
    );
  }

  return null;
};

export default RestricoesList;
