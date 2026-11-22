/**
 * Regras compartilhadas dos modais de lançamento de resultados em lote
 * (Dupla Fixa, Rei da Praia, Super X e Teams).
 */

import type { BadgeTom } from "@/components/ui";
import {
  deveExibirTerceiroSet,
  montarPlacarFinal,
  SetScore,
  setVazio,
  validarSet,
} from "./placarMelhorDe3";

export interface PlacarSets {
  set1: SetScore;
  set2: SetScore;
  set3: SetScore;
}

export type ChaveSet = keyof PlacarSets;
export type CampoSet = keyof SetScore;

export interface ResultadoPartida extends PlacarSets {
  partidaId: string;
}

interface PartidaComPlacar {
  id: string;
  status: string;
  placar?: Array<{ gamesDupla1: number; gamesDupla2: number }>;
}

const paraSet = (set?: {
  gamesDupla1: number;
  gamesDupla2: number;
}): SetScore =>
  set ? { gamesDupla1: set.gamesDupla1, gamesDupla2: set.gamesDupla2 } : {};

/** Partidas finalizadas começam com o placar salvo; as demais, vazias */
export const montarResultadosIniciais = (
  partidas: PartidaComPlacar[]
): Map<string, ResultadoPartida> =>
  new Map(
    partidas.map((partida) => {
      const sets = partida.status === "finalizada" ? partida.placar || [] : [];
      return [
        partida.id,
        {
          partidaId: partida.id,
          set1: paraSet(sets[0]),
          set2: paraSet(sets[1]),
          set3: paraSet(sets[2]),
        },
      ];
    })
  );

/** Nada preenchido: a partida é pulada ao salvar */
export const resultadoVazio = (
  resultado: PlacarSets,
  melhorDe3: boolean
): boolean =>
  setVazio(resultado.set1) && (!melhorDe3 || setVazio(resultado.set2));

/** Mensagem de erro, ou undefined se o placar é válido ou está vazio */
export const validarResultado = (
  resultado: PlacarSets,
  melhorDe3: boolean
): string | undefined => {
  if (resultadoVazio(resultado, melhorDe3)) return undefined;

  const erroSet1 = validarSet(resultado.set1, true);
  if (erroSet1) return erroSet1;

  if (!melhorDe3) return undefined;

  const erroSet2 = validarSet(resultado.set2, true);
  if (erroSet2) return `Set 2: ${erroSet2}`;

  if (deveExibirTerceiroSet(resultado.set1, resultado.set2)) {
    const erroSet3 = validarSet(resultado.set3, true);
    if (erroSet3) return `Set 3 (desempate): ${erroSet3}`;
  }

  return undefined;
};

/** Sets que valem para o formato da partida, no formato enviado à API */
export const montarPlacarEnvio = (resultado: PlacarSets, melhorDe3: boolean) => {
  const { set1, set2, set3 } = resultado;
  if (!melhorDe3) return montarPlacarFinal([set1]);

  return montarPlacarFinal(
    deveExibirTerceiroSet(set1, set2) ? [set1, set2, set3] : [set1, set2]
  );
};

const SITUACAO_PARTIDA: Record<string, { label: string; tom: BadgeTom }> = {
  agendada: { label: "Aguardando", tom: "aviso" },
  finalizada: { label: "Finalizada", tom: "sucesso" },
  cancelada: { label: "Cancelada", tom: "neutro" },
  wo: { label: "W.O.", tom: "neutro" },
};

export const getSituacaoPartida = (
  status: string
): { label: string; tom: BadgeTom } =>
  SITUACAO_PARTIDA[status] ?? { label: status, tom: "neutro" };
