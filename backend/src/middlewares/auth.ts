import { Request, Response, NextFunction } from "express";
import admin, { auth } from "../config/firebase";
import { UnauthorizedError } from "../utils/errors";

/**
 * Interface estendida de Request com dados do usuário autenticado
 */
export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    arenaId: string;
    role: string;
  };
}

/**
 * Middleware de autenticação obrigatória
 * Verifica se o token JWT é válido e adiciona os dados do usuário ao request
 */
export const requireAuth = async (
  req: AuthRequest,
  _res: Response, // ✅ ADICIONADO: Parâmetro res
  next: NextFunction
): Promise<void> => {
  try {
    // Extrair token do header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Token de autenticação não fornecido");
    }

    const token = authHeader.split("Bearer ")[1];

    // Verificar token com Firebase Admin
    const decodedToken = await auth.verifyIdToken(token);

    // Buscar dados adicionais do usuário no Firestore
    const adminDoc = await admin
      .firestore()
      .collection("admins")
      .doc(decodedToken.uid)
      .get();

    if (!adminDoc.exists) {
      throw new UnauthorizedError("Usuário não encontrado");
    }

    const adminData = adminDoc.data();

    // Adicionar dados do usuário ao request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || "",
      arenaId: adminData?.arenaId || "",
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
 * Middleware de autenticação opcional
 * Adiciona dados do usuário se o token for válido, mas não bloqueia se não houver token
 */
export const optionalAuth = async (
  req: AuthRequest,
  _res: Response, // ✅ ADICIONADO: Parâmetro res
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // Sem token = continua sem autenticação
      return next();
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(token);

    const adminDoc = await admin
      .firestore()
      .collection("admins")
      .doc(decodedToken.uid)
      .get();

    if (adminDoc.exists) {
      const adminData = adminDoc.data();
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email || "",
        arenaId: adminData?.arenaId || "",
        role: adminData?.role || "admin",
      };
    }

    next();
  } catch (error) {
    // Se houver erro na autenticação opcional, apenas continua sem user
    next();
  }
};

/**
 * Middleware para verificar se o usuário tem uma role específica
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError("Usuário não autenticado"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new UnauthorizedError(
          "Você não tem permissão para acessar este recurso"
        )
      );
    }

    next();
  };
};

/**
 * Middleware para verificar se o usuário tem acesso a uma arena específica
 */
export const requireArenaAccess = (
  req: AuthRequest,
  _res: Response, // ✅ ADICIONADO: Parâmetro res
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new UnauthorizedError("Usuário não autenticado"));
  }

  const arenaId = req.params.arenaId || req.body.arenaId || req.query.arenaId;

  if (!arenaId) {
    return next(new UnauthorizedError("Arena não especificada"));
  }

  if (req.user.arenaId !== arenaId) {
    return next(new UnauthorizedError("Você não tem acesso a esta arena"));
  }

  next();
};
