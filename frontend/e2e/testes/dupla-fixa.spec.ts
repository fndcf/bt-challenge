/**
 * Dupla Fixa do começo ao fim: gerar chaves, lançar resultados dos grupos,
 * gerar eliminatória, resultado de confronto e encerrar com campeão.
 *
 * Cada teste prepara a etapa pela API até o passo anterior e faz o passo
 * testado pela tela.
 */

import {
  test,
  expect,
  nomeUnico,
  criarEtapa,
  duplaFixaGrupos,
  duplaFixaEliminatoria,
  jogarEliminatoria,
} from "../apoio/fixtures";
import { abrirChaves, clicarEConfirmar, confirmarComPalavra } from "../apoio/telas";

type Ate = "inscricoes" | "chaves" | "grupos" | "eliminatoria" | "final";

/** 12 jogadores = 6 duplas = 2 grupos de 3; eliminatória começa na semifinal */
async function etapaDuplaFixa(api, demo, ate: Ate) {
  const etapa = await criarEtapa(
    api,
    { nome: nomeUnico("E2E DF"), formato: "dupla_fixa", tipoFormacaoDupla: "balanceado", jogadoresPorGrupo: 3 },
    demo.jogadores.masculinos.slice(0, 12)
  );
  if (ate === "inscricoes") return etapa;
  if (ate === "chaves") {
    await api.post(`/etapas/${etapa.id}/gerar-chaves`);
    return etapa;
  }
  await duplaFixaGrupos(api, etapa);
  if (ate === "grupos") return etapa;
  await duplaFixaEliminatoria(api, etapa, 0);
  if (ate === "eliminatoria") return etapa;
  await jogarEliminatoria(api, etapa, "confrontos-eliminatorios");
  return etapa;
}

test.describe("Dupla Fixa", { tag: "@smoke" }, () => {
  test("gera as chaves com grupos e duplas", async ({ page, api, demo }) => {
    const etapa = await etapaDuplaFixa(api, demo, "inscricoes");

    await page.goto(`/admin/etapas/${etapa.id}`);
    await clicarEConfirmar(page, "Gerar Chaves");

    await page.getByRole("tab", { name: /Chaves/ }).click();
    await expect(page.getByRole("table", { name: "Classificação do Grupo A" })).toBeVisible();
    await expect(page.getByRole("table", { name: "Classificação do Grupo B" })).toBeVisible();
  });

  test("lança os resultados de um grupo e atualiza a classificação", async ({ page, api, demo }) => {
    const etapa = await etapaDuplaFixa(api, demo, "chaves");

    await abrirChaves(page, etapa.id);
    await page.getByRole("button", { name: "Registrar Resultados" }).first().click();
    const modal = page.getByRole("dialog", { name: /Registrar Resultados - Grupo A/ });
    const partidas = modal.getByRole("article");
    // Grupo de 3 duplas: 3 partidas (esperar o modal carregar antes de contar)
    const total = 3;
    await expect(partidas).toHaveCount(total);
    for (let i = 0; i < total; i++) {
      await partidas.nth(i).getByRole("spinbutton").nth(0).fill("6");
      await partidas.nth(i).getByRole("spinbutton").nth(1).fill(String(i + 1));
    }
    await modal.getByRole("button", { name: `Salvar Resultados (${total})` }).click();
    await expect(modal).toBeHidden();

    const tabela = page.getByRole("table", { name: "Classificação do Grupo A" });
    // 3 duplas, 3 partidas: alguém venceu as duas
    await expect(tabela.getByRole("row").filter({ hasText: "2-0" })).toHaveCount(1);
    await expect(page.getByText(`${total} / ${total} partidas`).first()).toBeVisible();
  });

  test("gera a fase eliminatória com os classificados", async ({ page, api, demo }) => {
    const etapa = await etapaDuplaFixa(api, demo, "grupos");

    await abrirChaves(page, etapa.id);
    await page.getByRole("tab", { name: "Eliminatória" }).click();
    await page.getByRole("button", { name: "Gerar Fase Eliminatória" }).click();

    await expect(page.getByRole("heading", { name: "Semifinal" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Registrar Resultado" })).toHaveCount(2);
  });

  test("registra o resultado de um confronto da eliminatória", async ({ page, api, demo }) => {
    const etapa = await etapaDuplaFixa(api, demo, "eliminatoria");

    await abrirChaves(page, etapa.id);
    await page.getByRole("tab", { name: "Eliminatória" }).click();
    const confronto = page.getByRole("article").filter({ hasText: "CONFRONTO 1" }).first();
    await confronto.getByRole("button", { name: "Registrar Resultado" }).click();
    const modal = page.getByRole("dialog");
    await modal.getByRole("spinbutton").nth(0).fill("6");
    await modal.getByRole("spinbutton").nth(1).fill("3");
    await modal.getByRole("button", { name: /Salvar/ }).click();
    await expect(modal).toBeHidden();

    await expect(confronto).toContainText("Finalizada");
    await expect(confronto.getByRole("img", { name: "Vencedor" })).toBeVisible();
  });

  test("encerra a etapa depois da final", async ({ page, api, demo }) => {
    const etapa = await etapaDuplaFixa(api, demo, "final");

    await abrirChaves(page, etapa.id);
    await page.getByRole("tab", { name: "Eliminatória" }).click();
    await page.getByRole("button", { name: "Encerrar Etapa" }).click();
    await confirmarComPalavra(page, "ENCERRAR", "Encerrar Etapa");

    await expect(page.getByRole("main").getByText("Finalizada", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Encerrar Etapa" })).toHaveCount(0);
  });
});
