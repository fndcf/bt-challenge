/**
 * Types para Etapas
 */

import { NivelJogador, GeneroJogador } from "./jogador";

export enum StatusEtapa {
  INSCRICOES_ABERTAS = "inscricoes_abertas",
  INSCRICOES_ENCERRADAS = "inscricoes_encerradas",
  CHAVES_GERADAS = "chaves_geradas",
  EM_ANDAMENTO = "em_andamento",
  FINALIZADA = "finalizada",
  CANCELADA = "cancelada",
}

export enum FaseEtapa {
  GRUPOS = "grupos",
  OITAVAS = "oitavas",
  QUARTAS = "quartas",
  SEMIFINAL = "semifinal",
  FINAL = "final",
}

export interface Etapa {
  id: string;
  slug?: string; // Opcional por enquanto
  arenaId: string;
  nome: string;
  descricao?: string;
  nivel: NivelJogador;
  genero: GeneroJogador;
  dataInicio: string;
  dataFim: string;
  dataRealizacao: string;
  local?: string;
  maxJogadores: number;
  jogadoresPorGrupo: number;
  qtdGrupos?: number;
  status: StatusEtapa;
  faseAtual: FaseEtapa;
  totalInscritos: number;
  jogadoresInscritos: string[];
  chavesGeradas: boolean;
  dataGeracaoChaves?: string;
  criadoEm: string;
  atualizadoEm: string;
  criadoPor: string;
  finalizadoEm?: string;
}

export interface CriarEtapaDTO {
  nome: string;
  descricao?: string;
  nivel: NivelJogador;
  genero: GeneroJogador;
  dataInicio: string;
  dataFim: string;
  dataRealizacao: string;
  local?: string;
  maxJogadores: number;
  jogadoresPorGrupo: number;
}

export interface AtualizarEtapaDTO {
  nome?: string;
  descricao?: string;
  nivel?: NivelJogador;
  genero?: GeneroJogador;
  dataInicio?: string;
  dataFim?: string;
  dataRealizacao?: string;
  local?: string;
  maxJogadores?: number;
  status?: StatusEtapa;
}

export interface InscreverJogadorDTO {
  jogadorId: string;
}

export interface Inscricao {
  id: string;
  etapaId: string;
  arenaId: string;
  jogadorId: string;
  jogadorNome: string;
  jogadorNivel: string;
  jogadorGenero: string;
  status: "confirmada" | "aguardando" | "cancelada";
  duplaId?: string;
  parceiroId?: string;
  parceiroNome?: string;
  grupoId?: string;
  grupoNome?: string;
  criadoEm: string;
  atualizadoEm: string;
  canceladoEm?: string;
}

export interface Dupla {
  id: string;
  etapaId: string;
  arenaId: string;
  jogador1Id: string;
  jogador1Nome: string;
  jogador1Nivel: string;
  jogador2Id: string;
  jogador2Nome: string;
  jogador2Nivel: string;
  grupoId: string;
  grupoNome: string;
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
  posicaoGrupo?: number;
  classificada?: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Grupo {
  id: string;
  etapaId: string;
  arenaId: string;
  nome: string;
  ordem: number;
  duplas: string[];
  totalDuplas: number;
  partidas: string[];
  totalPartidas: number;
  partidasFinalizadas: number;
  completo: boolean;
  classificadas: string[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface Partida {
  id: string;
  etapaId: string;
  arenaId: string;
  fase: FaseEtapa;
  grupoId?: string;
  grupoNome?: string;
  dupla1Id: string;
  dupla1Nome: string;
  dupla2Id: string;
  dupla2Nome: string;
  dataHora?: string;
  quadra?: string;
  status: "agendada" | "em_andamento" | "finalizada" | "cancelada";
  setsDupla1: number;
  setsDupla2: number;
  placar: string[];
  vencedoraId?: string;
  vencedoraNome?: string;
  criadoEm: string;
  atualizadoEm: string;
  finalizadoEm?: string;
}

export interface FiltrosEtapa {
  status?: StatusEtapa;
  nivel?: NivelJogador;
  genero?: GeneroJogador;
  ordenarPor?: "dataRealizacao" | "criadoEm";
  ordem?: "asc" | "desc";
  limite?: number;
  offset?: number;
}

export interface ListagemEtapas {
  etapas: Etapa[];
  total: number;
  limite: number;
  offset: number;
  temMais: boolean;
}

export interface EstatisticasEtapa {
  totalEtapas: number;
  inscricoesAbertas: number;
  emAndamento: number;
  finalizadas: number;
  totalParticipacoes: number;
}

export interface ResultadoGeracaoChaves {
  duplas: Dupla[];
  grupos: Grupo[];
  partidas: Partida[];
}
