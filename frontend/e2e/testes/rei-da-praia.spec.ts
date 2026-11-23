/**
 * Rei da Praia: chaves, resultados (duplas rotativas), eliminatória e encerramento
 */

import {
  test,
  expect,
  nomeUnico,
  criarEtapa,
  individuais,
  resolverEmpates,
  jogarEliminatoria,
} from "../apoio/fixtures";
import { abrirChaves, clicarEConfirmar, confirmarComPalavra } from "../apoio/telas";

type Ate = "inscricoes" | "chaves" | "grupos" | "eliminatoria" | "final";

/** 8 jogadores = 2 grupos de 4 (3 partidas cada) */
async function etapaReiDaPraia(api, demo, ate: Ate) {
  const etapa = await criarEtapa(
    api,
    { nome: nomeUnico("E2E RDP"), formato: "rei_da_praia", tipoChaveamento: "melhores_com_melhores" },
    demo.jogadores.masculinos.slice(0, 8)
  );
  if (ate === "inscricoes") return etapa;
  if (ate === "chaves") {
    await api.post(`/etapas/${etapa.id}/rei-da-praia/gerar-chaves`);
    return etapa;
  }
  await individuais(api, etapa, "rei-da-praia", 1);
  await resolverEmpates(api, etapa);
  if (ate === "grupos") return etapa;
  await api.post(`/etapas/${etapa.id}/rei-da-praia/gerar-eliminatoria`, { classificadosPorGrupo: 2 });
  if (ate === "eliminatoria") return etapa;
  await jogarEliminatoria(api, etapa, "rei-da-praia/confrontos");
  return etapa;
}

test.describe("Rei da Praia", () => {
  test("gera as chaves com grupos de 4 jogadores", async ({ page, api, demo }) => {
    const etapa = await etapaReiDaPraia(api, demo, "inscricoes");

    await page.goto(`/admin/etapas/${etapa.id}`);
    await clicarEConfirmar(page, "Gerar Chaves");

    await page.getByRole("tab", { name: /Chaves/ }).click();
    await expect(page.getByRole("table", { name: "Classificação do Grupo A" })).toBeVisible();
    await expect(page.getByRole("table", { name: "Classificação do Grupo B" })).toBeVisible();
    // Classificação individual: 4 jogadores por grupo
    await expect(
      page.getByRole("table", { name: "Classificação do Grupo A" }).getByRole("rowgroup").last().getByRole("row")
    ).toHaveCount(4);
  });

  test("lança os resultados do grupo e pontua os jogadores", async ({ page, api, demo }) => {
    const etapa = await etapaReiDaPraia(api, demo, "chaves");

    await abrirChaves(page, etapa.id);
    await page.getByRole("button", { name: "Registrar Resultados" }).first().click();
    const modal = page.getByRole("dialog", { name: /Grupo A/ });
    const partidas = modal.getByRole("article");
    await expect(partidas).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      await partidas.nth(i).getByRole("spinbutton").nth(0).fill("6");
      await partidas.nth(i).getByRole("spinbutton").nth(1).fill(String(i + 1));
    }
    await modal.getByRole("button", { name: "Salvar Resultados (3)" }).click();
    await expect(modal).toBeHidden();

    const tabela = page.getByRole("table", { name: "Classificação do Grupo A" });
    await expect(page.getByText("3 / 3 partidas").first()).toBeVisible();
    // Todo jogador jogou as 3 partidas: soma de vitórias e derrotas = 3
    await expect(tabela.getByRole("cell", { name: /^(3-0|2-1|1-2|0-3)$/ })).toHaveCount(4);
  });

  test("gera a eliminatória com o chaveamento da etapa", async ({ page, api, demo }) => {
    const etapa = await etapaReiDaPraia(api, demo, "grupos");

    await abrirChaves(page, etapa.id);
    await page.getByRole("tab", { name: "Eliminatória" }).click();
    await page.getByRole("button", { name: /Gerar (Fase )?Eliminatória/ }).click();
    const dialogo = page.getByRole("dialog");
    if (await dialogo.isVisible()) {
      await dialogo.getByRole("button", { name: /Gerar/ }).click();
    }

    await expect(page.getByText("Melhores com Melhores")).toBeVisible();
    await expect(page.getByRole("button", { name: "Registrar Resultado" }).first()).toBeVisible();
  });

  test("encerra a etapa depois da final", async ({ page, api, demo }) => {
    const etapa = await etapaReiDaPraia(api, demo, "final");

    await abrirChaves(page, etapa.id);
    await page.getByRole("tab", { name: "Eliminatória" }).click();
    await page.getByRole("button", { name: "Encerrar Etapa" }).click();
    await confirmarComPalavra(page, "ENCERRAR", "Encerrar Etapa");

    await expect(page.getByRole("main").getByText("Finalizada", { exact: true }).first()).toBeVisible();
  });
});
