/**
 * Script para recalcular os pontos de ranking de etapas Rei da Praia já
 * finalizadas, corrigindo o bug em que jogadores que jogaram a fase de
 * grupos mas não avançaram para a eliminatória ficavam sem receber nem
 * os pontos de participação.
 *
 * Causa raiz (já corrigida em src/services/EtapaService.ts): o cálculo de
 * pontos do Rei da Praia dependia da collection "duplas", que só recebe
 * registro de quem chega na fase eliminatória — jogadores só-de-grupo
 * nunca entravam no cálculo e ficavam com pontos = 0.
 *
 * Este script varre as etapas Rei da Praia já finalizadas de uma arena,
 * recalcula a colocação/pontuação correta de cada jogador (mesma lógica
 * do encerrarEtapa já corrigido) e só GRAVA o que realmente mudou —
 * jogadores que já estavam com a pontuação certa não sofrem nenhuma
 * escrita.
 *
 * IMPORTANTE: este arquivo, como está commitado no repositório, é só o
 * MECANISMO — a seção "EDITAR AQUI" abaixo fica sempre com placeholder.
 * O ARENA_ID de cada correção é preenchido localmente na hora de rodar e
 * NUNCA deve ser commitado.
 *
 * ============================================================
 * COMO USAR EM STAGING (ambiente de teste)
 * ============================================================
 * 1. Preencha ARENA_ID na seção "EDITAR AQUI" abaixo (pegue no Firestore
 *    Console do projeto de staging, collection "arenas").
 *
 * 2. Rode em modo de verificação primeiro (não altera nada):
 *
 *   cd backend
 *   npx ts-node scripts/corrigir-pontos-rei-da-praia.ts --dry-run
 *
 *   Revisa a lista: etapas afetadas, jogadores que vão mudar de pontuação
 *   e para qual valor. Etapas sem fase eliminatória finalizada são
 *   puladas com aviso (não bloqueiam as demais).
 *
 * 3. Quando a lista estiver conferida, rode de verdade:
 *
 *   npx ts-node scripts/corrigir-pontos-rei-da-praia.ts
 *
 *   Vai pedir confirmação (s/n) antes de gravar qualquer coisa.
 *
 * 4. Depois de rodar, desfaça a edição local (git checkout do arquivo) para
 *    não deixar o ARENA_ID pendurado no seu working tree.
 *
 * ============================================================
 * COMO USAR EM PRODUÇÃO (via Google Cloud Shell)
 * ============================================================
 * Mesmo fluxo do script corrigir-pareamento-superx.ts:
 *
 * 1. Acesse: https://console.cloud.google.com/cloudshell?project=torneio-challenge
 * 2. git clone https://github.com/fndcf/bt-challenge.git && cd bt-challenge/backend
 * 3. git checkout develop  (ou main, se já estiver lá)
 * 4. npm install && export GCLOUD_PROJECT=torneio-challenge
 * 5. Edite o arquivo (cloudshell edit scripts/corrigir-pontos-rei-da-praia.ts
 *    ou nano), preencha ARENA_ID de produção, salve.
 * 6. npx tsx scripts/corrigir-pontos-rei-da-praia.ts --dry-run
 * 7. Confira a saída, e se estiver ok: npx tsx scripts/corrigir-pontos-rei-da-praia.ts
 * ============================================================
 */

// ============================================================
// EDITAR AQUI
// ============================================================

const ARENA_ID = "COLOQUE_O_ARENA_ID_AQUI";

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

const DRY_RUN = process.argv.includes("--dry-run");

function pergunta(texto: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(texto, (resposta) => {
      rl.close();
      resolve(resposta.trim().toLowerCase());
    });
  });
}

interface Pontuacao {
  campeao: number;
  vice: number;
  semifinalista: number;
  quartas: number;
  oitavas: number;
  participacao: number;
}

interface Etapa {
  id: string;
  nome: string;
  arenaId: string;
  formato: string;
  status: string;
  contaPontosRanking?: boolean;
}

interface ConfrontoEliminatorio {
  id: string;
  fase: string;
  status: string;
  dupla1Id?: string;
  dupla2Id?: string;
  vencedoraId?: string;
  vencedoraNome?: string;
}

interface Dupla {
  id: string;
  jogador1Id: string;
  jogador1Nome: string;
  jogador2Id: string;
  jogador2Nome: string;
}

interface EstatisticaJogador {
  id: string;
  jogadorId: string;
  jogadorNome: string;
  pontos?: number;
  colocacao?: string;
}

async function buscarConfrontosPorFase(
  etapaId: string,
  arenaId: string,
  fase: string
): Promise<ConfrontoEliminatorio[]> {
  const snapshot = await db
    .collection("confrontos_eliminatorios")
    .where("etapaId", "==", etapaId)
    .where("arenaId", "==", arenaId)
    .where("fase", "==", fase)
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ConfrontoEliminatorio));
}

