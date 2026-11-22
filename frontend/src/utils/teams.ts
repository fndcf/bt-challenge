/**
 * Textos e regras de exibição do formato Teams
 */

import type { BadgeTom } from "@/components/ui";
import { FaseEtapa } from "@/types/chave";
import {
  ConfrontoEquipe,
  StatusConfronto,
  VarianteTeams,
} from "@/types/teams";

export interface VarianteTeamsInfo {
  nome: string;
  jogadoresPorEquipe: number;
  jogosPorConfronto: number;
}

export const getVarianteTeamsInfo = (
  variante?: VarianteTeams
): VarianteTeamsInfo => {
  switch (variante) {
    case VarianteTeams.TEAMS_4:
      return { nome: "TEAMS 4", jogadoresPorEquipe: 4, jogosPorConfronto: 2 };
    case VarianteTeams.TEAMS_6:
      return { nome: "TEAMS 6", jogadoresPorEquipe: 6, jogosPorConfronto: 3 };
    default:
      return { nome: "TEAMS", jogadoresPorEquipe: 4, jogosPorConfronto: 2 };
  }
};

/** Campos do confronto que definem situação e vencedor (admin e público) */
interface ConfrontoResumo {
  status?: string;
  jogosEquipe1?: number;
  jogosEquipe2?: number;
  vencedoraId?: string;
}

export const confrontoFinalizado = (confronto: ConfrontoResumo): boolean =>
  confronto.status?.toLowerCase() === StatusConfronto.FINALIZADO;

/** Com jogo contado está em andamento, mesmo que o status gravado diga agendado */
export const getSituacaoConfronto = (
  confronto: ConfrontoResumo,
  rotuloPendente = "Aguardando"
): { label: string; tom: BadgeTom } => {
  if (confrontoFinalizado(confronto)) {
    return { label: "Finalizado", tom: "sucesso" };
  }

  const jogos = (confronto.jogosEquipe1 || 0) + (confronto.jogosEquipe2 || 0);
  const emAndamento =
    confronto.status?.toLowerCase() === StatusConfronto.EM_ANDAMENTO;
  return jogos > 0 || emAndamento
    ? { label: "Em andamento", tom: "info" }
    : { label: rotuloPendente, tom: "aviso" };
};

/** Só há vencedor depois de encerrado */
export const equipeVenceu = (
  confronto: ConfrontoResumo,
  equipeId?: string
): boolean =>
  !!equipeId &&
  confrontoFinalizado(confronto) &&
  confronto.vencedoraId === equipeId;

const TIPO_JOGO: Record<string, string> = {
  feminino: "FEM",
  masculino: "MASC",
  misto: "MISTO",
  decider: "DECIDER",
};

export const getTipoJogoLabel = (tipo: string): string =>
  TIPO_JOGO[tipo] ?? tipo.toUpperCase();

/** Empate em 1 a 1 no TEAMS 4, ainda sem o jogo de desempate */
export const precisaDecider = (
  confronto: ConfrontoEquipe,
  variante?: VarianteTeams
): boolean =>
  variante === VarianteTeams.TEAMS_4 &&
  confronto.jogosEquipe1 === 1 &&
  confronto.jogosEquipe2 === 1 &&
  !confrontoFinalizado(confronto) &&
  !confronto.temDecider;

export const FASES_ELIMINATORIA_TEAMS = [
  { fase: FaseEtapa.OITAVAS, nome: "Oitavas de Final" },
  { fase: FaseEtapa.QUARTAS, nome: "Quartas de Final" },
  { fase: FaseEtapa.SEMIFINAL, nome: "Semifinais" },
  { fase: FaseEtapa.FINAL, nome: "Final" },
];

export const contarFinalizados = (confrontos: ConfrontoEquipe[]): number =>
  confrontos.filter(confrontoFinalizado).length;

export const ordenarConfrontos = (
  confrontos: ConfrontoEquipe[]
): ConfrontoEquipe[] => [...confrontos].sort((a, b) => a.ordem - b.ordem);
