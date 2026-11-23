/**
 * Cadastro de jogadores: criar, validar, editar, buscar e excluir
 */

import { test, expect, nomeUnico } from "../apoio/fixtures";

const cartao = (page, nome: string) =>
  page.getByRole("article").filter({ has: page.getByRole("heading", { name: nome }) });

async function cadastrar(page, nome: string, opcoes: { nivel?: string; genero?: string } = {}) {
  await page.goto("/admin/jogadores/novo");
  await page.getByRole("textbox", { name: /^Nome Completo/ }).fill(nome);
  await page.getByRole("textbox", { name: "Telefone" }).fill("(11) 91234-5678");
  if (opcoes.genero) await page.getByRole("combobox", { name: /^Gênero/ }).selectOption(opcoes.genero);
  if (opcoes.nivel) await page.getByRole("combobox", { name: /^Nível/ }).selectOption(opcoes.nivel);
  await page.getByRole("button", { name: "Cadastrar Jogador" }).click();
}

async function buscar(page, nome: string) {
  await page.goto("/admin/jogadores");
  await page.getByRole("textbox", { name: "Buscar jogador" }).fill(nome);
}

test.describe("Cadastro de jogador", () => {
  test("cadastra jogador e ele aparece na lista com nível e gênero", async ({ page }) => {
    const nome = nomeUnico("Jogadora Teste");
    await cadastrar(page, nome, { genero: "Feminino", nivel: "Avançado" });

    await expect(page).toHaveURL(/\/admin\/jogadores$/);
    await buscar(page, nome);
    const card = cartao(page, nome);
    await expect(card).toBeVisible();
    await expect(card).toContainText("Avançado");
    await expect(card).toContainText("F");
  });

  test("não cadastra sem nome", async ({ page }) => {
    await page.goto("/admin/jogadores/novo");
    await page.getByRole("button", { name: "Cadastrar Jogador" }).click();

    await expect(page).toHaveURL(/\/admin\/jogadores\/novo$/);
  });

  test("avisa quando o nome já existe na arena", async ({ page, demo }) => {
    const existente = demo.jogadores.masculinos[0].nome;
    await cadastrar(page, existente);

    await expect(page.getByText(/já existe/i)).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/jogadores\/novo$/);
  });
});

test.describe("Edição e exclusão", () => {
  test("edita o nível do jogador", async ({ page, api }) => {
    const jogador = await api.post("/jogadores", {
      nome: nomeUnico("Editar Nivel"),
      genero: "masculino",
      nivel: "iniciante",
    });

    await page.goto(`/admin/jogadores/${jogador.id}/editar`);
    await page.getByRole("combobox", { name: /^Nível/ }).selectOption("Avançado");
    await page.getByRole("button", { name: "Salvar Alterações" }).click();

    await buscar(page, jogador.nome);
    await expect(cartao(page, jogador.nome)).toContainText("Avançado");
  });

  test("apaga o telefone ao limpar o campo", async ({ page, api }) => {
    const jogador = await api.post("/jogadores", {
      nome: nomeUnico("Limpar Telefone"),
      genero: "masculino",
      nivel: "iniciante",
      telefone: "(11) 95555-4444",
    });

    await page.goto(`/admin/jogadores/${jogador.id}/editar`);
    await page.getByRole("textbox", { name: "Telefone" }).fill("");
    await page.getByRole("button", { name: "Salvar Alterações" }).click();

    await buscar(page, jogador.nome);
    await expect(cartao(page, jogador.nome)).not.toContainText("95555-4444");
  });

  test("exclui jogador sem inscrições", async ({ page, api }) => {
    const jogador = await api.post("/jogadores", {
      nome: nomeUnico("Excluir"),
      genero: "masculino",
      nivel: "iniciante",
    });

    await buscar(page, jogador.nome);
    await page.getByRole("button", { name: `Deletar ${jogador.nome}` }).click();
    const dialogo = page.getByRole("dialog");
    await dialogo.getByRole("button", { name: /Excluir|Deletar|Confirmar/ }).click();

    await expect(cartao(page, jogador.nome)).toHaveCount(0);
  });
});

test.describe("Busca e filtros", () => {
  test("filtra a lista pelo nome", async ({ page, demo }) => {
    const [alvo, outro] = demo.jogadores.femininos;
    await buscar(page, alvo.nome);

    await expect(cartao(page, alvo.nome)).toBeVisible();
    await expect(cartao(page, outro.nome)).toHaveCount(0);
  });

  test("filtra por gênero", async ({ page, demo }) => {
    await page.goto("/admin/jogadores");
    await page.getByRole("combobox", { name: "Gênero" }).selectOption("Feminino");

    await expect(cartao(page, demo.jogadores.femininos[0].nome)).toBeVisible();
    await expect(cartao(page, demo.jogadores.masculinos[1].nome)).toHaveCount(0);
  });
});
