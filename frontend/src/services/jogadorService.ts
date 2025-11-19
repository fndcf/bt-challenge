/**
 * Jogador Service (PADRONIZADO)
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

/**
 * Service para comunicação com API de Jogadores
 */
class JogadorService {
  private readonly basePath = "/jogadores";

  /**
   * Criar jogador
   */
  async criar(data: CriarJogadorDTO): Promise<Jogador> {
    try {
      console.log("📝 Criando jogador...");
      const jogador = await apiClient.post<Jogador>(this.basePath, data);
      console.log("✅ Jogador criado:", jogador.id);
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
      console.log(
        `✅ Jogadores listados: ${response.jogadores.length} de ${response.total}`
      );
      return response;
    } catch (error) {
      const appError = handleError(error, "JogadorService.listar");
      console.warn("⚠️ Erro ao listar jogadores, retornando lista vazia");

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
      console.log(`🔍 Buscando jogador ${id}...`);
      const jogador = await apiClient.get<Jogador>(`${this.basePath}/${id}`);
      console.log("✅ Jogador encontrado:", jogador.nome);
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
      console.log(`✏️ Atualizando jogador ${id}...`);
      const jogador = await apiClient.put<Jogador>(
        `${this.basePath}/${id}`,
        data
      );
      console.log("✅ Jogador atualizado:", jogador.nome);
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
      console.log(`🗑️ Deletando jogador ${id}...`);
      await apiClient.delete(`${this.basePath}/${id}`);
      console.log("✅ Jogador deletado");
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
      console.log(`📊 Total de jogadores: ${response.total}`);
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
      console.log("📊 Jogadores por nível:", response);
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
      console.log(`🔍 Buscando jogadores disponíveis para etapa ${etapaId}...`);
      const jogadores = await apiClient.get<Jogador[]>(
        `${this.basePath}/disponiveis/${etapaId}`
      );
      console.log(`✅ ${jogadores.length} jogadores disponíveis`);
      return jogadores;
    } catch (error) {
      handleError(error, "JogadorService.buscarDisponiveis");
      return [];
    }
  }
}

// Exportar instância única
export default new JogadorService();
