/**
 * TeamsConfrontoService - Responsabilidade: Geração e gerenciamento de confrontos
 *
 * Seguindo SRP e usando Strategy Pattern:
 * - Geração de confrontos round-robin
 * - Geração de fase de grupos
 * - Geração de fase eliminatória (delegando para strategies)
 */

import {
  Equipe,
  ConfrontoEquipe,
  CriarConfrontoDTO,
  TipoFormacaoJogos,
} from "../../models/Teams";
import { Etapa, FaseEtapa } from "../../models/Etapa";
import { IConfrontoEquipeRepository } from "../../repositories/interfaces/IConfrontoEquipeRepository";
import { IEquipeRepository } from "../../repositories/interfaces/IEquipeRepository";
import ConfrontoEquipeRepository from "../../repositories/firebase/ConfrontoEquipeRepository";
import EquipeRepository from "../../repositories/firebase/EquipeRepository";
import { ValidationError } from "../../utils/errors";
import logger from "../../utils/logger";
import { eliminatoriaStrategyFactory } from "./strategies";

export interface ITeamsConfrontoService {
  gerarConfrontos(
    etapa: Etapa,
    tipoFormacaoJogos: TipoFormacaoJogos,
    equipesJaCriadas?: Equipe[]
  ): Promise<ConfrontoEquipe[]>;

  buscarConfrontos(
    etapaId: string,
    arenaId: string
  ): Promise<ConfrontoEquipe[]>;
}

export class TeamsConfrontoService implements ITeamsConfrontoService {
  constructor(
    private confrontoRepository: IConfrontoEquipeRepository = ConfrontoEquipeRepository,
    private equipeRepository: IEquipeRepository = EquipeRepository
  ) {}

  /**
   * Gera confrontos round-robin entre equipes
   * Com 6+ equipes: gera fase de grupos + fase eliminatória
   * Com 2-5 equipes: gera todos contra todos
   */
  async gerarConfrontos(
    etapa: Etapa,
    tipoFormacaoJogos: TipoFormacaoJogos = TipoFormacaoJogos.SORTEIO,
    equipesJaCriadas?: Equipe[]
  ): Promise<ConfrontoEquipe[]> {
    const tempos: Record<string, number> = {};
    const inicioTotal = Date.now();

    try {
      // 1. Usar equipes já criadas ou buscar do banco
      let inicio = Date.now();
      const equipes =
        equipesJaCriadas ||
        (await this.equipeRepository.buscarPorEtapaOrdenadas(
          etapa.id,
          etapa.arenaId
        ));
      tempos["1_buscarEquipes"] = Date.now() - inicio;
      tempos["1_equipesJaCriadas"] = equipesJaCriadas ? 1 : 0;

      if (equipes.length < 2) {
        throw new ValidationError("Mínimo de 2 equipes para gerar confrontos");
      }

      const temFaseGrupos = equipes.length >= 6;

      // 2. Gerar confrontos
      inicio = Date.now();
      let confrontos: ConfrontoEquipe[];
      if (temFaseGrupos) {
        confrontos = await this.gerarConfrontosFaseGrupos(
          etapa,
          equipes,
          tipoFormacaoJogos
        );
      } else {
        confrontos = await this.gerarConfrontosRoundRobin(
          etapa,
          equipes,
          tipoFormacaoJogos
        );
      }
      tempos["2_gerarConfrontos"] = Date.now() - inicio;

      tempos["TOTAL"] = Date.now() - inicioTotal;

      logger.info("⏱️ TEMPOS gerarConfrontos TeamsConfrontoService", {
        etapaId: etapa.id,
        equipes: equipes.length,
        confrontos: confrontos.length,
        temFaseGrupos,
        tempos,
      });

      return confrontos;
    } catch (error: any) {
      tempos["TOTAL_COM_ERRO"] = Date.now() - inicioTotal;
      logger.error(
        "Erro ao gerar confrontos Teams",
        { etapaId: etapa.id, tempos },
        error
      );
      throw error;
    }
  }

