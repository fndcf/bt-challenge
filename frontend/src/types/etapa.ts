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
  SUPER_X = "super_x",
  TEAMS = "teams",
}

// Variantes do formato TEAMS
export enum VarianteTeams {
  TEAMS_4 = 4,
  TEAMS_6 = 6,
}

// Tipos de formação de equipes
export enum TipoFormacaoEquipe {
  MESMO_NIVEL = "mesmo_nivel",
  BALANCEADO = "balanceado",
  MANUAL = "manual",
}

// Tipos de formação dos jogos dentro de um confronto
export enum TipoFormacaoJogos {
  SORTEIO = "sorteio",
  MANUAL = "manual",
}

// Variantes do Super X
export enum VarianteSuperX {
  SUPER_8 = 8,
  SUPER_12 = 12,
}

// Tipos de formação de duplas (DUPLA_FIXA)
export enum TipoFormacaoDupla {
  MESMO_NIVEL = "mesmo_nivel", // Sorteio aleatório entre jogadores do mesmo nível
  BALANCEADO = "balanceado", // Avançado + Iniciante, Intermediário + Intermediário
}

export interface Etapa {
  id: string;
  slug?: string;
  arenaId: string;
  nome: string;
  descricao?: string;
  nivel?: NivelJogador; // Opcional para formato SUPER_X e TEAMS
  genero: GeneroJogador;
  formato: FormatoEtapa;
  tipoChaveamento?: TipoChaveamentoReiDaPraia;
  tipoFormacaoDupla?: TipoFormacaoDupla; // Usado apenas para formato DUPLA_FIXA
  varianteSuperX?: VarianteSuperX; // Usado apenas para formato SUPER_X
  varianteTeams?: VarianteTeams; // Usado apenas para formato TEAMS
  tipoFormacaoEquipe?: TipoFormacaoEquipe; // Usado apenas para formato TEAMS
  tipoFormacaoJogos?: TipoFormacaoJogos; // Usado apenas para formato TEAMS
  isMisto?: boolean; // Se a etapa é mista (TEAMS_4 pode ou não ser misto, TEAMS_6 é sempre misto)
  dataInicio: string;
  dataFim: string;
  dataRealizacao: string;
  local?: string;
  maxJogadores: number;
  jogadoresPorGrupo: number; // Não usado em Rei da Praia, Super X e TEAMS
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
  nivel?: NivelJogador; // Opcional para formato SUPER_X e TEAMS
  genero: GeneroJogador;
  formato: FormatoEtapa;
  tipoChaveamento?: TipoChaveamentoReiDaPraia;
  tipoFormacaoDupla?: TipoFormacaoDupla; // Usado apenas para formato DUPLA_FIXA
  varianteSuperX?: VarianteSuperX; // Usado apenas para formato SUPER_X
  varianteTeams?: VarianteTeams; // Usado apenas para formato TEAMS
  tipoFormacaoEquipe?: TipoFormacaoEquipe; // Usado apenas para formato TEAMS
  tipoFormacaoJogos?: TipoFormacaoJogos; // Usado apenas para formato TEAMS
  isMisto?: boolean; // Se a etapa é mista (TEAMS)
  dataInicio: string;
  dataFim: string;
  dataRealizacao: string;
  local?: string;
  maxJogadores: number;
  jogadoresPorGrupo?: number; // Opcional porque Rei da Praia, Super X e TEAMS não usam
  contaPontosRanking?: boolean; // Por padrão true
}

export interface AtualizarEtapaDTO {
  nome?: string;
  descricao?: string;
  nivel?: NivelJogador;
  genero?: GeneroJogador;
  tipoChaveamento?: TipoChaveamentoReiDaPraia;
  tipoFormacaoDupla?: TipoFormacaoDupla;
  varianteSuperX?: VarianteSuperX;
  varianteTeams?: VarianteTeams;
  tipoFormacaoEquipe?: TipoFormacaoEquipe;
  tipoFormacaoJogos?: TipoFormacaoJogos;
  isMisto?: boolean;
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
