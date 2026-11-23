/**
 * Inscrições: inscrever, cancelar, cadastrar novo no modal, gênero e encerrar
 */

import { test, expect, nomeUnico, criarEtapa, dia } from "../apoio/fixtures";
import { clicarEConfirmar } from "../apoio/telas";

const etapaAberta = (api, extra = {}) =>
  criarEtapa(api, {
    nome: nomeUnico("E2E Inscrições"),
    formato: "dupla_fixa",
    tipoFormacaoDupla: "balanceado",
    jogadoresPorGrupo: 3,
    maxJogadores: 8,
    dataFim: dia(7),
    dataRealizacao: dia(9),
    ...extra,
  });

/** Linha do inscrito na aba Inscrições (checkbox com o nome do jogador) */
const inscrito = (page, nome: string) =>
  page.getByRole("main").getByRole("checkbox", { name: new RegExp(`^${nome}`) });

async function abrirModal(page, etapaId: string) {
  await page.goto(`/admin/etapas/${etapaId}`);
  await page.getByRole("button", { name: "Inscrever Jogador" }).click();
  return page.getByRole("dialog", { name: "Inscrever Jogadores" });
}

test.describe("Inscrições", () => {
  test("inscreve jogadores pelo modal", async ({ page, api, demo }) => {
    const etapa = await etapaAberta(api);
    const [a, b] = demo.jogadores.masculinos;

    const modal = await abrirModal(page, etapa.id);
    await modal.getByRole("checkbox", { name: new RegExp(`^${a.nome}`) }).check();
    await modal.getByRole("checkbox", { name: new RegExp(`^${b.nome}`) }).check();
    await modal.getByRole("button", { name: /^Inscrever/ }).click();

    await expect(modal).toBeHidden();
    await expect(page.getByRole("tab", { name: /Inscrições\s*2/ })).toBeVisible();
    await expect(inscrito(page, a.nome)).toBeVisible();
  });

  test("lista só jogadores do gênero da etapa", async ({ page, api, demo }) => {
    const etapa = await etapaAberta(api, { genero: "feminino" });

    const modal = await abrirModal(page, etapa.id);

    await expect(modal.getByRole("checkbox", { name: new RegExp(`^${demo.jogadores.femininos[0].nome}`) })).toBeVisible();
    await expect(modal.getByRole("checkbox", { name: new RegExp(`^${demo.jogadores.masculinos[0].nome}`) })).toHaveCount(0);
  });

  test("cadastra um jogador novo e já inscreve", { tag: "@p1" }, async ({ page, api }) => {
    const etapa = await etapaAberta(api);
    const nome = nomeUnico("Novo Pelo Modal");

    const modal = await abrirModal(page, etapa.id);
    await modal.getByRole("tab", { name: "Cadastrar Novo" }).click();
    await modal.getByRole("textbox", { name: /^Nome/ }).fill(nome);
    await modal.getByRole("combobox", { name: /^Nível/ }).selectOption({ index: 1 });
    await modal.getByRole("button", { name: "Cadastrar Jogador" }).click();

    // Volta para a seleção, com o jogador novo na lista
    await modal.getByRole("searchbox", { name: "Buscar jogador" }).fill(nome);
    await modal.getByRole("checkbox", { name: new RegExp(`^${nome}`) }).check();
    await modal.getByRole("button", { name: /^Inscrever/ }).click();

    await expect(inscrito(page, nome)).toBeVisible();
  });

  test("cancela uma inscrição", async ({ page, api, demo }) => {
    const [a, b] = demo.jogadores.masculinos;
    const etapa = await etapaAberta(api);
    await api.post(`/etapas/${etapa.id}/inscrever-lote`, { jogadorIds: [a.id, b.id] });

    await page.goto(`/admin/etapas/${etapa.id}`);
    await clicarEConfirmar(page, `Cancelar inscrição de ${a.nome}`, "Excluir Inscrição");

    await expect(inscrito(page, a.nome)).toHaveCount(0);
    await expect(inscrito(page, b.nome)).toBeVisible();
  });

  test("encerra as inscrições e libera gerar chaves", async ({ page, api, demo }) => {
    const etapa = await etapaAberta(api, { maxJogadores: 8 });
    await api.post(`/etapas/${etapa.id}/inscrever-lote`, {
      jogadorIds: demo.jogadores.masculinos.slice(0, 6).map((j) => j.id),
    });

    await page.goto(`/admin/etapas/${etapa.id}`);
    await clicarEConfirmar(page, "Encerrar Inscrições", /Encerrar|Confirmar/);

    await expect(page.getByRole("button", { name: "Gerar Chaves" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Inscrever Jogador" })).toHaveCount(0);
  });
});
