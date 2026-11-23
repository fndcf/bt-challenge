/**
 * Empates em todos os critérios, decididos pelo organizador
 */

import empateService from "../../services/EmpateService";
import { BadRequestError } from "../../utils/errors";
import { ResponseHelper } from "../../utils/responseHelper";
import { BaseController } from "../BaseController";

class DesempateController extends BaseController {
  protected controllerName = "DesempateController";

  /** GET /api/etapas/:id/empates-pendentes */
  listar = this.consulta(
    "listar empates pendentes",
    async ({ req, res, arenaId }) => {
      ResponseHelper.success(
        res,
        await empateService.listarPendentes(req.params.id, arenaId)
      );
    }
  );

  /**
   * POST /api/etapas/:id/desempate
   * Body: { grupoId, ids, modo: "sorteio" | "manual" }
   * No modo manual, `ids` vem na ordem escolhida (do melhor para o pior).
   */
  resolver = this.rota("resolver empate", async ({ req, res, arenaId }) => {
    const { grupoId, ids, modo } = req.body;

    if (
      typeof grupoId !== "string" ||
      !Array.isArray(ids) ||
      ids.length < 2 ||
      !ids.every((id: unknown) => typeof id === "string") ||
      (modo !== "sorteio" && modo !== "manual")
    ) {
      throw new BadRequestError("Dados de desempate inválidos");
    }

    const resultado = await empateService.resolver(
      req.params.id,
      arenaId,
      grupoId,
      ids,
      modo
    );

    ResponseHelper.success(res, resultado, "Desempate definido com sucesso");
  });
}

export default new DesempateController();
