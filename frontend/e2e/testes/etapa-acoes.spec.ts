/**
 * Ações da etapa: empates, substituição, cabeças de chave, duplas e equipes
 * manuais, cancelar eliminatória e apagar chaves
 */

import {
  test,
  expect,
  nomeUnico,
  criarEtapa,
  individuais,
  duplaFixaGrupos,
  duplaFixaEliminatoria,
} from "../apoio/fixtures";
import { abrirChaves, confirmarComPalavra } from "../apoio/telas";

const dfBase = { formato: "dupla_fixa", tipoFormacaoDupla: "balanceado", jogadoresPorGrupo: 3 };

test.describe("Empates", () => {
  test("resolve empate na classificação por sorteio", async ({ page, api, demo }) => {
    const etapa = await criarEtapa(
      api,
      { nome: nomeUnico("E2E Empate"), formato: "rei_da_praia", genero: "feminino" },
      demo.jogadores.femininos.slice(0, 8)
    );
    // Todos os jogos 6x4: empates nos dois grupos
    await individuais(api, etapa, "rei-da-praia", 1, true);

    await abrirChaves(page, etapa.id);
    const resolver = page.getByRole("button", { name: "Resolver" });
    await expect(resolver).toHaveCount(2);
    await resolver.first().click();
    const modal = page.getByRole("dialog", { name: /Empate no Grupo/ });
    await modal.getByRole("button", { name: "Sortear" }).click();
    // Mostra a ordem sorteada
    const resultado = page.getByRole("dialog", { name: /Resultado do sorteio/ });
    await expect(resultado.getByText("2º")).toBeVisible();
    await resultado.getByRole("button", { name: "Fechar", exact: true }).click();

    await expect(resolver).toHaveCount(1);
  });
});

test.describe("Substituição", () => {
  test("troca um inscrito por outro jogador antes dos jogos", { tag: "@p1" }, async ({ page, api, demo }) => {
    const sai = demo.jogadores.masculinos[0];
    const entra = demo.jogadores.masculinos[20];
    const etapa = await criarEtapa(api, { nome: nomeUnico("E2E Substituir"), ...dfBase }, demo.jogadores.masculinos.slice(0, 12));
    await api.post(`/etapas/${etapa.id}/gerar-chaves`);

    await page.goto(`/admin/etapas/${etapa.id}`);
    await page.getByRole("button", { name: "Substituir Jogador" }).click();
    const modal = page.getByRole("dialog", { name: "Substituir Jogador" });
    await modal.getByRole("button", { name: new RegExp(`^${sai.nome}`) }).click();
    await modal.getByRole("button", { name: new RegExp(`^${entra.nome}`) }).click();
    await modal.getByRole("button", { name: "Confirmar Substituição" }).click();
    await expect(modal).toBeHidden();

    await page.getByRole("tab", { name: /Inscrições/ }).click();
    await expect(page.getByRole("main").getByText(entra.nome).first()).toBeVisible();
    await expect(page.getByRole("main").getByText(sai.nome)).toHaveCount(0);
  });
});

test.describe("Cabeças de chave", () => {
  test("escolhe cabeças de chave e a escolha fica salva", { tag: "@p1" }, async ({ page, api, demo }) => {
    const jogadores = demo.jogadores.masculinos.slice(0, 16);
    const etapa = await criarEtapa(api, { nome: nomeUnico("E2E Cabeças"), ...dfBase, maxJogadores: 16 }, jogadores);
    await page.goto(`/admin/etapas/${etapa.id}`);
    await page.getByRole("tab", { name: "Cabeças de Chave" }).click();
    // Lista paginada (12 por página): dois avançados da página aberta
    const avancados = page.getByRole("checkbox", { name: /Avançado$/ });
    const nomeDe = async (i: number) =>
      (await avancados.nth(i).ariaSnapshot()).match(/"(.+) Avançado"/)![1];
    const c1 = await nomeDe(0);
    await avancados.nth(0).check();
    await avancados.nth(1).check();
    await page.getByRole("button", { name: "Adicionar Selecionados" }).click();
    await expect(page.getByText("2 / 4 selecionado(s)")).toBeVisible();

    await page.reload();
    await page.getByRole("tab", { name: "Cabeças de Chave" }).click();
    await expect(page.getByText("2 / 4 selecionado(s)")).toBeVisible();
    await expect(page.getByRole("main").getByText(c1).first()).toBeVisible();
  });
});

