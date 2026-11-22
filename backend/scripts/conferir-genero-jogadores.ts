/**
 * Lista os jogadores cujo gênero no cadastro é diferente do gênero gravado
 * em alguma inscrição.
 *
 * SÓ LEITURA: não grava nada no banco.
 *
 * Motivo: até nov/2026, editar um jogador sem mexer no gênero gravava
 * "masculino" no cadastro (e "ativo" no status). As inscrições guardam o
 * gênero do momento em que o jogador foi inscrito.
 *
 * Não aparece aqui quem nunca foi inscrito ou só foi inscrito depois da
 * troca. O status anterior não fica gravado em lugar nenhum.
 *
 * ============================================================
 * COMO USAR
 * ============================================================
 * Staging (cd backend):
 *   npx cross-env NODE_ENV=staging npx ts-node scripts/conferir-genero-jogadores.ts
 *
 * Produção (Google Cloud Shell, com GCLOUD_PROJECT exportado, como nos
 * outros scripts):
 *   npx tsx scripts/conferir-genero-jogadores.ts
 *
 * Sem argumento confere todas as arenas. Para uma só, passe o id dela:
 *   npx tsx scripts/conferir-genero-jogadores.ts ID_DA_ARENA
 * ============================================================
 */

import admin from "firebase-admin";
import dotenv from "dotenv";
import path from "path";

const nodeEnv = process.env.NODE_ENV || "development";
dotenv.config({
  path: path.resolve(
    __dirname,
    nodeEnv === "staging" ? "../.env.staging" : "../.env.local"
  ),
});

if (
  nodeEnv === "production" ||
  process.env.FIREBASE_CONFIG ||
  process.env.GCLOUD_PROJECT
) {
  admin.initializeApp();
} else {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FB_PROJECT_ID,
      privateKey: process.env.FB_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      clientEmail: process.env.FB_CLIENT_EMAIL,
    }),
  });
}

const db = admin.firestore();

async function conferirArena(arenaId: string, nome: string): Promise<number> {
  const [jogadores, inscricoes] = await Promise.all([
    db.collection("jogadores").where("arenaId", "==", arenaId).get(),
    db.collection("inscricoes").where("arenaId", "==", arenaId).get(),
  ]);

  // Gêneros e quantidade de inscrições de cada jogador
  const porJogador = new Map<string, Map<string, number>>();
  inscricoes.docs.forEach((doc) => {
    const { jogadorId, jogadorGenero } = doc.data();
    if (!jogadorGenero) return;
    const generos = porJogador.get(jogadorId) ?? new Map<string, number>();
    generos.set(jogadorGenero, (generos.get(jogadorGenero) ?? 0) + 1);
    porJogador.set(jogadorId, generos);
  });

  const divergentes = jogadores.docs
    .map((doc) => ({
      id: doc.id,
      nome: String(doc.data().nome),
      genero: String(doc.data().genero),
      generos: [...(porJogador.get(doc.id) ?? [])],
    }))
    .filter((j) => j.generos.some(([genero]) => genero !== j.genero))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  console.log(
    `\n${nome} (${arenaId}): ${jogadores.size} jogador(es), ${divergentes.length} para conferir`
  );
  divergentes.forEach((j) => {
    const historico = j.generos
      .map(([genero, quantidade]) => `${genero} em ${quantidade}`)
      .join(", ");
    console.log(
      `  - ${j.nome} [${j.id}]: cadastro ${j.genero} | inscrições: ${historico}`
    );
  });

  return divergentes.length;
}

async function main(): Promise<void> {
  const arenaId = process.argv[2];

  const arenas = arenaId
    ? [await db.collection("arenas").doc(arenaId).get()]
    : (await db.collection("arenas").get()).docs;

  if (arenas.some((arena) => !arena.exists)) {
    throw new Error(`Arena ${arenaId} não encontrada`);
  }

  let total = 0;
  for (const arena of arenas) {
    total += await conferirArena(arena.id, String(arena.data()?.nome));
  }

  console.log(`\nTotal para conferir: ${total}. Nada foi gravado.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
