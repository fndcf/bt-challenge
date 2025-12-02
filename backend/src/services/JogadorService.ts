/**
 * JogadorService.ts
 * Service para gerenciar jogadores
 * REFATORADO: Fase 4 - Usando IJogadorRepository via DI
 */

import {
  Jogador,
  CriarJogadorDTO,
  AtualizarJogadorDTO,
  FiltrosJogador,
  ListagemJogadores,
  NivelJogador,
  StatusJogador,
  CriarJogadorSchema,
  AtualizarJogadorSchema,
} from "../models/Jogador";
import logger from "../utils/logger";

// Interfaces dos repositories
import { IJogadorRepository } from "../repositories/interfaces/IJogadorRepository";
import { IInscricaoRepository } from "../repositories/interfaces/IInscricaoRepository";

// Implementações Firebase (para instância default)
import { JogadorRepository } from "../repositories/firebase/JogadorRepository";
import { InscricaoRepository } from "../repositories/firebase/InscricaoRepository";

/**
 * Service para gerenciar jogadores
 * Usa injeção de dependência para repositories
 */
export class JogadorService {
  constructor(
    private jogadorRepository: IJogadorRepository,
    private inscricaoRepository: IInscricaoRepository
  ) {}

  /**
   * Criar novo jogador
   */
  async criar(
    arenaId: string,
    adminUid: string,
    data: CriarJogadorDTO
  ): Promise<Jogador> {
    try {
      // Validar dados
      const dadosValidados = CriarJogadorSchema.parse(data);

      // Verificar se já existe jogador com mesmo nome na arena
      const jogadorExistente = await this.jogadorRepository.nomeExiste(
        arenaId,
        dadosValidados.nome
      );
      if (jogadorExistente) {
        throw new Error("Já existe um jogador com este nome nesta arena");
      }

      // Criar jogador via repository
      const novoJogador = await this.jogadorRepository.criar({
        arenaId,
        criadoPor: adminUid,
        nome: dadosValidados.nome.trim(),
        email: dadosValidados.email?.trim().toLowerCase(),
        telefone: dadosValidados.telefone?.trim(),
        dataNascimento: dadosValidados.dataNascimento,
        genero: dadosValidados.genero,
        nivel: dadosValidados.nivel,
        status: dadosValidados.status || StatusJogador.ATIVO,
        observacoes: dadosValidados.observacoes?.trim(),
      });

      logger.info("Jogador criado", {
        jogadorId: novoJogador.id,
        nome: novoJogador.nome,
        genero: novoJogador.genero,
        nivel: novoJogador.nivel,
        arenaId,
      });

      return novoJogador;
    } catch (error: any) {
      // Se é erro de validação Zod, lançar direto
      if (error.name === "ZodError") {
        throw error;
      }

      // Se é erro de duplicação, lançar direto
      if (error.message && error.message.toLowerCase().includes("já existe")) {
        throw error;
      }

      // Outros erros
      logger.error(
        "Erro ao criar jogador",
        {
          arenaId,
          nome: data.nome,
        },
        error
      );
      throw new Error("Falha ao criar jogador");
    }
  }

  /**
   * Buscar jogador por ID
   */
  async buscarPorId(id: string, arenaId: string): Promise<Jogador | null> {
    return this.jogadorRepository.buscarPorIdEArena(id, arenaId);
  }

  /**
   * Listar jogadores com filtros
   */
  async listar(filtros: FiltrosJogador): Promise<ListagemJogadores> {
    return this.jogadorRepository.listar(filtros);
  }

  /**
   * Atualizar jogador
   */
  async atualizar(
    id: string,
    arenaId: string,
    data: AtualizarJogadorDTO
  ): Promise<Jogador> {
    try {
      // Validar dados
      const dadosValidados = AtualizarJogadorSchema.parse(data);

      // Verificar se jogador existe
      const jogadorExistente = await this.buscarPorId(id, arenaId);
      if (!jogadorExistente) {
        throw new Error("Jogador não encontrado");
      }

      // Se alterou o nome, verificar se não existe outro com o mesmo nome
      if (
        dadosValidados.nome &&
        dadosValidados.nome !== jogadorExistente.nome
      ) {
        const nomeExiste = await this.jogadorRepository.nomeExiste(
          arenaId,
          dadosValidados.nome,
          id // excluir o próprio jogador da verificação
        );
        if (nomeExiste) {
          throw new Error("Já existe outro jogador com este nome nesta arena");
        }
      }

      // Atualizar via repository
      const jogadorAtualizado = await this.jogadorRepository.atualizar(
        id,
        dadosValidados
      );

      logger.info("Jogador atualizado", {
        jogadorId: id,
        arenaId,
        camposAtualizados: Object.keys(dadosValidados),
      });

      return jogadorAtualizado;
    } catch (error: any) {
      if (
        error.message.includes("não encontrado") ||
        error.message.includes("já existe")
      ) {
        throw error;
      }
      logger.error(
        "Erro ao atualizar jogador",
        {
          jogadorId: id,
          arenaId,
        },
        error
      );
      throw new Error("Falha ao atualizar jogador");
    }
  }

