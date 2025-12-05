import { FaseEtapa, StatusPartida } from "./chave";

/**
 * Tipo de chaveamento para fase eliminatória
 */
export enum TipoChaveamentoReiDaPraia {
  MELHORES_COM_MELHORES = "melhores_com_melhores",
  PAREAMENTO_POR_RANKING = "pareamento_por_ranking",
  SORTEIO_ALEATORIO = "sorteio_aleatorio",
}

/**
 * Partida do formato Rei da Praia
 * Diferença: Guarda os 4 jogadores individuais, não duplas fixas
 */
export interface PartidaReiDaPraia {
  id: string;
  etapaId: string;
  arenaId: string;
  fase: FaseEtapa;
  grupoId: string;
  grupoNome: string;
  // Dupla 1 (temporária)
  jogador1AId: string;
  jogador1ANome: string;
  jogador1BId: string;
  jogador1BNome: string;
  dupla1Nome: string;
  // Dupla 2 (temporária)
  jogador2AId: string;
  jogador2ANome: string;
  jogador2BId: string;
  jogador2BNome: string;
  dupla2Nome: string;
  status: StatusPartida;
  setsDupla1: number;
  setsDupla2: number;
  placar?: Array<{
    numero: number;
    gamesDupla1: number;
    gamesDupla2: number;
    vencedorId: string;
  }>;
  vencedores?: string[]; // IDs dos 2 jogadores vencedores
  vencedoresNomes?: string;
  criadoEm: string;
  atualizadoEm: string;
  finalizadoEm?: string;
}

/**
 * Estatísticas individuais de um jogador na etapa
 */
export interface EstatisticasJogador {
  id: string;
  etapaId: string;
  arenaId: string;

  jogadorId: string;
  jogadorNome: string;
  jogadorNivel?: string;
  jogadorGenero?: string;

  grupoId?: string;
  grupoNome?: string;

  jogosGrupo: number;
  vitoriasGrupo: number;
  derrotasGrupo: number;
  pontosGrupo: number; // 3 pontos por vitória
  setsVencidosGrupo: number;
  setsPerdidosGrupo: number;
  saldoSetsGrupo: number;
  gamesVencidosGrupo: number;
  gamesPerdidosGrupo: number;
  saldoGamesGrupo: number;

  jogos: number;
  vitorias: number;
  derrotas: number;
  pontos: number;
  setsVencidos: number;
  setsPerdidos: number;
  saldoSets: number;
  gamesVencidos: number;
  gamesPerdidos: number;
  saldoGames: number;
  posicaoGrupo?: number;
  classificado: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

/**
 * DTO para gerar chaves Rei da Praia
 */
export interface GerarChavesReiDaPraiaDTO {
  etapaId: string;
  arenaId: string;
}

/**
 * DTO para gerar eliminatória Rei da Praia
 */
export interface GerarEliminatoriaReiDaPraiaDTO {
  etapaId: string;
  arenaId: string;
  classificadosPorGrupo: number;
  tipoChaveamento: TipoChaveamentoReiDaPraia;
}

/**
 * Resultado da geração de chaves Rei da Praia
 */
export interface ResultadoChavesReiDaPraia {
  jogadores: EstatisticasJogador[];
  grupos: any[]; // Importar Grupo se necessário
  partidas: PartidaReiDaPraia[];
}

/**
 * Resultado da geração de eliminatória Rei da Praia
 */
export interface ResultadoEliminatoriaReiDaPraia {
  duplas: any[]; // Duplas FIXAS formadas
  confrontos: any[]; // ConfrontoEliminatorio[]
}

/**
 * DTO para registrar resultado de partida Rei da Praia
 */
export interface RegistrarResultadoReiDaPraiaDTO {
  partidaId: string;
  arenaId: string;
  placar: Array<{
    numero: number;
    gamesDupla1: number;
    gamesDupla2: number;
  }>;
}
