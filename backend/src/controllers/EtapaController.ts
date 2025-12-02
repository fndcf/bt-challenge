/**
 * EtapaController.ts
 * Controller para gerenciar etapas de torneio
 * REFATORADO: Fase 5.2 - Usando ResponseHelper e BaseController
 */

import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { BaseController } from "./BaseController";
import { ResponseHelper } from "../utils/responseHelper";
import etapaService from "../services/EtapaService";
import chaveService from "../services/ChaveService";
import {
  CriarEtapaSchema,
  AtualizarEtapaSchema,
  InscreverJogadorSchema,
  FiltrosEtapa,
} from "../models/Etapa";
import { z } from "zod";
import logger from "../utils/logger";

class EtapaController extends BaseController {
  protected controllerName = "EtapaController";

  /**
   * Criar nova etapa
   * POST /api/etapas
   */
  async criar(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId, uid } = req.user;
      const dadosValidados = CriarEtapaSchema.parse(req.body);

      logger.info("Criando etapa", {
        arenaId,
        nome: dadosValidados.nome,
        formato: dadosValidados.formato,
      });

      const etapa = await etapaService.criar(arenaId, uid, dadosValidados);

      logger.info("Etapa criada com sucesso", {
        etapaId: etapa.id,
        nome: etapa.nome,
      });

