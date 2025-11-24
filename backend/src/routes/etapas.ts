import { Router } from "express";
import etapaController from "../controllers/EtapaController";
import { AuthRequest, requireAuth } from "../middlewares/auth";

/**
 * Rotas de Etapas
 * Todas as rotas requerem autenticação
 */
const router = Router();

// Middleware de autenticação
router.use(requireAuth);

/**
 * @route   POST /api/etapas
 * @desc    Criar nova etapa
 * @access  Private (Admin da arena)
 */
router.post("/", (req, res) => etapaController.criar(req, res));

/**
 * @route   GET /api/etapas
 * @desc    Listar etapas com filtros
 * @access  Private (Admin da arena)
 * @query   status, ordenarPor, ordem, limite, offset
 */
router.get("/", (req, res) => etapaController.listar(req, res));

/**
 * @route   GET /api/etapas/stats
 * @desc    Obter estatísticas de etapas
 * @access  Private (Admin da arena)
 * IMPORTANTE: Esta rota DEVE vir ANTES de /:id
 */
router.get("/stats", (req, res) => etapaController.obterEstatisticas(req, res));

/**
 * @route   POST /api/etapas/:id/inscrever
 * @desc    Inscrever jogador na etapa
 * @access  Private (Admin da arena)
 * IMPORTANTE: Rota específica ANTES de /:id genérico
 */
router.post("/:id/inscrever", (req, res) =>
  etapaController.inscreverJogador(req, res)
);

/**
 * @route   GET /api/etapas/:id/inscricoes
 * @desc    Listar inscrições da etapa
 * @access  Private (Admin da arena)
 * IMPORTANTE: Rota específica ANTES de /:id genérico
 */
router.get("/:id/inscricoes", (req, res) =>
  etapaController.listarInscricoes(req, res)
);

/**
 * @route   DELETE /api/etapas/:etapaId/inscricoes/:inscricaoId
 * @desc    Cancelar inscrição
 * @access  Private (Admin da arena)
 * IMPORTANTE: Rota específica ANTES de /:id genérico
 */
router.delete("/:etapaId/inscricoes/:inscricaoId", (req, res) =>
  etapaController.cancelarInscricao(req, res)
);

/**
 * @route   POST /api/etapas/:id/gerar-chaves
 * @desc    Gerar chaves da etapa
 * @access  Private (Admin da arena)
 * IMPORTANTE: Rota específica ANTES de /:id genérico
 */
router.post("/:id/gerar-chaves", (req, res) =>
  etapaController.gerarChaves(req, res)
);

/**
 * @route   POST /api/etapas/:id/encerrar-inscricoes
 * @desc    Encerrar inscrições da etapa
 * @access  Private (Admin da arena)
 * IMPORTANTE: Rota específica ANTES de /:id genérico
 */
router.post("/:id/encerrar-inscricoes", (req, res) =>
  etapaController.encerrarInscricoes(req, res)
);

/**
 * @route   POST /api/etapas/:id/reabrir-inscricoes
 * @desc    Reabrir inscrições da etapa
 * @access  Private (Admin da arena)
 * IMPORTANTE: Rota específica ANTES de /:id genérico
 */
router.post("/:id/reabrir-inscricoes", (req, res) =>
  etapaController.reabrirInscricoes(req, res)
);

/**
 * @route   DELETE /api/etapas/:id/chaves
 * @desc    Excluir chaves da etapa (duplas, grupos, partidas)
 * @access  Private (Admin da arena)
 * IMPORTANTE: Rota específica ANTES de /:id genérico
 */
router.delete("/:id/chaves", (req, res) =>
  etapaController.excluirChaves(req, res)
);

// ==================== NOVAS ROTAS - FASE ELIMINATÓRIA ====================

/**
 * @route   GET /api/etapas/:id/confrontos-eliminatorios
 * @desc    Buscar confrontos eliminatórios da etapa
 * @access  Private (Admin da arena)
 */
