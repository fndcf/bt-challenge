/**
 * Contas das estatísticas de jogador: o que uma partida soma e os totais do
 * ranking
 */

import {
  AtualizarEstatisticasPartidaDTO,
  EstatisticasJogador,
} from "../models/EstatisticasJogador";

/** O que a partida soma nos totais do jogador na etapa */
export const totaisDaPartida = (dto: AtualizarEstatisticasPartidaDTO) => ({
  jogos: 1,
  vitorias: dto.venceu ? 1 : 0,
  derrotas: dto.venceu ? 0 : 1,
  setsVencidos: dto.setsVencidos,
  setsPerdidos: dto.setsPerdidos,
  saldoSets: dto.setsVencidos - dto.setsPerdidos,
  gamesVencidos: dto.gamesVencidos,
  gamesPerdidos: dto.gamesPerdidos,
  saldoGames: dto.gamesVencidos - dto.gamesPerdidos,
});

/** O que a partida soma na classificação do grupo */
export const grupoDaPartida = (dto: AtualizarEstatisticasPartidaDTO) => ({
  jogosGrupo: 1,
  vitoriasGrupo: dto.venceu ? 1 : 0,
  derrotasGrupo: dto.venceu ? 0 : 1,
  pontosGrupo: dto.venceu ? 3 : 0,
  setsVencidosGrupo: dto.setsVencidos,
  setsPerdidosGrupo: dto.setsPerdidos,
  saldoSetsGrupo: dto.setsVencidos - dto.setsPerdidos,
  gamesVencidosGrupo: dto.gamesVencidos,
  gamesPerdidosGrupo: dto.gamesPerdidos,
  saldoGamesGrupo: dto.gamesVencidos - dto.gamesPerdidos,
});

export type TotaisDaPartida = ReturnType<typeof totaisDaPartida>;
export type GrupoDaPartida = ReturnType<typeof grupoDaPartida>;
export type IncrementosDaPartida = TotaisDaPartida & Partial<GrupoDaPartida>;

/** O contrário, para desfazer uma partida */
export const inverter = <T extends Record<string, number>>(valores: T): T =>
  Object.fromEntries(
    // `0 - v`: evita gravar -0
    Object.entries(valores).map(([campo, v]) => [campo, 0 - v])
  ) as T;

export interface TotaisJogador {
  etapasParticipadas: number;
  jogos: number;
  vitorias: number;
  derrotas: number;
  pontos: number;
  setsVencidos: number;
  setsPerdidos: number;
  gamesVencidos: number;
  gamesPerdidos: number;
  saldoSets: number;
  saldoGames: number;
}

export interface JogadorRanking extends TotaisJogador {
  jogadorId: string;
  jogadorNome: string;
  jogadorNivel?: string;
  jogadorGenero?: string;
}

type ContaPontos = (etapaId: string) => boolean;

/**
 * Soma as etapas do jogador. Os pontos são só os das etapas que contam para o
 * ranking; o resto é de todas.
 */
export const somarEtapas = (
  estatisticas: EstatisticasJogador[],
  contaPontos: ContaPontos = () => true
): TotaisJogador => {
  const somar = (campo: keyof TotaisJogador & keyof EstatisticasJogador) =>
    estatisticas.reduce((soma, e) => soma + (e[campo] || 0), 0);

  return {
    etapasParticipadas: estatisticas.length,
    jogos: somar("jogos"),
    vitorias: somar("vitorias"),
    derrotas: somar("derrotas"),
    pontos: estatisticas.reduce(
      (soma, e) => soma + (contaPontos(e.etapaId) ? e.pontos || 0 : 0),
      0
    ),
    setsVencidos: somar("setsVencidos"),
    setsPerdidos: somar("setsPerdidos"),
    gamesVencidos: somar("gamesVencidos"),
    gamesPerdidos: somar("gamesPerdidos"),
    saldoSets: somar("saldoSets"),
    saldoGames: somar("saldoGames"),
  };
};

/**
 * Ranking por pontos, vitórias, saldo de games e games vencidos
 */
export const montarRanking = (
  estatisticas: EstatisticasJogador[],
  contaPontos?: ContaPontos
): JogadorRanking[] => {
  const porJogador = new Map<string, EstatisticasJogador[]>();
  estatisticas.forEach((e) => {
    const etapas = porJogador.get(e.jogadorId);
    if (etapas) etapas.push(e);
    else porJogador.set(e.jogadorId, [e]);
  });

  return [...porJogador.values()]
    .map((etapas) => ({
      jogadorId: etapas[0].jogadorId,
      jogadorNome: etapas[0].jogadorNome,
      jogadorNivel: etapas[0].jogadorNivel,
      jogadorGenero: etapas[0].jogadorGenero,
      ...somarEtapas(etapas, contaPontos),
    }))
    .sort(
      (a, b) =>
        b.pontos - a.pontos ||
        b.vitorias - a.vitorias ||
        b.saldoGames - a.saldoGames ||
        b.gamesVencidos - a.gamesVencidos
    );
};
