/**
 * Home/index.tsx
 *
 * Responsabilidade única: Orquestrar componentes da landing page
 *
 * SOLID aplicado:
 * - SRP: Cada componente tem uma responsabilidade única
 * - OCP: Componentes são extensíveis sem modificação
 * - DIP: Componentes dependem de abstrações (props)
 */

import React from "react";
import { useDocumentTitle } from "@/hooks";
import { HeroSection } from "./components/HeroSection";
import { FeaturesGrid } from "./components/FeaturesGrid";
import { CTAButtons } from "./components/CTAButtons";
import { HowItWorks } from "./components/HowItWorks";
import { Footer } from "@/components/layout/Footer";
import * as S from "./Home.styles";

export const Home: React.FC = () => {
  useDocumentTitle("Início");

  return (
    <S.Container>
      {/* Hero Section */}
      <S.Hero>
        <HeroSection />
        <FeaturesGrid />
        <CTAButtons />
      </S.Hero>

      {/* How It Works Section */}
      <HowItWorks />

      {/* Footer */}
      <Footer />
    </S.Container>
  );
};

export default Home;
