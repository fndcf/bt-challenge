import { apiClient } from "./apiClient";
import { SetPartida } from "../types/chave";

/**
 * Service para gerenciar partidas
 */
class PartidaService {
  private baseURL = "/partidas";

  /**
   * Registrar resultado de uma partida
   */
  async registrarResultado(
    partidaId: string,
    placar: SetPartida[]
  ): Promise<void> {
    try {
      console.log(`⚔️ Registrando resultado da partida ${partidaId}...`);
      await apiClient.put(`${this.baseURL}/${partidaId}/resultado`, { placar });
      console.log("✅ Resultado registrado!");
    } catch (error: any) {
      console.error("❌ Erro ao registrar resultado:", error);
      throw error;
    }
  }
}

export default new PartidaService();
