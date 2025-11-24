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

/**
 * Service para gerenciar etapas
 */
class EtapaService {
  private baseURL = "/etapas";

  /**
   * Criar nova etapa
   */
  async criar(data: CriarEtapaDTO): Promise<Etapa> {
    try {
      return await apiClient.post<Etapa>(this.baseURL, data);
    } catch (error) {
      const appError = handleError(error, "EtapaService.listar");
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
      if (filtros?.formato) params.append("formato", filtros.formato); // ✅ NOVO
      if (filtros?.ordenarPor) params.append("ordenarPor", filtros.ordenarPor);
      if (filtros?.ordem) params.append("ordem", filtros.ordem);
      if (filtros?.limite) params.append("limite", filtros.limite.toString());
      if (filtros?.offset) params.append("offset", filtros.offset.toString());

      const queryString = params.toString();
      const url = queryString ? `${this.baseURL}?${queryString}` : this.baseURL;

      return await apiClient.get<ListagemEtapas>(url);
    } catch (error: any) {
      console.error("Erro ao listar etapas:", error);
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
      const appError = handleError(error, "EtapaService.listar");
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
      const appError = handleError(error, "EtapaService.listar");
      throw new Error(appError.message);
    }
  }

  /**
   * Atualizar etapa
   */
  async atualizar(id: string, data: AtualizarEtapaDTO): Promise<Etapa> {
    try {
      console.log(`✏️ Atualizando etapa ${id}...`);
      return await apiClient.put<Etapa>(`${this.baseURL}/${id}`, data);
    } catch (error) {
      const appError = handleError(error, "EtapaService.listar");
      throw new Error(appError.message);
    }
  }

  /**
   * Deletar etapa
   */
  async deletar(id: string): Promise<void> {
    try {
      console.log(`🗑️ Deletando etapa ${id}...`);
      await apiClient.delete(`${this.baseURL}/${id}`);
      console.log(`✅ Etapa ${id} deletada`);
    } catch (error) {
      const appError = handleError(error, "EtapaService.listar");
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
      return await apiClient.post<Inscricao>(
        `${this.baseURL}/${etapaId}/inscrever`,
        data
      );
    } catch (error) {
      const appError = handleError(error, "EtapaService.listar");
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
      const appError = handleError(error, "EtapaService.listar");
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
      console.error("Erro ao listar inscrições:", error);
      return [];
    }
  }

  /**
   * Cancelar inscrição
   */
  async cancelarInscricao(etapaId: string, inscricaoId: string): Promise<void> {
    try {
      console.log(`📡 DELETE /api/etapas/${etapaId}/inscricoes/${inscricaoId}`);
      await apiClient.delete(
        `${this.baseURL}/${etapaId}/inscricoes/${inscricaoId}`
      );
      console.log("✅ DELETE retornou sucesso");
    } catch (error) {
      const appError = handleError(error, "EtapaService.listar");
      throw new Error(appError.message);
    }
  }

  /**
   * Encerrar inscrições
   */
  async encerrarInscricoes(etapaId: string): Promise<Etapa> {
    try {
      return await apiClient.post<Etapa>(
        `${this.baseURL}/${etapaId}/encerrar-inscricoes`
      );
    } catch (error) {
      const appError = handleError(error, "EtapaService.listar");
      throw new Error(appError.message);
    }
  }

  /**
   * Reabrir inscrições
   */
  async reabrirInscricoes(etapaId: string): Promise<Etapa> {
    try {
      return await apiClient.post<Etapa>(
        `${this.baseURL}/${etapaId}/reabrir-inscricoes`
      );
    } catch (error) {
      const appError = handleError(error, "EtapaService.listar");
      throw new Error(appError.message);
    }
  }

  /**
   * Gerar chaves
   */
  async gerarChaves(etapaId: string): Promise<ResultadoGeracaoChaves> {
    try {
      return await apiClient.post<ResultadoGeracaoChaves>(
        `${this.baseURL}/${etapaId}/gerar-chaves`
      );
    } catch (error) {
      const appError = handleError(error, "EtapaService.listar");
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
      console.error("Erro ao obter estatísticas:", error);
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
      console.log(`🏁 Encerrando etapa ${id}...`);
      await apiClient.post(`${this.baseURL}/${id}/encerrar`);
      console.log("✅ Etapa encerrada com sucesso! 🏆");
    } catch (error) {
      const appError = handleError(error, "EtapaService.listar");
      throw new Error(appError.message);
    }
  }
}

export default new EtapaService();
