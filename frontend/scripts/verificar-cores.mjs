/**
 * Catraca de cores fixas e botões feitos à mão
 *
 * Regra (docs/ARCHITECTURE.md): cores vêm de styles/ (theme.semantic) e
 * botões de components/ui/. O código antigo ainda tem muitas violações e
 * migra aos poucos (docs/PLANO_DESIGN.md), então esta verificação não exige
 * zero: ela compara com a linha de base e falha só se algum arquivo PIORAR.
 *
 * - Arquivo novo: não pode ter cor fixa nem styled.button.
 * - Arquivo existente: a contagem não pode aumentar. Diminuir é bem-vindo.
 *
 * Uso:
 *   npm run lint:cores               verifica (CI)
 *   npm run lint:cores -- --atualizar   regrava a linha de base depois de migrar
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = fileURLToPath(new URL("..", import.meta.url));
const PASTA_CODIGO = join(RAIZ, "src");
const ARQUIVO_BASE = join(RAIZ, "scripts", "baseline-cores.json");

// Onde cor fixa é permitida (definição dos tokens) ou irrelevante (testes)
const IGNORAR = [/^src\/styles\//, /\/__tests__\//, /\.test\.tsx?$/];

const REGRAS = {
  hex: {
    regex: /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g,
    descricao: "cor hex fixa (use theme.semantic.* — docs/MAPA_CORES.md)",
  },
  styledButton: {
    regex: /styled\.button\b/g,
    descricao: "styled.button próprio (use o Button de components/ui/)",
  },
};

const listarArquivos = (pasta) =>
  readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) return listarArquivos(caminho);
    return /\.tsx?$/.test(nome) ? [caminho] : [];
  });

const contar = () => {
  const contagem = {};
  for (const caminho of listarArquivos(PASTA_CODIGO)) {
    const arquivo = relative(RAIZ, caminho).split(sep).join("/");
    if (IGNORAR.some((padrao) => padrao.test(arquivo))) continue;

    const conteudo = readFileSync(caminho, "utf8");
    const porRegra = {};
    for (const [nome, { regex }] of Object.entries(REGRAS)) {
      const total = (conteudo.match(regex) || []).length;
      if (total > 0) porRegra[nome] = total;
    }
    if (Object.keys(porRegra).length > 0) contagem[arquivo] = porRegra;
  }
  return contagem;
};

const ordenar = (objeto) =>
  Object.fromEntries(Object.keys(objeto).sort().map((chave) => [chave, objeto[chave]]));

const atual = contar();

if (process.argv.includes("--atualizar")) {
  writeFileSync(ARQUIVO_BASE, JSON.stringify(ordenar(atual), null, 2) + "\n");
  const totais = Object.keys(REGRAS).map(
    (regra) => `${regra}: ${Object.values(atual).reduce((s, c) => s + (c[regra] || 0), 0)}`
  );
  console.log(`Linha de base atualizada (${totais.join(", ")}).`);
  process.exit(0);
}

if (!existsSync(ARQUIVO_BASE)) {
  console.error("Linha de base não encontrada. Rode: npm run lint:cores -- --atualizar");
  process.exit(1);
}

const base = JSON.parse(readFileSync(ARQUIVO_BASE, "utf8"));
const pioras = [];
const melhoras = [];

for (const [arquivo, contagem] of Object.entries(atual)) {
  for (const [regra, total] of Object.entries(contagem)) {
    const antes = base[arquivo]?.[regra] ?? 0;
    if (total > antes) pioras.push({ arquivo, regra, antes, total });
  }
}
for (const [arquivo, contagem] of Object.entries(base)) {
  for (const [regra, antes] of Object.entries(contagem)) {
    const total = atual[arquivo]?.[regra] ?? 0;
    if (total < antes) melhoras.push({ arquivo, regra, antes, total });
  }
}

if (pioras.length > 0) {
  console.error("Cores fixas / botões próprios aumentaram:\n");
  for (const { arquivo, regra, antes, total } of pioras) {
    console.error(`  ${arquivo}: ${REGRAS[regra].descricao} — ${antes} → ${total}`);
  }
  console.error(
    "\nUse os tokens de styles/semantic.ts e os componentes de components/ui/." +
      "\nRegras: docs/ARCHITECTURE.md > \"Cores por funcao\". Mapa: docs/MAPA_CORES.md."
  );
  process.exit(1);
}

if (melhoras.length > 0) {
  console.log(`Migração avançou em ${melhoras.length} item(ns). Para registrar, rode:`);
  console.log("  npm run lint:cores -- --atualizar\n");
}
console.log("Cores e botões: nenhum arquivo piorou.");
