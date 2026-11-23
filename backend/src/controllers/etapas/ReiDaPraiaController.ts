/**
 * Rotas próprias do Rei da Praia
 */

import reiDaPraiaService from "../../services/ReiDaPraiaService";
import { ResponseHelper } from "../../utils/responseHelper";
import { BaseController } from "../BaseController";
import { validarResultados } from "./resultados";

class ReiDaPraiaController extends BaseController {
  protected controllerName = "ReiDaPraiaController";

  /** POST /api/etapas/:id/rei-da-praia/gerar-chaves */
  gerarChaves = this.rota(
    "gerar chaves Rei da Praia",
    async ({ req, res, arenaId }) => {
      const { jogadores, grupos, partidas } =
        await reiDaPraiaService.gerarChaves(req.params.id, arenaId);

      ResponseHelper.success(res, {
        message: "Chaves Rei da Praia geradas com sucesso",
        jogadores: jogadores.length,
        grupos: grupos.length,
        partidas: partidas.length,
      });
    }
  );

  /** GET /api/etapas/:id/rei-da-praia/jogadores */
  buscarJogadores = this.consulta(
    "buscar jogadores Rei da Praia",
    async ({ req, res, arenaId }) => {
      ResponseHelper.success(
        res,
        await reiDaPraiaService.buscarJogadores(req.params.id, arenaId)
      );
    }
  );

  /** GET /api/etapas/:id/rei-da-praia/partidas */
  buscarPartidas = this.consulta(
    "buscar partidas Rei da Praia",
    async ({ req, res, arenaId }) => {
      ResponseHelper.success(
        res,
        await reiDaPraiaService.buscarPartidas(req.params.id, arenaId)
      );
    }
  );

  /** POST /api/etapas/:id/rei-da-praia/resultados-lote */
  registrarResultados = this.rota(
    "registrar resultados em lote Rei da Praia",
    async ({ req, res, arenaId }) => {
      const { resultados } = req.body;
      validarResultados(resultados);

      const resposta = await reiDaPraiaService.registrarResultadosEmLote(
        req.params.id,
        arenaId,
        resultados
      );

      ResponseHelper.success(res, resposta, resposta.message);
    }
  );

  /** POST /api/etapas/:id/rei-da-praia/gerar-eliminatoria */
  gerarEliminatoria = this.rota(
    "gerar eliminatória Rei da Praia",
    async ({ req, res, arenaId }) => {
      const { classificadosPorGrupo = 2 } = req.body;

      const { duplas, confrontos } =
        await reiDaPraiaService.gerarFaseEliminatoria(
          req.params.id,
          arenaId,
          classificadosPorGrupo
        );

      ResponseHelper.success(res, {
        message: "Fase eliminatória gerada com sucesso",
        duplas: duplas.length,
        confrontos: confrontos.length,
      });
    }
  );

  /** POST /api/etapas/:id/rei-da-praia/cancelar-eliminatoria */
  cancelarEliminatoria = this.rota(
    "cancelar eliminatória Rei da Praia",
    async ({ req, res, arenaId }) => {
      await reiDaPraiaService.cancelarFaseEliminatoria(req.params.id, arenaId);

      ResponseHelper.success(
        res,
        null,
        "Fase eliminatória cancelada com sucesso"
      );
    }
  );
}

export default new ReiDaPraiaController();
