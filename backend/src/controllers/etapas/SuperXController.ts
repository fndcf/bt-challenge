/**
 * Rotas próprias do Super X
 */

import superXService from "../../services/SuperXService";
import { ResponseHelper } from "../../utils/responseHelper";
import { BaseController } from "../BaseController";
import { validarResultados } from "./resultados";

class SuperXController extends BaseController {
  protected controllerName = "SuperXController";

  /** POST /api/etapas/:id/super-x/gerar-chaves */
  gerarChaves = this.rota(
    "gerar chaves Super X",
    async ({ req, res, arenaId }) => {
      const { jogadores, grupo, partidas } = await superXService.gerarChaves(
        req.params.id,
        arenaId
      );

      ResponseHelper.success(res, {
        message: "Chaves Super X geradas com sucesso",
        jogadores: jogadores.length,
        grupo,
        partidas: partidas.length,
      });
    }
  );

  /** DELETE /api/etapas/:id/super-x/cancelar-chaves */
  cancelarChaves = this.rota(
    "cancelar chaves Super X",
    async ({ req, res, arenaId }) => {
      await superXService.cancelarChaves(req.params.id, arenaId);

      ResponseHelper.success(
        res,
        null,
        "Chaves Super X canceladas com sucesso"
      );
    }
  );

  /** GET /api/etapas/:id/super-x/jogadores */
  buscarJogadores = this.consulta(
    "buscar jogadores Super X",
    async ({ req, res, arenaId }) => {
      ResponseHelper.success(
        res,
        await superXService.buscarJogadores(req.params.id, arenaId)
      );
    }
  );

  /** GET /api/etapas/:id/super-x/partidas */
  buscarPartidas = this.consulta(
    "buscar partidas Super X",
    async ({ req, res, arenaId }) => {
      ResponseHelper.success(
        res,
        await superXService.buscarPartidas(req.params.id, arenaId)
      );
    }
  );

  /** GET /api/etapas/:id/super-x/grupo */
  buscarGrupo = this.consulta(
    "buscar grupo Super X",
    async ({ req, res, arenaId }) => {
      ResponseHelper.success(
        res,
        await superXService.buscarGrupo(req.params.id, arenaId)
      );
    }
  );

  /** POST /api/etapas/:id/super-x/resultados-lote */
  registrarResultados = this.rota(
    "registrar resultados em lote Super X",
    async ({ req, res, arenaId }) => {
      const { resultados } = req.body;
      validarResultados(resultados);

      const resposta = await superXService.registrarResultadosEmLote(
        req.params.id,
        arenaId,
        resultados
      );

      ResponseHelper.success(res, resposta, resposta.message);
    }
  );
}

export default new SuperXController();
