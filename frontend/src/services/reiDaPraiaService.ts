/**
 * Rei da Praia Service
 * Service específico para operações do formato Rei da Praia
 */

import { apiClient } from "./apiClient";
import { handleError } from "../utils/errorHandler";
import {
  EstatisticasJogador,
  PartidaReiDaPraia,
  ResultadoChavesReiDaPraia,
  ResultadoEliminatoriaReiDaPraia,
  TipoChaveamentoReiDaPraia,
} from "../types/reiDaPraia";
import { Grupo } from "../types/chave";

/**
 * Service para comunicação com API do Rei da Praia
 */
class ReiDaPraiaService {
  private readonly basePath = "/etapas";
  private readonly reiDaPraiaPath = "/rei-da-praia";

  // ============================================
  // GERAÇÃO DE CHAVES (FASE DE GRUPOS)
  // ============================================

  /**
   * Gerar chaves no formato Rei da Praia
   * (Grupos de 4 jogadores com combinações fixas)
   *
   * POST /api/etapas/:etapaId/rei-da-praia/gerar-chaves
   */
  async gerarChaves(etapaId: string): Promise<ResultadoChavesReiDaPraia> {
    try {
      console.log(`🎾 Gerando chaves Rei da Praia - Etapa ${etapaId}...`);

      const response = await apiClient.post<ResultadoChavesReiDaPraia>(
        `${this.basePath}/${etapaId}${this.reiDaPraiaPath}/gerar-chaves`,
        {}
      );

      console.log("✅ Chaves Rei da Praia geradas:");
      console.log(`   📊 ${response.jogadores.length} jogadores`);
      console.log(`   📦 ${response.grupos.length} grupos`);
      console.log(`   ⚔️ ${response.partidas.length} partidas`);

      return response;
    } catch (error) {
      const appError = handleError(error, "ReiDaPraiaService.gerarChaves");
      throw new Error(appError.message);
    }
  }

  // ============================================
  // BUSCAR DADOS (FASE DE GRUPOS)
  // ============================================

  /**
   * Buscar estatísticas individuais dos jogadores
   *
   * GET /api/etapas/:etapaId/rei-da-praia/jogadores
   */
  async buscarJogadores(etapaId: string): Promise<EstatisticasJogador[]> {
    try {
      console.log(`🔍 Buscando jogadores Rei da Praia - Etapa ${etapaId}...`);

      // Cache busting para evitar 304
      const timestamp = new Date().getTime();
      const response = await apiClient.get<EstatisticasJogador[]>(
        `${this.basePath}/${etapaId}${this.reiDaPraiaPath}/jogadores?_t=${timestamp}`
      );

      console.log(`✅ ${response.length} jogadores carregados`);
      return response;
    } catch (error) {
      const appError = handleError(error, "ReiDaPraiaService.buscarJogadores");
      throw new Error(appError.message);
    }
  }

  /**
   * Buscar grupos da etapa Rei da Praia
   *
   * GET /api/etapas/:etapaId/rei-da-praia/grupos
   */
  async buscarGrupos(etapaId: string): Promise<Grupo[]> {
    try {
      console.log(`🔍 Buscando grupos Rei da Praia - Etapa ${etapaId}...`);

      const timestamp = new Date().getTime();
      const response = await apiClient.get<Grupo[]>(
        `${this.basePath}/${etapaId}${this.reiDaPraiaPath}/grupos?_t=${timestamp}`
      );

      console.log(`✅ ${response.length} grupos carregados`);
      return response;
    } catch (error) {
      const appError = handleError(error, "ReiDaPraiaService.buscarGrupos");
      throw new Error(appError.message);
    }
  }

