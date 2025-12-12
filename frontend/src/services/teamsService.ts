/**
 * Service para operações do formato TEAMS (Equipes)
 */

import { apiClient } from "./apiClient";
import { handleError } from "../utils/errorHandler";
import logger from "../utils/logger";
import {
  Equipe,
  ConfrontoEquipe,
  PartidaTeams,
  SetPlacarTeams,
  GerarEquipesDTO,
  FormarEquipesManualDTO,
  DefinirPartidasManualDTO,
  GerarEquipesResponse,
  RegistrarResultadoResponse,
  GerarPartidasResponse,
  GerarDeciderResponse,
} from "../types/teams";
import { VarianteTeams, TipoFormacaoEquipe } from "../types/etapa";

/**
 * Interface do service TEAMS
 */
export interface ITeamsService {
  // Equipes
  gerarEquipes(etapaId: string, dto?: GerarEquipesDTO): Promise<GerarEquipesResponse>;
  formarEquipesManual(etapaId: string, dto: FormarEquipesManualDTO): Promise<GerarEquipesResponse>;
  buscarEquipes(etapaId: string): Promise<Equipe[]>;

  // Confrontos
  buscarConfrontos(etapaId: string): Promise<ConfrontoEquipe[]>;

  // Partidas
  gerarPartidasConfronto(etapaId: string, confrontoId: string): Promise<GerarPartidasResponse>;
  definirPartidasManual(
    etapaId: string,
    confrontoId: string,
    dto: DefinirPartidasManualDTO
  ): Promise<GerarPartidasResponse>;
  buscarPartidasConfronto(etapaId: string, confrontoId: string): Promise<PartidaTeams[]>;
  definirJogadoresPartida(
    etapaId: string,
    partidaId: string,
    dupla1JogadorIds: [string, string],
    dupla2JogadorIds: [string, string]
  ): Promise<PartidaTeams>;

  // Resultado
  registrarResultado(
    etapaId: string,
    partidaId: string,
    placar: SetPlacarTeams[]
  ): Promise<RegistrarResultadoResponse>;

  // Decider
  gerarDecider(etapaId: string, confrontoId: string): Promise<GerarDeciderResponse>;

  // Cancelar / Resetar
  cancelarChaves(etapaId: string): Promise<void>;
  resetarPartidas(etapaId: string): Promise<void>;

  // Classificação
  recalcularClassificacao(etapaId: string): Promise<Equipe[]>;
}

/**
 * Service para comunicação com API do TEAMS
 */
class TeamsService implements ITeamsService {
  private readonly basePath = "/etapas";
  private readonly teamsPath = "/teams";

  // ============================================
  // EQUIPES
  // ============================================

  /**
   * Gerar equipes automaticamente
   *
   * POST /api/etapas/:etapaId/teams/gerar-equipes
   */
  async gerarEquipes(
    etapaId: string,
    dto: GerarEquipesDTO = {}
  ): Promise<GerarEquipesResponse> {
    try {
      const response = await apiClient.post<GerarEquipesResponse>(
        `${this.basePath}/${etapaId}${this.teamsPath}/gerar-equipes`,
        dto
      );

      logger.info("Equipes TEAMS geradas", {
        etapaId,
        equipes: response.equipes,
        confrontos: response.confrontos,
      });

      return response;
    } catch (error) {
      const appError = handleError(error, "TeamsService.gerarEquipes");
      throw new Error(appError.message);
    }
  }

  /**
   * Formar equipes manualmente
   *
   * POST /api/etapas/:etapaId/teams/formar-equipes-manual
   */
  async formarEquipesManual(
    etapaId: string,
    dto: FormarEquipesManualDTO
  ): Promise<GerarEquipesResponse> {
    try {
      const response = await apiClient.post<GerarEquipesResponse>(
        `${this.basePath}/${etapaId}${this.teamsPath}/formar-equipes-manual`,
        dto
      );

      logger.info("Equipes TEAMS formadas manualmente", {
        etapaId,
        equipes: response.equipes,
      });

      return response;
    } catch (error) {
      const appError = handleError(error, "TeamsService.formarEquipesManual");
      throw new Error(appError.message);
    }
  }

  /**
   * Buscar equipes da etapa
   *
   * GET /api/etapas/:etapaId/teams/equipes
   */
  async buscarEquipes(etapaId: string): Promise<Equipe[]> {
    try {
      const timestamp = new Date().getTime();
      const response = await apiClient.get<Equipe[]>(
        `${this.basePath}/${etapaId}${this.teamsPath}/equipes?_t=${timestamp}`
      );

      return response;
    } catch (error) {
      const appError = handleError(error, "TeamsService.buscarEquipes");
      throw new Error(appError.message);
    }
  }

  // ============================================
  // CONFRONTOS
  // ============================================

