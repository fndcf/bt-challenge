/**
 * HeroSection.tsx
 *
 * Responsabilidade única: Seção hero da landing page com título e subtitle
 */

import React from "react";
import * as S from "../Home.styles";

export const HeroSection: React.FC = () => {
  return (
    <>
      <S.Title>Challenge BT</S.Title>
      <S.Subtitle>
        Sistema de Gerenciamento de Torneios de Beach Tennis
      </S.Subtitle>
    </>
  );
};

export default HeroSection;