  /**
   * Buscar partidas da etapa Rei da Praia
   *
   * GET /api/etapas/:etapaId/rei-da-praia/partidas
   */
  async buscarPartidas(etapaId: string): Promise<PartidaReiDaPraia[]> {
    try {
      console.log(`🔍 Buscando partidas Rei da Praia - Etapa ${etapaId}...`);

      const timestamp = new Date().getTime();
      const response = await apiClient.get<PartidaReiDaPraia[]>(
        `${this.basePath}/${etapaId}${this.reiDaPraiaPath}/partidas?_t=${timestamp}`
      );

      console.log(`✅ ${response.length} partidas carregadas`);
      return response;
    } catch (error) {
      const appError = handleError(error, "ReiDaPraiaService.buscarPartidas");
      throw new Error(appError.message);
    }
  }

  /**
   * Buscar jogadores de um grupo específico
   *
   * GET /api/etapas/:etapaId/rei-da-praia/grupos/:grupoId/jogadores
   */
  async buscarJogadoresDoGrupo(
    etapaId: string,
    grupoId: string
  ): Promise<EstatisticasJogador[]> {
    try {
      const response = await apiClient.get<EstatisticasJogador[]>(
        `${this.basePath}/${etapaId}${this.reiDaPraiaPath}/grupos/${grupoId}/jogadores`
      );

      return response;
    } catch (error) {
      const appError = handleError(
        error,
        "ReiDaPraiaService.buscarJogadoresDoGrupo"
      );
      throw new Error(appError.message);
    }
  }

  // ============================================
  // REGISTRAR RESULTADOS (FASE DE GRUPOS)
  // ============================================

  /**
   * Registrar resultado de partida Rei da Praia (1 SET)
   *
   * PUT /api/partidas/rei-da-praia/:partidaId/resultado
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
      console.log(
        `⚔️ Registrando resultado Rei da Praia - Partida ${partidaId}...`
      );

      // Validar que é apenas 1 set
      if (placar.length !== 1) {
        throw new Error("Partida Rei da Praia deve ter apenas 1 set");
      }

      await apiClient.post(
        `${this.basePath}/${etapaId}${this.reiDaPraiaPath}/partidas/${partidaId}/resultado`,
        { placar }
      );

      console.log("✅ Resultado registrado!");
    } catch (error) {
      const appError = handleError(
        error,
        "ReiDaPraiaService.registrarResultado"
      );
      throw new Error(appError.message);
    }
  }

  // ============================================
  // FASE ELIMINATÓRIA
  // ============================================

  /**
   * Gerar fase eliminatória com duplas fixas
   *
   * POST /api/etapas/:etapaId/rei-da-praia/gerar-eliminatoria
   *
   * @param data - Configurações da eliminatória
   * @param data.classificadosPorGrupo - Quantos jogadores classificam por grupo (ex: 2)
   * @param data.tipoChaveamento - Tipo de chaveamento (melhores_com_melhores, pareamento_por_ranking, sorteio_aleatorio)
   */
  async gerarEliminatoria(
    etapaId: string,
    data: {
      classificadosPorGrupo: number;
      tipoChaveamento: TipoChaveamentoReiDaPraia;
    }
  ): Promise<ResultadoEliminatoriaReiDaPraia> {
    try {
      console.log(`🏆 Gerando fase eliminatória Rei da Praia...`);
      console.log(`   📊 ${data.classificadosPorGrupo} por grupo`);
      console.log(`   🎲 Chaveamento: ${data.tipoChaveamento}`);

      const response = await apiClient.post<ResultadoEliminatoriaReiDaPraia>(
        `${this.basePath}/${etapaId}${this.reiDaPraiaPath}/gerar-eliminatoria`,
        data
      );

      console.log("✅ Fase eliminatória gerada:");
      console.log(`   👥 ${response.duplas.length} duplas fixas`);
      console.log(`   ⚔️ ${response.confrontos.length} confrontos`);

      return response;
    } catch (error) {
      const appError = handleError(
        error,
        "ReiDaPraiaService.gerarEliminatoria"
      );
      throw new Error(appError.message);
    }
  }

