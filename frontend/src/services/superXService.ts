/**
 * Service específico para operações do formato Super X (Super 8, Super 10, Super 12)
 */

import { apiClient } from "./apiClient";
import { handleError } from "../utils/errorHandler";
import logger from "../utils/logger";
import {
  EstatisticasJogador,
  PartidaReiDaPraia,
  ResultadoPartidaLoteSuperXDTO,
  RegistrarResultadosEmLoteSuperXResponse,
} from "../types/reiDaPraia";
import { Grupo } from "../types/chave";

/**
 * Resultado da geração de chaves Super X
 */
export interface ResultadoChavesSuperX {
  jogadores: EstatisticasJogador[];
  grupo: Grupo;
  partidas: PartidaReiDaPraia[];
}

/**
 * Interface do service Super X
 */
export interface ISuperXService {
  gerarChaves(etapaId: string): Promise<ResultadoChavesSuperX>;
  cancelarChaves(etapaId: string): Promise<void>;
  buscarJogadores(etapaId: string): Promise<EstatisticasJogador[]>;
  buscarGrupo(etapaId: string): Promise<Grupo>;
  buscarPartidas(etapaId: string): Promise<PartidaReiDaPraia[]>;
  registrarResultado(
    etapaId: string,
    partidaId: string,
    placar: Array<{
      numero: number;
      gamesDupla1: number;
      gamesDupla2: number;
    }>
  ): Promise<void>;
}

/**
 * Service para comunicação com API do Super X
 */
class SuperXService implements ISuperXService {
  private readonly basePath = "/etapas";
  private readonly superXPath = "/super-x";

  // ============================================
  // GERAÇÃO DE CHAVES
  // ============================================

  /**
   * Gerar chaves no formato Super X
   * (Grupo único com duplas rotativas)
   *
   * POST /api/etapas/:etapaId/super-x/gerar-chaves
   */
  async gerarChaves(etapaId: string): Promise<ResultadoChavesSuperX> {
    try {
      const response = await apiClient.post<ResultadoChavesSuperX>(
        `${this.basePath}/${etapaId}${this.superXPath}/gerar-chaves`,
        {}
      );

      logger.info("Chaves Super X geradas", {
        etapaId,
        totalJogadores: response.jogadores?.length || 0,
        totalPartidas: response.partidas?.length || 0,
      });

      return response;
    } catch (error) {
      const appError = handleError(error, "SuperXService.gerarChaves");
      throw new Error(appError.message);
    }
  }

  /**
   * Cancelar chaves Super X
   *
   * DELETE /api/etapas/:etapaId/super-x/cancelar-chaves
   */
  async cancelarChaves(etapaId: string): Promise<void> {
    try {
      await apiClient.delete(
        `${this.basePath}/${etapaId}${this.superXPath}/cancelar-chaves`
      );

      logger.info("Chaves Super X canceladas", { etapaId });
    } catch (error) {
      const appError = handleError(error, "SuperXService.cancelarChaves");
      throw new Error(appError.message);
    }
  }

  // ============================================
  // BUSCAR DADOS
  // ============================================

  /**
   * Buscar estatísticas individuais dos jogadores
   *
   * GET /api/etapas/:etapaId/super-x/jogadores
   */
  async buscarJogadores(etapaId: string): Promise<EstatisticasJogador[]> {
    try {
      const timestamp = new Date().getTime();
      const response = await apiClient.get<EstatisticasJogador[]>(
        `${this.basePath}/${etapaId}${this.superXPath}/jogadores?_t=${timestamp}`
      );

      return response;
    } catch (error) {
      const appError = handleError(error, "SuperXService.buscarJogadores");
      throw new Error(appError.message);
    }
  }

  /**
   * Buscar grupo único da etapa Super X
   *
   * GET /api/etapas/:etapaId/super-x/grupo
   */
  async buscarGrupo(etapaId: string): Promise<Grupo> {
    try {
      const timestamp = new Date().getTime();
      const response = await apiClient.get<Grupo>(
        `${this.basePath}/${etapaId}${this.superXPath}/grupo?_t=${timestamp}`
      );

      return response;
    } catch (error) {
      const appError = handleError(error, "SuperXService.buscarGrupo");
      throw new Error(appError.message);
    }
  }

