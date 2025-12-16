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
  criar(dto: CriarEquipeDTO): Promise<Equipe>;
  criarEmLote(dtos: CriarEquipeDTO[]): Promise<Equipe[]>;
  buscarPorId(id: string): Promise<Equipe | null>;
  buscarPorEtapa(etapaId: string, arenaId: string): Promise<Equipe[]>;
  atualizar(id: string, dados: Partial<Equipe>): Promise<void>;
  deletar(id: string): Promise<void>;
  deletarPorEtapa(etapaId: string, arenaId: string): Promise<void>;

  // Estatísticas
  atualizarEstatisticas(
    id: string,
    estatisticas: AtualizarEstatisticasEquipeDTO
  ): Promise<void>;
  incrementarEstatisticas(
    id: string,
    incrementos: Partial<AtualizarEstatisticasEquipeDTO>
  ): Promise<void>;
  incrementarEstatisticasEmLote(
    atualizacoes: Array<{
      id: string;
      incrementos: Partial<AtualizarEstatisticasEquipeDTO>;
    }>
  ): Promise<void>;

  // Busca por IDs
  buscarPorIds(ids: string[]): Promise<Equipe[]>;

  // Atualização em lote
  atualizarEmLote(
    atualizacoes: Array<{ id: string; dados: Partial<Equipe> }>
  ): Promise<void>;

  // Classificação
  atualizarPosicao(id: string, posicao: number): Promise<void>;
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
