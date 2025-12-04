/**
 * Interface do repository de Inscricao
 */

import { Inscricao, StatusInscricao } from "../../models/Inscricao";
import { IBaseRepository, IBatchOperations } from "./IBaseRepository";

/**
 * DTO para criar inscrição
 */
export interface CriarInscricaoDTO {
  etapaId: string;
  arenaId: string;
  jogadorId: string;
  jogadorNome: string;
  jogadorNivel: string;
  jogadorGenero: string;
  status?: StatusInscricao;
}

/**
 * Interface do repository de Inscricao
 */
export interface IInscricaoRepository
  extends IBaseRepository<Inscricao, CriarInscricaoDTO, Partial<Inscricao>>,
    IBatchOperations<Inscricao> {
  /**
   * Buscar inscrição por ID com validação de arena
   */
  buscarPorIdEArena(id: string, arenaId: string): Promise<Inscricao | null>;

  /**
   * Buscar inscrição por ID, etapa e arena
   */
  buscarPorIdEtapaArena(
    id: string,
    etapaId: string,
    arenaId: string
  ): Promise<Inscricao | null>;

  /**
   * Buscar inscrições de uma etapa
   */
  buscarPorEtapa(etapaId: string, arenaId: string): Promise<Inscricao[]>;

  /**
   * Buscar inscrições confirmadas de uma etapa
   */
  buscarConfirmadas(etapaId: string, arenaId: string): Promise<Inscricao[]>;

  /**
   * Buscar inscrição de um jogador em uma etapa
   */
  buscarPorJogadorEEtapa(
    etapaId: string,
    jogadorId: string
  ): Promise<Inscricao | null>;

  /**
   * Buscar inscrições de um jogador
   */
  buscarPorJogador(arenaId: string, jogadorId: string): Promise<Inscricao[]>;

  /**
   * Buscar inscrições ativas de um jogador (confirmadas)
   */
  buscarAtivasPorJogador(
    arenaId: string,
    jogadorId: string
  ): Promise<Inscricao[]>;

  /**
   * Verificar se jogador está inscrito em uma etapa
   */
  jogadorInscrito(etapaId: string, jogadorId: string): Promise<boolean>;

  /**
   * Atualizar status da inscrição
   */
  atualizarStatus(id: string, status: StatusInscricao): Promise<void>;

  /**
   * Cancelar inscrição
   */
  cancelar(id: string): Promise<void>;

  /**
   * Atribuir dupla à inscrição
   */
  atribuirDupla(
    id: string,
    duplaId: string,
    parceiroId: string,
    parceiroNome: string
  ): Promise<void>;

  /**
   * Atribuir grupo à inscrição
   */
  atribuirGrupo(id: string, grupoId: string, grupoNome: string): Promise<void>;

  /**
   * Limpar atribuição de dupla/grupo
   */
  limparAtribuicoes(id: string): Promise<void>;

  /**
   * Deletar todas as inscrições de uma etapa
   */
  deletarPorEtapa(etapaId: string, arenaId: string): Promise<number>;

  /**
   * Contar inscrições de uma etapa
   */
  contar(etapaId: string, arenaId: string): Promise<number>;

  /**
   * Contar inscrições confirmadas de uma etapa
   */
  contarConfirmadas(etapaId: string, arenaId: string): Promise<number>;
}
