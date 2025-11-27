/**
 * CabecaDeChaveService.ts
 * Service para gerenciar cabeças de chave (seeding)
 */

import { db } from "../config/firebase";
import { Timestamp } from "firebase-admin/firestore";
import {
  CabecaDeChave,
  CriarCabecaDeChaveDTO,
  AtualizarCabecaDeChaveDTO,
} from "../models/CabecaDeChave";
import logger from "../utils/logger";

export class CabecaDeChaveService {
  private collection = "cabecas_de_chave";

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

      const cabeca: Omit<CabecaDeChave, "id"> = {
        arenaId: dto.arenaId,
        etapaId: dto.etapaId,
        jogadorId: dto.jogadorId,
        jogadorNome: dto.jogadorNome,
        jogadorNivel: dto.jogadorNivel,
        jogadorGenero: dto.jogadorGenero,
        ordem: dto.ordem,
        ativo: true,
        criadoEm: Timestamp.now(),
        atualizadoEm: Timestamp.now(),
      };

      const docRef = await db.collection(this.collection).add(cabeca);

      const novaCabeca = {
        id: docRef.id,
        ...cabeca,
      };

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
    const snapshot = await db
      .collection(this.collection)
      .where("arenaId", "==", arenaId)
      .where("etapaId", "==", etapaId)
      .where("jogadorId", "==", jogadorId)
      .where("ativo", "==", true)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as CabecaDeChave;
  }

  /**
   * Listar todas as cabeças de chave ativas de uma etapa
   */
  async listarAtivas(
    arenaId: string,
    etapaId: string
  ): Promise<CabecaDeChave[]> {
    const snapshot = await db
      .collection(this.collection)
      .where("arenaId", "==", arenaId)
      .where("etapaId", "==", etapaId)
      .where("ativo", "==", true)
      .orderBy("ordem", "asc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CabecaDeChave[];
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
      const updates: any = {
        atualizadoEm: Timestamp.now(),
      };

      if (dto.ordem !== undefined) updates.ordem = dto.ordem;
      if (dto.ativo !== undefined) updates.ativo = dto.ativo;
      if (dto.motivoDesativacao !== undefined)
        updates.motivoDesativacao = dto.motivoDesativacao;

      await db.collection(this.collection).doc(cabecaId).update(updates);

      logger.info("Cabeça de chave atualizada", {
        cabecaId,
        camposAtualizados: Object.keys(updates).filter(
          (k) => k !== "atualizadoEm"
        ),
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
   * Desativar cabeça de chave
   */
  async desativar(
    arenaId: string,
    etapaId: string,
    jogadorId: string,
    motivo?: string
  ): Promise<void> {
    try {
      const cabeca = await this.buscarPorJogador(arenaId, etapaId, jogadorId);

      if (!cabeca) {
        throw new Error("Cabeça de chave não encontrada");
      }

      await this.atualizar(cabeca.id, {
        ativo: false,
        motivoDesativacao: motivo,
      });

      logger.info("Cabeça de chave desativada", {
        cabecaId: cabeca.id,
        etapaId,
        jogadorId,
        motivo,
      });
    } catch (error) {
      logger.error(
        "Erro ao desativar cabeça de chave",
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
   * Reativar cabeça de chave
   */
  async reativar(
    arenaId: string,
    etapaId: string,
    jogadorId: string
  ): Promise<void> {
    try {
      const cabeca = await this.buscarPorJogador(arenaId, etapaId, jogadorId);

      if (!cabeca) {
        throw new Error("Cabeça de chave não encontrada");
      }

      await this.atualizar(cabeca.id, {
        ativo: true,
        motivoDesativacao: undefined,
      });

      logger.info("Cabeça de chave reativada", {
        cabecaId: cabeca.id,
        etapaId,
        jogadorId,
      });
    } catch (error) {
      logger.error(
        "Erro ao reativar cabeça de chave",
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

      await db.collection(this.collection).doc(cabeca.id).delete();

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
   * Filtrar jogadores que são cabeças de chave
   */
  async filtrarCabecas(
    arenaId: string,
    etapaId: string,
    jogadorIds: string[]
  ): Promise<string[]> {
    try {
      const cabecas = await this.listarAtivas(arenaId, etapaId);
      const cabecasIds = new Set(cabecas.map((c) => c.jogadorId));

      return jogadorIds.filter((id) => cabecasIds.has(id));
    } catch (error) {
      return [];
    }
  }

  /**
   * Obter IDs das cabeças de chave ativas
   */
  async obterIdsCabecas(arenaId: string, etapaId: string): Promise<string[]> {
    try {
      const cabecas = await this.listarAtivas(arenaId, etapaId);
      return cabecas.map((c) => c.jogadorId);
    } catch (error) {
      return [];
    }
  }
}

export default new CabecaDeChaveService();