  /**
   * Buscar partidas da etapa Super X
   *
   * GET /api/etapas/:etapaId/super-x/partidas
   */
  async buscarPartidas(etapaId: string): Promise<PartidaReiDaPraia[]> {
    try {
      const timestamp = new Date().getTime();
      const response = await apiClient.get<PartidaReiDaPraia[]>(
        `${this.basePath}/${etapaId}${this.superXPath}/partidas?_t=${timestamp}`
      );

      return response;
    } catch (error) {
      const appError = handleError(error, "SuperXService.buscarPartidas");
      throw new Error(appError.message);
    }
  }

  // ============================================
  // REGISTRAR RESULTADOS
  // ============================================

  /**
   * Registrar resultado de partida Super X (1 SET)
   *
   * POST /api/etapas/:etapaId/super-x/partidas/:partidaId/resultado
   */
  async registrarResultado(
    etapaId: string,
    partidaId: string,
    placar: Array<{
      numero: number;
      gamesDupla1: number;
      gamesDupla2: number;
    }>
  ): Promise<void> {
    try {
      // Validar que é apenas 1 set
      if (placar.length !== 1) {
        throw new Error("Partida Super X deve ter apenas 1 set");
      }

      await apiClient.post(
        `${this.basePath}/${etapaId}${this.superXPath}/partidas/${partidaId}/resultado`,
        { placar }
      );

      logger.info("Resultado Super X registrado", {
        etapaId,
        partidaId,
        placar: `${placar[0].gamesDupla1}-${placar[0].gamesDupla2}`,
      });
    } catch (error) {
      const appError = handleError(error, "SuperXService.registrarResultado");
      throw new Error(appError.message);
    }
  }

  /**
   * Registrar múltiplos resultados de partidas em lote
   *
   * POST /api/etapas/:etapaId/super-x/resultados-lote
   */
  async registrarResultadosEmLote(
    etapaId: string,
    resultados: ResultadoPartidaLoteSuperXDTO[]
  ): Promise<RegistrarResultadosEmLoteSuperXResponse> {
    try {
      const response = await apiClient.post<RegistrarResultadosEmLoteSuperXResponse>(
        `${this.basePath}/${etapaId}${this.superXPath}/resultados-lote`,
        { resultados }
      );

      logger.info("Resultados Super X registrados em lote", {
        etapaId,
        total: resultados.length,
        processados: response.processados,
        erros: response.erros?.length || 0,
      });

      return response;
    } catch (error) {
      const appError = handleError(
        error,
        "SuperXService.registrarResultadosEmLote"
      );
      throw new Error(appError.message);
    }
  }

  // ============================================
  // VALIDAÇÕES
  // ============================================

  /**
   * Validar se etapa pode gerar chaves Super X
   *
   * @returns { podeGerar: boolean, mensagem?: string }
   */
  validarGeracaoChaves(etapa: any): {
    podeGerar: boolean;
    mensagem?: string;
  } {
    // Validar status
    if (etapa.status !== "inscricoes_encerradas") {
      return {
        podeGerar: false,
        mensagem: "As inscrições devem estar encerradas",
      };
    }

    // Validar que já não foram geradas
    if (etapa.chavesGeradas) {
      return {
        podeGerar: false,
        mensagem: "Chaves já foram geradas para esta etapa",
      };
    }

    // Validar variante (apenas 8 e 12)
    const variante = etapa.varianteSuperX;
    if (!variante || ![8, 12].includes(variante)) {
      return {
        podeGerar: false,
        mensagem: "Variante Super X inválida",
      };
    }

    // Validar número de inscritos deve ser exato
    if (etapa.totalInscritos !== variante) {
      return {
        podeGerar: false,
        mensagem: `Super ${variante} requer exatamente ${variante} jogadores. Atualmente há ${etapa.totalInscritos} inscritos.`,
      };
    }

    return { podeGerar: true };
  }
}

// Exportar instância única
export default new SuperXService();
