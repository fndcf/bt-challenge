import { Router } from "express";
import { arenaController } from "../controllers/ArenaController";
import { requireAuth } from "../middlewares/auth"; // ✅ REMOVIDO: optionalAuth (não usado)
import { body } from "express-validator";
import { runValidations, isValidSlug } from "../middlewares/validation";

const router = Router();

/**
 * Validações para criação de arena
 */
const createArenaValidation = [
  body("nome")
    .trim()
    .notEmpty()
    .withMessage("Nome é obrigatório")
    .isLength({ min: 3, max: 100 })
    .withMessage("Nome deve ter entre 3 e 100 caracteres"),

  body("slug")
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("Slug deve ter entre 3 e 50 caracteres")
    .custom(isValidSlug),

  body("adminEmail")
    .trim()
    .notEmpty()
    .withMessage("Email do administrador é obrigatório")
    .isEmail()
    .withMessage("Email inválido"),

  body("adminPassword")
    .notEmpty()
    .withMessage("Senha é obrigatória")
    .isLength({ min: 6 })
    .withMessage("Senha deve ter no mínimo 6 caracteres"),
];

/**
 * Validações para atualização de arena
 */
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
    .custom(isValidSlug),
];

/**
 * @route   POST /api/arenas
 * @desc    Criar nova arena
 * @access  Public
 */
router.post(
  "/",
  runValidations(createArenaValidation),
  arenaController.create.bind(arenaController)
);

/**
 * @route   GET /api/arenas
 * @desc    Listar todas as arenas
 * @access  Public
 */
router.get("/", arenaController.list.bind(arenaController));

/**
 * @route   GET /api/arenas/me
 * @desc    Obter arena do admin autenticado
 * @access  Private
 */
router.get(
  "/me",
  requireAuth, // ✅ CORRETO: Middleware com assinatura completa
  arenaController.getMyArena.bind(arenaController)
);

/**
 * @route   GET /api/arenas/check-slug/:slug
 * @desc    Verificar disponibilidade de slug
 * @access  Public
 */
router.get(
  "/check-slug/:slug",
  arenaController.checkSlug.bind(arenaController)
);

/**
 * @route   GET /api/arenas/:id
 * @desc    Buscar arena por ID
 * @access  Public
 */
router.get("/:id", arenaController.getById.bind(arenaController));

/**
 * @route   GET /api/arenas/slug/:slug
 * @desc    Buscar arena por slug
 * @access  Public
 */
router.get("/slug/:slug", arenaController.getBySlug.bind(arenaController));

/**
 * @route   PUT /api/arenas/:id
 * @desc    Atualizar arena
 * @access  Private
 */
router.put(
  "/:id",
  requireAuth, // ✅ CORRETO: Middleware com assinatura completa
  runValidations(updateArenaValidation),
  arenaController.update.bind(arenaController)
);

/**
 * @route   DELETE /api/arenas/:id
 * @desc    Desativar arena
 * @access  Private
 */
router.delete(
  "/:id",
  requireAuth, // ✅ CORRETO: Middleware com assinatura completa
  arenaController.deactivate.bind(arenaController)
);

export default router;
