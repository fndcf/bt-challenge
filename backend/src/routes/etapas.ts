import { Router } from "express";
import chave from "../controllers/etapas/ChaveController";
import desempate from "../controllers/etapas/DesempateController";
import etapa from "../controllers/etapas/EtapaController";
import inscricao from "../controllers/etapas/InscricaoController";
import reiDaPraia from "../controllers/etapas/ReiDaPraiaController";
import superX from "../controllers/etapas/SuperXController";
import teams from "../controllers/etapas/TeamsController";
import { requireAuth } from "../middlewares/auth";
import { exigirEtapaDaArena } from "../middlewares/etapaDaArena";

const router = Router();

// Middleware de autenticação para todas as rotas
router.use(requireAuth);

router.param("id", exigirEtapaDaArena);

// ==================== ROTAS BASE ====================

/**
 * @route   POST /api/etapas
 * @desc    Criar nova etapa
 */
router.post("/", etapa.criar);

/**
 * @route   GET /api/etapas
 * @desc    Listar etapas com filtros
 */
router.get("/", etapa.listar);

/**
 * @route   GET /api/etapas/stats
 * @desc    Obter estatísticas de etapas
 */
router.get("/stats", etapa.obterEstatisticas);

// ==================== CONFRONTOS ELIMINATÓRIOS (rota sem :id primeiro) ====================

/**
 * @route   POST /api/etapas/confrontos-eliminatorios/:confrontoId/resultado
 * @desc    Registrar resultado de confronto eliminatório
 */
router.post("/confrontos-eliminatorios/:confrontoId/resultado", chave.registrarResultado);

// ==================== INSCRIÇÕES ====================

/**
 * @route   POST /api/etapas/:id/inscrever-lote
 * @desc    Inscrever jogadores na etapa (funciona para 1 ou mais)
 */
router.post("/:id/inscrever-lote", inscricao.inscrever);

/**
 * @route   GET /api/etapas/:id/inscricoes
 * @desc    Listar inscrições da etapa
 */
router.get("/:id/inscricoes", inscricao.listar);

/**
 * @route   DELETE /api/etapas/:id/inscricoes-lote
 * @desc    Cancelar inscrições em lote (funciona para 1 ou mais)
 * @body    { inscricaoIds: string[] }
 */
router.delete("/:id/inscricoes-lote", inscricao.cancelar);

/**
 * @route   POST /api/etapas/:id/encerrar-inscricoes
 * @desc    Encerrar inscrições da etapa
 */
router.post("/:id/encerrar-inscricoes", inscricao.encerrar);

/**
 * @route   POST /api/etapas/:id/reabrir-inscricoes
 * @desc    Reabrir inscrições da etapa
 */
router.post("/:id/reabrir-inscricoes", inscricao.reabrir);

// ==================== CHAVES (DUPLA FIXA) ====================

/**
 * @route   POST /api/etapas/:id/gerar-chaves
 * @desc    Gerar chaves da etapa
 */
router.post("/:id/gerar-chaves", chave.gerar);

/**
 * @route   POST /api/etapas/:id/formar-duplas-manual
 * @desc    Formar duplas manualmente e gerar chaves (DUPLA FIXA)
 */
router.post("/:id/formar-duplas-manual", chave.formarDuplas);

/**
 * @route   DELETE /api/etapas/:id/chaves
 * @desc    Excluir chaves da etapa
 */
router.delete("/:id/chaves", chave.excluir);

/**
 * @route   GET /api/etapas/:id/exportar-sumula
 * @desc    Exportar súmula (partidas dos grupos) para Excel
 */
router.get("/:id/exportar-sumula", etapa.exportarSumula);

/**
 * @route   GET /api/etapas/:id/duplas
 * @desc    Buscar duplas da etapa
 */
router.get("/:id/duplas", chave.buscarDuplas);

/**
 * @route   GET /api/etapas/:id/grupos
 * @desc    Buscar grupos da etapa
 */
router.get("/:id/grupos", chave.buscarGrupos);

/**
 * @route   GET /api/etapas/:id/partidas
 * @desc    Buscar partidas da etapa
 */
router.get("/:id/partidas", chave.buscarPartidas);

// ==================== FASE ELIMINATÓRIA (DUPLA FIXA) ====================

/**
 * @route   POST /api/etapas/:id/gerar-eliminatoria
 * @desc    Gerar fase eliminatória
 */
router.post("/:id/gerar-eliminatoria", chave.gerarEliminatoria);

/**
 * @route   GET /api/etapas/:id/confrontos-eliminatorios
 * @desc    Buscar confrontos eliminatórios da etapa
 */
router.get("/:id/confrontos-eliminatorios", chave.buscarConfrontos);