  /**
   * Buscar duplas fixas da fase eliminatória
   *
   * GET /api/etapas/:etapaId/rei-da-praia/duplas-eliminatoria
   */
  async buscarDuplasEliminatoria(etapaId: string): Promise<any[]> {
    try {
      const response = await apiClient.get<any[]>(
        `${this.basePath}/${etapaId}${this.reiDaPraiaPath}/duplas-eliminatoria`
      );

      console.log(`✅ ${response.length} duplas eliminatória carregadas`);
      return response;
    } catch (error) {
      const appError = handleError(
        error,
        "ReiDaPraiaService.buscarDuplasEliminatoria"
      );
      throw new Error(appError.message);
    }
  }

  /**
   * Buscar confrontos eliminatórios
   *
   * GET /api/etapas/:etapaId/rei-da-praia/confrontos
   */
  async buscarConfrontosEliminatorios(etapaId: string): Promise<any[]> {
    try {
      const response = await apiClient.get<any[]>(
        `${this.basePath}/${etapaId}${this.reiDaPraiaPath}/confrontos`
      );

      console.log(`✅ ${response.length} confrontos carregados`);
      return response;
    } catch (error) {
      const appError = handleError(
        error,
        "ReiDaPraiaService.buscarConfrontosEliminatorios"
      );
      throw new Error(appError.message);
    }
  }

  // ============================================
  // VALIDAÇÕES
  // ============================================

  /**
   * Validar se etapa pode gerar chaves Rei da Praia
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

    // Validar número de inscritos
    if (etapa.totalInscritos < 8) {
      return {
        podeGerar: false,
        mensagem: "Necessário no mínimo 8 jogadores inscritos",
      };
    }

    // Validar múltiplo de 4
    if (etapa.totalInscritos % 4 !== 0) {
      return {
        podeGerar: false,
        mensagem: "Número de jogadores deve ser múltiplo de 4",
      };
    }

    // Validar que número de inscritos = maxJogadores
    if (etapa.totalInscritos !== etapa.maxJogadores) {
      return {
        podeGerar: false,
        mensagem: `Esta etapa está configurada para ${etapa.maxJogadores} jogadores, mas possui apenas ${etapa.totalInscritos} inscrito(s). Para gerar chaves com menos jogadores, primeiro edite a etapa e ajuste o número máximo de jogadores para ${etapa.totalInscritos}.`,
      };
    }

    return { podeGerar: true };
  }

  /**
   * Validar se pode gerar fase eliminatória
   *
   * @returns { podeGerar: boolean, mensagem?: string }
   */
  validarGeracaoEliminatoria(
    etapa: any,
    grupos: Grupo[]
  ): {
    podeGerar: boolean;
    mensagem?: string;
  } {
    // Validar que chaves foram geradas
    if (!etapa.chavesGeradas) {
      return {
        podeGerar: false,
        mensagem:
          "As chaves devem ser geradas antes de criar a fase eliminatória",
      };
    }

    // Validar que todos os grupos estão completos
    const gruposIncompletos = grupos.filter((g) => !g.completo);
    if (gruposIncompletos.length > 0) {
      const nomesGrupos = gruposIncompletos.map((g) => g.nome).join(", ");
      return {
        podeGerar: false,
        mensagem: `Os seguintes grupos ainda têm partidas pendentes: ${nomesGrupos}. Por favor, finalize todas as partidas antes de gerar a fase eliminatória.`,
      };
    }

    // Validar que tem mais de 1 grupo
    if (grupos.length === 1) {
      return {
        podeGerar: false,
        mensagem:
          "Não é possível gerar fase eliminatória com apenas 1 grupo. Grupo único é um campeonato completo onde todos jogam contra todos. O 1º colocado já é o campeão!",
      };
    }

    return { podeGerar: true };
  }

  /**
   * Cancelar fase eliminatória
   */
  async cancelarEliminatoria(etapaId: string): Promise<void> {
    await apiClient.post(
      `${this.basePath}/${etapaId}${this.reiDaPraiaPath}/cancelar-eliminatoria`
    );
  }
}

// Exportar instância única
export default new ReiDaPraiaService();
