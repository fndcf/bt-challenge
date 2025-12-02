/**
 * Etapa Routes
 * backend/src/routes/etapas.ts
 *
 * REFATORADO:
 * - Removidas 5 rotas duplicadas
 * - Removidos imports dinâmicos
 * - Todas as rotas delegam para o controller
 * - Organizado por seções lógicas
 */

import { Router } from "express";
import etapaController from "../controllers/EtapaController";
import { requireAuth } from "../middlewares/auth";

const router = Router();

// Middleware de autenticação para todas as rotas
router.use(requireAuth);

// ==================== ROTAS BASE ====================

/**
 * @route   POST /api/etapas
 * @desc    Criar nova etapa
 */
router.post("/", (req, res) => etapaController.criar(req, res));

/**
 * @route   GET /api/etapas
 * @desc    Listar etapas com filtros
 */
router.get("/", (req, res) => etapaController.listar(req, res));

/**
 * @route   GET /api/etapas/stats
 * @desc    Obter estatísticas de etapas
 */
router.get("/stats", (req, res) => etapaController.obterEstatisticas(req, res));

// ==================== CONFRONTOS ELIMINATÓRIOS (rota sem :id primeiro) ====================

/**
 * @route   POST /api/etapas/confrontos-eliminatorios/:confrontoId/resultado
 * @desc    Registrar resultado de confronto eliminatório
 */
router.post("/confrontos-eliminatorios/:confrontoId/resultado", (req, res) =>
  etapaController.registrarResultadoEliminatorio(req, res)
);

// ==================== INSCRIÇÕES ====================

/**
 * @route   POST /api/etapas/:id/inscrever
 * @desc    Inscrever jogador na etapa
 */
router.post("/:id/inscrever", (req, res) =>
  etapaController.inscreverJogador(req, res)
);

/**
 * @route   GET /api/etapas/:id/inscricoes
 * @desc    Listar inscrições da etapa
 */
router.get("/:id/inscricoes", (req, res) =>
  etapaController.listarInscricoes(req, res)
);

/**
 * @route   DELETE /api/etapas/:etapaId/inscricoes/:inscricaoId
 * @desc    Cancelar inscrição
 */
router.delete("/:etapaId/inscricoes/:inscricaoId", (req, res) =>
  etapaController.cancelarInscricao(req, res)
);

/**
 * @route   POST /api/etapas/:id/encerrar-inscricoes
 * @desc    Encerrar inscrições da etapa
 */
router.post("/:id/encerrar-inscricoes", (req, res) =>
  etapaController.encerrarInscricoes(req, res)
);

/**
 * @route   POST /api/etapas/:id/reabrir-inscricoes
 * @desc    Reabrir inscrições da etapa
 */
router.post("/:id/reabrir-inscricoes", (req, res) =>
  etapaController.reabrirInscricoes(req, res)
);

// ==================== CHAVES (DUPLA FIXA) ====================

/**
 * @route   POST /api/etapas/:id/gerar-chaves
 * @desc    Gerar chaves da etapa
 */
router.post("/:id/gerar-chaves", (req, res) =>
  etapaController.gerarChaves(req, res)
);

/**
 * @route   DELETE /api/etapas/:id/chaves
 * @desc    Excluir chaves da etapa
 */
router.delete("/:id/chaves", (req, res) =>
  etapaController.excluirChaves(req, res)
);

/**
 * @route   GET /api/etapas/:id/duplas
 * @desc    Buscar duplas da etapa
 */
router.get("/:id/duplas", (req, res) => etapaController.buscarDuplas(req, res));

/**
 * @route   GET /api/etapas/:id/grupos
 * @desc    Buscar grupos da etapa
 */
router.get("/:id/grupos", (req, res) => etapaController.buscarGrupos(req, res));

/**
 * @route   GET /api/etapas/:id/partidas
 * @desc    Buscar partidas da etapa
 */
router.get("/:id/partidas", (req, res) =>
  etapaController.buscarPartidas(req, res)
);

// ==================== FASE ELIMINATÓRIA (DUPLA FIXA) ====================

/**
 * @route   POST /api/etapas/:id/gerar-eliminatoria
 * @desc    Gerar fase eliminatória
 */
