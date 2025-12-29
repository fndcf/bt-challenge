/**
 * Service especializado para formação e gerenciamento de duplas
 * Responsabilidades:
 * - Formar duplas respeitando cabeças de chave
 * - Criar duplas no banco de dados
 * - Buscar duplas
 */

import { Inscricao } from "../models/Inscricao";
import { Dupla } from "../models/Dupla";
import { NivelJogador } from "../models/Jogador";
import { TipoFormacaoDupla } from "../models/Etapa";
import { IDuplaRepository } from "../repositories/interfaces/IDuplaRepository";
import { duplaRepository } from "../repositories/firebase/DuplaRepository";
import cabecaDeChaveService from "./CabecaDeChaveService";
import historicoDuplaService from "./HistoricoDuplaService";
import { embaralhar } from "../utils/arrayUtils";
import logger from "../utils/logger";

/**
 * Interface para injeção de dependência
 */
export interface IDuplaService {
  formarDuplasComCabecasDeChave(
    etapaId: string,
    etapaNome: string,
    arenaId: string,
    inscricoes: Inscricao[],
    tipoFormacao?: TipoFormacaoDupla
  ): Promise<Dupla[]>;

  buscarPorEtapa(etapaId: string, arenaId: string): Promise<Dupla[]>;
  buscarPorGrupo(grupoId: string): Promise<Dupla[]>;
  buscarPorJogador(etapaId: string, jogadorId: string): Promise<Dupla | null>;
  marcarClassificada(duplaId: string, classificada: boolean): Promise<void>;
  marcarClassificadasEmLote(
    duplaIds: string[],
    classificada: boolean
  ): Promise<void>;
  deletarPorEtapa(etapaId: string, arenaId: string): Promise<number>;
}

/**
 * Service para formação e gerenciamento de duplas
 */
export class DuplaService implements IDuplaService {
  constructor(private repository: IDuplaRepository = duplaRepository) {}

  /**
   * Formar duplas respeitando cabeças de chave
   * @param tipoFormacao - Se BALANCEADO, pareia Avançado+Iniciante e Intermediários entre si
   */
  async formarDuplasComCabecasDeChave(
    etapaId: string,
    etapaNome: string,
    arenaId: string,
    inscricoes: Inscricao[],
    tipoFormacao?: TipoFormacaoDupla
  ): Promise<Dupla[]> {
    try {
      let duplas: Dupla[];

      logger.info("Formando duplas", {
        etapaId,
        tipoFormacao,
        tipoFormacaoBalanceado: TipoFormacaoDupla.BALANCEADO,
        isBalanceado: tipoFormacao === TipoFormacaoDupla.BALANCEADO,
        totalInscricoes: inscricoes.length,
      });

      // Se formação balanceada, usar algoritmo específico
      if (tipoFormacao === TipoFormacaoDupla.BALANCEADO) {
        duplas = await this.formarDuplasBalanceadas(
          etapaId,
          arenaId,
          inscricoes
        );
      } else {
        // Formação padrão: proteger cabeças de chave
        const cabecasIds = await cabecaDeChaveService.obterIdsCabecas(
          arenaId,
          etapaId
        );

        const cabecas: Inscricao[] = [];
        const normais: Inscricao[] = [];

        for (const inscricao of inscricoes) {
          if (cabecasIds.includes(inscricao.jogadorId)) {
            cabecas.push(inscricao);
          } else {
            normais.push(inscricao);
          }
        }

        const stats = await historicoDuplaService.calcularEstatisticas(
          arenaId,
          etapaId
        );

        if (stats.todasCombinacoesFeitas && cabecas.length >= 2) {
          duplas = await this.formarDuplasLivre(etapaId, arenaId, inscricoes);
        } else {
          duplas = await this.formarDuplasProtegendoCabecas(
            etapaId,
            arenaId,
            cabecas,
            normais
          );
        }
      }

      // Registrar histórico de duplas formadas
      const cabecasIds = await cabecaDeChaveService.obterIdsCabecas(
        arenaId,
        etapaId
      );
      const historicosDTOs = duplas.map((dupla) => ({
        arenaId,
        etapaId,
        etapaNome,
        jogador1Id: dupla.jogador1Id,
        jogador1Nome: dupla.jogador1Nome,
        jogador2Id: dupla.jogador2Id,
        jogador2Nome: dupla.jogador2Nome,
        ambosForamCabecas:
          cabecasIds.includes(dupla.jogador1Id) &&
          cabecasIds.includes(dupla.jogador2Id),
      }));
      await historicoDuplaService.registrarEmLote(historicosDTOs);

      return duplas;
    } catch (error) {
      logger.error(
        "Erro ao formar duplas com cabeças",
        { etapaId, arenaId },
        error as Error
      );
      throw error;
    }
  }

