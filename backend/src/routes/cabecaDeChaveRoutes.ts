import { Router } from "express";
import { AuthRequest, requireAuth } from "../middlewares/auth";
import cabecaDeChaveService from "../services/CabecaDeChaveService";
import logger from "../utils/logger";

const router = Router();

// Middleware de autenticação
router.use(requireAuth);

/**
 * @route   POST /api/cabecas-de-chave
 * @desc    Criar cabeça de chave
 * @access  Private (Admin da arena)
 */
router.post("/cabecas-de-chave", async (req: AuthRequest, res) => {
  try {
    const { arenaId } = req.user!;
    const {
      etapaId,
      jogadorId,
      jogadorNome,
      jogadorNivel,
      jogadorGenero,
      ordem,
    } = req.body;

    // Validar campos obrigatórios
    if (!etapaId || !jogadorId || !jogadorNome || !ordem) {
      return res.status(400).json({
        error:
          "Dados incompletos: etapaId, jogadorId, jogadorNome e ordem são obrigatórios",
      });
    }

    const cabeca = await cabecaDeChaveService.criar({
      arenaId,
      etapaId,
      jogadorId,
      jogadorNome,
      jogadorNivel,
      jogadorGenero,
      ordem,
    });

    res.status(201).json({
      data: cabeca,
    });
  } catch (error: any) {
    logger.error(
      "Erro ao criar cabeça de chave",
      {
        etapaId: req.body.etapaId,
        jogadorId: req.body.jogadorId,
      },
      error
    );
    res.status(400).json({
      error: error.message || "Erro ao criar cabeça de chave",
    });
  }
});

/**
 * @route   GET /api/arenas/:arenaId/etapas/:etapaId/cabecas-de-chave
 * @desc    Listar cabeças de chave ativas de uma etapa
 * @access  Private (Admin da arena)
 */
router.get(
  "/arenas/:arenaId/etapas/:etapaId/cabecas-de-chave",
  async (req: AuthRequest, res) => {
    try {
      const { arenaId, etapaId } = req.params;

      if (req.user!.arenaId !== arenaId) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const cabecas = await cabecaDeChaveService.listarAtivas(arenaId, etapaId);

      res.json({ data: cabecas });
    } catch (error: any) {
      logger.error(
        "Erro ao listar cabeças de chave",
        {
          arenaId: req.params.arenaId,
          etapaId: req.params.etapaId,
        },
        error
      );
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @route   GET /api/arenas/:arenaId/etapas/:etapaId/jogadores/:jogadorId/eh-cabeca-de-chave
 * @desc    Verificar se jogador é cabeça de chave em uma etapa
 * @access  Private (Admin da arena)
 */
router.get(
  "/arenas/:arenaId/etapas/:etapaId/jogadores/:jogadorId/eh-cabeca-de-chave",
  async (req: AuthRequest, res) => {
    try {
      const { arenaId, etapaId, jogadorId } = req.params;

      if (req.user!.arenaId !== arenaId) {
        return res.status(403).json({
          error: "Sem permissão para acessar esta arena",
        });
      }

      const ehCabecaDeChave = await cabecaDeChaveService.ehCabecaDeChave(
        arenaId,
        etapaId,
        jogadorId
      );

      res.status(200).json({
        data: {
          ehCabecaDeChave,
        },
      });
    } catch (error: any) {
      logger.error(
        "Erro ao verificar cabeça de chave",
        {
          arenaId: req.params.arenaId,
          etapaId: req.params.etapaId,
          jogadorId: req.params.jogadorId,
        },
        error
      );
      res.status(500).json({
        error: "Erro ao verificar cabeça de chave",
      });
    }
  }
);

/**
 * @route   DELETE /api/arenas/:arenaId/etapas/:etapaId/jogadores/:jogadorId/cabeca-de-chave
 * @desc    Remover cabeça de chave de uma etapa
 * @access  Private (Admin da arena)
 */
router.delete(
  "/arenas/:arenaId/etapas/:etapaId/jogadores/:jogadorId/cabeca-de-chave",
  async (req: AuthRequest, res) => {
    try {
      const { arenaId, etapaId, jogadorId } = req.params;

      if (req.user!.arenaId !== arenaId) {
        return res.status(403).json({
          error: "Sem permissão para modificar cabeças desta arena",
        });
      }

      await cabecaDeChaveService.remover(arenaId, etapaId, jogadorId);

      res.status(200).json({
        data: {
          message: "Cabeça de chave removida com sucesso",
        },
      });
    } catch (error: any) {
      logger.error(
        "Erro ao remover cabeça de chave",
        {
          arenaId: req.params.arenaId,
          etapaId: req.params.etapaId,
          jogadorId: req.params.jogadorId,
        },
        error
      );
      res.status(400).json({
        error: error.message || "Erro ao remover cabeça de chave",
      });
    }
  }
);

/**
 * @route   PUT /api/arenas/:arenaId/etapas/:etapaId/cabecas-de-chave/reordenar
 * @desc    Reordenar cabeças de chave de uma etapa
 * @access  Private (Admin da arena)
 */
router.put(
  "/arenas/:arenaId/etapas/:etapaId/cabecas-de-chave/reordenar",
  async (req: AuthRequest, res) => {
    try {
      const { arenaId, etapaId } = req.params;
      const { ordens } = req.body;

      if (req.user!.arenaId !== arenaId) {
        return res.status(403).json({
          error: "Sem permissão para modificar cabeças desta arena",
        });
      }

      if (!ordens || !Array.isArray(ordens)) {
        return res.status(400).json({
          error: "Formato inválido: 'ordens' deve ser um array",
        });
      }

      const cabecas = await cabecaDeChaveService.listarAtivas(arenaId, etapaId);

      for (const { jogadorId, ordem } of ordens) {
        const cabeca = cabecas.find((c) => c.jogadorId === jogadorId);
        if (cabeca) {
          await cabecaDeChaveService.atualizar(cabeca.id, { ordem });
        }
      }

      res.status(200).json({
        data: {
          message: "Ordem atualizada com sucesso",
        },
      });
    } catch (error: any) {
      logger.error(
        "Erro ao reordenar cabeças de chave",
        {
          arenaId: req.params.arenaId,
          etapaId: req.params.etapaId,
        },
        error
      );
      res.status(500).json({
        error: "Erro ao reordenar cabeças de chave",
      });
    }
  }
);

/**
 * @route   GET /api/arenas/:arenaId/etapas/:etapaId/cabecas-de-chave/ids
 * @desc    Obter apenas os IDs das cabeças de chave ativas
 * @access  Private (Admin da arena)
 */
router.get(
  "/arenas/:arenaId/etapas/:etapaId/cabecas-de-chave/ids",
  async (req: AuthRequest, res) => {
    try {
      const { arenaId, etapaId } = req.params;

      if (req.user!.arenaId !== arenaId) {
        return res.status(403).json({
          error: "Sem permissão para acessar esta arena",
        });
      }

      const ids = await cabecaDeChaveService.obterIdsCabecas(arenaId, etapaId);

      res.status(200).json({
        data: ids,
      });
    } catch (error: any) {
      logger.error(
        "Erro ao buscar IDs de cabeças de chave",
        {
          arenaId: req.params.arenaId,
          etapaId: req.params.etapaId,
        },
        error
      );
      res.status(500).json({
        error: "Erro ao buscar IDs de cabeças de chave",
      });
    }
  }
);

export default router;