router.get("/:id/confrontos-eliminatorios", async (req: AuthRequest, res) => {
  try {
    const { id: etapaId } = req.params;
    const { arenaId } = req.user!;
    const { fase } = req.query;

    console.log("📥 Buscando confrontos eliminatórios:", {
      etapaId,
      arenaId,
      fase,
    });

    const chaveService = (await import("../services/ChaveService")).default;

    const confrontos = await chaveService.buscarConfrontosEliminatorios(
      etapaId,
      arenaId,
      fase as any
    );

    console.log("✅ Retornando", confrontos?.length || 0, "confrontos");

    // ============= FORMATO CORRETO =============
    // Retornar no formato { data: ... } que o apiClient espera
    res.status(200).json({
      data: confrontos || [],
    });
    // ===========================================
  } catch (error: any) {
    console.error("❌ Erro ao buscar confrontos:", error);
    res.status(500).json({
      error: error.message || "Erro ao buscar confrontos eliminatórios",
    });
  }
});

/**
 * @route   POST /api/etapas/:id/gerar-eliminatoria
 * @desc    Gerar fase eliminatória (mata-mata)
 * @access  Private (Admin da arena)
 */
router.post("/:id/gerar-eliminatoria", async (req: AuthRequest, res) => {
  try {
    const { id: etapaId } = req.params;
    const { arenaId } = req.user!;
    const { classificadosPorGrupo = 2 } = req.body;

    console.log("📥 Gerando fase eliminatória:", {
      etapaId,
      arenaId,
      classificadosPorGrupo,
    });

    const chaveService = (await import("../services/ChaveService")).default;

    await chaveService.gerarFaseEliminatoria(
      etapaId,
      arenaId,
      classificadosPorGrupo
    );

    // ============= FORMATO CORRETO =============
    res.status(200).json({
      data: {
        message: "Fase eliminatória gerada com sucesso",
      },
    });
    // ===========================================
  } catch (error: any) {
    console.error("❌ Erro ao gerar fase eliminatória:", error);
    res.status(500).json({
      error: error.message || "Erro ao gerar fase eliminatória",
    });
  }
});

/**
 * @route   POST /api/etapas/confrontos-eliminatorios/:confrontoId/resultado
 * @desc    Registrar resultado de confronto eliminatório
 * @access  Private (Admin da arena)
 */
router.post(
  "/confrontos-eliminatorios/:confrontoId/resultado",
  async (req: AuthRequest, res) => {
    try {
      const { confrontoId } = req.params;
      const { arenaId } = req.user!;
      const { placar } = req.body;

      console.log("📥 Registrando resultado:", {
        confrontoId,
        arenaId,
        placar,
      });

      const chaveService = (await import("../services/ChaveService")).default;

      await chaveService.registrarResultadoEliminatorio(
        confrontoId,
        arenaId,
        placar
      );

      // ============= FORMATO CORRETO =============
      res.status(200).json({
        data: {
          message: "Resultado registrado com sucesso",
        },
      });
      // ===========================================
    } catch (error: any) {
      console.error("❌ Erro ao registrar resultado:", error);
      res.status(500).json({
        error: error.message || "Erro ao registrar resultado",
      });
    }
  }
);

/**
 * @route   DELETE /api/etapas/:id/cancelar-eliminatoria
 * @desc    Cancelar fase eliminatória
 * @access  Private (Admin da arena)
 */
router.delete("/:id/cancelar-eliminatoria", async (req: AuthRequest, res) => {
  try {
    const { id: etapaId } = req.params;
    const { arenaId } = req.user!;

    console.log("📥 Cancelando fase eliminatória:", { etapaId, arenaId });

    const chaveService = (await import("../services/ChaveService")).default;

    await chaveService.cancelarFaseEliminatoria(etapaId, arenaId);

    res.status(200).json({
      data: {
        message: "Fase eliminatória cancelada com sucesso",
      },
    });
  } catch (error: any) {
    console.error("❌ Erro ao cancelar fase eliminatória:", error);
    res.status(500).json({
      error: error.message || "Erro ao cancelar fase eliminatória",
    });
  }
});

/**
 * @route   POST /api/etapas/:id/encerrar
 * @desc    Encerrar etapa (após final)
 * @access  Private (Admin da arena)
 */
router.post("/:id/encerrar", async (req: AuthRequest, res) => {
  try {
    const { id: etapaId } = req.params;
    const { arenaId } = req.user!;

    console.log("📥 Encerrando etapa:", { etapaId, arenaId });

    const etapaService = (await import("../services/EtapaService")).default;

    await etapaService.encerrarEtapa(etapaId, arenaId);

    res.status(200).json({
      data: {
        message: "Etapa encerrada com sucesso",
      },
    });
  } catch (error: any) {
    console.error("❌ Erro ao encerrar etapa:", error);
    res.status(500).json({
      error: error.message || "Erro ao encerrar etapa",
    });
  }
});

