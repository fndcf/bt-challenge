import { Router } from "express";
import { body, param } from "express-validator";
import { arenaController } from "../controllers/ArenaController";
import { asyncHandler } from "../middlewares/errorHandler";
import { authenticate, optionalAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import { createLimiter } from "../middlewares/rateLimiter";

const router = Router();

/**
 * Validações
 */
const createArenaValidation = [
  body("nome")
    .trim()
    .notEmpty()
    .withMessage("Nome da arena é obrigatório")
    .isLength({ min: 3, max: 100 })
    .withMessage("Nome deve ter entre 3 e 100 caracteres"),

  body("slug")
    .trim()
    .notEmpty()
    .withMessage("Slug é obrigatório")
    .isLength({ min: 3, max: 50 })
    .withMessage("Slug deve ter entre 3 e 50 caracteres")
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage("Slug deve conter apenas letras minúsculas, números e hífens"),

  body("adminEmail")
    .trim()
    .notEmpty()
    .withMessage("Email do administrador é obrigatório")
    .isEmail()
    .normalizeEmail()
    .withMessage("Email inválido"),

  body("adminPassword")
    .notEmpty()
    .withMessage("Senha é obrigatória")
    .isLength({ min: 6 })
    .withMessage("Senha deve ter no mínimo 6 caracteres"),
];

const updateArenaValidation = [
  body("nome")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Nome deve ter entre 3 e 100 caracteres"),

  body("slug")
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("Slug deve ter entre 3 e 50 caracteres")
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage("Slug deve conter apenas letras minúsculas, números e hífens"),
];

/**
 * @route   POST /api/arenas
 * @desc    Criar nova arena
 * @access  Public
 */
router.post(
  "/",
  createLimiter, // Rate limiting
  createArenaValidation,
  validate,
  asyncHandler(arenaController.create.bind(arenaController))
);

/**
 * @route   GET /api/arenas
 * @desc    Listar todas as arenas
 * @access  Public
 */
router.get("/", asyncHandler(arenaController.list.bind(arenaController)));

/**
 * @route   GET /api/arenas/me
 * @desc    Obter arena do admin autenticado
 * @access  Private (Admin)
 */
router.get(
  "/me",
  authenticate,
  asyncHandler(arenaController.getMyArena.bind(arenaController))
);

/**
 * @route   GET /api/arenas/check-slug/:slug
 * @desc    Verificar disponibilidade de slug
 * @access  Public
 */
router.get(
  "/check-slug/:slug",
  param("slug")
    .trim()
    .notEmpty()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  validate,
  asyncHandler(arenaController.checkSlug.bind(arenaController))
);

/**
 * @route   GET /api/arenas/slug/:slug
 * @desc    Buscar arena por slug
 * @access  Public
 */
router.get(
  "/slug/:slug",
  param("slug").trim().notEmpty(),
  validate,
  asyncHandler(arenaController.getBySlug.bind(arenaController))
);

/**
 * @route   GET /api/arenas/:id
 * @desc    Buscar arena por ID
 * @access  Public
 */
router.get(
  "/:id",
  param("id").trim().notEmpty(),
  validate,
  asyncHandler(arenaController.getById.bind(arenaController))
);

/**
 * @route   PUT /api/arenas/:id
 * @desc    Atualizar arena
 * @access  Private (Admin da arena)
 */
router.put(
  "/:id",
  authenticate,
  param("id").trim().notEmpty(),
  updateArenaValidation,
  validate,
  asyncHandler(arenaController.update.bind(arenaController))
);

/**
 * @route   DELETE /api/arenas/:id
 * @desc    Desativar arena
 * @access  Private (Admin da arena)
 */
router.delete(
  "/:id",
  authenticate,
  param("id").trim().notEmpty(),
  validate,
  asyncHandler(arenaController.deactivate.bind(arenaController))
);

export default router;
