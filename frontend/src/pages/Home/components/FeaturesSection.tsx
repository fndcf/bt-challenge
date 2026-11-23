/**
 * Responsabilidade: Seção de funcionalidades do sistema
 */

import React from "react";
import * as S from "../Home.styles";

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
    <S.Secao $alternativa>
      <S.Conteudo>
        <S.TituloSecao>Funcionalidades</S.TituloSecao>
        <S.SubtituloSecao>
          Tudo o que a arena precisa para organizar o circuito.
        </S.SubtituloSecao>

        <S.Grade $colunas={3}>
          {features.map((feature) => (
            <S.Cartao key={feature.title}>
              <S.TituloCartao>{feature.title}</S.TituloCartao>
              <S.TextoCartao>{feature.description}</S.TextoCartao>
            </S.Cartao>
          ))}
        </S.Grade>
      </S.Conteudo>
    </S.Secao>
  );
};

export default FeaturesSection;