/**
 * @route   DELETE /api/etapas/:id/cancelar-eliminatoria
 * @desc    Cancelar fase eliminatória
 */
router.delete("/:id/cancelar-eliminatoria", chave.cancelarEliminatoria);

/**
 * @route   POST /api/etapas/:id/encerrar
 * @desc    Encerrar etapa
 */
router.post("/:id/encerrar", etapa.encerrar);

/**
 * @route   GET /api/etapas/:id/empates-pendentes
 * @desc    Listar empates nos grupos aguardando decisão do admin
 */
router.get("/:id/empates-pendentes", desempate.listar);

/**
 * @route   POST /api/etapas/:id/desempate
 * @desc    Resolver empate de um grupo (sorteio ou ordem manual)
 */
router.post("/:id/desempate", desempate.resolver);

// ==================== REI DA PRAIA ====================

/**
 * @route   POST /api/etapas/:id/rei-da-praia/gerar-chaves
 * @desc    Gerar chaves no formato Rei da Praia
 */
router.post("/:id/rei-da-praia/gerar-chaves", reiDaPraia.gerarChaves);

/**
 * @route   GET /api/etapas/:id/rei-da-praia/grupos
 * @desc    Buscar grupos da etapa Rei da Praia
 */
router.get("/:id/rei-da-praia/grupos", chave.buscarGrupos);

/**
 * @route   GET /api/etapas/:id/rei-da-praia/jogadores
 * @desc    Buscar jogadores/estatísticas da etapa Rei da Praia
 */
router.get("/:id/rei-da-praia/jogadores", reiDaPraia.buscarJogadores);

/**
 * @route   GET /api/etapas/:id/rei-da-praia/partidas
 * @desc    Buscar partidas da etapa Rei da Praia
 */
router.get("/:id/rei-da-praia/partidas", reiDaPraia.buscarPartidas);

/**
 * @route   POST /api/etapas/:id/rei-da-praia/resultados-lote
 * @desc    Registrar múltiplos resultados de partidas Rei da Praia em lote
 */
router.post("/:id/rei-da-praia/resultados-lote", reiDaPraia.registrarResultados);

/**
 * @route   GET /api/etapas/:id/rei-da-praia/confrontos
 * @desc    Buscar confrontos eliminatórios Rei da Praia
 */
router.get("/:id/rei-da-praia/confrontos", chave.buscarConfrontos);

/**
 * @route   POST /api/etapas/:id/rei-da-praia/gerar-eliminatoria
 * @desc    Gerar fase eliminatória Rei da Praia
 */
router.post("/:id/rei-da-praia/gerar-eliminatoria", reiDaPraia.gerarEliminatoria);

/**
 * @route   POST /api/etapas/:id/rei-da-praia/cancelar-eliminatoria
 * @desc    Cancelar fase eliminatória Rei da Praia
 */
router.post("/:id/rei-da-praia/cancelar-eliminatoria", reiDaPraia.cancelarEliminatoria);

// ==================== SUPER X ====================

/**
 * @route   POST /api/etapas/:id/super-x/gerar-chaves
 * @desc    Gerar chaves no formato Super X (Super 8, Super 10, Super 12)
 */
router.post("/:id/super-x/gerar-chaves", superX.gerarChaves);

/**
 * @route   DELETE /api/etapas/:id/super-x/cancelar-chaves
 * @desc    Cancelar chaves Super X
 */
router.delete("/:id/super-x/cancelar-chaves", superX.cancelarChaves);

/**
 * @route   GET /api/etapas/:id/super-x/jogadores
 * @desc    Buscar jogadores/estatísticas da etapa Super X
 */
router.get("/:id/super-x/jogadores", superX.buscarJogadores);

/**
 * @route   GET /api/etapas/:id/super-x/partidas
 * @desc    Buscar partidas da etapa Super X
 */
router.get("/:id/super-x/partidas", superX.buscarPartidas);

/**
 * @route   GET /api/etapas/:id/super-x/grupo
 * @desc    Buscar grupo da etapa Super X
 */
router.get("/:id/super-x/grupo", superX.buscarGrupo);

/**
 * @route   POST /api/etapas/:id/super-x/resultados-lote
 * @desc    Registrar múltiplos resultados de partidas Super X em lote
 */
router.post("/:id/super-x/resultados-lote", superX.registrarResultados);

// ==================== TEAMS ====================

/**
 * @route   POST /api/etapas/:id/teams/gerar-equipes
 * @desc    Gerar equipes TEAMS automaticamente
 */
router.post("/:id/teams/gerar-equipes", teams.gerarEquipes);

/**
 * @route   POST /api/etapas/:id/teams/formar-equipes-manual
 * @desc    Formar equipes TEAMS manualmente
 */
router.post("/:id/teams/formar-equipes-manual", teams.formarEquipes);

