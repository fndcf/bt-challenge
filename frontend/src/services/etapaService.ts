import { apiClient } from "./apiClient";
import {
  Etapa,
  CriarEtapaDTO,
  AtualizarEtapaDTO,
  InscreverJogadorDTO,
  Inscricao,
  FiltrosEtapa,
  ListagemEtapas,
  EstatisticasEtapa,
  ResultadoGeracaoChaves,
} from "../types/etapa";
import { handleError } from "@/utils/errorHandler";
import logger from "@/utils/logger"; // ← IMPORTAR LOGGER
import { IEtapaService } from "./interfaces/IEtapaService";

/**
 * Service para gerenciar etapas
 */
class EtapaService implements IEtapaService {
  private baseURL = "/etapas";

  /**
   * Criar nova etapa
   */
  async criar(data: CriarEtapaDTO): Promise<Etapa> {
    try {
      const etapa = await apiClient.post<Etapa>(this.baseURL, data);

      logger.info("Etapa criada", {
        etapaId: etapa.id,
        nome: etapa.nome,
        formato: etapa.formato,
        nivel: etapa.nivel,
        genero: etapa.genero,
        maxJogadores: etapa.maxJogadores,
      });

      return etapa;
    } catch (error) {
      const appError = handleError(error, "EtapaService.criar");
      throw new Error(appError.message);
    }
  }

  /**
   * Listar etapas
   */
  async listar(filtros?: FiltrosEtapa): Promise<ListagemEtapas> {
    try {
      const params = new URLSearchParams();

      if (filtros?.status) params.append("status", filtros.status);
      if (filtros?.nivel) params.append("nivel", filtros.nivel);
      if (filtros?.genero) params.append("genero", filtros.genero);
      if (filtros?.formato) params.append("formato", filtros.formato);
      if (filtros?.ordenarPor) params.append("ordenarPor", filtros.ordenarPor);
      if (filtros?.ordem) params.append("ordem", filtros.ordem);
      if (filtros?.limite) params.append("limite", filtros.limite.toString());
      if (filtros?.offset) params.append("offset", filtros.offset.toString());

      const queryString = params.toString();
      const url = queryString ? `${this.baseURL}?${queryString}` : this.baseURL;

      return await apiClient.get<ListagemEtapas>(url);
    } catch (error: any) {
      logger.warn("Erro ao listar etapas - retornando lista vazia", {
        erro: error.message,
      });

      // Se erro de autenticação, deixar o apiClient redirecionar
      if (
        error.message?.includes("Token") ||
        error.message?.includes("autenticação")
      ) {
        throw error;
      }

      // Para outros erros, retornar lista vazia
      return {
        etapas: [],
        total: 0,
        limite: filtros?.limite || 20,
        offset: filtros?.offset || 0,
        temMais: false,
      };
    }
  }

  /**
   * Buscar etapa por ID
   */
  async buscarPorId(id: string): Promise<Etapa> {
    try {
      return await apiClient.get<Etapa>(`${this.baseURL}/${id}`);
    } catch (error) {
      const appError = handleError(error, "EtapaService.buscarPorId");
      throw new Error(appError.message);
    }
  }

  /**
   * Buscar etapa por slug
   */
  async buscarPorSlug(slug: string): Promise<Etapa> {
    try {
      return await apiClient.get<Etapa>(`${this.baseURL}/slug/${slug}`);
    } catch (error) {
      const appError = handleError(error, "EtapaService.buscarPorSlug");
      throw new Error(appError.message);
    }
  }

  /**
   * Atualizar etapa
   */
  async atualizar(id: string, data: AtualizarEtapaDTO): Promise<Etapa> {
    try {
      const etapa = await apiClient.put<Etapa>(`${this.baseURL}/${id}`, data);

      logger.info("Etapa atualizada", {
        etapaId: etapa.id,
        nome: etapa.nome,
        camposAtualizados: Object.keys(data),
      });

      return etapa;
    } catch (error) {
      const appError = handleError(error, "EtapaService.atualizar");
      throw new Error(appError.message);
    }
  }

