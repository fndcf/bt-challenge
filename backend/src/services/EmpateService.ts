/**
 * Service para os empates que o organizador precisa decidir
 */

import { EmpatePendente, Etapa, ModoDesempate } from "../models/Etapa";
import { listarEmpatesPendentes } from "../utils/desempate";
import { NotFoundError } from "../utils/errors";
import desempateService from "./DesempateService";
import etapaService from "./EtapaService";
import { getFormato } from "./formatos";

class EmpateService {
  private async buscarEtapa(id: string, arenaId: string): Promise<Etapa> {
    const etapa = await etapaService.buscarPorId(id, arenaId);

    if (!etapa) throw new NotFoundError("Etapa não encontrada");

    return etapa;
  }

  /**
   * Empates em grupo encerrado, sem decisão
   */
  async listarPendentes(
    etapaId: string,
    arenaId: string
  ): Promise<EmpatePendente[]> {
    return listarEmpatesPendentes(await this.buscarEtapa(etapaId, arenaId));
  }

  /**
   * Gravar a decisão e reaplicar a classificação com ela
   */
  async resolver(
    etapaId: string,
    arenaId: string,
    grupoId: string,
    ids: string[],
    modo: ModoDesempate
  ) {
    const etapa = await this.buscarEtapa(etapaId, arenaId);
    const resultado = await desempateService.definirDesempate(
      etapaId,
      grupoId,
      ids,
      modo
    );

    await getFormato(etapa.formato).reaplicarClassificacao(etapa, grupoId);

    return resultado;
  }
}

export default new EmpateService();