  /**
   * Busca confrontos de uma etapa
   */
  async buscarConfrontos(
    etapaId: string,
    arenaId: string
  ): Promise<ConfrontoEquipe[]> {
    return this.confrontoRepository.buscarPorEtapaOrdenados(etapaId, arenaId);
  }

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Gera apenas os DTOs de confrontos round-robin (sem criar no banco)
   */
  private montarConfrontosRoundRobinDTO(
    etapa: Etapa,
    equipes: Equipe[],
    tipoFormacaoJogos: TipoFormacaoJogos,
    grupoId?: string,
    ordemInicial: number = 1
  ): CriarConfrontoDTO[] {
    const confrontoDTOs: CriarConfrontoDTO[] = [];
    const n = equipes.length;

    // Algoritmo circle method para round-robin
    const numRodadas = n % 2 === 0 ? n - 1 : n;
    const equipesArray = [...equipes];

    // Se ímpar, adicionar "bye" (null)
    if (n % 2 !== 0) {
      equipesArray.push(null as any);
    }

    const numEquipesComBye = equipesArray.length;
    let ordem = ordemInicial;

    for (let rodada = 1; rodada <= numRodadas; rodada++) {
      for (let i = 0; i < numEquipesComBye / 2; i++) {
        const equipe1 = equipesArray[i];
        const equipe2 = equipesArray[numEquipesComBye - 1 - i];

        if (equipe1 && equipe2) {
          confrontoDTOs.push({
            etapaId: etapa.id,
            arenaId: etapa.arenaId,
            fase: FaseEtapa.GRUPOS,
            rodada,
            ordem: ordem++,
            grupoId,
            equipe1Id: equipe1.id,
            equipe1Nome: equipe1.nome,
            equipe2Id: equipe2.id,
            equipe2Nome: equipe2.nome,
            tipoFormacaoJogos,
          });
        }
      }

      // Rotacionar equipes
      const fixed = equipesArray[0];
      const rotating = equipesArray.slice(1);
      rotating.unshift(rotating.pop()!);
      equipesArray.splice(0, equipesArray.length, fixed, ...rotating);
    }

    return confrontoDTOs;
  }

  /**
   * Gera confrontos round-robin simples (todos contra todos)
   * Usado quando não há fase de grupos (< 6 equipes)
   */
  private async gerarConfrontosRoundRobin(
    etapa: Etapa,
    equipes: Equipe[],
    tipoFormacaoJogos: TipoFormacaoJogos,
    grupoId?: string
  ): Promise<ConfrontoEquipe[]> {
    const confrontoDTOs = this.montarConfrontosRoundRobinDTO(
      etapa,
      equipes,
      tipoFormacaoJogos,
      grupoId
    );
    return this.confrontoRepository.criarEmLote(confrontoDTOs);
  }

  /**
   * Gera confrontos com fase de grupos + fase eliminatória
   */
  private async gerarConfrontosFaseGrupos(
    etapa: Etapa,
    equipes: Equipe[],
    tipoFormacaoJogos: TipoFormacaoJogos
  ): Promise<ConfrontoEquipe[]> {
    // Separar equipes por grupo
    const gruposMap = new Map<string, Equipe[]>();
    for (const equipe of equipes) {
      const grupoId = equipe.grupoId || "A";
      if (!gruposMap.has(grupoId)) {
        gruposMap.set(grupoId, []);
      }
      gruposMap.get(grupoId)!.push(equipe);
    }

    // Gerar todos os DTOs de confrontos de grupos em memória
    const todosConfrontoDTOs: CriarConfrontoDTO[] = [];
    let ordemGlobal = 1;

    for (const [grupoId, equipesDoGrupo] of gruposMap.entries()) {
      const dtos = this.montarConfrontosRoundRobinDTO(
        etapa,
        equipesDoGrupo,
        tipoFormacaoJogos,
        grupoId,
        ordemGlobal
      );
      todosConfrontoDTOs.push(...dtos);
      ordemGlobal += dtos.length;
    }

    // Criar todos os confrontos de grupos em um ÚNICO batch
    const confrontosGrupos = await this.confrontoRepository.criarEmLote(
      todosConfrontoDTOs
    );

    // Gerar fase eliminatória usando Strategy Pattern
    const confrontosEliminatoria = await this.gerarFaseEliminatoria(
      etapa,
      Array.from(gruposMap.keys()),
      tipoFormacaoJogos
    );

    return [...confrontosGrupos, ...confrontosEliminatoria];
  }

  /**
   * Gera a fase eliminatória usando Strategy Pattern
   * Delega para a estratégia correta baseada no número de grupos
   */
  private async gerarFaseEliminatoria(
    etapa: Etapa,
    grupoIds: string[],
    tipoFormacaoJogos: TipoFormacaoJogos
  ): Promise<ConfrontoEquipe[]> {
    const numGrupos = grupoIds.length;

    // Validar número de grupos suportado
    if (!eliminatoriaStrategyFactory.isSupported(numGrupos)) {
      const supported = eliminatoriaStrategyFactory.getSupportedGroupCounts();
      logger.warn(
        `Fase eliminatória suporta ${supported.join(", ")} grupos. Recebido: ${numGrupos}`
      );
      return [];
    }

    // Obter a estratégia correta
    const strategy = eliminatoriaStrategyFactory.getStrategy(numGrupos);
    if (!strategy) {
      return [];
    }

    // Ordenar grupos por letra (A, B, C, D, ...)
    const gruposOrdenados = grupoIds.sort();

    // Executar a estratégia
    return strategy.gerar({
      etapa,
      grupos: gruposOrdenados,
      tipoFormacaoJogos,
      confrontoRepository: this.confrontoRepository,
    });
  }
}

export default new TeamsConfrontoService();
