/**
 * Rotas próprias do Teams
 */

import { Etapa } from "../../models/Etapa";
import { ConfrontoEquipe } from "../../models/Teams";
import etapaService from "../../services/EtapaService";
import teamsService from "../../services/TeamsService";
import { BadRequestError, NotFoundError } from "../../utils/errors";
import { ResponseHelper } from "../../utils/responseHelper";
import { BaseController, Contexto } from "../BaseController";

const buscarEtapa = async ({ req, arenaId }: Contexto): Promise<Etapa> => {
  const etapa = await etapaService.buscarPorId(req.params.id, arenaId);

  if (!etapa) throw new NotFoundError("Etapa não encontrada");

  return etapa;
};

const buscarConfronto = async ({
  req,
  arenaId,
}: Contexto): Promise<ConfrontoEquipe> => {
  const confronto = await teamsService.buscarConfronto(
    req.params.confrontoId,
    req.params.id,
    arenaId
  );

  if (!confronto) throw new NotFoundError("Confronto não encontrado");

  return confronto;
};

class TeamsController extends BaseController {
  protected controllerName = "TeamsController";

  // ==================== CHAVES ====================

  /** POST /api/etapas/:id/teams/gerar-equipes */
  gerarEquipes = this.rota("gerar equipes TEAMS", async (contexto) => {
    const { req, res, arenaId } = contexto;
    const { tipoFormacaoJogos = "sorteio" } = req.body;

    const etapa = await buscarEtapa(contexto);
    const { equipes, confrontos } = await teamsService.gerarChaves(
      etapa,
      await etapaService.listarInscricoes(etapa.id, arenaId),
      tipoFormacaoJogos
    );

    ResponseHelper.success(res, {
      message: "Equipes TEAMS geradas com sucesso",
      equipes: equipes.length,
      confrontos: confrontos.length,
    });
  });

  /** POST /api/etapas/:id/teams/formar-equipes-manual */
  formarEquipes = this.rota("formar equipes TEAMS manual", async (contexto) => {
    const { req, res, arenaId } = contexto;
    const { formacoes, tipoFormacaoJogos = "sorteio" } = req.body;

    const etapa = await buscarEtapa(contexto);
    const { equipes, confrontos } = await teamsService.formarChavesManualmente(
      etapa,
      await etapaService.listarInscricoes(etapa.id, arenaId),
      formacoes,
      tipoFormacaoJogos
    );

    ResponseHelper.success(res, {
      message: "Equipes formadas com sucesso",
      equipes: equipes.length,
      confrontos: confrontos.length,
    });
  });

  /** DELETE /api/etapas/:id/teams/cancelar */
  cancelarChaves = this.rota(
    "cancelar chaves TEAMS",
    async ({ req, res, arenaId }) => {
      await teamsService.cancelarChaves(req.params.id, arenaId);

      ResponseHelper.success(res, null, "Chaves TEAMS canceladas com sucesso");
    }
  );

  // ==================== EQUIPES ====================

  /** GET /api/etapas/:id/teams/equipes */
  buscarEquipes = this.consulta(
    "buscar equipes TEAMS",
    async ({ req, res, arenaId }) => {
      ResponseHelper.success(
        res,
        await teamsService.buscarEquipes(req.params.id, arenaId)
      );
    }
  );

  /** PATCH /api/etapas/:id/teams/equipes/:equipeId/renomear */
  renomearEquipe = this.rota(
    "renomear equipe TEAMS",
    async ({ req, res, arenaId }) => {
      const { nome } = req.body;

      if (!nome) throw new BadRequestError("Nome da equipe é obrigatório");

      await teamsService.renomearEquipe(req.params.equipeId, nome, arenaId);

      ResponseHelper.success(res, { message: "Equipe renomeada com sucesso" });
    }
  );

  /** POST /api/etapas/:id/teams/recalcular-classificacao */
  recalcularClassificacao = this.consulta(
    "recalcular classificação TEAMS",
    async ({ req, res, arenaId }) => {
      ResponseHelper.success(
        res,
        await teamsService.recalcularClassificacao(req.params.id, arenaId)
      );
    }
  );

  // ==================== CONFRONTOS E PARTIDAS ====================

  /** GET /api/etapas/:id/teams/confrontos */
  buscarConfrontos = this.consulta(
    "buscar confrontos TEAMS",
    async ({ req, res, arenaId }) => {
      ResponseHelper.success(
        res,
        await teamsService.buscarConfrontos(req.params.id, arenaId)
      );
    }
  );

