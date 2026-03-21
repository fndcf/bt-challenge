/**
 * Script de migração: adicionar suporte multi-arena nos documentos de admin
 *
 * Converte admins/{uid}.arenaId (string) para arenaIds (array)
 * Mantém o campo arenaId original para backward compatibility
 *
 * Uso:
 *   cd backend
 *   npx ts-node scripts/migrar-multi-arena.ts
 *
 * Via Cloud Shell (produção):
 *   export GCLOUD_PROJECT=torneio-challenge
 *   npx ts-node scripts/migrar-multi-arena.ts
 */

import admin from "firebase-admin";
import dotenv from "dotenv";
import path from "path";

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

async function main() {
  const projectId = process.env.FB_PROJECT_ID || process.env.GCLOUD_PROJECT || "desconhecido";
  console.log(`\n🔄 Migração Multi-Arena`);
  console.log(`   Projeto: ${projectId}\n`);

  const snapshot = await db.collection("admins").get();

  if (snapshot.empty) {
    console.log("Nenhum admin encontrado.\n");
    process.exit(0);
  }

  console.log(`📊 ${snapshot.size} admin(s) encontrado(s)\n`);

  let migrados = 0;
  let jaAtualizados = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const uid = doc.id;

    // Já migrado?
    if (data.arenaIds && Array.isArray(data.arenaIds)) {
      console.log(`   ⏭️  ${data.email} — já migrado (${data.arenaIds.length} arena(s))`);
      jaAtualizados++;
      continue;
    }

    if (!data.arenaId) {
      console.log(`   ⚠️  ${data.email || uid} — sem arenaId, pulando`);
      continue;
    }

    // Migrar
    await doc.ref.update({
      arenaIds: [data.arenaId],
      defaultArenaId: data.arenaId,
    });

    console.log(`   ✅ ${data.email} — migrado (arenaId: ${data.arenaId})`);
    migrados++;
  }

  console.log(`\n✅ Migração concluída!`);
  console.log(`   Migrados: ${migrados}`);
  console.log(`   Já atualizados: ${jaAtualizados}\n`);

  process.exit(0);
}

main().catch((error) => {
  console.error("\n❌ Erro:", error.message);
  process.exit(1);
});
