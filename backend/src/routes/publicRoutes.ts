import { Router, Request, Response } from "express";
import { paraEtapaPublica } from "../models/Etapa";
import { paraJogadorPublico } from "../models/Jogador";
import { arenaService } from "../services/ArenaService";
import etapaService from "../services/EtapaService";
import jogadorService from "../services/JogadorService";
import estatisticasJogadorService from "../services/EstatisticasJogadorService";
import etapaPublicaService from "../services/publico/EtapaPublicaService";
import { JogadorRanking } from "../utils/estatisticas";
import logger from "../utils/logger";

const router = Router();

/**
 * ROTAS PÚBLICAS - SEM AUTENTICAÇÃO
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
      data: arena.toPublic(),
    });
  } catch (error: any) {
    logger.error(
      "Erro ao buscar arena pública",
      { arenaSlug: req.params.arenaSlug },
      error
    );
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

    const arena = await arenaService.getArenaBySlug(arenaSlug);

    const resultado = await etapaService.listar({
      arenaId: arena.id,
      status: status as any,
      limite: parseInt(limite as string),
      offset: parseInt(offset as string),
    });

    res.json({
      success: true,
      data: {
        ...resultado,
        etapas: resultado.etapas.map(paraEtapaPublica),
      },
    });
  } catch (error: any) {
    logger.error(
      "Erro ao listar etapas públicas",
      { arenaSlug: req.params.arenaSlug },
      error
    );
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
        data: paraEtapaPublica(etapa),
      });
    } catch (error: any) {
      logger.error(
        "Erro ao buscar etapa pública",
        {
          arenaSlug: req.params.arenaSlug,
          etapaId: req.params.etapaId,
        },
        error
      );
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
      logger.error(
        "Erro ao listar inscrições públicas",
        {
          arenaSlug: req.params.arenaSlug,
          etapaId: req.params.etapaId,
        },
        error
      );
      res.status(500).json({
        success: false,
        error: "Erro ao listar inscrições",
      });
    }
  }
);

/**
 * Buscar grupos de uma etapa
 * GET /api/public/:arenaSlug/etapas/:etapaId/grupos
 */
router.get(
  "/:arenaSlug/etapas/:etapaId/grupos",
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
        data: await etapaPublicaService.buscarGrupos(etapa),
      });
    } catch (error: any) {
      logger.error(
        "Erro ao buscar grupos públicos",
        {
          arenaSlug: req.params.arenaSlug,
          etapaId: req.params.etapaId,
        },
        error
      );
      res.status(500).json({
        success: false,
        error: "Erro ao buscar grupos",
      });
    }
  }
);

/**
 * Buscar chaves eliminatórias de uma etapa
 * GET /api/public/:arenaSlug/etapas/:etapaId/chaves
 */
