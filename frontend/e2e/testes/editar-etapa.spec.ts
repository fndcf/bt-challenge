/**
 * Editar etapa: campos de cada formato (antes de gerar as chaves)
 */

import { test, expect, nomeUnico, criarEtapa, dia } from "../apoio/fixtures";

const abrirEdicao = (page, etapaId: string) => page.goto(`/admin/etapas/${etapaId}/editar`);

async function salvar(page, etapaId: string) {
  await page.getByRole("button", { name: "Salvar Alterações" }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/etapas/${etapaId}$`));
}

const aberta = { dataFim: dia(7), dataRealizacao: dia(9) };

test.describe("Editar etapa", () => {
  test("Dupla Fixa: muda a formação das duplas e liga o grupo único", async ({ page, api }) => {
    const etapa = await criarEtapa(api, {
      nome: nomeUnico("E2E Editar DF"),
      formato: "dupla_fixa",
      tipoFormacaoDupla: "balanceado",
      jogadoresPorGrupo: 3,
      maxJogadores: 12,
      ...aberta,
    });

    await abrirEdicao(page, etapa.id);
    await page.getByRole("combobox", { name: /^Tipo de Formação de Duplas/ }).selectOption("manual");
    await page.getByRole("checkbox", { name: /Grupo único/ }).check();
    await salvar(page, etapa.id);

    // Formação manual libera a aba de duplas manuais
    await expect(page.getByRole("tab", { name: "Duplas Manuais" })).toBeVisible();
    await abrirEdicao(page, etapa.id);
    await expect(page.getByRole("combobox", { name: /^Tipo de Formação de Duplas/ })).toHaveValue("manual");
    await expect(page.getByRole("checkbox", { name: /Grupo único/ })).toBeChecked();
  });

  test("Super X: troca para Super 12 e o número de jogadores acompanha", async ({ page, api }) => {
    const etapa = await criarEtapa(api, {
      nome: nomeUnico("E2E Editar SX"),
      formato: "super_x",
      varianteSuperX: 8,
      maxJogadores: 8,
      ...aberta,
    });

    await abrirEdicao(page, etapa.id);
    await page.getByRole("combobox", { name: /^Variante do Super X/ }).selectOption("12");
    await expect(page.getByRole("spinbutton", { name: /Número Máximo de Jogadores/ })).toHaveValue("12");
    await salvar(page, etapa.id);

    await abrirEdicao(page, etapa.id);
    await expect(page.getByRole("combobox", { name: /^Variante do Super X/ })).toHaveValue("12");
  });

  test("Super X: não volta para Super 8 com mais de 8 inscritos", { tag: "@p1" }, async ({ page, api, demo }) => {
    const etapa = await criarEtapa(
      api,
      { nome: nomeUnico("E2E Editar SX 12"), formato: "super_x", varianteSuperX: 12, maxJogadores: 12, ...aberta },
      demo.jogadores.masculinos.slice(0, 10)
    );

    await abrirEdicao(page, etapa.id);
    await page.getByRole("combobox", { name: /^Variante do Super X/ }).selectOption("8");
    await page.getByRole("button", { name: "Salvar Alterações" }).click();

    await expect(page.getByRole("alert")).toContainText("Super 8 aceita 8 jogadores e a etapa já tem 10 inscritos");
    await expect(page).toHaveURL(/\/editar$/);
  });

  test("Teams: troca variante e formações; o número de jogadores vira múltiplo de 6", async ({ page, api }) => {
    const etapa = await criarEtapa(api, {
      nome: nomeUnico("E2E Editar Teams"),
      formato: "teams",
      varianteTeams: 4,
      tipoFormacaoEquipe: "balanceado",
      tipoFormacaoJogos: "sorteio",
      maxJogadores: 8,
      ...aberta,
    });

    await abrirEdicao(page, etapa.id);
    await page.getByRole("combobox", { name: /^Variante Teams/ }).selectOption("6");
    await expect(page.getByRole("spinbutton", { name: /Número Máximo de Jogadores/ })).toHaveValue("12");
    await page.getByRole("combobox", { name: /^Tipo de Formação de Equipes/ }).selectOption("manual");
    await page.getByRole("combobox", { name: /^Formação das Partidas/ }).selectOption("manual");
    await salvar(page, etapa.id);

    await abrirEdicao(page, etapa.id);
    await expect(page.getByRole("combobox", { name: /^Variante Teams/ })).toHaveValue("6");
    await expect(page.getByRole("combobox", { name: /^Tipo de Formação de Equipes/ })).toHaveValue("manual");
    await expect(page.getByRole("combobox", { name: /^Formação das Partidas/ })).toHaveValue("manual");
  });
});
