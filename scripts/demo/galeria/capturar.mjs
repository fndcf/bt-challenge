/**
 * Tira os prints da galeria da Home (frontend/public/screenshots/*.webp)
 * a partir dos dados do semear.mjs. Usa o Chrome instalado.
 *
 *   node scripts/demo/galeria/capturar.mjs [pasta-de-saida] [filtro]
 *
 * filtro: só os prints cujo nome contém o texto (para refazer um).
 */

import { readFileSync, mkdirSync, writeFileSync } from "fs";
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";
import { TELAS } from "./telas.mjs";

const require = createRequire(import.meta.url);
const { PORTAS, ADMIN, ARENA } = require("../config.cjs");
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const { chromium } = require(path.join(raiz, "frontend/node_modules/playwright-core"));

const FRONT = `http://127.0.0.1:${PORTAS.front}`;
const SAIDA = path.resolve(process.argv[2] ?? path.join(raiz, "frontend/public/screenshots"));
const FILTRO = process.argv[3] ?? "";

const { etapas } = JSON.parse(
  readFileSync(new URL("../galeria.dados.json", import.meta.url), "utf8")
);

const TAMANHOS = {
  computador: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 },
  celular: {
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
};

/** PNG → WebP pelo próprio Chrome (sem dependência de imagem) */
async function paraWebp(pagina, png) {
  const base64 = await pagina.evaluate(async (dados) => {
    const imagem = new Image();
    imagem.src = `data:image/png;base64,${dados}`;
    await imagem.decode();
    const canvas = document.createElement("canvas");
    canvas.width = imagem.width;
    canvas.height = imagem.height;
    canvas.getContext("2d").drawImage(imagem, 0, 0);
    return canvas.toDataURL("image/webp", 0.85).split(",")[1];
  }, png.toString("base64"));
  return Buffer.from(base64, "base64");
}

async function entrar(pagina) {
  await pagina.goto(`${FRONT}/login`);
  await pagina.getByLabel("Email").fill(ADMIN.email);
  await pagina.getByLabel("Senha", { exact: true }).fill(ADMIN.senha);
  await pagina.getByRole("button", { name: "Entrar" }).click();
  await pagina.waitForURL("**/admin**");
}

/** Espera a tela assentar: sem rede pendente e sem "Carregando" */
async function assentar(pagina) {
  await pagina.waitForLoadState("networkidle");
  await pagina
    .waitForFunction(() => !document.body.innerText.includes("Carregando"), null, { timeout: 15000 })
    .catch(() => {});
  await pagina.waitForTimeout(400);
}

async function main() {
  mkdirSync(SAIDA, { recursive: true });
  const navegador = await chromium.launch({ channel: "chrome", args: ["--lang=pt-BR"] });
  const contexto = {
    etapas,
    arena: ARENA.slug,
    jogadorId: null,
  };
  const falhas = [];

  for (const [tamanho, opcoes] of Object.entries(TAMANHOS)) {
    const telas = TELAS.filter(
      (t) => (t.tamanho ?? "computador") === tamanho && t.arquivo.includes(FILTRO)
    );
    if (!telas.length) continue;

    const ctx = await navegador.newContext({ ...opcoes, locale: "pt-BR" });
    // Esconde o aviso de emulador do Firebase
    await ctx.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        const estilo = document.createElement("style");
        estilo.textContent = ".firebase-emulator-warning { display: none !important; }";
        document.head.appendChild(estilo);
      });
    });
    const pagina = await ctx.newPage();
    await entrar(pagina);

    for (const tela of telas) {
      try {
        await pagina.goto(FRONT + tela.rota(contexto));
        await assentar(pagina);
        if (tela.antes) {
          await tela.antes(pagina, contexto);
          await assentar(pagina);
        }
        const png = await pagina.screenshot({ fullPage: tela.inteira ?? false });
        writeFileSync(path.join(SAIDA, `${tela.arquivo}.webp`), await paraWebp(pagina, png));
        console.log(`ok  ${tela.arquivo}`);
      } catch (erro) {
        falhas.push(tela.arquivo);
        console.log(`ERRO ${tela.arquivo}: ${erro.message.split("\n")[0]}`);
      }
    }
    await ctx.close();
  }

  await navegador.close();
  if (falhas.length) {
    console.log(`\n${falhas.length} falharam: ${falhas.join(", ")}`);
    process.exit(1);
  }
}

main();
