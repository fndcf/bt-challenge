/**
 * Criar etapa: caminho feliz dos 4 formatos, validações comuns e regras
 * do formulário de cada formato
 */

import { test, expect, nomeUnico } from "../apoio/fixtures";
import { dataLocal, preencherNovaEtapa } from "../apoio/telas";

type Formato = "Dupla Fixa" | "Rei da Praia" | "Super X" | "Teams";

async function criarEConferir(page, formato: Formato, nome: string) {
  await page.getByRole("button", { name: "Criar Etapa" }).click();

  await expect(page).toHaveURL(/\/admin\/etapas$/);
  const card = page.getByRole("article").filter({ hasText: nome });
  await expect(card).toBeVisible();
  await expect(card).toContainText(formato);
  await expect(card).toContainText("Inscrições Abertas");
}

const preencherDatas = async (page, inicio: number, fim: number, realizacao: number) => {
  await page.getByRole("textbox", { name: /^Início das Inscrições/ }).fill(dataLocal(inicio));
  await page.getByRole("textbox", { name: /^Fim das Inscrições/ }).fill(dataLocal(fim));
  await page.getByRole("textbox", { name: /^Data de Realização/ }).fill(dataLocal(realizacao));
};

test.describe("Criar etapa", { tag: "@smoke" }, () => {
  test("cria etapa de Dupla Fixa", async ({ page }) => {
    const nome = nomeUnico("E2E Dupla Fixa");
    await preencherNovaEtapa(page, { formato: "Dupla Fixa", nome });
    await page.getByRole("combobox", { name: /^Tipo de Formação de Duplas/ }).selectOption("balanceado");

    await criarEConferir(page, "Dupla Fixa", nome);
  });

  test("cria etapa de Rei da Praia", async ({ page }) => {
    const nome = nomeUnico("E2E Rei da Praia");
    await preencherNovaEtapa(page, { formato: "Rei da Praia", nome });

    await criarEConferir(page, "Rei da Praia", nome);
  });

  test("cria etapa Super 8 com melhor de 3 sets", async ({ page }) => {
    const nome = nomeUnico("E2E Super X");
    await preencherNovaEtapa(page, { formato: "Super X", nome });
    await page.getByRole("checkbox", { name: "Partidas melhor de 3 sets" }).check();

    await criarEConferir(page, "Super X", nome);
  });

  test("cria etapa de Teams", async ({ page }) => {
    const nome = nomeUnico("E2E Teams");
    await preencherNovaEtapa(page, { formato: "Teams", nome });

    await criarEConferir(page, "Teams", nome);
  });
});

test.describe("Datas e campos obrigatórios", () => {
  test.beforeEach(async ({ page }) => {
    await preencherNovaEtapa(page, { formato: "Dupla Fixa", nome: nomeUnico("E2E Validação") });
  });

  const invalidas = [
    { nome: "fim antes do início", d: [5, 2, 10], erro: "Data fim deve ser após a data de início" },
    { nome: "realização antes do fim", d: [0, 7, 3], erro: "Data de realização deve ser após o fim das inscrições" },
    { nome: "realização no passado", d: [-10, -5, -2], erro: "Data de realização não pode ser anterior a hoje" },
  ];

  for (const { nome, d, erro } of invalidas) {
    test(`bloqueia a criação com ${nome}`, { tag: "@p1" }, async ({ page }) => {
      await preencherDatas(page, d[0], d[1], d[2]);

      await expect(page.getByText(erro)).toBeVisible();
      await expect(page.getByRole("button", { name: "Criar Etapa" })).toBeDisabled();
    });
  }

  test("não cria sem nome", async ({ page }) => {
    await page.getByRole("textbox", { name: /^Nome da Etapa/ }).fill("");
    await page.getByRole("button", { name: "Criar Etapa" }).click();

    await expect(page).toHaveURL(/\/admin\/etapas\/criar$/);
  });
});

test.describe("Regras de cada formato", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/etapas/criar");
  });

  test("Rei da Praia pede o chaveamento da eliminatória; Dupla Fixa não", { tag: "@p1" }, async ({ page }) => {
    const chaveamento = page.getByRole("radio", { name: /^Melhores com Melhores/ });
    await expect(chaveamento).toHaveCount(0);

    await page.getByRole("radio", { name: /^Rei da Praia/ }).check();

    await expect(chaveamento).toBeVisible();
    await expect(page.getByRole("radio", { name: /^Sorteio Aleatório/ })).toBeVisible();
  });

  test("Super 12 ajusta a prévia e não pede número de jogadores", { tag: "@p1" }, async ({ page }) => {
    await page.getByRole("radio", { name: /^Super X/ }).check();
    await expect(page.getByText("Grupo único: 8 jogadores | 7 rodadas | 14 partidas")).toBeVisible();
    await expect(page.getByRole("spinbutton", { name: /Máximo de Jogadores|Número de Jogadores/ })).toHaveCount(0);

    await page.getByRole("combobox", { name: /^Variante do Super X/ }).selectOption({ index: 1 });

    await expect(page.getByText("Distribuição Super 12")).toBeVisible();
    await expect(page.getByText("Grupo único: 12 jogadores | 11 rodadas | 33 partidas")).toBeVisible();
  });

  test("Super X não oferece pontos de participação", { tag: "@p1" }, async ({ page }) => {
    await expect(page.getByRole("checkbox", { name: "Dar pontos de participação" })).toBeVisible();

    await page.getByRole("radio", { name: /^Super X/ }).check();

    await expect(page.getByRole("checkbox", { name: "Conta pontos no ranking" })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "Dar pontos de participação" })).toHaveCount(0);
  });

  test("melhor de 3 oferece a eliminatória, menos no Super X", { tag: "@p1" }, async ({ page }) => {
    const melhorDe3 = page.getByRole("checkbox", { name: "Partidas melhor de 3 sets" });
    const eliminatoria = page.getByRole("checkbox", { name: /fase eliminatória/ });

    // Dupla Fixa (padrão): aparece com melhor de 3
    await melhorDe3.check();
    await expect(eliminatoria).toBeVisible();

    // Super X não tem eliminatória
    await page.getByRole("radio", { name: /^Super X/ }).check();
    await expect(melhorDe3).toBeChecked();
    await expect(eliminatoria).toHaveCount(0);
  });

  test("Teams 6 exige número de jogadores múltiplo de 6", { tag: "@p1" }, async ({ page }) => {
    await page.getByRole("radio", { name: /^Teams/ }).check();
    await expect(page.getByText("Distribuição Teams 4")).toBeVisible();

    // Troca a variante mantendo 8 jogadores: avisa
    await page.getByRole("combobox", { name: /^Variante Teams/ }).selectOption({ index: 1 });
    await expect(page.getByText("Número de jogadores deve ser múltiplo de 6")).toBeVisible();

    await page.getByRole("spinbutton", { name: /^Número de Jogadores/ }).fill("12");

    await expect(page.getByText("Número de jogadores deve ser múltiplo de 6")).toHaveCount(0);
    await expect(page.getByRole("listitem").filter({ hasText: "6 jogadores por equipe" })).toBeVisible();
  });
});
