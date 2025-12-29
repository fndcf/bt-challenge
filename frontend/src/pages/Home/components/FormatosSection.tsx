/**
 * Responsabilidade: Seção de formatos de torneio
 */

import React from "react";
import * as S from "../../Home/Home.styles";

interface Formato {
  title: string;
  description: string;
  features: string[];
}

const formatos: Formato[] = [
  {
    title: "Dupla Fixa",
    description:
      "Formato tradicional onde duplas são formadas via sorteio e permanecem juntas durante toda a etapa.",
    features: [
      "Fase de grupos + Eliminatória",
      "Formação Balanceada ou Mesmo Nível",
      "Suporte a etapas Mistas",
    ],
  },
  {
    title: "Rei da Praia",
    description:
      "Jogadores individuais formam duplas rotativas a cada partida dentro de grupos de 4.",
    features: [
      "3 parceiros diferentes por grupo",
      "Classificação individual",
      "Todos os níveis permitidos",
    ],
  },
  {
    title: "Super X",
    description:
      "Similar ao Rei da Praia, mas com grupo único e sem fase eliminatória. Ideal para eventos rápidos.",
    features: [
      "Super 8: 8 jogadores, 7 rodadas",
      "Super 12: 12 jogadores, 11 rodadas",
      "Formato compacto e dinâmico",
    ],
  },
  {
    title: "TEAMS",
    description:
      "Formato por equipes com 4 ou 6 jogadores por time. Disputas entre equipes completas.",
    features: [
      "Confrontos entre equipes",
      "Formação: Mesmo Nível, Balanceado ou Manual",
      "Suporte a equipes mistas",
    ],
  },
];

export const FormatosSection: React.FC = () => {
  return (
    <S.FormatosSection>
      <S.SectionTitle>Formatos de Torneio</S.SectionTitle>
      <S.SectionSubtitle>
        Escolha o formato ideal para sua competição. Cada um com suas
        características únicas.
      </S.SectionSubtitle>

      <S.FormatosGrid>
        {formatos.map((formato, index) => (
          <S.FormatoCard key={index}>
            <S.FormatoTitle>{formato.title}</S.FormatoTitle>
            <S.FormatoDescription>{formato.description}</S.FormatoDescription>
            <S.FormatoFeatures>
              {formato.features.map((feature, idx) => (
                <S.FormatoFeature key={idx}>{feature}</S.FormatoFeature>
              ))}
            </S.FormatoFeatures>
          </S.FormatoCard>
        ))}
      </S.FormatosGrid>
    </S.FormatosSection>
  );
};

export default FormatosSection;
