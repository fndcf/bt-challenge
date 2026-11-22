/**
 * Interface do repository de Histórico de Duplas
 */

import { HistoricoDupla } from "../../models/HistoricoDupla";

export interface IHistoricoDuplaRepository {
  criarEmLote(
    itens: Omit<HistoricoDupla, "id" | "criadoEm">[]
  ): Promise<HistoricoDupla[]>;

  /**
   * Deletar todos os registros da etapa
   * @returns Quantidade deletada
   */
  deletarPorEtapa(etapaId: string, arenaId: string): Promise<number>;
}
