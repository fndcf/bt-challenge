import { Router } from "express";
import jogadorController from "../controllers/JogadorController";
import { requireAuth } from "../middlewares/auth";
import { uploadExcel } from "../middlewares/upload";

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
router.post("/", (req, res) => jogadorController.criar(req, res));

/**
 * @route   GET /api/jogadores
 * @desc    Listar jogadores com filtros
 * @access  Private
 */
router.get("/", (req, res) => jogadorController.listar(req, res));

/**
 * @route   GET /api/jogadores/exportar-excel
 * @desc    Exportar jogadores para Excel
 * @access  Private
 */
router.get("/exportar-excel", (req, res) =>
  jogadorController.exportarExcel(req, res)
);

/**
 * @route   POST /api/jogadores/importar-excel
 * @desc    Importar jogadores de Excel
 * @access  Private
 */
router.post("/importar-excel", uploadExcel, (req, res) =>
  jogadorController.importarExcel(req, res)
);

/**
 * @route   GET /api/jogadores/stats/total
 * @desc    Contar total de jogadores
 * @access  Private
 */
router.get("/stats/total", (req, res) =>
  jogadorController.contarTotal(req, res)
);

/**
 * @route   GET /api/jogadores/stats/por-nivel
 * @desc    Contar jogadores por nível
 * @access  Private
 */
router.get("/stats/por-nivel", (req, res) =>
  jogadorController.contarPorNivel(req, res)
);

/**
 * @route   GET /api/jogadores/:id
 * @desc    Buscar jogador por ID
 * @access  Private
 */
router.get("/:id", (req, res) => jogadorController.buscarPorId(req, res));

/**
 * @route   PUT /api/jogadores/:id
 * @desc    Atualizar jogador
 * @access  Private
 */
router.put("/:id", (req, res) => jogadorController.atualizar(req, res));

/**
 * @route   DELETE /api/jogadores/:id
 * @desc    Deletar jogador
 * @access  Private
 */
router.delete("/:id", (req, res) => jogadorController.deletar(req, res));

export default router;
