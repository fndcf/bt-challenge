import { NivelJogador, GeneroJogador } from "./jogador";
import { FaseEtapa, ResultadoGeracaoChaves } from "./chave";
import { TipoChaveamentoReiDaPraia } from "./reiDaPraia";

export { TipoChaveamentoReiDaPraia };
export type { ResultadoGeracaoChaves };

export enum StatusEtapa {
  INSCRICOES_ABERTAS = "inscricoes_abertas",
  INSCRICOES_ENCERRADAS = "inscricoes_encerradas",
  CHAVES_GERADAS = "chaves_geradas",
  FASE_ELIMINATORIA = "fase_eliminatoria",
  EM_ANDAMENTO = "em_andamento",
  FINALIZADA = "finalizada",
  CANCELADA = "cancelada",
}

//  Formato da etapa
export enum FormatoEtapa {
  DUPLA_FIXA = "dupla_fixa",
  REI_DA_PRAIA = "rei_da_praia",
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
  contaPontosRanking: boolean; // Se true, os pontos da etapa contam para o ranking geral
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
  contaPontosRanking?: boolean; // Por padrão true
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
  contaPontosRanking?: boolean;
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
