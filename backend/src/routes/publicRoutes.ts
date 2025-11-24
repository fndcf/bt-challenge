// backend/src/routes/publicRoutes.ts
import { Router, Request, Response } from "express";
import { arenaService } from "../services/ArenaService";
import etapaService from "../services/EtapaService";
import jogadorService from "../services/JogadorService";
import estatisticasJogadorService from "../services/EstatisticasJogadorService";
import chaveService from "../services/ChaveService";
import { db } from "../config/firebase";

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

/**
 * Buscar grupos de uma etapa
 * GET /api/public/:arenaSlug/etapas/:etapaId/grupos
 * ✅ ATUALIZADO: Suporta Dupla Fixa e Rei da Praia
 */
router.get(
  "/:arenaSlug/etapas/:etapaId/grupos",
  async (req: Request, res: Response) => {
    try {
      const { arenaSlug, etapaId } = req.params;

      console.log("🔍 Buscando grupos para etapa:", etapaId);

      // Buscar arena
      const arena = await arenaService.getArenaBySlug(arenaSlug);

      // ✅ Buscar etapa para saber o formato
      const etapa = await etapaService.buscarPorId(etapaId, arena.id);
      if (!etapa) {
        return res.status(404).json({
          success: false,
          error: "Etapa não encontrada",
        });
      }

      const isReiDaPraia = etapa.formato === "rei_da_praia";
      console.log(
        "📋 Formato da etapa:",
        etapa.formato,
        "| Rei da Praia:",
        isReiDaPraia
      );

      // Buscar grupos usando ChaveService
      const grupos = await chaveService.buscarGrupos(etapaId, arena.id);

      console.log("📊 Grupos encontrados:", grupos.length);

      // Processar cada grupo de acordo com o formato
      const gruposProcessados = await Promise.all(
        grupos.map(async (grupo) => {
          console.log("🎯 Processando grupo:", grupo.id, grupo.nome);

          if (isReiDaPraia) {
            // ========================================
            // ✅ REI DA PRAIA: Jogadores individuais
            // ========================================

            // Buscar jogadores do grupo (estatísticas individuais)
            const jogadoresSnapshot = await db
              .collection("estatisticas_jogador")
              .where("grupoId", "==", grupo.id)
              .where("etapaId", "==", etapaId)
              .get();

            const jogadores = jogadoresSnapshot.docs
              .map((doc) => {
                const data = doc.data();
                return {
                  id: doc.id,
                  jogadorId: data.jogadorId,
                  jogadorNome: data.jogadorNome,
                  jogadorNivel: data.jogadorNivel,
                  posicaoGrupo: data.posicaoGrupo || 0,
                  jogosGrupo: data.jogosGrupo || 0,
                  vitoriasGrupo: data.vitoriasGrupo || 0,
                  derrotasGrupo: data.derrotasGrupo || 0,
                  pontosGrupo: data.pontosGrupo || 0,
                  gamesVencidosGrupo: data.gamesVencidosGrupo || 0,
                  gamesPerdidosGrupo: data.gamesPerdidosGrupo || 0,
                  saldoGamesGrupo: data.saldoGamesGrupo || 0,
                  setsVencidosGrupo: data.setsVencidosGrupo || 0,
                  setsPerdidosGrupo: data.setsPerdidosGrupo || 0,
                  saldoSetsGrupo: data.saldoSetsGrupo || 0,
                  classificado: data.classificado || false,
                };
              })
              .sort((a, b) => {
                // Ordenar por posição ou pontos
                if (a.posicaoGrupo && b.posicaoGrupo) {
                  return a.posicaoGrupo - b.posicaoGrupo;
                }
                if (a.pontosGrupo !== b.pontosGrupo) {
                  return b.pontosGrupo - a.pontosGrupo;
                }
                return b.saldoGamesGrupo - a.saldoGamesGrupo;
              });

            console.log("👤 Jogadores do grupo:", jogadores.length);

            // Buscar partidas do Rei da Praia
            const partidasSnapshot = await db
              .collection("partidas_rei_da_praia")
              .where("grupoId", "==", grupo.id)
              .where("etapaId", "==", etapaId)
              .orderBy("criadoEm", "asc")
              .get();

            console.log(
              "⚔️ Partidas Rei da Praia do grupo:",
              partidasSnapshot.docs.length
            );

            const partidas = partidasSnapshot.docs.map((doc) => {
              const data = doc.data();
              const placarDetalhado = data.placar || [];

              return {
                id: doc.id,
                dupla1Nome: data.dupla1Nome,
                dupla2Nome: data.dupla2Nome,
                status: data.status,
                setsDupla1: data.setsDupla1 || 0,
                setsDupla2: data.setsDupla2 || 0,
                placar: placarDetalhado,
                vencedores: data.vencedores || [],
                vencedoresNomes: data.vencedoresNomes,
                criadoEm: data.criadoEm,
              };
            });

            console.log("✅ Grupo Rei da Praia processado:", {
              nome: grupo.nome,
              qtdJogadores: jogadores.length,
              qtdPartidas: partidas.length,
            });

            return {
              id: grupo.id,
              nome: grupo.nome,
              ordem: grupo.ordem,
              totalJogadores: jogadores.length,
              completo: grupo.completo || false,
              jogadores, // ✅ Jogadores individuais
              partidas,
              formato: "rei_da_praia",
            };
          } else {
            // ========================================
            // ✅ DUPLA FIXA: Código original
            // ========================================

            // Buscar duplas do grupo
            const duplasSnapshot = await db
              .collection("duplas")
              .where("grupoId", "==", grupo.id)
              .orderBy("posicaoGrupo", "asc")
              .get();

            const duplas = duplasSnapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                jogador1Nome: data.jogador1Nome,
                jogador2Nome: data.jogador2Nome,
                posicaoGrupo: data.posicaoGrupo,
                vitorias: data.vitorias || 0,
                derrotas: data.derrotas || 0,
                pontos: data.pontos || 0,
                saldoGames: data.saldoGames || 0,
                jogos: data.jogos || 0,
                classificada: data.classificada || false,
              };
            });

            console.log("👥 Duplas do grupo:", duplas.length);

            // Buscar partidas do grupo
            const partidasSnapshot = await db
              .collection("partidas")
              .where("grupoId", "==", grupo.id)
              .orderBy("criadoEm", "asc")
              .get();

            console.log("⚔️ Partidas do grupo:", partidasSnapshot.docs.length);

            const partidas = partidasSnapshot.docs.map((doc) => {
              const data = doc.data();
              const placarDetalhado = data.placar || [];

              return {
                id: doc.id,
                dupla1Id: data.dupla1Id,
                dupla2Id: data.dupla2Id,
                dupla1Nome: data.dupla1Nome,
                dupla2Nome: data.dupla2Nome,
                status: data.status,
                setsDupla1: data.setsDupla1 || 0,
                setsDupla2: data.setsDupla2 || 0,
                placar: placarDetalhado,
                vencedoraId: data.vencedoraId,
                vencedoraNome: data.vencedoraNome,
                criadoEm: data.criadoEm,
              };
            });

            console.log("✅ Grupo Dupla Fixa processado:", {
              nome: grupo.nome,
              qtdDuplas: duplas.length,
              qtdPartidas: partidas.length,
            });

            return {
              id: grupo.id,
              nome: grupo.nome,
              ordem: grupo.ordem,
              totalDuplas: grupo.totalDuplas,
              completo: grupo.completo || false,
              duplas,
              partidas,
              formato: "dupla_fixa",
            };
          }
        })
      );

      console.log("🎉 Resposta final:", {
        qtdGrupos: gruposProcessados.length,
        formato: isReiDaPraia ? "rei_da_praia" : "dupla_fixa",
      });

      res.json({
        success: true,
        data: gruposProcessados,
      });
    } catch (error: any) {
      console.error("❌ ERRO GERAL:", error);
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

      console.log("🔍 Buscando chaves para etapa:", etapaId);

      // Buscar arena
      const arena = await arenaService.getArenaBySlug(arenaSlug);

      // Buscar confrontos eliminatórios usando ChaveService
      const confrontos = await chaveService.buscarConfrontosEliminatorios(
        etapaId,
        arena.id
      );

      console.log("📊 Confrontos encontrados:", confrontos.length);

      // Se não tem confrontos, retornar vazio
      if (!confrontos || confrontos.length === 0) {
        return res.json({
          success: true,
          data: {
            formato: "eliminacao_simples",
            temChaves: false,
            rodadas: [],
          },
        });
      }

      // Agrupar confrontos por fase
      const confrontosPorFase = new Map<string, any[]>();

      confrontos.forEach((confronto) => {
        // Normalizar fase para MAIÚSCULAS
        const fase = confronto.fase.toUpperCase();

        console.log("🎯 Confronto:", {
          id: confronto.id,
          faseOriginal: confronto.fase,
          faseNormalizada: fase,
          partidaId: confronto.partidaId,
        });

        if (!confrontosPorFase.has(fase)) {
          confrontosPorFase.set(fase, []);
        }
        confrontosPorFase.get(fase)!.push(confronto);
      });

      // Ordenar fases (FINAL → SEMIFINAL → QUARTAS → OITAVAS)
      const ordensFase: Record<string, number> = {
        FINAL: 1,
        SEMIFINAL: 2,
        QUARTAS: 3,
        OITAVAS: 4,
      };

      const fasesOrdenadas = Array.from(confrontosPorFase.keys()).sort(
        (a, b) => (ordensFase[a] || 99) - (ordensFase[b] || 99)
      );

      console.log("📋 Fases ordenadas:", fasesOrdenadas);

      // Mapear para formato esperado pelo frontend
      const rodadas = await Promise.all(
        fasesOrdenadas.map(async (fase) => {
          const confrontosDaFase = confrontosPorFase.get(fase)!;

          // Buscar partidas para obter placar detalhado
          const partidasComPlacar = await Promise.all(
            confrontosDaFase.map(async (confronto) => {
              let placarDetalhado = null;

              // Se tem partidaId, buscar partida para pegar placar detalhado
              if (confronto.partidaId) {
                try {
                  console.log("🔍 Buscando partida:", confronto.partidaId);

                  const partidaDoc = await db
                    .collection("partidas")
                    .doc(confronto.partidaId)
                    .get();

                  if (partidaDoc.exists) {
                    const partida = partidaDoc.data();

                    console.log("📈 Partida encontrada:", {
                      partidaId: confronto.partidaId,
                      temPlacar: !!partida?.placar,
                      placar: partida?.placar,
                      tipoPlacar: typeof partida?.placar,
                      isArray: Array.isArray(partida?.placar),
                      length: partida?.placar?.length,
                    });

                    // O placar está no campo "placar" da partida
                    // É um array de objetos com { numero, gamesDupla1, gamesDupla2 }
                    if (
                      partida &&
                      partida.placar &&
                      Array.isArray(partida.placar)
                    ) {
                      placarDetalhado = partida.placar;
                      console.log(
                        "✅ Placar detalhado atribuído:",
                        placarDetalhado
                      );
                    } else {
                      console.log(
                        "⚠️ Campo placar não é um array ou não existe"
                      );
                    }
                  } else {
                    console.log(
                      "❌ Partida não encontrada:",
                      confronto.partidaId
                    );
                  }
                } catch (err) {
                  console.error("❌ Erro ao buscar placar:", err);
                }
              } else {
                console.log("⚠️ Confronto sem partidaId:", confronto.id);
              }

              return {
                id: confronto.id,
                numero: confronto.ordem,
                jogador1: {
                  id: confronto.dupla1Id || "",
                  nome: confronto.dupla1Nome || "A definir",
                  seed: undefined,
                },
                jogador2: confronto.dupla2Id
                  ? {
                      id: confronto.dupla2Id,
                      nome: confronto.dupla2Nome || "A definir",
                      seed: undefined,
                    }
                  : null,
                placar: confronto.placar || null,
                placarDetalhado: placarDetalhado,
                vencedor: confronto.vencedoraId
                  ? confronto.vencedoraId === confronto.dupla1Id
                    ? "jogador1"
                    : "jogador2"
                  : null,
                status:
                  confronto.status === "finalizada"
                    ? "finalizada"
                    : confronto.status === "FINALIZADA"
                    ? "finalizada"
                    : confronto.status === "BYE"
                    ? "bye"
                    : confronto.status === "bye"
                    ? "bye"
                    : confronto.status === "EM_ANDAMENTO"
                    ? "em_andamento"
                    : confronto.status === "em_andamento"
                    ? "em_andamento"
                    : "agendada",
              };
            })
          );

          // Nome correto da fase
          let nomeFase = "Fase Desconhecida";
          switch (fase) {
            case "FINAL":
              nomeFase = "Final";
              break;
            case "SEMIFINAL":
              nomeFase = "Semifinal";
              break;
            case "QUARTAS":
              nomeFase = "Quartas de Final";
              break;
            case "OITAVAS":
              nomeFase = "Oitavas de Final";
              break;
            default:
              nomeFase = fase;
          }

          console.log("✅ Rodada criada:", {
            nome: nomeFase,
            qtdPartidas: partidasComPlacar.length,
            partidasComPlacarDetalhado: partidasComPlacar.filter(
              (p) => p.placarDetalhado
            ).length,
          });

          return {
            numero: ordensFase[fase] || 99,
            nome: nomeFase,
            partidas: partidasComPlacar,
          };
        })
      );

      console.log("🎉 Resposta final:", {
        temChaves: true,
        qtdRodadas: rodadas.length,
        rodadas: rodadas.map((r) => ({
          nome: r.nome,
          qtdPartidas: r.partidas.length,
        })),
      });

      res.json({
        success: true,
        data: {
          formato: "eliminacao_simples",
          temChaves: true,
          rodadas,
        },
      });
    } catch (error: any) {
      console.error("❌ ERRO GERAL:", error);
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

      console.log("📊 Buscando histórico enriquecido:", {
        arenaSlug,
        jogadorId,
      });

      const arena = await arenaService.getArenaBySlug(arenaSlug);

      // Buscar todas as estatísticas do jogador nesta arena
      const snapshot = await db
        .collection("estatisticas_jogador")
        .where("jogadorId", "==", jogadorId)
        .where("arenaId", "==", arena.id)
        .get();

      if (snapshot.empty) {
        console.log("⚠️ Nenhuma estatística encontrada");
        return res.json({ success: true, data: [] });
      }

      console.log(`📈 ${snapshot.docs.length} registros encontrados`);

      // Enriquecer cada registro com nome da etapa
      const historicoEnriquecido = await Promise.all(
        snapshot.docs.map(async (doc) => {
          try {
            const stat = doc.data();

            // ✅ Buscar nome da etapa
            const etapaDoc = await db
              .collection("etapas")
              .doc(stat.etapaId)
              .get();
            const etapa = etapaDoc.exists ? etapaDoc.data() : null;

            // ✅ Converter colocação para posição numérica
            const posicao = converterColocacaoParaPosicao(stat.colocacao);

            console.log(
              `  ✅ Etapa: ${etapa?.nome || "Sem nome"} - Posição: ${posicao}`
            );

            return {
              id: doc.id,
              etapaId: stat.etapaId,
              etapaNome: etapa?.nome || "Etapa Sem Nome", // ✅ CAMPO IMPORTANTE

              posicao: posicao, // 1, 2, 3, etc
              colocacao: stat.colocacao, // "campeao", "vice", etc

              vitorias: stat.vitorias || 0,
              derrotas: stat.derrotas || 0,
              pontos: stat.pontos || 0,

              jogos: stat.jogos || 0,
              setsVencidos: stat.setsVencidos || 0,
              setsPerdidos: stat.setsPerdidos || 0,
              gamesVencidos: stat.gamesVencidos || 0,
              gamesPerdidos: stat.gamesPerdidos || 0,
              saldoSets: (stat.setsVencidos || 0) - (stat.setsPerdidos || 0),
              saldoGames: (stat.gamesVencidos || 0) - (stat.gamesPerdidos || 0),

              classificado: stat.classificado || false,
              grupoNome: stat.grupoNome,
              posicaoGrupo: stat.posicaoGrupo,

              criadoEm: stat.criadoEm,
            };
          } catch (error) {
            console.error(
              `❌ Erro ao enriquecer estatística ${doc.id}:`,
              error
            );
            return null;
          }
        })
      );

      // Filtrar nulos e ordenar por data (mais recente primeiro)
      const historicoFiltrado = historicoEnriquecido
        .filter((h) => h !== null)
        .sort((a, b) => {
          const dateA = a.criadoEm?.toDate?.() || new Date(0);
          const dateB = b.criadoEm?.toDate?.() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });

      console.log(
        `✅ Histórico enriquecido: ${historicoFiltrado.length} itens`
      );

      res.json({
        success: true,
        data: historicoFiltrado,
      });
    } catch (error: any) {
      console.error("❌ Erro ao buscar histórico:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao buscar histórico",
        message: error.message,
      });
    }
  }
);