async function buscarDupla(duplaId: string): Promise<Dupla | null> {
  const doc = await db.collection("duplas").doc(duplaId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Dupla;
}

interface JogadorRecalculado {
  estatisticaId: string;
  jogadorNome: string;
  pontos: number;
  colocacao: string;
  pontosAtuais: number;
  colocacaoAtual: string;
}

/**
 * Recalcula a colocação/pontuação correta de cada jogador de uma etapa
 * Rei da Praia — mesma lógica do cenário REI_DA_PRAIA em EtapaService.encerrarEtapa.
 */
async function calcularPontosCorretos(
  etapa: Etapa,
  pontuacao: Pontuacao
): Promise<{
  pulada: boolean;
  motivo?: string;
  corretos: JogadorRecalculado[];
}> {
  const confrontosFinais = await buscarConfrontosPorFase(etapa.id, etapa.arenaId, "final");
  const confrontoFinal = confrontosFinais.find((c) => c.status === "finalizada");

  if (!confrontoFinal) {
    return { pulada: true, motivo: "sem fase eliminatória finalizada", corretos: [] };
  }

  const [confrontosSemi, confrontosQuartas, confrontosOitavas, statsSnapshot] = await Promise.all([
    buscarConfrontosPorFase(etapa.id, etapa.arenaId, "semifinal"),
    buscarConfrontosPorFase(etapa.id, etapa.arenaId, "quartas"),
    buscarConfrontosPorFase(etapa.id, etapa.arenaId, "oitavas"),
    db
      .collection("estatisticas_jogador")
      .where("etapaId", "==", etapa.id)
      .where("arenaId", "==", etapa.arenaId)
      .get(),
  ]);

  const todosJogadores: EstatisticaJogador[] = statsSnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as EstatisticaJogador)
  );

  if (todosJogadores.length === 0) {
    return { pulada: true, motivo: "nenhum jogador em estatisticas_jogador", corretos: [] };
  }

  const duplaColocacoes = new Map<string, { pontos: number; colocacao: string }>();

  const campeaoDuplaId = confrontoFinal.vencedoraId;
  if (campeaoDuplaId) {
    duplaColocacoes.set(campeaoDuplaId, { pontos: pontuacao.campeao, colocacao: "campeao" });
  }
  const viceDuplaId =
    confrontoFinal.dupla1Id === campeaoDuplaId ? confrontoFinal.dupla2Id : confrontoFinal.dupla1Id;
  if (viceDuplaId) {
    duplaColocacoes.set(viceDuplaId, { pontos: pontuacao.vice, colocacao: "vice" });
  }

  for (const confronto of confrontosSemi.filter((c) => c.status === "finalizada")) {
    const perdedorId = confronto.vencedoraId === confronto.dupla1Id ? confronto.dupla2Id : confronto.dupla1Id;
    if (perdedorId && !duplaColocacoes.has(perdedorId)) {
      duplaColocacoes.set(perdedorId, { pontos: pontuacao.semifinalista, colocacao: "semifinalista" });
    }
  }
  for (const confronto of confrontosQuartas.filter((c) => c.status === "finalizada")) {
    const perdedorId = confronto.vencedoraId === confronto.dupla1Id ? confronto.dupla2Id : confronto.dupla1Id;
    if (perdedorId && !duplaColocacoes.has(perdedorId)) {
      duplaColocacoes.set(perdedorId, { pontos: pontuacao.quartas, colocacao: "quartas" });
    }
  }
  for (const confronto of confrontosOitavas.filter((c) => c.status === "finalizada")) {
    const perdedorId = confronto.vencedoraId === confronto.dupla1Id ? confronto.dupla2Id : confronto.dupla1Id;
    if (perdedorId && !duplaColocacoes.has(perdedorId)) {
      duplaColocacoes.set(perdedorId, { pontos: pontuacao.oitavas, colocacao: "oitavas" });
    }
  }

  const duplaIds = Array.from(duplaColocacoes.keys());
  const duplasResolvidas = await Promise.all(duplaIds.map((id) => buscarDupla(id)));

  const jogadorColocacoes = new Map<string, { pontos: number; colocacao: string }>();
  for (const dupla of duplasResolvidas) {
    if (!dupla) continue;
    const info = duplaColocacoes.get(dupla.id);
    if (!info) continue;
    jogadorColocacoes.set(dupla.jogador1Id, info);
    jogadorColocacoes.set(dupla.jogador2Id, info);
  }

  const corretos = todosJogadores.map((jogador) => {
    const info = jogadorColocacoes.get(jogador.jogadorId);
    return {
      estatisticaId: jogador.id,
      jogadorNome: jogador.jogadorNome,
      pontos: info?.pontos ?? pontuacao.participacao,
      colocacao: info?.colocacao ?? "participacao",
      pontosAtuais: jogador.pontos ?? 0,
      colocacaoAtual: jogador.colocacao ?? "(nenhuma)",
    };
  });

  return { pulada: false, corretos };
}

