/**
 * Service para gerenciar cabeças de chave (seeding)
 */

import {
  CabecaDeChave,
  CriarCabecaDeChaveDTO,
  AtualizarCabecaDeChaveDTO,
} from "../models/CabecaDeChave";
import { cabecaDeChaveRepository } from "../repositories/firebase/CabecaDeChaveRepository";
import { ICabecaDeChaveRepository } from "../repositories/interfaces/ICabecaDeChaveRepository";
import logger from "../utils/logger";

export class CabecaDeChaveService {
  constructor(
    private cabecas: ICabecaDeChaveRepository = cabecaDeChaveRepository
  ) {}

  /**
   * Criar cabeça de chave
   */
  async criar(dto: CriarCabecaDeChaveDTO): Promise<CabecaDeChave> {
    try {
      // Verificar se já existe
      const existente = await this.buscarPorJogador(
        dto.arenaId,
        dto.etapaId,
        dto.jogadorId
      );

      if (existente) {
        throw new Error("Jogador já é cabeça de chave");
      }

      const novaCabeca = await this.cabecas.criar(dto);

      logger.info("Cabeça de chave criada", {
        cabecaId: novaCabeca.id,
        etapaId: dto.etapaId,
        jogadorId: dto.jogadorId,
        jogadorNome: dto.jogadorNome,
        ordem: dto.ordem,
      });

      return novaCabeca;
    } catch (error) {
      logger.error(
        "Erro ao criar cabeça de chave",
        {
          etapaId: dto.etapaId,
          jogadorId: dto.jogadorId,
        },
        error as Error
      );
      throw error;
    }
  }

  /**
   * Buscar cabeça de chave por jogador
   */
  async buscarPorJogador(
    arenaId: string,
    etapaId: string,
    jogadorId: string
  ): Promise<CabecaDeChave | null> {
    return this.cabecas.buscarPorJogador(arenaId, etapaId, jogadorId);
  }

  /**
   * Listar todas as cabeças de chave ativas de uma etapa
   */
  async listarAtivas(
    arenaId: string,
    etapaId: string
  ): Promise<CabecaDeChave[]> {
    return this.cabecas.listarAtivas(arenaId, etapaId);
  }

  /**
   * Verificar se jogador é cabeça de chave ativa
   */
  async ehCabecaDeChave(
    arenaId: string,
    etapaId: string,
    jogadorId: string
  ): Promise<boolean> {
    try {
      const cabeca = await this.buscarPorJogador(arenaId, etapaId, jogadorId);
      return cabeca !== null && cabeca.ativo;
    } catch (error) {
      return false;
    }
  }

  /**
   * Atualizar cabeça de chave
   */
  async atualizar(
    cabecaId: string,
    dto: AtualizarCabecaDeChaveDTO
  ): Promise<void> {
    try {
      await this.cabecas.atualizar(cabecaId, dto);

      logger.info("Cabeça de chave atualizada", {
        cabecaId,
        camposAtualizados: Object.keys(dto),
      });
    } catch (error) {
      logger.error(
        "Erro ao atualizar cabeça de chave",
        {
          cabecaId,
        },
        error as Error
      );
      throw error;
    }
  }

  /**
   * Remover cabeça de chave (DELETE físico)
   */
  async remover(
    arenaId: string,
    etapaId: string,
    jogadorId: string
  ): Promise<void> {
    try {
      const cabeca = await this.buscarPorJogador(arenaId, etapaId, jogadorId);

      if (!cabeca) {
        throw new Error("Cabeça de chave não encontrada");
      }

      await this.cabecas.deletar(cabeca.id);

      logger.info("Cabeça de chave removida permanentemente", {
        cabecaId: cabeca.id,
        etapaId,
        jogadorId,
        jogadorNome: cabeca.jogadorNome,
      });
    } catch (error) {
      logger.error(
        "Erro ao remover cabeça de chave",
        {
          etapaId,
          jogadorId,
        },
        error as Error
      );
      throw error;
    }
  }

  /**
   * Remover as cabeças de chave desses jogadores, se houver. Uma falha aqui
   * não desfaz o cancelamento da inscrição.
   */
  async removerSeExistirem(
    arenaId: string,
    etapaId: string,
    jogadorIds: string[]
  ): Promise<void> {
    await Promise.all(
      jogadorIds.map(async (jogadorId) => {
        try {
          const cabeca = await this.buscarPorJogador(
            arenaId,
            etapaId,
            jogadorId
          );
          if (cabeca) await this.cabecas.deletar(cabeca.id);
        } catch (error) {
          logger.error(
            "Erro ao remover cabeça de chave",
            { etapaId, jogadorId },
            error as Error
          );
        }
      })
    );
  }

  /**
   * Obter IDs das cabeças de chave ativas
   * NÃO engolir erros - se falhar, a geração de chaves deve parar
   */
  async obterIdsCabecas(arenaId: string, etapaId: string): Promise<string[]> {
    const cabecas = await this.listarAtivas(arenaId, etapaId);
    return cabecas.map((c) => c.jogadorId);
  }

  /**
   * Deletar todas as cabeças de chave de uma etapa
   */
  async deletarPorEtapa(etapaId: string, arenaId: string): Promise<number> {
    const quantidade = await this.cabecas.deletarPorEtapa(etapaId, arenaId);

    if (quantidade > 0) {
      logger.info("Cabeças de chave deletadas por etapa", {
        etapaId,
        quantidade,
      });
    }

    return quantidade;
  }
}

export default new CabecaDeChaveService();
