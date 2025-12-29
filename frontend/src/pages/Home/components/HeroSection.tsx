/**
 * Responsabilidade: Hero section da landing page
 */

import React from "react";
import * as S from "../../Home/Home.styles";

export const HeroSection: React.FC = () => {
  return (
    <S.HeroSection>
      <S.HeroContent>
        <S.Title>Dupley</S.Title>
        <S.Subtitle>
          A plataforma completa para gerenciar seus torneios. Organize
          competições profissionais com facilidade, desde a inscrição até o
          pódio final.
        </S.Subtitle>
        <S.CTAButtons>
          <S.CTAButton to="/register">Criar Minha Arena</S.CTAButton>
          <S.CTAButton to="/login" $variant="secondary">
            Fazer Login
          </S.CTAButton>
        </S.CTAButtons>
      </S.HeroContent>
    </S.HeroSection>
  );
};

export default HeroSection;
