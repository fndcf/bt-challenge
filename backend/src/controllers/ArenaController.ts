import { Request, Response, NextFunction } from "express";
import { arenaService } from "../services/ArenaService";
import { ResponseHelper } from "../utils/responseHelper";
import { AuthRequest } from "../middlewares/auth";

/**
 * Controller de Arena
 * Gerencia requisições HTTP relacionadas a arenas
 */
export class ArenaController {
  /**
   * Criar nova arena
   * POST /api/arenas
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { nome, slug, adminEmail, adminPassword } = req.body;

      const result = await arenaService.createArena({
        nome,
        slug,
        adminEmail,
        adminPassword,
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
      next(error);
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
      next(error);
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
      next(error);
    }
  }

  /**
   * Obter arena do admin autenticado
   * GET /api/arenas/me
   */
  async getMyArena(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user?.uid) {
        return ResponseHelper.unauthorized(res);
      }

      const arena = await arenaService.getAdminArena(req.user.uid);

      return ResponseHelper.success(res, arena.toObject());
    } catch (error) {
      next(error);
    }
  }

  /**
   * Listar todas as arenas
   * GET /api/arenas
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const arenas = await arenaService.listArenas();

      return ResponseHelper.success(res, {
        arenas: arenas.map((arena) => arena.toObject()),
        total: arenas.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualizar arena
   * PUT /api/arenas/:id
   */
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!req.user?.uid) {
        return ResponseHelper.unauthorized(res);
      }

      const arena = await arenaService.updateArena(
        id,
        req.user.uid,
        updateData
      );

      return ResponseHelper.success(
        res,
        arena.toObject(),
        "Arena atualizada com sucesso"
      );
    } catch (error) {
      next(error);
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
        return ResponseHelper.unauthorized(res);
      }

      await arenaService.deactivateArena(id, req.user.uid);

      return ResponseHelper.success(res, null, "Arena desativada com sucesso");
    } catch (error) {
      next(error);
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
      next(error);
    }
  }
}

// Exportar instância única
export const arenaController = new ArenaController();