      ResponseHelper.created(res, etapa, "Etapa criada com sucesso");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return this.handleZodError(res, error);
      }

      if (
        this.handleBusinessError(
          res,
          error,
          BaseController.ERROR_PATTERNS.BAD_REQUEST
        )
      ) {
        return;
      }

      this.handleGenericError(res, error, "criar etapa", {
        arenaId: req.user?.arenaId,
      });
    }
  }

  /**
   * Buscar etapa por ID
   * GET /api/etapas/:id
   */
  async buscarPorId(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      const etapa = await etapaService.buscarPorId(id, arenaId);

      if (!etapa) {
        logger.warn("Etapa não encontrada", { etapaId: id, arenaId });
        ResponseHelper.notFound(res, "Etapa não encontrada");
        return;
      }

      ResponseHelper.success(res, etapa);
    } catch (error: any) {
      this.handleGenericError(res, error, "buscar etapa", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Listar etapas
   * GET /api/etapas
   */
  async listar(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;

      const filtros: FiltrosEtapa = {
        arenaId,
        status: req.query.status as any,
        ordenarPor: req.query.ordenarPor as any,
        ordem: req.query.ordem as any,
        limite: req.query.limite ? parseInt(req.query.limite as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      const resultado = await etapaService.listar(filtros);

      ResponseHelper.success(res, resultado);
    } catch (error: any) {
      this.handleGenericError(res, error, "listar etapas", {
        arenaId: req.user?.arenaId,
      });
    }
  }

  /**
   * Atualizar etapa
   * PUT /api/etapas/:id
   */
  async atualizar(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;
      const dadosValidados = AtualizarEtapaSchema.parse(req.body);

      // Validação extra: maxJogadores não pode ser menor que totalInscritos
      if (dadosValidados.maxJogadores !== undefined) {
        const etapaAtual = await etapaService.buscarPorId(id, arenaId);

        if (!etapaAtual) {
          logger.warn("Etapa não encontrada ao atualizar", {
            etapaId: id,
            arenaId,
          });
          ResponseHelper.notFound(res, "Etapa não encontrada");
          return;
        }

        if (dadosValidados.maxJogadores < etapaAtual.totalInscritos) {
          logger.warn("Tentativa de reduzir maxJogadores abaixo de inscritos", {
            etapaId: id,
            tentativa: dadosValidados.maxJogadores,
            inscritos: etapaAtual.totalInscritos,
          });
          ResponseHelper.badRequest(
            res,
            `Não é possível reduzir para ${dadosValidados.maxJogadores} jogadores. A etapa já possui ${etapaAtual.totalInscritos} jogador(es) inscrito(s).`
          );
          return;
        }
      }

      logger.info("Atualizando etapa", { etapaId: id, arenaId });

      const etapaAtualizada = await etapaService.atualizar(
        id,
        arenaId,
        dadosValidados
      );

      logger.info("Etapa atualizada com sucesso", { etapaId: id });

      ResponseHelper.success(
        res,
        etapaAtualizada,
        "Etapa atualizada com sucesso"
      );
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return this.handleZodError(res, error);
      }

      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "atualizar etapa", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Deletar etapa
   * DELETE /api/etapas/:id
   */
  async deletar(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      logger.info("Deletando etapa", { etapaId: id, arenaId });

      await etapaService.deletar(id, arenaId);

      logger.info("Etapa deletada com sucesso", { etapaId: id });

      ResponseHelper.success(res, null, "Etapa deletada com sucesso");
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "deletar etapa", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Inscrever jogador
   * POST /api/etapas/:id/inscrever
   */
  async inscreverJogador(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;
      const dadosValidados = InscreverJogadorSchema.parse(req.body);

      logger.info("Inscrevendo jogador", {
        etapaId: id,
        jogadorId: dadosValidados.jogadorId,
      });

      const inscricao = await etapaService.inscreverJogador(
        id,
        arenaId,
        dadosValidados
      );

      logger.info("Jogador inscrito com sucesso", {
        inscricaoId: inscricao.id,
        etapaId: id,
      });

      ResponseHelper.created(res, inscricao, "Jogador inscrito com sucesso");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return this.handleZodError(res, error);
      }

      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "inscrever jogador", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Cancelar inscrição
   * DELETE /api/etapas/:etapaId/inscricoes/:inscricaoId
   */
  async cancelarInscricao(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { etapaId, inscricaoId } = req.params;

      logger.info("Cancelando inscrição", { inscricaoId, etapaId });

      // 1. Buscar inscrição para pegar jogadorId
      const inscricao = await etapaService.buscarInscricao(
        etapaId,
        arenaId,
        inscricaoId
      );

      if (!inscricao) {
        logger.warn("Inscrição não encontrada", { inscricaoId });
        ResponseHelper.notFound(res, "Inscrição não encontrada");
        return;
      }

      // 2. Cancelar inscrição
      await etapaService.cancelarInscricao(inscricaoId, etapaId, arenaId);
      logger.info("Inscrição cancelada", {
        inscricaoId,
        jogador: inscricao.jogadorNome,
      });

      // 3. Remover cabeça de chave (se existir)
      try {
        const cabecaDeChaveService = (
          await import("../services/CabecaDeChaveService")
        ).default;
        await cabecaDeChaveService.remover(
          arenaId,
          etapaId,
          inscricao.jogadorId
        );
        logger.info("Cabeça de chave removida", {
          jogador: inscricao.jogadorNome,
        });
      } catch {
        logger.debug("Jogador não era cabeça de chave", {
          jogador: inscricao.jogadorNome,
        });
      }

      ResponseHelper.success(res, null, "Inscrição cancelada com sucesso");
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "cancelar inscrição", {
        inscricaoId: req.params.inscricaoId,
      });
    }
  }

  /**
   * Listar inscrições
   * GET /api/etapas/:id/inscricoes
   */
  async listarInscricoes(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      const inscricoes = await etapaService.listarInscricoes(id, arenaId);

      ResponseHelper.success(res, inscricoes);
    } catch (error: any) {
      this.handleGenericError(res, error, "listar inscrições", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Encerrar inscrições
   * POST /api/etapas/:id/encerrar-inscricoes
   */
  async encerrarInscricoes(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      logger.info("Encerrando inscrições", { etapaId: id });

      const etapa = await etapaService.encerrarInscricoes(id, arenaId);

      logger.info("Inscrições encerradas", { etapaId: id });

      ResponseHelper.success(res, etapa, "Inscrições encerradas com sucesso");
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "encerrar inscrições", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Reabrir inscrições
   * POST /api/etapas/:id/reabrir-inscricoes
   */
  async reabrirInscricoes(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      logger.info("Reabrindo inscrições", { etapaId: id });

      const etapa = await etapaService.reabrirInscricoes(id, arenaId);

      logger.info("Inscrições reabertas", { etapaId: id });

      ResponseHelper.success(res, etapa, "Inscrições reabertas com sucesso");
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "reabrir inscrições", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Gerar chaves
   * POST /api/etapas/:id/gerar-chaves
   */
  async gerarChaves(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      const etapa = await etapaService.buscarPorId(id, arenaId);
      if (!etapa) {
        ResponseHelper.notFound(res, "Etapa não encontrada");
        return;
      }

      if (etapa.formato === "rei_da_praia") {
        logger.warn("Tentativa de gerar chaves para Rei da Praia", {
          etapaId: id,
        });
        ResponseHelper.badRequest(
          res,
          "Esta etapa é do formato Rei da Praia. Use a rota /rei-da-praia/gerar-chaves"
        );
        return;
      }

      logger.info("Gerando chaves", { etapaId: id, formato: etapa.formato });

      const resultado = await chaveService.gerarChaves(id, arenaId);

      logger.info("Chaves geradas com sucesso", {
        etapaId: id,
        totalDuplas: resultado.duplas.length,
      });

      ResponseHelper.success(res, resultado, "Chaves geradas com sucesso");
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "gerar chaves", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Obter estatísticas
   * GET /api/etapas/stats
   */
  async obterEstatisticas(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const estatisticas = await etapaService.obterEstatisticas(arenaId);

      ResponseHelper.success(res, estatisticas);
    } catch (error: any) {
      this.handleGenericError(res, error, "obter estatísticas", {
        arenaId: req.user?.arenaId,
      });
    }
  }

  /**
   * Buscar duplas de uma etapa
   * GET /api/etapas/:id/duplas
   */
  async buscarDuplas(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      const duplas = await chaveService.buscarDuplas(id, arenaId);

      ResponseHelper.success(res, duplas);
    } catch (error: any) {
      this.handleGenericError(res, error, "buscar duplas", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Buscar grupos de uma etapa
   * GET /api/etapas/:id/grupos
   */
  async buscarGrupos(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      const grupos = await chaveService.buscarGrupos(id, arenaId);

      ResponseHelper.success(res, grupos);
    } catch (error: any) {
      this.handleGenericError(res, error, "buscar grupos", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Buscar partidas de uma etapa
   * GET /api/etapas/:id/partidas
   */
  async buscarPartidas(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      const partidas = await chaveService.buscarPartidas(id, arenaId);

      ResponseHelper.success(res, partidas);
    } catch (error: any) {
      this.handleGenericError(res, error, "buscar partidas", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Excluir chaves de uma etapa
   * DELETE /api/etapas/:id/chaves
   */
  async excluirChaves(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      logger.info("Excluindo chaves", { etapaId: id });

      await chaveService.excluirChaves(id, arenaId);

      logger.info("Chaves excluídas com sucesso", { etapaId: id });

      ResponseHelper.success(res, null, "Chaves excluídas com sucesso");
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "excluir chaves", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Gerar fase eliminatória
   * POST /api/etapas/:id/fase-eliminatoria
   */
  async gerarFaseEliminatoria(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;
      const { classificadosPorGrupo = 2 } = req.body;

      logger.info("Gerando fase eliminatória", {
        etapaId: id,
        classificadosPorGrupo,
      });

      await chaveService.gerarFaseEliminatoria(
        id,
        arenaId,
        classificadosPorGrupo
      );

      logger.info("Fase eliminatória gerada com sucesso", { etapaId: id });

      ResponseHelper.created(res, null, "Fase eliminatória gerada com sucesso");
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "gerar fase eliminatória", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Buscar confrontos eliminatórios
   * GET /api/etapas/:id/confrontos-eliminatorios
   */
  async buscarConfrontosEliminatorios(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;
      const { fase } = req.query;

      logger.debug("Buscando confrontos eliminatórios", {
        etapaId: id,
        arenaId,
        fase: fase || "todas",
      });

      const confrontos = await chaveService.buscarConfrontosEliminatorios(
        id,
        arenaId,
        fase as any
      );

      logger.debug("Confrontos encontrados", { total: confrontos.length });

      ResponseHelper.success(res, confrontos);
    } catch (error: any) {
      this.handleGenericError(res, error, "buscar confrontos eliminatórios", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Cancelar fase eliminatória
   * DELETE /api/etapas/:id/fase-eliminatoria
   */
  async cancelarFaseEliminatoria(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      logger.info("Cancelando fase eliminatória", { etapaId: id });

      await chaveService.cancelarFaseEliminatoria(id, arenaId);

      logger.info("Fase eliminatória cancelada com sucesso", { etapaId: id });

      ResponseHelper.success(
        res,
        null,
        "Fase eliminatória cancelada com sucesso"
      );
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "cancelar fase eliminatória", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Encerrar etapa
   * POST /api/etapas/:id/encerrar
   */
  async encerrarEtapa(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      logger.info("Encerrando etapa", { etapaId: id });

      await etapaService.encerrarEtapa(id, arenaId);

      logger.info("Etapa encerrada com sucesso", { etapaId: id });

      ResponseHelper.success(res, null, "Etapa encerrada com sucesso!");
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "encerrar etapa", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Registrar resultado de confronto eliminatório
   * POST /api/etapas/confrontos-eliminatorios/:confrontoId/resultado
   */
  async registrarResultadoEliminatorio(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { confrontoId } = req.params;
      const { placar } = req.body;

      logger.info("Registrando resultado eliminatório", { confrontoId });

      const chaveService = (await import("../services/ChaveService")).default;
      await chaveService.registrarResultadoEliminatorio(
        confrontoId,
        arenaId,
        placar
      );

      logger.info("Resultado eliminatório registrado", { confrontoId });

      ResponseHelper.success(res, null, "Resultado registrado com sucesso");
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "registrar resultado eliminatório", {
        confrontoId: req.params.confrontoId,
      });
    }
  }

  // ==================== REI DA PRAIA ====================

  /**
   * Gerar chaves Rei da Praia
   * POST /api/etapas/:id/rei-da-praia/gerar-chaves
   */
  async gerarChavesReiDaPraia(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      logger.info("Gerando chaves Rei da Praia", { etapaId: id });

      const reiDaPraiaService = (await import("../services/ReiDaPraiaService"))
        .default;
      const resultado = await reiDaPraiaService.gerarChaves(id, arenaId);

      logger.info("Chaves Rei da Praia geradas", {
        etapaId: id,
        jogadores: resultado.jogadores.length,
        grupos: resultado.grupos.length,
      });

      ResponseHelper.success(res, {
        message: "Chaves Rei da Praia geradas com sucesso",
        jogadores: resultado.jogadores.length,
        grupos: resultado.grupos.length,
        partidas: resultado.partidas.length,
      });
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "gerar chaves Rei da Praia", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Buscar grupos Rei da Praia
   * GET /api/etapas/:id/rei-da-praia/grupos
   */
  async buscarGruposReiDaPraia(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      const { db } = await import("../config/firebase");

      const snapshot = await db
        .collection("grupos")
        .where("etapaId", "==", id)
        .where("arenaId", "==", arenaId)
        .orderBy("ordem", "asc")
        .get();

      const grupos = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

      ResponseHelper.success(res, grupos);
    } catch (error: any) {
      this.handleGenericError(res, error, "buscar grupos Rei da Praia", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Buscar jogadores/estatísticas Rei da Praia
   * GET /api/etapas/:id/rei-da-praia/jogadores
   */
  async buscarJogadoresReiDaPraia(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      const reiDaPraiaService = (await import("../services/ReiDaPraiaService"))
        .default;
      const jogadores = await reiDaPraiaService.buscarJogadores(id, arenaId);

      ResponseHelper.success(res, jogadores);
    } catch (error: any) {
      this.handleGenericError(res, error, "buscar jogadores Rei da Praia", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Buscar partidas Rei da Praia
   * GET /api/etapas/:id/rei-da-praia/partidas
   */
  async buscarPartidasReiDaPraia(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      const reiDaPraiaService = (await import("../services/ReiDaPraiaService"))
        .default;
      const partidas = await reiDaPraiaService.buscarPartidas(id, arenaId);

      ResponseHelper.success(res, partidas);
    } catch (error: any) {
      this.handleGenericError(res, error, "buscar partidas Rei da Praia", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Buscar confrontos eliminatórios Rei da Praia
   * GET /api/etapas/:id/rei-da-praia/confrontos
   */
  async buscarConfrontosReiDaPraia(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      const { db } = await import("../config/firebase");

      const snapshot = await db
        .collection("confrontos_eliminatorios")
        .where("etapaId", "==", id)
        .where("arenaId", "==", arenaId)
        .orderBy("ordem", "asc")
        .get();

      const confrontos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      ResponseHelper.success(res, confrontos);
    } catch (error: any) {
      this.handleGenericError(res, error, "buscar confrontos Rei da Praia", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Registrar resultado partida Rei da Praia
   * POST /api/etapas/:id/rei-da-praia/partidas/:partidaId/resultado
   */
  async registrarResultadoReiDaPraia(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { partidaId } = req.params;
      const { placar } = req.body;

      logger.info("Registrando resultado Rei da Praia", { partidaId });

      const reiDaPraiaService = (await import("../services/ReiDaPraiaService"))
        .default;
      await reiDaPraiaService.registrarResultadoPartida(
        partidaId,
        arenaId,
        placar
      );

      logger.info("Resultado Rei da Praia registrado", { partidaId });

      ResponseHelper.success(res, null, "Resultado registrado com sucesso");
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "registrar resultado Rei da Praia", {
        partidaId: req.params.partidaId,
      });
    }
  }

  /**
   * Gerar fase eliminatória Rei da Praia
   * POST /api/etapas/:id/rei-da-praia/gerar-eliminatoria
   */
  async gerarEliminatoriaReiDaPraia(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;
      const {
        classificadosPorGrupo = 2,
        tipoChaveamento = "melhores_com_melhores",
      } = req.body;

      logger.info("Gerando eliminatória Rei da Praia", {
        etapaId: id,
        classificadosPorGrupo,
        tipoChaveamento,
      });

      const reiDaPraiaService = (await import("../services/ReiDaPraiaService"))
        .default;
      const resultado = await reiDaPraiaService.gerarFaseEliminatoria(
        id,
        arenaId,
        classificadosPorGrupo,
        tipoChaveamento
      );

      logger.info("Eliminatória Rei da Praia gerada", {
        etapaId: id,
        duplas: resultado.duplas.length,
        confrontos: resultado.confrontos.length,
      });

      ResponseHelper.success(res, {
        message: "Fase eliminatória gerada com sucesso",
        duplas: resultado.duplas.length,
        confrontos: resultado.confrontos.length,
      });
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "gerar eliminatória Rei da Praia", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Cancelar fase eliminatória Rei da Praia
   * POST /api/etapas/:id/rei-da-praia/cancelar-eliminatoria
   */
  async cancelarEliminatoriaReiDaPraia(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      logger.info("Cancelando eliminatória Rei da Praia", { etapaId: id });

      const reiDaPraiaService = (await import("../services/ReiDaPraiaService"))
        .default;
      await reiDaPraiaService.cancelarFaseEliminatoria(id, arenaId);

      logger.info("Eliminatória Rei da Praia cancelada", { etapaId: id });

      ResponseHelper.success(
        res,
        null,
        "Fase eliminatória cancelada com sucesso"
      );
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(
        res,
        error,
        "cancelar eliminatória Rei da Praia",
        {
          etapaId: req.params.id,
        }
      );
    }
  }
}

export default new EtapaController();
