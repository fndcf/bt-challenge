/**
 * Controller para gerenciar jogadores
 */

import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { BaseController } from "./BaseController";
import { ResponseHelper } from "../utils/responseHelper";
import jogadorService from "../services/JogadorService";
import excelJogadorService from "../services/ExcelJogadorService";
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

      if (
        this.handleBusinessError(
          res,
          error,
          BaseController.ERROR_PATTERNS.CONFLICT
        )
      ) {
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
        ResponseHelper.notFound(res, "Jogador não encontrado");
        return;
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

      ResponseHelper.success(
        res,
        jogadorAtualizado,
        "Jogador atualizado com sucesso"
      );
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return this.handleZodError(res, error);
      }

      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      logger.error(
        "Erro ao atualizar jogador",
        { jogadorId: req.params.id },
        error
      );
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

      logger.error(
        "Erro ao deletar jogador",
        { jogadorId: req.params.id },
        error
      );
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
  /**
   * Exportar jogadores para Excel
   * GET /api/jogadores/exportar-excel
   */
  async exportarExcel(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;

      logger.info("Exportando jogadores para Excel", { arenaId });

      const buffer = await excelJogadorService.exportarParaExcel(arenaId);

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="jogadores.xlsx"'
      );
      res.send(buffer);
    } catch (error: any) {
      logger.error("Erro ao exportar jogadores", { arenaId: req.user?.arenaId }, error);
      this.handleGenericError(res, error, "exportar jogadores");
    }
  }

  /**
   * Importar jogadores de Excel
   * POST /api/jogadores/importar-excel
   */
  async importarExcel(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId, uid } = req.user;
      const file = req.file;

      if (!file) {
        ResponseHelper.badRequest(res, "Nenhum arquivo enviado");
        return;
      }

      logger.info("Importando jogadores de Excel", {
        arenaId,
        fileName: file.originalname,
        fileSize: file.size,
      });

      const resultado = await excelJogadorService.importarDeExcel(
        arenaId,
        uid,
        file.buffer
      );

      ResponseHelper.success(
        res,
        resultado,
        `${resultado.criados} jogador(es) importado(s) com sucesso`
      );
    } catch (error: any) {
      logger.error("Erro ao importar jogadores", { arenaId: req.user?.arenaId }, error);

      // Erros de validação retornam 400
      if (
        error.message?.includes("obrigatórias ausentes") ||
        error.message?.includes("Erros de validação") ||
        error.message?.includes("já existem na arena") ||
        error.message?.includes("duplicados na planilha") ||
        error.message?.includes("não contém dados") ||
        error.message?.includes("vazia ou formato")
      ) {
        ResponseHelper.badRequest(res, error.message);
        return;
      }

      this.handleGenericError(res, error, "importar jogadores");
    }
  }
}

export default new JogadorController();
