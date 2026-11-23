/**
 * Chaves da Dupla Fixa e confrontos eliminatórios de duplas
 */

import { TipoFase } from "../../models/Eliminatoria";
import chaveService from "../../services/ChaveService";
import { BadRequestError } from "../../utils/errors";
import { ResponseHelper } from "../../utils/responseHelper";
import { BaseController } from "../BaseController";

class ChaveController extends BaseController {
  protected controllerName = "ChaveController";

  /** POST /api/etapas/:id/gerar-chaves */
  gerar = this.rota("gerar chaves", async ({ req, res, arenaId }) => {
    const resultado = await chaveService.gerarChaves(req.params.id, arenaId);

    ResponseHelper.success(res, resultado, "Chaves geradas com sucesso");
  });

  /** POST /api/etapas/:id/formar-duplas-manual */
  formarDuplas = this.rota(
    "formar duplas manualmente",
    async ({ req, res, arenaId }) => {
      const { formacoes } = req.body;

      if (!Array.isArray(formacoes) || formacoes.length === 0) {
        throw new BadRequestError("Formações de duplas são obrigatórias");
      }

      const resultado = await chaveService.gerarChavesComDuplasManual(
        req.params.id,
        arenaId,
        formacoes
      );

      ResponseHelper.success(
        res,
        resultado,
        "Duplas formadas e chaves geradas com sucesso"
      );
    }
  );

  /** DELETE /api/etapas/:id/chaves */
  excluir = this.rota("excluir chaves", async ({ req, res, arenaId }) => {
    await chaveService.excluirChaves(req.params.id, arenaId);

    ResponseHelper.success(res, null, "Chaves excluídas com sucesso");
  });

  /** GET /api/etapas/:id/duplas */
  buscarDuplas = this.consulta("buscar duplas", async ({ req, res, arenaId }) => {
    ResponseHelper.success(
      res,
      await chaveService.buscarDuplas(req.params.id, arenaId)
    );
  });

  /** GET /api/etapas/:id/grupos */
  buscarGrupos = this.consulta("buscar grupos", async ({ req, res, arenaId }) => {
    ResponseHelper.success(
      res,
      await chaveService.buscarGrupos(req.params.id, arenaId)
    );
  });

  /** GET /api/etapas/:id/partidas */
  buscarPartidas = this.consulta(
    "buscar partidas",
    async ({ req, res, arenaId }) => {
      ResponseHelper.success(
        res,
        await chaveService.buscarPartidas(req.params.id, arenaId)
      );
    }
  );

  /** POST /api/etapas/:id/gerar-eliminatoria */
  gerarEliminatoria = this.rota(
    "gerar fase eliminatória",
    async ({ req, res, arenaId }) => {
      const { classificadosPorGrupo = 2 } = req.body;

      await chaveService.gerarFaseEliminatoria(
        req.params.id,
        arenaId,
        classificadosPorGrupo
      );

      ResponseHelper.created(res, null, "Fase eliminatória gerada com sucesso");
    }
  );

  /** DELETE /api/etapas/:id/cancelar-eliminatoria */
  cancelarEliminatoria = this.rota(
    "cancelar fase eliminatória",
    async ({ req, res, arenaId }) => {
      await chaveService.cancelarFaseEliminatoria(req.params.id, arenaId);

      ResponseHelper.success(
        res,
        null,
        "Fase eliminatória cancelada com sucesso"
      );
    }
  );

  /**
   * GET /api/etapas/:id/confrontos-eliminatorios
   * GET /api/etapas/:id/rei-da-praia/confrontos
   */
  buscarConfrontos = this.consulta(
    "buscar confrontos eliminatórios",
    async ({ req, res, arenaId }) => {
      ResponseHelper.success(
        res,
        await chaveService.buscarConfrontosEliminatorios(
          req.params.id,
          arenaId,
          req.query.fase as TipoFase | undefined
        )
      );
    }
  );

  /** POST /api/etapas/confrontos-eliminatorios/:confrontoId/resultado */
  registrarResultado = this.rota(
    "registrar resultado eliminatório",
    async ({ req, res, arenaId }) => {
      await chaveService.registrarResultadoEliminatorio(
        req.params.confrontoId,
        arenaId,
        req.body.placar
      );

      ResponseHelper.success(res, null, "Resultado registrado com sucesso");
    }
  );
}

export default new ChaveController();
