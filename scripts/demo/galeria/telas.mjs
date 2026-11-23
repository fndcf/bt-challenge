/**
 * Telas da galeria. Cada uma vira <arquivo>.webp em frontend/public/screenshots.
 * A ordem e os textos dos cards ficam em GaleriaSection.tsx.
 *
 * rota(ctx): caminho no front; ctx.etapas tem os ids do semear.mjs
 * antes(pagina): cliques para chegar ao estado (abrir aba, modal...)
 * tamanho: "computador" (padrão) ou "celular"
 */

const etapa = (chave) => (c) => `/admin/etapas/${c.etapas[chave]}`;
const publica = (chave) => (c) => `/arena/${c.arena}/etapa/${c.etapas[chave]}`;

// ============== AÇÕES ==============

const esperar = (pagina) => pagina.waitForTimeout(600);

/**
 * Rola até o elemento ficar no topo (o admin rola por dentro do layout).
 * folga: px deixados acima do elemento.
 */
const rolarAte = async (alvo, folga = 0) => {
  await alvo.first().evaluate((el, px) => {
    el.scrollIntoView({ block: "start" });
    if (!px) return;
    for (let pai = el.parentElement; pai; pai = pai.parentElement) {
      if (pai.scrollTop > 0) return pai.scrollBy(0, -px);
    }
    window.scrollBy(0, -px);
  }, folga);
  await alvo.first().page().waitForTimeout(300);
};

const aba = (...nomes) => async (pagina) => {
  for (const nome of nomes) {
    await pagina.getByRole("tab", { name: nome }).first().click();
    await esperar(pagina);
  }
  await rolarAte(pagina.getByRole("tablist"));
};

const clicar = async (pagina, nome, indice = 0) => {
  await pagina.getByRole("button", { name: nome }).nth(indice).click();
  await esperar(pagina);
};

/** Clica e espera o modal abrir */
const modal = (nome, indice = 0) => async (pagina) => {
  await clicar(pagina, nome, indice);
  await pagina.getByRole("dialog").first().waitFor();
  await esperar(pagina);
};

const emSequencia = (...passos) => async (pagina) => {
  for (const passo of passos) await passo(pagina);
};

/** Rola até o título (h1-h4) com o texto */
const rolarPara = (texto) => (pagina) =>
  rolarAte(pagina.getByRole("heading", { name: texto }));

/** Clica nos jogadores pelo nome (formação manual) */
const escolher = (...nomes) => async (pagina) => {
  for (const nome of nomes) {
    await pagina
      .getByRole("button", { name: new RegExp(`^${nome}`) })
      .filter({ visible: true })
      .first()
      .click();
    await pagina.waitForTimeout(200);
  }
};

/** Preenche o começo do formulário de nova etapa */
const preencherEtapa = async (pagina) => {
  await pagina.getByLabel(/Nome da Etapa/).fill("Etapa 7 - Primavera");
  await pagina.getByLabel(/Descrição/).fill("Etapa válida para o ranking, com fase de grupos e eliminatória.");
  await pagina.getByLabel(/Local/).fill("Arena Demo - Quadras 1 a 4");
  await pagina.getByLabel(/Início das Inscrições/i).fill("2026-12-01");
  await pagina.getByLabel(/Fim das Inscrições/i).fill("2026-12-10");
  await pagina.getByLabel(/Data de Realização/i).fill("2026-12-12");
  await pagina.evaluate(() => document.activeElement?.blur());
};

/** Marca caixas do modal pela posição */
const marcar = (...posicoes) => async (pagina) => {
  const caixas = pagina.getByRole("dialog").getByRole("checkbox");
  for (const i of posicoes) await caixas.nth(i).check();
};

const chaves = aba(/Chaves/);

// ============== TELAS ==============

