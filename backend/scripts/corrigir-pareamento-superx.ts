/**
 * Script para corrigir o pareamento de uma etapa Super X (8 ou 12)
 * quando o sorteio feito no papel não bateu com o gerado pela aplicação.
 *
 * O app sorteia os jogadores aleatoriamente antes de encaixá-los na tabela
 * fixa de rodadas (SuperXSchedules.ts) — por isso o resultado pode divergir
 * de um sorteio manual. Este script APAGA as partidas já geradas (nenhum
 * resultado deve ter sido lançado ainda) e recria com o pareamento real,
 * mantendo jogadores/inscrições/estatísticas intactos.
 *
 * IMPORTANTE: este arquivo, como está commitado no repositório, é só o
 * MECANISMO — a seção "EDITAR AQUI" abaixo fica sempre com placeholder.
 * Os dados reais (Arena ID, Etapa ID, pareamento) de cada correção são
 * preenchidos localmente na hora de rodar e NUNCA devem ser commitados
 * (são dados de uma correção pontual, não faz sentido versionar).
 *
 * ============================================================
 * COMO USAR EM STAGING (ambiente de teste)
 * ============================================================
 * 1. No seu editor local, preencha a seção "EDITAR AQUI" abaixo:
 *    - ARENA_ID e ETAPA_ID da etapa a corrigir (pegue no Firestore Console
 *      do projeto de staging, collections "arenas" e "etapas")
 *    - PAREAMENTO: as rodadas exatamente como saíram no papel, usando
 *      os nomes dos jogadores como estão cadastrados no sistema
 *      (o script resolve o nome -> jogadorId automaticamente)
 *
 * 2. Rode em modo de verificação primeiro (não altera nada):
 *
 *   cd backend
 *   npx ts-node scripts/corrigir-pareamento-superx.ts --dry-run
 *
 *   Revise a saída: nomes não encontrados, duplicados ou faltando são
 *   listados como erro e o script para sem tocar no banco.
 *
 * 3. Quando a verificação estiver limpa, rode de verdade:
 *
 *   npx ts-node scripts/corrigir-pareamento-superx.ts
 *
 *   Vai pedir confirmação (s/n) antes de apagar/criar qualquer coisa.
 *
 * 4. Depois de rodar, DESFAÇA a edição local (git checkout do arquivo, ou
 *    apague o conteúdo da seção EDITAR AQUI) para não deixar dados da
 *    correção pendurados no seu working tree.
 *
 * ============================================================
 * COMO USAR EM PRODUÇÃO (via Google Cloud Shell)
 * ============================================================
 * O Cloud Shell clona o repositório do GitHub — ou seja, ele vai baixar
 * a versão commitada deste arquivo, COM A SEÇÃO "EDITAR AQUI" EM BRANCO
 * (placeholder). Você edita o arquivo diretamente dentro do Cloud Shell,
 * roda, e nunca dá `git push` dessa edição. Passo a passo completo:
 *
 * 1. Acesse: https://console.cloud.google.com/cloudshell?project=torneio-challenge
 *
 * 2. Clone o repositório e instale as dependências:
 *
 *   git clone https://github.com/fndcf/bt-challenge.git
 *   cd bt-challenge/backend
 *   npm install
 *   export GCLOUD_PROJECT=torneio-challenge
 *
 * 3. Abra o arquivo no editor de código do Cloud Shell (o Cloud Shell tem
 *    um editor gráfico embutido — clique no ícone de lápis/"Open Editor"
 *    na barra superior, ou rode `cloudshell edit scripts/corrigir-pareamento-superx.ts`).
 *    Também dá para editar via terminal com `nano scripts/corrigir-pareamento-superx.ts`.
 *
 * 4. Dentro do editor, localize a seção "EDITAR AQUI" (mais abaixo neste
 *    mesmo arquivo) e cole os valores reais desta correção:
 *    - ARENA_ID e ETAPA_ID de PRODUÇÃO (pegue no Firestore Console do
 *      projeto de produção — são diferentes dos IDs de staging!)
 *    - PAREAMENTO com as rodadas reais
 *    Salve o arquivo (Ctrl+S no editor gráfico, ou Ctrl+O + Enter + Ctrl+X no nano).
 *
 * 5. Volte ao terminal do Cloud Shell e rode o dry-run primeiro:
 *
 *   npx tsx scripts/corrigir-pareamento-superx.ts --dry-run
 *
 *    Confira a lista de jogadores e a validação do pareamento. Se algum
 *    nome não bater, volte ao editor (passo 3), corrija e rode de novo.
 *
 * 6. Quando o dry-run estiver limpo, rode de verdade:
 *
 *   npx tsx scripts/corrigir-pareamento-superx.ts
 *
 *    Confirme com "s" quando pedir. Ao final, confira na tela de chaves
 *    do app (produção) se as rodadas batem com o pareamento informado.
 *
 * 7. Ao sair, o Cloud Shell descarta o ambiente automaticamente (não é
 *    preciso limpar nada) — e como você nunca deu `git push`, o arquivo
 *    commitado no GitHub continua só com o placeholder.
 * ============================================================
 */

