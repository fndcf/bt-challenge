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
    description: "Cadastre os jogadores da arena por nível e gênero",
  },
  {
    number: 2,
    title: "Criação de Etapas",
    description:
      "Escolha o formato (Dupla Fixa, Rei da Praia, Super X ou Teams) e inscreva os jogadores",
  },
  {
    number: 3,
    title: "Fase de Grupos",
    description: "Grupos gerados automaticamente; todos jogam contra todos",
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
    <S.Secao>
      <S.Conteudo>
        <S.TituloSecao>Como Funciona?</S.TituloSecao>
        <S.SubtituloSecao>Do cadastro ao ranking em cinco passos.</S.SubtituloSecao>

        <S.Passos>
          {steps.map((step) => (
            <S.Passo key={step.number}>
              <S.NumeroPasso>{step.number}</S.NumeroPasso>
              <div>
                <S.TituloCartao>{step.title}</S.TituloCartao>
                <S.TextoCartao>{step.description}</S.TextoCartao>
              </div>
            </S.Passo>
          ))}
        </S.Passos>
      </S.Conteudo>
    </S.Secao>
  );
};

export default HowItWorks;
