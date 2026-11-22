/**
 * Classificação dos grupos: colunas, ordenação e conversão de cada formato
 * para a linha usada pela TabelaClassificacao.
 */

import { Dupla } from "@/types/chave";
import { EstatisticasJogador } from "@/types/reiDaPraia";
import { Equipe } from "@/types/teams";
import { getNivelLabel } from "./formatters";

export interface EstatisticasClassificacao {
  jogos?: number;
  vitorias?: number;
  derrotas?: number;
  pontos?: number;
  gamesVencidos?: number;
  gamesPerdidos?: number;
  saldoGames?: number;
  saldoJogos?: number;
}

export interface LinhaClassificacao {
  id: string;
  posicao: number;
  nome: string;
  detalhe?: string;
  classificado?: boolean;
  estatisticas: EstatisticasClassificacao;
}

export type ChaveColuna =
  | "jogos"
  | "vitorias"
  | "derrotas"
  | "pontos"
  | "vitoriasDerrotas"
  | "games"
  | "saldoGames"
  | "saldoJogos";

interface ColunaClassificacao {
  sigla: string;
  descricao: string;
  /** Valor principal da tabela (pontos) */
  destaque?: boolean;
  /** Mostra sinal e cor (positivo/negativo) */
  saldo?: boolean;
  valor: (e: EstatisticasClassificacao) => string | number;
}

export const COLUNAS_CLASSIFICACAO: Record<ChaveColuna, ColunaClassificacao> = {
  jogos: { sigla: "J", descricao: "Jogos", valor: (e) => e.jogos || 0 },
  vitorias: { sigla: "V", descricao: "Vitórias", valor: (e) => e.vitorias || 0 },
  derrotas: { sigla: "D", descricao: "Derrotas", valor: (e) => e.derrotas || 0 },
  pontos: {
    sigla: "PTS",
    descricao: "Pontos",
    destaque: true,
    valor: (e) => e.pontos || 0,
  },
  vitoriasDerrotas: {
    sigla: "V-D",
    descricao: "Vitórias e derrotas",
    valor: (e) => `${e.vitorias || 0}-${e.derrotas || 0}`,
  },
  games: {
    sigla: "GF-GC",
    descricao: "Games vencidos e perdidos",
    valor: (e) => `${e.gamesVencidos || 0}-${e.gamesPerdidos || 0}`,
  },
  saldoGames: {
    sigla: "SG",
    descricao: "Saldo de games",
    saldo: true,
    valor: (e) => e.saldoGames || 0,
  },
  saldoJogos: {
    sigla: "SJ",
    descricao: "Saldo de jogos",
    saldo: true,
    valor: (e) => e.saldoJogos || 0,
  },
};

// Telas do admin
export const COLUNAS_ADMIN: ChaveColuna[] = [
  "pontos",
  "vitoriasDerrotas",
  "games",
  "saldoGames",
];
export const COLUNAS_ADMIN_TEAMS: ChaveColuna[] = [
  "pontos",
  "vitoriasDerrotas",
  "saldoJogos",
  "saldoGames",
];

// Página pública da etapa
export const COLUNAS_PUBLICO: ChaveColuna[] = [
  "jogos",
  "vitorias",
  "derrotas",
  "pontos",
  "saldoGames",
];
export const COLUNAS_PUBLICO_TEAMS: ChaveColuna[] = [
  "vitorias",
  "derrotas",
  "pontos",
  "saldoJogos",
];

/** Mostra o sinal de mais só no positivo ("+12", "0", "-8") */
export const formatarSaldo = (saldo: number): string =>
  saldo > 0 ? `+${saldo}` : `${saldo}`;

/** Antes do primeiro jogo a tabela mostra só posição e nome */
export const temJogos = (linhas: LinhaClassificacao[]): boolean =>
  linhas.some((linha) => (linha.estatisticas.jogos || 0) > 0);

// ============== ORDENAÇÃO ==============

/**
 * Usa a posição calculada pelo backend (critérios + desempate do admin).
 * Sem posição definida, compara os critérios na ordem (maior primeiro) e, por
 * fim, o nome.
 */
