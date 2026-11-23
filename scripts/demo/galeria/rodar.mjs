/**
 * Gera os prints da galeria da Home do zero:
 * emulador separado (demo-galeria) → API → front → dados → prints.
 *
 *   node scripts/demo/galeria/rodar.mjs [filtro]
 *
 * Não usa as portas do emulador do dia a dia; pode rodar com ele ligado.
 * Precisa: firebase-tools, Java, Chrome instalado e as dependências de
 * backend/ e frontend/ instaladas.
 */

import { spawn } from "child_process";
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const { PORTAS, PROJETO } = require("../config.cjs");

const aqui = path.dirname(fileURLToPath(import.meta.url));
const demo = path.resolve(aqui, "..");
const raiz = path.resolve(aqui, "../../..");
const filtro = process.argv[2] ?? "";
const processos = [];

function iniciar(nome, comando, args, opcoes = {}) {
  // Uma linha só: no Windows, npx e firebase precisam do shell
  const linha = [comando, ...args]
    .map((a) => (/\s/.test(a) ? `"${a}"` : a))
    .join(" ");
  const filho = spawn(linha, {
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
    ...opcoes,
    env: { ...process.env, ...opcoes.env },
  });
  let saida = "";
  const guardar = (d) => (saida = (saida + d).slice(-4000));
  filho.stdout.on("data", guardar);
  filho.stderr.on("data", guardar);
  filho.on("exit", (codigo) => {
    if (codigo && !encerrando) console.error(`\n${nome} parou (${codigo}):\n${saida}`);
  });
  processos.push(filho);
  return filho;
}

function rodar(arquivo, args = []) {
  return new Promise((resolver, rejeitar) => {
    const filho = spawn(process.execPath, [arquivo, ...args], {
      stdio: "inherit",
    });
    filho.on("exit", (codigo) =>
      codigo ? rejeitar(new Error(`${arquivo} falhou`)) : resolver()
    );
  });
}

async function esperarUrl(url, nome, segundos = 120) {
  for (let i = 0; i < segundos; i++) {
    try {
      const resposta = await fetch(url);
      if (resposta.status < 500) return;
    } catch {
      // ainda subindo
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`${nome} não respondeu em ${url}`);
}

let encerrando = false;
function encerrar() {
  encerrando = true;
  for (const filho of processos) {
    // shell: true no Windows cria uma árvore; taskkill derruba toda
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(filho.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      filho.kill("SIGTERM");
    }
  }
}

async function main() {
  console.log("Subindo emulador...");
  iniciar("Emulador", "firebase", [
    "emulators:start", "--config", "firebase.galeria.json",
    "--project", PROJETO, "--only", "auth,firestore",
  ], { cwd: demo });
  await esperarUrl(`http://127.0.0.1:${PORTAS.firestore}`, "Firestore");
  await esperarUrl(`http://127.0.0.1:${PORTAS.auth}`, "Auth");

  console.log("Subindo API e front...");
  iniciar("API", process.execPath, [path.join(demo, "api.cjs")]);
  iniciar("Front", "npx", [
    "vite", "--port", String(PORTAS.front), "--host", "127.0.0.1", "--strictPort",
  ], {
    cwd: path.join(raiz, "frontend"),
    env: {
      VITE_USE_EMULATORS: "true",
      VITE_FIREBASE_PROJECT_ID: PROJETO,
      VITE_EMULADOR_AUTH_PORTA: String(PORTAS.auth),
      VITE_EMULADOR_FIRESTORE_PORTA: String(PORTAS.firestore),
      VITE_API_URL: `http://127.0.0.1:${PORTAS.api}/api`,
    },
  });
  await esperarUrl(`http://127.0.0.1:${PORTAS.api}/api/health`, "API");
  await esperarUrl(`http://127.0.0.1:${PORTAS.front}`, "Front");

  console.log("Criando dados...");
  await rodar(path.join(demo, "semear.mjs"));

  console.log("Tirando prints...");
  await rodar(path.join(aqui, "capturar.mjs"), [path.join(raiz, "frontend/public/screenshots"), filtro]);
}

main()
  .catch((erro) => {
    console.error(erro.message);
    process.exitCode = 1;
  })
  .finally(encerrar);