/**
 * Converter colocação (string) para posição numérica
 */
function converterColocacaoParaPosicao(
  colocacao: string | undefined
): number | undefined {
  if (!colocacao) return undefined;

  const mapa: Record<string, number> = {
    campeao: 1,
    vice: 2,
    semifinalista: 3,
    quartas: 5,
    oitavas: 9,
    participacao: 99,
  };

  return mapa[colocacao.toLowerCase()] || 99;
}

// ============================================
// RANKING
// ============================================

/**
 * Buscar ranking geral da arena
 * GET /api/public/:arenaSlug/ranking
 * ✅ ATUALIZADO: Suporta filtros de gênero e nível
 */
router.get("/:arenaSlug/ranking", async (req: Request, res: Response) => {
  try {
    const { arenaSlug } = req.params;
    const { limite = "50", genero, nivel } = req.query; // ✅ ADICIONAR genero e nivel

    console.log("🏅 Buscando ranking agregado:", {
      arenaSlug,
      limite,
      genero,
      nivel,
    });

    // Buscar arena
    const arena = await arenaService.getArenaBySlug(arenaSlug);

    // Buscar ranking AGREGADO (todas as etapas)
    const ranking =
      await estatisticasJogadorService.buscarRankingGlobalAgregado(
        arena.id,
        parseInt(limite as string)
      );

    console.log(`📊 Ranking bruto: ${ranking.length} jogadores`);

    // ✅ FILTRAR POR GÊNERO E NÍVEL (se fornecidos)
    let rankingFiltrado = ranking;

    if (genero || nivel) {
      rankingFiltrado = ranking.filter((jogador) => {
        let match = true;

        // Filtrar por gênero
        if (genero) {
          const jogadorGenero = (jogador.jogadorGenero || "").toLowerCase();
          const filtroGenero = (genero as string).toLowerCase();
          match = match && jogadorGenero === filtroGenero;
        }

        // Filtrar por nível
        if (nivel) {
          const jogadorNivel = jogador.jogadorNivel || "";
          const filtroNivel = (nivel as string).toLowerCase();
          match = match && jogadorNivel === filtroNivel;
        }

        return match;
      });

      console.log(
        `✅ Ranking filtrado: ${rankingFiltrado.length} jogadores (gênero: ${genero}, nível: ${nivel})`
      );
    }

    // Formatar resposta com campos compatíveis (novos + legados)
    const rankingFormatado = rankingFiltrado.map((jogador, index) => ({
      // IDs
      id: jogador.jogadorId,
      jogadorId: jogador.jogadorId,

      // Nome
      nome: jogador.jogadorNome,
      jogadorNome: jogador.jogadorNome,

      // Nível
      nivel: jogador.jogadorNivel,
      jogadorNivel: jogador.jogadorNivel,

      // ✅ GÊNERO (importante para o frontend)
      genero: jogador.jogadorGenero,
      jogadorGenero: jogador.jogadorGenero,

      // Pontos
      pontos: jogador.pontos,
      ranking: jogador.pontos,

      // ✨ NOVOS CAMPOS (estatísticas agregadas)
      etapasParticipadas: jogador.etapasParticipadas,
      totalEtapas: jogador.etapasParticipadas, // alias

      vitorias: jogador.vitorias,
      totalVitorias: jogador.vitorias, // alias

      derrotas: jogador.derrotas,
      totalDerrotas: jogador.derrotas, // alias

      // Campos adicionais (opcional)
      jogos: jogador.jogos,
      setsVencidos: jogador.setsVencidos,
      setsPerdidos: jogador.setsPerdidos,
      gamesVencidos: jogador.gamesVencidos,
      gamesPerdidos: jogador.gamesPerdidos,
      saldoSets: jogador.saldoSets,
      saldoGames: jogador.saldoGames,

      // Posição no ranking (recalculada após filtro)
      posicao: index + 1,
    }));

    console.log("✅ Ranking formatado com sucesso!");

    res.json({
      success: true,
      data: rankingFormatado,
    });
  } catch (error: any) {
    console.error("❌ Erro ao buscar ranking:", error);
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
 * Buscar estatísticas AGREGADAS de um jogador (todas as etapas)
 * GET /api/public/:arenaSlug/jogadores/:jogadorId/estatisticas
 */
router.get(
  "/:arenaSlug/jogadores/:jogadorId/estatisticas",
  async (req: Request, res: Response) => {
    try {
      const { arenaSlug, jogadorId } = req.params;

      console.log("📊 Buscando estatísticas agregadas:", {
        arenaSlug,
        jogadorId,
      });

      const arena = await arenaService.getArenaBySlug(arenaSlug);

      // Buscar estatísticas agregadas (soma de todas as etapas)
      const stats =
        await estatisticasJogadorService.buscarEstatisticasAgregadas(
          jogadorId,
          arena.id
        );

      console.log("✅ Estatísticas agregadas:", stats);

      res.json({
        success: true,
        data: stats || {
          totalVitorias: 0,
          totalDerrotas: 0,
          totalJogos: 0,
          totalEtapas: 0,
          totalPontos: 0,
        },
      });
    } catch (error: any) {
      console.error("❌ Erro ao buscar estatísticas agregadas:", error);
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
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar estatísticas",
    });
  }
});

export default router;