/**
 * @route   GET /api/etapas/:id/teams/equipes
 * @desc    Buscar equipes TEAMS da etapa
 */
router.get("/:id/teams/equipes", teams.buscarEquipes);

/**
 * @route   GET /api/etapas/:id/teams/confrontos
 * @desc    Buscar confrontos TEAMS da etapa
 */
router.get("/:id/teams/confrontos", teams.buscarConfrontos);

/**
 * @route   POST /api/etapas/:id/teams/confrontos/:confrontoId/gerar-partidas
 * @desc    Gerar partidas de um confronto TEAMS
 */
router.post("/:id/teams/confrontos/:confrontoId/gerar-partidas", teams.gerarPartidas);

/**
 * @route   POST /api/etapas/:id/teams/confrontos/:confrontoId/definir-partidas
 * @desc    Definir partidas manualmente de um confronto TEAMS
 */
router.post("/:id/teams/confrontos/:confrontoId/definir-partidas", teams.definirPartidas);

/**
 * @route   GET /api/etapas/:id/teams/confrontos/:confrontoId/partidas
 * @desc    Buscar partidas de um confronto TEAMS
 */
router.get("/:id/teams/confrontos/:confrontoId/partidas", teams.buscarPartidas);

/**
 * @route   POST /api/etapas/:id/teams/confrontos/:confrontoId/gerar-decider
 * @desc    Gerar decider de um confronto TEAMS
 */
router.post("/:id/teams/confrontos/:confrontoId/gerar-decider", teams.gerarDecider);

/**
 * @route   PATCH /api/etapas/:id/teams/equipes/:equipeId/renomear
 * @desc    Renomear uma equipe TEAMS
 */
router.patch("/:id/teams/equipes/:equipeId/renomear", teams.renomearEquipe);

/**
 * @route   POST /api/etapas/:id/teams/partidas/:partidaId/definir-jogadores
 * @desc    Definir jogadores de uma partida vazia (formação manual)
 */
router.post("/:id/teams/partidas/:partidaId/definir-jogadores", teams.definirJogadores);

/**
 * @route   POST /api/etapas/:id/teams/resultados-lote
 * @desc    Registrar múltiplos resultados de partidas TEAMS em lote
 */
router.post("/:id/teams/resultados-lote", teams.registrarResultados);

/**
 * @route   POST /api/etapas/:id/teams/recalcular-classificacao
 * @desc    Recalcular classificação das equipes TEAMS
 */
router.post("/:id/teams/recalcular-classificacao", teams.recalcularClassificacao);

/**
 * @route   DELETE /api/etapas/:id/teams/cancelar
 * @desc    Cancelar chaves TEAMS
 */
router.delete("/:id/teams/cancelar", teams.cancelarChaves);

/**
 * @route   DELETE /api/etapas/:id/teams/resetar-partidas
 * @desc    Resetar partidas TEAMS (mantém equipes e confrontos)
 */
router.delete("/:id/teams/resetar-partidas", teams.resetarPartidas);

/**
 * @route   POST /api/etapas/:id/teams/fase-eliminatoria
 * @desc    Gerar fase eliminatória TEAMS (preenche as vagas com os classificados)
 */
router.post("/:id/teams/fase-eliminatoria", teams.gerarEliminatoria);

/**
 * @route   DELETE /api/etapas/:id/teams/fase-eliminatoria
 * @desc    Cancelar fase eliminatória TEAMS (esvazia as vagas)
 */
router.delete("/:id/teams/fase-eliminatoria", teams.cancelarEliminatoria);

// ==================== SUBSTITUIÇÃO DE JOGADOR ====================

/**
 * @route   POST /api/etapas/:id/substituir-jogador
 * @desc    Substituir um jogador após chaves geradas (antes de partidas iniciadas)
 * @body    { jogadorAntigoId: string, jogadorNovoId: string }
 */
router.post("/:id/substituir-jogador", inscricao.substituirJogador);

/**
 * @route   GET /api/etapas/:id/jogadores-disponiveis
 * @desc    Buscar jogadores disponíveis para substituição (não estão na etapa)
 */
router.get("/:id/jogadores-disponiveis", inscricao.buscarJogadoresDisponiveis);

// ==================== ROTAS GENÉRICAS (devem ficar por último) ====================

/**
 * @route   GET /api/etapas/:id
 * @desc    Buscar etapa por ID
 */
router.get("/:id", etapa.buscarPorId);

/**
 * @route   PUT /api/etapas/:id
 * @desc    Atualizar etapa
 */
router.put("/:id", etapa.atualizar);

/**
 * @route   DELETE /api/etapas/:id
 * @desc    Deletar etapa
 */
router.delete("/:id", etapa.deletar);

export default router;
