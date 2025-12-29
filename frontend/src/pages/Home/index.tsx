/**
 * Responsabilidade: Orquestrar componentes da página Home (Landing Page)
 */

import React from "react";
import { useDocumentTitle } from "@/hooks";
import { HeroSection } from "../Home/components/HeroSection";
import { FormatosSection } from "../Home/components/FormatosSection";
import { GaleriaSection } from "../Home/components/GaleriaSection";
import { FeaturesSection } from "../Home/components/FeaturesSection";
import { Footer } from "@/components/layout/Footer";
import * as S from "./Home.styles";
import HowItWorks from "../Home/components/HowItWorks";

export const Home: React.FC = () => {
  useDocumentTitle("Dupley - Gerencie seus torneios");

  return (
    <S.Container>
      <HeroSection />
      <FormatosSection />
      <GaleriaSection />
      <FeaturesSection />
      <HowItWorks />
      <Footer />
    </S.Container>
  );
};

export default Home;
