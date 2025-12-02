/**
 * ConfigRepository.ts
 * Implementação Firebase do repository de Config (configurações globais)
 */

import { db } from "../../config/firebase";
import { Timestamp } from "firebase-admin/firestore";
import {
  IConfigRepository,
  ConfigGlobal,
  PontuacaoColocacao,
} from "../interfaces/IConfigRepository";
import logger from "../../utils/logger";

/**
 * Valores padrão para pontuação
 */
const PONTUACAO_PADRAO: PontuacaoColocacao = {
  campeao: 100,
  vice: 70,
  semifinalista: 50,
  quartas: 30,
  oitavas: 20,
  participacao: 10,
};

/**
 * Implementação Firebase do repository de Config
 */
export class ConfigRepository implements IConfigRepository {
  private collection = db.collection("config");
  private docId = "global";

  /**
   * Buscar configuração global
   */
  async buscarConfigGlobal(): Promise<ConfigGlobal> {
    const doc = await this.collection.doc(this.docId).get();

    if (!doc.exists) {
      // Retornar configuração padrão se não existir
      return {
        pontuacaoColocacao: PONTUACAO_PADRAO,
      };
    }

    const data = doc.data()!;

    return {
      pontuacaoColocacao: data.pontuacaoColocacao || PONTUACAO_PADRAO,
      maxJogadoresPorEtapa: data.maxJogadoresPorEtapa,
      maxEtapasPorArena: data.maxEtapasPorArena,
      tempoLimitePartida: data.tempoLimitePartida,
      ...data,
    };
  }

  /**
   * Buscar pontuação por colocação
   */
  async buscarPontuacao(): Promise<PontuacaoColocacao> {
    const config = await this.buscarConfigGlobal();
    return config.pontuacaoColocacao;
  }

  /**
   * Buscar valor específico da configuração
   */
  async buscarValor<T>(chave: string, valorPadrao: T): Promise<T> {
    const doc = await this.collection.doc(this.docId).get();

    if (!doc.exists) {
      return valorPadrao;
    }

    const data = doc.data()!;
    return data[chave] !== undefined ? data[chave] : valorPadrao;
  }

  /**
   * Atualizar configuração global
   */
  async atualizarConfig(dados: Partial<ConfigGlobal>): Promise<void> {
    const docRef = this.collection.doc(this.docId);
    const doc = await docRef.get();

    const updateData = {
      ...dados,
      atualizadoEm: Timestamp.now(),
    };

    if (doc.exists) {
      await docRef.update(updateData);
    } else {
      await docRef.set({
        pontuacaoColocacao: PONTUACAO_PADRAO,
        ...updateData,
        criadoEm: Timestamp.now(),
      });
    }

    logger.info("Configuração global atualizada", { chaves: Object.keys(dados) });
  }

  /**
   * Atualizar pontuação
   */
  async atualizarPontuacao(pontuacao: Partial<PontuacaoColocacao>): Promise<void> {
    const docRef = this.collection.doc(this.docId);
    const doc = await docRef.get();

    const pontuacaoAtual = doc.exists
      ? doc.data()?.pontuacaoColocacao || PONTUACAO_PADRAO
      : PONTUACAO_PADRAO;

    const novaPontuacao = {
      ...pontuacaoAtual,
      ...pontuacao,
    };

    if (doc.exists) {
      await docRef.update({
        pontuacaoColocacao: novaPontuacao,
        atualizadoEm: Timestamp.now(),
      });
    } else {
      await docRef.set({
        pontuacaoColocacao: novaPontuacao,
        criadoEm: Timestamp.now(),
        atualizadoEm: Timestamp.now(),
      });
    }

    logger.info("Pontuação atualizada", { pontuacao: novaPontuacao });
  }

  /**
   * Definir valor específico
   */
  async definirValor<T>(chave: string, valor: T): Promise<void> {
    const docRef = this.collection.doc(this.docId);
    const doc = await docRef.get();

    const updateData = {
      [chave]: valor,
      atualizadoEm: Timestamp.now(),
    };

    if (doc.exists) {
      await docRef.update(updateData);
    } else {
      await docRef.set({
        pontuacaoColocacao: PONTUACAO_PADRAO,
        ...updateData,
        criadoEm: Timestamp.now(),
      });
    }

    logger.info("Valor de configuração definido", { chave, valor });
  }
}

// Instância singleton
export const configRepository = new ConfigRepository();
