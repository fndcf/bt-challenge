/**
 * Teams: gerar equipes, resultado do confronto, escalação manual,
 * renomear equipe e encerrar
 */

import { test, expect, nomeUnico, criarEtapa, teamsConfrontos } from "../apoio/fixtures";
import { abrirChaves, clicarEConfirmar, confirmarComPalavra } from "../apoio/telas";

/** 8 jogadores = 2 equipes de 4 = 1 confronto de 2 jogos */
async function etapaTeams(api, demo, ate: "inscricoes" | "equipes" | "completa", jogos = "sorteio") {
  const etapa = await criarEtapa(
    api,
    {
      nome: nomeUnico("E2E Teams"),
      formato: "teams",
      varianteTeams: 4,
      tipoFormacaoEquipe: "balanceado",
      tipoFormacaoJogos: jogos,
    },
    demo.jogadores.masculinos.slice(0, 8)
  );
  if (ate === "inscricoes") return etapa;
  await teamsConfrontos(api, etapa, ate === "completa" ? 1 : 0, jogos);
  return etapa;
}

test.describe("Teams", () => {
  test("gera as equipes e o confronto", async ({ page, api, demo }) => {
    const etapa = await etapaTeams(api, demo, "inscricoes");

    await page.goto(`/admin/etapas/${etapa.id}`);
    await clicarEConfirmar(page, "Gerar Equipes", /Gerar/);

    await page.getByRole("tab", { name: /Chaves/ }).click();
    await expect(page.getByRole("heading", { name: /^Equipe 1/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Equipe 2/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Resultados" })).toHaveCount(1);
  });

  test("lança o resultado do confronto e a equipe vencedora pontua", async ({ page, api, demo }) => {
    const etapa = await etapaTeams(api, demo, "equipes");

    await abrirChaves(page, etapa.id);
    await page.getByRole("button", { name: "Resultados" }).click();
    const modal = page.getByRole("dialog");
    const jogos = modal.getByRole("article");
    await expect(jogos).toHaveCount(2);
    for (let i = 0; i < 2; i++) {
      await jogos.nth(i).getByRole("spinbutton").nth(0).fill("6");
      await jogos.nth(i).getByRole("spinbutton").nth(1).fill("2");
    }
    await modal.getByRole("button", { name: "Salvar Resultados (2)" }).click();
    await expect(modal).toBeHidden();

    // Vitória no confronto = 3 pontos; placar de jogos 2 x 0
    await expect(page.getByRole("table").getByRole("cell", { name: "3", exact: true }).first()).toBeVisible();
    await expect(page.getByRole("table").getByRole("cell", { name: "1-0", exact: true })).toHaveCount(1);
  });

  test("define os jogadores de um jogo na formação manual", { tag: "@p1" }, async ({ page, api, demo }) => {
    const etapa = await etapaTeams(api, demo, "equipes", "manual");

    await abrirChaves(page, etapa.id);
    await page.getByRole("button", { name: "Ver Partidas" }).click();
    await page.getByRole("button", { name: "Definir Jogadores" }).first().click();
    const modal = page.getByRole("dialog");
    const caixas = modal.getByRole("checkbox");
    await expect(caixas).toHaveCount(8);
    for (const i of [0, 1, 4, 5]) await caixas.nth(i).check();
    await modal.getByRole("button", { name: "Confirmar" }).click();
    await expect(modal).toBeHidden();

    await expect(page.getByRole("button", { name: "Definir Jogadores" })).toHaveCount(1);
  });

  test("renomeia uma equipe", { tag: "@p1" }, async ({ page, api, demo }) => {
    const etapa = await etapaTeams(api, demo, "equipes");
    const novoNome = nomeUnico("Tubarões");

    await abrirChaves(page, etapa.id);
    await page.getByRole("button", { name: /Renomear/ }).first().click();
    const campo = page.getByRole("textbox", { name: /nome/i });
    await campo.fill(novoNome);
    await campo.press("Enter");

    await expect(page.getByRole("heading", { name: novoNome })).toBeVisible();
  });

  test("encerra a etapa depois do último confronto", async ({ page, api, demo }) => {
    const etapa = await etapaTeams(api, demo, "completa");

    await abrirChaves(page, etapa.id);
    await page.getByRole("button", { name: "Encerrar Etapa" }).click();
    await confirmarComPalavra(page, "ENCERRAR", "Encerrar Etapa");

    await expect(page.getByRole("main").getByText("Finalizada", { exact: true }).first()).toBeVisible();
  });
});
