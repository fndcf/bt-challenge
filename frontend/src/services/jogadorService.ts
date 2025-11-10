import axios from "axios";
import {
  Jogador,
  CriarJogadorDTO,
  AtualizarJogadorDTO,
  FiltrosJogador,
  ListagemJogadores,
} from "../types/jogador";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Service para comunicação com API de Jogadores
 */
class JogadorService {
  private getAuthHeader() {
    const token = localStorage.getItem("authToken");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  /**
   * Criar jogador
   */
  async criar(data: CriarJogadorDTO): Promise<Jogador> {
    try {
      const response = await axios.post(
        `${API_URL}/jogadores`,
        data,
        this.getAuthHeader()
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Erro ao criar jogador:", error);
      throw new Error(error.response?.data?.error || "Erro ao criar jogador");
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

      // Cache-busting: adiciona timestamp para evitar cache
      params.append("_t", Date.now().toString());

      const response = await axios.get(
        `${API_URL}/jogadores?${params.toString()}`,
        {
          ...this.getAuthHeader(),
          headers: {
            ...this.getAuthHeader().headers,
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        }
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Erro ao listar jogadores:", error);
      throw new Error(
        error.response?.data?.error || "Erro ao listar jogadores"
      );
    }
  }

  /**
   * Buscar jogador por ID
   */
  async buscarPorId(id: string): Promise<Jogador> {
    try {
      const response = await axios.get(
        `${API_URL}/jogadores/${id}`,
        this.getAuthHeader()
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Erro ao buscar jogador:", error);
      throw new Error(error.response?.data?.error || "Erro ao buscar jogador");
    }
  }

  /**
   * Atualizar jogador
   */
  async atualizar(id: string, data: AtualizarJogadorDTO): Promise<Jogador> {
    try {
      const response = await axios.put(
        `${API_URL}/jogadores/${id}`,
        data,
        this.getAuthHeader()
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Erro ao atualizar jogador:", error);
      throw new Error(
        error.response?.data?.error || "Erro ao atualizar jogador"
      );
    }
  }

  /**
   * Deletar jogador
   */
  async deletar(id: string): Promise<void> {
    try {
      await axios.delete(`${API_URL}/jogadores/${id}`, this.getAuthHeader());
    } catch (error: any) {
      console.error("Erro ao deletar jogador:", error);
      throw new Error(error.response?.data?.error || "Erro ao deletar jogador");
    }
  }

  /**
   * Contar total de jogadores
   */
  async contarTotal(): Promise<number> {
    try {
      const response = await axios.get(
        `${API_URL}/jogadores/stats/total`,
        this.getAuthHeader()
      );
      return response.data.data.total;
    } catch (error: any) {
      console.error("Erro ao contar jogadores:", error);
      return 0;
    }
  }

  /**
   * Contar jogadores por nível
   */
  async contarPorNivel(): Promise<Record<string, number>> {
    try {
      const response = await axios.get(
        `${API_URL}/jogadores/stats/por-nivel`,
        this.getAuthHeader()
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Erro ao contar por nível:", error);
      return {};
    }
  }
}

export default new JogadorService();