  /**
   * Buscar confrontos da etapa
   *
   * GET /api/etapas/:etapaId/teams/confrontos
   */
  async buscarConfrontos(etapaId: string): Promise<ConfrontoEquipe[]> {
    try {
      const timestamp = new Date().getTime();
      const response = await apiClient.get<ConfrontoEquipe[]>(
        `${this.basePath}/${etapaId}${this.teamsPath}/confrontos?_t=${timestamp}`
      );

      return response;
    } catch (error) {
      const appError = handleError(error, "TeamsService.buscarConfrontos");
      throw new Error(appError.message);
    }
  }

  // ============================================
  // PARTIDAS
  // ============================================

  /**
   * Gerar partidas de um confronto (sorteio automático)
   *
   * POST /api/etapas/:etapaId/teams/confrontos/:confrontoId/gerar-partidas
   */
  async gerarPartidasConfronto(
    etapaId: string,
    confrontoId: string
  ): Promise<GerarPartidasResponse> {
    try {
      const response = await apiClient.post<GerarPartidasResponse>(
        `${this.basePath}/${etapaId}${this.teamsPath}/confrontos/${confrontoId}/gerar-partidas`,
        {}
      );

      logger.info("Partidas do confronto TEAMS geradas", {
        etapaId,
        confrontoId,
        partidas: response.partidas,
      });

      return response;
    } catch (error) {
      const appError = handleError(error, "TeamsService.gerarPartidasConfronto");
      throw new Error(appError.message);
    }
  }

  /**
   * Definir partidas manualmente
   *
   * POST /api/etapas/:etapaId/teams/confrontos/:confrontoId/definir-partidas
   */
  async definirPartidasManual(
    etapaId: string,
    confrontoId: string,
    dto: DefinirPartidasManualDTO
  ): Promise<GerarPartidasResponse> {
    try {
      const response = await apiClient.post<GerarPartidasResponse>(
        `${this.basePath}/${etapaId}${this.teamsPath}/confrontos/${confrontoId}/definir-partidas`,
        dto
      );

      logger.info("Partidas do confronto TEAMS definidas manualmente", {
        etapaId,
        confrontoId,
        partidas: response.partidas,
      });

      return response;
    } catch (error) {
      const appError = handleError(error, "TeamsService.definirPartidasManual");
      throw new Error(appError.message);
    }
  }

  /**
   * Buscar partidas de um confronto
   *
   * GET /api/etapas/:etapaId/teams/confrontos/:confrontoId/partidas
   */
  async buscarPartidasConfronto(
    etapaId: string,
    confrontoId: string
  ): Promise<PartidaTeams[]> {
    try {
      const timestamp = new Date().getTime();
      const response = await apiClient.get<PartidaTeams[]>(
        `${this.basePath}/${etapaId}${this.teamsPath}/confrontos/${confrontoId}/partidas?_t=${timestamp}`
      );

      return response;
    } catch (error) {
      const appError = handleError(error, "TeamsService.buscarPartidasConfronto");
      throw new Error(appError.message);
    }
  }

  /**
   * Definir jogadores de uma partida vazia (formação manual)
   *
   * POST /api/etapas/:etapaId/teams/partidas/:partidaId/definir-jogadores
   */
  async definirJogadoresPartida(
    etapaId: string,
    partidaId: string,
    dupla1JogadorIds: [string, string],
    dupla2JogadorIds: [string, string]
  ): Promise<PartidaTeams> {
    try {
      const response = await apiClient.post<PartidaTeams>(
        `${this.basePath}/${etapaId}${this.teamsPath}/partidas/${partidaId}/definir-jogadores`,
        { dupla1JogadorIds, dupla2JogadorIds }
      );

      logger.info("Jogadores da partida definidos", {
        etapaId,
        partidaId,
      });

      return response;
    } catch (error) {
      const appError = handleError(error, "TeamsService.definirJogadoresPartida");
      throw new Error(appError.message);
    }
  }

  // ============================================
  // RESULTADO
  // ============================================

  /**
   * Registrar resultado de uma partida
   *
   * POST /api/etapas/:etapaId/teams/partidas/:partidaId/resultado
   */
  async registrarResultado(
    etapaId: string,
    partidaId: string,
    placar: SetPlacarTeams[]
  ): Promise<RegistrarResultadoResponse> {
    try {
      const response = await apiClient.post<RegistrarResultadoResponse>(
        `${this.basePath}/${etapaId}${this.teamsPath}/partidas/${partidaId}/resultado`,
        { placar }
      );

      logger.info("Resultado TEAMS registrado", {
        etapaId,
        partidaId,
        precisaDecider: response.precisaDecider,
        confrontoFinalizado: response.confrontoFinalizado,
      });

      return response;
    } catch (error) {
      const appError = handleError(error, "TeamsService.registrarResultado");
      throw new Error(appError.message);
    }
  }

  // ============================================
  // DECIDER
  // ============================================

