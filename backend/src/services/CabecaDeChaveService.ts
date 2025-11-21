/**
 * CabecaDeChaveService.ts
 *
 * Service para gerenciar cabeças de chave (seeding)
 */

import { db } from "../config/firebase";
import { Timestamp } from "firebase-admin/firestore";
import {
  CabecaDeChave,
  CriarCabecaDeChaveDTO,
  AtualizarCabecaDeChaveDTO,
} from "../models/CabecaDeChave";

export class CabecaDeChaveService {
  private collection = "cabecas_de_chave";

  /**
   * Criar cabeça de chave
   */
  async criar(dto: CriarCabecaDeChaveDTO): Promise<CabecaDeChave> {
    try {
      // Verificar se já existe
      const existente = await this.buscarPorJogador(dto.arenaId, dto.jogadorId);

      if (existente) {
        throw new Error("Jogador já é cabeça de chave");
      }

      const cabeca: Omit<CabecaDeChave, "id"> = {
        arenaId: dto.arenaId,
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

      return {
        id: docRef.id,
        ...cabeca,
      };
    } catch (error) {
      console.error("Erro ao criar cabeça de chave:", error);
      throw error;
    }
  }

  /**
   * Buscar cabeça de chave por jogador
   */
  async buscarPorJogador(
    arenaId: string,
    jogadorId: string
  ): Promise<CabecaDeChave | null> {
    try {
      const snapshot = await db
        .collection(this.collection)
        .where("arenaId", "==", arenaId)
        .where("jogadorId", "==", jogadorId)
        .limit(1)
        .get();

      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as CabecaDeChave;
    } catch (error) {
      console.error("Erro ao buscar cabeça de chave:", error);
      throw error;
    }
  }

  /**
   * Listar todas as cabeças de chave ativas de uma arena
   */
  async listarAtivas(arenaId: string): Promise<CabecaDeChave[]> {
    try {
      const snapshot = await db
        .collection(this.collection)
        .where("arenaId", "==", arenaId)
        .where("ativo", "==", true)
        .orderBy("ordem", "asc")
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CabecaDeChave[];
    } catch (error) {
      console.error("Erro ao listar cabeças de chave:", error);
      throw error;
    }
  }

  /**
   * Verificar se jogador é cabeça de chave ativa
   */
  async ehCabecaDeChave(arenaId: string, jogadorId: string): Promise<boolean> {
    try {
      const cabeca = await this.buscarPorJogador(arenaId, jogadorId);
      return cabeca !== null && cabeca.ativo;
    } catch (error) {
      console.error("Erro ao verificar cabeça de chave:", error);
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
    } catch (error) {
      console.error("Erro ao atualizar cabeça de chave:", error);
      throw error;
    }
  }

  /**
   * Desativar cabeça de chave
   */
  async desativar(
    arenaId: string,
    jogadorId: string,
    motivo?: string
  ): Promise<void> {
    try {
      const cabeca = await this.buscarPorJogador(arenaId, jogadorId);

      if (!cabeca) {
        throw new Error("Cabeça de chave não encontrada");
      }

      await this.atualizar(cabeca.id, {
        ativo: false,
        motivoDesativacao: motivo,
      });
    } catch (error) {
      console.error("Erro ao desativar cabeça de chave:", error);
      throw error;
    }
  }

  /**
   * Reativar cabeça de chave
   */
  async reativar(arenaId: string, jogadorId: string): Promise<void> {
    try {
      const cabeca = await this.buscarPorJogador(arenaId, jogadorId);

      if (!cabeca) {
        throw new Error("Cabeça de chave não encontrada");
      }

      await this.atualizar(cabeca.id, {
        ativo: true,
        motivoDesativacao: undefined,
      });
    } catch (error) {
      console.error("Erro ao reativar cabeça de chave:", error);
      throw error;
    }
  }

  /**
   * Remover cabeça de chave
   */
  async remover(arenaId: string, jogadorId: string): Promise<void> {
    try {
      const cabeca = await this.buscarPorJogador(arenaId, jogadorId);

      if (!cabeca) {
        throw new Error("Cabeça de chave não encontrada");
      }

      await db.collection(this.collection).doc(cabeca.id).delete();
    } catch (error) {
      console.error("Erro ao remover cabeça de chave:", error);
      throw error;
    }
  }

  /**
   * Filtrar jogadores que são cabeças de chave
   */
  async filtrarCabecas(
    arenaId: string,
    jogadorIds: string[]
  ): Promise<string[]> {
    try {
      const cabecas = await this.listarAtivas(arenaId);
      const cabecasIds = new Set(cabecas.map((c) => c.jogadorId));

      return jogadorIds.filter((id) => cabecasIds.has(id));
    } catch (error) {
      console.error("Erro ao filtrar cabeças:", error);
      return [];
    }
  }

  /**
   * Obter IDs das cabeças de chave ativas
   */
  async obterIdsCabecas(arenaId: string): Promise<string[]> {
    try {
      const cabecas = await this.listarAtivas(arenaId);
      return cabecas.map((c) => c.jogadorId);
    } catch (error) {
      console.error("Erro ao obter IDs de cabeças:", error);
      return [];
    }
  }
}

export default new CabecaDeChaveService();
