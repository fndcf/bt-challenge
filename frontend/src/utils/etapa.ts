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

// Mesmos limites da geração de grupos do Teams no backend
const LIMITES_GRUPOS_TEAMS: [equipes: number, grupos: number][] = [
  [5, 1],
  [8, 2],
  [12, 3],
  [16, 4],
  [20, 5],
  [24, 6],
  [28, 7],
];

/** Quantos grupos o Teams terá com esse número de equipes (1 = sem grupos) */
export const calcularGruposTeams = (equipes: number): number =>
  LIMITES_GRUPOS_TEAMS.find(([limite]) => equipes <= limite)?.[1] ?? 8;