// ============================================================
// EDITAR AQUI
// ============================================================

const ARENA_ID = "COLOQUE_O_ARENA_ID_AQUI";
const ETAPA_ID = "COLOQUE_O_ETAPA_ID_AQUI";

/**
 * Uma "Dupla" é uma tupla com os nomes dos 2 jogadores.
 * Uma "Partida" tem duas duplas se enfrentando.
 * Cada rodada do Super 12 tem 3 partidas (12 jogadores, sem folga).
 * Cada rodada do Super 8 tem 2 partidas (8 jogadores, sem folga).
 *
 * Preencha exatamente como saiu no papel, rodada por rodada.
 * Os nomes precisam bater (ignorando maiúsculas/acentos/espaços extras)
 * com os nomes cadastrados dos jogadores nesta etapa.
 */
type Dupla = [string, string];
type PartidaPapel = { dupla1: Dupla; dupla2: Dupla };
type RodadaPapel = PartidaPapel[];

const PAREAMENTO: RodadaPapel[] = [
  // Rodada 1
  [
    { dupla1: ["Jogador A", "Jogador B"], dupla2: ["Jogador C", "Jogador D"] },
    { dupla1: ["Jogador E", "Jogador F"], dupla2: ["Jogador G", "Jogador H"] },
    { dupla1: ["Jogador I", "Jogador J"], dupla2: ["Jogador K", "Jogador L"] },
  ],
  // Rodada 2
  [
    { dupla1: ["Jogador A", "Jogador C"], dupla2: ["Jogador B", "Jogador D"] },
    { dupla1: ["Jogador E", "Jogador G"], dupla2: ["Jogador F", "Jogador H"] },
    { dupla1: ["Jogador I", "Jogador K"], dupla2: ["Jogador J", "Jogador L"] },
  ],
  // ... continue até a Rodada 11 (Super 12) ou Rodada 7 (Super 8)
];

// ============================================================
// A partir daqui não precisa editar
// ============================================================

import admin from "firebase-admin";
import dotenv from "dotenv";
import path from "path";
import readline from "readline";

const nodeEnv = process.env.NODE_ENV || "development";
if (nodeEnv === "staging") {
  dotenv.config({ path: path.resolve(__dirname, "../.env.staging") });
} else {
  dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
}

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
const Timestamp = admin.firestore.Timestamp;

const DRY_RUN = process.argv.includes("--dry-run");

function normalizar(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function pergunta(texto: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(texto, (resposta) => {
      rl.close();
      resolve(resposta.trim().toLowerCase());
    });
  });
}

interface JogadorEtapa {
  jogadorId: string;
  jogadorNome: string;
  grupoId?: string;
  grupoNome?: string;
}

