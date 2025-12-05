/**
 * Responsabilidade única: Seção "Como Funciona" com steps do processo
 */

import React from "react";
import * as S from "../Home.styles";

interface StepData {
  number: number;
  title: string;
  description: string;
}

const steps: StepData[] = [
  {
    number: 1,
    title: "Cadastro de Jogadores",
    description: "Jogadores se cadastram individualmente por nível e gênero",
  },
  {
    number: 2,
    title: "Criação de Etapas",
    description:
      "Configure o formato (Rei da Praia ou Dupla Fixa) e organize os grupos",
  },
  {
    number: 3,
    title: "Fase de Grupos",
    description: "Todos jogam contra todos no grupo",
  },
  {
    number: 4,
    title: "Eliminatórias",
    description: "Os melhores avançam para a fase final",
  },
  {
    number: 5,
    title: "Ranking",
    description: "Pontuação individual acumulada ao longo das etapas",
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <S.InfoSection>
      <S.InfoTitle>Como Funciona?</S.InfoTitle>

      <S.StepsContainer>
        {steps.map((step) => (
          <S.Step key={step.number}>
            <S.StepNumber>{step.number}</S.StepNumber>
            <S.StepTitle>{step.title}</S.StepTitle>
            <S.StepText>{step.description}</S.StepText>
          </S.Step>
        ))}
      </S.StepsContainer>
    </S.InfoSection>
  );
};

export default HowItWorks;
