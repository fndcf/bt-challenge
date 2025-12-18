/**
 * Service especializado para criação e gerenciamento de grupos
 * Responsabilidades:
 * - Calcular distribuição de grupos
 * - Criar grupos com duplas distribuídas
 * - Gerenciar estado dos grupos
 */

import { Dupla } from "../models/Dupla";
import { Grupo } from "../models/Grupo";
import { IGrupoRepository } from "../repositories/interfaces/IGrupoRepository";
import { IDuplaRepository } from "../repositories/interfaces/IDuplaRepository";
import { grupoRepository } from "../repositories/firebase/GrupoRepository";
import { duplaRepository } from "../repositories/firebase/DuplaRepository";
import cabecaDeChaveService from "./CabecaDeChaveService";
import {
  calcularDistribuicaoGrupos,
  LETRAS_GRUPOS,
} from "../utils/torneioUtils";
import logger from "../utils/logger";

/**
 * Interface para injeção de dependência
 */
export interface IGrupoService {
  criarGrupos(
    etapaId: string,
    arenaId: string,
    duplas: Dupla[],
    duplasPorGrupo: number
  ): Promise<Grupo[]>;

  buscarPorEtapa(etapaId: string, arenaId: string): Promise<Grupo[]>;
  buscarPorId(grupoId: string): Promise<Grupo | null>;
  verificarTodosCompletos(etapaId: string, arenaId: string): Promise<boolean>;
  marcarCompleto(grupoId: string, completo: boolean): Promise<void>;
  deletarPorEtapa(etapaId: string, arenaId: string): Promise<number>;
}

/**
 * Service para criação e gerenciamento de grupos
 */
export class GrupoService implements IGrupoService {
  constructor(
    private grupoRepo: IGrupoRepository = grupoRepository,
    private duplaRepo: IDuplaRepository = duplaRepository
  ) {}

  /**
   * Criar grupos com distribuição equilibrada de duplas
   *
   * REGRAS:
   * 1. Cabeças de chave são distribuídos uniformemente entre grupos
   * 2. Duplas normais preenchem as vagas restantes
   * 3. Prioriza grupos de 3, depois de 4 (exceto 5 duplas = 1 grupo de 5)
   */
  async criarGrupos(
    etapaId: string,
    arenaId: string,
    duplas: Dupla[],
    _duplasPorGrupo: number
  ): Promise<Grupo[]> {
    const tempos: Record<string, number> = {};
    const inicioTotal = Date.now();

    try {
      const grupos: Grupo[] = [];

      // Calcular distribuição ideal de grupos
      let inicio = Date.now();
      const distribuicao = calcularDistribuicaoGrupos(duplas.length);
      const qtdGrupos = distribuicao.length;
      tempos["1_calcularDistribuicao"] = Date.now() - inicio;

      // Obter cabeças de chave para distribuição equilibrada
      inicio = Date.now();
      const cabecasIds = await cabecaDeChaveService.obterIdsCabecas(
        arenaId,
        etapaId
      );
      tempos["2_obterCabecas"] = Date.now() - inicio;

      // Separar duplas com cabeças de chave das normais
      inicio = Date.now();
      const duplasComCabecas: Dupla[] = [];
      const duplasNormais: Dupla[] = [];

      for (const dupla of duplas) {
        const temCabeca =
          cabecasIds.includes(dupla.jogador1Id) ||
          cabecasIds.includes(dupla.jogador2Id);

        if (temCabeca) {
          duplasComCabecas.push(dupla);
        } else {
          duplasNormais.push(dupla);
        }
      }

      // Inicializar arrays de duplas por grupo
      const gruposDuplas: Dupla[][] = Array.from(
        { length: qtdGrupos },
        () => []
      );

      // 1. Distribuir cabeças de chave uniformemente (round-robin)
      let grupoAtual = 0;
      for (const dupla of duplasComCabecas) {
        gruposDuplas[grupoAtual].push(dupla);
        grupoAtual = (grupoAtual + 1) % qtdGrupos;
      }

      // 2. Preencher vagas restantes com duplas normais
      let indiceNormal = 0;
      for (let g = 0; g < qtdGrupos; g++) {
        const limiteGrupo = distribuicao[g];
        const duplasAtuais = gruposDuplas[g].length;
        const vagas = limiteGrupo - duplasAtuais;

        for (let v = 0; v < vagas; v++) {
          if (indiceNormal < duplasNormais.length) {
            gruposDuplas[g].push(duplasNormais[indiceNormal]);
            indiceNormal++;
          }
        }
      }

      // Validar distribuição
      const totalDistribuido = gruposDuplas.reduce(
        (sum, g) => sum + g.length,
        0
      );
      if (totalDistribuido !== duplas.length) {
        throw new Error(
          `ERRO CRÍTICO: Distribuição incorreta! ` +
            `Total de duplas: ${duplas.length}, Distribuído: ${totalDistribuido}`
        );
      }
      tempos["3_distribuirDuplas"] = Date.now() - inicio;

      // 3. Criar grupos no banco de dados
      // ✅ OTIMIZAÇÃO v3: Criar todos os grupos em batch
      inicio = Date.now();

      // 3.1 Preparar DTOs e criar todos os grupos em batch
      const grupoDTOs = [];
      for (let grupoIndex = 0; grupoIndex < qtdGrupos; grupoIndex++) {
        const nomeGrupo = `Grupo ${LETRAS_GRUPOS[grupoIndex]}`;
        const duplasDoGrupo = gruposDuplas[grupoIndex];

        grupoDTOs.push({
          etapaId,
          arenaId,
          nome: nomeGrupo,
          ordem: grupoIndex + 1,
          duplas: duplasDoGrupo.map((d) => d.id),
          totalDuplas: duplasDoGrupo.length,
        });
      }

      const gruposCriados = await this.grupoRepo.criarEmLote(grupoDTOs);
      grupos.push(...gruposCriados);
      const tempoCriarGrupos = Date.now() - inicio;

      // 3.2 Atualizar todas as duplas em batch
      inicio = Date.now();
      const duplaUpdates: Array<{ id: string; data: Partial<Dupla> }> = [];
      for (let grupoIndex = 0; grupoIndex < qtdGrupos; grupoIndex++) {
        const grupo = grupos[grupoIndex];
        const duplasDoGrupo = gruposDuplas[grupoIndex];

        for (const dupla of duplasDoGrupo) {
          duplaUpdates.push({
            id: dupla.id,
            data: { grupoId: grupo.id, grupoNome: grupo.nome },
          });
        }
      }
      await this.duplaRepo.atualizarEmLote(duplaUpdates);
      const tempoAtualizarDuplas = Date.now() - inicio;

      tempos["4a_criarGrupos"] = tempoCriarGrupos;
      tempos["4b_atualizarDuplas"] = tempoAtualizarDuplas;
      tempos["4_criarGruposNoBanco"] = tempoCriarGrupos + tempoAtualizarDuplas;

      tempos["TOTAL"] = Date.now() - inicioTotal;

      logger.info("⏱️ TEMPOS criarGrupos", {
        etapaId,
        duplas: duplas.length,
        grupos: grupos.length,
        tempos,
      });

      return grupos;
    } catch (error) {
      tempos["TOTAL_COM_ERRO"] = Date.now() - inicioTotal;
      logger.error(
        "Erro ao criar grupos",
        { etapaId, arenaId, tempos },
        error as Error
      );
      throw new Error("Falha ao criar grupos");
    }
  }