router.get(
  "/:arenaSlug/etapas/:etapaId/chaves",
  async (req: Request, res: Response) => {
    try {
      const { arenaSlug, etapaId } = req.params;

      const arena = await arenaService.getArenaBySlug(arenaSlug);
      res.json({
        success: true,
        data: await etapaPublicaService.buscarChaves(etapaId, arena.id),
      });
    } catch (error: any) {
      logger.error(
        "Erro ao buscar chaves públicas",
        {
          arenaSlug: req.params.arenaSlug,
          etapaId: req.params.etapaId,
        },
        error
      );
      res.status(500).json({
        success: false,
        error: "Erro ao buscar chaves",
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
      buscaSoNome: true,
      limite: parseInt(limite as string),
      offset: parseInt(offset as string),
    });

    res.json({
      success: true,
      data: {
        ...resultado,
        jogadores: resultado.jogadores.map(paraJogadorPublico),
      },
    });
  } catch (error: any) {
    logger.error(
      "Erro ao listar jogadores públicos",
      { arenaSlug: req.params.arenaSlug },
      error
    );
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
        data: paraJogadorPublico(jogador),
      });
    } catch (error: any) {
      logger.error(
        "Erro ao buscar jogador público",
        {
          arenaSlug: req.params.arenaSlug,
          jogadorId: req.params.jogadorId,
        },
        error
      );
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

      res.json({
        success: true,
        data: await etapaPublicaService.buscarHistoricoJogador(
          jogadorId,
          arena.id
        ),
      });
    } catch (error: any) {
      logger.error(
        "Erro ao buscar histórico público",
        {
          arenaSlug: req.params.arenaSlug,
          jogadorId: req.params.jogadorId,
        },
        error
      );
      res.status(500).json({
        success: false,
        error: "Erro ao buscar histórico",
        message: error.message,
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
 *
 * IMPORTANTE: Quando o parâmetro 'nivel' é passado, usa buscarRankingPorNivel
 * para garantir que os pontos sejam separados por categoria.
 *
 * Exemplo: Jogador que era iniciante (100 pts) e virou intermediário (10 pts)
 * - Ranking iniciante: 100 pts
 * - Ranking intermediário: 10 pts
 */
router.get("/:arenaSlug/ranking", async (req: Request, res: Response) => {
  try {
    const { arenaSlug } = req.params;
    const { limite = "50", genero, nivel } = req.query;

    const arena = await arenaService.getArenaBySlug(arenaSlug);
    const limiteNum = parseInt(limite as string);

    let ranking: JogadorRanking[];

    // Isso garante que os pontos sejam calculados APENAS para o nível solicitado
    if (nivel) {
      ranking = await estatisticasJogadorService.buscarRankingPorNivel(
        arena.id,
        nivel as string,
        999 // Buscar todos para depois filtrar por gênero se necessário
      );

      logger.info("Ranking por nível carregado", {
        arenaId: arena.id,
        nivel,
        totalJogadores: ranking.length,
      });
    } else {
      // Sem nível especificado: ranking global (todos os níveis somados)
      // ATENÇÃO: Este método soma pontos de todos os níveis!
      ranking = await estatisticasJogadorService.buscarRankingGlobalAgregado(
        arena.id,
        999
      );
    }

    // Filtrar por gênero se especificado
    let rankingFiltrado = ranking;
    if (genero) {
      rankingFiltrado = ranking.filter((jogador) => {
        const jogadorGenero = (jogador.jogadorGenero || "").toLowerCase();
        const filtroGenero = (genero as string).toLowerCase();
        return jogadorGenero === filtroGenero;
      });
    }

    // Aplicar limite após filtragem
    rankingFiltrado = rankingFiltrado.slice(0, limiteNum);

    const rankingFormatado = rankingFiltrado.map((jogador, index) => ({
      id: jogador.jogadorId,
      jogadorId: jogador.jogadorId,
      nome: jogador.jogadorNome,
      jogadorNome: jogador.jogadorNome,
      nivel: jogador.jogadorNivel,
      jogadorNivel: jogador.jogadorNivel,
      genero: jogador.jogadorGenero,
      jogadorGenero: jogador.jogadorGenero,
      pontos: jogador.pontos,
      ranking: jogador.pontos,
      etapasParticipadas: jogador.etapasParticipadas,
      totalEtapas: jogador.etapasParticipadas,
      vitorias: jogador.vitorias,
      totalVitorias: jogador.vitorias,
      derrotas: jogador.derrotas,
      totalDerrotas: jogador.derrotas,
      jogos: jogador.jogos,
      setsVencidos: jogador.setsVencidos,
      setsPerdidos: jogador.setsPerdidos,
      gamesVencidos: jogador.gamesVencidos,
      gamesPerdidos: jogador.gamesPerdidos,
      saldoSets: jogador.saldoSets,
      saldoGames: jogador.saldoGames,
      posicao: index + 1,
    }));

    res.json({
      success: true,
      data: rankingFormatado,
    });
  } catch (error: any) {
    logger.error(
      "Erro ao buscar ranking público",
      { arenaSlug: req.params.arenaSlug },
      error
    );
    res.status(500).json({
      success: false,
      error: "Erro ao buscar ranking",
      message: error.message,
    });
  }
});

// ============================================
// ESTATÍSTICAS
// ============================================

/**
 * Buscar estatísticas AGREGADAS de um jogador (por nível atual)
 * GET /api/public/:arenaSlug/jogadores/:jogadorId/estatisticas
 *
 * IMPORTANTE: A posição no ranking é calculada com base no nível ATUAL do jogador.
 * Se o jogador mudou de iniciante para intermediário, a posição mostrada é
 * no ranking de intermediários (com os pontos acumulados nesse nível).
 */
router.get(
  "/:arenaSlug/jogadores/:jogadorId/estatisticas",
  async (req: Request, res: Response) => {
    try {
      const { arenaSlug, jogadorId } = req.params;

      const arena = await arenaService.getArenaBySlug(arenaSlug);

      // Buscar o jogador para pegar o nível ATUAL
      const jogador = await jogadorService.buscarPorId(jogadorId, arena.id);

      if (!jogador) {
        return res.status(404).json({
          success: false,
          error: "Jogador não encontrado",
        });
      }

      const nivelAtual = jogador.nivel;

      let stats;

      if (nivelAtual) {
        // Buscar estatísticas apenas do nível atual
        stats =
          await estatisticasJogadorService.buscarEstatisticasAgregadasPorNivel(
            jogadorId,
            arena.id,
            nivelAtual
          );

        logger.info("Estatísticas por nível carregadas", {
          jogadorId,
          nivel: nivelAtual,
          posicaoRanking: stats?.posicaoRanking,
        });
      } else {
        // Fallback: sem nível definido, usa método global
        stats = await estatisticasJogadorService.buscarEstatisticasAgregadas(
          jogadorId,
          arena.id
        );
      }

      res.json({
        success: true,
        data: stats || {
          jogadorId,
          jogadorNome: jogador.nome,
          jogadorNivel: nivelAtual,
          jogadorGenero: jogador.genero,
          etapasParticipadas: 0,
          jogos: 0,
          vitorias: 0,
          derrotas: 0,
          pontos: 0,
          posicaoRanking: 0,
          setsVencidos: 0,
          setsPerdidos: 0,
          gamesVencidos: 0,
          gamesPerdidos: 0,
          saldoSets: 0,
          saldoGames: 0,
        },
      });
    } catch (error: any) {
      logger.error(
        "Erro ao buscar estatísticas públicas",
        {
          arenaSlug: req.params.arenaSlug,
          jogadorId: req.params.jogadorId,
        },
        error
      );
      res.status(500).json({
        success: false,
        error: "Erro ao buscar estatísticas",
      });
    }
  }
);

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
    logger.error(
      "Erro ao buscar estatísticas gerais públicas",
      { arenaSlug: req.params.arenaSlug },
      error
    );
    res.status(500).json({
      success: false,
      error: "Erro ao buscar estatísticas",
    });
  }
});

export default router;
