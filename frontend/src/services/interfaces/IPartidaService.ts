/**
 * IPartidaService.ts
 * Interface para serviço de gerenciamento de partidas do formato DUPLA FIXA
 *
 * Aplica DIP (Dependency Inversion Principle)
 *
 * IMPORTANTE: Para formato Rei da Praia, use IReiDaPraiaService
 */

import { SetPartida } from "@/types/chave";

export interface IPartidaService {
  /**
   * Registrar resultado de uma partida no formato DUPLA FIXA
   * Formato: Múltiplos sets (melhor de 3 ou 5)
   * @param partidaId - ID da partida
   * @param placar - Array de sets com games de cada dupla
   * @returns Promise void
   */
  registrarResultado(partidaId: string, placar: SetPartida[]): Promise<void>;
}
