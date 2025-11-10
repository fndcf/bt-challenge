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

/**
 * Criar uma arena de exemplo (apenas para desenvolvimento/teste)
 */
export const createExampleArena = async (
  nomeArena: string,
  slugArena: string,
  adminEmail: string,
  adminUid: string
) => {
  try {
    // Verificar se slug já existe
    const arenaExistente = await db
      .collection(COLLECTIONS.ARENAS)
      .where("slug", "==", slugArena)
      .get();

    if (!arenaExistente.empty) {
      throw new Error(`Arena com slug "${slugArena}" já existe`);
    }

    // Criar arena
    const arenaRef = db.collection(COLLECTIONS.ARENAS).doc();
    const arenaData = {
      id: arenaRef.id,
      nome: nomeArena,
      slug: slugArena,
      adminEmail: adminEmail,
      adminUid: adminUid,
      ativa: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await arenaRef.set(arenaData);

    // Criar registro de admin
    const adminRef = db.collection(COLLECTIONS.ADMINS).doc(adminUid);
    await adminRef.set({
      uid: adminUid,
      email: adminEmail,
      arenaId: arenaRef.id,
      role: "admin",
      createdAt: new Date(),
    });

    console.log(`✅ Arena "${nomeArena}" criada com sucesso!`);
    console.log(`📍 URL: www.challengebt.com.br/${slugArena}`);

    return arenaData;
  } catch (error) {
    console.error("❌ Erro ao criar arena:", error);
    throw error;
  }
};

/**
 * Função para limpar dados de teste (usar com cuidado!)
 */
export const clearTestData = async (arenaId: string) => {
  console.log("⚠️  ATENÇÃO: Limpando dados de teste...");

  const batch = db.batch();

  // Deletar jogadores da arena
  const jogadores = await db
    .collection(COLLECTIONS.JOGADORES)
    .where("arenaId", "==", arenaId)
    .get();

  jogadores.forEach((doc) => batch.delete(doc.ref));

  // Deletar challenges da arena
  const challenges = await db
    .collection(COLLECTIONS.CHALLENGES)
    .where("arenaId", "==", arenaId)
    .get();

  challenges.forEach((doc) => batch.delete(doc.ref));

  await batch.commit();
  console.log("✅ Dados de teste removidos");
};