/**
 * @route   POST /api/etapas/:id/gerar-eliminatoria
 * @desc    Gerar fase eliminatória
 * @access  Private (Admin da arena)
 * IMPORTANTE: Rota específica ANTES de /:id genérico
 */
router.post("/:id/gerar-eliminatoria", (req, res) =>
  etapaController.gerarFaseEliminatoria(req, res)
);

/**
 * @route   GET /api/etapas/:id/confrontos-eliminatorios
 * @desc    Buscar confrontos eliminatórios
 * @access  Private (Admin da arena)
 * IMPORTANTE: Rota específica ANTES de /:id genérico
 */
router.get("/:id/confrontos-eliminatorios", (req, res) =>
  etapaController.buscarConfrontosEliminatorios(req, res)
);

/**
 * @route   DELETE /api/etapas/:id/cancelar-eliminatoria
 * @desc    Cancelar/Excluir fase eliminatória
 * @access  Private (Admin da arena)
 * IMPORTANTE: Rota específica ANTES de /:id genérico
 */
router.delete("/:id/cancelar-eliminatoria", (req, res) =>
  etapaController.cancelarFaseEliminatoria(req, res)
);

/**
 * @route   POST /api/etapas/:id/encerrar
 * @desc    Encerrar etapa (marcar como finalizada)
 * @access  Private (Admin da arena)
 * IMPORTANTE: Rota específica ANTES de /:id genérico
 */
router.post("/:id/encerrar", (req, res) =>
  etapaController.encerrarEtapa(req, res)
);

// =============================================================

// ==================== ROTAS REI DA PRAIA ====================

/**
 * @route   POST /api/etapas/:id/rei-da-praia/gerar-chaves
 * @desc    Gerar chaves no formato Rei da Praia
 * @access  Private (Admin da arena)
 */
router.post("/:id/rei-da-praia/gerar-chaves", async (req: AuthRequest, res) => {
  try {
    const { id: etapaId } = req.params;
    const { arenaId } = req.user!;

    console.log("📥 Gerando chaves Rei da Praia:", { etapaId, arenaId });

    const reiDaPraiaService = (await import("../services/ReiDaPraiaService"))
      .default;

    const resultado = await reiDaPraiaService.gerarChaves(etapaId, arenaId);

    res.status(200).json({
      data: {
        message: "Chaves Rei da Praia geradas com sucesso",
        jogadores: resultado.jogadores.length,
        grupos: resultado.grupos.length,
        partidas: resultado.partidas.length,
      },
    });
  } catch (error: any) {
    console.error("❌ Erro ao gerar chaves Rei da Praia:", error);
    res.status(500).json({
      error: error.message || "Erro ao gerar chaves Rei da Praia",
    });
  }
});

/**
 * @route   GET /api/etapas/:id/rei-da-praia/grupos
 * @desc    Buscar grupos da etapa Rei da Praia
 * @access  Private (Admin da arena)
 */
router.get("/:id/rei-da-praia/grupos", async (req: AuthRequest, res) => {
  try {
    const { id: etapaId } = req.params;
    const { arenaId } = req.user!;

    console.log("📥 Buscando grupos Rei da Praia:", { etapaId, arenaId });

    const { db } = await import("../config/firebase");

    const snapshot = await db
      .collection("grupos")
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .orderBy("ordem", "asc")
      .get();

    const grupos = snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id, // ✅ COLOCAR DEPOIS para sobrescrever o campo vazio
    }));

    console.log(`✅ ${grupos.length} grupos encontrados`);

    res.status(200).json({
      data: grupos,
    });
  } catch (error: any) {
    console.error("❌ Erro ao buscar grupos:", error);
    res.status(500).json({
      error: error.message || "Erro ao buscar grupos",
    });
  }
});

/**
 * @route   GET /api/etapas/:id/rei-da-praia/confrontos
 * @desc    Buscar confrontos eliminatórios Rei da Praia
 * @access  Private (Admin da arena)
 */
