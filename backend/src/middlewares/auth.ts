import { Request, Response, NextFunction } from "express";
import { auth, db } from "../config/firebase";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";
import { COLLECTIONS } from "../config/firestore";

/**
 * Interface para adicionar dados do usuário ao Request
 */
export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    arenaId?: string;
    role?: string;
  };
}

/**
 * Middleware de autenticação
 * Verifica o token JWT do Firebase no header Authorization
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extrair token do header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Token não fornecido");
    }

    const token = authHeader.split("Bearer ")[1];

    if (!token) {
      throw new UnauthorizedError("Token inválido");
    }

    // Verificar token com Firebase
    const decodedToken = await auth.verifyIdToken(token);

    // Buscar dados adicionais do admin no Firestore
    const adminDoc = await db
      .collection(COLLECTIONS.ADMINS)
      .doc(decodedToken.uid)
      .get();

    if (!adminDoc.exists) {
      throw new UnauthorizedError("Usuário não autorizado");
    }

    const adminData = adminDoc.data();

    // Adicionar dados do usuário ao request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || "",
      arenaId: adminData?.arenaId,
      role: adminData?.role || "admin",
    };

    next();
  } catch (error: any) {
    if (error.code === "auth/id-token-expired") {
      return next(new UnauthorizedError("Token expirado"));
    }
    if (error.code === "auth/argument-error") {
      return next(new UnauthorizedError("Token inválido"));
    }
    next(error);
  }
};

/**
 * Middleware para verificar se o usuário é admin de uma arena específica
 */
export const checkArenaAccess = (arenaIdParam: string = "arenaId") => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Autenticação necessária");
      }

      // Pegar arenaId do param, body ou query
      const arenaId =
        req.params[arenaIdParam] || req.body.arenaId || req.query.arenaId;

      if (!arenaId) {
        throw new ForbiddenError("Arena não especificada");
      }

      // Verificar se o admin tem acesso a essa arena
      if (req.user.arenaId !== arenaId && req.user.role !== "superAdmin") {
        throw new ForbiddenError("Acesso negado a esta arena");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware para verificar se é super admin
 */
export const requireSuperAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError("Autenticação necessária");
    }

    if (req.user.role !== "superAdmin") {
      throw new ForbiddenError("Apenas super administradores têm acesso");
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware opcional de autenticação
 * Adiciona dados do usuário se o token existir, mas não falha se não existir
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split("Bearer ")[1];
      const decodedToken = await auth.verifyIdToken(token);

      const adminDoc = await db
        .collection(COLLECTIONS.ADMINS)
        .doc(decodedToken.uid)
        .get();

      if (adminDoc.exists) {
        const adminData = adminDoc.data();
        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email || "",
          arenaId: adminData?.arenaId,
          role: adminData?.role || "admin",
        };
      }
    }

    next();
  } catch (error) {
    // Se houver erro, continua sem autenticar
    next();
  }
};
