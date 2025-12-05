/**
 * Interface para serviço de gerenciamento de chaves do formato DUPLA FIXA
 */

import {
  Dupla,
  Grupo,
  Partida,
  ResultadoGeracaoChaves,
  ConfrontoEliminatorio,
  TipoFase,
  SetPartida,
} from "@/types/chave";

export interface IChaveService {
  /**
   * Gerar chaves de uma etapa no formato Dupla Fixa
   * @param etapaId - ID da etapa
   * @returns Promise com resultado da geração (duplas, grupos, partidas)
   */
  gerarChaves(etapaId: string): Promise<ResultadoGeracaoChaves>;

  /**
   * Excluir todas as chaves de uma etapa (duplas, grupos, partidas)
   * @param etapaId - ID da etapa
   * @returns Promise void
   */
  excluirChaves(etapaId: string): Promise<void>;

  /**
   * Buscar duplas de uma etapa
   * @param etapaId - ID da etapa
   * @returns Promise com lista de duplas
   */
  buscarDuplas(etapaId: string): Promise<Dupla[]>;

  /**
   * Buscar duplas de um grupo específico
   * @param etapaId - ID da etapa
   * @param grupoId - ID do grupo
   * @returns Promise com lista de duplas do grupo
   */
  buscarDuplasDoGrupo(etapaId: string, grupoId: string): Promise<Dupla[]>;

  /**
   * Buscar grupos de uma etapa
   * @param etapaId - ID da etapa
   * @returns Promise com lista de grupos
   */
  buscarGrupos(etapaId: string): Promise<Grupo[]>;

  /**
   * Buscar partidas de uma etapa
   * @param etapaId - ID da etapa
   * @returns Promise com lista de partidas
   */
  buscarPartidas(etapaId: string): Promise<Partida[]>;

  /**
   * Registrar resultado de partida da fase de grupos
   * Formato: Múltiplos sets (melhor de 3 ou 5)
   * @param partidaId - ID da partida
   * @param placar - Array de sets com games de cada dupla
   * @returns Promise void
   */
  registrarResultadoPartida(
    partidaId: string,
    placar: SetPartida[]
  ): Promise<void>;

  /**
   * Gerar fase eliminatória
   * @param etapaId - ID da etapa
   * @param classificadosPorGrupo - Número de duplas que classificam por grupo (padrão: 2)
   * @returns Promise void
   */
  gerarFaseEliminatoria(
    etapaId: string,
    classificadosPorGrupo?: number
  ): Promise<void>;

  /**
   * Buscar confrontos eliminatórios
   * @param etapaId - ID da etapa
   * @param fase - Filtro opcional por fase (oitavas, quartas, semi, final)
   * @returns Promise com lista de confrontos eliminatórios
   */
  buscarConfrontosEliminatorios(
    etapaId: string,
    fase?: TipoFase
  ): Promise<ConfrontoEliminatorio[]>;

  /**
   * Registrar resultado de confronto eliminatório
   * @param confrontoId - ID do confronto
   * @param placar - Array de sets com games de cada dupla
   * @returns Promise void
   */
  registrarResultadoEliminatorio(
    confrontoId: string,
    placar: { numero: number; gamesDupla1: number; gamesDupla2: number }[]
  ): Promise<void>;

  /**
   * Cancelar/Excluir fase eliminatória
   * @param etapaId - ID da etapa
   * @returns Promise void
   */
  cancelarFaseEliminatoria(etapaId: string): Promise<void>;
}
