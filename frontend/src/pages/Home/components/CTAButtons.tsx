/**
 * CTAButtons.tsx
 *
 * Responsabilidade única: Botões de call-to-action (Criar Arena / Login)
 */

import React from "react";
import * as S from "../Home.styles";

export const CTAButtons: React.FC = () => {
  return (
    <S.Actions>
      <S.Button to="/register" $variant="primary">
        Criar Minha Arena
      </S.Button>
      <S.Button to="/login" $variant="secondary">
        Já tenho uma Arena
      </S.Button>
    </S.Actions>
  );
};

export default CTAButtons;