router.post("/:id/gerar-eliminatoria", (req, res) =>
  etapaController.gerarFaseEliminatoria(req, res)
);

/**
 * @route   GET /api/etapas/:id/confrontos-eliminatorios
 * @desc    Buscar confrontos eliminatórios da etapa
 */
router.get("/:id/confrontos-eliminatorios", (req, res) =>
  etapaController.buscarConfrontosEliminatorios(req, res)
);

/**
 * @route   DELETE /api/etapas/:id/cancelar-eliminatoria
 * @desc    Cancelar fase eliminatória
 */
router.delete("/:id/cancelar-eliminatoria", (req, res) =>
  etapaController.cancelarFaseEliminatoria(req, res)
);

/**
 * @route   POST /api/etapas/:id/encerrar
 * @desc    Encerrar etapa
 */
router.post("/:id/encerrar", (req, res) =>
  etapaController.encerrarEtapa(req, res)
);

// ==================== REI DA PRAIA ====================

/**
 * @route   POST /api/etapas/:id/rei-da-praia/gerar-chaves
 * @desc    Gerar chaves no formato Rei da Praia
 */
router.post("/:id/rei-da-praia/gerar-chaves", (req, res) =>
  etapaController.gerarChavesReiDaPraia(req, res)
);

/**
 * @route   GET /api/etapas/:id/rei-da-praia/grupos
 * @desc    Buscar grupos da etapa Rei da Praia
 */
router.get("/:id/rei-da-praia/grupos", (req, res) =>
  etapaController.buscarGruposReiDaPraia(req, res)
);

/**
 * @route   GET /api/etapas/:id/rei-da-praia/jogadores
 * @desc    Buscar jogadores/estatísticas da etapa Rei da Praia
 */
router.get("/:id/rei-da-praia/jogadores", (req, res) =>
  etapaController.buscarJogadoresReiDaPraia(req, res)
);

/**
 * @route   GET /api/etapas/:id/rei-da-praia/partidas
 * @desc    Buscar partidas da etapa Rei da Praia
 */
router.get("/:id/rei-da-praia/partidas", (req, res) =>
  etapaController.buscarPartidasReiDaPraia(req, res)
);

/**
 * @route   POST /api/etapas/:id/rei-da-praia/partidas/:partidaId/resultado
 * @desc    Registrar resultado de partida Rei da Praia
 */
router.post("/:id/rei-da-praia/partidas/:partidaId/resultado", (req, res) =>
  etapaController.registrarResultadoReiDaPraia(req, res)
);

/**
 * @route   GET /api/etapas/:id/rei-da-praia/confrontos
 * @desc    Buscar confrontos eliminatórios Rei da Praia
 */
router.get("/:id/rei-da-praia/confrontos", (req, res) =>
  etapaController.buscarConfrontosReiDaPraia(req, res)
);

/**
 * @route   POST /api/etapas/:id/rei-da-praia/gerar-eliminatoria
 * @desc    Gerar fase eliminatória Rei da Praia
 */
router.post("/:id/rei-da-praia/gerar-eliminatoria", (req, res) =>
  etapaController.gerarEliminatoriaReiDaPraia(req, res)
);

/**
 * @route   POST /api/etapas/:id/rei-da-praia/cancelar-eliminatoria
 * @desc    Cancelar fase eliminatória Rei da Praia
 */
router.post("/:id/rei-da-praia/cancelar-eliminatoria", (req, res) =>
  etapaController.cancelarEliminatoriaReiDaPraia(req, res)
);

// ==================== ROTAS GENÉRICAS (devem ficar por último) ====================

/**
 * @route   GET /api/etapas/:id
 * @desc    Buscar etapa por ID
 */
router.get("/:id", (req, res) => etapaController.buscarPorId(req, res));

/**
 * @route   PUT /api/etapas/:id
 * @desc    Atualizar etapa
 */
router.put("/:id", (req, res) => etapaController.atualizar(req, res));

/**
 * @route   DELETE /api/etapas/:id
 * @desc    Deletar etapa
 */
router.delete("/:id", (req, res) => etapaController.deletar(req, res));

export default router;
