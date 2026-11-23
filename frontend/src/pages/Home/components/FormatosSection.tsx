/**
 * Responsabilidade: Seção de formatos de torneio
 */

import React from "react";
import { FormatoEtapa } from "@/types/etapa";
import { getCoresFormato } from "@/styles/semantic";
import * as S from "../Home.styles";

interface Formato {
  formato: FormatoEtapa;
  description: string;
  features: string[];
}

const formatos: Formato[] = [
  {
    formato: FormatoEtapa.DUPLA_FIXA,
    description:
      "Formato tradicional: as duplas são sorteadas e jogam juntas a etapa inteira.",
    features: [
      "Fase de grupos + eliminatória",
      "Formação balanceada ou por nível",
      "Etapas mistas",
    ],
  },
  {
    formato: FormatoEtapa.REI_DA_PRAIA,
    description:
      "Cada jogador se inscreve sozinho e troca de parceiro a cada partida, em grupos de 4.",
    features: [
      "3 parceiros diferentes por grupo",
      "Classificação individual",
      "Todos os níveis juntos",
    ],
  },
  {
    formato: FormatoEtapa.SUPER_X,
    description:
      "Parecido com o Rei da Praia, mas em grupo único e sem eliminatória. Ideal para eventos rápidos.",
    features: [
      "Super 8: 8 jogadores, 7 rodadas",
      "Super 12: 12 jogadores, 11 rodadas",
      "Compacto e dinâmico",
    ],
  },
  {
    formato: FormatoEtapa.TEAMS,
    description:
      "Equipes de 4 ou 6 jogadores se enfrentam em confrontos com várias partidas.",
    features: [
      "Confrontos entre equipes",
      "Formação por nível, balanceada ou manual",
      "Equipes mistas",
    ],
  },
];

export const FormatosSection: React.FC = () => {
  return (
    <S.Secao $alternativa>
      <S.Conteudo>
        <S.TituloSecao>Formatos de Torneio</S.TituloSecao>
        <S.SubtituloSecao>
          Escolha o formato ideal para sua competição. Cada um com suas regras
          de grupos, pontuação e classificação.
        </S.SubtituloSecao>

        <S.Grade $colunas={4}>
          {formatos.map(({ formato, description, features }) => {
            const cores = getCoresFormato(formato);
            return (
              <S.Cartao key={formato} $cor={cores.solido}>
                <S.TituloCartao $cor={cores.texto}>
                  {cores.nome}
                </S.TituloCartao>
                <S.TextoCartao>{description}</S.TextoCartao>
                <S.ListaFormato>
                  {features.map((feature) => (
                    <S.ItemFormato key={feature} $cor={cores.solido}>
                      {feature}
                    </S.ItemFormato>
                  ))}
                </S.ListaFormato>
              </S.Cartao>
            );
          })}
        </S.Grade>
      </S.Conteudo>
    </S.Secao>
  );
};

export default FormatosSection;
