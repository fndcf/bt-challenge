/**
 * Arena Controller
 * backend/src/controllers/ArenaController.ts
 */

import { Request, Response, NextFunction } from "express";
import { arenaService } from "../services/ArenaService";
import { ResponseHelper } from "../utils/responseHelper";
import { AuthRequest } from "../middlewares/auth";
import logger from "../utils/logger";

export class ArenaController {
  /**
   * Criar nova arena
   * POST /api/arenas
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { nome, slug, adminEmail } = req.body;

      logger.info("Criando nova arena", { nome, slug, adminEmail });

      const result = await arenaService.createArena(req.body);

      logger.info("Arena criada com sucesso", {
        arenaId: result.arena.id,
        nome,
        slug,
      });

      return ResponseHelper.created(
        res,
        {
          arena: result.arena.toObject(),
          adminUid: result.adminUid,
          url: result.arena.getPublicUrl(),
        },
        result.message
      );
    } catch (error) {
      logger.error(
        "Erro ao criar arena",
        { nome: req.body.nome },
        error as Error
      );
      return next(error);
    }
  }

  /**
   * Buscar arena por ID
   * GET /api/arenas/:id
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const arena = await arenaService.getArenaById(id);

      return ResponseHelper.success(res, arena.toObject());
    } catch (error) {
      logger.error(
        "Erro ao buscar arena por ID",
        { arenaId: req.params.id },
        error as Error
      );
      return next(error);
    }
  }

  /**
   * Buscar arena por slug
   * GET /api/arenas/slug/:slug
   */
  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const arena = await arenaService.getArenaBySlug(slug);

      return ResponseHelper.success(res, arena.toObject());
    } catch (error) {
      logger.error(
        "Erro ao buscar arena por slug",
        { slug: req.params.slug },
        error as Error
      );
      return next(error);
    }
  }

  /**
   * Obter arena do admin autenticado
   * GET /api/arenas/me
   */
  async getMyArena(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user?.uid) {
        logger.warn("Tentativa de acesso sem autenticação", {
          endpoint: "/api/arenas/me",
        });
        return ResponseHelper.unauthorized(res);
      }

      const arena = await arenaService.getAdminArena(req.user.uid);

      return ResponseHelper.success(res, arena.toObject());
    } catch (error) {
      logger.error(
        "Erro ao buscar arena do admin",
        { adminUid: req.user?.uid },
        error as Error
      );
      return next(error);
    }
  }

  /**
   * Listar todas as arenas
   * GET /api/arenas
   */
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const arenas = await arenaService.listArenas();

      return ResponseHelper.success(res, {
        arenas: arenas.map((arena) => arena.toObject()),
        total: arenas.length,
      });
    } catch (error) {
      logger.error("Erro ao listar arenas", {}, error as Error);
      return next(error);
    }
  }

  /**
   * Atualizar arena
   * PUT /api/arenas/:id
   */
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!req.user?.uid) {
        logger.warn("Tentativa de atualização sem autenticação", {
          arenaId: id,
        });
        return ResponseHelper.unauthorized(res);
      }

      logger.info("Atualizando arena", { arenaId: id, adminUid: req.user.uid });

      const arena = await arenaService.updateArena(id, req.user.uid, req.body);

      logger.info("Arena atualizada com sucesso", { arenaId: id });

      return ResponseHelper.success(
        res,
        arena.toObject(),
        "Arena atualizada com sucesso"
      );
    } catch (error) {
      logger.error(
        "Erro ao atualizar arena",
        { arenaId: req.params.id },
        error as Error
      );
      return next(error);
    }
  }

  /**
   * Desativar arena
   * DELETE /api/arenas/:id
   */
  async deactivate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!req.user?.uid) {
        logger.warn("Tentativa de desativação sem autenticação", {
          arenaId: id,
        });
        return ResponseHelper.unauthorized(res);
      }

      logger.info("Desativando arena", { arenaId: id, adminUid: req.user.uid });

      await arenaService.deactivateArena(id, req.user.uid);

      logger.info("Arena desativada com sucesso", { arenaId: id });

      return ResponseHelper.success(res, null, "Arena desativada com sucesso");
    } catch (error) {
      logger.error(
        "Erro ao desativar arena",
        { arenaId: req.params.id },
        error as Error
      );
      return next(error);
    }
  }

  /**
   * Verificar disponibilidade de slug
   * GET /api/arenas/check-slug/:slug
   */
  async checkSlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const available = await arenaService.isSlugAvailable(slug);

      return ResponseHelper.success(res, {
        slug,
        available,
        message: available ? "Slug disponível" : "Slug já está em uso",
      });
    } catch (error) {
      logger.error(
        "Erro ao verificar slug",
        { slug: req.params.slug },
        error as Error
      );
      return next(error);
    }
  }
}

export const arenaController = new ArenaController();
