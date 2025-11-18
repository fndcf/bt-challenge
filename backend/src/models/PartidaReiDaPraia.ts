import { Timestamp } from "firebase-admin/firestore";
import { FaseEtapa } from "./Etapa";
import { StatusPartida } from "./Partida";

/**
 * Partida no formato Rei/Rainha da Praia
 *
 * Diferença da partida normal:
 * - Guarda os 4 jogadores individuais (não duplas fixas)
 * - Dupla 1: jogador1A + jogador1B
 * - Dupla 2: jogador2A + jogador2B
 */
export interface PartidaReiDaPraia {
  id: string;
  etapaId: string;
  arenaId: string;
  fase: FaseEtapa;

  // Grupo (fase de grupos)
  grupoId?: string;
  grupoNome?: string;

  // Dupla 1 (temporária)
  jogador1AId: string;
  jogador1ANome: string;
  jogador1BId: string;
  jogador1BNome: string;
  dupla1Nome: string; // "João & Maria"

  // Dupla 2 (temporária)
  jogador2AId: string;
  jogador2ANome: string;
  jogador2BId: string;
  jogador2BNome: string;
  dupla2Nome: string; // "Pedro & Ana"

  // Agendamento
  dataHora?: Timestamp;
  quadra?: string;

  // Status e resultado
  status: StatusPartida;
  setsDupla1: number;
  setsDupla2: number;
  placar?: Array<{
    numero: number;
    gamesDupla1: number;
    gamesDupla2: number;
    vencedorId?: string;
  }>;

  // Vencedores (são 2 jogadores)
  vencedores?: string[]; // [jogador1AId, jogador1BId] ou [jogador2AId, jogador2BId]
  vencedoresNomes?: string; // "João & Maria"

  // Metadados
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
  finalizadoEm?: Timestamp;
}

/**
 * DTO para criar partida rei da praia
 */
export interface CriarPartidaReiDaPraiaDTO {
  etapaId: string;
  arenaId: string;
  fase: FaseEtapa;
  grupoId?: string;
  grupoNome?: string;

  // Dupla 1
  jogador1AId: string;
  jogador1ANome: string;
  jogador1BId: string;
  jogador1BNome: string;

  // Dupla 2
  jogador2AId: string;
  jogador2ANome: string;
  jogador2BId: string;
  jogador2BNome: string;
}
