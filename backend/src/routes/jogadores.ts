import { Router } from "express";
import jogadorController from "../controllers/JogadorController";
import { requireAuth } from "../middlewares/auth";

const router = Router();

/**
 * Todas as rotas de jogadores requerem autenticação
 */
router.use(requireAuth);

/**
 * @route   POST /api/jogadores
 * @desc    Criar novo jogador
 * @access  Private
 */
router.post("/", jogadorController.criar);

/**
 * @route   GET /api/jogadores
 * @desc    Listar jogadores com filtros
 * @access  Private
 */
router.get("/", jogadorController.listar);

/**
 * @route   GET /api/jogadores/stats/total
 * @desc    Contar total de jogadores
 * @access  Private
 */
router.get("/stats/total", jogadorController.contarTotal);

/**
 * @route   GET /api/jogadores/stats/por-nivel
 * @desc    Contar jogadores por nível
 * @access  Private
 */
router.get("/stats/por-nivel", jogadorController.contarPorNivel);

/**
 * @route   GET /api/jogadores/:id
 * @desc    Buscar jogador por ID
 * @access  Private
 */
router.get("/:id", jogadorController.buscarPorId);

/**
 * @route   PUT /api/jogadores/:id
 * @desc    Atualizar jogador
 * @access  Private
 */
router.put("/:id", jogadorController.atualizar);

/**
 * @route   DELETE /api/jogadores/:id
 * @desc    Deletar jogador
 * @access  Private
 */
router.delete("/:id", jogadorController.deletar);

export default router;
