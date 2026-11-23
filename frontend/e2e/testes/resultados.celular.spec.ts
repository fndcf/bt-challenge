/**
 * No celular (393 x 852): lançar resultados, menu do admin e página pública
 * sem rolagem lateral
 */

import { test, expect, nomeUnico, criarEtapa, ARENA } from "../apoio/fixtures";
import { abrirChaves } from "../apoio/telas";
import { SEM_SESSAO } from "../apoio/sessao";

/** A página não pode rolar para o lado (o chaveamento rola por dentro) */
const semRolagemLateral = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

test.describe("Admin no celular", () => {
  test("lança os resultados de um grupo pelo celular", async ({ page, api, demo }) => {
    const etapa = await criarEtapa(
      api,
      { nome: nomeUnico("E2E Celular"), formato: "dupla_fixa", tipoFormacaoDupla: "balanceado", jogadoresPorGrupo: 3 },
      demo.jogadores.masculinos.slice(0, 12)
    );
    await api.post(`/etapas/${etapa.id}/gerar-chaves`);

    await abrirChaves(page, etapa.id);
    await page.getByRole("button", { name: "Registrar Resultados" }).first().click();
    const modal = page.getByRole("dialog");
    const partidas = modal.getByRole("article");
    await expect(partidas).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      await partidas.nth(i).getByRole("spinbutton").nth(0).fill("6");
      await partidas.nth(i).getByRole("spinbutton").nth(1).fill("4");
    }
    await modal.getByRole("button", { name: "Salvar Resultados (3)" }).click();
    await expect(modal).toBeHidden();

    await expect(page.getByText("3 / 3 partidas").first()).toBeVisible();
    expect(await semRolagemLateral(page)).toBe(true);
  });

  test("navega pelo menu do admin", { tag: "@p1" }, async ({ page }) => {
    await page.goto("/admin");
    await page.getByRole("button", { name: "Abrir menu" }).click();
    await page.getByRole("navigation").getByRole("link", { name: "Jogadores", exact: true }).click();

    await expect(page.getByRole("heading", { name: "Jogadores" })).toBeVisible();
    expect(await semRolagemLateral(page)).toBe(true);
  });
});

test.describe("Página pública no celular", () => {
  test.use({ storageState: SEM_SESSAO });

  test("etapa pública cabe na largura do celular", async ({ page, demo }) => {
    await page.goto(`/arena/${ARENA.slug}/etapa/${demo.etapas.duplaFixaEncerrada}`);

    await expect(page.getByRole("heading", { name: "Chaveamento Eliminatório" })).toBeVisible();
    expect(await semRolagemLateral(page)).toBe(true);
  });

  test("ranking cabe na largura do celular", async ({ page }) => {
    await page.goto(`/arena/${ARENA.slug}`);

    await expect(page.getByRole("heading", { name: "Ranking Masculino" })).toBeVisible();
    expect(await semRolagemLateral(page)).toBe(true);
  });
});
