/**
 * Ações de tela repetidas entre os testes
 */

import { Page, expect } from "@playwright/test";

/** Data (AAAA-MM-DD) em São Paulo, relativa a hoje: valor de input type=date */
export const dataLocal = (deslocamento = 0) => {
  const data = new Date(Date.now() + deslocamento * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(data);
};

export interface FormEtapa {
  formato: "Dupla Fixa" | "Rei da Praia" | "Super X" | "Teams";
  nome: string;
  genero?: "Masculino" | "Feminino" | "Misto";
}

/** Abre "Criar Etapa" e preenche formato, nome, gênero e datas válidas */
export async function preencherNovaEtapa(page: Page, { formato, nome, genero }: FormEtapa) {
  await page.goto("/admin/etapas/criar");
  await page.getByRole("radio", { name: new RegExp(`^${formato}`) }).check();
  await page.getByRole("textbox", { name: /^Nome da Etapa/ }).fill(nome);
  if (genero) await page.getByRole("combobox", { name: /^Gênero da Etapa/ }).selectOption(genero);
  await page.getByRole("textbox", { name: /^Início das Inscrições/ }).fill(dataLocal(0));
  await page.getByRole("textbox", { name: /^Fim das Inscrições/ }).fill(dataLocal(7));
  await page.getByRole("textbox", { name: /^Data de Realização/ }).fill(dataLocal(14));
}

/** Abre a etapa no admin, já na aba de chaves */
export async function abrirChaves(page: Page, etapaId: string) {
  await page.goto(`/admin/etapas/${etapaId}`);
  await page.getByRole("tab", { name: /Chaves/ }).click();
}

/** Clica e confirma no diálogo que abrir (mesmo nome no botão de confirmar) */
export async function clicarEConfirmar(page: Page, botao: string | RegExp, confirmar = botao) {
  await page.getByRole("button", { name: botao }).first().click();
  const dialogo = page.getByRole("dialog");
  await expect(dialogo).toBeVisible();
  await dialogo.getByRole("button", { name: confirmar }).click();
  await expect(dialogo).toBeHidden();
}

/** Confirmação destrutiva (ConfirmacaoAcao): digita a palavra e confirma */
export async function confirmarComPalavra(page: Page, palavra: string, botao: string | RegExp) {
  const dialogo = page.getByRole("dialog");
  await dialogo.getByRole("textbox").fill(palavra);
  await dialogo.getByRole("button", { name: botao }).click();
  await expect(dialogo).toBeHidden();
}

/** Preenche o placar de uma partida no modal de resultados */
export async function preencherPlacar(
  page: Page,
  lado1: string,
  games1: number,
  lado2: string,
  games2: number,
  partida = 0
) {
  const dialogo = page.getByRole("dialog");
  await dialogo.getByRole("spinbutton", { name: `Games de ${lado1}` }).nth(partida).fill(String(games1));
  await dialogo.getByRole("spinbutton", { name: `Games de ${lado2}` }).nth(partida).fill(String(games2));
}
