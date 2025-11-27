/**
 * Etapa Controller
 * backend/src/controllers/EtapaController.ts
 */

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
import logger from "../utils/logger";

class EtapaController {
  [x: string]: any;

  /**
   * Criar nova etapa
   * POST /api/etapas
   */
  async criar(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.arenaId || !req.user?.uid) {
        logger.warn("Tentativa de criar etapa sem autenticação");
        res.status(401).json({
          success: false,
          error: "Usuário não autenticado",
        });
        return;
      }

      const { arenaId, uid } = req.user;
      const dadosValidados = CriarEtapaSchema.parse(req.body);

      logger.info("Criando etapa", {
        arenaId,
        nome: dadosValidados.nome,
        formato: dadosValidados.formato,
      });

      const etapa = await etapaService.criar(arenaId, uid, dadosValidados);

      logger.info("Etapa criada com sucesso", {
        etapaId: etapa.id,
        nome: etapa.nome,
      });

      res.status(201).json({
        success: true,
        data: etapa,
        message: "Etapa criada com sucesso",
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        logger.warn("Dados inválidos ao criar etapa", { errors: error.issues });
        res.status(400).json({
          success: false,
          error: "Dados inválidos",
          details: error.issues,
        });
        return;
      }

      if (error.message.includes("deve")) {
        logger.warn("Validação falhou ao criar etapa", { erro: error.message });
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      logger.error(
        "Erro ao criar etapa",
        { arenaId: req.user?.arenaId },
        error
      );
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
        logger.warn("Tentativa de buscar etapa sem autenticação");
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const arenaId = req.user.arenaId;
      const { id } = req.params;

      const etapa = await etapaService.buscarPorId(id, arenaId);

      if (!etapa) {
        logger.warn("Etapa não encontrada", { etapaId: id, arenaId });
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
      logger.error(
        "Erro ao buscar etapa",
        { etapaId: req.params.id },
        error as Error
      );
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
        logger.warn("Tentativa de listar etapas sem autenticação");
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
      logger.error(
        "Erro ao listar etapas",
        { arenaId: req.user?.arenaId },
        error as Error
      );
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
        logger.warn("Tentativa de atualizar etapa sem autenticação");
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
          logger.warn("Etapa não encontrada ao atualizar", {
            etapaId: id,
            arenaId,
          });
          res.status(404).json({
            success: false,
            error: "Etapa não encontrada",
          });
          return;
        }

        if (dadosValidados.maxJogadores < etapaAtual.totalInscritos) {
          logger.warn("Tentativa de reduzir maxJogadores abaixo de inscritos", {
            etapaId: id,
            tentativa: dadosValidados.maxJogadores,
            inscritos: etapaAtual.totalInscritos,
          });
          res.status(400).json({
            success: false,
            error: `Não é possível reduzir para ${dadosValidados.maxJogadores} jogadores. A etapa já possui ${etapaAtual.totalInscritos} jogador(es) inscrito(s).`,
          });
          return;
        }
      }

      logger.info("Atualizando etapa", { etapaId: id, arenaId });

      const etapaAtualizada = await etapaService.atualizar(
        id,
        arenaId,
        dadosValidados
      );

      logger.info("Etapa atualizada com sucesso", { etapaId: id });

      res.json({
        success: true,
        data: etapaAtualizada,
        message: "Etapa atualizada com sucesso",
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        logger.warn("Dados inválidos ao atualizar etapa", {
          errors: error.issues,
        });
        res.status(400).json({
          success: false,
          error: "Dados inválidos",
          details: error.issues,
        });
        return;
      }

      if (error.message.includes("não encontrada")) {
        logger.warn("Etapa não encontrada ao atualizar", {
          erro: error.message,
        });
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      logger.error(
        "Erro ao atualizar etapa",
        { etapaId: req.params.id },
        error
      );
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
        logger.warn("Tentativa de deletar etapa sem autenticação");
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const arenaId = req.user.arenaId;
      const { id } = req.params;

      logger.info("Deletando etapa", { etapaId: id, arenaId });

      await etapaService.deletar(id, arenaId);

      logger.info("Etapa deletada com sucesso", { etapaId: id });

      res.json({
        success: true,
        message: "Etapa deletada com sucesso",
      });
    } catch (error: any) {
      if (error.message.includes("não encontrada")) {
        logger.warn("Etapa não encontrada ao deletar", { erro: error.message });
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
        logger.warn("Não é possível deletar etapa", { erro: error.message });
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      logger.error("Erro ao deletar etapa", { etapaId: req.params.id }, error);
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
        logger.warn("Tentativa de inscrever jogador sem autenticação");
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const arenaId = req.user.arenaId;
      const { id } = req.params;
      const dadosValidados = InscreverJogadorSchema.parse(req.body);

      logger.info("Inscrevendo jogador", {
        etapaId: id,
        jogadorId: dadosValidados.jogadorId,
      });

      const inscricao = await etapaService.inscreverJogador(
        id,
        arenaId,
        dadosValidados
      );

      logger.info("Jogador inscrito com sucesso", {
        inscricaoId: inscricao.id,
        etapaId: id,
      });

      res.status(201).json({
        success: true,
        data: inscricao,
        message: "Jogador inscrito com sucesso",
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        logger.warn("Dados inválidos ao inscrever jogador", {
          errors: error.issues,
        });
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
        logger.warn("Validação falhou ao inscrever", { erro: error.message });
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      logger.error(
        "Erro ao inscrever jogador",
        { etapaId: req.params.id },
        error
      );
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
        logger.warn("Tentativa de cancelar inscrição sem autenticação");
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const arenaId = req.user.arenaId;
      const { etapaId, inscricaoId } = req.params;

      logger.info("Cancelando inscrição", { inscricaoId, etapaId });

      // 1. Buscar inscrição para pegar jogadorId
      const inscricao = await etapaService.buscarInscricao(
        etapaId,
        arenaId,
        inscricaoId
      );

      if (!inscricao) {
        logger.warn("Inscrição não encontrada", { inscricaoId });
        res.status(404).json({
          success: false,
          error: "Inscrição não encontrada",
        });
        return;
      }

      // 2. Cancelar inscrição
      await etapaService.cancelarInscricao(inscricaoId, etapaId, arenaId);
      logger.info("Inscrição cancelada", {
        inscricaoId,
        jogador: inscricao.jogadorNome,
      });

      // 3. Remover cabeça de chave (se existir)
      try {
        const cabecaDeChaveService = (
          await import("../services/CabecaDeChaveService")
        ).default;
        await cabecaDeChaveService.remover(
          arenaId,
          etapaId,
          inscricao.jogadorId
        );
        logger.info("Cabeça de chave removida", {
          jogador: inscricao.jogadorNome,
        });
      } catch (error) {
        logger.debug("Jogador não era cabeça de chave", {
          jogador: inscricao.jogadorNome,
        });
      }

      res.json({
        success: true,
        message: "Inscrição cancelada com sucesso",
      });
    } catch (error: any) {
      if (error.message.includes("não") || error.message.includes("após")) {
        logger.warn("Validação falhou ao cancelar", { erro: error.message });
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      logger.error(
        "Erro ao cancelar inscrição",
        { inscricaoId: req.params.inscricaoId },
        error
      );
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
      logger.error(
        "Erro ao listar inscrições",
        { etapaId: req.params.id },
        error as Error
      );
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

      logger.info("Encerrando inscrições", { etapaId: id });

      const etapa = await etapaService.encerrarInscricoes(id, arenaId);

      logger.info("Inscrições encerradas", { etapaId: id });

      res.json({
        success: true,
        data: etapa,
        message: "Inscrições encerradas com sucesso",
      });
    } catch (error: any) {
      if (error.message.includes("não")) {
        logger.warn("Validação falhou ao encerrar", { erro: error.message });
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      logger.error(
        "Erro ao encerrar inscrições",
        { etapaId: req.params.id },
        error
      );
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

      logger.info("Reabrindo inscrições", { etapaId: id });

      const etapa = await etapaService.reabrirInscricoes(id, arenaId);

      logger.info("Inscrições reabertas", { etapaId: id });

      res.json({
        success: true,
        data: etapa,
        message: "Inscrições reabertas com sucesso",
      });
    } catch (error: any) {
      if (error.message.includes("não")) {
        logger.warn("Validação falhou ao reabrir", { erro: error.message });
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      logger.error(
        "Erro ao reabrir inscrições",
        { etapaId: req.params.id },
        error
      );
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

      const etapa = await etapaService.buscarPorId(id, arenaId);
      if (!etapa) {
        res.status(404).json({ error: "Etapa não encontrada" });
        return;
      }

      if (etapa.formato === "rei_da_praia") {
        logger.warn("Tentativa de gerar chaves para Rei da Praia", {
          etapaId: id,
        });
        res.status(400).json({
          success: false,
          error:
            "Esta etapa é do formato Rei da Praia. Use a rota /rei-da-praia/gerar-chaves",
        });
        return;
      }

      logger.info("Gerando chaves", { etapaId: id, formato: etapa.formato });

      const resultado = await chaveService.gerarChaves(id, arenaId);

      logger.info("Chaves geradas com sucesso", {
        etapaId: id,
        totalDuplas: resultado.duplas.length,
      });

      res.json({
        success: true,
        data: resultado,
        message: "Chaves geradas com sucesso",
      });
    } catch (error: any) {
      if (
        error.message.includes("não") ||
        error.message.includes("devem") ||
        error.message.includes("já") ||
        error.message.includes("mínimo")
      ) {
        logger.warn("Validação falhou ao gerar chaves", {
          erro: error.message,
        });
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      logger.error("Erro ao gerar chaves", { etapaId: req.params.id }, error);
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
      logger.error(
        "Erro ao obter estatísticas",
        { arenaId: req.user?.arenaId },
        error as Error
      );
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
      logger.error(
        "Erro ao buscar duplas",
        { etapaId: req.params.id },
        error as Error
      );
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
      logger.error(
        "Erro ao buscar grupos",
        { etapaId: req.params.id },
        error as Error
      );
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
      logger.error(
        "Erro ao buscar partidas",
        { etapaId: req.params.id },
        error as Error
      );
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

      logger.info("Excluindo chaves", { etapaId: id });

      await chaveService.excluirChaves(id, arenaId);

      logger.info("Chaves excluídas com sucesso", { etapaId: id });

      res.json({
        success: true,
        message: "Chaves excluídas com sucesso",
      });
    } catch (error: any) {
      if (error.message.includes("não")) {
        logger.warn("Validação falhou ao excluir chaves", {
          erro: error.message,
        });
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      logger.error("Erro ao excluir chaves", { etapaId: req.params.id }, error);
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

      logger.info("Gerando fase eliminatória", {
        etapaId: id,
        classificadosPorGrupo,
      });

      await ChaveService.gerarFaseEliminatoria(
        id,
        arenaId,
        classificadosPorGrupo
      );

      logger.info("Fase eliminatória gerada com sucesso", { etapaId: id });

      res.status(201).json({
        message: "Fase eliminatória gerada com sucesso",
      });
    } catch (error: any) {
      logger.error(
        "Erro ao gerar fase eliminatória",
        { etapaId: req.params.id },
        error
      );
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

      logger.debug("Buscando confrontos eliminatórios", {
        etapaId: id,
        arenaId,
        fase: fase || "todas",
      });

      const confrontos = await ChaveService.buscarConfrontosEliminatorios(
        id,
        arenaId,
        fase as any
      );

      logger.debug("Confrontos encontrados", { total: confrontos.length });

      res.json(confrontos);
    } catch (error: any) {
      logger.error(
        "Erro ao buscar confrontos eliminatórios",
        { etapaId: req.params.id },
        error
      );
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

      logger.info("Cancelando fase eliminatória", { etapaId: id });

      await ChaveService.cancelarFaseEliminatoria(id, arenaId);

      logger.info("Fase eliminatória cancelada com sucesso", { etapaId: id });

      res.json({
        message: "Fase eliminatória cancelada com sucesso",
      });
    } catch (error: any) {
      logger.error(
        "Erro ao cancelar fase eliminatória",
        { etapaId: req.params.id },
        error
      );
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

      logger.info("Encerrando etapa", { etapaId: id });

      await EtapaService.encerrarEtapa(id, arenaId);

      logger.info("Etapa encerrada com sucesso", { etapaId: id });

      res.json({
        message: "Etapa encerrada com sucesso! ",
      });
    } catch (error: any) {
      logger.error("Erro ao encerrar etapa", { etapaId: req.params.id }, error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default new EtapaController();