  /**
   * Deletar etapa
   */
  async deletar(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseURL}/${id}`);

      logger.info("Etapa deletada", { etapaId: id });
    } catch (error) {
      const appError = handleError(error, "EtapaService.deletar");
      throw new Error(appError.message);
    }
  }

  /**
   * Inscrever jogador
   */
  async inscreverJogador(
    etapaId: string,
    data: InscreverJogadorDTO
  ): Promise<Inscricao> {
    try {
      const inscricao = await apiClient.post<Inscricao>(
        `${this.baseURL}/${etapaId}/inscrever`,
        data
      );

      logger.info("Jogador inscrito na etapa", {
        etapaId,
        jogadorId: data.jogadorId,
        inscricaoId: inscricao.id,
      });

      return inscricao;
    } catch (error) {
      const appError = handleError(error, "EtapaService.inscreverJogador");
      throw new Error(appError.message);
    }
  }

  /**
   * Inscrever múltiplos jogadores
   */
  async inscreverJogadores(
    etapaId: string,
    jogadorIds: string[]
  ): Promise<Inscricao[]> {
    try {
      const inscricoes: Inscricao[] = [];

      // Inscrever cada jogador sequencialmente
      for (const jogadorId of jogadorIds) {
        const inscricao = await this.inscreverJogador(etapaId, { jogadorId });
        inscricoes.push(inscricao);
      }

      return inscricoes;
    } catch (error) {
      const appError = handleError(error, "EtapaService.inscreverJogadores");
      throw new Error(appError.message);
    }
  }

  /**
   * Listar inscrições
   */
  async listarInscricoes(etapaId: string): Promise<Inscricao[]> {
    try {
      return await apiClient.get<Inscricao[]>(
        `${this.baseURL}/${etapaId}/inscricoes`
      );
    } catch (error: any) {
      logger.warn("Erro ao listar inscrições - retornando lista vazia", {
        etapaId,
        erro: error.message,
      });

      return [];
    }
  }

  /**
   * Cancelar inscrição
   */
  async cancelarInscricao(etapaId: string, inscricaoId: string): Promise<void> {
    try {
      await apiClient.delete(
        `${this.baseURL}/${etapaId}/inscricoes/${inscricaoId}`
      );

      logger.info("Inscrição cancelada", {
        etapaId,
        inscricaoId,
      });
    } catch (error) {
      const appError = handleError(error, "EtapaService.cancelarInscricao");
      throw new Error(appError.message);
    }
  }

  /**
   * Encerrar inscrições
   */
  async encerrarInscricoes(etapaId: string): Promise<Etapa> {
    try {
      const etapa = await apiClient.post<Etapa>(
        `${this.baseURL}/${etapaId}/encerrar-inscricoes`
      );

      logger.info("Inscrições encerradas", {
        etapaId,
        nome: etapa.nome,
        totalInscritos: etapa.totalInscritos,
      });

      return etapa;
    } catch (error) {
      const appError = handleError(error, "EtapaService.encerrarInscricoes");
      throw new Error(appError.message);
    }
  }

  /**
   * Reabrir inscrições
   */
  async reabrirInscricoes(etapaId: string): Promise<Etapa> {
    try {
      const etapa = await apiClient.post<Etapa>(
        `${this.baseURL}/${etapaId}/reabrir-inscricoes`
      );

      logger.info("Inscrições reabertas", {
        etapaId,
        nome: etapa.nome,
      });

      return etapa;
    } catch (error) {
      const appError = handleError(error, "EtapaService.reabrirInscricoes");
      throw new Error(appError.message);
    }
  }

  /**
   * Gerar chaves
   */
  async gerarChaves(etapaId: string): Promise<ResultadoGeracaoChaves> {
    try {
      const resultado = await apiClient.post<ResultadoGeracaoChaves>(
        `${this.baseURL}/${etapaId}/gerar-chaves`
      );

      logger.info("Chaves geradas", {
        etapaId,
        totalDuplas: resultado.duplas?.length || 0,
        totalGrupos: resultado.grupos?.length || 0,
        totalPartidas: resultado.partidas?.length || 0,
      });

      return resultado;
    } catch (error) {
      const appError = handleError(error, "EtapaService.gerarChaves");
      throw new Error(appError.message);
    }
  }

  /**
   * Obter estatísticas
   */
  async obterEstatisticas(): Promise<EstatisticasEtapa> {
    try {
      return await apiClient.get<EstatisticasEtapa>(`${this.baseURL}/stats`);
    } catch (error: any) {
      logger.warn("Erro ao obter estatísticas - retornando valores padrão", {
        erro: error.message,
      });

      // Se erro de autenticação, deixar o apiClient redirecionar
      if (
        error.message?.includes("Token") ||
        error.message?.includes("autenticação")
      ) {
        throw error;
      }

      // Para outros erros, retornar valores padrão
      return {
        totalEtapas: 0,
        inscricoesAbertas: 0,
        emAndamento: 0,
        finalizadas: 0,
        totalParticipacoes: 0,
      };
    }
  }

  /**
   * Encerrar etapa (marcar como finalizada)
   */
  async encerrarEtapa(id: string): Promise<void> {
    try {
      await apiClient.post(`${this.baseURL}/${id}/encerrar`);

      logger.info("Etapa encerrada", { etapaId: id });
    } catch (error) {
      const appError = handleError(error, "EtapaService.encerrarEtapa");
      throw new Error(appError.message);
    }
  }
}

export default new EtapaService();
