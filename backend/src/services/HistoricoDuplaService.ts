/**
 * Service para rastrear histórico de duplas formadas
 */

import { db } from "../config/firebase";
import { Timestamp } from "firebase-admin/firestore";
import {
  HistoricoDupla,
  CriarHistoricoDuplaDTO,
  EstatisticasCombinacoes,
} from "../models/HistoricoDupla";
import cabecaDeChaveService from "./CabecaDeChaveService";
import logger from "../utils/logger";

export class HistoricoDuplaService {
  private collection = "historico_duplas";

  /**
   * Normalizar chave da dupla (sempre ordem alfabética)
   */
  private normalizarChave(jogador1Id: string, jogador2Id: string): string {
    const ids = [jogador1Id, jogador2Id].sort();
    return `${ids[0]}_${ids[1]}`;
  }

  /**
   * Registrar dupla no histórico
   */
  async registrar(dto: CriarHistoricoDuplaDTO): Promise<HistoricoDupla> {
    try {
      const chaveNormalizada = this.normalizarChave(
        dto.jogador1Id,
        dto.jogador2Id
      );

      // Verificar se já existe
      const existente = await this.buscarPorChave(
        dto.arenaId,
        dto.etapaId,
        chaveNormalizada
      );

      if (existente) {
        return existente;
      }

      const historico: Omit<HistoricoDupla, "id"> = {
        arenaId: dto.arenaId,
        etapaId: dto.etapaId,
        etapaNome: dto.etapaNome,
        jogador1Id: dto.jogador1Id,
        jogador1Nome: dto.jogador1Nome,
        jogador2Id: dto.jogador2Id,
        jogador2Nome: dto.jogador2Nome,
        chaveNormalizada,
        ambosForamCabecas: dto.ambosForamCabecas,
        criadoEm: Timestamp.now(),
      };

      const docRef = await db.collection(this.collection).add(historico);

      const novoHistorico = {
        id: docRef.id,
        ...historico,
      };

      logger.info("Histórico de dupla registrado", {
        historicoId: novoHistorico.id,
        etapaId: dto.etapaId,
        etapaNome: dto.etapaNome,
        jogador1: dto.jogador1Nome,
        jogador2: dto.jogador2Nome,
        ambosForamCabecas: dto.ambosForamCabecas,
      });

      return novoHistorico;
    } catch (error) {
      logger.error(
        "Erro ao registrar histórico de dupla",
        {
          etapaId: dto.etapaId,
          jogador1Id: dto.jogador1Id,
          jogador2Id: dto.jogador2Id,
        },
        error as Error
      );
      throw error;
    }
  }

  /**
   * Buscar dupla por chave
   */
  private async buscarPorChave(
    arenaId: string,
    etapaId: string,
    chaveNormalizada: string
  ): Promise<HistoricoDupla | null> {
    try {
      const snapshot = await db
        .collection(this.collection)
        .where("arenaId", "==", arenaId)
        .where("etapaId", "==", etapaId)
        .where("chaveNormalizada", "==", chaveNormalizada)
        .limit(1)
        .get();

      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as HistoricoDupla;
    } catch (error) {
      return null;
    }
  }

  /**
   *  Registrar múltiplas duplas em lote (batch)
   */
  async registrarEmLote(
    dtos: CriarHistoricoDuplaDTO[]
  ): Promise<HistoricoDupla[]> {
    if (dtos.length === 0) return [];

    try {
      const batch = db.batch();
      const agora = Timestamp.now();
      const historicos: HistoricoDupla[] = [];

      for (const dto of dtos) {
        const chaveNormalizada = this.normalizarChave(
          dto.jogador1Id,
          dto.jogador2Id
        );

        const docRef = db.collection(this.collection).doc();
        const historico: Omit<HistoricoDupla, "id"> = {
          arenaId: dto.arenaId,
          etapaId: dto.etapaId,
          etapaNome: dto.etapaNome,
          jogador1Id: dto.jogador1Id,
          jogador1Nome: dto.jogador1Nome,
          jogador2Id: dto.jogador2Id,
          jogador2Nome: dto.jogador2Nome,
          chaveNormalizada,
          ambosForamCabecas: dto.ambosForamCabecas,
          criadoEm: agora,
        };

        batch.set(docRef, historico);
        historicos.push({
          id: docRef.id,
          ...historico,
        });
      }

      await batch.commit();

      logger.info("Histórico de duplas registrado em lote", {
        quantidade: historicos.length,
        etapaId: dtos[0]?.etapaId,
      });

      return historicos;
    } catch (error) {
      logger.error(
        "Erro ao registrar histórico de duplas em lote",
        { quantidade: dtos.length },
        error as Error
      );
      throw error;
    }
  }

