/**
 * Service para gerenciar chaves do formato DUPLA FIXA
 */

import { apiClient } from "./apiClient";
import {
  Dupla,
  Grupo,
  Partida,
  ResultadoGeracaoChaves,
  ConfrontoEliminatorio,
  TipoFase,
} from "../types/chave";
import { handleError } from "../utils/errorHandler";
import logger from "../utils/logger";
import { IChaveService } from "./interfaces/IChaveService";

class ChaveService implements IChaveService {
  private baseURL = "/etapas";

  // ============================================
  // GERAÇÃO DE CHAVES
  // ============================================

  /**
   * Gerar chaves de uma etapa
   */
  async gerarChaves(etapaId: string): Promise<ResultadoGeracaoChaves> {
    try {
      const response = await apiClient.post<ResultadoGeracaoChaves>(
        `${this.baseURL}/${etapaId}/gerar-chaves`,
        {}
      );

      logger.info("Chaves Dupla Fixa geradas", {
        etapaId,
        totalDuplas: response.duplas?.length || 0,
        totalGrupos: response.grupos?.length || 0,
        totalPartidas: response.partidas?.length || 0,
      });

      return response;
    } catch (error) {
      const appError = handleError(error, "ChaveService.gerarChaves");
      throw new Error(appError.message);
    }
  }

  /**
   * Excluir chaves de uma etapa (duplas, grupos, partidas)
   */
  async excluirChaves(etapaId: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseURL}/${etapaId}/chaves`);

      logger.info("Chaves Dupla Fixa excluídas", { etapaId });
    } catch (error) {
      const appError = handleError(error, "ChaveService.excluirChaves");
      throw new Error(appError.message);
    }
  }

  // ============================================
  // CONSULTAS - DUPLAS
  // ============================================

  /**
   * Buscar duplas de uma etapa
   */
  async buscarDuplas(etapaId: string): Promise<Dupla[]> {
    try {
      const timestamp = new Date().getTime();
      const response = await apiClient.get<Dupla[]>(
        `${this.baseURL}/${etapaId}/duplas?_t=${timestamp}`
      );
      return response;
    } catch (error) {
      const appError = handleError(error, "ChaveService.buscarDuplas");
      throw new Error(appError.message);
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
    } catch (error) {
      const appError = handleError(error, "ChaveService.buscarDuplasDoGrupo");
      throw new Error(appError.message);
    }
  }

  // ============================================
  // CONSULTAS - GRUPOS
  // ============================================

  /**
   * Buscar grupos de uma etapa
   */
  async buscarGrupos(etapaId: string): Promise<Grupo[]> {
    try {
      const timestamp = new Date().getTime();
      const response = await apiClient.get<Grupo[]>(
        `${this.baseURL}/${etapaId}/grupos?_t=${timestamp}`
      );
      return response;
    } catch (error) {
      const appError = handleError(error, "ChaveService.buscarGrupos");
      throw new Error(appError.message);
    }
  }

  // ============================================
  // CONSULTAS - PARTIDAS
  // ============================================

  /**
   * Buscar partidas de uma etapa
   */
  async buscarPartidas(etapaId: string): Promise<Partida[]> {
    try {
      const response = await apiClient.get<Partida[]>(
        `${this.baseURL}/${etapaId}/partidas`
      );
      return response;
    } catch (error) {
      const appError = handleError(error, "ChaveService.buscarPartidas");
      throw new Error(appError.message);
    }
  }

  // ============================================
  // FASE ELIMINATÓRIA
  // ============================================

  /**
   * Gerar fase eliminatória
   */
  async gerarFaseEliminatoria(
    etapaId: string,
    classificadosPorGrupo: number = 2
  ): Promise<void> {
    try {
      await apiClient.post(`${this.baseURL}/${etapaId}/gerar-eliminatoria`, {
        classificadosPorGrupo,
      });

      logger.info("Fase eliminatória Dupla Fixa gerada", {
        etapaId,
        classificadosPorGrupo,
      });
    } catch (error) {
      const appError = handleError(error, "ChaveService.gerarFaseEliminatoria");
      throw new Error(appError.message);
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
    } catch (error) {
      const appError = handleError(
        error,
        "ChaveService.buscarConfrontosEliminatorios"
      );
      throw new Error(appError.message);
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
      await apiClient.post(
        `/etapas/confrontos-eliminatorios/${confrontoId}/resultado`,
        { placar }
      );

      logger.info("Resultado eliminatória Dupla Fixa registrado", {
        confrontoId,
        totalSets: placar.length,
        placar: placar
          .map((s) => `${s.gamesDupla1}-${s.gamesDupla2}`)
          .join(", "),
      });
    } catch (error) {
      const appError = handleError(
        error,
        "ChaveService.registrarResultadoEliminatorio"
      );
      throw new Error(appError.message);
    }
  }

  /**
   * Cancelar/Excluir fase eliminatória
   */
  async cancelarFaseEliminatoria(etapaId: string): Promise<void> {
    try {
      await apiClient.delete(
        `${this.baseURL}/${etapaId}/cancelar-eliminatoria`
      );

      logger.info("Fase eliminatória Dupla Fixa cancelada", { etapaId });
    } catch (error) {
      const appError = handleError(
        error,
        "ChaveService.cancelarFaseEliminatoria"
      );
      throw new Error(appError.message);
    }
  }
}

export default new ChaveService();