  /**
   * Formar duplas balanceadas priorizando mescla de níveis diferentes
   *
   * Ordem de prioridade:
   * 1. Avançado + Iniciante
   * 2. Avançado + Intermediário (se sobrar avançados)
   * 3. Intermediário + Iniciante (se sobrar iniciantes)
   * 4. Intermediário + Intermediário
   * 5. Avançado + Avançado (último caso)
   * 6. Iniciante + Iniciante (último caso)
   */
  private async formarDuplasBalanceadas(
    etapaId: string,
    arenaId: string,
    inscricoes: Inscricao[]
  ): Promise<Dupla[]> {
    if (inscricoes.length % 2 !== 0) {
      throw new Error("Número ímpar de jogadores");
    }

    // Separar jogadores por nível (arrays mutáveis para ir removendo)
    const avancados = embaralhar(
      inscricoes.filter((i) => i.jogadorNivel === NivelJogador.AVANCADO)
    );
    const intermediarios = embaralhar(
      inscricoes.filter((i) => i.jogadorNivel === NivelJogador.INTERMEDIARIO)
    );
    const iniciantes = embaralhar(
      inscricoes.filter((i) => i.jogadorNivel === NivelJogador.INICIANTE)
    );

    const duplaDTOs: Array<Partial<Dupla>> = [];

    logger.info("Distribuição de níveis para formação balanceada", {
      etapaId,
      avancados: avancados.length,
      intermediarios: intermediarios.length,
      iniciantes: iniciantes.length,
    });

    // 1. Avançado + Iniciante (prioridade máxima)
    let countAvIni = 0;
    while (avancados.length > 0 && iniciantes.length > 0) {
      const av = avancados.pop()!;
      const ini = iniciantes.pop()!;
      duplaDTOs.push(this.montarDuplaDTO(etapaId, arenaId, av, ini));
      countAvIni++;
    }
    logger.info("Duplas Avançado+Iniciante formadas", { count: countAvIni });

    // 2. Avançado + Intermediário (se sobrar avançados)
    while (avancados.length > 0 && intermediarios.length > 0) {
      const av = avancados.pop()!;
      const inter = intermediarios.pop()!;
      duplaDTOs.push(this.montarDuplaDTO(etapaId, arenaId, av, inter));
    }

    // 3. Intermediário + Iniciante (se sobrar iniciantes)
    while (intermediarios.length > 0 && iniciantes.length > 0) {
      const inter = intermediarios.pop()!;
      const ini = iniciantes.pop()!;
      duplaDTOs.push(this.montarDuplaDTO(etapaId, arenaId, inter, ini));
    }

    // 4. Intermediário + Intermediário
    while (intermediarios.length >= 2) {
      const inter1 = intermediarios.pop()!;
      const inter2 = intermediarios.pop()!;
      duplaDTOs.push(this.montarDuplaDTO(etapaId, arenaId, inter1, inter2));
    }

    // 5. Avançado + Avançado (último caso)
    while (avancados.length >= 2) {
      const av1 = avancados.pop()!;
      const av2 = avancados.pop()!;
      duplaDTOs.push(this.montarDuplaDTO(etapaId, arenaId, av1, av2));
    }

    // 6. Iniciante + Iniciante (último caso)
    while (iniciantes.length >= 2) {
      const ini1 = iniciantes.pop()!;
      const ini2 = iniciantes.pop()!;
      duplaDTOs.push(this.montarDuplaDTO(etapaId, arenaId, ini1, ini2));
    }

    // 7. Se sobrar um de cada nível diferente, parear (caso raro)
    const restantes = [...avancados, ...intermediarios, ...iniciantes];
    while (restantes.length >= 2) {
      const j1 = restantes.pop()!;
      const j2 = restantes.pop()!;
      duplaDTOs.push(this.montarDuplaDTO(etapaId, arenaId, j1, j2));
    }

    logger.info("Duplas balanceadas formadas", {
      etapaId,
      total: duplaDTOs.length,
      avancadosOriginais: inscricoes.filter(
        (i) => i.jogadorNivel === NivelJogador.AVANCADO
      ).length,
      intermediariosOriginais: inscricoes.filter(
        (i) => i.jogadorNivel === NivelJogador.INTERMEDIARIO
      ).length,
      iniciantesOriginais: inscricoes.filter(
        (i) => i.jogadorNivel === NivelJogador.INICIANTE
      ).length,
    });

    return this.repository.criarEmLote(duplaDTOs);
  }

