import { Router, Request, Response } from "express";
import { arenaService } from "../services/ArenaService";
import etapaService from "../services/EtapaService";
import jogadorService from "../services/JogadorService";
import estatisticasJogadorService from "../services/EstatisticasJogadorService";
import chaveService from "../services/ChaveService";
import { db } from "../config/firebase";
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
      data: {
        id: arena.id,
        nome: arena.nome,
        slug: arena.slug,
        ativa: arena.ativa,
      },
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
      data: resultado,
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
        data: etapa,
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

      const isReiDaPraia = etapa.formato === "rei_da_praia";
      const isSuperX = etapa.formato === "super_x";
      const isTeams = etapa.formato === "teams";
      // Super X e Rei da Praia usam jogadores individuais
      const isJogadoresIndividuais = isReiDaPraia || isSuperX;

      // TEAMS: Buscar equipes e confrontos diretamente (sem grupos tradicionais)
      if (isTeams) {
        // Buscar equipes da etapa (sem orderBy para evitar necessidade de índice composto)
        const equipesSnapshot = await db
          .collection("equipes")
          .where("etapaId", "==", etapaId)
          .where("arenaId", "==", arena.id)
          .get();

        const equipes = equipesSnapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              nome: data.nome,
              ordem: data.ordem || 0,
              grupoId: data.grupoId,
              grupoNome: data.grupoNome,
              posicaoGrupo: data.posicao || 0, // Campo correto é 'posicao'
              pontos: data.pontos || 0,
              vitorias: data.vitorias || 0,
              derrotas: data.derrotas || 0,
              jogosVencidos: data.jogosVencidos || 0,
              jogosPerdidos: data.jogosPerdidos || 0,
              saldoJogos: data.saldoJogos || 0,
              classificada: data.classificada || false,
              jogadores: data.jogadores || [],
            };
          })
          .sort((a, b) => a.ordem - b.ordem); // Ordenar em JavaScript

        // Buscar confrontos da etapa (sem orderBy para evitar necessidade de índice composto)
        const confrontosSnapshot = await db
          .collection("confrontos_equipe")
          .where("etapaId", "==", etapaId)
          .where("arenaId", "==", arena.id)
          .get();

        // Buscar todas as partidas da etapa
        const partidasSnapshot = await db
          .collection("partidas_teams")
          .where("etapaId", "==", etapaId)
          .where("arenaId", "==", arena.id)
          .get();

        // Mapear partidas por confrontoId
        const partidasPorConfronto = new Map<string, any[]>();
        partidasSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          const confrontoId = data.confrontoId;
          if (!partidasPorConfronto.has(confrontoId)) {
            partidasPorConfronto.set(confrontoId, []);
          }
          partidasPorConfronto.get(confrontoId)!.push({
            id: doc.id,
            ordem: data.ordem || 0,
            tipoJogo: data.tipoJogo,
            status: data.status || "agendada",
            dupla1: data.dupla1,
            dupla2: data.dupla2,
            setsDupla1: data.setsDupla1 || 0,
            setsDupla2: data.setsDupla2 || 0,
            placar: data.placar || [],
            vencedoraEquipeId: data.vencedoraEquipeId,
            vencedoraEquipeNome: data.vencedoraEquipeNome,
          });
        });

        // Ordenar partidas por ordem dentro de cada confronto
        partidasPorConfronto.forEach((partidas) => {
          partidas.sort((a, b) => a.ordem - b.ordem);
        });

        const confrontos = confrontosSnapshot.docs
          .map((doc) => {
            const data = doc.data();
            const confrontoId = doc.id;
            return {
              id: confrontoId,
              fase: data.fase || "GRUPOS", // Fase: GRUPOS, SEMIFINAL, FINAL, etc.
              grupoId: data.grupoId,
              grupoNome: data.grupoNome,
              ordem: data.ordem || 0,
              rodada: data.rodada,
              equipe1Id: data.equipe1Id,
              equipe2Id: data.equipe2Id,
              equipe1Nome: data.equipe1Nome,
              equipe2Nome: data.equipe2Nome,
              equipe1Origem: data.equipe1Origem,
              equipe2Origem: data.equipe2Origem,
              status: data.status || "agendado",
              jogosEquipe1: data.jogosEquipe1 || 0,
              jogosEquipe2: data.jogosEquipe2 || 0,
              vencedoraId: data.vencedoraId,
              vencedoraNome: data.vencedoraNome,
              // Incluir partidas detalhadas
              partidas: partidasPorConfronto.get(confrontoId) || [],
              criadoEm: data.criadoEm,
            };
          })
          .sort((a, b) => a.ordem - b.ordem); // Ordenar em JavaScript

        // Separar confrontos de grupos dos confrontos eliminatórios
        // IMPORTANTE: FaseEtapa.GRUPOS = "grupos" (minúsculo), não "GRUPOS"
        const confrontosGrupos = confrontos.filter(c => c.fase === "grupos" || c.fase === "GRUPOS");
        const confrontosEliminatorios = confrontos.filter(c => c.fase !== "grupos" && c.fase !== "GRUPOS");

        // Agrupar confrontos de grupos por grupoId
        const gruposMap = new Map<string, { equipes: any[]; confrontos: any[] }>();

        equipes.forEach((equipe) => {
          const grupoId = equipe.grupoId || "unico";
          if (!gruposMap.has(grupoId)) {
            gruposMap.set(grupoId, { equipes: [], confrontos: [] });
          }
          gruposMap.get(grupoId)!.equipes.push(equipe);
        });

        confrontosGrupos.forEach((confronto) => {
          const grupoId = confronto.grupoId || "unico";
          if (!gruposMap.has(grupoId)) {
            gruposMap.set(grupoId, { equipes: [], confrontos: [] });
          }
          gruposMap.get(grupoId)!.confrontos.push(confronto);
        });

        // Criar grupos processados para TEAMS
        const gruposProcessados: any[] = [];

        // Ordenar as chaves do Map para manter ordem consistente (A, B, C...)
        const gruposOrdenados = Array.from(gruposMap.entries()).sort((a, b) => {
          // "unico" sempre primeiro (ou único)
          if (a[0] === "unico") return -1;
          if (b[0] === "unico") return 1;
          // Ordenar alfabeticamente (A, B, C...)
          return a[0].localeCompare(b[0]);
        });

        // Adicionar grupos/classificação
        gruposOrdenados.forEach(([grupoId, data], index) => {
          // Ordenar equipes por posição/pontos
          const equipesOrdenadas = data.equipes.sort((a, b) => {
            if (a.posicaoGrupo && b.posicaoGrupo) {
              return a.posicaoGrupo - b.posicaoGrupo;
            }
            if (a.pontos !== b.pontos) return b.pontos - a.pontos;
            return b.saldoJogos - a.saldoJogos;
          });

          // Determinar o nome do grupo
          let nomeGrupo: string;
          if (grupoId === "unico") {
            nomeGrupo = "Classificação";
          } else {
            // Tentar usar grupoNome das equipes, senão usar o grupoId (que geralmente é "A", "B", etc.)
            const grupoNomeFromEquipe = data.equipes[0]?.grupoNome;
            if (grupoNomeFromEquipe) {
              nomeGrupo = grupoNomeFromEquipe;
            } else if (grupoId.length === 1) {
              // Se grupoId é uma letra (A, B, C...)
              nomeGrupo = `Grupo ${grupoId}`;
            } else {
              nomeGrupo = `Grupo ${index + 1}`;
            }
          }

          // Ordenar confrontos por rodada e ordem
          const confrontosOrdenados = data.confrontos.sort((a, b) => {
            if (a.rodada !== b.rodada) return (a.rodada || 0) - (b.rodada || 0);
            return a.ordem - b.ordem;
          });

          gruposProcessados.push({
            id: grupoId,
            nome: nomeGrupo,
            ordem: index + 1,
            totalEquipes: equipesOrdenadas.length,
            completo: false,
            equipes: equipesOrdenadas,
            confrontos: confrontosOrdenados,
            formato: "teams",
            tipo: "grupos", // Identificar como fase de grupos
          });
        });

        // Adicionar fases eliminatórias como grupos separados
        if (confrontosEliminatorios.length > 0) {
          // Agrupar por fase
          const fasesPriority: Record<string, number> = {
            "OITAVAS": 1,
            "QUARTAS": 2,
            "SEMIFINAL": 3,
            "FINAL": 4,
            "TERCEIRO_LUGAR": 5,
          };

          const faseLabels: Record<string, string> = {
            "OITAVAS": "Oitavas de Final",
            "QUARTAS": "Quartas de Final",
            "SEMIFINAL": "Semifinal",
            "FINAL": "Final",
            "TERCEIRO_LUGAR": "Disputa 3º Lugar",
          };

          const confrontosPorFase = new Map<string, any[]>();
          confrontosEliminatorios.forEach((confronto) => {
            const fase = confronto.fase;
            if (!confrontosPorFase.has(fase)) {
              confrontosPorFase.set(fase, []);
            }
            confrontosPorFase.get(fase)!.push(confronto);
          });

          // Ordenar fases e adicionar como grupos
          const fasesOrdenadas = Array.from(confrontosPorFase.entries())
            .sort((a, b) => (fasesPriority[a[0]] || 99) - (fasesPriority[b[0]] || 99));

          fasesOrdenadas.forEach(([fase, confrontosFase], index) => {
            gruposProcessados.push({
              id: `eliminatoria-${fase}`,
              nome: faseLabels[fase] || fase,
              ordem: 100 + (fasesPriority[fase] || index), // Garantir que apareçam depois dos grupos
              totalEquipes: 0,
              completo: false,
              equipes: [], // Sem equipes, só confrontos
              confrontos: confrontosFase.sort((a, b) => a.ordem - b.ordem),
              formato: "teams",
              tipo: "eliminatoria", // Identificar como fase eliminatória
            });
          });
        }

        // Ordenar todos os grupos/fases
        gruposProcessados.sort((a, b) => a.ordem - b.ordem);

        return res.json({
          success: true,
          data: gruposProcessados,
        });
      }

      const grupos = await chaveService.buscarGrupos(etapaId, arena.id);

      const gruposProcessados = await Promise.all(
        grupos.map(async (grupo) => {
          if (isJogadoresIndividuais) {
            // REI DA PRAIA e SUPER X: Jogadores individuais
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
                if (a.posicaoGrupo && b.posicaoGrupo) {
                  return a.posicaoGrupo - b.posicaoGrupo;
                }
                if (a.pontosGrupo !== b.pontosGrupo) {
                  return b.pontosGrupo - a.pontosGrupo;
                }
                return b.saldoGamesGrupo - a.saldoGamesGrupo;
              });

            const partidasSnapshot = await db
              .collection("partidas_rei_da_praia")
              .where("grupoId", "==", grupo.id)
              .where("etapaId", "==", etapaId)
              .orderBy("criadoEm", "asc")
              .get();

            const partidas = partidasSnapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                dupla1Nome: data.dupla1Nome,
                dupla2Nome: data.dupla2Nome,
                status: data.status,
                setsDupla1: data.setsDupla1 || 0,
                setsDupla2: data.setsDupla2 || 0,
                placar: data.placar || [],
                vencedores: data.vencedores || [],
                vencedoresNomes: data.vencedoresNomes,
                criadoEm: data.criadoEm,
              };
            });

            return {
              id: grupo.id,
              nome: grupo.nome,
              ordem: grupo.ordem,
              totalJogadores: jogadores.length,
              completo: grupo.completo || false,
              jogadores,
              partidas,
              formato: etapa.formato, // rei_da_praia ou super_x
            };
          } else {
            // DUPLA FIXA
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

            const partidasSnapshot = await db
              .collection("partidas")
              .where("grupoId", "==", grupo.id)
              .orderBy("criadoEm", "asc")
              .get();

            const partidas = partidasSnapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                dupla1Id: data.dupla1Id,
                dupla2Id: data.dupla2Id,
                dupla1Nome: data.dupla1Nome,
                dupla2Nome: data.dupla2Nome,
                status: data.status,
                setsDupla1: data.setsDupla1 || 0,
                setsDupla2: data.setsDupla2 || 0,
                placar: data.placar || [],
                vencedoraId: data.vencedoraId,
                vencedoraNome: data.vencedoraNome,
                criadoEm: data.criadoEm,
              };
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

      res.json({
        success: true,
        data: gruposProcessados,
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
      const confrontos = await chaveService.buscarConfrontosEliminatorios(
        etapaId,
        arena.id
      );

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

      const confrontosPorFase = new Map<string, any[]>();

      confrontos.forEach((confronto) => {
        const fase = confronto.fase.toUpperCase();
        if (!confrontosPorFase.has(fase)) {
          confrontosPorFase.set(fase, []);
        }
        confrontosPorFase.get(fase)!.push(confronto);
      });

      const ordensFase: Record<string, number> = {
        FINAL: 1,
        SEMIFINAL: 2,
        QUARTAS: 3,
        OITAVAS: 4,
      };

      const fasesOrdenadas = Array.from(confrontosPorFase.keys()).sort(
        (a, b) => (ordensFase[a] || 99) - (ordensFase[b] || 99)
      );

      const rodadas = await Promise.all(
        fasesOrdenadas.map(async (fase) => {
          const confrontosDaFase = confrontosPorFase.get(fase)!;

          const partidasComPlacar = await Promise.all(
            confrontosDaFase.map(async (confronto) => {
              let placarDetalhado = null;

              if (confronto.partidaId) {
                try {
                  const partidaDoc = await db
                    .collection("partidas")
                    .doc(confronto.partidaId)
                    .get();

                  if (partidaDoc.exists) {
                    const partida = partidaDoc.data();
                    if (
                      partida &&
                      partida.placar &&
                      Array.isArray(partida.placar)
                    ) {
                      placarDetalhado = partida.placar;
                    }
                  }
                } catch (err) {
                  // Silenciosamente ignorar erro de placar individual
                }
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
                  confronto.status === "finalizada" ||
                  confronto.status === "FINALIZADA"
                    ? "finalizada"
                    : confronto.status === "BYE" || confronto.status === "bye"
                    ? "bye"
                    : confronto.status === "EM_ANDAMENTO" ||
                      confronto.status === "em_andamento"
                    ? "em_andamento"
                    : "agendada",
              };
            })
          );

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

          return {
            numero: ordensFase[fase] || 99,
            nome: nomeFase,
            partidas: partidasComPlacar,
          };
        })
      );

      res.json({
        success: true,
        data: {
          formato: "eliminacao_simples",
          temChaves: true,
          rodadas,
        },
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
      limite: parseInt(limite as string),
      offset: parseInt(offset as string),
    });

    res.json({
      success: true,
      data: resultado,
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
        data: jogador,
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

      const snapshot = await db
        .collection("estatisticas_jogador")
        .where("jogadorId", "==", jogadorId)
        .where("arenaId", "==", arena.id)
        .get();

      if (snapshot.empty) {
        return res.json({ success: true, data: [] });
      }

      const historicoEnriquecido = await Promise.all(
        snapshot.docs.map(async (doc) => {
          try {
            const stat = doc.data();

            const etapaDoc = await db
              .collection("etapas")
              .doc(stat.etapaId)
              .get();
            const etapa = etapaDoc.exists ? etapaDoc.data() : null;

            const posicao = converterColocacaoParaPosicao(stat.colocacao);

            return {
              id: doc.id,
              etapaId: stat.etapaId,
              etapaNome: etapa?.nome || "Etapa Sem Nome",

              posicao: posicao,
              colocacao: stat.colocacao,

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
            return null;
          }
        })
      );

      const historicoFiltrado = historicoEnriquecido
        .filter((h) => h !== null)
        .sort((a, b) => {
          const dateA = a.criadoEm?.toDate?.() || new Date(0);
          const dateB = b.criadoEm?.toDate?.() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });

      res.json({
        success: true,
        data: historicoFiltrado,
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

    let ranking: any[];

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
