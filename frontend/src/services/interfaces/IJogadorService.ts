/**
 * IJogadorService.ts
 * Interface para serviço de gerenciamento de jogadores
 *
 * Aplica DIP (Dependency Inversion Principle)
 * Permite injeção de dependências e facilita testes unitários
 */

import {
  Jogador,
  CriarJogadorDTO,
  AtualizarJogadorDTO,
  FiltrosJogador,
  ListagemJogadores,
} from "@/types/jogador";

export interface IJogadorService {
  /**
   * Criar novo jogador
   * @param data - Dados do jogador a ser criado
   * @returns Promise com o jogador criado
   */
  criar(data: CriarJogadorDTO): Promise<Jogador>;

  /**
   * Listar jogadores com filtros opcionais
   * @param filtros - Filtros de busca (nivel, status, genero, busca, ordenação, paginação)
   * @returns Promise com lista paginada de jogadores
   */
  listar(filtros?: FiltrosJogador): Promise<ListagemJogadores>;

  /**
   * Buscar jogador por ID
   * @param id - ID do jogador
   * @returns Promise com o jogador encontrado
   */
  buscarPorId(id: string): Promise<Jogador>;

  /**
   * Atualizar dados de um jogador
   * @param id - ID do jogador
   * @param data - Dados a serem atualizados
   * @returns Promise com o jogador atualizado
   */
  atualizar(id: string, data: AtualizarJogadorDTO): Promise<Jogador>;

  /**
   * Deletar jogador
   * @param id - ID do jogador a ser deletado
   * @returns Promise void
   */
  deletar(id: string): Promise<void>;

  /**
   * Contar total de jogadores
   * @returns Promise com o número total de jogadores
   */
  contarTotal(): Promise<number>;

  /**
   * Contar jogadores por nível (A, B, C, etc)
   * @returns Promise com objeto contendo contagem por nível
   */
  contarPorNivel(): Promise<Record<string, number>>;

  /**
   * Buscar jogadores disponíveis para inscrição em uma etapa
   * @param etapaId - ID da etapa
   * @returns Promise com lista de jogadores disponíveis
   */
  buscarDisponiveis(etapaId: string): Promise<Jogador[]>;
}
