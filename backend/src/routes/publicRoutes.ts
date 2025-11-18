// backend/src/routes/publicRoutes.ts
import { Router, Request, Response } from "express";
import { arenaService } from "../services/ArenaService";
import etapaService from "../services/EtapaService";
import jogadorService from "../services/JogadorService";
import estatisticasJogadorService from "../services/EstatisticasJogadorService";

const router = Router();

/**
 * 🌍 ROTAS PÚBLICAS - SEM AUTENTICAÇÃO
 * Usam o slug da arena na URL
 */

// ============================================
// ARENA
// ============================================

/**
 * Buscar arena por slug
 * GET /api/public/:arenaSlug
 */
router.get("/:arenaSlug", async (req: Request, res: Response) => {
  try {
    const { arenaSlug } = req.params;

    const arena = await arenaService.getArenaBySlug(arenaSlug);

    res.json({
      success: true,
      data: {
        id: arena.id,
        nome: arena.nome,
        slug: arena.slug,
        ativa: arena.ativa,
      },
    });
  } catch (error: any) {
    console.error("Erro ao buscar arena:", error);
    res.status(404).json({
      success: false,
      error: "Arena não encontrada",
    });
  }
});

// ============================================
// ETAPAS
// ============================================

/**
 * Listar etapas públicas de uma arena
 * GET /api/public/:arenaSlug/etapas
 */
router.get("/:arenaSlug/etapas", async (req: Request, res: Response) => {
  try {
    const { arenaSlug } = req.params;
    const { status, limite = "20", offset = "0" } = req.query;

    // Buscar arena pelo slug
    const arena = await arenaService.getArenaBySlug(arenaSlug);

    // Listar etapas
    const resultado = await etapaService.listar({
      arenaId: arena.id,
      status: status as any,
      limite: parseInt(limite as string),
      offset: parseInt(offset as string),
    });

    res.json({
      success: true,
      data: resultado,
    });
  } catch (error: any) {
    console.error("Erro ao listar etapas:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao listar etapas",
    });
  }
});

/**
 * Buscar etapa específica
 * GET /api/public/:arenaSlug/etapas/:etapaId
 */
router.get(
  "/:arenaSlug/etapas/:etapaId",
  async (req: Request, res: Response) => {
    try {
      const { arenaSlug, etapaId } = req.params;

      const arena = await arenaService.getArenaBySlug(arenaSlug);
      const etapa = await etapaService.buscarPorId(etapaId, arena.id);

      if (!etapa) {
        return res.status(404).json({
          success: false,
          error: "Etapa não encontrada",
        });
      }

      res.json({
        success: true,
        data: etapa,
      });
    } catch (error: any) {
      console.error("Erro ao buscar etapa:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao buscar etapa",
      });
    }
  }
);

/**
 * Buscar inscrições de uma etapa
 * GET /api/public/:arenaSlug/etapas/:etapaId/inscricoes
 */
router.get(
  "/:arenaSlug/etapas/:etapaId/inscricoes",
  async (req: Request, res: Response) => {
    try {
      const { arenaSlug, etapaId } = req.params;

      const arena = await arenaService.getArenaBySlug(arenaSlug);
      const inscricoes = await etapaService.listarInscricoes(etapaId, arena.id);

      res.json({
        success: true,
        data: inscricoes,
      });
    } catch (error: any) {
      console.error("Erro ao listar inscrições:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao listar inscrições",
      });
    }
  }
);

// ============================================
// JOGADORES
// ============================================

/**
 * Listar jogadores de uma arena
 * GET /api/public/:arenaSlug/jogadores
 */
router.get("/:arenaSlug/jogadores", async (req: Request, res: Response) => {
  try {
    const { arenaSlug } = req.params;
    const {
      nivel,
      status,
      genero,
      busca,
      limite = "50",
      offset = "0",
    } = req.query;

    const arena = await arenaService.getArenaBySlug(arenaSlug);

    const resultado = await jogadorService.listar({
      arenaId: arena.id,
      nivel: nivel as any,
      status: status as any,
      genero: genero as any,
      busca: busca as string,
      limite: parseInt(limite as string),
      offset: parseInt(offset as string),
    });

    res.json({
      success: true,
      data: resultado,
    });
  } catch (error: any) {
    console.error("Erro ao listar jogadores:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao listar jogadores",
    });
  }
});

/**
 * Buscar jogador por ID
 * GET /api/public/:arenaSlug/jogadores/:jogadorId
 */
router.get(
  "/:arenaSlug/jogadores/:jogadorId",
  async (req: Request, res: Response) => {
    try {
      const { arenaSlug, jogadorId } = req.params;

      const arena = await arenaService.getArenaBySlug(arenaSlug);
      const jogador = await jogadorService.buscarPorId(jogadorId, arena.id);

      if (!jogador) {
        return res.status(404).json({
          success: false,
          error: "Jogador não encontrado",
        });
      }

      res.json({
        success: true,
        data: jogador,
      });
    } catch (error: any) {
      console.error("Erro ao buscar jogador:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao buscar jogador",
      });
    }
  }
);

/**
 * Buscar histórico de um jogador
 * GET /api/public/:arenaSlug/jogadores/:jogadorId/historico
 */
router.get(
  "/:arenaSlug/jogadores/:jogadorId/historico",
  async (req: Request, res: Response) => {
    try {
      const { arenaSlug, jogadorId } = req.params;

      const arena = await arenaService.getArenaBySlug(arenaSlug);
      const historico = await estatisticasJogadorService.buscarHistoricoJogador(
        jogadorId,
        arena.id
      );

      res.json({
        success: true,
        data: historico,
      });
    } catch (error: any) {
      console.error("Erro ao buscar histórico:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao buscar histórico",
      });
    }
  }
);

// ============================================
// RANKING
// ============================================

/**
 * Buscar ranking geral da arena
 * GET /api/public/:arenaSlug/ranking
 */
router.get("/:arenaSlug/ranking", async (req: Request, res: Response) => {
  try {
    const { arenaSlug } = req.params;
    const { limite = "50" } = req.query;

    const arena = await arenaService.getArenaBySlug(arenaSlug);
    const ranking = await estatisticasJogadorService.buscarRankingGlobal(
      arena.id,
      parseInt(limite as string)
    );

    res.json({
      success: true,
      data: ranking,
    });
  } catch (error: any) {
    console.error("Erro ao buscar ranking:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar ranking",
    });
  }
});

// ============================================
// ESTATÍSTICAS
// ============================================

/**
 * Buscar estatísticas gerais da arena
 * GET /api/public/:arenaSlug/estatisticas
 */
router.get("/:arenaSlug/estatisticas", async (req: Request, res: Response) => {
  try {
    const { arenaSlug } = req.params;

    const arena = await arenaService.getArenaBySlug(arenaSlug);
    const estatisticas = await etapaService.obterEstatisticas(arena.id);

    res.json({
      success: true,
      data: estatisticas,
    });
  } catch (error: any) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar estatísticas",
    });
  }
});

export default router;
