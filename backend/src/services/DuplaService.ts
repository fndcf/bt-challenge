/**
 * Service especializado para formação e gerenciamento de duplas
 * Responsabilidades:
 * - Formar duplas respeitando cabeças de chave
 * - Criar duplas no banco de dados
 * - Buscar duplas
 */

import { Inscricao } from "../models/Inscricao";
import { Dupla } from "../models/Dupla";
import { EstatisticasCombinacoes } from "../models/HistoricoDupla";
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
    inscricoes: Inscricao[]
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
   */
  async formarDuplasComCabecasDeChave(
    etapaId: string,
    etapaNome: string,
    arenaId: string,
    inscricoes: Inscricao[]
  ): Promise<Dupla[]> {
    try {
      // Obter IDs dos cabeças de chave
      const cabecasIds = await cabecaDeChaveService.obterIdsCabecas(
        arenaId,
        etapaId
      );

      // Separar cabeças de chave dos jogadores normais
      const cabecas: Inscricao[] = [];
      const normais: Inscricao[] = [];

      for (const inscricao of inscricoes) {
        if (cabecasIds.includes(inscricao.jogadorId)) {
          cabecas.push(inscricao);
        } else {
          normais.push(inscricao);
        }
      }

      // Verificar estatísticas de combinações
      const stats = await historicoDuplaService.calcularEstatisticas(
        arenaId,
        etapaId
      );

      let duplas: Dupla[];

      // Se todas combinações de cabeças já foram feitas, formar livremente
      if (stats.todasCombinacoesFeitas && cabecas.length >= 2) {
        duplas = await this.formarDuplasLivre(etapaId, arenaId, inscricoes);
      } else {
        // Formar protegendo cabeças de chave
        duplas = await this.formarDuplasProtegendoCabecas(
          etapaId,
          arenaId,
          cabecas,
          normais,
          stats
        );
      }

      // Registrar histórico de duplas formadas
      for (const dupla of duplas) {
        const ambosForamCabecas =
          cabecasIds.includes(dupla.jogador1Id) &&
          cabecasIds.includes(dupla.jogador2Id);

        await historicoDuplaService.registrar({
          arenaId,
          etapaId,
          etapaNome,
          jogador1Id: dupla.jogador1Id,
          jogador1Nome: dupla.jogador1Nome,
          jogador2Id: dupla.jogador2Id,
          jogador2Nome: dupla.jogador2Nome,
          ambosForamCabecas,
        });
      }

      logger.info("Duplas formadas", {
        etapaId,
        arenaId,
        totalDuplas: duplas.length,
        cabecasDeChave: cabecas.length,
        todasCombinacoesFeitas: stats.todasCombinacoesFeitas,
      });

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
   * Formar duplas protegendo cabeças de chave
   * Cabeças de chave são pareadas com jogadores normais
   */
  private async formarDuplasProtegendoCabecas(
    etapaId: string,
    arenaId: string,
    cabecas: Inscricao[],
    normais: Inscricao[],
    _stats: EstatisticasCombinacoes
  ): Promise<Dupla[]> {
    const duplas: Dupla[] = [];
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

    // Parear cabeças com normais
    for (let i = 0; i < cabecasEmbaralhadas.length; i++) {
      const cabeca = cabecasEmbaralhadas[i];
      const normal = normaisEmbaralhados[i];

      const dupla = await this.criarDupla(etapaId, arenaId, cabeca, normal);
      duplas.push(dupla);
    }

    // Parear jogadores normais restantes entre si
    const normaisRestantes = normaisEmbaralhados.slice(
      cabecasEmbaralhadas.length
    );

    for (let i = 0; i < normaisRestantes.length; i += 2) {
      if (i + 1 < normaisRestantes.length) {
        const jogador1 = normaisRestantes[i];
        const jogador2 = normaisRestantes[i + 1];

        const dupla = await this.criarDupla(
          etapaId,
          arenaId,
          jogador1,
          jogador2
        );
        duplas.push(dupla);
      }
    }

    return duplas;
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
    const duplas: Dupla[] = [];

    if (inscricoes.length % 2 !== 0) {
      throw new Error("Número ímpar de jogadores");
    }

    const embaralhado = embaralhar([...inscricoes]);

    for (let i = 0; i < embaralhado.length; i += 2) {
      const jogador1 = embaralhado[i];
      const jogador2 = embaralhado[i + 1];

      const dupla = await this.criarDupla(etapaId, arenaId, jogador1, jogador2);
      duplas.push(dupla);
    }

    return duplas;
  }

  /**
   * Criar dupla no banco de dados
   */
  private async criarDupla(
    etapaId: string,
    arenaId: string,
    jogador1: Inscricao,
    jogador2: Inscricao
  ): Promise<Dupla> {
    return this.repository.criar({
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
    });
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
