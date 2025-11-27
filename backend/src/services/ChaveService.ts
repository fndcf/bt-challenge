/**
 * ChaveService.ts
 * Service para geração de chaves (duplas e grupos)
 */

import { db } from "../config/firebase";
import { Timestamp } from "firebase-admin/firestore";
import { StatusEtapa } from "../models/Etapa";
import { Inscricao } from "../models/Inscricao";
import { Dupla } from "../models/Dupla";
import { Grupo } from "../models/Grupo";
import { Partida, StatusPartida } from "../models/Partida";
import { FaseEtapa } from "../models/Etapa";
import etapaService from "./EtapaService";
import {
  TipoFase,
  StatusConfrontoEliminatorio,
  ConfrontoEliminatorio,
} from "../models/Eliminatoria";
import estatisticasJogadorService from "./EstatisticasJogadorService";
import cabecaDeChaveService from "./CabecaDeChaveService";
import historicoDuplaService from "./HistoricoDuplaService";
import { EstatisticasCombinacoes } from "../models/HistoricoDupla";
import logger from "../utils/logger";

/**
 * Service para geração de chaves (duplas e grupos)
 */
export class ChaveService {
  static buscarConfrontosEliminatorios(_id: any, _arenaId: any, _arg2: any) {
    throw new Error("Method not implemented.");
  }
  private collectionDuplas = "duplas";
  private collectionGrupos = "grupos";
  private collectionPartidas = "partidas";

  private mapTipoFaseToFaseEtapa(tipoFase: TipoFase): FaseEtapa {
    const mapping: Record<TipoFase, FaseEtapa> = {
      [TipoFase.OITAVAS]: FaseEtapa.OITAVAS,
      [TipoFase.QUARTAS]: FaseEtapa.QUARTAS,
      [TipoFase.SEMIFINAL]: FaseEtapa.SEMIFINAL,
      [TipoFase.FINAL]: FaseEtapa.FINAL,
    };
    return mapping[tipoFase];
  }

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

      let duplas: Dupla[];

      if (stats.todasCombinacoesFeitas && cabecas.length >= 2) {
        duplas = await this.formarDuplasLivre(
          etapaId,
          etapaNome,
          arenaId,
          inscricoes
        );
      } else {
        duplas = await this.formarDuplasProtegendoCabecas(
          etapaId,
          etapaNome,
          arenaId,
          cabecas,
          normais,
          stats
        );
      }

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

