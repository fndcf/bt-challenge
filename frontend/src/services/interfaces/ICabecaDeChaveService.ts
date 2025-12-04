/**
 * ICabecaDeChaveService.ts
 * Interface para serviço de gerenciamento de cabeças de chave
 *
 * Aplica DIP (Dependency Inversion Principle)
 * Permite injeção de dependências e facilita testes unitários
 */

import { CabecaDeChave, CriarCabecaDeChaveDTO } from "@/types/cabecaDeChave";

export interface ICabecaDeChaveService {
  /**
   * Criar cabeça de chave
   * @param dto - Dados da cabeça de chave (etapaId, jogadorId, jogadorNome, ordem)
   * @returns Promise com a cabeça de chave criada
   */
  criar(dto: CriarCabecaDeChaveDTO): Promise<CabecaDeChave>;

  /**
   * Listar cabeças de chave ativas de uma etapa
   * @param arenaId - ID da arena
   * @param etapaId - ID da etapa
   * @returns Promise com lista de cabeças de chave
   */
  listarAtivas(arenaId: string, etapaId: string): Promise<CabecaDeChave[]>;

  /**
   * Verificar se jogador é cabeça de chave em uma etapa
   * @param arenaId - ID da arena
   * @param etapaId - ID da etapa
   * @param jogadorId - ID do jogador
   * @returns Promise com boolean indicando se é cabeça de chave
   */
  ehCabecaDeChave(
    arenaId: string,
    etapaId: string,
    jogadorId: string
  ): Promise<boolean>;

  /**
   * Remover cabeça de chave de uma etapa
   * @param arenaId - ID da arena
   * @param etapaId - ID da etapa
   * @param jogadorId - ID do jogador
   * @returns Promise void
   */
  remover(arenaId: string, etapaId: string, jogadorId: string): Promise<void>;

  /**
   * Reordenar cabeças de chave de uma etapa
   * @param arenaId - ID da arena
   * @param etapaId - ID da etapa
   * @param ordens - Array com jogadorId e nova ordem
   * @returns Promise void
   */
  reordenar(
    arenaId: string,
    etapaId: string,
    ordens: { jogadorId: string; ordem: number }[]
  ): Promise<void>;
}
