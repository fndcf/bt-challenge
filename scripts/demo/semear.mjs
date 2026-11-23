/**
 * Dados fictícios: "Arena Demo" com jogadores e uma etapa em cada situação
 * (inscrições abertas, chaves, eliminatória, encerrada...). Tudo pela API.
 *
 * Apaga o emulador do ambiente antes (só projetos demo-).
 *
 *   DEMO_AMBIENTE=e2e node scripts/demo/semear.mjs
 *
 * Grava os ids em <ambiente>.dados.json (lido pelos prints e pelos testes).
 */

import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import {
  Cliente,
  config,
  criarEtapa,
  dia,
  duplaFixaEliminatoria,
  duplaFixaGrupos,
  individuais,
  jogarEliminatoria,
  limparEmulador,
  resolverEmpates,
  teamsConfrontos,
} from "./dados.mjs";

const { ADMIN, ARENA, AMBIENTE } = config;

export const ARQUIVO_DADOS = fileURLToPath(
  new URL(`./${AMBIENTE}.dados.json`, import.meta.url)
);

// ============== JOGADORES ==============

const MASCULINOS = [
  "Rafael Souza", "Bruno Lima", "Lucas Martins", "Thiago Alves",
  "Gustavo Rocha", "Felipe Costa", "André Ribeiro", "Diego Carvalho",
  "Marcelo Dias", "Pedro Henrique", "Rodrigo Nunes", "Vinícius Moreira",
  "Caio Fernandes", "Leonardo Barros", "Matheus Pires", "Gabriel Teixeira",
  "João Vitor", "Daniel Freitas", "Eduardo Gomes", "Fábio Mendes",
  "Henrique Lopes", "Igor Cardoso", "Júlio César", "Murilo Azevedo",
  "Otávio Ramos", "Paulo Sérgio", "Renan Castro", "Samuel Duarte",
  "Tiago Monteiro", "Victor Hugo", "William Prado", "Yuri Campos",
];

const FEMININOS = [
  "Ana Paula", "Beatriz Melo", "Camila Rezende", "Daniela Fonseca",
  "Fernanda Lima", "Gabriela Torres", "Isabela Costa", "Juliana Brito",
  "Larissa Moura", "Mariana Vieira", "Natália Rios", "Patrícia Sales",
  "Renata Farias", "Sabrina Lacerda", "Tatiane Couto", "Vanessa Pinto",
];

const NIVEIS = ["iniciante", "intermediario", "avancado"];

async function criarJogadores(cliente) {
  const criar = (nome, genero, i) =>
    cliente.post("/jogadores", {
      nome,
      genero,
      nivel: NIVEIS[i % 3],
      telefone: `(11) 9${String(8000_0000 + i * 1371).slice(0, 4)}-${String(1000 + i * 37).slice(0, 4)}`,
    });

  const masculinos = [];
  for (const [i, nome] of MASCULINOS.entries()) {
    masculinos.push(await criar(nome, "masculino", i));
  }
  const femininos = [];
  for (const [i, nome] of FEMININOS.entries()) {
    femininos.push(await criar(nome, "feminino", i));
  }
  return { masculinos, femininos };
}

// ============== ETAPAS ==============

/**
 * Uma etapa por situação. As chaves do objeto devolvido são usadas pelos
 * prints (galeria/telas.mjs) e pelos testes (frontend/e2e).
 */