async function main() {
  console.log(`\n🔧 Corrigir pontos de ranking — etapas Rei da Praia`);
  console.log(`   Modo: ${DRY_RUN ? "DRY-RUN (nada será alterado)" : "EXECUÇÃO REAL"}`);
  console.log(`   Arena: ${ARENA_ID}\n`);

  if (ARENA_ID.startsWith("COLOQUE_")) {
    console.error("❌ Preencha ARENA_ID no topo do script antes de rodar.\n");
    process.exit(1);
  }

  const configDoc = await db.collection("config").doc("global").get();
  if (!configDoc.exists) {
    console.error("❌ Configuração global (config/global) não encontrada.\n");
    process.exit(1);
  }
  const pontuacao: Pontuacao = configDoc.data()!.pontuacaoColocacao;
  console.log("   Pontuação configurada:", pontuacao, "\n");

  const etapasSnapshot = await db
    .collection("etapas")
    .where("arenaId", "==", ARENA_ID)
    .where("formato", "==", "rei_da_praia")
    .where("status", "==", "finalizada")
    .get();

  const etapas: Etapa[] = etapasSnapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() } as Etapa))
    .filter((etapa) => etapa.contaPontosRanking !== false);

  console.log(`   Etapas Rei da Praia finalizadas (que contam ranking): ${etapas.length}\n`);

  if (etapas.length === 0) {
    console.log("Nenhuma etapa para verificar.\n");
    process.exit(0);
  }

  type Correcao = {
    etapaId: string;
    etapaNome: string;
    estatisticaId: string;
    jogadorNome: string;
    pontosAtuais: number;
    colocacaoAtual: string;
    pontosCorretos: number;
    colocacaoCorreta: string;
  };
  const correcoes: Correcao[] = [];
  const puladas: Array<{ etapa: Etapa; motivo: string }> = [];

  for (const etapa of etapas) {
    const resultado = await calcularPontosCorretos(etapa, pontuacao);

    if (resultado.pulada) {
      puladas.push({ etapa, motivo: resultado.motivo! });
      continue;
    }

    for (const jogador of resultado.corretos) {
      const precisaCorrigir =
        jogador.pontosAtuais !== jogador.pontos || jogador.colocacaoAtual !== jogador.colocacao;

      if (precisaCorrigir) {
        correcoes.push({
          etapaId: etapa.id,
          etapaNome: etapa.nome,
          estatisticaId: jogador.estatisticaId,
          jogadorNome: jogador.jogadorNome,
          pontosAtuais: jogador.pontosAtuais,
          colocacaoAtual: jogador.colocacaoAtual,
          pontosCorretos: jogador.pontos,
          colocacaoCorreta: jogador.colocacao,
        });
      }
    }
  }

  if (puladas.length > 0) {
    console.log(`⚠️  ${puladas.length} etapa(s) pulada(s):`);
    puladas.forEach(({ etapa, motivo }) => console.log(`   - ${etapa.nome} (${etapa.id}): ${motivo}`));
    console.log();
  }

  if (correcoes.length === 0) {
    console.log("✅ Nenhuma correção necessária — todas as etapas já estão com os pontos corretos.\n");
    process.exit(0);
  }

  console.log(`📋 ${correcoes.length} correção(ões) encontrada(s):\n`);
  let etapaAtual = "";
  for (const c of correcoes) {
    if (c.etapaNome !== etapaAtual) {
      etapaAtual = c.etapaNome;
      console.log(`\n  ${c.etapaNome} (${c.etapaId}):`);
    }
    console.log(
      `    - ${c.jogadorNome}: ${c.pontosAtuais}pts (${c.colocacaoAtual}) → ${c.pontosCorretos}pts (${c.colocacaoCorreta})`
    );
  }
  console.log();

  if (DRY_RUN) {
    console.log(`\nModo --dry-run: nada foi alterado. Rode sem essa flag para aplicar.\n`);
    process.exit(0);
  }

  const confirmar = await pergunta(
    `\n⚠️  Isso vai corrigir ${correcoes.length} registro(s) de pontuação em ${new Set(correcoes.map((c) => c.etapaId)).size} etapa(s). Confirma? (s/n): `
  );
  if (confirmar !== "s") {
    console.log("Cancelado.\n");
    process.exit(0);
  }

  const BATCH_SIZE = 400;
  let totalCorrigido = 0;
  for (let i = 0; i < correcoes.length; i += BATCH_SIZE) {
    const lote = correcoes.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    for (const c of lote) {
      batch.update(db.collection("estatisticas_jogador").doc(c.estatisticaId), {
        pontos: c.pontosCorretos,
        colocacao: c.colocacaoCorreta,
        atualizadoEm: admin.firestore.Timestamp.now(),
      });
    }
    await batch.commit();
    totalCorrigido += lote.length;
    console.log(`   ✅ ${totalCorrigido}/${correcoes.length} corrigido(s)...`);
  }

  console.log(`\n✅ Correção concluída! ${totalCorrigido} registro(s) de pontuação atualizados.\n`);
  process.exit(0);
}

main().catch((error) => {
  console.error("\n❌ Erro:", error.message);
  process.exit(1);
});
