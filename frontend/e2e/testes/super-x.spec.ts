/**
 * Super X: chaves (grupo único), resultados por rodada e encerramento sem eliminatória
 */

import { test, expect, nomeUnico, criarEtapa, individuais } from "../apoio/fixtures";
import { abrirChaves, clicarEConfirmar, confirmarComPalavra } from "../apoio/telas";

async function etapaSuperX(api, demo, ate: "inscricoes" | "chaves" | "completa") {
  const etapa = await criarEtapa(
    api,
    { nome: nomeUnico("E2E SX"), formato: "super_x", varianteSuperX: 8 },
    demo.jogadores.masculinos.slice(16, 24)
  );
  if (ate === "inscricoes") return etapa;
  if (ate === "chaves") {
    await api.post(`/etapas/${etapa.id}/super-x/gerar-chaves`);
    return etapa;
  }
  await individuais(api, etapa, "super-x", 1);
  return etapa;
}

test.describe("Super X", () => {
  test("gera as chaves em grupo único de 8 jogadores", async ({ page, api, demo }) => {
    const etapa = await etapaSuperX(api, demo, "inscricoes");

    await page.goto(`/admin/etapas/${etapa.id}`);
    await clicarEConfirmar(page, "Gerar Chaves");

    await page.getByRole("tab", { name: /Chaves/ }).click();
    await expect(page.getByRole("heading", { name: "Super 8" }).first()).toBeVisible();
    await expect(page.getByText("8 jogadores • 7 rodadas • 14 partidas")).toBeVisible();
  });

  test("lança resultados de uma rodada e atualiza a classificação", async ({ page, api, demo }) => {
    const etapa = await etapaSuperX(api, demo, "chaves");

    await abrirChaves(page, etapa.id);
    await page.getByRole("button", { name: "Registrar Resultados" }).click();
    const modal = page.getByRole("dialog");
    const partidas = modal.getByRole("article");
    await expect(partidas).toHaveCount(14);
    // Rodada 1: 2 partidas
    for (let i = 0; i < 2; i++) {
      await partidas.nth(i).getByRole("spinbutton").nth(0).fill("6");
      await partidas.nth(i).getByRole("spinbutton").nth(1).fill("3");
    }
    await modal.getByRole("button", { name: "Salvar Resultados (2)" }).click();
    await expect(modal).toBeHidden();

    await expect(page.getByText("2 / 14 partidas")).toBeVisible();
    // 4 jogadores venceram a rodada (3 pontos cada)
    await expect(page.getByRole("table").getByRole("cell", { name: "1-0", exact: true })).toHaveCount(4);
  });

  test("encerra a etapa sem fase eliminatória", async ({ page, api, demo }) => {
    const etapa = await etapaSuperX(api, demo, "completa");

    await abrirChaves(page, etapa.id);
    await expect(page.getByRole("tab", { name: "Eliminatória" })).toHaveCount(0);
    await page.getByRole("button", { name: "Encerrar Etapa" }).click();
    await confirmarComPalavra(page, "ENCERRAR", "Encerrar Etapa");

    await expect(page.getByRole("main").getByText("Finalizada", { exact: true }).first()).toBeVisible();
  });
});