  /** GET /api/etapas/:id/teams/confrontos/:confrontoId/partidas */
  buscarPartidas = this.consulta(
    "buscar partidas confronto TEAMS",
    async (contexto) => {
      const confronto = await buscarConfronto(contexto);

      ResponseHelper.success(
        contexto.res,
        await teamsService.buscarPartidasConfronto(confronto.id)
      );
    }
  );

  /** POST /api/etapas/:id/teams/confrontos/:confrontoId/gerar-partidas */
  gerarPartidas = this.rota(
    "gerar partidas confronto TEAMS",
    async (contexto) => {
      const etapa = await buscarEtapa(contexto);
      const partidas = await teamsService.gerarPartidasConfronto(
        await buscarConfronto(contexto),
        etapa
      );

      ResponseHelper.success(contexto.res, {
        message: "Partidas geradas com sucesso",
        partidas: partidas.length,
      });
    }
  );

  /** POST /api/etapas/:id/teams/confrontos/:confrontoId/definir-partidas */
  definirPartidas = this.rota(
    "definir partidas TEAMS manual",
    async (contexto) => {
      const etapa = await buscarEtapa(contexto);
      const partidas = await teamsService.definirPartidasManualmente(
        await buscarConfronto(contexto),
        etapa,
        { partidas: contexto.req.body.partidas }
      );

      ResponseHelper.success(contexto.res, {
        message: "Partidas definidas com sucesso",
        partidas: partidas.length,
      });
    }
  );

  /** POST /api/etapas/:id/teams/confrontos/:confrontoId/gerar-decider */
  gerarDecider = this.rota("gerar decider TEAMS", async (contexto) => {
    const etapa = await buscarEtapa(contexto);
    const decider = await teamsService.gerarDecider(
      await buscarConfronto(contexto),
      etapa
    );

    ResponseHelper.success(contexto.res, {
      message: "Decider gerado com sucesso",
      decider,
    });
  });

  /** POST /api/etapas/:id/teams/partidas/:partidaId/definir-jogadores */
  definirJogadores = this.rota(
    "definir jogadores da partida",
    async ({ req, res, arenaId }) => {
      const { dupla1JogadorIds, dupla2JogadorIds } = req.body;
      const ehDupla = (ids: unknown): ids is [string, string] =>
        Array.isArray(ids) && ids.length === 2;

      if (!ehDupla(dupla1JogadorIds) || !ehDupla(dupla2JogadorIds)) {
        throw new BadRequestError(
          "dupla1JogadorIds e dupla2JogadorIds devem ser arrays com 2 IDs cada"
        );
      }

      const partida = await teamsService.definirJogadoresPartida(
        req.params.partidaId,
        arenaId,
        dupla1JogadorIds,
        dupla2JogadorIds
      );

      ResponseHelper.success(res, partida, "Jogadores definidos com sucesso");
    }
  );

  /** POST /api/etapas/:id/teams/resultados-lote */
  registrarResultados = this.rota(
    "registrar resultados TEAMS em lote",
    async ({ req, res, arenaId }) => {
      const { resultados } = req.body;

      if (!Array.isArray(resultados) || resultados.length === 0) {
        throw new BadRequestError("É necessário enviar ao menos um resultado");
      }

      const { processados, erros, confrontosFinalizados } =
        await teamsService.registrarResultadosEmLote(
          req.params.id,
          arenaId,
          resultados
        );

      ResponseHelper.success(res, {
        message: `${processados} resultado(s) registrado(s) com sucesso`,
        processados,
        erros,
        confrontosFinalizados,
      });
    }
  );

  /** DELETE /api/etapas/:id/teams/resetar-partidas */
  resetarPartidas = this.rota(
    "resetar partidas TEAMS",
    async ({ req, res, arenaId }) => {
      await teamsService.resetarPartidas(req.params.id, arenaId);

      ResponseHelper.success(res, null, "Partidas resetadas com sucesso");
    }
  );

  // ==================== ELIMINATÓRIA ====================

  /** POST /api/etapas/:id/teams/fase-eliminatoria */
  gerarEliminatoria = this.rota(
    "gerar fase eliminatória TEAMS",
    async ({ req, res, arenaId }) => {
      await teamsService.gerarFaseEliminatoria(req.params.id, arenaId);

      ResponseHelper.created(res, null, "Fase eliminatória gerada com sucesso");
    }
  );

  /** DELETE /api/etapas/:id/teams/fase-eliminatoria */
  cancelarEliminatoria = this.rota(
    "cancelar fase eliminatória TEAMS",
    async ({ req, res, arenaId }) => {
      await teamsService.cancelarFaseEliminatoria(req.params.id, arenaId);

      ResponseHelper.success(
        res,
        null,
        "Fase eliminatória cancelada com sucesso"
      );
    }
  );
}

export default new TeamsController();
