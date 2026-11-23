/**
 * Responsabilidade: Orquestrar componentes da página Home (Landing Page)
 */

import React from "react";
import { useDocumentTitle } from "@/hooks";
import { HeroSection } from "./components/HeroSection";
import { FormatosSection } from "./components/FormatosSection";
import { GaleriaSection } from "./components/GaleriaSection";
import { FeaturesSection } from "./components/FeaturesSection";
import { Footer } from "@/components/layout/Footer";
import * as S from "./Home.styles";
import HowItWorks from "./components/HowItWorks";

export const Home: React.FC = () => {
  useDocumentTitle("Dupley - Gerencie seus torneios");

  return (
    <S.Container>
      <HeroSection />
      <HowItWorks />
      <FormatosSection />
      <GaleriaSection />
      <FeaturesSection />
      <Footer />
    </S.Container>
  );
};

export default Home;
