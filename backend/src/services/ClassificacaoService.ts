/**
 * Service especializado para cálculos de classificação
 * Responsabilidades:
 * - Recalcular classificação do grupo
 * - Aplicar critérios de desempate
 * - Verificar confronto direto
 */

import { Dupla } from "../models/Dupla";
import { Partida } from "../models/Partida";
import { IDuplaRepository } from "../repositories/interfaces/IDuplaRepository";
import { IPartidaRepository } from "../repositories/interfaces/IPartidaRepository";
import { IGrupoRepository } from "../repositories/interfaces/IGrupoRepository";
import { duplaRepository } from "../repositories/firebase/DuplaRepository";
import { partidaRepository } from "../repositories/firebase/PartidaRepository";
import { grupoRepository } from "../repositories/firebase/GrupoRepository";
import estatisticasJogadorService from "./EstatisticasJogadorService";
import { calcularTotalPartidas } from "../utils/torneioUtils";
import logger from "../utils/logger";

/**
 * Interface para injeção de dependência
 */
export interface IClassificacaoService {
  recalcularClassificacaoGrupo(grupoId: string): Promise<void>;
  verificarConfrontoDireto(
    partidas: Partida[],
    dupla1Id: string,
    dupla2Id: string
  ): { vencedora: string | null };
}

/**
 * Service para cálculos de classificação
 */
export class ClassificacaoService implements IClassificacaoService {
  constructor(
    private duplaRepo: IDuplaRepository = duplaRepository,
    private partidaRepo: IPartidaRepository = partidaRepository,
    private grupoRepo: IGrupoRepository = grupoRepository
  ) {}

  /**
   * Recalcular classificação do grupo
   *
   * CRITÉRIOS DE DESEMPATE (em ordem):
   * 1. Pontos (vitórias * 3)
   * 2. Saldo de games
   * 3. Confronto direto (apenas 2 duplas empatadas)
   * 4. Saldo de sets
   * 5. Games vencidos
   * 6. Sorteio (3+ duplas empatadas em todos critérios)
   */
  async recalcularClassificacaoGrupo(grupoId: string): Promise<void> {
    try {
      // Buscar duplas do grupo
      const duplas = await this.duplaRepo.buscarPorGrupo(grupoId);

      // Buscar partidas finalizadas do grupo
      const partidas = await this.partidaRepo.buscarFinalizadasPorGrupo(
        grupoId
      );

      // Ordenar duplas pelos critérios
      const duplasOrdenadas = this.ordenarDuplasPorClassificacao(
        duplas,
        partidas
      );

      // Atualizar posições no banco
      for (let i = 0; i < duplasOrdenadas.length; i++) {
        const dupla = duplasOrdenadas[i];
        const posicao = i + 1;

        await this.duplaRepo.atualizarPosicaoGrupo(dupla.id, posicao);

        // Atualizar estatísticas dos jogadores
        await estatisticasJogadorService.atualizarPosicaoGrupo(
          dupla.jogador1Id,
          dupla.etapaId,
          posicao
        );

        await estatisticasJogadorService.atualizarPosicaoGrupo(
          dupla.jogador2Id,
          dupla.etapaId,
          posicao
        );
      }

      // Atualizar status do grupo
      const partidasFinalizadas = partidas.length;
      const totalPartidas = calcularTotalPartidas(duplas.length);
      const completo = partidasFinalizadas === totalPartidas;

      await this.grupoRepo.atualizarContadores(grupoId, {
        partidasFinalizadas,
      });

      if (completo) {
        await this.grupoRepo.marcarCompleto(grupoId, true);
      }

      logger.info("Classificação recalculada", {
        grupoId,
        totalDuplas: duplas.length,
        partidasFinalizadas,
        totalPartidas,
        completo,
      });
    } catch (error) {
      logger.error(
        "Erro ao recalcular classificação",
        { grupoId },
        error as Error
      );
      throw error;
    }
  }

  /**
   * Ordenar duplas pelos critérios de classificação
   */
  private ordenarDuplasPorClassificacao(
    duplas: Dupla[],
    partidas: Partida[]
  ): Dupla[] {
    return [...duplas].sort((a, b) => {
      // 1. Pontos (maior melhor)
      if (a.pontos !== b.pontos) {
        return b.pontos - a.pontos;
      }

      // 2. Saldo de games (maior melhor)
      if (a.saldoGames !== b.saldoGames) {
        return b.saldoGames - a.saldoGames;
      }

      // Verificar quantas duplas estão empatadas nestes critérios
      const duplasEmpatadas = duplas.filter(
        (d) => d.pontos === a.pontos && d.saldoGames === a.saldoGames
      );

      // 3. Confronto direto (apenas se 2 duplas empatadas)
      if (duplasEmpatadas.length === 2) {
        const confrontoDireto = this.verificarConfrontoDireto(
          partidas,
          a.id,
          b.id
        );
        if (confrontoDireto.vencedora === a.id) return -1;
        if (confrontoDireto.vencedora === b.id) return 1;
      }

      // 4. Saldo de sets (maior melhor)
      if (a.saldoSets !== b.saldoSets) {
        return b.saldoSets - a.saldoSets;
      }

      // 5. Games vencidos (maior melhor)
      if (a.gamesVencidos !== b.gamesVencidos) {
        return b.gamesVencidos - a.gamesVencidos;
      }

      // 6. Sorteio (3+ duplas empatadas em tudo)
      if (duplasEmpatadas.length >= 3) {
        return Math.random() - 0.5;
      }

      return 0;
    });
  }

  /**
   * Verificar confronto direto entre duas duplas
   */
  verificarConfrontoDireto(
    partidas: Partida[],
    dupla1Id: string,
    dupla2Id: string
  ): { vencedora: string | null } {
    const confronto = partidas.find(
      (p) =>
        (p.dupla1Id === dupla1Id && p.dupla2Id === dupla2Id) ||
        (p.dupla1Id === dupla2Id && p.dupla2Id === dupla1Id)
    );

    if (!confronto || !confronto.vencedoraId) {
      return { vencedora: null };
    }

    return { vencedora: confronto.vencedoraId };
  }

  /**
   * Buscar confronto direto entre duas duplas
   */
  async buscarConfrontoDireto(
    grupoId: string,
    dupla1Id: string,
    dupla2Id: string
  ): Promise<Partida | null> {
    return this.partidaRepo.buscarConfrontoDireto(grupoId, dupla1Id, dupla2Id);
  }

  /**
   * Obter classificação atual do grupo
   */
  async obterClassificacao(grupoId: string): Promise<Dupla[]> {
    return this.duplaRepo.buscarPorGrupoOrdenado(grupoId);
  }

  /**
   * Obter N primeiros classificados de um grupo
   */
  async obterClassificados(
    grupoId: string,
    quantidade: number
  ): Promise<Dupla[]> {
    return this.duplaRepo.buscarClassificadasPorGrupo(grupoId, quantidade);
  }
}

// Exportar instância padrão
export default new ClassificacaoService();
