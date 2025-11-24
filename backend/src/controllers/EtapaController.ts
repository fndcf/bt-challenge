import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import etapaService from "../services/EtapaService";
import chaveService from "../services/ChaveService";
import {
  CriarEtapaSchema,
  AtualizarEtapaSchema,
  InscreverJogadorSchema,
  FiltrosEtapa,
} from "../models/Etapa";
import { z } from "zod";
import ChaveService from "../services/ChaveService";
import EtapaService from "../services/EtapaService";

/**
 * Controller para gerenciar etapas
 */
class EtapaController {
  [x: string]: any;
  /**
   * Criar nova etapa
   * POST /api/etapas
   */
  async criar(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.arenaId || !req.user?.uid) {
        res.status(401).json({
          success: false,
          error: "Usuário não autenticado",
        });
        return;
      }

      const { arenaId, uid } = req.user;

      const dadosValidados = CriarEtapaSchema.parse(req.body);

      const etapa = await etapaService.criar(arenaId, uid, dadosValidados);

      res.status(201).json({
        success: true,
        data: etapa,
        message: "Etapa criada com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao criar etapa:", error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: "Dados inválidos",
          details: error.issues,
        });
        return;
      }

      if (error.message.includes("deve")) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Erro ao criar etapa",
      });
    }
  }

  /**
   * Buscar etapa por ID
   * GET /api/etapas/:id
   */
  async buscarPorId(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.arenaId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const arenaId = req.user.arenaId;
      const { id } = req.params;

      const etapa = await etapaService.buscarPorId(id, arenaId);

      if (!etapa) {
        res.status(404).json({
          success: false,
          error: "Etapa não encontrada",
        });
        return;
      }

      res.json({
        success: true,
        data: etapa,
      });
    } catch (error) {
      console.error("Erro ao buscar etapa:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao buscar etapa",
      });
    }
  }

  /**
   * Listar etapas
   * GET /api/etapas
   */
  async listar(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.arenaId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const arenaId = req.user.arenaId;

      const filtros: FiltrosEtapa = {
        arenaId,
        status: req.query.status as any,
        ordenarPor: req.query.ordenarPor as any,
        ordem: req.query.ordem as any,
        limite: req.query.limite ? parseInt(req.query.limite as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      const resultado = await etapaService.listar(filtros);

      res.json({
        success: true,
        data: resultado,
      });
    } catch (error) {
      console.error("Erro ao listar etapas:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao listar etapas",
      });
    }
  }

  /**
   * Atualizar etapa
   * PUT /api/etapas/:id
   */
  async atualizar(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.arenaId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const arenaId = req.user.arenaId;
      const { id } = req.params;

      const dadosValidados = AtualizarEtapaSchema.parse(req.body);

      // Validação extra: maxJogadores não pode ser menor que totalInscritos
      if (dadosValidados.maxJogadores !== undefined) {
        const etapaAtual = await etapaService.buscarPorId(id, arenaId);
        if (!etapaAtual) {
          res.status(404).json({
            success: false,
            error: "Etapa não encontrada",
          });
          return;
        }

        if (dadosValidados.maxJogadores < etapaAtual.totalInscritos) {
          res.status(400).json({
            success: false,
            error: `Não é possível reduzir para ${dadosValidados.maxJogadores} jogadores. A etapa já possui ${etapaAtual.totalInscritos} jogador(es) inscrito(s).`,
          });
          return;
        }
      }

      const etapaAtualizada = await etapaService.atualizar(
        id,
        arenaId,
        dadosValidados
      );

      res.json({
        success: true,
        data: etapaAtualizada,
        message: "Etapa atualizada com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao atualizar etapa:", error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: "Dados inválidos",
          details: error.issues,
        });
        return;
      }

      if (error.message.includes("não encontrada")) {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Erro ao atualizar etapa",
      });
    }
  }

  /**
   * Deletar etapa
   * DELETE /api/etapas/:id
   */
  async deletar(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.arenaId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const arenaId = req.user.arenaId;
      const { id } = req.params;

      await etapaService.deletar(id, arenaId);

      res.json({
        success: true,
        message: "Etapa deletada com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao deletar etapa:", error);

      if (error.message.includes("não encontrada")) {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (
        error.message.includes("possui") ||
        error.message.includes("inscritos") ||
        error.message.includes("chaves")
      ) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Erro ao deletar etapa",
      });
    }
  }

  /**
   * Inscrever jogador
   * POST /api/etapas/:id/inscrever
   */
  async inscreverJogador(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.arenaId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const arenaId = req.user.arenaId;
      const { id } = req.params;

      const dadosValidados = InscreverJogadorSchema.parse(req.body);

      const inscricao = await etapaService.inscreverJogador(
        id,
        arenaId,
        dadosValidados
      );

      res.status(201).json({
        success: true,
        data: inscricao,
        message: "Jogador inscrito com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao inscrever jogador:", error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: "Dados inválidos",
          details: error.issues,
        });
        return;
      }

      if (
        error.message.includes("não") ||
        error.message.includes("já") ||
        error.message.includes("atingiu")
      ) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Erro ao inscrever jogador",
      });
    }
  }

  /**
   * Cancelar inscrição
   * DELETE /api/etapas/:etapaId/inscricoes/:inscricaoId
   */
  async cancelarInscricao(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.arenaId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const arenaId = req.user.arenaId;
      const { etapaId, inscricaoId } = req.params;

      await etapaService.cancelarInscricao(inscricaoId, etapaId, arenaId);

      res.json({
        success: true,
        message: "Inscrição cancelada com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao cancelar inscrição:", error);

      if (error.message.includes("não") || error.message.includes("após")) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Erro ao cancelar inscrição",
      });
    }
  }

  /**
   * Listar inscrições
   * GET /api/etapas/:id/inscricoes
   */
  async listarInscricoes(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.arenaId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const arenaId = req.user.arenaId;
      const { id } = req.params;

      const inscricoes = await etapaService.listarInscricoes(id, arenaId);

      res.json({
        success: true,
        data: inscricoes,
      });
    } catch (error) {
      console.error("Erro ao listar inscrições:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao listar inscrições",
      });
    }
  }

  /**
   * Encerrar inscrições
   * POST /api/etapas/:id/encerrar-inscricoes
   */
  async encerrarInscricoes(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.arenaId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const arenaId = req.user.arenaId;
      const { id } = req.params;

      const etapa = await etapaService.encerrarInscricoes(id, arenaId);

      res.json({
        success: true,
        data: etapa,
        message: "Inscrições encerradas com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao encerrar inscrições:", error);

      if (error.message.includes("não")) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Erro ao encerrar inscrições",
      });
    }
  }

  /**
   * Reabrir inscrições
   * POST /api/etapas/:id/reabrir-inscricoes
   */
  async reabrirInscricoes(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.arenaId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const arenaId = req.user.arenaId;
      const { id } = req.params;

      const etapa = await etapaService.reabrirInscricoes(id, arenaId);

      res.json({
        success: true,
        data: etapa,
        message: "Inscrições reabertas com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao reabrir inscrições:", error);

      if (error.message.includes("não")) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Erro ao reabrir inscrições",
      });
    }
  }

  /**
   * Gerar chaves
   * POST /api/etapas/:id/gerar-chaves
   */
  async gerarChaves(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.arenaId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const arenaId = req.user.arenaId;
      const { id } = req.params;

      const resultado = await chaveService.gerarChaves(id, arenaId);

      res.json({
        success: true,
        data: resultado,
        message: "Chaves geradas com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao gerar chaves:", error);

      if (
        error.message.includes("não") ||
        error.message.includes("devem") ||
        error.message.includes("já") ||
        error.message.includes("mínimo")
      ) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Erro ao gerar chaves",
      });
    }
  }

  /**
   * Obter estatísticas
   * GET /api/etapas/stats
   */
  async obterEstatisticas(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.arenaId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const arenaId = req.user.arenaId;

      const estatisticas = await etapaService.obterEstatisticas(arenaId);

      res.json({
        success: true,
        data: estatisticas,
      });
    } catch (error) {
      console.error("Erro ao obter estatísticas:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao obter estatísticas",
      });
    }
  }
  /**
   * Buscar duplas de uma etapa
   * GET /api/etapas/:id/duplas
   */
  async buscarDuplas(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.arenaId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const arenaId = req.user.arenaId;
      const { id } = req.params;

      const duplas = await chaveService.buscarDuplas(id, arenaId);

      res.json({
        success: true,
        data: duplas,
      });
    } catch (error) {
      console.error("Erro ao buscar duplas:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao buscar duplas",
      });
    }
  }

  /**
   * Buscar grupos de uma etapa
   * GET /api/etapas/:id/grupos
   */
  async buscarGrupos(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.arenaId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const arenaId = req.user.arenaId;
      const { id } = req.params;

      const grupos = await chaveService.buscarGrupos(id, arenaId);

      res.json({
        success: true,
        data: grupos,
      });
    } catch (error) {
      console.error("Erro ao buscar grupos:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao buscar grupos",
      });
    }
  }

  /**
   * Buscar partidas de uma etapa
   * GET /api/etapas/:id/partidas
   */
  async buscarPartidas(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.arenaId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const arenaId = req.user.arenaId;
      const { id } = req.params;

      const partidas = await chaveService.buscarPartidas(id, arenaId);

      res.json({
        success: true,
        data: partidas,
      });
    } catch (error) {
      console.error("Erro ao buscar partidas:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao buscar partidas",
      });
    }
  }

  /**
   * Excluir chaves de uma etapa
   * DELETE /api/etapas/:id/chaves
   */
  async excluirChaves(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.arenaId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const arenaId = req.user.arenaId;
      const { id } = req.params;

      await chaveService.excluirChaves(id, arenaId);

      res.json({
        success: true,
        message: "Chaves excluídas com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao excluir chaves:", error);

      if (error.message.includes("não")) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Erro ao excluir chaves",
      });
    }
  }

  /**
   * Gerar fase eliminatória
   */
  async gerarFaseEliminatoria(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const arenaId = req.user?.arenaId;
      const { classificadosPorGrupo = 2 } = req.body;

      if (!arenaId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      await ChaveService.gerarFaseEliminatoria(
        id,
        arenaId,
        classificadosPorGrupo
      );

      res.status(201).json({
        message: "Fase eliminatória gerada com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao gerar fase eliminatória:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Buscar confrontos eliminatórios
   */
  async buscarConfrontosEliminatorios(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const arenaId = req.user?.arenaId;
      const { fase } = req.query;

      if (!arenaId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      console.log("📥 Buscando confrontos eliminatórios:", {
        etapaId: id,
        arenaId,
        fase: fase || undefined,
      });

      const confrontos = await ChaveService.buscarConfrontosEliminatorios(
        id,
        arenaId,
        fase as any
      );

      console.log(`✅ Retornando ${confrontos.length} confrontos`);

      res.json(confrontos);
    } catch (error: any) {
      console.error("Erro ao buscar confrontos eliminatórios:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Cancelar/Excluir fase eliminatória
   */
  async cancelarFaseEliminatoria(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const arenaId = req.user?.arenaId;

      if (!arenaId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      await ChaveService.cancelarFaseEliminatoria(id, arenaId);

      res.json({
        message: "Fase eliminatória cancelada com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao cancelar fase eliminatória:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Encerrar etapa
   */
  async encerrarEtapa(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const arenaId = req.user?.arenaId;

      if (!arenaId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      await EtapaService.encerrarEtapa(id, arenaId);

      res.json({
        message: "Etapa encerrada com sucesso! ",
      });
    } catch (error: any) {
      console.error("Erro ao encerrar etapa:", error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default new EtapaController();