const ordenar = <T>(
  itens: T[],
  posicao: (item: T) => number | undefined,
  criterios: Array<(item: T) => number>,
  nome: (item: T) => string
): T[] =>
  [...itens].sort((a, b) => {
    const posicaoA = posicao(a);
    const posicaoB = posicao(b);
    if (posicaoA !== undefined && posicaoB !== undefined) {
      return posicaoA - posicaoB;
    }

    for (const criterio of criterios) {
      const diferenca = criterio(b) - criterio(a);
      if (diferenca) return diferenca;
    }

    return nome(a).localeCompare(nome(b));
  });

const nomeDaDupla = (
  dupla: Pick<Dupla, "jogador1Nome" | "jogador2Nome">
): string => `${dupla.jogador1Nome} & ${dupla.jogador2Nome}`;

export const ordenarDuplas = (duplas: Dupla[]): Dupla[] =>
  ordenar(
    duplas,
    (d) => d.posicaoGrupo,
    [
      (d) => d.pontos,
      (d) => d.saldoGames,
      (d) => d.saldoSets,
      (d) => d.gamesVencidos,
    ],
    nomeDaDupla
  );

export const ordenarJogadores = (
  jogadores: EstatisticasJogador[]
): EstatisticasJogador[] =>
  ordenar(
    jogadores,
    (j) => j.posicaoGrupo,
    [
      (j) => j.pontosGrupo,
      (j) => j.saldoGamesGrupo,
      (j) => j.gamesVencidosGrupo,
      (j) => j.saldoSetsGrupo,
    ],
    (j) => j.jogadorNome
  );

export const ordenarEquipes = (equipes: Equipe[]): Equipe[] =>
  ordenar(
    equipes,
    (e) => e.posicao,
    [(e) => e.pontos, (e) => e.saldoJogos, (e) => e.saldoGames],
    (e) => e.nome
  );

// ============== LINHAS ==============

const nivelDaDupla = (dupla: Dupla): string => {
  const nivel1 = getNivelLabel(dupla.jogador1Nivel).toLowerCase();
  const nivel2 = getNivelLabel(dupla.jogador2Nivel).toLowerCase();
  return nivel1 === nivel2 ? `Nível: ${nivel1}` : `Nível: ${nivel1} + ${nivel2}`;
};

export const linhasDeDuplas = (duplas: Dupla[]): LinhaClassificacao[] =>
  ordenarDuplas(duplas).map((dupla, index) => ({
    id: dupla.id,
    posicao: index + 1,
    nome: nomeDaDupla(dupla),
    detalhe: nivelDaDupla(dupla),
    estatisticas: dupla,
  }));

export const linhasDeJogadores = (
  jogadores: EstatisticasJogador[]
): LinhaClassificacao[] =>
  ordenarJogadores(jogadores).map((jogador, index) => ({
    id: jogador.id || jogador.jogadorId || `jogador-${index}`,
    posicao: index + 1,
    nome: jogador.jogadorNome,
    detalhe: jogador.jogadorNivel
      ? `Nível: ${getNivelLabel(jogador.jogadorNivel)}`
      : undefined,
    // Só a fase de grupos: os campos sem "Grupo" incluem a eliminatória
    estatisticas: {
      jogos: jogador.jogosGrupo,
      vitorias: jogador.vitoriasGrupo,
      derrotas: jogador.derrotasGrupo,
      pontos: jogador.pontosGrupo,
      gamesVencidos: jogador.gamesVencidosGrupo,
      gamesPerdidos: jogador.gamesPerdidosGrupo,
      saldoGames: jogador.saldoGamesGrupo,
    },
  }));

export const linhasDeEquipes = (equipes: Equipe[]): LinhaClassificacao[] =>
  ordenarEquipes(equipes).map((equipe, index) => ({
    id: equipe.id,
    posicao: index + 1,
    nome: equipe.nome,
    estatisticas: {
      jogos: equipe.confrontos,
      vitorias: equipe.vitorias,
      derrotas: equipe.derrotas,
      pontos: equipe.pontos,
      saldoJogos: equipe.saldoJogos,
      saldoGames: equipe.saldoGames,
    },
  }));