router.get("/:id/rei-da-praia/confrontos", async (req: AuthRequest, res) => {
  try {
    const { id: etapaId } = req.params;
    const { arenaId } = req.user!;

    console.log("📥 Buscando confrontos Rei da Praia:", { etapaId, arenaId });

    const { db } = await import("../config/firebase");

    const snapshot = await db
      .collection("confrontos_eliminatorios")
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .orderBy("ordem", "asc")
      .get();

    const confrontos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`✅ ${confrontos.length} confrontos encontrados`);

    res.status(200).json({
      data: confrontos,
    });
  } catch (error: any) {
    console.error("❌ Erro ao buscar confrontos:", error);
    res.status(500).json({
      error: error.message || "Erro ao buscar confrontos",
    });
  }
});

/**
 * @route   GET /api/etapas/:id/rei-da-praia/jogadores
 * @desc    Buscar jogadores/estatísticas da etapa Rei da Praia
 * @access  Private (Admin da arena)
 */
router.get("/:id/rei-da-praia/jogadores", async (req: AuthRequest, res) => {
  try {
    const { id: etapaId } = req.params;
    const { arenaId } = req.user!;

    console.log("📥 Buscando jogadores Rei da Praia:", { etapaId, arenaId });

    const reiDaPraiaService = (await import("../services/ReiDaPraiaService"))
      .default;

    const jogadores = await reiDaPraiaService.buscarJogadores(etapaId, arenaId);

    res.status(200).json({
      data: jogadores,
    });
  } catch (error: any) {
    console.error("❌ Erro ao buscar jogadores:", error);
    res.status(500).json({
      error: error.message || "Erro ao buscar jogadores",
    });
  }
});

/**
 * @route   GET /api/etapas/:id/rei-da-praia/partidas
 * @desc    Buscar partidas da etapa Rei da Praia
 * @access  Private (Admin da arena)
 */
router.get("/:id/rei-da-praia/partidas", async (req: AuthRequest, res) => {
  try {
    const { id: etapaId } = req.params;
    const { arenaId } = req.user!;

    console.log("📥 Buscando partidas Rei da Praia:", { etapaId, arenaId });

    const reiDaPraiaService = (await import("../services/ReiDaPraiaService"))
      .default;

    const partidas = await reiDaPraiaService.buscarPartidas(etapaId, arenaId);

    res.status(200).json({
      data: partidas,
    });
  } catch (error: any) {
    console.error("❌ Erro ao buscar partidas:", error);
    res.status(500).json({
      error: error.message || "Erro ao buscar partidas",
    });
  }
});

/**
 * @route   POST /api/etapas/:id/rei-da-praia/partidas/:partidaId/resultado
 * @desc    Registrar resultado de partida Rei da Praia
 * @access  Private (Admin da arena)
 */
router.post(
  "/:id/rei-da-praia/partidas/:partidaId/resultado",
  async (req: AuthRequest, res) => {
    try {
      const { partidaId } = req.params;
      const { arenaId } = req.user!;
      const { placar } = req.body;

      console.log("📥 Registrando resultado Rei da Praia:", {
        partidaId,
        arenaId,
        placar,
      });

      const reiDaPraiaService = (await import("../services/ReiDaPraiaService"))
        .default;

      await reiDaPraiaService.registrarResultadoPartida(
        partidaId,
        arenaId,
        placar
      );

      res.status(200).json({
        data: {
          message: "Resultado registrado com sucesso",
        },
      });
    } catch (error: any) {
      console.error("❌ Erro ao registrar resultado:", error);
      res.status(500).json({
        error: error.message || "Erro ao registrar resultado",
      });
    }
  }
);

/**
 * @route   POST /api/etapas/:id/rei-da-praia/gerar-eliminatoria
 * @desc    Gerar fase eliminatória Rei da Praia
 * @access  Private (Admin da arena)
 */
