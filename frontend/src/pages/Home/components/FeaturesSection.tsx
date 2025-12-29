/**
 * Responsabilidade: Seção de funcionalidades do sistema
 */

import React from "react";
import * as S from "../../Home/Home.styles";

interface Feature {
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    title: "Gestão de Jogadores",
    description:
      "Cadastre jogadores por nível (iniciante, intermediário, avançado) e gênero.",
  },
  {
    title: "Geração Automática",
    description:
      "Grupos e chaves eliminatórias gerados automaticamente com um clique.",
  },
  {
    title: "Rankings Dinâmicos",
    description:
      "Sistema de pontuação automático que atualiza o ranking após cada etapa.",
  },
  {
    title: "Multi-Arena",
    description:
      "Gerencie várias arenas independentes com seus próprios jogadores e etapas.",
  },
  {
    title: "Página Pública",
    description:
      "Cada arena tem sua página pública para divulgar etapas e resultados.",
  },
  {
    title: "Estatísticas",
    description:
      "Histórico completo de participações, vitórias e desempenho dos jogadores.",
  },
];

export const FeaturesSection: React.FC = () => {
  return (
    <S.FeaturesSection>
      <S.FeaturesSectionTitle>Funcionalidades</S.FeaturesSectionTitle>

      <S.FeaturesGrid>
        {features.map((feature, index) => (
          <S.FeatureCard key={index}>
            <S.FeatureTitle>{feature.title}</S.FeatureTitle>
            <S.FeatureText>{feature.description}</S.FeatureText>
          </S.FeatureCard>
        ))}
      </S.FeaturesGrid>
    </S.FeaturesSection>
  );
};

export default FeaturesSection;