      return duplas;
    } catch (error) {
      logger.error(
        "Erro ao formar duplas com cabeças",
        {
          etapaId,
          arenaId,
        },
        error as Error
      );
      throw error;
    }
  }

  /**
   * Formar duplas protegendo cabeças de chave
   */
  private async formarDuplasProtegendoCabecas(
    etapaId: string,
    _etapaNome: string,
    arenaId: string,
    cabecas: Inscricao[],
    normais: Inscricao[],
    _stats: EstatisticasCombinacoes
  ): Promise<Dupla[]> {
    try {
      const duplas: Dupla[] = [];

      const totalJogadores = cabecas.length + normais.length;

      if (totalJogadores % 2 !== 0) {
        throw new Error("Número ímpar de jogadores");
      }

      if (cabecas.length > normais.length) {
        throw new Error(
          `Impossível formar duplas: ${cabecas.length} cabeças mas apenas ${normais.length} jogadores normais. ` +
            `Precisa de pelo menos ${cabecas.length} jogadores normais.`
        );
      }

      const cabecasEmbaralhadas = this.embaralhar([...cabecas]);
      const normaisEmbaralhados = this.embaralhar([...normais]);

      for (let i = 0; i < cabecasEmbaralhadas.length; i++) {
        const cabeca = cabecasEmbaralhadas[i];
        const normal = normaisEmbaralhados[i];

        const dupla = await this.criarDupla(
          etapaId,
          arenaId,
          cabeca,
          normal,
          i + 1
        );

        duplas.push(dupla);
      }

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
            jogador2,
            duplas.length + 1
          );

          duplas.push(dupla);
        }
      }

      return duplas;
    } catch (error) {
      logger.error(
        "Erro ao formar duplas protegendo cabeças",
        {
          etapaId,
          arenaId,
        },
        error as Error
      );
      throw error;
    }
  }

  /**
   * Formar duplas livre
   */
  private async formarDuplasLivre(
    etapaId: string,
    _etapaNome: string,
    arenaId: string,
    inscricoes: Inscricao[]
  ): Promise<Dupla[]> {
    try {
      const duplas: Dupla[] = [];

      if (inscricoes.length % 2 !== 0) {
        throw new Error("Número ímpar de jogadores");
      }

      const embaralhado = this.embaralhar([...inscricoes]);

      for (let i = 0; i < embaralhado.length; i += 2) {
        const jogador1 = embaralhado[i];
        const jogador2 = embaralhado[i + 1];

        const dupla = await this.criarDupla(
          etapaId,
          arenaId,
          jogador1,
          jogador2,
          duplas.length + 1
        );

        duplas.push(dupla);
      }

      return duplas;
    } catch (error) {
      logger.error(
        "Erro ao formar duplas livre",
        {
          etapaId,
          arenaId,
        },
        error as Error
      );
      throw error;
    }
  }

  /**
   * Criar dupla
   */
  private async criarDupla(
    etapaId: string,
    arenaId: string,
    jogador1: Inscricao,
    jogador2: Inscricao,
    _ordem: number
  ): Promise<Dupla> {
    const dupla: Dupla = {
      id: "",
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
      grupoId: "",
      grupoNome: "",
      jogos: 0,
      vitorias: 0,
      derrotas: 0,
      pontos: 0,
      setsVencidos: 0,
      setsPerdidos: 0,
      gamesVencidos: 0,
      gamesPerdidos: 0,
      saldoSets: 0,
      saldoGames: 0,
      posicaoGrupo: undefined,
      classificada: false,
      criadoEm: Timestamp.now(),
      atualizadoEm: Timestamp.now(),
    };

    const { id, ...duplaSemId } = dupla;
    const docRef = await db.collection(this.collectionDuplas).add(duplaSemId);

    return { ...duplaSemId, id: docRef.id };
  }

  /**
   * Gerar chaves (duplas + grupos + partidas)
   */
  async gerarChaves(
    etapaId: string,
    arenaId: string
  ): Promise<{
    duplas: Dupla[];
    grupos: Grupo[];
    partidas: Partida[];
  }> {
    try {
      const etapa = await etapaService.buscarPorId(etapaId, arenaId);
      if (!etapa) {
        throw new Error("Etapa não encontrada");
      }

      if (etapa.status !== StatusEtapa.INSCRICOES_ENCERRADAS) {
        throw new Error("Inscrições devem estar encerradas para gerar chaves");
      }

      if (etapa.chavesGeradas) {
        throw new Error("Chaves já foram geradas para esta etapa");
      }

      if (etapa.totalInscritos < 4) {
        throw new Error("Necessário no mínimo 4 jogadores inscritos");
      }

      if (etapa.totalInscritos % 2 !== 0) {
        throw new Error("Número de jogadores deve ser par");
      }

      if (etapa.totalInscritos !== etapa.maxJogadores) {
        throw new Error(
          `Esta etapa está configurada para ${etapa.maxJogadores} jogadores, mas possui apenas ${etapa.totalInscritos} inscrito(s). ` +
            `Para gerar chaves com menos jogadores, primeiro edite a etapa e ajuste o número máximo de jogadores para ${etapa.totalInscritos}.`
        );
      }

      const inscricoes = await etapaService.listarInscricoes(etapaId, arenaId);

      const duplas = await this.formarDuplasComCabecasDeChave(
        etapaId,
        etapa.nome,
        arenaId,
        inscricoes
      );

      for (const dupla of duplas) {
        await estatisticasJogadorService.criar({
          etapaId,
          arenaId,
          jogadorId: dupla.jogador1Id,
          jogadorNome: dupla.jogador1Nome,
          jogadorNivel: dupla.jogador1Nivel,
          jogadorGenero: dupla.jogador1Genero,
          grupoId: dupla.grupoId,
          grupoNome: dupla.grupoNome,
        });

        await estatisticasJogadorService.criar({
          etapaId,
          arenaId,
          jogadorId: dupla.jogador2Id,
          jogadorNome: dupla.jogador2Nome,
          jogadorNivel: dupla.jogador2Nivel,
          jogadorGenero: dupla.jogador2Genero,
          grupoId: dupla.grupoId,
          grupoNome: dupla.grupoNome,
        });
      }

      const grupos = await this.criarGrupos(
        etapaId,
        arenaId,
        duplas,
        etapa.jogadoresPorGrupo
      );

      const partidas = await this.gerarPartidas(etapaId, arenaId, grupos);

      await db.collection("etapas").doc(etapaId).update({
        chavesGeradas: true,
        dataGeracaoChaves: Timestamp.now(),
        status: StatusEtapa.CHAVES_GERADAS,
        atualizadoEm: Timestamp.now(),
      });

      logger.info("Chaves geradas", {
        etapaId,
        nome: etapa.nome,
        arenaId,
        totalDuplas: duplas.length,
        totalGrupos: grupos.length,
        totalPartidas: partidas.length,
      });

      return {
        duplas,
        grupos,
        partidas,
      };
    } catch (error: any) {
      logger.error(
        "Erro ao gerar chaves",
        {
          etapaId,
          arenaId,
        },
        error
      );
      throw error;
    }
  }

  /**
   * Calcular distribuição ideal de grupos
   * REGRA:
   * - PRIORIDADE 1: Grupos de 3 duplas (sempre que possível)
   * - PRIORIDADE 2: Grupos de 4 duplas (quando necessário)
   * - EXCEÇÃO: 5 duplas = 1 grupo de 5
   *
   * Exemplos:
   * - 3 duplas: [3]
   * - 4 duplas: [4]
   * - 5 duplas: [5] ← EXCEÇÃO
   * - 6 duplas: [3, 3]
   * - 7 duplas: [3, 4]
   * - 8 duplas: [4, 4]
   * - 9 duplas: [3, 3, 3]
   * - 10 duplas: [3, 3, 4]
   * - 11 duplas: [3, 4, 4]
   */
  private calcularDistribuicaoGrupos(totalDuplas: number): number[] {
    if (totalDuplas === 5) {
      return [5];
    }

    const resto = totalDuplas % 3;

    if (resto === 0) {
      const numGrupos = totalDuplas / 3;
      return Array(numGrupos).fill(3);
    }

    if (resto === 1) {
      const numGruposDe3 = Math.floor(totalDuplas / 3) - 1;
      if (numGruposDe3 <= 0) {
        return [4];
      }
      return [...Array(numGruposDe3).fill(3), 4];
    }

    if (resto === 2) {
      const numGruposDe3 = Math.floor(totalDuplas / 3);

      if (numGruposDe3 >= 2) {
        const gruposDe3Restantes = numGruposDe3 - 2;
        return [...Array(gruposDe3Restantes).fill(3), 4, 4];
      } else {
        return [4, 4];
      }
    }

    return [totalDuplas];
  }

  /**
   * Criar grupos com distribuição equilibrada
   */
  private async criarGrupos(
    etapaId: string,
    arenaId: string,
    duplas: Dupla[],
    _duplasPorGrupo: number
  ): Promise<Grupo[]> {
    try {
      const grupos: Grupo[] = [];
      const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

      const distribuicao = this.calcularDistribuicaoGrupos(duplas.length);

      const cabecasIds = await cabecaDeChaveService.obterIdsCabecas(
        arenaId,
        etapaId
      );

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

      const qtdGrupos = distribuicao.length;
      const gruposDuplas: Dupla[][] = Array.from(
        { length: qtdGrupos },
        () => []
      );
      const limitesGrupos = [...distribuicao];

      let grupoAtual = 0;
      for (const dupla of duplasComCabecas) {
        gruposDuplas[grupoAtual].push(dupla);
        grupoAtual = (grupoAtual + 1) % qtdGrupos;
      }

      let indiceNormal = 0;

      for (let g = 0; g < qtdGrupos; g++) {
        const limiteGrupo = limitesGrupos[g];
        const duplasAtuais = gruposDuplas[g].length;
        const vagas = limiteGrupo - duplasAtuais;

        for (let v = 0; v < vagas; v++) {
          if (indiceNormal < duplasNormais.length) {
            const dupla = duplasNormais[indiceNormal];
            gruposDuplas[g].push(dupla);
            indiceNormal++;
          }
        }
      }

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

      for (let grupoIndex = 0; grupoIndex < qtdGrupos; grupoIndex++) {
        const nomeGrupo = `Grupo ${letras[grupoIndex]}`;
        const duplasDoGrupo = gruposDuplas[grupoIndex];

        const grupo: Grupo = {
          id: "",
          etapaId,
          arenaId,
          nome: nomeGrupo,
          ordem: grupoIndex + 1,
          duplas: duplasDoGrupo.map((d) => d.id),
          totalDuplas: duplasDoGrupo.length,
          partidas: [],
          totalPartidas: 0,
          partidasFinalizadas: 0,
          completo: false,
          classificadas: [],
          criadoEm: Timestamp.now(),
          atualizadoEm: Timestamp.now(),
        };

        const { id, ...grupoSemId } = grupo;
        const docRef = await db
          .collection(this.collectionGrupos)
          .add(grupoSemId);
        const grupoComId = { ...grupoSemId, id: docRef.id };
        grupos.push(grupoComId);

        for (const dupla of duplasDoGrupo) {
          await db.collection(this.collectionDuplas).doc(dupla.id).update({
            grupoId: docRef.id,
            grupoNome: nomeGrupo,
            atualizadoEm: Timestamp.now(),
          });
        }
      }

      return grupos;
    } catch (error) {
      logger.error(
        "Erro ao criar grupos",
        {
          etapaId,
          arenaId,
        },
        error as Error
      );
      throw new Error("Falha ao criar grupos");
    }
  }

  /**
   * Gerar partidas
   */
  private async gerarPartidas(
    etapaId: string,
    arenaId: string,
    grupos: Grupo[]
  ): Promise<Partida[]> {
    try {
      const todasPartidas: Partida[] = [];

      for (const grupo of grupos) {
        const duplasSnapshot = await db
          .collection(this.collectionDuplas)
          .where("grupoId", "==", grupo.id)
          .get();

        const duplas = duplasSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Dupla[];

        const partidas: Partida[] = [];
        for (let i = 0; i < duplas.length; i++) {
          for (let j = i + 1; j < duplas.length; j++) {
            const dupla1 = duplas[i];
            const dupla2 = duplas[j];

            const partida: Partida = {
              id: "",
              etapaId,
              arenaId,
              fase: FaseEtapa.GRUPOS,
              grupoId: grupo.id,
              grupoNome: grupo.nome,
              dupla1Id: dupla1.id,
              dupla1Nome: `${dupla1.jogador1Nome} & ${dupla1.jogador2Nome}`,
              dupla2Id: dupla2.id,
              dupla2Nome: `${dupla2.jogador1Nome} & ${dupla2.jogador2Nome}`,
              dataHora: undefined,
              quadra: undefined,
              status: StatusPartida.AGENDADA,
              setsDupla1: 0,
              setsDupla2: 0,
              placar: [],
              vencedoraId: undefined,
              vencedoraNome: undefined,
              criadoEm: Timestamp.now(),
              atualizadoEm: Timestamp.now(),
              finalizadoEm: undefined,
            };

            const { id, ...partidaSemId } = partida;
            const docRef = await db
              .collection(this.collectionPartidas)
              .add(partidaSemId);
            const partidaComId = { ...partidaSemId, id: docRef.id };
            partidas.push(partidaComId);
            todasPartidas.push(partidaComId);
          }
        }

        await db
          .collection(this.collectionGrupos)
          .doc(grupo.id)
          .update({
            partidas: partidas.map((p) => p.id),
            totalPartidas: partidas.length,
            atualizadoEm: Timestamp.now(),
          });
      }

      return todasPartidas;
    } catch (error) {
      logger.error(
        "Erro ao gerar partidas",
        {
          etapaId,
          arenaId,
        },
        error as Error
      );
      throw new Error("Falha ao gerar partidas");
    }
  }

  private embaralhar<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  async buscarDuplas(etapaId: string, arenaId: string): Promise<any[]> {
    const snapshot = await db
      .collection(this.collectionDuplas)
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .orderBy("grupoNome", "asc")
      .get();

    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
  }

  async buscarGrupos(etapaId: string, arenaId: string): Promise<any[]> {
    const snapshot = await db
      .collection(this.collectionGrupos)
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .orderBy("ordem", "asc")
      .get();

    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
  }

  async buscarPartidas(etapaId: string, arenaId: string): Promise<any[]> {
    const snapshot = await db
      .collection(this.collectionPartidas)
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .orderBy("criadoEm", "asc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  /**
   * Excluir todas as chaves
   */
  async excluirChaves(etapaId: string, arenaId: string): Promise<void> {
    try {
      const etapa = await etapaService.buscarPorId(etapaId, arenaId);
      if (!etapa) {
        throw new Error("Etapa não encontrada");
      }

      if (!etapa.chavesGeradas) {
        throw new Error("Esta etapa não possui chaves geradas");
      }

      const duplasSnapshot = await db
        .collection(this.collectionDuplas)
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
        .get();

      const duplasBatch = db.batch();
      duplasSnapshot.docs.forEach((doc) => {
        duplasBatch.delete(doc.ref);
      });
      await duplasBatch.commit();

      const gruposSnapshot = await db
        .collection(this.collectionGrupos)
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
        .get();

      const gruposBatch = db.batch();
      gruposSnapshot.docs.forEach((doc) => {
        gruposBatch.delete(doc.ref);
      });
      await gruposBatch.commit();

      const partidasSnapshot = await db
        .collection(this.collectionPartidas)
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
        .where("fase", "==", FaseEtapa.GRUPOS)
        .get();

      const partidasBatch = db.batch();
      partidasSnapshot.docs.forEach((doc) => {
        partidasBatch.delete(doc.ref);
      });
      await partidasBatch.commit();

      const partidasReiDaPraiaSnapshot = await db
        .collection("partidas_rei_da_praia")
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
        .get();

      if (!partidasReiDaPraiaSnapshot.empty) {
        const partidasReiDaPraiaBatch = db.batch();
        partidasReiDaPraiaSnapshot.docs.forEach((doc) => {
          partidasReiDaPraiaBatch.delete(doc.ref);
        });
        await partidasReiDaPraiaBatch.commit();
      }

      const confrontosSnapshot = await db
        .collection("confrontos_eliminatorios")
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
        .get();

      if (!confrontosSnapshot.empty) {
        const confrontosBatch = db.batch();
        confrontosSnapshot.docs.forEach((doc) => {
          confrontosBatch.delete(doc.ref);
        });
        await confrontosBatch.commit();
      }

      const partidasEliminatoriaSnapshot = await db
        .collection(this.collectionPartidas)
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
        .where("tipo", "==", "eliminatoria")
        .get();

      if (!partidasEliminatoriaSnapshot.empty) {
        const partidasEliminatoriaBatch = db.batch();
        partidasEliminatoriaSnapshot.docs.forEach((doc) => {
          partidasEliminatoriaBatch.delete(doc.ref);
        });
        await partidasEliminatoriaBatch.commit();
      }

      const estatisticasSnapshot = await db
        .collection("estatisticas_jogador")
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
        .get();

      if (!estatisticasSnapshot.empty) {
        const estatisticasBatch = db.batch();
        estatisticasSnapshot.docs.forEach((doc) => {
          estatisticasBatch.delete(doc.ref);
        });
        await estatisticasBatch.commit();
      }

      await historicoDuplaService.limparDaEtapa(arenaId, etapaId);

      await db.collection("etapas").doc(etapaId).update({
        chavesGeradas: false,
        dataGeracaoChaves: null,
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
        atualizadoEm: Timestamp.now(),
      });

      logger.info("Chaves excluídas", {
        etapaId,
        arenaId,
        duplasRemovidas: duplasSnapshot.size,
        gruposRemovidos: gruposSnapshot.size,
        partidasRemovidas: partidasSnapshot.size,
        confrontosRemovidos: confrontosSnapshot.size,
        estatisticasRemovidas: estatisticasSnapshot.size,
      });
    } catch (error: any) {
      logger.error(
        "Erro ao excluir chaves",
        {
          etapaId,
          arenaId,
        },
        error
      );
      throw error;
    }
  }

  /**
   * Registrar resultado de partida
   */
  async registrarResultadoPartida(
    partidaId: string,
    arenaId: string,
    placar: Array<{
      numero: number;
      gamesDupla1: number;
      gamesDupla2: number;
    }>
  ): Promise<void> {
    try {
      const partidaDoc = await db.collection("partidas").doc(partidaId).get();

      if (!partidaDoc.exists) {
        throw new Error("Partida não encontrada");
      }

      const partida = {
        id: partidaDoc.id,
        ...partidaDoc.data(),
      } as Partida;

      if (partida.arenaId !== arenaId) {
        throw new Error("Partida não pertence a esta arena");
      }

      const dupla1Doc = await db
        .collection("duplas")
        .doc(partida.dupla1Id)
        .get();
      const dupla2Doc = await db
        .collection("duplas")
        .doc(partida.dupla2Id)
        .get();

      if (!dupla1Doc.exists || !dupla2Doc.exists) {
        throw new Error("Duplas não encontradas");
      }

      const dupla1 = { id: dupla1Doc.id, ...dupla1Doc.data() } as Dupla;
      const dupla2 = { id: dupla2Doc.id, ...dupla2Doc.data() } as Dupla;

      const isEdicao = partida.status === StatusPartida.FINALIZADA;

      if (isEdicao && partida.placar && partida.placar.length > 0) {
        const placarAntigo = partida.placar;
        let setsAntigo1 = 0;
        let setsAntigo2 = 0;
        let gamesAntigo1 = 0;
        let gamesPerdidosAntigo1 = 0;
        let gamesAntigo2 = 0;
        let gamesPerdidosAntigo2 = 0;

        placarAntigo.forEach((set: any) => {
          if (set.gamesDupla1 > set.gamesDupla2) setsAntigo1++;
          else setsAntigo2++;
          gamesAntigo1 += set.gamesDupla1;
          gamesPerdidosAntigo1 += set.gamesDupla2;
          gamesAntigo2 += set.gamesDupla2;
          gamesPerdidosAntigo2 += set.gamesDupla1;
        });

        const dupla1VenceuAntigo = setsAntigo1 > setsAntigo2;

        await estatisticasJogadorService.reverterAposPartida(
          dupla1.jogador1Id,
          partida.etapaId,
          {
            venceu: dupla1VenceuAntigo,
            setsVencidos: setsAntigo1,
            setsPerdidos: setsAntigo2,
            gamesVencidos: gamesAntigo1,
            gamesPerdidos: gamesPerdidosAntigo1,
          }
        );

        await estatisticasJogadorService.reverterAposPartida(
          dupla1.jogador2Id,
          partida.etapaId,
          {
            venceu: dupla1VenceuAntigo,
            setsVencidos: setsAntigo1,
            setsPerdidos: setsAntigo2,
            gamesVencidos: gamesAntigo1,
            gamesPerdidos: gamesPerdidosAntigo1,
          }
        );

        await estatisticasJogadorService.reverterAposPartida(
          dupla2.jogador1Id,
          partida.etapaId,
          {
            venceu: !dupla1VenceuAntigo,
            setsVencidos: setsAntigo2,
            setsPerdidos: setsAntigo1,
            gamesVencidos: gamesAntigo2,
            gamesPerdidos: gamesPerdidosAntigo2,
          }
        );

        await estatisticasJogadorService.reverterAposPartida(
          dupla2.jogador2Id,
          partida.etapaId,
          {
            venceu: !dupla1VenceuAntigo,
            setsVencidos: setsAntigo2,
            setsPerdidos: setsAntigo1,
            gamesVencidos: gamesAntigo2,
            gamesPerdidos: gamesPerdidosAntigo2,
          }
        );
      }

      let setsDupla1 = 0;
      let setsDupla2 = 0;
      let gamesVencidosDupla1 = 0;
      let gamesPerdidosDupla1 = 0;
      let gamesVencidosDupla2 = 0;
      let gamesPerdidosDupla2 = 0;

      const placarComVencedor = placar.map((set) => {
        if (set.gamesDupla1 > set.gamesDupla2) {
          setsDupla1++;
        } else {
          setsDupla2++;
        }

        gamesVencidosDupla1 += set.gamesDupla1;
        gamesPerdidosDupla1 += set.gamesDupla2;
        gamesVencidosDupla2 += set.gamesDupla2;
        gamesPerdidosDupla2 += set.gamesDupla1;

        return {
          ...set,
          vencedorId:
            set.gamesDupla1 > set.gamesDupla2
              ? partida.dupla1Id
              : partida.dupla2Id,
        };
      });

      const dupla1Venceu = setsDupla1 > setsDupla2;
      const vencedoraId = dupla1Venceu ? partida.dupla1Id : partida.dupla2Id;
      const vencedoraNome = dupla1Venceu
        ? `${dupla1.jogador1Nome} & ${dupla1.jogador2Nome}`
        : `${dupla2.jogador1Nome} & ${dupla2.jogador2Nome}`;

      await db
        .collection("partidas")
        .doc(partidaId)
        .update({
          status: StatusPartida.FINALIZADA,
          setsDupla1,
          setsDupla2,
          placar: placarComVencedor,
          vencedoraId,
          vencedoraNome,
          finalizadoEm: isEdicao ? partida.finalizadoEm : Timestamp.now(),
          atualizadoEm: Timestamp.now(),
        });

      await db
        .collection("duplas")
        .doc(partida.dupla1Id)
        .update({
          jogos: dupla1.jogos + 1,
          vitorias: dupla1.vitorias + (dupla1Venceu ? 1 : 0),
          derrotas: dupla1.derrotas + (dupla1Venceu ? 0 : 1),
          pontos: dupla1.pontos + (dupla1Venceu ? 3 : 0),
          setsVencidos: dupla1.setsVencidos + setsDupla1,
          setsPerdidos: dupla1.setsPerdidos + setsDupla2,
          gamesVencidos: dupla1.gamesVencidos + gamesVencidosDupla1,
          gamesPerdidos: dupla1.gamesPerdidos + gamesPerdidosDupla1,
          saldoSets: dupla1.saldoSets + (setsDupla1 - setsDupla2),
          saldoGames:
            dupla1.saldoGames + (gamesVencidosDupla1 - gamesPerdidosDupla1),
          atualizadoEm: Timestamp.now(),
        });

      await db
        .collection("duplas")
        .doc(partida.dupla2Id)
        .update({
          jogos: dupla2.jogos + 1,
          vitorias: dupla2.vitorias + (dupla1Venceu ? 0 : 1),
          derrotas: dupla2.derrotas + (dupla1Venceu ? 1 : 0),
          pontos: dupla2.pontos + (dupla1Venceu ? 0 : 3),
          setsVencidos: dupla2.setsVencidos + setsDupla2,
          setsPerdidos: dupla2.setsPerdidos + setsDupla1,
          gamesVencidos: dupla2.gamesVencidos + gamesVencidosDupla2,
          gamesPerdidos: dupla2.gamesPerdidos + gamesPerdidosDupla2,
          saldoSets: dupla2.saldoSets + (setsDupla2 - setsDupla1),
          saldoGames:
            dupla2.saldoGames + (gamesVencidosDupla2 - gamesPerdidosDupla2),
          atualizadoEm: Timestamp.now(),
        });

      await estatisticasJogadorService.atualizarAposPartida(
        dupla1.jogador1Id,
        partida.etapaId,
        {
          venceu: dupla1Venceu,
          setsVencidos: setsDupla1,
          setsPerdidos: setsDupla2,
          gamesVencidos: gamesVencidosDupla1,
          gamesPerdidos: gamesPerdidosDupla1,
        }
      );

      await estatisticasJogadorService.atualizarAposPartida(
        dupla1.jogador2Id,
        partida.etapaId,
        {
          venceu: dupla1Venceu,
          setsVencidos: setsDupla1,
          setsPerdidos: setsDupla2,
          gamesVencidos: gamesVencidosDupla1,
          gamesPerdidos: gamesPerdidosDupla1,
        }
      );

      await estatisticasJogadorService.atualizarAposPartida(
        dupla2.jogador1Id,
        partida.etapaId,
        {
          venceu: !dupla1Venceu,
          setsVencidos: setsDupla2,
          setsPerdidos: setsDupla1,
          gamesVencidos: gamesVencidosDupla2,
          gamesPerdidos: gamesPerdidosDupla2,
        }
      );

      await estatisticasJogadorService.atualizarAposPartida(
        dupla2.jogador2Id,
        partida.etapaId,
        {
          venceu: !dupla1Venceu,
          setsVencidos: setsDupla2,
          setsPerdidos: setsDupla1,
          gamesVencidos: gamesVencidosDupla2,
          gamesPerdidos: gamesPerdidosDupla2,
        }
      );

      if (partida.grupoId) {
        await this.recalcularClassificacaoGrupo(partida.grupoId);
      }

      logger.info("Resultado partida registrado", {
        partidaId,
        etapaId: partida.etapaId,
        grupoNome: partida.grupoNome,
        vencedoraNome,
        placar: `${setsDupla1}-${setsDupla2}`,
        isEdicao,
      });
    } catch (error: any) {
      logger.error(
        "Erro ao registrar resultado",
        {
          partidaId,
          arenaId,
        },
        error
      );
      throw error;
    }
  }

  private async reverterEstatisticasDuplas(
    dupla1Id: string,
    dupla2Id: string,
    vencedoraIdAntiga: string,
    setsDupla1Antigo: number,
    setsDupla2Antigo: number,
    gamesVencidosDupla1Antigo: number,
    gamesPerdidosDupla1Antigo: number,
    gamesVencidosDupla2Antigo: number,
    gamesPerdidosDupla2Antigo: number
  ): Promise<void> {
    const dupla1Doc = await db
      .collection(this.collectionDuplas)
      .doc(dupla1Id)
      .get();
    const dupla1 = dupla1Doc.data() as Dupla;

    const venceuDupla1 = vencedoraIdAntiga === dupla1Id;

    await db
      .collection(this.collectionDuplas)
      .doc(dupla1Id)
      .update({
        jogos: dupla1.jogos - 1,
        vitorias: dupla1.vitorias - (venceuDupla1 ? 1 : 0),
        derrotas: dupla1.derrotas - (venceuDupla1 ? 0 : 1),
        pontos: dupla1.pontos - (venceuDupla1 ? 3 : 0),
        setsVencidos: dupla1.setsVencidos - setsDupla1Antigo,
        setsPerdidos: dupla1.setsPerdidos - setsDupla2Antigo,
        gamesVencidos: dupla1.gamesVencidos - gamesVencidosDupla1Antigo,
        gamesPerdidos: dupla1.gamesPerdidos - gamesPerdidosDupla1Antigo,
        saldoSets: dupla1.saldoSets - (setsDupla1Antigo - setsDupla2Antigo),
        saldoGames:
          dupla1.saldoGames -
          (gamesVencidosDupla1Antigo - gamesPerdidosDupla1Antigo),
        atualizadoEm: Timestamp.now(),
      });

    const dupla2Doc = await db
      .collection(this.collectionDuplas)
      .doc(dupla2Id)
      .get();
    const dupla2 = dupla2Doc.data() as Dupla;

    const venceuDupla2 = vencedoraIdAntiga === dupla2Id;

    await db
      .collection(this.collectionDuplas)
      .doc(dupla2Id)
      .update({
        jogos: dupla2.jogos - 1,
        vitorias: dupla2.vitorias - (venceuDupla2 ? 1 : 0),
        derrotas: dupla2.derrotas - (venceuDupla2 ? 0 : 1),
        pontos: dupla2.pontos - (venceuDupla2 ? 3 : 0),
        setsVencidos: dupla2.setsVencidos - setsDupla2Antigo,
        setsPerdidos: dupla2.setsPerdidos - setsDupla1Antigo,
        gamesVencidos: dupla2.gamesVencidos - gamesVencidosDupla2Antigo,
        gamesPerdidos: dupla2.gamesPerdidos - gamesPerdidosDupla2Antigo,
        saldoSets: dupla2.saldoSets - (setsDupla2Antigo - setsDupla1Antigo),
        saldoGames:
          dupla2.saldoGames -
          (gamesVencidosDupla2Antigo - gamesPerdidosDupla2Antigo),
        atualizadoEm: Timestamp.now(),
      });
  }

  /**
   * Recalcular classificação do grupo
   * CRITÉRIOS:
   * 1. Vitórias
   * 2. Saldo de games
   * 3. Confronto direto (apenas 2 duplas empatadas)
   * 4. Sorteio (3+ duplas empatadas)
   */
  private async recalcularClassificacaoGrupo(grupoId: string): Promise<void> {
    const duplasSnapshot = await db
      .collection("duplas")
      .where("grupoId", "==", grupoId)
      .get();

    const duplas = duplasSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Dupla[];

    const partidasSnapshot = await db
      .collection("partidas")
      .where("grupoId", "==", grupoId)
      .where("status", "==", StatusPartida.FINALIZADA)
      .get();

    const partidas = partidasSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Partida[];

    const duplasOrdenadas = [...duplas].sort((a, b) => {
      if (a.pontos !== b.pontos) {
        return b.pontos - a.pontos;
      }

      if (a.saldoGames !== b.saldoGames) {
        return b.saldoGames - a.saldoGames;
      }

      const duplasEmpatadas = duplas.filter(
        (d) => d.pontos === a.pontos && d.saldoGames === a.saldoGames
      );

      if (duplasEmpatadas.length === 2) {
        const confrontoDireto = this.verificarConfrontoDireto(
          partidas,
          a.id,
          b.id
        );
        if (confrontoDireto.vencedora === a.id) return -1;
        if (confrontoDireto.vencedora === b.id) return 1;
      }

      if (a.saldoSets !== b.saldoSets) {
        return b.saldoSets - a.saldoSets;
      }

      if (a.gamesVencidos !== b.gamesVencidos) {
        return b.gamesVencidos - a.gamesVencidos;
      }

      if (duplasEmpatadas.length >= 3) {
        return Math.random() - 0.5;
      }

      return 0;
    });

    for (let i = 0; i < duplasOrdenadas.length; i++) {
      const dupla = duplasOrdenadas[i];
      await db
        .collection("duplas")
        .doc(dupla.id)
        .update({
          posicaoGrupo: i + 1,
          atualizadoEm: Timestamp.now(),
        });
    }

    for (let i = 0; i < duplasOrdenadas.length; i++) {
      const dupla = duplasOrdenadas[i];
      const posicao = i + 1;

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

    const partidasFinalizadas = partidas.length;
    const totalPartidas = this.calcularTotalPartidas(duplas.length);
    const completo = partidasFinalizadas === totalPartidas;

    await db.collection("grupos").doc(grupoId).update({
      partidasFinalizadas,
      completo,
      atualizadoEm: Timestamp.now(),
    });
  }

  /**
   * Verificar confronto direto entre duas duplas
   */
  private verificarConfrontoDireto(
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

  private calcularTotalPartidas(numeroDuplas: number): number {
    return (numeroDuplas * (numeroDuplas - 1)) / 2;
  }

  /**
   * Gerar fase eliminatória a partir dos classificados dos grupos
   */
  /**
   * Gerar fase eliminatória
   */
  async gerarFaseEliminatoria(
    etapaId: string,
    arenaId: string,
    classificadosPorGrupo: number = 2
  ): Promise<{ confrontos: ConfrontoEliminatorio[] }> {
    try {
      const gruposSnapshot = await db
        .collection(this.collectionGrupos)
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
        .orderBy("ordem", "asc")
        .get();

      if (gruposSnapshot.empty) {
        throw new Error("Nenhum grupo encontrado");
      }

      const grupos = gruposSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Grupo)
      );

      const gruposIncompletos = grupos.filter((g) => !g.completo);

      if (gruposIncompletos.length > 0) {
        const nomesGrupos = gruposIncompletos.map((g) => g.nome).join(", ");
        throw new Error(
          `Não é possível gerar a fase eliminatória. ` +
            `Os seguintes grupos ainda possuem partidas pendentes: ${nomesGrupos}. ` +
            `Por favor, finalize todas as partidas da fase de grupos antes de gerar a eliminatória.`
        );
      }

      if (grupos.length === 1) {
        throw new Error(
          "Não é possível gerar fase eliminatória com apenas 1 grupo. " +
            "Grupo único é um campeonato completo onde todos jogam contra todos. " +
            "O 1º colocado já é o campeão!"
        );
      }

      const gruposOrdenados = grupos.sort((a, b) => a.ordem - b.ordem);

      const classificados: Dupla[] = [];

      for (const grupo of gruposOrdenados) {
        const duplasSnapshot = await db
          .collection(this.collectionDuplas)
          .where("grupoId", "==", grupo.id)
          .orderBy("posicaoGrupo", "asc")
          .limit(classificadosPorGrupo)
          .get();

        const duplasGrupo = duplasSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Dupla[];

        classificados.push(...duplasGrupo);
      }

      if (classificados.length < 2) {
        throw new Error("Mínimo de 2 classificados necessário");
      }

      const classificadosOrdenados = this.ordenarClassificadosAlternado(
        classificados,
        grupos.length,
        classificadosPorGrupo
      );

      const { byes } = this.calcularByes(classificados.length);

      const tipoFase = this.determinarTipoFase(classificados.length);

      const confrontos = await this.gerarConfrontosEliminatorios(
        etapaId,
        arenaId,
        tipoFase,
        classificadosOrdenados,
        byes
      );

      for (const dupla of classificados) {
        await db.collection(this.collectionDuplas).doc(dupla.id).update({
          classificada: true,
          atualizadoEm: Timestamp.now(),
        });
      }

      for (const dupla of classificados) {
        await estatisticasJogadorService.marcarComoClassificado(
          dupla.jogador1Id,
          etapaId,
          true
        );

        await estatisticasJogadorService.marcarComoClassificado(
          dupla.jogador2Id,
          etapaId,
          true
        );
      }

      logger.info("Fase eliminatória gerada", {
        etapaId,
        arenaId,
        totalGrupos: grupos.length,
        classificadosPorGrupo,
        totalClassificados: classificados.length,
        tipoFase,
        byes,
        totalConfrontos: confrontos.length,
      });

      return { confrontos };
    } catch (error: any) {
      logger.error(
        "Erro ao gerar fase eliminatória",
        {
          etapaId,
          arenaId,
          classificadosPorGrupo,
        },
        error
      );
      throw error;
    }
  }

  /**
   * Ordenar classificados com CHAVEAMENTO POR SEEDS (Tradicional de Torneio)
   *
   * REGRA DO CHAVEAMENTO:
   * - Seed 1 (melhor) vs Seed N (pior)
   * - Seed 2 vs Seed N-1
   * - Seed 3 vs Seed N-2
   * - etc.
   *
   * Isso garante:
   * 1. Melhores pegam BYE
   * 2. Melhores enfrentam piores
   * 3. Cruzamento correto entre grupos
   *
   * @param classificados - Lista de duplas classificadas
   * @param _totalGrupos - Número de grupos (não usado, mantido por compatibilidade)
   * @param classificadosPorGrupo - Quantos classificados por grupo
   */
  private ordenarClassificadosAlternado(
    classificados: Dupla[],
    _totalGrupos: number,
    classificadosPorGrupo: number
  ): Dupla[] {
    const porPosicao: Dupla[][] = [];

    for (let posicao = 1; posicao <= classificadosPorGrupo; posicao++) {
      const duplasNaPosicao = classificados.filter(
        (d) => d.posicaoGrupo === posicao
      );

      duplasNaPosicao.sort((a, b) => {
        if (a.vitorias !== b.vitorias) return b.vitorias - a.vitorias;
        if (a.saldoGames !== b.saldoGames) return b.saldoGames - a.saldoGames;
        if (a.gamesVencidos !== b.gamesVencidos)
          return b.gamesVencidos - a.gamesVencidos;
        return Math.random() - 0.5;
      });

      porPosicao.push(duplasNaPosicao);
    }

    const seeds: Dupla[] = [];

    for (let i = 0; i < porPosicao.length; i++) {
      seeds.push(...porPosicao[i]);
    }

    return seeds;
  }

  /**
   * Gerar confrontos com algoritmo clássico de bracket de torneio
   *
   * Para N=8: [1v8, 4v5, 2v7, 3v6]
   * Garante que os melhores seeds não se encontrem até a final
   */
  private async gerarConfrontosEliminatorios(
    etapaId: string,
    arenaId: string,
    tipoFase: TipoFase,
    classificados: Dupla[],
    _byes: number
  ): Promise<ConfrontoEliminatorio[]> {
    const confrontos: ConfrontoEliminatorio[] = [];
    let ordem = 1;

    const totalSeeds = classificados.length;
    const proximaPotencia = Math.pow(2, Math.ceil(Math.log2(totalSeeds)));

    function gerarOrdemBracket(n: number): number[] {
      if (n === 1) return [1];

      const anterior = gerarOrdemBracket(n / 2);
      const resultado: number[] = [];

      for (const seed of anterior) {
        resultado.push(seed);
        resultado.push(n + 1 - seed);
      }

      return resultado;
    }

    const ordemSeeds = gerarOrdemBracket(proximaPotencia);

    const pareamentos: Array<{
      seed1: number;
      seed2: number;
      seed1Existe: boolean;
      seed2Existe: boolean;
    }> = [];

    for (let i = 0; i < ordemSeeds.length; i += 2) {
      const seed1 = ordemSeeds[i];
      const seed2 = ordemSeeds[i + 1];

      pareamentos.push({
        seed1,
        seed2,
        seed1Existe: seed1 <= totalSeeds,
        seed2Existe: seed2 <= totalSeeds,
      });
    }

    const confrontosReais = pareamentos
      .map((p, index) => ({ ...p, index }))
      .filter((p) => p.seed1Existe && p.seed2Existe);

    for (let i = 0; i < confrontosReais.length; i++) {
      const pareamento = confrontosReais[i];
      const dupla1 = classificados[pareamento.seed1 - 1];
      const dupla2 = classificados[pareamento.seed2 - 1];

      if (dupla1.grupoId === dupla2.grupoId) {
        let trocaFeita = false;

        for (let j = i + 1; j < confrontosReais.length; j++) {
          const outro = confrontosReais[j];
          const outraDupla1 = classificados[outro.seed1 - 1];
          const outraDupla2 = classificados[outro.seed2 - 1];

          const novoPar1Ok = dupla1.grupoId !== outraDupla2.grupoId;
          const novoPar2Ok = outraDupla1.grupoId !== dupla2.grupoId;

          if (novoPar1Ok && novoPar2Ok) {
            const temp = pareamento.seed2;
            pareamento.seed2 = outro.seed2;
            outro.seed2 = temp;

            pareamentos[pareamento.index].seed2 = pareamento.seed2;
            pareamentos[outro.index].seed2 = outro.seed2;

            trocaFeita = true;
            break;
          }
        }

        if (!trocaFeita) {
          for (let j = i - 1; j >= 0; j--) {
            const outro = confrontosReais[j];
            const outraDupla1 = classificados[outro.seed1 - 1];
            const outraDupla2 = classificados[outro.seed2 - 1];

            const novoPar1Ok = dupla1.grupoId !== outraDupla2.grupoId;
            const novoPar2Ok = outraDupla1.grupoId !== dupla2.grupoId;

            if (novoPar1Ok && novoPar2Ok) {
              const temp = pareamento.seed2;
              pareamento.seed2 = outro.seed2;
              outro.seed2 = temp;

              pareamentos[pareamento.index].seed2 = pareamento.seed2;
              pareamentos[outro.index].seed2 = outro.seed2;

              trocaFeita = true;
              break;
            }
          }
        }

        if (!trocaFeita) {
          for (let j = 0; j < confrontosReais.length; j++) {
            if (j === i) continue;

            const outro = confrontosReais[j];
            const outraDupla1 = classificados[outro.seed1 - 1];
            const outraDupla2 = classificados[outro.seed2 - 1];

            const novoPar1Ok = outraDupla1.grupoId !== dupla2.grupoId;
            const novoPar2Ok = dupla1.grupoId !== outraDupla2.grupoId;

            if (novoPar1Ok && novoPar2Ok) {
              const temp = pareamento.seed1;
              pareamento.seed1 = outro.seed1;
              outro.seed1 = temp;

              pareamentos[pareamento.index].seed1 = pareamento.seed1;
              pareamentos[outro.index].seed1 = outro.seed1;

              trocaFeita = true;
              break;
            }
          }
        }
      }
    }

    for (const pareamento of pareamentos) {
      if (pareamento.seed1Existe && pareamento.seed2Existe) {
        const dupla1 = classificados[pareamento.seed1 - 1];
        const dupla2 = classificados[pareamento.seed2 - 1];

        const confronto: ConfrontoEliminatorio = {
          id: "",
          etapaId,
          arenaId,
          fase: tipoFase,
          ordem: ordem++,
          dupla1Id: dupla1.id,
          dupla1Nome: `${dupla1.jogador1Nome} & ${dupla1.jogador2Nome}`,
          dupla1Origem: `${dupla1.posicaoGrupo}º ${dupla1.grupoNome}`,
          dupla2Id: dupla2.id,
          dupla2Nome: `${dupla2.jogador1Nome} & ${dupla2.jogador2Nome}`,
          dupla2Origem: `${dupla2.posicaoGrupo}º ${dupla2.grupoNome}`,
          status: StatusConfrontoEliminatorio.AGENDADA,
          criadoEm: Timestamp.now(),
          atualizadoEm: Timestamp.now(),
        };

        const docRef = await db
          .collection("confrontos_eliminatorios")
          .add(confronto);
        confronto.id = docRef.id;
        await docRef.update({ id: docRef.id });

        confrontos.push(confronto);
      } else if (pareamento.seed1Existe) {
        const dupla = classificados[pareamento.seed1 - 1];

        const confronto: ConfrontoEliminatorio = {
          id: "",
          etapaId,
          arenaId,
          fase: tipoFase,
          ordem: ordem++,
          dupla1Id: dupla.id,
          dupla1Nome: `${dupla.jogador1Nome} & ${dupla.jogador2Nome}`,
          dupla1Origem: `${dupla.posicaoGrupo}º ${dupla.grupoNome}`,
          status: StatusConfrontoEliminatorio.BYE,
          vencedoraId: dupla.id,
          vencedoraNome: `${dupla.jogador1Nome} & ${dupla.jogador2Nome}`,
          criadoEm: Timestamp.now(),
          atualizadoEm: Timestamp.now(),
        };

        const docRef = await db
          .collection("confrontos_eliminatorios")
          .add(confronto);
        confronto.id = docRef.id;
        await docRef.update({ id: docRef.id });

        confrontos.push(confronto);
      } else if (pareamento.seed2Existe) {
        const dupla = classificados[pareamento.seed2 - 1];

        const confronto: ConfrontoEliminatorio = {
          id: "",
          etapaId,
          arenaId,
          fase: tipoFase,
          ordem: ordem++,
          dupla1Id: dupla.id,
          dupla1Nome: `${dupla.jogador1Nome} & ${dupla.jogador2Nome}`,
          dupla1Origem: `${dupla.posicaoGrupo}º ${dupla.grupoNome}`,
          status: StatusConfrontoEliminatorio.BYE,
          vencedoraId: dupla.id,
          vencedoraNome: `${dupla.jogador1Nome} & ${dupla.jogador2Nome}`,
          criadoEm: Timestamp.now(),
          atualizadoEm: Timestamp.now(),
        };

        const docRef = await db
          .collection("confrontos_eliminatorios")
          .add(confronto);
        confronto.id = docRef.id;
        await docRef.update({ id: docRef.id });

        confrontos.push(confronto);
      }
    }

    return confrontos;
  }

  /**
   * Calcular quantidade de BYEs necessários
   */
  private calcularByes(totalClassificados: number): {
    byes: number;
    confrontosNecessarios: number;
    proximaPotencia: number;
  } {
    const proximaPotencia = Math.pow(
      2,
      Math.ceil(Math.log2(totalClassificados))
    );

    const precisamJogar = (totalClassificados - proximaPotencia / 2) * 2;

    const byes = totalClassificados - precisamJogar;

    const confrontosNecessarios = precisamJogar / 2;

    return { byes, confrontosNecessarios, proximaPotencia };
  }

  /**
   * Determinar tipo da primeira fase baseado no número de classificados
   */
  private determinarTipoFase(totalClassificados: number): TipoFase {
    if (totalClassificados > 8) return TipoFase.OITAVAS;
    if (totalClassificados > 4) return TipoFase.QUARTAS;
    if (totalClassificados > 2) return TipoFase.SEMIFINAL;
    return TipoFase.FINAL;
  }

  /**
   * Registrar resultado de confronto eliminatório
   */
  async registrarResultadoEliminatorio(
    confrontoId: string,
    arenaId: string,
    placar: { numero: number; gamesDupla1: number; gamesDupla2: number }[]
  ): Promise<void> {
    try {
      const confrontoDoc = await db
        .collection("confrontos_eliminatorios")
        .doc(confrontoId)
        .get();

      if (!confrontoDoc.exists) {
        throw new Error("Confronto não encontrado");
      }

      const confronto = {
        id: confrontoDoc.id,
        ...confrontoDoc.data(),
      } as ConfrontoEliminatorio;

      if (confronto.arenaId !== arenaId) {
        throw new Error("Confronto não pertence a esta arena");
      }

      if (confronto.status === StatusConfrontoEliminatorio.FINALIZADA) {
        if (confronto.partidaId) {
          const partidaDoc = await db
            .collection(this.collectionPartidas)
            .doc(confronto.partidaId)
            .get();
          if (partidaDoc.exists) {
            const partida = partidaDoc.data() as Partida;

            if (partida.placar && partida.placar.length > 0) {
              await this.reverterEstatisticasDuplas(
                confronto.dupla1Id!,
                confronto.dupla2Id!,
                partida.vencedoraId!,
                partida.setsDupla1,
                partida.setsDupla2,
                partida.placar[0].gamesDupla1,
                partida.placar[0].gamesDupla2,
                partida.placar[0].gamesDupla2,
                partida.placar[0].gamesDupla1
              );
            }
          }
        }
      }

      if (placar.length !== 1) {
        throw new Error("Placar inválido: deve ter apenas 1 set");
      }

      const set = placar[0];
      const vencedoraId =
        set.gamesDupla1 > set.gamesDupla2
          ? confronto.dupla1Id!
          : confronto.dupla2Id!;
      const vencedoraNome =
        set.gamesDupla1 > set.gamesDupla2
          ? confronto.dupla1Nome!
          : confronto.dupla2Nome!;

      let partidaId = confronto.partidaId;

      if (!partidaId) {
        const partida: Partial<Partida> = {
          etapaId: confronto.etapaId,
          arenaId: confronto.arenaId,
          tipo: "eliminatoria",
          fase: this.mapTipoFaseToFaseEtapa(confronto.fase),
          dupla1Id: confronto.dupla1Id!,
          dupla1Nome: confronto.dupla1Nome!,
          dupla2Id: confronto.dupla2Id!,
          dupla2Nome: confronto.dupla2Nome!,
          status: StatusPartida.FINALIZADA,
          setsDupla1: set.gamesDupla1 > set.gamesDupla2 ? 1 : 0,
          setsDupla2: set.gamesDupla2 > set.gamesDupla1 ? 1 : 0,
          placar: [
            {
              ...set,
              vencedorId: vencedoraId,
            },
          ],
          vencedoraId,
          vencedoraNome,
          criadoEm: Timestamp.now(),
          atualizadoEm: Timestamp.now(),
          finalizadoEm: Timestamp.now(),
        };

        const partidaRef = await db
          .collection(this.collectionPartidas)
          .add(partida);
        partidaId = partidaRef.id;
      } else {
        await db
          .collection(this.collectionPartidas)
          .doc(partidaId)
          .update({
            setsDupla1: set.gamesDupla1 > set.gamesDupla2 ? 1 : 0,
            setsDupla2: set.gamesDupla2 > set.gamesDupla1 ? 1 : 0,
            placar: [
              {
                ...set,
                vencedorId: vencedoraId,
              },
            ],
            vencedoraId,
            vencedoraNome,
            atualizadoEm: Timestamp.now(),
          });
      }

      const dupla1Doc = await db
        .collection("duplas")
        .doc(confronto.dupla1Id!)
        .get();
      const dupla2Doc = await db
        .collection("duplas")
        .doc(confronto.dupla2Id!)
        .get();

      if (!dupla1Doc.exists || !dupla2Doc.exists) {
        throw new Error("Duplas não encontradas");
      }

      const dupla1 = { id: dupla1Doc.id, ...dupla1Doc.data() } as Dupla;
      const dupla2 = { id: dupla2Doc.id, ...dupla2Doc.data() } as Dupla;

      const dupla1Venceu = vencedoraId === confronto.dupla1Id;

      await estatisticasJogadorService.atualizarAposPartida(
        dupla1.jogador1Id,
        confronto.etapaId,
        {
          venceu: dupla1Venceu,
          setsVencidos: dupla1Venceu ? 1 : 0,
          setsPerdidos: dupla1Venceu ? 0 : 1,
          gamesVencidos: set.gamesDupla1,
          gamesPerdidos: set.gamesDupla2,
        }
      );

      await estatisticasJogadorService.atualizarAposPartida(
        dupla1.jogador2Id,
        confronto.etapaId,
        {
          venceu: dupla1Venceu,
          setsVencidos: dupla1Venceu ? 1 : 0,
          setsPerdidos: dupla1Venceu ? 0 : 1,
          gamesVencidos: set.gamesDupla1,
          gamesPerdidos: set.gamesDupla2,
        }
      );

      await estatisticasJogadorService.atualizarAposPartida(
        dupla2.jogador1Id,
        confronto.etapaId,
        {
          venceu: !dupla1Venceu,
          setsVencidos: !dupla1Venceu ? 1 : 0,
          setsPerdidos: !dupla1Venceu ? 0 : 1,
          gamesVencidos: set.gamesDupla2,
          gamesPerdidos: set.gamesDupla1,
        }
      );

      await estatisticasJogadorService.atualizarAposPartida(
        dupla2.jogador2Id,
        confronto.etapaId,
        {
          venceu: !dupla1Venceu,
          setsVencidos: !dupla1Venceu ? 1 : 0,
          setsPerdidos: !dupla1Venceu ? 0 : 1,
          gamesVencidos: set.gamesDupla2,
          gamesPerdidos: set.gamesDupla1,
        }
      );

      await db
        .collection("confrontos_eliminatorios")
        .doc(confrontoId)
        .update({
          partidaId,
          status: StatusConfrontoEliminatorio.FINALIZADA,
          vencedoraId,
          vencedoraNome,
          placar: `${set.gamesDupla1}-${set.gamesDupla2}`,
          atualizadoEm: Timestamp.now(),
        });

      await this.avancarVencedor(confronto, vencedoraId, vencedoraNome);

      logger.info("Resultado eliminatório registrado", {
        confrontoId,
        etapaId: confronto.etapaId,
        fase: confronto.fase,
        vencedoraNome,
        placar: `${set.gamesDupla1}-${set.gamesDupla2}`,
      });
    } catch (error: any) {
      logger.error(
        "Erro ao registrar resultado eliminatório",
        {
          confrontoId,
          arenaId,
        },
        error
      );
      throw error;
    }
  }

  /**
   * Avançar vencedor para próxima fase (COM ORDENAÇÃO CORRETA)
   */
  private async avancarVencedor(
    confronto: ConfrontoEliminatorio,
    _vencedoraId: string,
    _vencedoraNome: string
  ): Promise<void> {
    const proximaFase = this.obterProximaFase(confronto.fase);

    if (!proximaFase) {
      return;
    }

    const confrontosFaseSnapshot = await db
      .collection("confrontos_eliminatorios")
      .where("etapaId", "==", confronto.etapaId)
      .where("fase", "==", confronto.fase)
      .orderBy("ordem", "asc")
      .get();

    const confrontosFase = confrontosFaseSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ConfrontoEliminatorio[];

    const finalizados = confrontosFase.filter(
      (c) =>
        c.status === StatusConfrontoEliminatorio.FINALIZADA ||
        c.status === StatusConfrontoEliminatorio.BYE
    );

    if (finalizados.length === confrontosFase.length) {
      const confrontosProximaFaseSnapshot = await db
        .collection("confrontos_eliminatorios")
        .where("etapaId", "==", confronto.etapaId)
        .where("arenaId", "==", confronto.arenaId)
        .where("fase", "==", proximaFase)
        .get();

      const vencedores = finalizados.map((c) => ({
        id: c.vencedoraId!,
        nome: c.vencedoraNome!,
        origem: `Vencedor ${c.fase} ${c.ordem}`,
        ordem: c.ordem,
        confrontoOrigem: c.id,
      }));

      if (!confrontosProximaFaseSnapshot.empty) {
        await this.atualizarProximaFaseConfrontos(
          confronto.etapaId,
          confronto.arenaId,
          proximaFase,
          vencedores
        );
        return;
      }

      await this.gerarProximaFaseConfrontos(
        confronto.etapaId,
        confronto.arenaId,
        proximaFase,
        vencedores
      );
    }
  }

  /**
   * Atualizar confrontos da próxima fase quando resultados são editados
   */
  private async atualizarProximaFaseConfrontos(
    etapaId: string,
    arenaId: string,
    fase: TipoFase,
    vencedores: {
      id: string;
      nome: string;
      origem: string;
      confrontoOrigem: string;
      ordem: number;
    }[]
  ): Promise<void> {
    const confrontosSnapshot = await db
      .collection("confrontos_eliminatorios")
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .where("fase", "==", fase)
      .orderBy("ordem", "asc")
      .get();

    const confrontos = confrontosSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ConfrontoEliminatorio[];

    let vencedorIndex = 0;
    for (const confronto of confrontos) {
      const v1 = vencedores[vencedorIndex];
      const v2 = vencedores[vencedorIndex + 1];
      vencedorIndex += 2;

      const mudou =
        confronto.dupla1Id !== v1.id || confronto.dupla2Id !== v2.id;

      if (mudou) {
        const updates: any = {
          dupla1Id: v1.id,
          dupla1Nome: v1.nome,
          dupla1Origem: v1.origem,
          dupla2Id: v2.id,
          dupla2Nome: v2.nome,
          dupla2Origem: v2.origem,
          atualizadoEm: Timestamp.now(),
        };

        if (confronto.status === StatusConfrontoEliminatorio.FINALIZADA) {
          if (confronto.partidaId) {
            await db.collection("partidas").doc(confronto.partidaId).delete();
          }

          updates.status = StatusConfrontoEliminatorio.AGENDADA;
          updates.vencedoraId = null;
          updates.vencedoraNome = null;
          updates.placar = null;
          updates.partidaId = null;
        }

        await db
          .collection("confrontos_eliminatorios")
          .doc(confronto.id)
          .update(updates);
      }
    }
  }

  /**
   * Obter próxima fase
   */
  private obterProximaFase(faseAtual: TipoFase): TipoFase | null {
    switch (faseAtual) {
      case TipoFase.OITAVAS:
        return TipoFase.QUARTAS;
      case TipoFase.QUARTAS:
        return TipoFase.SEMIFINAL;
      case TipoFase.SEMIFINAL:
        return TipoFase.FINAL;
      case TipoFase.FINAL:
        return null; // Acabou
      default:
        return null;
    }
  }

  /**
   * Gerar confrontos da próxima fase (COM PAREAMENTO CORRETO)
   */
  private async gerarProximaFaseConfrontos(
    etapaId: string,
    arenaId: string,
    fase: TipoFase,
    vencedores: { id: string; nome: string; origem: string; ordem: number }[]
  ): Promise<void> {
    let ordem = 1;

    const numConfrontos = vencedores.length / 2;

    for (let i = 0; i < numConfrontos; i++) {
      const v1 = vencedores[i];
      const v2 = vencedores[vencedores.length - 1 - i];

      const confronto: Partial<ConfrontoEliminatorio> = {
        etapaId,
        arenaId,
        fase,
        ordem: ordem++,
        dupla1Id: v1.id,
        dupla1Nome: v1.nome,
        dupla1Origem: v1.origem,
        dupla2Id: v2.id,
        dupla2Nome: v2.nome,
        dupla2Origem: v2.origem,
        status: StatusConfrontoEliminatorio.AGENDADA,
        criadoEm: Timestamp.now(),
        atualizadoEm: Timestamp.now(),
      };

      const docRef = await db
        .collection("confrontos_eliminatorios")
        .add(confronto);
      await docRef.update({ id: docRef.id });
    }
  }

  /**
   * Buscar confrontos eliminatórios por fase
   */
  async buscarConfrontosEliminatorios(
    etapaId: string,
    arenaId: string,
    fase?: TipoFase
  ): Promise<ConfrontoEliminatorio[]> {
    try {
      let query = db
        .collection("confrontos_eliminatorios")
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId);

      if (fase) {
        query = query.where("fase", "==", fase);
      }

      const snapshot = await query.orderBy("ordem", "asc").get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ConfrontoEliminatorio[];
    } catch (error) {
      logger.error(
        "Erro ao buscar confrontos eliminatórios",
        {
          etapaId,
          arenaId,
          fase,
        },
        error as Error
      );
      throw error;
    }
  }

  /**
   * Cancelar/Excluir fase eliminatória
   * Permite ajustar resultados da fase de grupos e gerar novamente
   */
  async cancelarFaseEliminatoria(
    etapaId: string,
    arenaId: string
  ): Promise<void> {
    try {
      const etapa = await etapaService.buscarPorId(etapaId, arenaId);
      if (!etapa) {
        throw new Error("Etapa não encontrada");
      }

      const confrontosSnapshot = await db
        .collection("confrontos_eliminatorios")
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
        .get();

      if (confrontosSnapshot.empty) {
        throw new Error("Nenhuma fase eliminatória encontrada para esta etapa");
      }

      const partidasSnapshot = await db
        .collection(this.collectionPartidas)
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
        .where("tipo", "==", "eliminatoria")
        .get();

      let partidasRevertidas = 0;

      if (!partidasSnapshot.empty) {
        for (const partidaDoc of partidasSnapshot.docs) {
          const partida = {
            id: partidaDoc.id,
            ...partidaDoc.data(),
          } as Partida;

          if (
            partida.status === StatusPartida.FINALIZADA &&
            partida.placar &&
            partida.placar.length > 0
          ) {
            const dupla1Doc = await db
              .collection(this.collectionDuplas)
              .doc(partida.dupla1Id)
              .get();
            const dupla2Doc = await db
              .collection(this.collectionDuplas)
              .doc(partida.dupla2Id)
              .get();

            if (dupla1Doc.exists && dupla2Doc.exists) {
              const dupla1 = { id: dupla1Doc.id, ...dupla1Doc.data() } as Dupla;
              const dupla2 = { id: dupla2Doc.id, ...dupla2Doc.data() } as Dupla;

              let setsDupla1 = 0;
              let setsDupla2 = 0;
              let gamesVencidosDupla1 = 0;
              let gamesPerdidosDupla1 = 0;
              let gamesVencidosDupla2 = 0;
              let gamesPerdidosDupla2 = 0;

              partida.placar.forEach((set) => {
                if (set.gamesDupla1 > set.gamesDupla2) {
                  setsDupla1++;
                } else {
                  setsDupla2++;
                }
                gamesVencidosDupla1 += set.gamesDupla1;
                gamesPerdidosDupla1 += set.gamesDupla2;
                gamesVencidosDupla2 += set.gamesDupla2;
                gamesPerdidosDupla2 += set.gamesDupla1;
              });

              const dupla1Venceu = partida.vencedoraId === dupla1.id;

              await estatisticasJogadorService.reverterAposPartida(
                dupla1.jogador1Id,
                etapaId,
                {
                  venceu: dupla1Venceu,
                  setsVencidos: setsDupla1,
                  setsPerdidos: setsDupla2,
                  gamesVencidos: gamesVencidosDupla1,
                  gamesPerdidos: gamesPerdidosDupla1,
                }
              );

              await estatisticasJogadorService.reverterAposPartida(
                dupla1.jogador2Id,
                etapaId,
                {
                  venceu: dupla1Venceu,
                  setsVencidos: setsDupla1,
                  setsPerdidos: setsDupla2,
                  gamesVencidos: gamesVencidosDupla1,
                  gamesPerdidos: gamesPerdidosDupla1,
                }
              );

              await estatisticasJogadorService.reverterAposPartida(
                dupla2.jogador1Id,
                etapaId,
                {
                  venceu: !dupla1Venceu,
                  setsVencidos: setsDupla2,
                  setsPerdidos: setsDupla1,
                  gamesVencidos: gamesVencidosDupla2,
                  gamesPerdidos: gamesPerdidosDupla2,
                }
              );

              await estatisticasJogadorService.reverterAposPartida(
                dupla2.jogador2Id,
                etapaId,
                {
                  venceu: !dupla1Venceu,
                  setsVencidos: setsDupla2,
                  setsPerdidos: setsDupla1,
                  gamesVencidos: gamesVencidosDupla2,
                  gamesPerdidos: gamesPerdidosDupla2,
                }
              );

              partidasRevertidas++;
            }
          }
        }

        const partidasBatch = db.batch();
        partidasSnapshot.docs.forEach((doc) => {
          partidasBatch.delete(doc.ref);
        });
        await partidasBatch.commit();
      }

      const confrontosBatch = db.batch();
      confrontosSnapshot.docs.forEach((doc) => {
        confrontosBatch.delete(doc.ref);
      });
      await confrontosBatch.commit();

      const duplasSnapshot = await db
        .collection(this.collectionDuplas)
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
        .where("classificada", "==", true)
        .get();

      if (!duplasSnapshot.empty) {
        const jogadoresIds = new Set<string>();

        duplasSnapshot.docs.forEach((doc) => {
          const dupla = doc.data() as Dupla;
          jogadoresIds.add(dupla.jogador1Id);
          jogadoresIds.add(dupla.jogador2Id);
        });

        for (const jogadorId of jogadoresIds) {
          await estatisticasJogadorService.marcarComoClassificado(
            jogadorId,
            etapaId,
            false
          );
        }

        const duplasBatch = db.batch();
        duplasSnapshot.docs.forEach((doc) => {
          duplasBatch.update(doc.ref, {
            classificada: false,
            atualizadoEm: Timestamp.now(),
          });
        });
        await duplasBatch.commit();
      }

      logger.info("Fase eliminatória cancelada", {
        etapaId,
        arenaId,
        confrontosRemovidos: confrontosSnapshot.size,
        partidasRemovidas: partidasSnapshot.size,
        partidasRevertidas,
        duplasAtualizadas: duplasSnapshot.size,
      });
    } catch (error: any) {
      logger.error(
        "Erro ao cancelar fase eliminatória",
        {
          etapaId,
          arenaId,
        },
        error
      );
      throw error;
    }
  }
}

export default new ChaveService();
