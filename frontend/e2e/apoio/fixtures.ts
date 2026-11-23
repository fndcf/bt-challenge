/**
 * `test` dos E2E com dois extras:
 *
 * - api: cliente da API já logado como admin da Arena Demo. Use para
 *   PREPARAR o cenário (criar etapa, gerar chaves, lançar resultados);
 *   a ação que o teste verifica é sempre feita pela tela.
 * - demo: ids dos jogadores e etapas criados pelo semear.mjs.
 *
 * Regra: teste que altera dados cria a própria etapa (nome único);
 * as etapas da Arena Demo são só para leitura.
 */

import { readFileSync } from "fs";
import { test as base, expect } from "@playwright/test";
import {
  Cliente,
  config,
  criarEtapa,
  dia,
  duplaFixaEliminatoria,
  duplaFixaGrupos,
  individuais,
  jogarEliminatoria,
  placar,
  resolverEmpates,
  teamsConfrontos,
} from "../../../scripts/demo/dados.mjs";
import { ARQUIVO_DADOS } from "../../../scripts/demo/semear.mjs";

export interface JogadorDemo {
  id: string;
  nome: string;
  nivel: string;
}

export interface DadosDemo {
  etapas: Record<string, string>;
  jogadores: { masculinos: JogadorDemo[]; femininos: JogadorDemo[] };
}

interface Extras {
  api: Cliente;
  demo: DadosDemo;
}

export const test = base.extend<Extras>({
  // Esconde o aviso fixo de emulador do Firebase: no celular ele cobre botões
  context: async ({ context }, usar) => {
    await context.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        const estilo = document.createElement("style");
        estilo.textContent = ".firebase-emulator-warning { display: none !important; }";
        document.head.appendChild(estilo);
      });
    });
    await usar(context);
  },
  // eslint-disable-next-line no-empty-pattern
  api: async ({}, usar) => {
    usar(await new Cliente().entrar());
  },
  // eslint-disable-next-line no-empty-pattern
  demo: async ({}, usar) => {
    usar(JSON.parse(readFileSync(ARQUIVO_DADOS, "utf8")));
  },
});

export { expect };

/** Nome único por teste (dados não colidem entre execuções paralelas) */
export const nomeUnico = (prefixo: string) =>
  `${prefixo} ${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;

export const ADMIN = config.ADMIN;
export const ARENA = config.ARENA;

export {
  criarEtapa,
  dia,
  duplaFixaEliminatoria,
  duplaFixaGrupos,
  individuais,
  jogarEliminatoria,
  placar,
  resolverEmpates,
  teamsConfrontos,
};