async function main() {
  console.log(`\n🔧 Corrigir pareamento Super X`);
  console.log(`   Modo: ${DRY_RUN ? "DRY-RUN (nada será alterado)" : "EXECUÇÃO REAL"}`);
  console.log(`   Arena: ${ARENA_ID}`);
  console.log(`   Etapa: ${ETAPA_ID}\n`);

  if (ARENA_ID.startsWith("COLOQUE_") || ETAPA_ID.startsWith("COLOQUE_")) {
    console.error("❌ Preencha ARENA_ID e ETAPA_ID no topo do script antes de rodar.\n");
    process.exit(1);
  }

  // 1. Validar etapa
  const etapaDoc = await db.collection("etapas").doc(ETAPA_ID).get();
  if (!etapaDoc.exists) {
    console.error(`❌ Etapa ${ETAPA_ID} não encontrada.\n`);
    process.exit(1);
  }
  const etapa = etapaDoc.data()!;
  if (etapa.arenaId !== ARENA_ID) {
    console.error(`❌ Etapa ${ETAPA_ID} não pertence à arena ${ARENA_ID}.\n`);
    process.exit(1);
  }
  if (etapa.formato !== "super_x") {
    console.error(`❌ Etapa não é do formato Super X (formato atual: ${etapa.formato}).\n`);
    process.exit(1);
  }
  if (!etapa.chavesGeradas) {
    console.error(`❌ Etapa ainda não teve as chaves geradas — use o fluxo normal do app.\n`);
    process.exit(1);
  }

  const variant = etapa.varianteSuperX as 8 | 12;
  const totalRodadas = variant - 1;
  const partidasPorRodada = variant === 12 ? 3 : 2;
  console.log(`   Formato: Super ${variant} (${totalRodadas} rodadas, ${partidasPorRodada} partidas/rodada)\n`);

  // 2. Buscar jogadores reais da etapa (fonte confiável de jogadorId)
  const statsSnapshot = await db
    .collection("estatisticas_jogador")
    .where("etapaId", "==", ETAPA_ID)
    .get();

  if (statsSnapshot.empty) {
    console.error(`❌ Nenhum jogador encontrado para esta etapa (estatisticas_jogador vazio).\n`);
    process.exit(1);
  }

  const jogadores: JogadorEtapa[] = statsSnapshot.docs.map((doc) => {
    const d = doc.data();
    return {
      jogadorId: d.jogadorId,
      jogadorNome: d.jogadorNome,
      grupoId: d.grupoId,
      grupoNome: d.grupoNome,
    };
  });

  if (jogadores.length !== variant) {
    console.error(
      `❌ Esperado ${variant} jogadores na etapa, encontrado ${jogadores.length}.\n`
    );
    process.exit(1);
  }

  const grupoId = jogadores[0].grupoId;
  const grupoNome = jogadores[0].grupoNome || `Super ${variant}`;
  if (!grupoId) {
    console.error(`❌ Jogadores sem grupoId — chaves parecem não ter sido geradas corretamente.\n`);
    process.exit(1);
  }

  const mapaNomes = new Map<string, JogadorEtapa>();
  for (const j of jogadores) {
    mapaNomes.set(normalizar(j.jogadorNome), j);
  }

  console.log(`   Jogadores da etapa (${jogadores.length}):`);
  jogadores.forEach((j) => console.log(`     - ${j.jogadorNome} (${j.jogadorId})`));
  console.log();

  // 3. Validar PAREAMENTO
  const erros: string[] = [];

  if (PAREAMENTO.length !== totalRodadas) {
    erros.push(
      `PAREAMENTO tem ${PAREAMENTO.length} rodada(s), esperado ${totalRodadas} para Super ${variant}.`
    );
  }

  const contagemParcerias = new Map<string, number>(); // "jogadorId1|jogadorId2" -> vezes que jogaram juntos

  type PartidaResolvida = {
    rodada: number;
    jogador1A: JogadorEtapa;
    jogador1B: JogadorEtapa;
    jogador2A: JogadorEtapa;
    jogador2B: JogadorEtapa;
  };
  const partidasResolvidas: PartidaResolvida[] = [];

  PAREAMENTO.forEach((rodadaPapel, rodadaIndex) => {
    const numeroRodada = rodadaIndex + 1;

    if (rodadaPapel.length !== partidasPorRodada) {
      erros.push(
        `Rodada ${numeroRodada}: tem ${rodadaPapel.length} partida(s), esperado ${partidasPorRodada}.`
      );
    }

    const nomesNaRodada = new Set<string>();

    rodadaPapel.forEach((partida, partidaIndex) => {
      const nomesDaPartida = [...partida.dupla1, ...partida.dupla2];
      const resolvidos: JogadorEtapa[] = [];

      for (const nome of nomesDaPartida) {
        const chave = normalizar(nome);
        const jogador = mapaNomes.get(chave);
        if (!jogador) {
          erros.push(
            `Rodada ${numeroRodada}, partida ${partidaIndex + 1}: jogador "${nome}" não encontrado entre os inscritos da etapa.`
          );
          continue;
        }
        if (nomesNaRodada.has(jogador.jogadorId)) {
          erros.push(
            `Rodada ${numeroRodada}: jogador "${jogador.jogadorNome}" aparece mais de uma vez.`
          );
        }
        nomesNaRodada.add(jogador.jogadorId);
        resolvidos.push(jogador);
      }

      if (resolvidos.length === 4) {
        const [j1A, j1B, j2A, j2B] = resolvidos;
        partidasResolvidas.push({
          rodada: numeroRodada,
          jogador1A: j1A,
          jogador1B: j1B,
          jogador2A: j2A,
          jogador2B: j2B,
        });

        // Rastrear parcerias (dupla1 e dupla2) para aviso de repetição
        const par1 = [j1A.jogadorId, j1B.jogadorId].sort().join("|");
        const par2 = [j2A.jogadorId, j2B.jogadorId].sort().join("|");
        contagemParcerias.set(par1, (contagemParcerias.get(par1) || 0) + 1);
        contagemParcerias.set(par2, (contagemParcerias.get(par2) || 0) + 1);
      }
    });

    if (nomesNaRodada.size !== variant) {
      erros.push(
        `Rodada ${numeroRodada}: ${nomesNaRodada.size} jogador(es) únicos, esperado ${variant} (todos devem jogar em toda rodada).`
      );
    }
  });

  if (erros.length > 0) {
    console.error(`❌ ${erros.length} erro(s) encontrado(s) no PAREAMENTO:\n`);
    erros.forEach((e) => console.error(`   - ${e}`));
    console.error(`\nCorrija a seção PAREAMENTO no topo do script e rode novamente.\n`);
    process.exit(1);
  }

  // Aviso (não bloqueia): parcerias repetidas
  const parceriasRepetidas = [...contagemParcerias.entries()].filter(([, count]) => count > 1);
  if (parceriasRepetidas.length > 0) {
    console.warn(`⚠️  Aviso: ${parceriasRepetidas.length} parceria(s) se repetem mais de uma vez no PAREAMENTO informado.`);
    console.warn(`   Isso é só um alerta — se foi assim no papel, pode seguir normalmente.\n`);
  }

  console.log(`✅ PAREAMENTO validado: ${partidasResolvidas.length} partidas em ${totalRodadas} rodadas.\n`);

  if (DRY_RUN) {
    console.log(`Modo --dry-run: nada foi alterado. Rode sem essa flag para aplicar.\n`);
    process.exit(0);
  }

  // 4. Buscar partidas existentes (erradas) para apagar
  const partidasExistentesSnapshot = await db
    .collection("partidas_rei_da_praia")
    .where("etapaId", "==", ETAPA_ID)
    .where("arenaId", "==", ARENA_ID)
    .get();

  const partidasComResultado = partidasExistentesSnapshot.docs.filter(
    (doc) => doc.data().status === "finalizada"
  );
  if (partidasComResultado.length > 0) {
    console.error(
      `❌ ${partidasComResultado.length} partida(s) já têm resultado lançado. Este script não sobrescreve resultados — ` +
        `apague os resultados antes ou ajuste o script manualmente.\n`
    );
    process.exit(1);
  }

  console.log(`   Partidas atuais (a apagar): ${partidasExistentesSnapshot.size}`);
  console.log(`   Partidas novas (a criar): ${partidasResolvidas.length}\n`);

  const confirmar = await pergunta(
    `⚠️  Isso vai APAGAR ${partidasExistentesSnapshot.size} partida(s) e criar ${partidasResolvidas.length} nova(s). Confirma? (s/n): `
  );
  if (confirmar !== "s") {
    console.log("Cancelado.\n");
    process.exit(0);
  }

  // 5. Apagar partidas antigas
  if (!partidasExistentesSnapshot.empty) {
    const batchDelete = db.batch();
    partidasExistentesSnapshot.docs.forEach((doc) => batchDelete.delete(doc.ref));
    await batchDelete.commit();
    console.log(`   ✅ ${partidasExistentesSnapshot.size} partida(s) antiga(s) apagada(s).`);
  }

  // 6. Criar partidas novas
  const batchCreate = db.batch();
  const novosIds: string[] = [];
  const now = Timestamp.now();

  for (const p of partidasResolvidas) {
    const docRef = db.collection("partidas_rei_da_praia").doc();
    novosIds.push(docRef.id);

    batchCreate.set(docRef, {
      id: docRef.id,
      etapaId: ETAPA_ID,
      arenaId: ARENA_ID,
      fase: "grupos",
      grupoId,
      grupoNome,
      rodada: p.rodada,
      jogador1AId: p.jogador1A.jogadorId,
      jogador1ANome: p.jogador1A.jogadorNome,
      jogador1BId: p.jogador1B.jogadorId,
      jogador1BNome: p.jogador1B.jogadorNome,
      dupla1Nome: `${p.jogador1A.jogadorNome} & ${p.jogador1B.jogadorNome}`,
      jogador2AId: p.jogador2A.jogadorId,
      jogador2ANome: p.jogador2A.jogadorNome,
      jogador2BId: p.jogador2B.jogadorId,
      jogador2BNome: p.jogador2B.jogadorNome,
      dupla2Nome: `${p.jogador2A.jogadorNome} & ${p.jogador2B.jogadorNome}`,
      status: "agendada",
      setsDupla1: 0,
      setsDupla2: 0,
      criadoEm: now,
      atualizadoEm: now,
    });
  }

  await batchCreate.commit();
  console.log(`   ✅ ${novosIds.length} partida(s) nova(s) criada(s).`);

  // 7. Atualizar grupo com os novos IDs de partida
  await db.collection("grupos").doc(grupoId).update({
    partidas: novosIds,
    totalPartidas: novosIds.length,
    partidasFinalizadas: 0,
    completo: false,
    atualizadoEm: now,
  });
  console.log(`   ✅ Grupo ${grupoId} atualizado com as novas partidas.`);

  console.log(`\n✅ Pareamento corrigido com sucesso!\n`);
  process.exit(0);
}

main().catch((error) => {
  console.error("\n❌ Erro:", error.message);
  process.exit(1);
});
