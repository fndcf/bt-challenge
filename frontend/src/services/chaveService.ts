import { apiClient } from "./apiClient";
import {
  Dupla,
  Grupo,
  Partida,
  ResultadoGeracaoChaves,
  ConfrontoEliminatorio,
  TipoFase,
} from "../types/chave";

/**
 * Service para gerenciar chaves (duplas, grupos, partidas)
 */
class ChaveService {
  private baseURL = "/etapas";

  /**
   * Gerar chaves de uma etapa
   */
  async gerarChaves(etapaId: string): Promise<ResultadoGeracaoChaves> {
    try {
      console.log(`🎾 Gerando chaves para etapa ${etapaId}...`);
      const response = await apiClient.post<ResultadoGeracaoChaves>(
        `${this.baseURL}/${etapaId}/gerar-chaves`,
        {}
      );
      console.log("✅ Chaves geradas:", response);
      return response;
    } catch (error: any) {
      console.error("❌ Erro ao gerar chaves:", error);
      throw error;
    }
  }

  /**
   * Buscar duplas de uma etapa
   */
  async buscarDuplas(etapaId: string): Promise<Dupla[]> {
    try {
      // Cache busting: adicionar timestamp para evitar cache HTTP 304
      const timestamp = new Date().getTime();
      const response = await apiClient.get<Dupla[]>(
        `${this.baseURL}/${etapaId}/duplas?_t=${timestamp}`
      );
      console.log(`✅ Duplas carregadas:`, response?.length || 0);
      return response;
    } catch (error: any) {
      console.error("Erro ao buscar duplas:", error);
      throw error;
    }
  }

  /**
   * Buscar grupos de uma etapa
   */
  async buscarGrupos(etapaId: string): Promise<Grupo[]> {
    try {
      // Cache busting: adicionar timestamp para evitar cache HTTP 304
      const timestamp = new Date().getTime();
      const response = await apiClient.get<Grupo[]>(
        `${this.baseURL}/${etapaId}/grupos?_t=${timestamp}`
      );
      console.log(`✅ Grupos carregados:`, response?.length || 0);
      return response;
    } catch (error: any) {
      console.error("Erro ao buscar grupos:", error);
      throw error;
    }
  }

  /**
   * Buscar partidas de uma etapa
   */
  async buscarPartidas(etapaId: string): Promise<Partida[]> {
    try {
      const response = await apiClient.get<Partida[]>(
        `${this.baseURL}/${etapaId}/partidas`
      );
      return response;
    } catch (error: any) {
      console.error("Erro ao buscar partidas:", error);
      throw error;
    }
  }

  /**
   * Buscar duplas de um grupo específico
   */
  async buscarDuplasDoGrupo(
    etapaId: string,
    grupoId: string
  ): Promise<Dupla[]> {
    try {
      const response = await apiClient.get<Dupla[]>(
        `${this.baseURL}/${etapaId}/grupos/${grupoId}/duplas`
      );
      return response;
    } catch (error: any) {
      console.error("Erro ao buscar duplas do grupo:", error);
      throw error;
    }
  }

  /**
   * Excluir chaves de uma etapa (duplas, grupos, partidas)
   */
  async excluirChaves(etapaId: string): Promise<void> {
    try {
      console.log(`🗑️ Excluindo chaves da etapa ${etapaId}...`);
      await apiClient.delete(`${this.baseURL}/${etapaId}/chaves`);
      console.log("✅ Chaves excluídas com sucesso!");
    } catch (error: any) {
      console.error("❌ Erro ao excluir chaves:", error);
      throw error;
    }
  }

  /**
   * Gerar fase eliminatória
   */
  async gerarFaseEliminatoria(
    etapaId: string,
    classificadosPorGrupo: number = 2
  ): Promise<void> {
    try {
      console.log(`🏆 Gerando fase eliminatória...`);
      await apiClient.post(`${this.baseURL}/${etapaId}/gerar-eliminatoria`, {
        classificadosPorGrupo,
      });
      console.log("✅ Fase eliminatória gerada!");
    } catch (error: any) {
      console.error("❌ Erro ao gerar fase eliminatória:", error);
      throw error;
    }
  }

  /**
   * Buscar confrontos eliminatórios
   */
  async buscarConfrontosEliminatorios(
    etapaId: string,
    fase?: TipoFase
  ): Promise<ConfrontoEliminatorio[]> {
    try {
      const params = fase ? `?fase=${fase}` : "";
      const response = await apiClient.get<ConfrontoEliminatorio[]>(
        `${this.baseURL}/${etapaId}/confrontos-eliminatorios${params}`
      );
      return response;
    } catch (error: any) {
      console.error("Erro ao buscar confrontos eliminatórios:", error);
      throw error;
    }
  }

  /**
   * Registrar resultado de confronto eliminatório
   */
  async registrarResultadoEliminatorio(
    confrontoId: string,
    placar: { numero: number; gamesDupla1: number; gamesDupla2: number }[]
  ): Promise<void> {
    try {
      console.log(`⚔️ Registrando resultado do confronto...`);
      await apiClient.post(
        `/etapas/confrontos-eliminatorios/${confrontoId}/resultado`,
        { placar }
      );
      console.log("✅ Resultado registrado!");
    } catch (error: any) {
      console.error("❌ Erro ao registrar resultado:", error);
      throw error;
    }
  }

  /**
   * Cancelar/Excluir fase eliminatória
   */
  async cancelarFaseEliminatoria(etapaId: string): Promise<void> {
    try {
      console.log(`🗑️ Cancelando fase eliminatória...`);
      await apiClient.delete(
        `${this.baseURL}/${etapaId}/cancelar-eliminatoria`
      );
      console.log("✅ Fase eliminatória cancelada!");
    } catch (error: any) {
      console.error("❌ Erro ao cancelar fase eliminatória:", error);
      throw error;
    }
  }
}

export default new ChaveService();
