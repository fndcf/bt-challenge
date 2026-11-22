/**
 * Dados da fase de grupos como chegam da API pública
 */

export interface Dupla {
  id: string;
  jogador1Nome: string;
  jogador2Nome: string;
  posicaoGrupo: number;
  vitorias: number;
  derrotas: number;
  pontos: number;
  saldoGames: number;
  jogos: number;
  classificada: boolean;
}

export interface JogadorIndividual {
  id: string;
  jogadorId: string;
  jogadorNome: string;
  jogadorNivel?: string;
  posicaoGrupo?: number;
  jogosGrupo: number;
  vitoriasGrupo: number;
  derrotasGrupo: number;
  pontosGrupo: number;
  saldoGamesGrupo: number;
  gamesVencidosGrupo: number;
  gamesPerdidosGrupo: number;
  classificado: boolean;
}

export interface Partida {
  id: string;
  dupla1Id?: string;
  dupla2Id?: string;
  dupla1Nome: string;
  dupla2Nome: string;
  status: string;
  setsDupla1: number;
  setsDupla2: number;
  placar?: Array<{
    numero: number;
    gamesDupla1: number;
    gamesDupla2: number;
  }>;
  vencedoraId?: string;
  vencedoraNome?: string;
  vencedores?: string[];
  vencedoresNomes?: string;
}

// Jogador dentro de uma equipe TEAMS
export interface JogadorEquipe {
  id: string;
  nome: string;
  nivel?: string;
  genero?: string;
}

// Equipe para formato TEAMS
export interface Equipe {
  id: string;
  nome: string;
  posicaoGrupo?: number;
  pontos: number;
  vitorias: number;
  derrotas: number;
  jogosVencidos: number;
  jogosPerdidos: number;
  saldoJogos: number;
  classificada: boolean;
  jogadores?: JogadorEquipe[];
}

// Dupla dentro de uma partida TEAMS
export interface DuplaPartidaTeams {
  jogador1Id: string;
  jogador1Nome: string;
  jogador2Id: string;
  jogador2Nome: string;
  equipeId: string;
  equipeNome: string;
}

// Partida dentro de um confronto TEAMS
export interface PartidaTeams {
  id: string;
  ordem: number;
  tipoJogo: "feminino" | "masculino" | "misto" | "decider";
  status: string;
  dupla1: DuplaPartidaTeams;
  dupla2: DuplaPartidaTeams;
  setsDupla1: number;
  setsDupla2: number;
  placar?: Array<{ numero: number; gamesDupla1: number; gamesDupla2: number }>;
  vencedoraEquipeId?: string;
  vencedoraEquipeNome?: string;
}

// Confronto para formato TEAMS
export interface Confronto {
  id: string;
  fase?: string;
  rodada?: number;
  grupoId?: string;
  grupoNome?: string;
  equipe1Id?: string;
  equipe2Id?: string;
  equipe1Nome?: string;
  equipe2Nome?: string;
  equipe1Origem?: string;
  equipe2Origem?: string;
  status: string;
  jogosEquipe1: number;
  jogosEquipe2: number;
  vencedoraId?: string;
  partidas?: PartidaTeams[];
}

export interface Grupo {
  id: string;
  nome: string;
  ordem: number;
  totalDuplas?: number;
  totalJogadores?: number;
  totalEquipes?: number;
  completo: boolean;
  duplas?: Dupla[];
  jogadores?: JogadorIndividual[];
  equipes?: Equipe[];
  partidas: Partida[];
  confrontos?: Confronto[];
  formato?: "dupla_fixa" | "rei_da_praia" | "super_x" | "teams";
  tipo?: "grupos" | "eliminatoria"; // Para TEAMS: diferenciar fase de grupos de eliminatórias
}

