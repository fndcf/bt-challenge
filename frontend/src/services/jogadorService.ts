/**
 * Jogador Service (COM LOGGER)
 * Service para gerenciar jogadores usando apiClient
 */

import { apiClient } from "./apiClient";
import {
  Jogador,
  CriarJogadorDTO,
  AtualizarJogadorDTO,
  FiltrosJogador,
  ListagemJogadores,
} from "../types/jogador";
import { handleError } from "../utils/errorHandler";
import logger from "../utils/logger"; // ← IMPORTAR LOGGER
import { IJogadorService } from "./interfaces/IJogadorService";

/**
 * Service para comunicação com API de Jogadores
 */
class JogadorService implements IJogadorService {
  private readonly basePath = "/jogadores";

  /**
   * Criar jogador
   */
  async criar(data: CriarJogadorDTO): Promise<Jogador> {
    try {
      const jogador = await apiClient.post<Jogador>(this.basePath, data);

      logger.info("Jogador criado", {
        jogadorId: jogador.id,
        nome: jogador.nome,
        nivel: jogador.nivel,
        genero: jogador.genero,
      });

      return jogador;
    } catch (error) {
      const appError = handleError(error, "JogadorService.criar");
      throw new Error(appError.message);
    }
  }

  /**
   * Listar jogadores com filtros
   */
  async listar(filtros?: FiltrosJogador): Promise<ListagemJogadores> {
    try {
      const params = new URLSearchParams();

      if (filtros?.nivel) params.append("nivel", filtros.nivel);
      if (filtros?.status) params.append("status", filtros.status);
      if (filtros?.genero) params.append("genero", filtros.genero);
      if (filtros?.busca) params.append("busca", filtros.busca);
      if (filtros?.ordenarPor) params.append("ordenarPor", filtros.ordenarPor);
      if (filtros?.ordem) params.append("ordem", filtros.ordem);
      if (filtros?.limite) params.append("limite", filtros.limite.toString());
      if (filtros?.offset) params.append("offset", filtros.offset.toString());

      const queryString = params.toString();
      const url = queryString
        ? `${this.basePath}?${queryString}`
        : this.basePath;

      const response = await apiClient.get<ListagemJogadores>(url);
      return response;
    } catch (error) {
      const appError = handleError(error, "JogadorService.listar");

      logger.warn("Erro ao listar jogadores - retornando lista vazia", {
        erro: appError.message,
        status: appError.status,
      });

      // Retornar lista vazia em caso de erro (exceto erro de auth)
      if (appError.status === 401) {
        throw new Error(appError.message);
      }

      return {
        jogadores: [],
        total: 0,
        limite: filtros?.limite || 20,
        offset: filtros?.offset || 0,
        temMais: false,
      };
    }
  }

  /**
   * Buscar jogador por ID
   */
  async buscarPorId(id: string): Promise<Jogador> {
    try {
      const jogador = await apiClient.get<Jogador>(`${this.basePath}/${id}`);
      return jogador;
    } catch (error) {
      const appError = handleError(error, "JogadorService.buscarPorId");
      throw new Error(appError.message);
    }
  }

  /**
   * Atualizar jogador
   */
  async atualizar(id: string, data: AtualizarJogadorDTO): Promise<Jogador> {
    try {
      const jogador = await apiClient.put<Jogador>(
        `${this.basePath}/${id}`,
        data
      );

      logger.info("Jogador atualizado", {
        jogadorId: jogador.id,
        nome: jogador.nome,
        camposAtualizados: Object.keys(data),
      });

      return jogador;
    } catch (error) {
      const appError = handleError(error, "JogadorService.atualizar");
      throw new Error(appError.message);
    }
  }

  /**
   * Deletar jogador
   */
  async deletar(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.basePath}/${id}`);

      logger.info("Jogador deletado", { jogadorId: id });
    } catch (error) {
      const appError = handleError(error, "JogadorService.deletar");
      throw new Error(appError.message);
    }
  }

  /**
   * Contar total de jogadores
   */
  async contarTotal(): Promise<number> {
    try {
      const response = await apiClient.get<{ total: number }>(
        `${this.basePath}/stats/total`
      );
      return response.total;
    } catch (error) {
      handleError(error, "JogadorService.contarTotal");
      return 0;
    }
  }

  /**
   * Contar jogadores por nível
   */
  async contarPorNivel(): Promise<Record<string, number>> {
    try {
      const response = await apiClient.get<Record<string, number>>(
        `${this.basePath}/stats/por-nivel`
      );
      return response;
    } catch (error) {
      handleError(error, "JogadorService.contarPorNivel");
      return {};
    }
  }

  /**
   * Buscar jogadores disponíveis para inscrição em etapa
   */
  async buscarDisponiveis(etapaId: string): Promise<Jogador[]> {
    try {
      const jogadores = await apiClient.get<Jogador[]>(
        `${this.basePath}/disponiveis/${etapaId}`
      );
      return jogadores;
    } catch (error) {
      handleError(error, "JogadorService.buscarDisponiveis");
      return [];
    }
  }
}

// Exportar instância única
export default new JogadorService();
