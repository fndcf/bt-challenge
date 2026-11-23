/**
 * Etapas: cadastro, listagem, encerramento e súmula
 */

import {
  AtualizarEtapaSchema,
  CriarEtapaSchema,
  FiltrosEtapa,
} from "../../models/Etapa";
import encerramentoService from "../../services/EncerramentoService";
import etapaService from "../../services/EtapaService";
import excelSumulaService from "../../services/ExcelSumulaService";
import { NotFoundError } from "../../utils/errors";
import { ResponseHelper } from "../../utils/responseHelper";
import { BaseController } from "../BaseController";

class EtapaController extends BaseController {
  protected controllerName = "EtapaController";

  /** POST /api/etapas */
  criar = this.rota(
    "criar etapa",
    async ({ req, res, arenaId, uid }) => {
      const dados = CriarEtapaSchema.parse(req.body);
      const etapa = await etapaService.criar(arenaId, uid, dados);

      ResponseHelper.created(res, etapa, "Etapa criada com sucesso");
    },
    BaseController.ERROR_PATTERNS.BAD_REQUEST
  );

  /** GET /api/etapas */
  listar = this.consulta("listar etapas", async ({ req, res, arenaId }) => {
    const { limite, offset, ...filtros } = req.query;

    const resultado = await etapaService.listar({
      status: filtros.status,
      nivel: filtros.nivel,
      genero: filtros.genero,
      formato: filtros.formato,
      ordenarPor: filtros.ordenarPor,
      ordem: filtros.ordem,
      arenaId,
      limite: limite ? parseInt(limite as string) : 20,
      offset: offset ? parseInt(offset as string) : 0,
    } as FiltrosEtapa);

    ResponseHelper.success(res, resultado);
  });

  /** GET /api/etapas/stats */
  obterEstatisticas = this.consulta(
    "obter estatísticas",
    async ({ res, arenaId }) => {
      ResponseHelper.success(
        res,
        await etapaService.obterEstatisticas(arenaId)
      );
    }
  );

  /** GET /api/etapas/:id */
  buscarPorId = this.consulta("buscar etapa", async ({ req, res, arenaId }) => {
    const etapa = await etapaService.buscarPorId(req.params.id, arenaId);

    if (!etapa) throw new NotFoundError("Etapa não encontrada");

    ResponseHelper.success(res, etapa);
  });

  /** PUT /api/etapas/:id */
  atualizar = this.rota("atualizar etapa", async ({ req, res, arenaId }) => {
    const dados = AtualizarEtapaSchema.parse(req.body);
    const etapa = await etapaService.atualizar(req.params.id, arenaId, dados);

    ResponseHelper.success(res, etapa, "Etapa atualizada com sucesso");
  });

  /** DELETE /api/etapas/:id */
  deletar = this.rota("deletar etapa", async ({ req, res, arenaId }) => {
    await etapaService.deletar(req.params.id, arenaId);

    ResponseHelper.success(res, null, "Etapa deletada com sucesso");
  });

  /** POST /api/etapas/:id/encerrar */
  encerrar = this.rota("encerrar etapa", async ({ req, res, arenaId }) => {
    await encerramentoService.encerrarEtapa(req.params.id, arenaId);

    ResponseHelper.success(res, null, "Etapa encerrada com sucesso!");
  });

  /** GET /api/etapas/:id/exportar-sumula */
  exportarSumula = this.rota(
    "exportar súmula",
    async ({ req, res, arenaId }) => {
      const { buffer, nomeArquivo } = await excelSumulaService.gerarSumula(
        req.params.id,
        arenaId
      );

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${nomeArquivo}"`
      );
      res.send(buffer);
    },
    [
      { pattern: "não encontrada", status: 404 },
      { pattern: "não pertence", status: 404 },
      { pattern: "não foram geradas", status: 400 },
    ]
  );
}

export default new EtapaController();