export const TELAS = [
  // ---- Primeiros passos ----
  { arquivo: "cadastro-arena", rota: () => "/register" },
  { arquivo: "dashboard", rota: () => "/admin" },
  { arquivo: "dashboard2", rota: () => "/admin", antes: rolarPara("Ranking Masculino") },
  { arquivo: "jogadores", rota: () => "/admin/jogadores" },
  { arquivo: "novo-jogador", rota: () => "/admin/jogadores/novo" },
  { arquivo: "importar-jogadores", rota: () => "/admin/jogadores", antes: modal("Importar") },
  { arquivo: "etapas", rota: () => "/admin/etapas" },

  // ---- Montar a etapa ----
  { arquivo: "criar-etapa", rota: () => "/admin/etapas/criar", antes: emSequencia(preencherEtapa, rolarPara("Criar Nova Etapa")) },
  { arquivo: "criar-etapa2", rota: () => "/admin/etapas/criar", antes: emSequencia(preencherEtapa, rolarPara("Datas")) },
  {
    arquivo: "criar-etapa3",
    rota: () => "/admin/etapas/criar",
    antes: emSequencia((p) => p.getByText("Rei da Praia", { exact: true }).first().click(), preencherEtapa, rolarPara("Formato do Torneio")),
  },
  { arquivo: "inscricoes", rota: etapa("inscricoes"), antes: aba(/Inscrições/) },
  { arquivo: "inscricoes2", rota: etapa("inscricoes"), antes: modal("Inscrever Jogador") },
  { arquivo: "cabecas-chave", rota: etapa("cabecas"), antes: aba("Cabeças de Chave") },
  {
    arquivo: "duplas-manuais",
    rota: etapa("duplasManuais"),
    antes: emSequencia(aba("Duplas Manuais"), escolher("Camila Rezende", "Ana Paula", "Gabriela Torres", "Mariana Vieira"), (p) => rolarAte(p.getByRole("tablist"))),
  },
  {
    arquivo: "equipes-manuais",
    rota: etapa("teamsManual"),
    antes: emSequencia(modal("Gerar Equipes"), escolher("Leonardo Barros", "Vinícius Moreira", "Rodrigo Nunes", "Caio Fernandes", "Marcelo Dias")),
  },

  // ---- Durante o torneio ----
  { arquivo: "dupla-fixa-grupos", rota: etapa("duplaFixaEliminatoria"), antes: emSequencia(chaves, aba("Fase de Grupos")) },
  { arquivo: "dupla-fixa-resultados", rota: etapa("duplaFixaEliminatoria"), antes: emSequencia(chaves, modal("Registrar Resultados")) },
  { arquivo: "dupla-fixa-eliminatoria", rota: etapa("duplaFixaEliminatoria"), antes: emSequencia(chaves, aba("Eliminatória")) },
  { arquivo: "dupla-fixa-eliminatoria2", rota: etapa("duplaFixaEliminatoria"), antes: emSequencia(chaves, aba("Eliminatória"), modal(/Registrar|Lançar/)) },

  { arquivo: "rei-da-praia-grupos", rota: etapa("reiDaPraia"), antes: emSequencia(chaves, aba("Fase de Grupos")) },
  { arquivo: "rei-da-praia-resultados", rota: etapa("reiDaPraia"), antes: emSequencia(chaves, modal("Registrar Resultados")) },
  { arquivo: "rei-da-praia-eliminatoria", rota: etapa("reiDaPraia"), antes: emSequencia(chaves, aba("Eliminatória")) },

  { arquivo: "super-x", rota: etapa("superX"), antes: chaves },
  { arquivo: "super-x-resultados", rota: etapa("superX"), antes: emSequencia(chaves, modal("Registrar Resultados")) },

  { arquivo: "teams-confrontos", rota: etapa("teams"), antes: chaves },
  {
    arquivo: "teams-partidas",
    rota: etapa("teams"),
    antes: emSequencia(chaves, async (p) => {
      await clicar(p, "Ver Partidas");
      await rolarAte(p.getByRole("button", { name: "Ocultar" }), 220);
    }),
  },
  { arquivo: "teams-resultados", rota: etapa("teams"), antes: emSequencia(chaves, modal("Resultados")) },
  { arquivo: "teams-escalacao", rota: etapa("teamsEscalacao"), antes: emSequencia(chaves, (p) => clicar(p, "Ver Partidas"), modal("Definir Jogadores"), marcar(0, 1, 4, 5)) },

  { arquivo: "empates", rota: etapa("empates"), antes: chaves },
  { arquivo: "empates2", rota: etapa("empates"), antes: emSequencia(chaves, modal("Resolver")) },
  {
    arquivo: "substituir-jogador",
    rota: etapa("superX"),
    antes: emSequencia(modal("Substituir Jogador"), (p) => p.getByRole("dialog").getByRole("button").nth(1).click()),
  },

  { arquivo: "etapa-encerrada", rota: etapa("duplaFixaEncerrada"), antes: emSequencia(chaves, aba("Eliminatória")) },

  // ---- Página pública ----
  { arquivo: "arena-publica", rota: (c) => `/arena/${c.arena}` },
  { arquivo: "ranking", rota: (c) => `/arena/${c.arena}`, antes: rolarPara("Ranking Completo") },
  { arquivo: "etapa-publica", rota: publica("duplaFixaEncerrada"), antes: rolarPara("Fase de Grupos") },
  { arquivo: "etapa-publica2", rota: publica("duplaFixaEncerrada"), antes: rolarPara("Chaveamento Eliminatório") },
  {
    arquivo: "perfil-jogador",
    rota: (c) => `/arena/${c.arena}`,
    antes: async (pagina) => {
      await pagina.locator('a[href*="/jogador/"]').first().click();
      await pagina.waitForURL("**/jogador/**");
    },
  },

  // ---- No celular ----
  { arquivo: "celular-dashboard", tamanho: "celular", rota: () => "/admin" },
  { arquivo: "celular-resultados", tamanho: "celular", rota: etapa("duplaFixaEliminatoria"), antes: emSequencia(chaves, modal("Registrar Resultados")) },
  { arquivo: "celular-etapa-publica", tamanho: "celular", rota: publica("duplaFixaEncerrada"), antes: rolarPara("Fase de Grupos") },
  { arquivo: "celular-ranking", tamanho: "celular", rota: (c) => `/arena/${c.arena}`, antes: rolarPara("Ranking Completo") },
];
