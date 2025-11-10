import { Router } from "express";
import { body } from "express-validator";
import { asyncHandler } from "../middlewares/errorHandler";
import { validate } from "../middlewares/validation";
import { authLimiter } from "../middlewares/rateLimiter";
import { ResponseHelper } from "../utils/responseHelper";

/**
 * Rotas de Autenticação
 * Este é um template/exemplo de como estruturar rotas
 * A implementação completa virá nas próximas etapas
 */

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Registrar novo administrador de arena
 * @access  Public (mas pode ser restrito depois)
 */
router.post(
  "/register",
  authLimiter, // Rate limiting
  [
    body("email").isEmail().normalizeEmail().withMessage("Email inválido"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Senha deve ter no mínimo 6 caracteres"),
    body("nomeArena")
      .trim()
      .notEmpty()
      .withMessage("Nome da arena é obrigatório"),
    body("slug")
      .trim()
      .notEmpty()
      .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .withMessage(
        "Slug inválido (apenas letras minúsculas, números e hífens)"
      ),
  ],
  validate, // Validar dados
  asyncHandler(async (req, res) => {
    // TODO: Implementar lógica de registro
    // Por enquanto, apenas resposta de exemplo

    ResponseHelper.created(res, {
      message: "Administrador registrado com sucesso",
      arena: {
        nome: req.body.nomeArena,
        slug: req.body.slug,
        url: `www.challengebt.com.br/${req.body.slug}`,
      },
    });
  })
);

/**
 * @route   POST /api/auth/login
 * @desc    Login de administrador
 * @access  Public
 */
router.post(
  "/login",
  authLimiter,
  [
    body("email").isEmail().normalizeEmail().withMessage("Email inválido"),
    body("password").notEmpty().withMessage("Senha é obrigatória"),
  ],
  validate,
  asyncHandler(async (req, res) => {
    // TODO: Implementar lógica de login

    ResponseHelper.success(res, {
      message: "Login realizado com sucesso",
      token: "exemplo-token-jwt",
      user: {
        email: req.body.email,
        arenaId: "exemplo-arena-id",
      },
    });
  })
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout de administrador
 * @access  Private
 */
router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    // TODO: Implementar lógica de logout

    ResponseHelper.success(res, {
      message: "Logout realizado com sucesso",
    });
  })
);

/**
 * @route   GET /api/auth/me
 * @desc    Obter dados do usuário autenticado
 * @access  Private
 */
router.get(
  "/me",
  // authenticate, // Middleware de autenticação (adicionar quando implementar)
  asyncHandler(async (req, res) => {
    // TODO: Implementar lógica para obter dados do usuário

    ResponseHelper.success(res, {
      user: {
        uid: "exemplo-uid",
        email: "admin@arena.com",
        arenaId: "exemplo-arena-id",
        role: "admin",
      },
    });
  })
);

export default router;
