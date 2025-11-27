/**
 * cabecaDeChaveService.ts
 * Service frontend para gerenciar cabeças de chave
 * ✅ COM LOGGER - Operações críticas rastreadas
 */

import { apiClient } from "./apiClient";
import logger from "../utils/logger"; // ← IMPORTAR LOGGER
import { CabecaDeChave, CriarCabecaDeChaveDTO } from "@/types/cabecaDeChave";

class CabecaDeChaveService {
  /**
   * Criar cabeça de chave
   */
  async criar(dto: CriarCabecaDeChaveDTO): Promise<CabecaDeChave> {
    const response = await apiClient.post("/cabecas-de-chave", dto);

    logger.info("Cabeça de chave criada", {
      etapaId: dto.etapaId,
      jogadorId: dto.jogadorId,
      jogadorNome: dto.jogadorNome,
      ordem: dto.ordem,
    });

    return response;
  }

  /**
   * Listar cabeças de chave ativas de uma etapa
   */
  async listarAtivas(
    arenaId: string,
    etapaId: string
  ): Promise<CabecaDeChave[]> {
    const response = await apiClient.get(
      `/arenas/${arenaId}/etapas/${etapaId}/cabecas-de-chave`
    );
    return response;
  }

  /**
   * Verificar se jogador é cabeça de chave em uma etapa
   */
  async ehCabecaDeChave(
    arenaId: string,
    etapaId: string,
    jogadorId: string
  ): Promise<boolean> {
    const response = await apiClient.get(
      `/arenas/${arenaId}/etapas/${etapaId}/jogadores/${jogadorId}/eh-cabeca-de-chave`
    );
    return response.ehCabecaDeChave;
  }

  /**
   * Remover cabeça de chave de uma etapa
   */
  async remover(
    arenaId: string,
    etapaId: string,
    jogadorId: string
  ): Promise<void> {
    await apiClient.delete(
      `/arenas/${arenaId}/etapas/${etapaId}/jogadores/${jogadorId}/cabeca-de-chave`
    );

    logger.info("Cabeça de chave removida", {
      etapaId,
      jogadorId,
    });
  }

  /**
   * Reordenar cabeças de chave de uma etapa
   */
  async reordenar(
    arenaId: string,
    etapaId: string,
    ordens: { jogadorId: string; ordem: number }[]
  ): Promise<void> {
    await apiClient.put(
      `/arenas/${arenaId}/etapas/${etapaId}/cabecas-de-chave/reordenar`,
      { ordens }
    );

    logger.info("Cabeças de chave reordenadas", {
      etapaId,
      totalCabecas: ordens.length,
      novaOrdem: ordens.map((o) => `${o.jogadorId}:${o.ordem}`).join(", "),
    });
  }
}

export default new CabecaDeChaveService();
