import { Router } from "express";
import jogadorController from "../controllers/JogadorController";
import { authenticate } from "../middlewares/auth";

/**
 * Rotas de Jogadores
 * Todas as rotas requerem autenticação
 */
const router = Router();

// Middleware de autenticação
router.use(authenticate);

/**
 * @route   POST /api/jogadores
 * @desc    Criar novo jogador
 * @access  Private (Admin da arena)
 */
router.post("/", (req, res) => jogadorController.criar(req, res));

/**
 * @route   GET /api/jogadores
 * @desc    Listar jogadores com filtros
 * @access  Private (Admin da arena)
 * @query   nivel, status, genero, busca, ordenarPor, ordem, limite, offset
 */
router.get("/", (req, res) => jogadorController.listar(req, res));

/**
 * @route   GET /api/jogadores/stats/total
 * @desc    Contar total de jogadores
 * @access  Private (Admin da arena)
 */
router.get("/stats/total", (req, res) =>
  jogadorController.contarTotal(req, res)
);

/**
 * @route   GET /api/jogadores/stats/por-nivel
 * @desc    Contar jogadores por nível
 * @access  Private (Admin da arena)
 */
router.get("/stats/por-nivel", (req, res) =>
  jogadorController.contarPorNivel(req, res)
);

/**
 * @route   GET /api/jogadores/:id
 * @desc    Buscar jogador por ID
 * @access  Private (Admin da arena)
 */
router.get("/:id", (req, res) => jogadorController.buscarPorId(req, res));

/**
 * @route   PUT /api/jogadores/:id
 * @desc    Atualizar jogador
 * @access  Private (Admin da arena)
 */
router.put("/:id", (req, res) => jogadorController.atualizar(req, res));

/**
 * @route   DELETE /api/jogadores/:id
 * @desc    Deletar jogador
 * @access  Private (Admin da arena)
 */
router.delete("/:id", (req, res) => jogadorController.deletar(req, res));

export default router;
