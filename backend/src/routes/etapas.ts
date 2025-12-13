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
 * @route   POST /api/etapas/:id/inscrever-lote
 * @desc    Inscrever múltiplos jogadores na etapa (otimizado)
 */
router.post("/:id/inscrever-lote", (req, res) =>
  etapaController.inscreverJogadoresEmLote(req, res)
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

// ==================== SUPER X ====================

/**
 * @route   POST /api/etapas/:id/super-x/gerar-chaves
 * @desc    Gerar chaves no formato Super X (Super 8, Super 10, Super 12)
 */
router.post("/:id/super-x/gerar-chaves", (req, res) =>
  etapaController.gerarChavesSuperX(req, res)
);

/**
 * @route   DELETE /api/etapas/:id/super-x/cancelar-chaves
 * @desc    Cancelar chaves Super X
 */
router.delete("/:id/super-x/cancelar-chaves", (req, res) =>
  etapaController.cancelarChavesSuperX(req, res)
);

/**
 * @route   GET /api/etapas/:id/super-x/jogadores
 * @desc    Buscar jogadores/estatísticas da etapa Super X
 */
router.get("/:id/super-x/jogadores", (req, res) =>
  etapaController.buscarJogadoresSuperX(req, res)
);

/**
 * @route   GET /api/etapas/:id/super-x/partidas
 * @desc    Buscar partidas da etapa Super X
 */
router.get("/:id/super-x/partidas", (req, res) =>
  etapaController.buscarPartidasSuperX(req, res)
);

/**
 * @route   GET /api/etapas/:id/super-x/grupo
 * @desc    Buscar grupo da etapa Super X
 */
router.get("/:id/super-x/grupo", (req, res) =>
  etapaController.buscarGrupoSuperX(req, res)
);

/**
 * @route   POST /api/etapas/:id/super-x/partidas/:partidaId/resultado
 * @desc    Registrar resultado de partida Super X
 */
router.post("/:id/super-x/partidas/:partidaId/resultado", (req, res) =>
  etapaController.registrarResultadoSuperX(req, res)
);

// ==================== TEAMS ====================

/**
 * @route   POST /api/etapas/:id/teams/gerar-equipes
 * @desc    Gerar equipes TEAMS automaticamente
 */
router.post("/:id/teams/gerar-equipes", (req, res) =>
  etapaController.gerarEquipesTeams(req, res)
);

/**
 * @route   POST /api/etapas/:id/teams/formar-equipes-manual
 * @desc    Formar equipes TEAMS manualmente
 */
router.post("/:id/teams/formar-equipes-manual", (req, res) =>
  etapaController.formarEquipesManualTeams(req, res)
);

/**
 * @route   GET /api/etapas/:id/teams/equipes
 * @desc    Buscar equipes TEAMS da etapa
 */
router.get("/:id/teams/equipes", (req, res) =>
  etapaController.buscarEquipesTeams(req, res)
);

/**
 * @route   GET /api/etapas/:id/teams/confrontos
 * @desc    Buscar confrontos TEAMS da etapa
 */
router.get("/:id/teams/confrontos", (req, res) =>
  etapaController.buscarConfrontosTeams(req, res)
);

/**
 * @route   POST /api/etapas/:id/teams/confrontos/:confrontoId/gerar-partidas
 * @desc    Gerar partidas de um confronto TEAMS
 */
router.post("/:id/teams/confrontos/:confrontoId/gerar-partidas", (req, res) =>
  etapaController.gerarPartidasConfrontoTeams(req, res)
);

/**
 * @route   POST /api/etapas/:id/teams/confrontos/:confrontoId/definir-partidas
 * @desc    Definir partidas manualmente de um confronto TEAMS
 */
router.post("/:id/teams/confrontos/:confrontoId/definir-partidas", (req, res) =>
  etapaController.definirPartidasManualTeams(req, res)
);

/**
 * @route   GET /api/etapas/:id/teams/confrontos/:confrontoId/partidas
 * @desc    Buscar partidas de um confronto TEAMS
 */
router.get("/:id/teams/confrontos/:confrontoId/partidas", (req, res) =>
  etapaController.buscarPartidasConfrontoTeams(req, res)
);

/**
 * @route   POST /api/etapas/:id/teams/confrontos/:confrontoId/gerar-decider
 * @desc    Gerar decider de um confronto TEAMS
 */
router.post("/:id/teams/confrontos/:confrontoId/gerar-decider", (req, res) =>
  etapaController.gerarDeciderTeams(req, res)
);

/**
 * @route   PATCH /api/etapas/:id/teams/equipes/:equipeId/renomear
 * @desc    Renomear uma equipe TEAMS
 */
router.patch("/:id/teams/equipes/:equipeId/renomear", (req, res) =>
  etapaController.renomearEquipeTeams(req, res)
);

/**
 * @route   POST /api/etapas/:id/teams/partidas/:partidaId/definir-jogadores
 * @desc    Definir jogadores de uma partida vazia (formação manual)
 */
router.post("/:id/teams/partidas/:partidaId/definir-jogadores", (req, res) =>
  etapaController.definirJogadoresPartidaTeams(req, res)
);

/**
 * @route   POST /api/etapas/:id/teams/partidas/:partidaId/resultado
 * @desc    Registrar resultado de partida TEAMS
 */
router.post("/:id/teams/partidas/:partidaId/resultado", (req, res) =>
  etapaController.registrarResultadoTeams(req, res)
);

/**
 * @route   POST /api/etapas/:id/teams/recalcular-classificacao
 * @desc    Recalcular classificação das equipes TEAMS
 */
router.post("/:id/teams/recalcular-classificacao", (req, res) =>
  etapaController.recalcularClassificacaoTeams(req, res)
);

/**
 * @route   DELETE /api/etapas/:id/teams/cancelar
 * @desc    Cancelar chaves TEAMS
 */
router.delete("/:id/teams/cancelar", (req, res) =>
  etapaController.cancelarChavesTeams(req, res)
);

/**
 * @route   DELETE /api/etapas/:id/teams/resetar-partidas
 * @desc    Resetar partidas TEAMS (mantém equipes e confrontos)
 */
router.delete("/:id/teams/resetar-partidas", (req, res) =>
  etapaController.resetarPartidasTeams(req, res)
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
