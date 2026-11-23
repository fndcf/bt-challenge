/**
 * Página pública da arena (sem login): etapas, ranking, etapa e perfil.
 * Confere também que contato do jogador não aparece.
 */

import { test, expect, ARENA } from "../apoio/fixtures";
import { SEM_SESSAO } from "../apoio/sessao";

test.use({ storageState: SEM_SESSAO });

const TELEFONE_DEMO = /\(11\) 9\d{4}-\d{4}/;

test.describe("Página da arena", () => {
  // Outros testes criam etapas na mesma arena ao mesmo tempo: aqui só se
  // confere que a lista aparece, não quais etapas estão na primeira página
  test("mostra as etapas da arena", async ({ page }) => {
    await page.goto(`/arena/${ARENA.slug}`);

    await expect(page.getByRole("heading", { name: ARENA.nome }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Etapas e Torneios" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Ver Detalhes/ }).first()).toBeVisible();
  });

  test("mostra o ranking com quem pontuou na etapa encerrada", async ({ page }) => {
    await page.goto(`/arena/${ARENA.slug}`);

    await expect(page.getByRole("heading", { name: "Ranking Masculino" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ranking Feminino" })).toBeVisible();
    // Abas por nível com a contagem de jogadores
    await expect(page.getByRole("tab", { name: /Avançado/ }).first()).toBeVisible();
    await expect(page.locator('a[href*="/jogador/"]').first()).toBeVisible();
  });

  test("avisa quando a arena não existe", { tag: "@p1" }, async ({ page }) => {
    await page.goto("/arena/arena-que-nao-existe");

    await expect(page.getByText(/não encontrad/i).first()).toBeVisible();
  });
});

test.describe("Etapa pública", () => {
  test("mostra grupos e chaveamento da etapa encerrada", async ({ page, demo }) => {
    await page.goto(`/arena/${ARENA.slug}/etapa/${demo.etapas.duplaFixaEncerrada}`);

    await expect(page.getByRole("heading", { name: "Etapa 1 - Abertura" })).toBeVisible();
    await expect(page.getByText("Finalizada").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Fase de Grupos" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Chaveamento Eliminatório" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Final", exact: true }).first()).toBeVisible();
  });
});

test.describe("Perfil do jogador", () => {
  test("abre pelo ranking e mostra o histórico, sem telefone", async ({ page }) => {
    await page.goto(`/arena/${ARENA.slug}`);
    await page.locator('a[href*="/jogador/"]').first().click();

    await expect(page.getByRole("heading", { name: "Perfil do Jogador" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Histórico de Participações" })).toBeVisible();
    await expect(page.getByText("Etapa 1 - Abertura").first()).toBeVisible();
    await expect(page.getByText(TELEFONE_DEMO)).toHaveCount(0);
  });
});
