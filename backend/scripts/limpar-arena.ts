/**
 * Script para limpar dados de uma arena
 *
 * Dois modos de uso:
 * - Arena deletada: limpa documentos órfãos (jogadores, etapas, partidas, etc.)
 * - Arena existente: modo "reset" — limpa dados mas mantém arena e admin
 *
 * Em ambos os casos, admins NUNCA são deletados.
 *
 * ============================================================
 * STAGING (desenvolvimento local)
 * ============================================================
 * Usa .env.local que aponta para o projeto staging.
 *
 *   cd backend
 *   npx ts-node scripts/limpar-arena.ts <arenaId>
 *
 * ============================================================
 * PRODUÇÃO (via Google Cloud Shell)
 * ============================================================
 * O script pode ser executado em produção via Cloud Shell,
 * que já possui as credenciais do projeto autenticadas.
 *
 * 1. Acesse: https://console.cloud.google.com/cloudshell?project=torneio-challenge
 * 2. No terminal do Cloud Shell, rode:
 *
 *   git clone https://github.com/fndcf/bt-challenge.git
 *   cd bt-challenge/backend
 *   npm install
 *   export GCLOUD_PROJECT=torneio-challenge
 *   npx ts-node scripts/limpar-arena.ts <arenaId>
 *
 * Nota: O Cloud Shell já tem Node.js e as credenciais do projeto.
 *       Não é necessário configurar .env ou chaves privadas.
 *       Após usar, o ambiente é descartado automaticamente.
 * ============================================================
 */

import admin from "firebase-admin";
import dotenv from "dotenv";
import path from "path";
import readline from "readline";

// Carregar variáveis de ambiente
const nodeEnv = process.env.NODE_ENV || "development";
if (nodeEnv === "staging") {
  dotenv.config({ path: path.resolve(__dirname, "../.env.staging") });
} else {
  dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
}

// Inicializar Firebase
const isProduction =
  process.env.NODE_ENV === "production" ||
  process.env.FIREBASE_CONFIG ||
  process.env.GCLOUD_PROJECT;

if (isProduction) {
  admin.initializeApp();
} else {
  const privateKey = process.env.FB_PRIVATE_KEY?.replace(/\\n/g, "\n");
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FB_PROJECT_ID,
      privateKey,
      clientEmail: process.env.FB_CLIENT_EMAIL,
    }),
  });
}

const db = admin.firestore();

// Todas as collections que referenciam arenaId
const COLLECTIONS_COM_ARENA_ID = [
  "jogadores",
  "etapas",
  "inscricoes",
  "duplas",
  "grupos",
  "partidas",
  "partidas_rei_da_praia",
  "partidas_teams",
  "confrontos_eliminatorios",
  "confrontos_equipe",
  "equipes",
  "estatisticas_jogador",
  "cabecas_de_chave",
  "config",
];

async function contarDocumentos(collection: string, arenaId: string): Promise<number> {
  const snapshot = await db
    .collection(collection)
    .where("arenaId", "==", arenaId)
    .count()
    .get();
  return snapshot.data().count;
}

async function deletarDocumentos(collection: string, arenaId: string): Promise<number> {
  const BATCH_SIZE = 500;
  let totalDeletados = 0;

  while (true) {
    const snapshot = await db
      .collection(collection)
      .where("arenaId", "==", arenaId)
      .limit(BATCH_SIZE)
      .get();

    if (snapshot.empty) break;

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    totalDeletados += snapshot.size;
    process.stdout.write(`  ${collection}: ${totalDeletados} deletados\r`);
  }

  return totalDeletados;
}

function pergunta(texto: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(texto, (resposta) => {
      rl.close();
      resolve(resposta.trim().toLowerCase());
    });
  });
}

async function main() {
  const arenaId = process.argv[2];

  if (!arenaId) {
    console.error("\nUso: npx ts-node scripts/limpar-arena.ts <arenaId>\n");
    process.exit(1);
  }

  const projectId = process.env.FB_PROJECT_ID || process.env.GCLOUD_PROJECT || "desconhecido";
  console.log(`\n🏟️  Limpeza de Arena Órfã`);
  console.log(`   Projeto: ${projectId}`);
  console.log(`   Arena ID: ${arenaId}\n`);

  // Verificar se a arena ainda existe
  const arenaDoc = await db.collection("arenas").doc(arenaId).get();
  const arenaExiste = arenaDoc.exists;
  if (arenaExiste) {
    console.log(`ℹ️  A arena "${arenaDoc.data()?.nome}" ainda existe no Firestore.`);
    console.log(`   Modo "reset": os dados serão limpos mas a arena e o admin serão mantidos.\n`);
  }

  // Contar documentos
  console.log("📊 Contando documentos...\n");

  const contagens: { collection: string; count: number }[] = [];
  let totalGeral = 0;

  for (const collection of COLLECTIONS_COM_ARENA_ID) {
    const count = await contarDocumentos(collection, arenaId);
    if (count > 0) {
      contagens.push({ collection, count });
      totalGeral += count;
      console.log(`   ${collection}: ${count} documento(s)`);
    }
  }

  console.log(`   admins: mantido`);
  if (arenaExiste) {
    console.log(`   arenas: mantido`);
  }

  if (totalGeral === 0) {
    console.log("\n✅ Nenhum documento órfão encontrado para esta arena.\n");
    process.exit(0);
  }

  console.log(`\n   TOTAL: ${totalGeral} documento(s) a serem deletados\n`);

  // Confirmar
  const confirmar = await pergunta("⚠️  Deseja deletar TODOS esses documentos? (s/n): ");
  if (confirmar !== "s") {
    console.log("Cancelado.\n");
    process.exit(0);
  }

  // Deletar
  console.log("\n🗑️  Deletando...\n");

  let totalDeletados = 0;
  for (const { collection } of contagens) {
    const deletados = await deletarDocumentos(collection, arenaId);
    totalDeletados += deletados;
    console.log(`   ✅ ${collection}: ${deletados} deletado(s)`);
  }

  console.log(`\n✅ Limpeza concluída! ${totalDeletados} documento(s) deletados.\n`);
  process.exit(0);
}

main().catch((error) => {
  console.error("\n❌ Erro:", error.message);
  process.exit(1);
});
