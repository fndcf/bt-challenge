/**
 * Interface para operações de Etapas
 */

import {
  Etapa,
  CriarEtapaDTO,
  AtualizarEtapaDTO,
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
  inscreverJogadores(
    etapaId: string,
    jogadorIds: string[]
  ): Promise<Inscricao[]>;
  listarInscricoes(etapaId: string): Promise<Inscricao[]>;
  cancelarInscricoesEmLote(
    etapaId: string,
    inscricaoIds: string[]
  ): Promise<{ canceladas: number; erros: string[] }>;
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