test.describe("Formação manual", () => {
  test("monta as duplas manualmente e gera as chaves", { tag: "@p1" }, async ({ page, api, demo }) => {
    const jogadoras = demo.jogadores.femininos.slice(0, 6);
    const etapa = await criarEtapa(
      api,
      { nome: nomeUnico("E2E Duplas Manuais"), formato: "dupla_fixa", tipoFormacaoDupla: "manual", jogadoresPorGrupo: 3, genero: "feminino" },
      jogadoras
    );

    await page.goto(`/admin/etapas/${etapa.id}`);
    await page.getByRole("tab", { name: "Duplas Manuais" }).click();
    for (const j of jogadoras) {
      await page.getByRole("button", { name: new RegExp(`^${j.nome}`) }).filter({ visible: true }).first().click();
    }
    await page.getByRole("button", { name: "Confirmar Duplas e Gerar Chaves" }).click();
    const dialogo = page.getByRole("dialog");
    if (await dialogo.isVisible()) await dialogo.getByRole("button", { name: /Confirmar|Gerar/ }).click();

    await page.getByRole("tab", { name: /Chaves/ }).click();
    await expect(page.getByRole("table", { name: "Classificação do Grupo A" })).toBeVisible();
  });

  test("monta as equipes manualmente", { tag: "@p1" }, async ({ page, api, demo }) => {
    const jogadores = demo.jogadores.masculinos.slice(0, 8);
    const etapa = await criarEtapa(
      api,
      { nome: nomeUnico("E2E Equipes Manuais"), formato: "teams", varianteTeams: 4, tipoFormacaoEquipe: "manual", tipoFormacaoJogos: "sorteio" },
      jogadores
    );

    await page.goto(`/admin/etapas/${etapa.id}`);
    await page.getByRole("button", { name: "Gerar Equipes" }).click();
    const modal = page.getByRole("dialog", { name: "Formar Equipes Manualmente" });
    for (const j of jogadores) {
      await modal.getByRole("button", { name: new RegExp(`^${j.nome}`) }).filter({ visible: true }).first().click();
    }
    await modal.getByRole("button", { name: "Formar Equipes" }).click();
    await expect(modal).toBeHidden();

    await page.getByRole("tab", { name: /Chaves/ }).click();
    await expect(page.getByRole("heading", { name: /^Equipe 2/ })).toBeVisible();
  });
});

test.describe("Desfazer", () => {
  test("cancela a eliminatória e volta a poder gerá-la", { tag: "@p1" }, async ({ page, api, demo }) => {
    const etapa = await criarEtapa(api, { nome: nomeUnico("E2E Cancelar Elim"), ...dfBase }, demo.jogadores.masculinos.slice(0, 12));
    await duplaFixaGrupos(api, etapa);
    await duplaFixaEliminatoria(api, etapa, 0);

    await abrirChaves(page, etapa.id);
    await page.getByRole("tab", { name: "Eliminatória" }).click();
    await page.getByRole("button", { name: "Cancelar Eliminatória" }).click();
    await confirmarComPalavra(page, "CANCELAR", "Cancelar Eliminatória");

    await expect(page.getByRole("button", { name: "Gerar Fase Eliminatória" })).toBeVisible();
  });

  test("apaga as chaves e volta a poder gerá-las", { tag: "@p1" }, async ({ page, api, demo }) => {
    const etapa = await criarEtapa(api, { nome: nomeUnico("E2E Apagar Chaves"), ...dfBase }, demo.jogadores.masculinos.slice(0, 12));
    await api.post(`/etapas/${etapa.id}/gerar-chaves`);

    await page.goto(`/admin/etapas/${etapa.id}`);
    await page.getByRole("button", { name: "Apagar Chaves" }).click();
    await confirmarComPalavra(page, "EXCLUIR", /Apagar|Excluir/);

    await expect(page.getByRole("button", { name: "Gerar Chaves" })).toBeVisible();
  });
});
