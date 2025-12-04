/**
 * IEtapaService.ts
 * Interface para operações de Etapas
 *
 * Aplica DIP (Dependency Inversion Principle)
 */

import {
  Etapa,
  CriarEtapaDTO,
  AtualizarEtapaDTO,
  InscreverJogadorDTO,
  Inscricao,
  FiltrosEtapa,
  ListagemEtapas,
  EstatisticasEtapa,
  ResultadoGeracaoChaves,
} from "@/types/etapa";

export interface IEtapaService {
  /**
   * CRUD Básico
   */
  criar(data: CriarEtapaDTO): Promise<Etapa>;
  listar(filtros?: FiltrosEtapa): Promise<ListagemEtapas>;
  buscarPorId(id: string): Promise<Etapa>;
  buscarPorSlug(slug: string): Promise<Etapa>;
  atualizar(id: string, data: AtualizarEtapaDTO): Promise<Etapa>;
  deletar(id: string): Promise<void>;

  /**
   * Operações de Inscrição
   */
  inscreverJogador(etapaId: string, data: InscreverJogadorDTO): Promise<Inscricao>;
  inscreverJogadores(etapaId: string, jogadorIds: string[]): Promise<Inscricao[]>;
  listarInscricoes(etapaId: string): Promise<Inscricao[]>;
  cancelarInscricao(etapaId: string, inscricaoId: string): Promise<void>;
  encerrarInscricoes(etapaId: string): Promise<Etapa>;
  reabrirInscricoes(etapaId: string): Promise<Etapa>;

  /**
   * Operações de Chaveamento
   */
  gerarChaves(etapaId: string): Promise<ResultadoGeracaoChaves>;

  /**
   * Estatísticas
   */
  obterEstatisticas(): Promise<EstatisticasEtapa>;

  /**
   * Operações de Status
   */
  encerrarEtapa(id: string): Promise<void>;
}
