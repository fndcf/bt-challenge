/**
 * Interface do repository de Etapa
 */

import {
  Etapa,
  CriarEtapaDTO,
  AtualizarEtapaDTO,
  FiltrosEtapa,
  ListagemEtapas,
  StatusEtapa,
  EstatisticasEtapa,
  EmpatePendente,
  DesempateDefinido,
} from "../../models/Etapa";
import { IBaseRepository } from "./IBaseRepository";

/**
 * Interface do repository de Etapa
 */
export interface IEtapaRepository
  extends IBaseRepository<
    Etapa,
    CriarEtapaDTO & { arenaId: string; criadoPor: string },
    AtualizarEtapaDTO
  > {
  /**
   * Buscar etapa por ID com validação de arena
   */
  buscarPorIdEArena(id: string, arenaId: string): Promise<Etapa | null>;

  /**
   * Listar etapas com filtros e paginação
   */
  listar(filtros: FiltrosEtapa): Promise<ListagemEtapas>;

  /**
   * Buscar etapas por status
   */
  buscarPorStatus(arenaId: string, status: StatusEtapa): Promise<Etapa[]>;

  /**
   * Ids das etapas que contam pontos no ranking. Etapa antiga, sem o campo,
   * conta.
   */
  buscarIdsQueContamPontos(arenaId: string): Promise<Set<string>>;

  /**
   * Buscar etapas ativas (não finalizadas)
   */
  buscarAtivas(arenaId: string): Promise<Etapa[]>;

  /**
   * Atualizar status da etapa
   */
  atualizarStatus(id: string, status: StatusEtapa): Promise<Etapa>;

  /**
   * Marcar chaves como geradas, ou desfazer (volta para inscrições encerradas)
   */
  marcarChavesGeradas(id: string, geradas: boolean): Promise<void>;

  /**
   * Incrementar total de inscritos
   */
  incrementarInscritos(id: string, jogadorId: string): Promise<void>;

  /**
   * Decrementar inscritos em lote (funciona para 1 ou mais)
   */
  decrementarInscritosEmLote(
    id: string,
    quantidade: number,
    jogadorIds: string[]
  ): Promise<void>;

  /**
   * Trocar a lista de inscritos
   *
   * @param totalInscritos - Só quando o total também muda
   */
  definirInscritos(
    id: string,
    jogadorIds: string[],
    totalInscritos?: number
  ): Promise<void>;

  /**
   * Gravar os empates pendentes de um grupo (lista vazia apaga)
   */
  salvarEmpatesPendentes(
    id: string,
    grupoId: string,
    empates: EmpatePendente[]
  ): Promise<void>;

  /**
   * Gravar as decisões de desempate de um grupo e o que ainda falta decidir
   */
  salvarDesempates(
    id: string,
    grupoId: string,
    desempates: DesempateDefinido[],
    pendentes: EmpatePendente[]
  ): Promise<void>;

  /**
   * Apagar todos os empates e desempates da etapa
   */
  limparDesempates(id: string): Promise<void>;

  /**
   * Apagar os empates de alguns grupos
   *
   * @param incluirDesempates - true também apaga as decisões já tomadas
   */
  limparEmpatesDosGrupos(
    id: string,
    grupoIds: string[],
    incluirDesempates?: boolean
  ): Promise<void>;

  /**
   * Definir campeão da etapa
   */
  definirCampeao(
    id: string,
    campeaoId: string,
    campeaoNome: string
  ): Promise<void>;

  /**
   * Obter estatísticas das etapas de uma arena
   */
  obterEstatisticas(arenaId: string): Promise<EstatisticasEtapa>;

  /**
   * Contar etapas de uma arena
   */
  contar(arenaId: string): Promise<number>;

  /**
   * Verificar se jogador está inscrito
   */
  jogadorInscrito(id: string, jogadorId: string): Promise<boolean>;
}
