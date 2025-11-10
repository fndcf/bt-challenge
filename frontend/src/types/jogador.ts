/**
 * Types para Jogadores no Frontend
 */

export enum NivelJogador {
  INICIANTE = "iniciante",
  INTERMEDIARIO = "intermediario",
  AVANCADO = "avancado",
  PROFISSIONAL = "profissional",
}

export enum StatusJogador {
  ATIVO = "ativo",
  INATIVO = "inativo",
  SUSPENSO = "suspenso",
}

export interface Jogador {
  id: string;
  arenaId: string;
  nome: string;
  email?: string;
  telefone?: string;
  dataNascimento?: string;
  genero?: "masculino" | "feminino" | "outro";
  nivel: NivelJogador;
  status: StatusJogador;
  observacoes?: string;
  fotoUrl?: string;
  vitorias?: number;
  derrotas?: number;
  pontos?: number;
  criadoEm: string;
  atualizadoEm: string;
  criadoPor: string;
}

export interface CriarJogadorDTO {
  nome: string;
  email?: string;
  telefone?: string;
  dataNascimento?: string;
  genero?: "masculino" | "feminino" | "outro";
  nivel: NivelJogador;
  status?: StatusJogador;
  observacoes?: string;
}

export interface AtualizarJogadorDTO {
  nome?: string;
  email?: string;
  telefone?: string;
  dataNascimento?: string;
  genero?: "masculino" | "feminino" | "outro";
  nivel?: NivelJogador;
  status?: StatusJogador;
  observacoes?: string;
}

export interface FiltrosJogador {
  nivel?: NivelJogador;
  status?: StatusJogador;
  genero?: "masculino" | "feminino" | "outro";
  busca?: string;
  ordenarPor?: "nome" | "criadoEm" | "pontos" | "vitorias";
  ordem?: "asc" | "desc";
  limite?: number;
  offset?: number;
}

export interface ListagemJogadores {
  jogadores: Jogador[];
  total: number;
  limite: number;
  offset: number;
  temMais: boolean;
}
