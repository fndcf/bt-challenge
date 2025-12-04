/**
 * Interface do repository de CabecaDeChave
 */

import { IBaseRepository, IBatchOperations } from "./IBaseRepository";

/**
 * Estrutura de cabeça de chave
 */
export interface CabecaDeChave {
  id: string;
  etapaId: string;
  arenaId: string;
  jogadorId: string;
  jogadorNome: string;
  posicao: number; // 1, 2, 3, 4...
  criadoEm: FirebaseFirestore.Timestamp;
  atualizadoEm: FirebaseFirestore.Timestamp;
}

/**
 * DTO para criar cabeça de chave
 */
export interface CriarCabecaDeChaveDTO {
  etapaId: string;
  arenaId: string;
  jogadorId: string;
  jogadorNome: string;
  posicao: number;
}

/**
 * Interface do repository de CabecaDeChave
 */
export interface ICabecaDeChaveRepository
  extends Omit<
      IBaseRepository<
        CabecaDeChave,
        CriarCabecaDeChaveDTO,
        Partial<CabecaDeChave>
      >,
      "listar"
    >,
    IBatchOperations<CabecaDeChave> {
  /**
   * Buscar cabeças de chave de uma etapa
   */
  buscarPorEtapa(etapaId: string, arenaId: string): Promise<CabecaDeChave[]>;

  /**
   * Buscar cabeças de chave de uma etapa ordenadas por posição
   */
  buscarPorEtapaOrdenado(
    etapaId: string,
    arenaId: string
  ): Promise<CabecaDeChave[]>;

  /**
   * Buscar cabeça de chave de um jogador em uma etapa
   */
  buscarPorJogadorEEtapa(
    jogadorId: string,
    etapaId: string
  ): Promise<CabecaDeChave | null>;

  /**
   * Verificar se jogador é cabeça de chave na etapa
   */
  ehCabecaDeChave(jogadorId: string, etapaId: string): Promise<boolean>;

  /**
   * Atualizar posição
   */
  atualizarPosicao(id: string, posicao: number): Promise<void>;

  /**
   * Contar cabeças de chave de uma etapa
   */
  contar(etapaId: string, arenaId: string): Promise<number>;

  /**
   * Deletar todas as cabeças de chave de uma etapa
   */
  deletarPorEtapa(etapaId: string, arenaId: string): Promise<number>;

  /**
   * Remover jogador como cabeça de chave
   */
  removerPorJogador(jogadorId: string, etapaId: string): Promise<void>;

  /**
   * Criar em lote
   */
  criarEmLote(cabecas: CriarCabecaDeChaveDTO[]): Promise<CabecaDeChave[]>;
}