router.post(
  "/:id/rei-da-praia/gerar-eliminatoria",
  async (req: AuthRequest, res) => {
    try {
      const { id: etapaId } = req.params;
      const { arenaId } = req.user!;
      const {
        classificadosPorGrupo = 2,
        tipoChaveamento = "melhores_com_melhores",
      } = req.body;

      console.log("📥 Gerando eliminatória Rei da Praia:", {
        etapaId,
        arenaId,
        classificadosPorGrupo,
        tipoChaveamento,
      });

      const reiDaPraiaService = (await import("../services/ReiDaPraiaService"))
        .default;

      const resultado = await reiDaPraiaService.gerarFaseEliminatoria(
        etapaId,
        arenaId,
        classificadosPorGrupo,
        tipoChaveamento
      );

      res.status(200).json({
        data: {
          message: "Fase eliminatória gerada com sucesso",
          duplas: resultado.duplas.length,
          confrontos: resultado.confrontos.length,
        },
      });
    } catch (error: any) {
      console.error("❌ Erro ao gerar eliminatória:", error);
      res.status(500).json({
        error: error.message || "Erro ao gerar fase eliminatória",
      });
    }
  }
);

/**
 * POST /api/etapas/:id/rei-da-praia/cancelar-eliminatoria
 * Cancela a fase eliminatória do Rei da Praia
 */
router.post(
  "/:id/rei-da-praia/cancelar-eliminatoria",
  async (req: AuthRequest, res) => {
    try {
      const { id: etapaId } = req.params;
      const { arenaId } = req.user!;

      const reiDaPraiaService = (await import("../services/ReiDaPraiaService"))
        .default;
      await reiDaPraiaService.cancelarFaseEliminatoria(etapaId, arenaId);

      res.status(200).json({
        data: {
          message: "Fase eliminatória cancelada com sucesso",
        },
      });
    } catch (error: any) {
      console.error("Erro ao cancelar eliminatória:", error);
      res
        .status(400)
        .json({ error: error.message || "Erro ao cancelar eliminatória" });
    }
  }
);

// =============================================================

// ===== ROTAS GENÉRICAS /:id (DEVEM VIR POR ÚLTIMO) =====

/**
 * @route   GET /api/etapas/:id
 * @desc    Buscar etapa por ID
 * @access  Private (Admin da arena)
 */
router.get("/:id", (req, res) => etapaController.buscarPorId(req, res));

/**
 * @route   PUT /api/etapas/:id
 * @desc    Atualizar etapa
 * @access  Private (Admin da arena)
 */
router.put("/:id", (req, res) => etapaController.atualizar(req, res));

/**
 * @route   DELETE /api/etapas/:id
 * @desc    Deletar etapa
 * @access  Private (Admin da arena)
 */
router.delete("/:id", (req, res) => etapaController.deletar(req, res));

/**
 * @route   GET /api/etapas/:id/duplas
 * @desc    Buscar duplas da etapa
 * @access  Private (Admin da arena)
 */
router.get("/:id/duplas", (req, res) => etapaController.buscarDuplas(req, res));

/**
 * @route   GET /api/etapas/:id/grupos
 * @desc    Buscar grupos da etapa
 * @access  Private (Admin da arena)
 */
router.get("/:id/grupos", (req, res) => etapaController.buscarGrupos(req, res));

/**
 * @route   GET /api/etapas/:id/partidas
 * @desc    Buscar partidas da etapa
 * @access  Private (Admin da arena)
 */
router.get("/:id/partidas", (req, res) =>
  etapaController.buscarPartidas(req, res)
);

// ==================== ROTA ESPECIAL - RESULTADO ELIMINATÓRIO ====================

/**
 * @route   POST /api/etapas/confrontos-eliminatorios/:confrontoId/resultado
 * @desc    Registrar resultado de confronto eliminatório
 * @access  Private (Admin da arena)
 *
 * NOTA: Esta rota tem um caminho especial que não usa /:id da etapa
 * Por isso está no final, mas tecnicamente não conflita
 */
router.post(
  "/confrontos-eliminatorios/:confrontoId/resultado",
  async (req: AuthRequest, res) => {
    try {
      const { confrontoId } = req.params;
      const { arenaId } = req.user!; // Pega do token de autenticação
      const { placar } = req.body;

      console.log("📥 Registrando resultado:", {
        confrontoId,
        arenaId,
        placar,
      });

      // Importar o chaveService
      const chaveService = (await import("../services/ChaveService")).default;

      await chaveService.registrarResultadoEliminatorio(
        confrontoId,
        arenaId,
        placar
      );

      res.status(200).json({
        message: "Resultado registrado com sucesso",
      });
    } catch (error: any) {
      console.error("❌ Erro ao registrar resultado:", error);
      res.status(500).json({
        error: error.message || "Erro ao registrar resultado",
      });
    }
  }
);

// =================================================================================

export default router;