  /**
   * Deletar jogador
   */
  async deletar(id: string, arenaId: string): Promise<void> {
    try {
      // Verificar se jogador existe
      const jogador = await this.buscarPorId(id, arenaId);
      if (!jogador) {
        throw new Error("Jogador não encontrado");
      }

      // Verificar se jogador está inscrito em alguma etapa
      const inscricoesAtivas =
        await this.inscricaoRepository.buscarAtivasPorJogador(arenaId, id);

      if (inscricoesAtivas.length > 0) {
        throw new Error(
          "Não é possível excluir este jogador pois ele está inscrito em uma ou mais etapas. " +
            "Cancele as inscrições primeiro."
        );
      }

      // Deletar via repository
      await this.jogadorRepository.deletar(id);

      logger.info("Jogador deletado", {
        jogadorId: id,
        nome: jogador.nome,
        arenaId,
      });
    } catch (error: any) {
      if (
        error.message.includes("não encontrado") ||
        error.message.includes("está inscrito")
      ) {
        throw error;
      }
      logger.error(
        "Erro ao deletar jogador",
        {
          jogadorId: id,
          arenaId,
        },
        error
      );
      throw new Error("Falha ao deletar jogador");
    }
  }

  /**
   * Deletar múltiplos jogadores
   */
  async deletarEmLote(
    ids: string[],
    arenaId: string
  ): Promise<{
    deletados: string[];
    erros: { id: string; motivo: string }[];
  }> {
    const deletados: string[] = [];
    const erros: { id: string; motivo: string }[] = [];

    for (const id of ids) {
      try {
        await this.deletar(id, arenaId);
        deletados.push(id);
      } catch (error: any) {
        erros.push({
          id,
          motivo: error.message || "Erro desconhecido",
        });
      }
    }

    logger.info("Deleção em lote concluída", {
      arenaId,
      totalSolicitados: ids.length,
      totalDeletados: deletados.length,
      totalErros: erros.length,
    });

    return { deletados, erros };
  }

  /**
   * Contar jogadores de uma arena
   */
  async contar(arenaId: string): Promise<number> {
    try {
      return await this.jogadorRepository.contar(arenaId);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Contar jogadores por nível
   */
  async contarPorNivel(arenaId: string): Promise<Record<NivelJogador, number>> {
    try {
      return await this.jogadorRepository.contarPorNivel(arenaId);
    } catch (error) {
      return {
        [NivelJogador.INICIANTE]: 0,
        [NivelJogador.INTERMEDIARIO]: 0,
        [NivelJogador.AVANCADO]: 0,
      };
    }
  }

  /**
   * Buscar jogadores por IDs
   */
  async buscarPorIds(ids: string[], arenaId: string): Promise<Jogador[]> {
    return this.jogadorRepository.buscarPorIds(ids, arenaId);
  }

  /**
   * Buscar jogadores ativos
   */
  async buscarAtivos(arenaId: string): Promise<Jogador[]> {
    return this.jogadorRepository.buscarAtivos(arenaId);
  }

  /**
   * Buscar jogadores por nível
   */
  async buscarPorNivel(
    arenaId: string,
    nivel: NivelJogador
  ): Promise<Jogador[]> {
    return this.jogadorRepository.buscarPorNivel(arenaId, nivel);
  }

  /**
   * Atualizar estatísticas do jogador
   */
  async atualizarEstatisticas(
    id: string,
    estatisticas: {
      vitorias?: number;
      derrotas?: number;
      pontos?: number;
    }
  ): Promise<void> {
    await this.jogadorRepository.atualizarEstatisticas(id, estatisticas);
  }

  /**
   * Incrementar vitórias
   */
  async incrementarVitorias(id: string): Promise<void> {
    await this.jogadorRepository.incrementarVitorias(id);
  }

  /**
   * Incrementar derrotas
   */
  async incrementarDerrotas(id: string): Promise<void> {
    await this.jogadorRepository.incrementarDerrotas(id);
  }
}

// Instância default com repositories Firebase
const jogadorRepository = new JogadorRepository();
const inscricaoRepository = new InscricaoRepository();

export default new JogadorService(jogadorRepository, inscricaoRepository);
