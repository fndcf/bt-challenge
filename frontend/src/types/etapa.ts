/**
 * Types para Etapas - VERSÃO ATUALIZADA COM REI DA PRAIA
 */

import { NivelJogador, GeneroJogador } from "./jogador";
import { Dupla, Grupo, Partida, ConfrontoEliminatorio } from "./chave";

export enum StatusEtapa {
  INSCRICOES_ABERTAS = "inscricoes_abertas",
  INSCRICOES_ENCERRADAS = "inscricoes_encerradas",
  CHAVES_GERADAS = "chaves_geradas",
  FASE_ELIMINATORIA = "fase_eliminatoria",
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

//  Formato da etapa
export enum FormatoEtapa {
  DUPLA_FIXA = "dupla_fixa",
  REI_DA_PRAIA = "rei_da_praia",
}

//  Tipo de chaveamento para Rei da Praia
export enum TipoChaveamentoReiDaPraia {
  MELHORES_COM_MELHORES = "melhores_com_melhores",
  PAREAMENTO_POR_RANKING = "pareamento_por_ranking",
  SORTEIO_ALEATORIO = "sorteio_aleatorio",
}

export interface Etapa {
  id: string;
  slug?: string;
  arenaId: string;
  nome: string;
  descricao?: string;
  nivel: NivelJogador;
  genero: GeneroJogador;
  formato: FormatoEtapa;
  tipoChaveamento?: TipoChaveamentoReiDaPraia;
  dataInicio: string;
  dataFim: string;
  dataRealizacao: string;
  local?: string;
  maxJogadores: number;
  jogadoresPorGrupo: number; // Não usado em Rei da Praia (sempre 4)
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
  formato: FormatoEtapa;
  tipoChaveamento?: TipoChaveamentoReiDaPraia;
  dataInicio: string;
  dataFim: string;
  dataRealizacao: string;
  local?: string;
  maxJogadores: number;
  jogadoresPorGrupo?: number; // Opcional porque Rei da Praia não usa
}

export interface AtualizarEtapaDTO {
  nome?: string;
  descricao?: string;
  nivel?: NivelJogador;
  genero?: GeneroJogador;
  tipoChaveamento?: TipoChaveamentoReiDaPraia;
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

//  Partida específica do Rei da Praia
export interface PartidaReiDaPraia {
  id: string;
  etapaId: string;
  arenaId: string;
  fase: FaseEtapa;
  grupoId: string;
  grupoNome: string;
  // Dupla 1 (formada na hora)
  jogador1AId: string;
  jogador1ANome: string;
  jogador1BId: string;
  jogador1BNome: string;
  dupla1Nome: string; // Ex: "João & Maria"
  // Dupla 2 (formada na hora)
  jogador2AId: string;
  jogador2ANome: string;
  jogador2BId: string;
  jogador2BNome: string;
  dupla2Nome: string; // Ex: "Pedro & Ana"
  status: "agendada" | "em_andamento" | "finalizada" | "cancelada";
  setsDupla1: number;
  setsDupla2: number;
  placar?: Array<{
    numero: number;
    gamesDupla1: number;
    gamesDupla2: number;
    vencedorId: string;
  }>;
  vencedores?: string[]; // IDs dos 2 jogadores vencedores
  vencedoresNomes?: string; // Ex: "João & Maria"
  criadoEm: string;
  atualizadoEm: string;
  finalizadoEm?: string;
}

//  Estatísticas individuais do jogador na etapa
export interface EstatisticasJogador {
  id: string;
  etapaId: string;
  arenaId: string;
  jogadorId: string;
  jogadorNome: string;
  jogadorNivel: string;
  jogadorGenero: string;
  grupoId?: string;
  grupoNome?: string;
  jogos: number;
  vitorias: number;
  derrotas: number;
  pontos: number; // 3 por vitória
  setsVencidos: number;
  setsPerdidos: number;
  saldoSets: number;
  gamesVencidos: number;
  gamesPerdidos: number;
  saldoGames: number;
  posicaoGrupo?: number;
  classificado: boolean; // Se passou para eliminatória
  criadoEm: string;
  atualizadoEm: string;
}

export interface FiltrosEtapa {
  status?: StatusEtapa;
  nivel?: NivelJogador;
  genero?: GeneroJogador;
  formato?: FormatoEtapa;
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

//  Resultado da geração de chaves
export interface ResultadoGeracaoChaves {
  duplas?: Dupla[]; // Opcional (só Dupla Fixa)
  jogadores?: EstatisticasJogador[]; //  Só Rei da Praia
  grupos: Grupo[];
  partidas: Partida[] | PartidaReiDaPraia[]; // Pode ser um ou outro
}

//  Resultado da geração de eliminatória no Rei da Praia
export interface ResultadoGeracaoEliminatoriaReiDaPraia {
  duplas: Dupla[]; // Duplas FIXAS formadas a partir dos classificados
  confrontos: ConfrontoEliminatorio[];
}

//  DTO para gerar eliminatória Rei da Praia
export interface GerarEliminatoriaReiDaPraiaDTO {
  etapaId: string;
  arenaId: string;
  classificadosPorGrupo: number; // Ex: 2 (top 2 de cada grupo)
  tipoChaveamento: TipoChaveamentoReiDaPraia;
}
