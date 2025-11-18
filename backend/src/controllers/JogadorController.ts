import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import jogadorService from "../services/JogadorService";
import {
  CriarJogadorSchema,
  AtualizarJogadorSchema,
  FiltrosJogador,
} from "../models/Jogador";
import { z } from "zod";

/**
 * Controller para gerenciar jogadores
 */
class JogadorController {
  /**
   * Criar novo jogador
   * POST /api/jogadores
   */
  async criar(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { uid } = req.user!;

      if (!req.user?.arenaId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const arenaId = req.user.arenaId;

      // Validar dados
      const dadosValidados = CriarJogadorSchema.parse(req.body);

      const jogador = await jogadorService.criar(arenaId, uid, dadosValidados);

      res.status(201).json({
        success: true,
        data: jogador,
        message: "Jogador criado com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao criar jogador:", error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: "Dados inválidos",
          details: error.issues,
        });
        return;
      }

      // Verificação case-insensitive para "já existe"
      if (error.message && error.message.toLowerCase().includes("já existe")) {
        res.status(409).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Erro ao criar jogador",
      });
    }
  }

  /**
   * Buscar jogador por ID
   * GET /api/jogadores/:id
   */
  async buscarPorId(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.arenaId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const arenaId = req.user.arenaId;
      const { id } = req.params;

      const jogador = await jogadorService.buscarPorId(id, arenaId);

      if (!jogador) {
        res.status(404).json({
          success: false,
          error: "Jogador não encontrado",
        });
        return;
      }

      res.json({
        success: true,
        data: jogador,
      });
    } catch (error) {
      console.error("Erro ao buscar jogador:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao buscar jogador",
      });
    }
  }

  /**
   * Listar jogadores com filtros
   * GET /api/jogadores
   * Query params: nivel, status, genero, busca, ordenarPor, ordem, limite, offset
   */
  async listar(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.arenaId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const arenaId = req.user.arenaId;

      const filtros: FiltrosJogador = {
        arenaId,
        nivel: req.query.nivel as any,
        status: req.query.status as any,
        genero: req.query.genero as any,
        busca: req.query.busca as string,
        ordenarPor: req.query.ordenarPor as any,
        ordem: req.query.ordem as any,
        limite: req.query.limite ? parseInt(req.query.limite as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      const resultado = await jogadorService.listar(filtros);

      res.json({
        success: true,
        data: resultado,
      });
    } catch (error) {
      console.error("Erro ao listar jogadores:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao listar jogadores",
      });
    }
  }

  /**
   * Atualizar jogador
   * PUT /api/jogadores/:id
   */
  async atualizar(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.arenaId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const arenaId = req.user.arenaId;
      const { id } = req.params;

      // Validar dados
      const dadosValidados = AtualizarJogadorSchema.parse(req.body);

      const jogadorAtualizado = await jogadorService.atualizar(
        id,
        arenaId,
        dadosValidados
      );

      res.json({
        success: true,
        data: jogadorAtualizado,
        message: "Jogador atualizado com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao atualizar jogador:", error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: "Dados inválidos",
          details: error.issues,
        });
        return;
      }

      if (error.message.includes("não encontrado")) {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message.includes("já existe")) {
        res.status(409).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Erro ao atualizar jogador",
      });
    }
  }

  /**
   * Deletar jogador
   * DELETE /api/jogadores/:id
   */
  async deletar(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.arenaId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const arenaId = req.user.arenaId;
      const { id } = req.params;

      await jogadorService.deletar(id, arenaId);

      res.json({
        success: true,
        message: "Jogador deletado com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao deletar jogador:", error);

      if (error.message.includes("não encontrado")) {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      // Tratamento para jogador inscrito em etapa
      if (error.message.includes("está inscrito")) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Erro ao deletar jogador",
      });
    }
  }

  /**
   * Contar total de jogadores
   * GET /api/jogadores/stats/total
   */
  async contarTotal(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.arenaId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const arenaId = req.user.arenaId;

      const total = await jogadorService.contar(arenaId);

      res.json({
        success: true,
        data: {
          total,
        },
      });
    } catch (error) {
      console.error("Erro ao contar jogadores:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao contar jogadores",
      });
    }
  }

  /**
   * Contar jogadores por nível
   * GET /api/jogadores/stats/por-nivel
   */
  async contarPorNivel(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.arenaId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const arenaId = req.user.arenaId;

      const contagem = await jogadorService.contarPorNivel(arenaId);

      res.json({
        success: true,
        data: contagem,
      });
    } catch (error) {
      console.error("Erro ao contar jogadores por nível:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao contar jogadores por nível",
      });
    }
  }
}

export default new JogadorController();
