/**
 * Textos da etapa: formato, chaveamento e formação de equipes
 */

import {
  Etapa,
  FormatoEtapa,
  TipoChaveamentoReiDaPraia,
  TipoFormacaoEquipe,
} from "@/types/etapa";

/** Formato com a variante ("Super 8", "Teams 4") */
export const getFormatoEtapaLabel = (
  etapa: Pick<Etapa, "formato" | "varianteSuperX" | "varianteTeams">
): string => {
  switch (etapa.formato) {
    case FormatoEtapa.REI_DA_PRAIA:
      return "Rei da Praia";
    case FormatoEtapa.SUPER_X:
      return `Super ${etapa.varianteSuperX || 8}`;
    case FormatoEtapa.TEAMS:
      return `Teams ${etapa.varianteTeams || 4}`;
    default:
      return "Dupla Fixa";
  }
};

const CHAVEAMENTO: Record<
  TipoChaveamentoReiDaPraia,
  { completo: string; curto: string }
> = {
  [TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES]: {
    completo: "Melhores com Melhores",
    curto: "Melhores c/ Melhores",
  },
  [TipoChaveamentoReiDaPraia.PAREAMENTO_POR_RANKING]: {
    completo: "Pareamento por Ranking",
    curto: "Por Ranking",
  },
  [TipoChaveamentoReiDaPraia.SORTEIO_ALEATORIO]: {
    completo: "Sorteio Aleatório",
    curto: "Sorteio Aleatório",
  },
};

export const getChaveamentoLabel = (
  tipo: TipoChaveamentoReiDaPraia,
  tamanho: "completo" | "curto" = "completo"
): string => CHAVEAMENTO[tipo]?.[tamanho] ?? "";

const FORMACAO_EQUIPE: Record<TipoFormacaoEquipe, string> = {
  [TipoFormacaoEquipe.MESMO_NIVEL]: "Mesmo Nível",
  [TipoFormacaoEquipe.BALANCEADO]: "Balanceado",
  [TipoFormacaoEquipe.MANUAL]: "Manual",
};

export const getFormacaoEquipeLabel = (tipo: TipoFormacaoEquipe): string =>
  FORMACAO_EQUIPE[tipo] ?? "";

/**
 * Teto do Teams: 8 grupos (oitavas), 6 com 3 equipes e 2 com 4. Igual ao
 * MAX_EQUIPES_TEAMS do backend.
 */
export const MAX_EQUIPES_TEAMS = 26;

/**
 * Tamanho de cada grupo do Teams. Mesma regra do backend
 * (calcularDistribuicaoGrupos): grupos de 3, com 1 ou 2 de 4 para fechar a
 * conta; até 5 equipes, todos contra todos.
 */
export const calcularGruposTeams = (equipes: number): number[] => {
  if (equipes < 6) return [equipes];

  const gruposDe4 = equipes % 3;
  const gruposDe3 = (equipes - gruposDe4 * 4) / 3;
  return [
    ...Array<number>(gruposDe3).fill(3),
    ...Array<number>(gruposDe4).fill(4),
  ];
};

/** Confrontos da fase de grupos: todos contra todos em cada grupo */
export const contarConfrontosTeams = (equipes: number): number =>
  calcularGruposTeams(equipes).reduce((soma, n) => soma + (n * (n - 1)) / 2, 0);
