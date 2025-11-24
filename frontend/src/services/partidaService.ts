import { apiClient } from "./apiClient";
import { SetPartida } from "../types/chave";
import { handleError } from "../utils/errorHandler";

/**
 * Service para gerenciar partidas
 * ✅ ATUALIZADO: Suporta Dupla Fixa e Rei da Praia
 */
class PartidaService {
  private baseURL = "/partidas";

  /**
   * Registrar resultado de uma partida DUPLA FIXA
   * (Múltiplos sets - melhor de 3 ou 5)
   */
  async registrarResultado(
    partidaId: string,
    placar: SetPartida[]
  ): Promise<void> {
    try {
      console.log(`⚔️ Registrando resultado da partida ${partidaId}...`);
      await apiClient.put(`${this.baseURL}/${partidaId}/resultado`, { placar });
      console.log("✅ Resultado registrado!");
    } catch (error) {
      const appError = handleError(error, "PartidaService.registrarResultado");
      throw new Error(appError.message);
    }
  }

  /**
   * ✅ NOVO: Registrar resultado de partida REI DA PRAIA
   * (1 SET APENAS - formato específico)
   */
  async registrarResultadoReiDaPraia(
    partidaId: string,
    placar: Array<{
      numero: number;
      gamesDupla1: number;
      gamesDupla2: number;
    }>
  ): Promise<void> {
    try {
      console.log(
        `⚔️ Registrando resultado Rei da Praia - Partida ${partidaId}...`
      );

      // Validar placar (deve ter apenas 1 set)
      if (placar.length !== 1) {
        throw new Error("Partida Rei da Praia deve ter apenas 1 set");
      }

      await apiClient.put(`/partidas/rei-da-praia/${partidaId}/resultado`, {
        placar,
      });

      console.log("✅ Resultado Rei da Praia registrado!");
    } catch (error) {
      const appError = handleError(
        error,
        "PartidaService.registrarResultadoReiDaPraia"
      );
      throw new Error(appError.message);
    }
  }
}

export default new PartidaService();
