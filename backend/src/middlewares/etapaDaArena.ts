/**
 * Só deixa alterar etapa da própria arena
 */

import { NextFunction, Response } from "express";
import etapaService from "../services/EtapaService";
import { ResponseHelper } from "../utils/responseHelper";
import { AuthRequest } from "./auth";

/**
 * Para `router.param("id", ...)`: vale para toda rota de etapa que grava,
 * inclusive as novas. As consultas já filtram pela arena.
 */
export const exigirEtapaDaArena = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
  etapaId: string
): Promise<void> => {
  try {
    const arenaId = req.user?.arenaId;

    // Sem login, quem responde é a própria rota (401)
    if (req.method === "GET" || !arenaId) return next();

    const etapa = await etapaService.buscarPorId(etapaId, arenaId);

    if (!etapa) {
      ResponseHelper.notFound(res, "Etapa não encontrada");
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};
