/**
 * JogadorController.ts
 * Controller para gerenciar jogadores
 * REFATORADO: Fase 5.2 - Usando ResponseHelper e BaseController
 */

import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { BaseController } from "./BaseController";
import { ResponseHelper } from "../utils/responseHelper";
import jogadorService from "../services/JogadorService";
import {
  CriarJogadorSchema,
  AtualizarJogadorSchema,
  FiltrosJogador,
} from "../models/Jogador";
import { z } from "zod";
import logger from "../utils/logger";

class JogadorController extends BaseController {
  protected controllerName = "JogadorController";

  /**
   * Criar novo jogador
   * POST /api/jogadores
   */
  async criar(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId, uid } = req.user;
      const dadosValidados = CriarJogadorSchema.parse(req.body);

      const jogador = await jogadorService.criar(arenaId, uid, dadosValidados);

      logger.info("Jogador criado", {
        jogadorId: jogador.id,
        nome: jogador.nome,
        nivel: jogador.nivel,
      });

      ResponseHelper.created(res, jogador, "Jogador criado com sucesso");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return this.handleZodError(res, error);
      }

      if (this.handleBusinessError(res, error, BaseController.ERROR_PATTERNS.CONFLICT)) {
        return;
      }

      logger.error("Erro ao criar jogador", { nome: req.body.nome }, error);
      this.handleGenericError(res, error, "criar jogador");
    }
  }

  /**
   * Buscar jogador por ID
   * GET /api/jogadores/:id
   */
  async buscarPorId(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      const jogador = await jogadorService.buscarPorId(id, arenaId);

      if (!jogador) {
        ResponseHelper.notFound(res, "Jogador não encontrado"); return;
      }

      ResponseHelper.success(res, jogador);
    } catch (error: any) {
      this.handleGenericError(res, error, "buscar jogador", {
        jogadorId: req.params.id,
      });
    }
  }

  /**
   * Listar jogadores com filtros
   * GET /api/jogadores
   */
  async listar(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;

      const filtros: FiltrosJogador = {
        arenaId,
        nivel: req.query.nivel as any,
        status: req.query.status as any,
        genero: req.query.genero as any,
        busca: req.query.busca as string,
        ordenarPor: req.query.ordenarPor as any,
        ordem: req.query.ordem as any,
        limite: req.query.limite
          ? parseInt(req.query.limite as string)
          : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      const resultado = await jogadorService.listar(filtros);

      ResponseHelper.success(res, resultado);
    } catch (error: any) {
      this.handleGenericError(res, error, "listar jogadores", {
        arenaId: req.user?.arenaId,
      });
    }
  }

  /**
   * Atualizar jogador
   * PUT /api/jogadores/:id
   */
  async atualizar(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      const dadosValidados = AtualizarJogadorSchema.parse(req.body);
      const jogadorAtualizado = await jogadorService.atualizar(
        id,
        arenaId,
        dadosValidados
      );

      ResponseHelper.success(res, jogadorAtualizado, "Jogador atualizado com sucesso");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return this.handleZodError(res, error);
      }

      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      logger.error("Erro ao atualizar jogador", { jogadorId: req.params.id }, error);
      this.handleGenericError(res, error, "atualizar jogador");
    }
  }

  /**
   * Deletar jogador
   * DELETE /api/jogadores/:id
   */
  async deletar(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      await jogadorService.deletar(id, arenaId);

      logger.info("Jogador deletado", { jogadorId: id, arenaId });

      ResponseHelper.success(res, null, "Jogador deletado com sucesso");
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      logger.error("Erro ao deletar jogador", { jogadorId: req.params.id }, error);
      this.handleGenericError(res, error, "deletar jogador");
    }
  }

  /**
   * Contar total de jogadores
   * GET /api/jogadores/stats/total
   */
  async contarTotal(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const total = await jogadorService.contar(arenaId);

      ResponseHelper.success(res, { total });
    } catch (error: any) {
      this.handleGenericError(res, error, "contar jogadores", {
        arenaId: req.user?.arenaId,
      });
    }
  }

  /**
   * Contar jogadores por nível
   * GET /api/jogadores/stats/por-nivel
   */
  async contarPorNivel(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const contagem = await jogadorService.contarPorNivel(arenaId);

      ResponseHelper.success(res, contagem);
    } catch (error: any) {
      this.handleGenericError(res, error, "contar jogadores por nível", {
        arenaId: req.user?.arenaId,
      });
    }
  }
}

export default new JogadorController();
