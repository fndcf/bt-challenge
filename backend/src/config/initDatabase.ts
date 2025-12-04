import { db } from "./firebase";
import { COLLECTIONS } from "./firestore";
import logger from "../utils/logger";

export const initializeDatabase = async () => {
  try {
    logger.info("Iniciando configuração do banco de dados");

    // Criar documento de configuração global
    const configRef = db.collection("config").doc("global");
    const configDoc = await configRef.get();

    if (!configDoc.exists) {
      await configRef.set({
        pontuacaoColocacao: {
          campeao: 100,
          vice: 70,
          semifinalista: 50,
          quartas: 30,
          oitavas: 20,
          participacao: 10,
        },
        versao: "1.0.0",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      logger.info("Configuração global criada");
    } else {
      logger.debug("Configuração global já existe");
    }

    // Verificar se existem arenas
    const arenasSnapshot = await db
      .collection(COLLECTIONS.ARENAS)
      .limit(1)
      .get();

    if (arenasSnapshot.empty) {
      logger.warn("Nenhuma arena encontrada", {
        acao: "Crie uma arena através do painel administrativo",
      });
    } else {
      logger.info("Banco de dados possui arenas configuradas");
    }

    logger.info("Inicialização do banco concluída");
    return true;
  } catch (error) {
    logger.error("Erro ao inicializar banco de dados", {}, error as Error);
    throw error;
  }
};