  /**
   * Formar duplas protegendo cabeças de chave
   * Cabeças de chave são pareadas com jogadores normais
   */
  private async formarDuplasProtegendoCabecas(
    etapaId: string,
    arenaId: string,
    cabecas: Inscricao[],
    normais: Inscricao[]
  ): Promise<Dupla[]> {
    const totalJogadores = cabecas.length + normais.length;

    // Validações
    if (totalJogadores % 2 !== 0) {
      throw new Error("Número ímpar de jogadores");
    }

    if (cabecas.length > normais.length) {
      throw new Error(
        `Impossível formar duplas: ${cabecas.length} cabeças mas apenas ${normais.length} jogadores normais. ` +
          `Precisa de pelo menos ${cabecas.length} jogadores normais.`
      );
    }

    // Embaralhar para aleatoriedade
    const cabecasEmbaralhadas = embaralhar([...cabecas]);
    const normaisEmbaralhados = embaralhar([...normais]);

    // Preparar DTOs para criação em lote
    const duplaDTOs: Array<Partial<Dupla>> = [];

    // Parear cabeças com normais
    for (let i = 0; i < cabecasEmbaralhadas.length; i++) {
      const cabeca = cabecasEmbaralhadas[i];
      const normal = normaisEmbaralhados[i];
      duplaDTOs.push(this.montarDuplaDTO(etapaId, arenaId, cabeca, normal));
    }

    // Parear jogadores normais restantes entre si
    const normaisRestantes = normaisEmbaralhados.slice(
      cabecasEmbaralhadas.length
    );

    for (let i = 0; i < normaisRestantes.length; i += 2) {
      if (i + 1 < normaisRestantes.length) {
        const jogador1 = normaisRestantes[i];
        const jogador2 = normaisRestantes[i + 1];
        duplaDTOs.push(
          this.montarDuplaDTO(etapaId, arenaId, jogador1, jogador2)
        );
      }
    }

    // Criar todas as duplas em uma única operação batch
    return this.repository.criarEmLote(duplaDTOs);
  }

  /**
   * Formar duplas livremente (sem proteção de cabeças)
   * Usado quando todas combinações de cabeças já foram feitas
   */
  private async formarDuplasLivre(
    etapaId: string,
    arenaId: string,
    inscricoes: Inscricao[]
  ): Promise<Dupla[]> {
    if (inscricoes.length % 2 !== 0) {
      throw new Error("Número ímpar de jogadores");
    }

    const embaralhado = embaralhar([...inscricoes]);

    // Preparar DTOs para criação em lote
    const duplaDTOs: Array<Partial<Dupla>> = [];

    for (let i = 0; i < embaralhado.length; i += 2) {
      const jogador1 = embaralhado[i];
      const jogador2 = embaralhado[i + 1];
      duplaDTOs.push(this.montarDuplaDTO(etapaId, arenaId, jogador1, jogador2));
    }

    // Criar todas as duplas em uma única operação batch
    return this.repository.criarEmLote(duplaDTOs);
  }

  /**
   * Montar DTO para criação de dupla
   */
  private montarDuplaDTO(
    etapaId: string,
    arenaId: string,
    jogador1: Inscricao,
    jogador2: Inscricao
  ): Partial<Dupla> {
    return {
      etapaId,
      arenaId,
      jogador1Id: jogador1.jogadorId,
      jogador1Nome: jogador1.jogadorNome,
      jogador1Nivel: jogador1.jogadorNivel,
      jogador1Genero: jogador1.jogadorGenero,
      jogador2Id: jogador2.jogadorId,
      jogador2Nome: jogador2.jogadorNome,
      jogador2Nivel: jogador2.jogadorNivel,
      jogador2Genero: jogador2.jogadorGenero,
    };
  }

  /**
   * Buscar duplas de uma etapa
   */
  async buscarPorEtapa(etapaId: string, arenaId: string): Promise<Dupla[]> {
    return this.repository.buscarPorEtapa(etapaId, arenaId);
  }

  /**
   * Buscar duplas de um grupo
   */
  async buscarPorGrupo(grupoId: string): Promise<Dupla[]> {
    return this.repository.buscarPorGrupo(grupoId);
  }

  /**
   * Buscar dupla por jogador
   */
  async buscarPorJogador(
    etapaId: string,
    jogadorId: string
  ): Promise<Dupla | null> {
    return this.repository.buscarPorJogador(etapaId, jogadorId);
  }

  /**
   * Marcar dupla como classificada
   */
  async marcarClassificada(
    duplaId: string,
    classificada: boolean
  ): Promise<void> {
    await this.repository.marcarClassificada(duplaId, classificada);
  }

  /**
   * Marcar múltiplas duplas como classificadas
   */
  async marcarClassificadasEmLote(
    duplaIds: string[],
    classificada: boolean
  ): Promise<void> {
    const updates = duplaIds.map((id) => ({
      id,
      data: { classificada },
    }));
    await this.repository.atualizarEmLote(updates);
  }

  /**
   * Deletar todas as duplas de uma etapa
   */
  async deletarPorEtapa(etapaId: string, arenaId: string): Promise<number> {
    return this.repository.deletarPorEtapa(etapaId, arenaId);
  }
}

// Exportar instância padrão
export default new DuplaService();