  /**
   * Gerar decider quando empate 1-1 em TEAMS_4
   *
   * POST /api/etapas/:etapaId/teams/confrontos/:confrontoId/gerar-decider
   */
  async gerarDecider(
    etapaId: string,
    confrontoId: string
  ): Promise<GerarDeciderResponse> {
    try {
      const response = await apiClient.post<GerarDeciderResponse>(
        `${this.basePath}/${etapaId}${this.teamsPath}/confrontos/${confrontoId}/gerar-decider`,
        {}
      );

      logger.info("Decider TEAMS gerado", {
        etapaId,
        confrontoId,
        deciderId: response.decider?.id,
      });

      return response;
    } catch (error) {
      const appError = handleError(error, "TeamsService.gerarDecider");
      throw new Error(appError.message);
    }
  }

  // ============================================
  // CANCELAR
  // ============================================

  /**
   * Cancelar chaves TEAMS (remove equipes, confrontos e partidas)
   *
   * DELETE /api/etapas/:etapaId/teams/cancelar
   */
  async cancelarChaves(etapaId: string): Promise<void> {
    try {
      await apiClient.delete(
        `${this.basePath}/${etapaId}${this.teamsPath}/cancelar`
      );

      logger.info("Chaves TEAMS canceladas", { etapaId });
    } catch (error) {
      const appError = handleError(error, "TeamsService.cancelarChaves");
      throw new Error(appError.message);
    }
  }

  /**
   * Resetar partidas TEAMS (mantém equipes e confrontos, remove partidas e resultados)
   *
   * DELETE /api/etapas/:etapaId/teams/resetar-partidas
   */
  async resetarPartidas(etapaId: string): Promise<void> {
    try {
      await apiClient.delete(
        `${this.basePath}/${etapaId}${this.teamsPath}/resetar-partidas`
      );

      logger.info("Partidas TEAMS resetadas", { etapaId });
    } catch (error) {
      const appError = handleError(error, "TeamsService.resetarPartidas");
      throw new Error(appError.message);
    }
  }

  // ============================================
  // CLASSIFICAÇÃO
  // ============================================

  /**
   * Recalcular classificação das equipes
   *
   * POST /api/etapas/:etapaId/teams/recalcular-classificacao
   */
  async recalcularClassificacao(etapaId: string): Promise<Equipe[]> {
    try {
      const response = await apiClient.post<Equipe[]>(
        `${this.basePath}/${etapaId}${this.teamsPath}/recalcular-classificacao`,
        {}
      );

      logger.info("Classificação TEAMS recalculada", { etapaId });

      return response;
    } catch (error) {
      const appError = handleError(error, "TeamsService.recalcularClassificacao");
      throw new Error(appError.message);
    }
  }

  // ============================================
  // VALIDAÇÕES
  // ============================================

  /**
   * Validar se etapa pode gerar equipes TEAMS
   *
   * @returns { podeGerar: boolean, mensagem?: string }
   */
  validarGeracaoEquipes(etapa: any): {
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
        mensagem: "Equipes já foram geradas para esta etapa",
      };
    }

    // Validar variante
    const variante = etapa.varianteTeams as VarianteTeams;
    if (!variante || ![VarianteTeams.TEAMS_4, VarianteTeams.TEAMS_6].includes(variante)) {
      return {
        podeGerar: false,
        mensagem: "Variante TEAMS inválida",
      };
    }

    // Validar número de inscritos (deve ser múltiplo da variante)
    if (etapa.totalInscritos % variante !== 0) {
      return {
        podeGerar: false,
        mensagem: `Número de inscritos (${etapa.totalInscritos}) deve ser múltiplo de ${variante}`,
      };
    }

    // Validar mínimo de equipes
    const numEquipes = etapa.totalInscritos / variante;
    if (numEquipes < 2) {
      return {
        podeGerar: false,
        mensagem: `Mínimo de ${variante * 2} jogadores para formar 2 equipes`,
      };
    }

    return { podeGerar: true };
  }

  /**
   * Obter descrição do tipo de formação
   */
  getDescricaoFormacao(tipo: TipoFormacaoEquipe): string {
    switch (tipo) {
      case TipoFormacaoEquipe.MESMO_NIVEL:
        return "Apenas jogadores do mesmo nível";
      case TipoFormacaoEquipe.BALANCEADO:
        return "Distribuição equilibrada por nível (potes)";
      case TipoFormacaoEquipe.MANUAL:
        return "Organizador define as equipes manualmente";
      default:
        return "";
    }
  }

  /**
   * Obter descrição da variante
   */
  getDescricaoVariante(variante: VarianteTeams): string {
    switch (variante) {
      case VarianteTeams.TEAMS_4:
        return "4 jogadores por equipe (2 jogos + decider se 1-1)";
      case VarianteTeams.TEAMS_6:
        return "6 jogadores por equipe (3 jogos, sempre misto)";
      default:
        return "";
    }
  }
}

// Exportar instância única
export default new TeamsService();