  /**
   * Verificar se dupla já foi formada anteriormente
   */
  async duplaJaFormada(
    arenaId: string,
    jogador1Id: string,
    jogador2Id: string
  ): Promise<boolean> {
    try {
      const chaveNormalizada = this.normalizarChave(jogador1Id, jogador2Id);

      const snapshot = await db
        .collection(this.collection)
        .where("arenaId", "==", arenaId)
        .where("chaveNormalizada", "==", chaveNormalizada)
        .where("ambosForamCabecas", "==", true)
        .limit(1)
        .get();

      return !snapshot.empty;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obter todas as combinações já realizadas entre cabeças
   */
  async obterCombinacoesRealizadas(arenaId: string): Promise<Set<string>> {
    try {
      const snapshot = await db
        .collection(this.collection)
        .where("arenaId", "==", arenaId)
        .where("ambosForamCabecas", "==", true)
        .get();

      const combinacoes = new Set<string>();

      snapshot.docs.forEach((doc) => {
        const data = doc.data() as HistoricoDupla;
        combinacoes.add(data.chaveNormalizada);
      });

      return combinacoes;
    } catch (error) {
      return new Set();
    }
  }

  /**
   * Calcular estatísticas de combinações
   */
  async calcularEstatisticas(
    arenaId: string,
    etapaId: string
  ): Promise<EstatisticasCombinacoes> {
    // Buscar cabeças de chave ativas
    const cabecas = await cabecaDeChaveService.listarAtivas(arenaId, etapaId);
    const totalCabecas = cabecas.length;

    // Calcular combinações possíveis: C(n,2) = n! / (2! * (n-2)!)
    const combinacoesPossiveis =
      totalCabecas >= 2 ? (totalCabecas * (totalCabecas - 1)) / 2 : 0;

    // Buscar combinações já realizadas
    const combinacoesRealizadasSet = await this.obterCombinacoesRealizadas(
      arenaId
    );
    const combinacoesRealizadas = combinacoesRealizadasSet.size;

    // Calcular combinações restantes
    const combinacoesRestantes = Math.max(
      0,
      combinacoesPossiveis - combinacoesRealizadas
    );

    // Todas foram feitas?
    const todasCombinacoesFeitas = combinacoesRestantes === 0;

    // Gerar lista de combinações disponíveis
    const cabecasIds = cabecas.map((c) => c.jogadorId);
    const combinacoesDisponiveis: string[][] = [];

    for (let i = 0; i < cabecasIds.length; i++) {
      for (let j = i + 1; j < cabecasIds.length; j++) {
        const chave = this.normalizarChave(cabecasIds[i], cabecasIds[j]);

        if (!combinacoesRealizadasSet.has(chave)) {
          combinacoesDisponiveis.push([cabecasIds[i], cabecasIds[j]]);
        }
      }
    }

    return {
      totalCabecas,
      combinacoesPossiveis,
      combinacoesRealizadas,
      combinacoesRestantes,
      todasCombinacoesFeitas,
      combinacoesDisponiveis,
    };
  }

  /**
   * Listar histórico de um jogador
   */
  async listarHistoricoJogador(
    arenaId: string,
    jogadorId: string
  ): Promise<HistoricoDupla[]> {
    try {
      const snapshot = await db
        .collection(this.collection)
        .where("arenaId", "==", arenaId)
        .where("jogador1Id", "==", jogadorId)
        .orderBy("criadoEm", "desc")
        .get();

      const resultados1 = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as HistoricoDupla[];

      const snapshot2 = await db
        .collection(this.collection)
        .where("arenaId", "==", arenaId)
        .where("jogador2Id", "==", jogadorId)
        .orderBy("criadoEm", "desc")
        .get();

      const resultados2 = snapshot2.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as HistoricoDupla[];

      return [...resultados1, ...resultados2].sort(
        (a, b) => b.criadoEm.toMillis() - a.criadoEm.toMillis()
      );
    } catch (error) {
      return [];
    }
  }

  /**
   * Limpar histórico de uma etapa específica
   */
  async limparDaEtapa(arenaId: string, etapaId: string): Promise<void> {
    try {
      const snapshot = await db
        .collection("historico_duplas")
        .where("arenaId", "==", arenaId)
        .where("etapaId", "==", etapaId)
        .get();

      if (snapshot.empty) {
        logger.info("Nenhum histórico de duplas para limpar", {
          arenaId,
          etapaId,
        });
        return;
      }

      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      logger.info("Histórico de duplas removido", {
        arenaId,
        etapaId,
        quantidadeRemovida: snapshot.size,
      });
    } catch (error) {
      logger.error(
        "Erro ao limpar histórico de duplas da etapa",
        {
          arenaId,
          etapaId,
        },
        error as Error
      );
      throw error;
    }
  }

  /**
   * Limpar histórico de uma etapa
   */
  async limparEtapa(arenaId: string, etapaId: string): Promise<void> {
    try {
      const snapshot = await db
        .collection(this.collection)
        .where("arenaId", "==", arenaId)
        .where("etapaId", "==", etapaId)
        .get();

      const batch = db.batch();

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      logger.info("Histórico de etapa limpo", {
        arenaId,
        etapaId,
        quantidadeRemovida: snapshot.size,
      });
    } catch (error) {
      logger.error(
        "Erro ao limpar histórico da etapa",
        {
          arenaId,
          etapaId,
        },
        error as Error
      );
      throw error;
    }
  }
}

export default new HistoricoDuplaService();
