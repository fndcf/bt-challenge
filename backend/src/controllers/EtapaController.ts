/**
 * Controller para gerenciar etapas de torneio
 */

import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { BaseController } from "./BaseController";
import { ResponseHelper } from "../utils/responseHelper";
import etapaService from "../services/EtapaService";
import chaveService from "../services/ChaveService";
import {
  CriarEtapaSchema,
  AtualizarEtapaSchema,
  InscreverJogadorSchema,
  FiltrosEtapa,
  StatusEtapa,
  TipoChaveamentoReiDaPraia,
} from "../models/Etapa";
import { Timestamp } from "firebase-admin/firestore";
import { db } from "../config/firebase";
import { z } from "zod";
import logger from "../utils/logger";

class EtapaController extends BaseController {
  protected controllerName = "EtapaController";

  /**
   * Criar nova etapa
   * POST /api/etapas
   */
  async criar(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

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

      ResponseHelper.created(res, etapa, "Etapa criada com sucesso");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return this.handleZodError(res, error);
      }

      if (
        this.handleBusinessError(
          res,
          error,
          BaseController.ERROR_PATTERNS.BAD_REQUEST
        )
      ) {
        return;
      }

      this.handleGenericError(res, error, "criar etapa", {
        arenaId: req.user?.arenaId,
      });
    }
  }

  /**
   * Buscar etapa por ID
   * GET /api/etapas/:id
   */
  async buscarPorId(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      const etapa = await etapaService.buscarPorId(id, arenaId);

      if (!etapa) {
        logger.warn("Etapa não encontrada", { etapaId: id, arenaId });
        ResponseHelper.notFound(res, "Etapa não encontrada");
        return;
      }

      ResponseHelper.success(res, etapa);
    } catch (error: any) {
      this.handleGenericError(res, error, "buscar etapa", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Listar etapas
   * GET /api/etapas
   */
  async listar(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;

      const filtros: FiltrosEtapa = {
        arenaId,
        status: req.query.status as any,
        nivel: req.query.nivel as any,
        genero: req.query.genero as any,
        formato: req.query.formato as any,
        ordenarPor: req.query.ordenarPor as any,
        ordem: req.query.ordem as any,
        limite: req.query.limite ? parseInt(req.query.limite as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      const resultado = await etapaService.listar(filtros);

      ResponseHelper.success(res, resultado);
    } catch (error: any) {
      this.handleGenericError(res, error, "listar etapas", {
        arenaId: req.user?.arenaId,
      });
    }
  }

  /**
   * Atualizar etapa
   * PUT /api/etapas/:id
   */
  async atualizar(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
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
          ResponseHelper.notFound(res, "Etapa não encontrada");
          return;
        }

        if (dadosValidados.maxJogadores < etapaAtual.totalInscritos) {
          logger.warn("Tentativa de reduzir maxJogadores abaixo de inscritos", {
            etapaId: id,
            tentativa: dadosValidados.maxJogadores,
            inscritos: etapaAtual.totalInscritos,
          });
          ResponseHelper.badRequest(
            res,
            `Não é possível reduzir para ${dadosValidados.maxJogadores} jogadores. A etapa já possui ${etapaAtual.totalInscritos} jogador(es) inscrito(s).`
          );
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

      ResponseHelper.success(
        res,
        etapaAtualizada,
        "Etapa atualizada com sucesso"
      );
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return this.handleZodError(res, error);
      }

      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "atualizar etapa", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Deletar etapa
   * DELETE /api/etapas/:id
   */
  async deletar(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      logger.info("Deletando etapa", { etapaId: id, arenaId });

      await etapaService.deletar(id, arenaId);

      logger.info("Etapa deletada com sucesso", { etapaId: id });

      ResponseHelper.success(res, null, "Etapa deletada com sucesso");
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "deletar etapa", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Inscrever jogador
   * POST /api/etapas/:id/inscrever
   */
  async inscreverJogador(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
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

      ResponseHelper.created(res, inscricao, "Jogador inscrito com sucesso");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return this.handleZodError(res, error);
      }

      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "inscrever jogador", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Inscrever múltiplos jogadores em lote
   * POST /api/etapas/:id/inscrever-lote
   */
  async inscreverJogadoresEmLote(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;
      const { jogadorIds } = req.body;

      if (!Array.isArray(jogadorIds) || jogadorIds.length === 0) {
        ResponseHelper.badRequest(res, "jogadorIds deve ser um array não vazio");
        return;
      }

      logger.info("Inscrevendo jogadores em lote", {
        etapaId: id,
        quantidade: jogadorIds.length,
      });

      const resultado = await etapaService.inscreverJogadoresEmLote(
        id,
        arenaId,
        jogadorIds
      );

      if (resultado.erros.length > 0) {
        logger.warn("Algumas inscrições falharam", {
          etapaId: id,
          sucessos: resultado.inscricoes.length,
          falhas: resultado.erros.length,
        });
      }

      ResponseHelper.success(res, {
        message: `${resultado.inscricoes.length} jogador(es) inscrito(s) com sucesso`,
        inscricoes: resultado.inscricoes,
        erros: resultado.erros,
        total: jogadorIds.length,
        sucessos: resultado.inscricoes.length,
        falhas: resultado.erros.length,
      });
    } catch (error: any) {
      logger.error(
        "Erro ao inscrever jogadores em lote",
        { etapaId: req.params.id },
        error
      );

      if (error.message?.includes("Inscrições não estão abertas")) {
        ResponseHelper.badRequest(res, error.message);
        return;
      }

      if (error.message?.includes("Etapa não encontrada")) {
        ResponseHelper.notFound(res, error.message);
        return;
      }

      if (error.message?.includes("vagas disponíveis")) {
        ResponseHelper.badRequest(res, error.message);
        return;
      }

      this.handleGenericError(res, error, "inscrever jogadores em lote", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Cancelar inscrição
   * DELETE /api/etapas/:etapaId/inscricoes/:inscricaoId
   */
  async cancelarInscricao(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
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
        ResponseHelper.notFound(res, "Inscrição não encontrada");
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
      } catch {
        logger.debug("Jogador não era cabeça de chave", {
          jogador: inscricao.jogadorNome,
        });
      }

      ResponseHelper.success(res, null, "Inscrição cancelada com sucesso");
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "cancelar inscrição", {
        inscricaoId: req.params.inscricaoId,
      });
    }
  }

  /**
   * Cancelar múltiplas inscrições em lote
   * DELETE /api/etapas/:etapaId/inscricoes-lote
   * ✅ OTIMIZAÇÃO: Usa jogadorIds do resultado ao invés de buscar novamente
   */
  async cancelarInscricoesEmLote(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { etapaId } = req.params;
      const { inscricaoIds } = req.body;

      if (!Array.isArray(inscricaoIds) || inscricaoIds.length === 0) {
        ResponseHelper.badRequest(res, "inscricaoIds deve ser um array não vazio");
        return;
      }

      logger.info("Cancelando inscrições em lote", {
        etapaId,
        quantidade: inscricaoIds.length,
      });

      // ✅ O service agora retorna jogadorIds junto com o resultado
      const resultado = await etapaService.cancelarInscricoesEmLote(
        inscricaoIds,
        etapaId,
        arenaId
      );

      // ✅ OTIMIZAÇÃO: Remover cabeças de chave em background (não bloqueia a resposta)
      // Usa os jogadorIds já retornados pelo service
      if (resultado.jogadorIds.length > 0) {
        // Fire and forget - não espera completar
        import("../services/CabecaDeChaveService").then((module) => {
          const cabecaDeChaveService = module.default;
          // Remover em paralelo (Promise.allSettled ignora erros individuais)
          Promise.allSettled(
            resultado.jogadorIds.map((jogadorId) =>
              cabecaDeChaveService.remover(arenaId, etapaId, jogadorId)
            )
          ).catch(() => {
            // Ignorar erros - jogadores podem não ser cabeças de chave
          });
        }).catch(() => {
          logger.debug("Nenhuma cabeça de chave para remover");
        });
      }

      logger.info("Inscrições canceladas em lote", {
        etapaId,
        canceladas: resultado.canceladas,
        erros: resultado.erros.length,
      });

      ResponseHelper.success(res, {
        message: `${resultado.canceladas} inscrição(ões) cancelada(s) com sucesso`,
        canceladas: resultado.canceladas,
        erros: resultado.erros,
      });
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "cancelar inscrições em lote", {
        etapaId: req.params.etapaId,
      });
    }
  }

  /**
   * Listar inscrições
   * GET /api/etapas/:id/inscricoes
   */
  async listarInscricoes(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      const inscricoes = await etapaService.listarInscricoes(id, arenaId);

      ResponseHelper.success(res, inscricoes);
    } catch (error: any) {
      this.handleGenericError(res, error, "listar inscrições", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Encerrar inscrições
   * POST /api/etapas/:id/encerrar-inscricoes
   */
  async encerrarInscricoes(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      logger.info("Encerrando inscrições", { etapaId: id });

      const etapa = await etapaService.encerrarInscricoes(id, arenaId);

      logger.info("Inscrições encerradas", { etapaId: id });

      ResponseHelper.success(res, etapa, "Inscrições encerradas com sucesso");
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "encerrar inscrições", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Reabrir inscrições
   * POST /api/etapas/:id/reabrir-inscricoes
   */
  async reabrirInscricoes(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      logger.info("Reabrindo inscrições", { etapaId: id });

      const etapa = await etapaService.reabrirInscricoes(id, arenaId);

      logger.info("Inscrições reabertas", { etapaId: id });

      ResponseHelper.success(res, etapa, "Inscrições reabertas com sucesso");
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "reabrir inscrições", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Gerar chaves
   * POST /api/etapas/:id/gerar-chaves
   */
  async gerarChaves(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      const etapa = await etapaService.buscarPorId(id, arenaId);
      if (!etapa) {
        ResponseHelper.notFound(res, "Etapa não encontrada");
        return;
      }

      if (etapa.formato === "rei_da_praia") {
        logger.warn("Tentativa de gerar chaves para Rei da Praia", {
          etapaId: id,
        });
        ResponseHelper.badRequest(
          res,
          "Esta etapa é do formato Rei da Praia. Use a rota /rei-da-praia/gerar-chaves"
        );
        return;
      }

      logger.info("Gerando chaves", { etapaId: id, formato: etapa.formato });

      const resultado = await chaveService.gerarChaves(id, arenaId);

      logger.info("Chaves geradas com sucesso", {
        etapaId: id,
        totalDuplas: resultado.duplas.length,
      });

      ResponseHelper.success(res, resultado, "Chaves geradas com sucesso");
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "gerar chaves", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Obter estatísticas
   * GET /api/etapas/stats
   */
  async obterEstatisticas(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const estatisticas = await etapaService.obterEstatisticas(arenaId);

      ResponseHelper.success(res, estatisticas);
    } catch (error: any) {
      this.handleGenericError(res, error, "obter estatísticas", {
        arenaId: req.user?.arenaId,
      });
    }
  }

  /**
   * Buscar duplas de uma etapa
   * GET /api/etapas/:id/duplas
   */
  async buscarDuplas(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      const duplas = await chaveService.buscarDuplas(id, arenaId);

      ResponseHelper.success(res, duplas);
    } catch (error: any) {
      this.handleGenericError(res, error, "buscar duplas", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Buscar grupos de uma etapa
   * GET /api/etapas/:id/grupos
   */
  async buscarGrupos(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      const grupos = await chaveService.buscarGrupos(id, arenaId);

      ResponseHelper.success(res, grupos);
    } catch (error: any) {
      this.handleGenericError(res, error, "buscar grupos", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Buscar partidas de uma etapa
   * GET /api/etapas/:id/partidas
   */
  async buscarPartidas(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      const partidas = await chaveService.buscarPartidas(id, arenaId);

      ResponseHelper.success(res, partidas);
    } catch (error: any) {
      this.handleGenericError(res, error, "buscar partidas", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Excluir chaves de uma etapa
   * DELETE /api/etapas/:id/chaves
   */
  async excluirChaves(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      logger.info("Excluindo chaves", { etapaId: id });

      await chaveService.excluirChaves(id, arenaId);

      logger.info("Chaves excluídas com sucesso", { etapaId: id });

      ResponseHelper.success(res, null, "Chaves excluídas com sucesso");
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "excluir chaves", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Gerar fase eliminatória
   * POST /api/etapas/:id/fase-eliminatoria
   */
  async gerarFaseEliminatoria(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;
      const { classificadosPorGrupo = 2 } = req.body;

      logger.info("Gerando fase eliminatória", {
        etapaId: id,
        classificadosPorGrupo,
      });

      await chaveService.gerarFaseEliminatoria(
        id,
        arenaId,
        classificadosPorGrupo
      );

      logger.info("Fase eliminatória gerada com sucesso", { etapaId: id });

      ResponseHelper.created(res, null, "Fase eliminatória gerada com sucesso");
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "gerar fase eliminatória", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Buscar confrontos eliminatórios
   * GET /api/etapas/:id/confrontos-eliminatorios
   */
  async buscarConfrontosEliminatorios(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;
      const { fase } = req.query;

      logger.debug("Buscando confrontos eliminatórios", {
        etapaId: id,
        arenaId,
        fase: fase || "todas",
      });

      const confrontos = await chaveService.buscarConfrontosEliminatorios(
        id,
        arenaId,
        fase as any
      );

      logger.debug("Confrontos encontrados", { total: confrontos.length });

      ResponseHelper.success(res, confrontos);
    } catch (error: any) {
      this.handleGenericError(res, error, "buscar confrontos eliminatórios", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Cancelar fase eliminatória
   * DELETE /api/etapas/:id/fase-eliminatoria
   */
  async cancelarFaseEliminatoria(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      logger.info("Cancelando fase eliminatória", { etapaId: id });

      await chaveService.cancelarFaseEliminatoria(id, arenaId);

      logger.info("Fase eliminatória cancelada com sucesso", { etapaId: id });

      ResponseHelper.success(
        res,
        null,
        "Fase eliminatória cancelada com sucesso"
      );
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "cancelar fase eliminatória", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Encerrar etapa
   * POST /api/etapas/:id/encerrar
   */
  async encerrarEtapa(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      logger.info("Encerrando etapa", { etapaId: id });

      await etapaService.encerrarEtapa(id, arenaId);

      logger.info("Etapa encerrada com sucesso", { etapaId: id });

      ResponseHelper.success(res, null, "Etapa encerrada com sucesso!");
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "encerrar etapa", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Registrar resultado de confronto eliminatório
   * POST /api/etapas/confrontos-eliminatorios/:confrontoId/resultado
   */
  async registrarResultadoEliminatorio(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { confrontoId } = req.params;
      const { placar } = req.body;

      logger.info("Registrando resultado eliminatório", { confrontoId });

      const chaveService = (await import("../services/ChaveService")).default;
      await chaveService.registrarResultadoEliminatorio(
        confrontoId,
        arenaId,
        placar
      );

      logger.info("Resultado eliminatório registrado", { confrontoId });

      ResponseHelper.success(res, null, "Resultado registrado com sucesso");
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "registrar resultado eliminatório", {
        confrontoId: req.params.confrontoId,
      });
    }
  }

  // ==================== REI DA PRAIA ====================

  /**
   * Gerar chaves Rei da Praia
   * POST /api/etapas/:id/rei-da-praia/gerar-chaves
   */
  async gerarChavesReiDaPraia(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      logger.info("Gerando chaves Rei da Praia", { etapaId: id });

      const reiDaPraiaService = (await import("../services/ReiDaPraiaService"))
        .default;
      const resultado = await reiDaPraiaService.gerarChaves(id, arenaId);

      logger.info("Chaves Rei da Praia geradas", {
        etapaId: id,
        jogadores: resultado.jogadores.length,
        grupos: resultado.grupos.length,
      });

      ResponseHelper.success(res, {
        message: "Chaves Rei da Praia geradas com sucesso",
        jogadores: resultado.jogadores.length,
        grupos: resultado.grupos.length,
        partidas: resultado.partidas.length,
      });
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "gerar chaves Rei da Praia", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Buscar grupos Rei da Praia
   * GET /api/etapas/:id/rei-da-praia/grupos
   */
  async buscarGruposReiDaPraia(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      const { db } = await import("../config/firebase");

      const snapshot = await db
        .collection("grupos")
        .where("etapaId", "==", id)
        .where("arenaId", "==", arenaId)
        .orderBy("ordem", "asc")
        .get();

      const grupos = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

      ResponseHelper.success(res, grupos);
    } catch (error: any) {
      this.handleGenericError(res, error, "buscar grupos Rei da Praia", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Buscar jogadores/estatísticas Rei da Praia
   * GET /api/etapas/:id/rei-da-praia/jogadores
   */
  async buscarJogadoresReiDaPraia(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      const reiDaPraiaService = (await import("../services/ReiDaPraiaService"))
        .default;
      const jogadores = await reiDaPraiaService.buscarJogadores(id, arenaId);

      ResponseHelper.success(res, jogadores);
    } catch (error: any) {
      this.handleGenericError(res, error, "buscar jogadores Rei da Praia", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Buscar partidas Rei da Praia
   * GET /api/etapas/:id/rei-da-praia/partidas
   */
  async buscarPartidasReiDaPraia(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      const reiDaPraiaService = (await import("../services/ReiDaPraiaService"))
        .default;
      const partidas = await reiDaPraiaService.buscarPartidas(id, arenaId);

      ResponseHelper.success(res, partidas);
    } catch (error: any) {
      this.handleGenericError(res, error, "buscar partidas Rei da Praia", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Buscar confrontos eliminatórios Rei da Praia
   * GET /api/etapas/:id/rei-da-praia/confrontos
   */
  async buscarConfrontosReiDaPraia(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      const { db } = await import("../config/firebase");

      const snapshot = await db
        .collection("confrontos_eliminatorios")
        .where("etapaId", "==", id)
        .where("arenaId", "==", arenaId)
        .orderBy("ordem", "asc")
        .get();

      const confrontos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      ResponseHelper.success(res, confrontos);
    } catch (error: any) {
      this.handleGenericError(res, error, "buscar confrontos Rei da Praia", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Registrar múltiplos resultados de partidas Rei da Praia em lote
   * POST /api/etapas/:id/rei-da-praia/resultados-lote
   */
  async registrarResultadosEmLoteReiDaPraia(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id: etapaId } = req.params;
      const { resultados } = req.body;

      // Validação
      if (!resultados || !Array.isArray(resultados) || resultados.length === 0) {
        ResponseHelper.badRequest(res, "Lista de resultados inválida");
        return;
      }

      // Validar cada resultado
      for (const resultado of resultados) {
        if (!resultado.partidaId) {
          ResponseHelper.badRequest(res, "partidaId é obrigatório em cada resultado");
          return;
        }
        if (!resultado.placar || !Array.isArray(resultado.placar) || resultado.placar.length !== 1) {
          ResponseHelper.badRequest(res, `Placar deve ter exatamente 1 set para partida ${resultado.partidaId}`);
          return;
        }
      }

      const reiDaPraiaService = (await import("../services/ReiDaPraiaService")).default;
      const response = await reiDaPraiaService.registrarResultadosEmLote(
        etapaId,
        arenaId,
        resultados
      );

      logger.info("Resultados em lote registrados (Rei da Praia)", {
        etapaId,
        total: resultados.length,
        processados: response.processados,
        erros: response.erros.length,
        arenaId,
      });

      ResponseHelper.success(res, response, response.message);
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      logger.error("Erro ao registrar resultados em lote Rei da Praia", {
        etapaId: req.params.id,
      }, error);
      this.handleGenericError(res, error, "registrar resultados em lote Rei da Praia");
    }
  }

  /**
   * Gerar fase eliminatória Rei da Praia
   * POST /api/etapas/:id/rei-da-praia/gerar-eliminatoria
   */
  async gerarEliminatoriaReiDaPraia(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;
      const { classificadosPorGrupo = 2 } = req.body;

      // Buscar a etapa para obter o tipoChaveamento configurado
      const etapa = await etapaService.buscarPorId(id, arenaId);
      if (!etapa) {
        ResponseHelper.notFound(res, "Etapa não encontrada");
        return;
      }

      // Usar o tipoChaveamento da etapa, com fallback para melhores_com_melhores
      const tipoChaveamento = (etapa.tipoChaveamento ||
        TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES) as TipoChaveamentoReiDaPraia;

      logger.info("Gerando eliminatória Rei da Praia", {
        etapaId: id,
        classificadosPorGrupo,
        tipoChaveamento,
      });

      const reiDaPraiaService = (await import("../services/ReiDaPraiaService"))
        .default;
      const resultado = await reiDaPraiaService.gerarFaseEliminatoria(
        id,
        arenaId,
        classificadosPorGrupo,
        tipoChaveamento
      );

      logger.info("Eliminatória Rei da Praia gerada", {
        etapaId: id,
        duplas: resultado.duplas.length,
        confrontos: resultado.confrontos.length,
      });

      ResponseHelper.success(res, {
        message: "Fase eliminatória gerada com sucesso",
        duplas: resultado.duplas.length,
        confrontos: resultado.confrontos.length,
      });
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "gerar eliminatória Rei da Praia", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Cancelar fase eliminatória Rei da Praia
   * POST /api/etapas/:id/rei-da-praia/cancelar-eliminatoria
   */
  async cancelarEliminatoriaReiDaPraia(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      logger.info("Cancelando eliminatória Rei da Praia", { etapaId: id });

      const reiDaPraiaService = (await import("../services/ReiDaPraiaService"))
        .default;
      await reiDaPraiaService.cancelarFaseEliminatoria(id, arenaId);

      logger.info("Eliminatória Rei da Praia cancelada", { etapaId: id });

      ResponseHelper.success(
        res,
        null,
        "Fase eliminatória cancelada com sucesso"
      );
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(
        res,
        error,
        "cancelar eliminatória Rei da Praia",
        {
          etapaId: req.params.id,
        }
      );
    }
  }

  // ==================== SUPER X ====================

  /**
   * Gerar chaves Super X
   * POST /api/etapas/:id/super-x/gerar-chaves
   */
  async gerarChavesSuperX(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      logger.info("Gerando chaves Super X", { etapaId: id });

      const superXService = (await import("../services/SuperXService")).default;
      const resultado = await superXService.gerarChaves(id, arenaId);

      logger.info("Chaves Super X geradas", {
        etapaId: id,
        jogadores: resultado.jogadores.length,
        partidas: resultado.partidas.length,
      });

      ResponseHelper.success(res, {
        message: "Chaves Super X geradas com sucesso",
        jogadores: resultado.jogadores.length,
        grupo: resultado.grupo,
        partidas: resultado.partidas.length,
      });
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "gerar chaves Super X", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Cancelar chaves Super X
   * DELETE /api/etapas/:id/super-x/cancelar-chaves
   */
  async cancelarChavesSuperX(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      logger.info("Cancelando chaves Super X", { etapaId: id });

      const superXService = (await import("../services/SuperXService")).default;
      await superXService.cancelarChaves(id, arenaId);

      logger.info("Chaves Super X canceladas", { etapaId: id });

      ResponseHelper.success(res, null, "Chaves Super X canceladas com sucesso");
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "cancelar chaves Super X", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Buscar jogadores Super X
   * GET /api/etapas/:id/super-x/jogadores
   */
  async buscarJogadoresSuperX(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      const superXService = (await import("../services/SuperXService")).default;
      const jogadores = await superXService.buscarJogadores(id, arenaId);

      ResponseHelper.success(res, jogadores);
    } catch (error: any) {
      this.handleGenericError(res, error, "buscar jogadores Super X", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Buscar partidas Super X
   * GET /api/etapas/:id/super-x/partidas
   */
  async buscarPartidasSuperX(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      const superXService = (await import("../services/SuperXService")).default;
      const partidas = await superXService.buscarPartidas(id, arenaId);

      ResponseHelper.success(res, partidas);
    } catch (error: any) {
      this.handleGenericError(res, error, "buscar partidas Super X", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Buscar grupo Super X
   * GET /api/etapas/:id/super-x/grupo
   */
  async buscarGrupoSuperX(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      const superXService = (await import("../services/SuperXService")).default;
      const grupo = await superXService.buscarGrupo(id, arenaId);

      ResponseHelper.success(res, grupo);
    } catch (error: any) {
      this.handleGenericError(res, error, "buscar grupo Super X", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Registrar resultado partida Super X
   * POST /api/etapas/:id/super-x/partidas/:partidaId/resultado
   */
  async registrarResultadoSuperX(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { partidaId } = req.params;
      const { placar } = req.body;

      logger.info("Registrando resultado Super X", { partidaId });

      const superXService = (await import("../services/SuperXService")).default;
      await superXService.registrarResultadoPartida(partidaId, arenaId, placar);

      logger.info("Resultado Super X registrado", { partidaId });

      ResponseHelper.success(res, null, "Resultado registrado com sucesso");
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "registrar resultado Super X", {
        partidaId: req.params.partidaId,
      });
    }
  }

  /**
   * Registrar múltiplos resultados de partidas Super X em lote
   * POST /api/etapas/:id/super-x/resultados-lote
   */
  async registrarResultadosEmLoteSuperX(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id: etapaId } = req.params;
      const { resultados } = req.body;

      // Validação
      if (!resultados || !Array.isArray(resultados) || resultados.length === 0) {
        ResponseHelper.badRequest(res, "Lista de resultados inválida");
        return;
      }

      // Validar cada resultado
      for (const resultado of resultados) {
        if (!resultado.partidaId) {
          ResponseHelper.badRequest(res, "partidaId é obrigatório em cada resultado");
          return;
        }
        if (!resultado.placar || !Array.isArray(resultado.placar) || resultado.placar.length !== 1) {
          ResponseHelper.badRequest(res, `Placar deve ter exatamente 1 set para partida ${resultado.partidaId}`);
          return;
        }
      }

      const superXService = (await import("../services/SuperXService")).default;
      const response = await superXService.registrarResultadosEmLote(
        etapaId,
        arenaId,
        resultados
      );

      logger.info("Resultados em lote registrados (Super X)", {
        etapaId,
        total: resultados.length,
        processados: response.processados,
        erros: response.erros.length,
        arenaId,
      });

      ResponseHelper.success(res, response, response.message);
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      logger.error("Erro ao registrar resultados em lote Super X", {
        etapaId: req.params.id,
      }, error);
      this.handleGenericError(res, error, "registrar resultados em lote Super X");
    }
  }

  // ==================== TEAMS ====================

  /**
   * Gerar equipes TEAMS
   * POST /api/etapas/:id/teams/gerar-equipes
   */
  async gerarEquipesTeams(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;
      const { tipoFormacaoJogos = "sorteio" } = req.body;

      const etapa = await etapaService.buscarPorId(id, arenaId);

      if (!etapa) {
        ResponseHelper.notFound(res, "Etapa não encontrada");
        return;
      }

      const inscricoesRaw = await etapaService.listarInscricoes(id, arenaId);

      // Mapear inscricoes para o formato esperado pelo TeamsService
      const inscricoes = inscricoesRaw.map((i) => ({
        jogadorId: i.jogadorId,
        jogadorNome: i.jogadorNome,
        nivel: i.jogadorNivel as any,
        genero: i.jogadorGenero as any,
      }));

      const teamsService = (await import("../services/TeamsService")).default;

      const resultado = await teamsService.gerarEquipes(etapa, inscricoes);

      // Gerar confrontos automaticamente (passando equipes já criadas para evitar query extra)
      const confrontos = await teamsService.gerarConfrontos(
        etapa,
        tipoFormacaoJogos,
        resultado.equipes
      );

      // Atualizar status da etapa para indicar que chaves foram geradas
      await db.collection("etapas").doc(id).update({
        chavesGeradas: true,
        dataGeracaoChaves: Timestamp.now(),
        status: StatusEtapa.CHAVES_GERADAS,
        atualizadoEm: Timestamp.now(),
      });

      logger.info("Equipes TEAMS geradas", {
        etapaId: id,
        equipes: resultado.equipes.length,
        confrontos: confrontos.length,
      });

      ResponseHelper.success(res, {
        message: "Equipes TEAMS geradas com sucesso",
        equipes: resultado.equipes.length,
        confrontos: confrontos.length,
      });
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "gerar equipes TEAMS", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Formar equipes manualmente TEAMS
   * POST /api/etapas/:id/teams/formar-equipes-manual
   */
  async formarEquipesManualTeams(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;
      const { formacoes, tipoFormacaoJogos = "sorteio" } = req.body;

      logger.info("Formando equipes TEAMS manualmente", { etapaId: id });

      const etapa = await etapaService.buscarPorId(id, arenaId);
      if (!etapa) {
        ResponseHelper.notFound(res, "Etapa não encontrada");
        return;
      }

      const inscricoesRaw = await etapaService.listarInscricoes(id, arenaId);

      // Mapear inscricoes para o formato esperado pelo TeamsService
      const inscricoes = inscricoesRaw.map((i) => ({
        jogadorId: i.jogadorId,
        jogadorNome: i.jogadorNome,
        nivel: i.jogadorNivel as any,
        genero: i.jogadorGenero as any,
      }));

      const teamsService = (await import("../services/TeamsService")).default;
      const resultado = await teamsService.formarEquipesManualmente(
        etapa,
        inscricoes,
        formacoes
      );

      // Gerar confrontos automaticamente
      const confrontos = await teamsService.gerarConfrontos(
        etapa,
        tipoFormacaoJogos
      );

      // Atualizar status da etapa para indicar que chaves foram geradas
      await db.collection("etapas").doc(id).update({
        chavesGeradas: true,
        dataGeracaoChaves: Timestamp.now(),
        status: StatusEtapa.CHAVES_GERADAS,
        atualizadoEm: Timestamp.now(),
      });

      logger.info("Equipes TEAMS formadas manualmente", {
        etapaId: id,
        equipes: resultado.equipes.length,
        confrontos: confrontos.length,
      });

      ResponseHelper.success(res, {
        message: "Equipes formadas com sucesso",
        equipes: resultado.equipes.length,
        confrontos: confrontos.length,
      });
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "formar equipes TEAMS manual", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Buscar equipes TEAMS
   * GET /api/etapas/:id/teams/equipes
   */
  async buscarEquipesTeams(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      const teamsService = (await import("../services/TeamsService")).default;
      const equipes = await teamsService.buscarEquipes(id, arenaId);

      ResponseHelper.success(res, equipes);
    } catch (error: any) {
      this.handleGenericError(res, error, "buscar equipes TEAMS", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Buscar confrontos TEAMS
   * GET /api/etapas/:id/teams/confrontos
   */
  async buscarConfrontosTeams(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      const teamsService = (await import("../services/TeamsService")).default;
      const confrontos = await teamsService.buscarConfrontos(id, arenaId);

      ResponseHelper.success(res, confrontos);
    } catch (error: any) {
      this.handleGenericError(res, error, "buscar confrontos TEAMS", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Gerar partidas de um confronto TEAMS
   * POST /api/etapas/:id/teams/confrontos/:confrontoId/gerar-partidas
   */
  async gerarPartidasConfrontoTeams(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id, confrontoId } = req.params;

      logger.info("Gerando partidas do confronto TEAMS", { confrontoId });

      // ✅ OTIMIZAÇÃO: Buscar etapa e confronto em paralelo
      const { db } = await import("../config/firebase");
      const [etapa, confrontoDoc] = await Promise.all([
        etapaService.buscarPorId(id, arenaId),
        db.collection("confrontos_equipe").doc(confrontoId).get(),
      ]);

      if (!etapa) {
        ResponseHelper.notFound(res, "Etapa não encontrada");
        return;
      }

      if (!confrontoDoc.exists) {
        ResponseHelper.notFound(res, "Confronto não encontrado");
        return;
      }

      const confronto = { id: confrontoDoc.id, ...confrontoDoc.data() } as any;

      const teamsService = (await import("../services/TeamsService")).default;
      const partidas = await teamsService.gerarPartidasConfronto(
        confronto,
        etapa
      );

      logger.info("Partidas do confronto TEAMS geradas", {
        confrontoId,
        partidas: partidas.length,
      });

      ResponseHelper.success(res, {
        message: "Partidas geradas com sucesso",
        partidas: partidas.length,
      });
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "gerar partidas confronto TEAMS", {
        confrontoId: req.params.confrontoId,
      });
    }
  }

  /**
   * Definir partidas manualmente de um confronto TEAMS
   * POST /api/etapas/:id/teams/confrontos/:confrontoId/definir-partidas
   */
  async definirPartidasManualTeams(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id, confrontoId } = req.params;
      const { partidas: definicoesPartidas } = req.body;

      logger.info("Definindo partidas do confronto TEAMS manualmente", {
        confrontoId,
      });

      const etapa = await etapaService.buscarPorId(id, arenaId);
      if (!etapa) {
        ResponseHelper.notFound(res, "Etapa não encontrada");
        return;
      }

      const { db } = await import("../config/firebase");
      const confrontoDoc = await db
        .collection("confrontos_equipe")
        .doc(confrontoId)
        .get();

      if (!confrontoDoc.exists) {
        ResponseHelper.notFound(res, "Confronto não encontrado");
        return;
      }

      const confronto = { id: confrontoDoc.id, ...confrontoDoc.data() } as any;

      const teamsService = (await import("../services/TeamsService")).default;
      const partidas = await teamsService.definirPartidasManualmente(
        confronto,
        etapa,
        { partidas: definicoesPartidas }
      );

      logger.info("Partidas do confronto TEAMS definidas manualmente", {
        confrontoId,
        partidas: partidas.length,
      });

      ResponseHelper.success(res, {
        message: "Partidas definidas com sucesso",
        partidas: partidas.length,
      });
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "definir partidas TEAMS manual", {
        confrontoId: req.params.confrontoId,
      });
    }
  }

  /**
   * Buscar partidas de um confronto TEAMS
   * GET /api/etapas/:id/teams/confrontos/:confrontoId/partidas
   */
  async buscarPartidasConfrontoTeams(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { confrontoId } = req.params;

      const teamsService = (await import("../services/TeamsService")).default;
      const partidas = await teamsService.buscarPartidasConfronto(confrontoId);

      ResponseHelper.success(res, partidas);
    } catch (error: any) {
      this.handleGenericError(res, error, "buscar partidas confronto TEAMS", {
        confrontoId: req.params.confrontoId,
      });
    }
  }

  /**
   * Definir jogadores de uma partida vazia (formação manual)
   * POST /api/etapas/:id/teams/partidas/:partidaId/definir-jogadores
   */
  async definirJogadoresPartidaTeams(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { partidaId } = req.params;
      const { dupla1JogadorIds, dupla2JogadorIds } = req.body;

      logger.info("Definindo jogadores da partida", { partidaId });

      if (
        !Array.isArray(dupla1JogadorIds) ||
        dupla1JogadorIds.length !== 2 ||
        !Array.isArray(dupla2JogadorIds) ||
        dupla2JogadorIds.length !== 2
      ) {
        ResponseHelper.badRequest(
          res,
          "dupla1JogadorIds e dupla2JogadorIds devem ser arrays com 2 IDs cada"
        );
        return;
      }

      const teamsService = (await import("../services/TeamsService")).default;
      const partida = await teamsService.definirJogadoresPartida(
        partidaId,
        arenaId,
        dupla1JogadorIds as [string, string],
        dupla2JogadorIds as [string, string]
      );

      logger.info("Jogadores definidos com sucesso", { partidaId });

      ResponseHelper.success(res, partida, "Jogadores definidos com sucesso");
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "definir jogadores da partida", {
        partidaId: req.params.partidaId,
      });
    }
  }

  /**
   * Registrar resultado partida TEAMS
   * POST /api/etapas/:id/teams/partidas/:partidaId/resultado
   */
  async registrarResultadoTeams(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { partidaId } = req.params;
      const { placar } = req.body;

      logger.info("Registrando resultado TEAMS", { partidaId });

      const teamsService = (await import("../services/TeamsService")).default;
      const resultado = await teamsService.registrarResultadoPartida(
        partidaId,
        arenaId,
        { placar }
      );

      logger.info("Resultado TEAMS registrado", {
        partidaId,
        precisaDecider: resultado.precisaDecider,
        confrontoFinalizado: resultado.confrontoFinalizado,
      });

      ResponseHelper.success(res, {
        message: "Resultado registrado com sucesso",
        precisaDecider: resultado.precisaDecider,
        confrontoFinalizado: resultado.confrontoFinalizado,
      });
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "registrar resultado TEAMS", {
        partidaId: req.params.partidaId,
      });
    }
  }

  /**
   * Registrar múltiplos resultados de partidas TEAMS em lote
   * POST /api/etapas/:id/teams/resultados-lote
   */
  async registrarResultadosEmLoteTeams(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id: etapaId } = req.params;
      const { resultados } = req.body;

      // Validação básica
      if (!resultados || !Array.isArray(resultados) || resultados.length === 0) {
        ResponseHelper.badRequest(res, "É necessário enviar ao menos um resultado");
        return;
      }

      logger.info("Registrando resultados TEAMS em lote", {
        etapaId,
        quantidade: resultados.length,
      });

      const teamsService = (await import("../services/TeamsService")).default;
      const resultado = await teamsService.registrarResultadosEmLote(
        etapaId,
        arenaId,
        resultados
      );

      logger.info("Resultados TEAMS em lote registrados", {
        etapaId,
        processados: resultado.processados,
        erros: resultado.erros.length,
        confrontosFinalizados: resultado.confrontosFinalizados.length,
      });

      ResponseHelper.success(res, {
        message: `${resultado.processados} resultado(s) registrado(s) com sucesso`,
        processados: resultado.processados,
        erros: resultado.erros,
        confrontosFinalizados: resultado.confrontosFinalizados,
      });
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "registrar resultados TEAMS em lote", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Gerar decider de um confronto TEAMS
   * POST /api/etapas/:id/teams/confrontos/:confrontoId/gerar-decider
   */
  async gerarDeciderTeams(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id, confrontoId } = req.params;

      logger.info("Gerando decider TEAMS", { confrontoId });

      const etapa = await etapaService.buscarPorId(id, arenaId);
      if (!etapa) {
        ResponseHelper.notFound(res, "Etapa não encontrada");
        return;
      }

      const { db } = await import("../config/firebase");
      const confrontoDoc = await db
        .collection("confrontos_equipe")
        .doc(confrontoId)
        .get();

      if (!confrontoDoc.exists) {
        ResponseHelper.notFound(res, "Confronto não encontrado");
        return;
      }

      const confronto = { id: confrontoDoc.id, ...confrontoDoc.data() } as any;

      const teamsService = (await import("../services/TeamsService")).default;
      const decider = await teamsService.gerarDecider(confronto, etapa);

      logger.info("Decider TEAMS gerado", {
        confrontoId,
        deciderId: decider.id,
      });

      ResponseHelper.success(res, {
        message: "Decider gerado com sucesso",
        decider,
      });
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "gerar decider TEAMS", {
        confrontoId: req.params.confrontoId,
      });
    }
  }

  /**
   * Renomear equipe TEAMS
   * PATCH /api/etapas/:id/teams/equipes/:equipeId/renomear
   */
  async renomearEquipeTeams(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { equipeId } = req.params;
      const { nome } = req.body;

      if (!nome) {
        ResponseHelper.badRequest(res, "Nome da equipe é obrigatório");
        return;
      }

      logger.info("Renomeando equipe TEAMS", { equipeId, nome });

      const teamsService = (await import("../services/TeamsService")).default;
      await teamsService.renomearEquipe(equipeId, nome, arenaId);

      ResponseHelper.success(res, {
        message: "Equipe renomeada com sucesso",
      });
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "renomear equipe TEAMS", {
        equipeId: req.params.equipeId,
      });
    }
  }

  /**
   * Cancelar chaves TEAMS
   * DELETE /api/etapas/:id/teams/cancelar
   */
  async cancelarChavesTeams(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      logger.info("Cancelando chaves TEAMS", { etapaId: id });

      const teamsService = (await import("../services/TeamsService")).default;
      await teamsService.cancelarChaves(id, arenaId);

      logger.info("Chaves TEAMS canceladas", { etapaId: id });

      ResponseHelper.success(res, null, "Chaves TEAMS canceladas com sucesso");
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "cancelar chaves TEAMS", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Resetar partidas TEAMS (mantém equipes e confrontos)
   * DELETE /api/etapas/:id/teams/resetar-partidas
   */
  async resetarPartidasTeams(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      logger.info("Resetando partidas TEAMS", { etapaId: id });

      const teamsService = (await import("../services/TeamsService")).default;
      await teamsService.resetarPartidas(id, arenaId);

      logger.info("Partidas TEAMS resetadas", { etapaId: id });

      ResponseHelper.success(res, null, "Partidas resetadas com sucesso");
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      this.handleGenericError(res, error, "resetar partidas TEAMS", {
        etapaId: req.params.id,
      });
    }
  }

  /**
   * Recalcular classificação TEAMS
   * POST /api/etapas/:id/teams/recalcular-classificacao
   */
  async recalcularClassificacaoTeams(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;

      logger.info("Recalculando classificação TEAMS", { etapaId: id });

      const teamsService = (await import("../services/TeamsService")).default;
      const equipes = await teamsService.recalcularClassificacao(id, arenaId);

      logger.info("Classificação TEAMS recalculada", {
        etapaId: id,
        equipes: equipes.length,
      });

      ResponseHelper.success(res, equipes);
    } catch (error: any) {
      this.handleGenericError(res, error, "recalcular classificação TEAMS", {
        etapaId: req.params.id,
      });
    }
  }
}

export default new EtapaController();
