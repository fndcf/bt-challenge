import { db } from "./firebase";
import { COLLECTIONS } from "./firestore";

/**
 * Script para inicializar a estrutura do banco de dados
 * Executa uma única vez para criar documentos iniciais
 */

export const initializeDatabase = async () => {
  try {
    console.log("🚀 Iniciando configuração do banco de dados...");

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
      console.log("✅ Configuração global criada");
    } else {
      console.log("ℹ️  Configuração global já existe");
    }

    // Verificar se existem arenas
    const arenasSnapshot = await db
      .collection(COLLECTIONS.ARENAS)
      .limit(1)
      .get();

    if (arenasSnapshot.empty) {
      console.log(
        "⚠️  Nenhuma arena encontrada. Crie uma arena através do painel administrativo."
      );
    } else {
      console.log("✅ Banco de dados já possui arenas configuradas");
    }

    console.log("✅ Inicialização do banco concluída!");
    return true;
  } catch (error) {
    console.error("❌ Erro ao inicializar banco de dados:", error);
    throw error;
  }
};
