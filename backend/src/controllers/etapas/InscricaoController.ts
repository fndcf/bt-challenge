/**
 * Inscrições da etapa e substituição de jogador
 */

import etapaService from "../../services/EtapaService";
import substituicaoService from "../../services/SubstituicaoService";
import { BadRequestError } from "../../utils/errors";
import { ResponseHelper } from "../../utils/responseHelper";
import { BaseController } from "../BaseController";

const exigirLista = (lista: unknown, nome: string) => {
  if (!Array.isArray(lista) || lista.length === 0) {
    throw new BadRequestError(`${nome} deve ser um array não vazio`);
  }
};

class InscricaoController extends BaseController {
  protected controllerName = "InscricaoController";

  /** GET /api/etapas/:id/inscricoes */
  listar = this.consulta("listar inscrições", async ({ req, res, arenaId }) => {
    ResponseHelper.success(
      res,
      await etapaService.listarInscricoes(req.params.id, arenaId)
    );
  });

  /** POST /api/etapas/:id/inscrever-lote */
  inscrever = this.rota(
    "inscrever jogadores em lote",
    async ({ req, res, arenaId }) => {
      const { jogadorIds } = req.body;
      exigirLista(jogadorIds, "jogadorIds");

      const { inscricoes, erros } = await etapaService.inscreverJogadoresEmLote(
        req.params.id,
        arenaId,
        jogadorIds
      );

      ResponseHelper.success(res, {
        message: `${inscricoes.length} jogador(es) inscrito(s) com sucesso`,
        inscricoes,
        erros,
        total: jogadorIds.length,
        sucessos: inscricoes.length,
        falhas: erros.length,
      });
    },
    [
      { pattern: "Inscrições não estão abertas", status: 400 },
      { pattern: "Etapa não encontrada", status: 404 },
      { pattern: "vagas disponíveis", status: 400 },
    ]
  );

  /** DELETE /api/etapas/:id/inscricoes-lote */
  cancelar = this.rota(
    "cancelar inscrições em lote",
    async ({ req, res, arenaId }) => {
      const { inscricaoIds } = req.body;
      exigirLista(inscricaoIds, "inscricaoIds");

      const { canceladas, erros } = await etapaService.cancelarInscricoesEmLote(
        inscricaoIds,
        req.params.id,
        arenaId
      );

      ResponseHelper.success(res, {
        message: `${canceladas} inscrição(ões) cancelada(s) com sucesso`,
        canceladas,
        erros,
      });
    }
  );

  /** POST /api/etapas/:id/encerrar-inscricoes */
  encerrar = this.rota("encerrar inscrições", async ({ req, res, arenaId }) => {
    const etapa = await etapaService.encerrarInscricoes(req.params.id, arenaId);

    ResponseHelper.success(res, etapa, "Inscrições encerradas com sucesso");
  });

  /** POST /api/etapas/:id/reabrir-inscricoes */
  reabrir = this.rota("reabrir inscrições", async ({ req, res, arenaId }) => {
    const etapa = await etapaService.reabrirInscricoes(req.params.id, arenaId);

    ResponseHelper.success(res, etapa, "Inscrições reabertas com sucesso");
  });

  /** POST /api/etapas/:id/substituir-jogador */
  substituirJogador = this.rota(
    "substituir jogador",
    async ({ req, res, arenaId }) => {
      const { jogadorAntigoId, jogadorNovoId } = req.body;

      if (!jogadorAntigoId || !jogadorNovoId) {
        throw new BadRequestError(
          "jogadorAntigoId e jogadorNovoId são obrigatórios"
        );
      }

      const resultado = await substituicaoService.substituirJogador(
        req.params.id,
        arenaId,
        jogadorAntigoId,
        jogadorNovoId
      );

      ResponseHelper.success(res, resultado, resultado.mensagem);
    }
  );

  /** GET /api/etapas/:id/jogadores-disponiveis */
  buscarJogadoresDisponiveis = this.consulta(
    "buscar jogadores disponíveis",
    async ({ req, res, arenaId }) => {
      ResponseHelper.success(
        res,
        await substituicaoService.buscarJogadoresDisponiveis(
          req.params.id,
          arenaId
        )
      );
    }
  );
}

export default new InscricaoController();