  /**
   * Buscar grupos de uma etapa ordenados
   */
  async buscarPorEtapa(etapaId: string, arenaId: string): Promise<Grupo[]> {
    return this.grupoRepo.buscarPorEtapaOrdenado(etapaId, arenaId);
  }

  /**
   * Buscar grupo por ID
   */
  async buscarPorId(grupoId: string): Promise<Grupo | null> {
    return this.grupoRepo.buscarPorId(grupoId);
  }

  /**
   * Verificar se todos os grupos estão completos
   */
  async verificarTodosCompletos(
    etapaId: string,
    arenaId: string
  ): Promise<boolean> {
    return this.grupoRepo.todosCompletos(etapaId, arenaId);
  }

  /**
   * Marcar grupo como completo
   */
  async marcarCompleto(grupoId: string, completo: boolean): Promise<void> {
    await this.grupoRepo.marcarCompleto(grupoId, completo);
  }

  /**
   * Buscar grupos incompletos
   */
  async buscarIncompletos(etapaId: string, arenaId: string): Promise<Grupo[]> {
    return this.grupoRepo.buscarIncompletos(etapaId, arenaId);
  }

  /**
   * Incrementar partidas finalizadas do grupo
   */
  async incrementarPartidasFinalizadas(grupoId: string): Promise<void> {
    await this.grupoRepo.incrementarPartidasFinalizadas(grupoId);
  }

  /**
   * Decrementar partidas finalizadas do grupo
   */
  async decrementarPartidasFinalizadas(grupoId: string): Promise<void> {
    await this.grupoRepo.decrementarPartidasFinalizadas(grupoId);
  }

  /**
   * Definir duplas classificadas do grupo
   */
  async definirClassificadas(
    grupoId: string,
    duplasIds: string[]
  ): Promise<void> {
    await this.grupoRepo.definirClassificadas(grupoId, duplasIds);
  }

  /**
   * Deletar todos os grupos de uma etapa
   */
  async deletarPorEtapa(etapaId: string, arenaId: string): Promise<number> {
    return this.grupoRepo.deletarPorEtapa(etapaId, arenaId);
  }

  /**
   * Adicionar partidas ao grupo em lote (funciona para 1 ou mais)
   */
  async adicionarPartidasEmLote(grupoId: string, partidaIds: string[]): Promise<void> {
    await this.grupoRepo.adicionarPartidasEmLote(grupoId, partidaIds);
  }

  /**
   * Atualizar contadores do grupo
   */
  async atualizarContadores(
    grupoId: string,
    dados: {
      totalPartidas?: number;
      partidasFinalizadas?: number;
    }
  ): Promise<void> {
    await this.grupoRepo.atualizarContadores(grupoId, dados);
  }
}

// Exportar instância padrão
export default new GrupoService();
