/**
 * Regras de exibição da fase de grupos na página pública
 */

import type { BadgeTom } from "@/components/ui";
import { FormatoEtapa } from "@/types/etapa";
import { LinhaClassificacao } from "@/utils/classificacao";
import { confrontoFinalizado } from "@/utils/teams";
import { DuplaPartidaTeams, Grupo, JogadorEquipe, Partida } from "./types";

export const estaFinalizada = (status?: string): boolean =>
  ["FINALIZADO", "FINALIZADA"].includes(status?.toUpperCase() ?? "");

export const getSituacaoPartida = (
  status: string | undefined
): { label: string; tom: BadgeTom } => {
  if (estaFinalizada(status)) return { label: "Finalizada", tom: "sucesso" };
  return status?.toUpperCase() === "EM_ANDAMENTO"
    ? { label: "Ao vivo", tom: "info" }
    : { label: "Agendada", tom: "aviso" };
};

/** Games de um lado, set a set ("6, 3"); vazio enquanto não terminou */
export const formatarPlacar = (
  partida: Pick<Partida, "placar" | "status">,
  lado: 1 | 2
): string | undefined => {
  if (!estaFinalizada(partida.status) || !partida.placar?.length) {
    return undefined;
  }
  return partida.placar
    .map((set) => (lado === 1 ? set.gamesDupla1 : set.gamesDupla2))
    .join(", ");
};

/** A dupla vem como objeto (nomes) ou como lista de jogadores */
export const getDuplaNomes = (
  dupla?: DuplaPartidaTeams | JogadorEquipe[] | null
): string | undefined => {
  if (!dupla) return undefined;
  if (Array.isArray(dupla)) {
    return dupla.length >= 2
      ? `${dupla[0]?.nome} & ${dupla[1]?.nome}`
      : undefined;
  }
  if (dupla.jogador1Nome && dupla.jogador2Nome) {
    return `${dupla.jogador1Nome} & ${dupla.jogador2Nome}`;
  }
  return dupla.equipeNome || undefined;
};

export const getVencedorPartida = (partida: Partida): 1 | 2 | null => {
  if (!estaFinalizada(partida.status)) return null;

  // Sets são a fonte mais confiável; os nomes ficam de reserva
  const { setsDupla1, setsDupla2 } = partida;
  if (setsDupla1 !== undefined && setsDupla2 !== undefined) {
    if (setsDupla1 === setsDupla2) return null;
    return setsDupla1 > setsDupla2 ? 1 : 2;
  }

  const vencedor = partida.vencedoresNomes || partida.vencedoraNome;
  if (!vencedor) return null;
  if (vencedor === partida.dupla1Nome) return 1;
  return vencedor === partida.dupla2Nome ? 2 : null;
};

/** Grupos antigos podem vir sem o formato: deduz pelos participantes */
export const getFormato = (grupos: Grupo[]): FormatoEtapa => {
  const [primeiro] = grupos;
  if (primeiro?.formato) return primeiro.formato as FormatoEtapa;
  if (primeiro?.equipes?.length) return FormatoEtapa.TEAMS;
  return primeiro?.jogadores?.length
    ? FormatoEtapa.REI_DA_PRAIA
    : FormatoEtapa.DUPLA_FIXA;
};

/** Fase de grupos primeiro, depois a eliminatória */
export const ordenarGrupos = (grupos: Grupo[]): Grupo[] => {
  const peso = (grupo: Grupo) =>
    (grupo.tipo === "eliminatoria" ? 1000 : 0) + (grupo.ordem ?? 0);
  return [...grupos].sort((a, b) => peso(a) - peso(b));
};

/**
 * Vagas por grupo no Rei da Praia. Etapas antigas podem ter jogador marcado
 * fora delas (sobra de eliminatória cancelada).
 */
const VAGAS_REI_DA_PRAIA = 2;

export interface ResumoGrupos {
  total: number;
  finalizados: number;
  /** 0 a 100 */
  progresso: number;
}

/** No Teams conta confrontos; nos demais, partidas */
export const resumirGrupos = (
  grupos: Grupo[],
  formato: FormatoEtapa
): ResumoGrupos => {
  const isTeams = formato === FormatoEtapa.TEAMS;
  const total = grupos.reduce(
    (soma, g) =>
      soma + ((isTeams ? g.confrontos?.length : g.partidas?.length) ?? 0),
    0
  );
  const finalizados = grupos.reduce(
    (soma, g) =>
      soma +
      (isTeams
        ? (g.confrontos ?? []).filter(confrontoFinalizado).length
        : (g.partidas ?? []).filter((p) => estaFinalizada(p.status)).length),
    0
  );

  return {
    total,
    finalizados,
    progresso: total > 0 ? Math.round((finalizados / total) * 100) : 0,
  };
};

export const montarTabela = (
  grupo: Grupo,
  formato: FormatoEtapa
): { rotulo: string; linhas: LinhaClassificacao[] } | null => {
  if (formato === FormatoEtapa.TEAMS) {
    const equipes = grupo.equipes ?? [];
    // Antes do primeiro resultado mostra só as equipes
    const temResultado = equipes.some((e) => e.pontos > 0 || e.vitorias > 0);
    if (!temResultado) return null;

    return {
      rotulo: "Equipe",
      linhas: equipes.map((e, index) => ({
        id: e.id,
        posicao: e.posicaoGrupo || index + 1,
        nome: e.nome,
        classificado: e.classificada,
        estatisticas: e,
      })),
    };
  }

  if (
    formato === FormatoEtapa.REI_DA_PRAIA ||
    formato === FormatoEtapa.SUPER_X
  ) {
    if (!grupo.jogadores?.length) return null;

    return {
      rotulo: "Jogador",
      linhas: grupo.jogadores.map((j, index) => ({
        id: j.id,
        posicao: j.posicaoGrupo || index + 1,
        nome: j.jogadorNome,
        classificado:
          j.classificado &&
          formato === FormatoEtapa.REI_DA_PRAIA &&
          (j.posicaoGrupo || index + 1) <= VAGAS_REI_DA_PRAIA,
        estatisticas: {
          jogos: j.jogosGrupo,
          vitorias: j.vitoriasGrupo,
          derrotas: j.derrotasGrupo,
          pontos: j.pontosGrupo,
          saldoGames: j.saldoGamesGrupo,
        },
      })),
    };
  }

  if (!grupo.duplas?.length) return null;

  return {
    rotulo: "Dupla",
    linhas: grupo.duplas.map((d, index) => ({
      id: d.id,
      posicao: d.posicaoGrupo || index + 1,
      nome: `${d.jogador1Nome} & ${d.jogador2Nome}`,
      classificado: d.classificada,
      estatisticas: d,
    })),
  };
};
