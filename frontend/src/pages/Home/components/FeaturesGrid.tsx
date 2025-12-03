/**
 * FeaturesGrid.tsx
 *
 * Responsabilidade única: Grid de funcionalidades do sistema
 */

import React from "react";
import * as S from "../Home.styles";

interface Feature {
  icon: string;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: "👥",
    title: "Gestão de Jogadores",
    description: "Cadastro e organização de jogadores por gênero e nível",
  },
  {
    icon: "🏆",
    title: "Torneios",
    description: "Criação automática de chaves e grupos",
  },
  {
    icon: "📊",
    title: "Rankings",
    description: "Sistema de pontuação e estatísticas",
  },
  {
    icon: "🏟️",
    title: "Multi-Arena",
    description: "Suporte para múltiplas arenas",
  },
];

export const FeaturesGrid: React.FC = () => {
  return (
    <S.FeaturesGrid>
      {features.map((feature, index) => (
        <S.FeatureCard key={index}>
          <S.FeatureIcon>{feature.icon}</S.FeatureIcon>
          <S.FeatureTitle>{feature.title}</S.FeatureTitle>
          <S.FeatureText>{feature.description}</S.FeatureText>
        </S.FeatureCard>
      ))}
    </S.FeaturesGrid>
  );
};

export default FeaturesGrid;
