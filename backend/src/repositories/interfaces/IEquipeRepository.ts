import {
  Equipe,
  CriarEquipeDTO,
  AtualizarEstatisticasEquipeDTO,
} from "../../models/Teams";

/**
 * Interface do repositório de Equipes
 */
export interface IEquipeRepository {
  // CRUD básico
  /**
   * Criar equipes em lote (funciona para 1 ou mais)
   */
  criarEmLote(dtos: CriarEquipeDTO[]): Promise<Equipe[]>;
  buscarPorId(id: string): Promise<Equipe | null>;
  buscarPorEtapa(etapaId: string, arenaId: string): Promise<Equipe[]>;
  deletar(id: string): Promise<void>;
  deletarPorEtapa(etapaId: string, arenaId: string): Promise<void>;

  // Estatísticas
  atualizarEstatisticas(
    id: string,
    estatisticas: AtualizarEstatisticasEquipeDTO
  ): Promise<void>;
  incrementarEstatisticasEmLote(
    atualizacoes: Array<{
      id: string;
      incrementos: Partial<AtualizarEstatisticasEquipeDTO>;
    }>
  ): Promise<void>;

  // Busca por IDs
  buscarPorIds(ids: string[]): Promise<Equipe[]>;

  /**
   * Atualizar equipes em lote (funciona para 1 ou mais)
   */
  atualizarEmLote(
    atualizacoes: Array<{ id: string; dados: Partial<Equipe> }>
  ): Promise<void>;

  // Classificação
  atualizarPosicoesEmLote(
    atualizacoes: Array<{ id: string; posicao: number }>
  ): Promise<void>;
  marcarClassificada(id: string, classificada: boolean): Promise<void>;
  buscarClassificadas(etapaId: string, arenaId: string): Promise<Equipe[]>;

  // Ordenação
  buscarPorEtapaOrdenadas(
    etapaId: string,
    arenaId: string
  ): Promise<Equipe[]>;

  // Buscar equipes ordenadas por classificação (pontos, saldo jogos, saldo games)
  buscarPorClassificacao(
    etapaId: string,
    arenaId: string
  ): Promise<Equipe[]>;
}
