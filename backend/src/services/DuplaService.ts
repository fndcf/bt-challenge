/**
 * Service especializado para formação e gerenciamento de duplas
 * Responsabilidades:
 * - Formar duplas respeitando cabeças de chave
 * - Criar duplas no banco de dados
 * - Buscar duplas
 */

import { Inscricao } from "../models/Inscricao";
import { Dupla } from "../models/Dupla";
import { NivelJogador, GeneroJogador } from "../models/Jogador";
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
    tipoFormacao?: TipoFormacaoDupla,
    generoEtapa?: GeneroJogador
  ): Promise<Dupla[]>;

  formarDuplasManualmente(
    etapaId: string,
    etapaNome: string,
    arenaId: string,
    inscricoes: Inscricao[],
    formacoes: { jogador1Id: string; jogador2Id: string }[],
    generoEtapa?: GeneroJogador
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
   * @param generoEtapa - Se MISTO, forma duplas com 1 masculino + 1 feminino
   */
  async formarDuplasComCabecasDeChave(
    etapaId: string,
    etapaNome: string,
    arenaId: string,
    inscricoes: Inscricao[],
    tipoFormacao?: TipoFormacaoDupla,
    generoEtapa?: GeneroJogador
  ): Promise<Dupla[]> {
    try {
      let duplas: Dupla[];

      const isMisto = generoEtapa === GeneroJogador.MISTO;

      // Buscar cabeças de chave
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

      // Se etapa mista, formar duplas 1M+1F respeitando cabeças de chave
      if (isMisto) {
        if (cabecas.length > 0) {
          duplas = await this.formarDuplasMistoProtegendoCabecas(
            etapaId, arenaId, cabecas, normais
          );
        } else {
          duplas = await this.formarDuplasMisto(
            etapaId, arenaId, inscricoes, tipoFormacao
          );
        }
      } else {
        // Para BALANCEADO e padrão: SEMPRE proteger cabeças de chave
        if (cabecas.length > 0) {
          duplas = await this.formarDuplasProtegendoCabecas(
            etapaId,
            arenaId,
            cabecas,
            normais
          );
        } else {
          if (tipoFormacao === TipoFormacaoDupla.BALANCEADO) {
            duplas = await this.formarDuplasBalanceadas(etapaId, arenaId, inscricoes);
          } else {
            duplas = await this.formarDuplasLivre(etapaId, arenaId, inscricoes);
          }
        }
      }

      // Registrar histórico de duplas formadas
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
   * Formar duplas mistas (1 masculino + 1 feminino)
   * Combina com lógica de nível quando tipoFormacao é especificado
   *
   * Se BALANCEADO: prioriza avançado(M) + iniciante(F) ou avançado(F) + iniciante(M)
   * Se MESMO_NIVEL ou não especificado: pareia mesmo nível mas gêneros opostos
   */
  private async formarDuplasMisto(
    etapaId: string,
    arenaId: string,
    inscricoes: Inscricao[],
    tipoFormacao?: TipoFormacaoDupla
  ): Promise<Dupla[]> {
    if (inscricoes.length % 2 !== 0) {
      throw new Error("Número ímpar de jogadores");
    }

    // Separar por gênero
    const masculinos = inscricoes.filter(
      (i) => i.jogadorGenero === GeneroJogador.MASCULINO
    );
    const femininos = inscricoes.filter(
      (i) => i.jogadorGenero === GeneroJogador.FEMININO
    );

    if (masculinos.length !== femininos.length) {
      throw new Error(
        `Etapa mista requer mesmo número de masculinos (${masculinos.length}) e femininos (${femininos.length})`
      );
    }

    logger.info("Distribuição de gêneros para formação mista", {
      etapaId,
      masculinos: masculinos.length,
      femininos: femininos.length,
      tipoFormacao,
    });

    const duplaDTOs: Array<Partial<Dupla>> = [];

    if (tipoFormacao === TipoFormacaoDupla.BALANCEADO) {
      // Formação balanceada mista: prioriza níveis opostos + gêneros opostos
      // Separar por nível E gênero
      const avancadosM = embaralhar(
        masculinos.filter((i) => i.jogadorNivel === NivelJogador.AVANCADO)
      );
      const avancadosF = embaralhar(
        femininos.filter((i) => i.jogadorNivel === NivelJogador.AVANCADO)
      );
      const intermediariosM = embaralhar(
        masculinos.filter((i) => i.jogadorNivel === NivelJogador.INTERMEDIARIO)
      );
      const intermediariosF = embaralhar(
        femininos.filter((i) => i.jogadorNivel === NivelJogador.INTERMEDIARIO)
      );
      const iniciantesM = embaralhar(
        masculinos.filter((i) => i.jogadorNivel === NivelJogador.INICIANTE)
      );
      const iniciantesF = embaralhar(
        femininos.filter((i) => i.jogadorNivel === NivelJogador.INICIANTE)
      );

      logger.info("Distribuição por nível e gênero (balanceado misto)", {
        etapaId,
        avancadosM: avancadosM.length,
        avancadosF: avancadosF.length,
        intermediariosM: intermediariosM.length,
        intermediariosF: intermediariosF.length,
        iniciantesM: iniciantesM.length,
        iniciantesF: iniciantesF.length,
      });

      // 1. Avançado(M) + Iniciante(F)
      while (avancadosM.length > 0 && iniciantesF.length > 0) {
        const av = avancadosM.pop()!;
        const ini = iniciantesF.pop()!;
        duplaDTOs.push(this.montarDuplaDTO(etapaId, arenaId, av, ini));
      }

      // 2. Avançado(F) + Iniciante(M)
      while (avancadosF.length > 0 && iniciantesM.length > 0) {
        const av = avancadosF.pop()!;
        const ini = iniciantesM.pop()!;
        duplaDTOs.push(this.montarDuplaDTO(etapaId, arenaId, av, ini));
      }

      // 3. Avançado(M) + Intermediário(F)
      while (avancadosM.length > 0 && intermediariosF.length > 0) {
        const av = avancadosM.pop()!;
        const inter = intermediariosF.pop()!;
        duplaDTOs.push(this.montarDuplaDTO(etapaId, arenaId, av, inter));
      }

      // 4. Avançado(F) + Intermediário(M)
      while (avancadosF.length > 0 && intermediariosM.length > 0) {
        const av = avancadosF.pop()!;
        const inter = intermediariosM.pop()!;
        duplaDTOs.push(this.montarDuplaDTO(etapaId, arenaId, av, inter));
      }

      // 5. Intermediário(M) + Iniciante(F)
      while (intermediariosM.length > 0 && iniciantesF.length > 0) {
        const inter = intermediariosM.pop()!;
        const ini = iniciantesF.pop()!;
        duplaDTOs.push(this.montarDuplaDTO(etapaId, arenaId, inter, ini));
      }

      // 6. Intermediário(F) + Iniciante(M)
      while (intermediariosF.length > 0 && iniciantesM.length > 0) {
        const inter = intermediariosF.pop()!;
        const ini = iniciantesM.pop()!;
        duplaDTOs.push(this.montarDuplaDTO(etapaId, arenaId, inter, ini));
      }

      // 7. Intermediário(M) + Intermediário(F)
      while (intermediariosM.length > 0 && intermediariosF.length > 0) {
        const interM = intermediariosM.pop()!;
        const interF = intermediariosF.pop()!;
        duplaDTOs.push(this.montarDuplaDTO(etapaId, arenaId, interM, interF));
      }

      // 8. Avançado(M) + Avançado(F) (se sobrar avançados)
      while (avancadosM.length > 0 && avancadosF.length > 0) {
        const avM = avancadosM.pop()!;
        const avF = avancadosF.pop()!;
        duplaDTOs.push(this.montarDuplaDTO(etapaId, arenaId, avM, avF));
      }

      // 9. Iniciante(M) + Iniciante(F) (se sobrar iniciantes)
      while (iniciantesM.length > 0 && iniciantesF.length > 0) {
        const iniM = iniciantesM.pop()!;
        const iniF = iniciantesF.pop()!;
        duplaDTOs.push(this.montarDuplaDTO(etapaId, arenaId, iniM, iniF));
      }

      // 10. Restantes (caso raro - parear qualquer M com qualquer F)
      const restantesM = [...avancadosM, ...intermediariosM, ...iniciantesM];
      const restantesF = [...avancadosF, ...intermediariosF, ...iniciantesF];
      while (restantesM.length > 0 && restantesF.length > 0) {
        const m = restantesM.pop()!;
        const f = restantesF.pop()!;
        duplaDTOs.push(this.montarDuplaDTO(etapaId, arenaId, m, f));
      }
    } else {
      // Formação mesmo nível mista: pareia mesmo nível + gêneros opostos
      // Separar por nível E gênero
      const avancadosM = embaralhar(
        masculinos.filter((i) => i.jogadorNivel === NivelJogador.AVANCADO)
      );
      const avancadosF = embaralhar(
        femininos.filter((i) => i.jogadorNivel === NivelJogador.AVANCADO)
      );
      const intermediariosM = embaralhar(
        masculinos.filter((i) => i.jogadorNivel === NivelJogador.INTERMEDIARIO)
      );
      const intermediariosF = embaralhar(
        femininos.filter((i) => i.jogadorNivel === NivelJogador.INTERMEDIARIO)
      );
      const iniciantesM = embaralhar(
        masculinos.filter((i) => i.jogadorNivel === NivelJogador.INICIANTE)
      );
      const iniciantesF = embaralhar(
        femininos.filter((i) => i.jogadorNivel === NivelJogador.INICIANTE)
      );

      logger.info("Distribuição por nível e gênero (mesmo nível misto)", {
        etapaId,
        avancadosM: avancadosM.length,
        avancadosF: avancadosF.length,
        intermediariosM: intermediariosM.length,
        intermediariosF: intermediariosF.length,
        iniciantesM: iniciantesM.length,
        iniciantesF: iniciantesF.length,
      });

      // 1. Avançado(M) + Avançado(F)
      while (avancadosM.length > 0 && avancadosF.length > 0) {
        const avM = avancadosM.pop()!;
        const avF = avancadosF.pop()!;
        duplaDTOs.push(this.montarDuplaDTO(etapaId, arenaId, avM, avF));
      }

      // 2. Intermediário(M) + Intermediário(F)
      while (intermediariosM.length > 0 && intermediariosF.length > 0) {
        const interM = intermediariosM.pop()!;
        const interF = intermediariosF.pop()!;
        duplaDTOs.push(this.montarDuplaDTO(etapaId, arenaId, interM, interF));
      }

      // 3. Iniciante(M) + Iniciante(F)
      while (iniciantesM.length > 0 && iniciantesF.length > 0) {
        const iniM = iniciantesM.pop()!;
        const iniF = iniciantesF.pop()!;
        duplaDTOs.push(this.montarDuplaDTO(etapaId, arenaId, iniM, iniF));
      }

      // 4. Restantes - parear níveis adjacentes (M com F)
      const restantesM = [...avancadosM, ...intermediariosM, ...iniciantesM];
      const restantesF = [...avancadosF, ...intermediariosF, ...iniciantesF];

      // Parear avançado com intermediário, intermediário com iniciante, etc.
      while (restantesM.length > 0 && restantesF.length > 0) {
        const m = restantesM.pop()!;
        const f = restantesF.pop()!;
        duplaDTOs.push(this.montarDuplaDTO(etapaId, arenaId, m, f));
      }
    }

    logger.info("Duplas mistas formadas", {
      etapaId,
      total: duplaDTOs.length,
      tipoFormacao,
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
   * Formar duplas mistas protegendo cabeças de chave
   * Cada cabeça é pareada com um jogador normal do gênero oposto
   */
  private async formarDuplasMistoProtegendoCabecas(
    etapaId: string,
    arenaId: string,
    cabecas: Inscricao[],
    normais: Inscricao[]
  ): Promise<Dupla[]> {
    const totalJogadores = cabecas.length + normais.length;

    if (totalJogadores % 2 !== 0) {
      throw new Error("Número ímpar de jogadores");
    }

    // Separar cabeças por gênero
    const cabecasM = embaralhar(
      cabecas.filter((c) => c.jogadorGenero === GeneroJogador.MASCULINO)
    );
    const cabecasF = embaralhar(
      cabecas.filter((c) => c.jogadorGenero === GeneroJogador.FEMININO)
    );

    // Separar normais por gênero
    const normaisM = embaralhar(
      normais.filter((n) => n.jogadorGenero === GeneroJogador.MASCULINO)
    );
    const normaisF = embaralhar(
      normais.filter((n) => n.jogadorGenero === GeneroJogador.FEMININO)
    );

    // Validar: cada cabeça masculina precisa de uma normal feminina e vice-versa
    if (cabecasM.length > normaisF.length) {
      throw new Error(
        `Impossível proteger cabeças: ${cabecasM.length} cabeças masculinas mas apenas ${normaisF.length} jogadoras normais femininas.`
      );
    }
    if (cabecasF.length > normaisM.length) {
      throw new Error(
        `Impossível proteger cabeças: ${cabecasF.length} cabeças femininas mas apenas ${normaisM.length} jogadores normais masculinos.`
      );
    }

    const duplaDTOs: Array<Partial<Dupla>> = [];

    // Parear cabeças masculinas com normais femininas
    for (let i = 0; i < cabecasM.length; i++) {
      duplaDTOs.push(
        this.montarDuplaDTO(etapaId, arenaId, cabecasM[i], normaisF[i])
      );
    }

    // Parear cabeças femininas com normais masculinos
    for (let i = 0; i < cabecasF.length; i++) {
      duplaDTOs.push(
        this.montarDuplaDTO(etapaId, arenaId, normaisM[i], cabecasF[i])
      );
    }

    // Parear normais restantes entre si (M com F)
    const normaisMRestantes = normaisM.slice(cabecasF.length);
    const normaisFRestantes = normaisF.slice(cabecasM.length);

    for (let i = 0; i < normaisMRestantes.length && i < normaisFRestantes.length; i++) {
      duplaDTOs.push(
        this.montarDuplaDTO(etapaId, arenaId, normaisMRestantes[i], normaisFRestantes[i])
      );
    }

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
   * Formar duplas manualmente a partir de pares definidos pelo organizador
   */
  async formarDuplasManualmente(
    etapaId: string,
    etapaNome: string,
    arenaId: string,
    inscricoes: Inscricao[],
    formacoes: { jogador1Id: string; jogador2Id: string }[],
    generoEtapa?: GeneroJogador
  ): Promise<Dupla[]> {
    try {
      // Criar mapa de inscrições para lookup rápido
      const inscricoesMap = new Map<string, Inscricao>();
      inscricoes.forEach((i) => inscricoesMap.set(i.jogadorId, i));

      // Validações
      if (formacoes.length !== Math.floor(inscricoes.length / 2)) {
        throw new Error(
          `Número de duplas (${formacoes.length}) não corresponde ao esperado (${Math.floor(inscricoes.length / 2)})`
        );
      }

      // Verificar jogadores duplicados
      const jogadoresUsados = new Set<string>();
      for (const formacao of formacoes) {
        if (jogadoresUsados.has(formacao.jogador1Id) || jogadoresUsados.has(formacao.jogador2Id)) {
          throw new Error("Um jogador aparece em mais de uma dupla");
        }
        jogadoresUsados.add(formacao.jogador1Id);
        jogadoresUsados.add(formacao.jogador2Id);

        if (!inscricoesMap.has(formacao.jogador1Id) || !inscricoesMap.has(formacao.jogador2Id)) {
          throw new Error("Jogador não encontrado nas inscrições");
        }
      }

      const isMisto = generoEtapa === GeneroJogador.MISTO;

      // Validar gênero para etapas mistas
      if (isMisto) {
        for (const formacao of formacoes) {
          const j1 = inscricoesMap.get(formacao.jogador1Id)!;
          const j2 = inscricoesMap.get(formacao.jogador2Id)!;
          if (j1.jogadorGenero === j2.jogadorGenero) {
            throw new Error(
              `Dupla ${j1.jogadorNome} e ${j2.jogadorNome}: etapa mista requer 1 masculino + 1 feminino por dupla`
            );
          }
        }
      }

      // Montar DTOs
      const duplaDTOs: Array<Partial<Dupla>> = formacoes.map((formacao) => {
        const j1 = inscricoesMap.get(formacao.jogador1Id)!;
        const j2 = inscricoesMap.get(formacao.jogador2Id)!;
        return this.montarDuplaDTO(etapaId, arenaId, j1, j2);
      });

      // Criar duplas no banco
      const duplas = await this.repository.criarEmLote(duplaDTOs);

      // Registrar histórico de duplas
      const cabecasIds = await cabecaDeChaveService.obterIdsCabecas(arenaId, etapaId);
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

      logger.info("Duplas formadas manualmente", {
        etapaId,
        total: duplas.length,
      });

      return duplas;
    } catch (error) {
      logger.error(
        "Erro ao formar duplas manualmente",
        { etapaId, arenaId },
        error as Error
      );
      throw error;
    }
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
