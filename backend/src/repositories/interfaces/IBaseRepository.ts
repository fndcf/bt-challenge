/**
 * IBaseRepository.ts
 * Interface base genérica para todos os repositories
 *
 * Define operações CRUD comuns que todos os repositories devem implementar.
 * Repositories específicos estendem esta interface com métodos adicionais.
 */

/**
 * Interface base para repositories
 * @template T - Tipo da entidade
 * @template CreateDTO - DTO para criação (opcional, default = Partial<T>)
 * @template UpdateDTO - DTO para atualização (opcional, default = Partial<T>)
 */
export interface IBaseRepository<
  T,
  CreateDTO = Partial<T>,
  UpdateDTO = Partial<T>
> {
  /**
   * Criar nova entidade
   * @param data - Dados para criação
   * @returns Entidade criada com ID
   */
  criar(data: CreateDTO): Promise<T>;

  /**
   * Buscar entidade por ID
   * @param id - ID da entidade
   * @returns Entidade ou null se não encontrada
   */
  buscarPorId(id: string): Promise<T | null>;

  /**
   * Atualizar entidade
   * @param id - ID da entidade
   * @param data - Dados para atualização
   * @returns Entidade atualizada
   */
  atualizar(id: string, data: UpdateDTO): Promise<T>;

  /**
   * Deletar entidade
   * @param id - ID da entidade
   */
  deletar(id: string): Promise<void>;

  /**
   * Verificar se entidade existe
   * @param id - ID da entidade
   * @returns true se existe
   */
  existe(id: string): Promise<boolean>;
}

/**
 * Interface para repositories com escopo de Arena
 * A maioria das entidades pertence a uma arena específica
 */
export interface IArenaScoped {
  /**
   * Arena ID para escopo das operações
   */
  arenaId: string;
}

/**
 * Interface para paginação
 */
export interface PaginacaoParams {
  limite?: number;
  offset?: number;
  ordenarPor?: string;
  ordem?: "asc" | "desc";
}

/**
 * Interface para resultado paginado
 */
export interface ResultadoPaginado<T> {
  dados: T[];
  total: number;
  limite: number;
  offset: number;
  temMais: boolean;
}

/**
 * Interface para operações em lote (batch)
 */
export interface IBatchOperations<T> {
  /**
   * Criar múltiplas entidades em uma transação
   */
  criarEmLote(items: Partial<T>[]): Promise<T[]>;

  /**
   * Deletar múltiplas entidades em uma transação
   */
  deletarEmLote(ids: string[]): Promise<void>;

  /**
   * Atualizar múltiplas entidades em uma transação
   */
  atualizarEmLote(updates: Array<{ id: string; data: Partial<T> }>): Promise<void>;
}