async function montarEtapas(cliente, { masculinos: M, femininos: F }) {
  // 24 jogadores = 12 duplas = 4 grupos de 3: eliminatória começa nas quartas
  const dfBase = { formato: "dupla_fixa", tipoFormacaoDupla: "balanceado", jogadoresPorGrupo: 3 };
  const ids = {};
  const etapa = async (chave, dados, jogadores, passos = async () => {}) => {
    const criada = await criarEtapa(cliente, dados, jogadores);
    await passos(criada);
    ids[chave] = criada.id;
    console.log(`  ${dados.nome}`);
  };

  // Encerradas: campeões, ranking, perfil e página pública
  await etapa("duplaFixaEncerrada", { nome: "Etapa 1 - Abertura", ...dfBase }, M.slice(0, 24), async (e) => {
    await duplaFixaGrupos(cliente, e);
    await duplaFixaEliminatoria(cliente, e);
    await cliente.post(`/etapas/${e.id}/encerrar`);
  });
  await etapa("superXEncerrada", { nome: "Super 8 Feminino", formato: "super_x", varianteSuperX: 8, genero: "feminino" }, F.slice(0, 8), async (e) => {
    await individuais(cliente, e, "super-x", 1);
    await cliente.post(`/etapas/${e.id}/encerrar`);
  });

  // Em andamento
  await etapa("duplaFixaEliminatoria", { nome: "Etapa 2 - Desafio das Duplas", ...dfBase }, M.slice(8, 32), async (e) => {
    await duplaFixaGrupos(cliente, e);
    await duplaFixaEliminatoria(cliente, e, 1);
  });
  await etapa("reiDaPraia", { nome: "Etapa 3 - Rei da Praia", formato: "rei_da_praia", tipoChaveamento: "melhores_com_melhores" }, M.slice(0, 16), async (e) => {
    await individuais(cliente, e, "rei-da-praia", 1);
    await resolverEmpates(cliente, e);
    await cliente.post(`/etapas/${e.id}/rei-da-praia/gerar-eliminatoria`, { classificadosPorGrupo: 2 });
    await jogarEliminatoria(cliente, e, "rei-da-praia/confrontos", 1);
  });
  await etapa("superX", { nome: "Super 8 Masculino", formato: "super_x", varianteSuperX: 8 }, M.slice(16, 24), async (e) => {
    await individuais(cliente, e, "super-x", 0.5);
  });
  await etapa("teams", { nome: "Etapa 4 - Teams", formato: "teams", varianteTeams: 4, tipoFormacaoEquipe: "balanceado", tipoFormacaoJogos: "sorteio" }, M.slice(0, 16), async (e) => {
    await teamsConfrontos(cliente, e, 0.5);
  });
  await etapa("empates", { nome: "Rei da Praia Feminino", formato: "rei_da_praia", genero: "feminino" }, F.slice(0, 8), async (e) => {
    await individuais(cliente, e, "rei-da-praia", 1, true);
  });
  await etapa("teamsEscalacao", { nome: "Teams Feminino", formato: "teams", varianteTeams: 4, tipoFormacaoEquipe: "balanceado", tipoFormacaoJogos: "manual", genero: "feminino" }, F, async (e) => {
    await teamsConfrontos(cliente, e, 0, "manual");
  });

  // Antes das chaves
  await etapa("teamsManual", { nome: "Teams - Equipes Manuais", formato: "teams", varianteTeams: 4, tipoFormacaoEquipe: "manual", tipoFormacaoJogos: "sorteio" }, M.slice(8, 16));
  await etapa("duplasManuais", { nome: "Dupla Fixa Feminina", formato: "dupla_fixa", tipoFormacaoDupla: "manual", jogadoresPorGrupo: 3, genero: "feminino" }, F.slice(0, 12));
  await etapa("inscricoes", { nome: "Etapa 5 - Open de Verão", ...dfBase, maxJogadores: 16, dataFim: dia(10), dataRealizacao: dia(12) }, M.slice(0, 10));
  // Cabeças de chave só depois de encerrar as inscrições
  await etapa("cabecas", { nome: "Etapa 6 - Copa da Arena", ...dfBase, maxJogadores: 16, dataFim: dia(3), dataRealizacao: dia(5) }, M.slice(8, 24), async (e) => {
    for (const [i, j] of M.slice(8, 24).filter((x) => x.nivel === "avancado").slice(0, 4).entries()) {
      await cliente.post("/cabecas-de-chave", { etapaId: e.id, jogadorId: j.id, jogadorNome: j.nome, jogadorNivel: j.nivel, jogadorGenero: j.genero, ordem: i + 1 });
    }
  });

  return ids;
}

// ============== EXECUÇÃO ==============

export async function semear() {
  await limparEmulador();

  const cliente = await new Cliente().criarArena({
    nome: ARENA.nome,
    slug: ARENA.slug,
    email: ADMIN.email,
    senha: ADMIN.senha,
  });

  const jogadores = await criarJogadores(cliente);
  console.log(`Jogadores: ${jogadores.masculinos.length + jogadores.femininos.length}`);

  const etapas = await montarEtapas(cliente, jogadores);
  const dados = {
    etapas,
    jogadores: {
      masculinos: jogadores.masculinos.map(({ id, nome, nivel }) => ({ id, nome, nivel })),
      femininos: jogadores.femininos.map(({ id, nome, nivel }) => ({ id, nome, nivel })),
    },
  };
  writeFileSync(ARQUIVO_DADOS, JSON.stringify(dados, null, 2));
  return dados;
}

// Rodando direto: node scripts/demo/semear.mjs
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  semear()
    .then(() => console.log(`Pronto: ${ARQUIVO_DADOS}`))
    .catch((erro) => {
      console.error(erro.message);
      process.exit(1);
    });
}
