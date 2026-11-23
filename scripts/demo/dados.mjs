/**
 * Acesso à API do ambiente de demonstração e ajudantes para montar dados
 * (etapas, inscrições, chaves, resultados). Usado pelo semear.mjs e pelos
 * testes do Playwright, sempre pela API: as regras de negócio valem.
 */

import { createRequire } from "module";

const require = createRequire(import.meta.url);
const config = require("./config.cjs");
const { PORTAS, PROJETO, ADMIN } = config;

export { config };

const API = `http://127.0.0.1:${PORTAS.api}/api`;
const AUTH = `http://127.0.0.1:${PORTAS.auth}`;
const FIRESTORE = `http://127.0.0.1:${PORTAS.firestore}`;

// ============== CLIENTE ==============

/** Cliente da API com o login de um admin */
export class Cliente {
  token = "";

  async api(metodo, rota, corpo) {
    const resposta = await fetch(API + rota, {
      method: metodo,
      headers: {
        "content-type": "application/json",
        ...(this.token && { authorization: `Bearer ${this.token}` }),
      },
      ...(corpo !== undefined && { body: JSON.stringify(corpo) }),
    });
    const json = await resposta.json().catch(() => ({}));
    if (!resposta.ok) {
      throw new Error(
        `${metodo} ${rota} → ${resposta.status}: ${JSON.stringify(json).slice(0, 400)}`
      );
    }
    return json.data ?? json;
  }

  get = (rota) => this.api("GET", rota);
  post = (rota, corpo = {}) => this.api("POST", rota, corpo);
  put = (rota, corpo = {}) => this.api("PUT", rota, corpo);

  async entrar(email = ADMIN.email, senha = ADMIN.senha) {
    const resposta = await fetch(
      `${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password: senha, returnSecureToken: true }),
      }
    );
    this.token = (await resposta.json()).idToken;
    if (!this.token) throw new Error(`Login no emulador falhou (${email})`);
    return this;
  }

  /** Cria a arena (e o admin) e entra com ele */
  async criarArena({ nome, slug, email, senha }) {
    await this.post("/arenas", { nome, slug, adminEmail: email, adminPassword: senha });
    return this.entrar(email, senha);
  }
}

/** Apaga tudo do emulador (só em projeto demo-) */
export async function limparEmulador() {
  if (!PROJETO.startsWith("demo-")) throw new Error("Só em projeto demo-");
  await fetch(
    `${FIRESTORE}/emulator/v1/projects/${PROJETO}/databases/(default)/documents`,
    { method: "DELETE" }
  );
  await fetch(`${AUTH}/emulator/v1/projects/${PROJETO}/accounts`, { method: "DELETE" });
}

// ============== DATAS ==============

/** Data relativa a hoje (meio-dia UTC: o mesmo dia em qualquer fuso do Brasil) */
export const dia = (deslocamento) => {
  const data = new Date();
  data.setUTCHours(12, 0, 0, 0);
  data.setUTCDate(data.getUTCDate() + deslocamento);
  return data.toISOString();
};

// ============== ETAPAS ==============

/** Cria a etapa e inscreve os jogadores; encerra as inscrições se lotou */
export async function criarEtapa(cliente, dados, jogadores = []) {
  const etapa = await cliente.post("/etapas", {
    genero: "masculino",
    dataInicio: dia(-3),
    dataFim: dia(1),
    dataRealizacao: dia(2),
    local: "Arena Demo - Quadras 1 a 4",
    ...dados,
    maxJogadores: dados.maxJogadores ?? jogadores.length,
  });
  if (jogadores.length) {
    await cliente.post(`/etapas/${etapa.id}/inscrever-lote`, {
      jogadorIds: jogadores.map((j) => j.id),
    });
  }
  if (jogadores.length && jogadores.length === (dados.maxJogadores ?? jogadores.length)) {
    await cliente.post(`/etapas/${etapa.id}/encerrar-inscricoes`);
  }
  return etapa;
}

// ============== RESULTADOS ==============

/** Placar variado e sempre com vencedor; `n` muda o resultado */
export const placar = (n, vence1 = n % 3 !== 0) => {
  const perdedor = [2, 3, 4, 1, 5, 0][n % 6];
  return [
    {
      numero: 1,
      gamesDupla1: vence1 ? 6 : perdedor,
      gamesDupla2: vence1 ? perdedor : 6,
    },
  ];
};

/** Fração das partidas (0 a 1) que recebe resultado, na ordem da lista */
const parte = (lista, fracao) => lista.slice(0, Math.round(lista.length * fracao));

export async function resolverEmpates(cliente, etapa) {
  for (let i = 0; i < 40; i++) {
    const empates = await cliente.get(`/etapas/${etapa.id}/empates-pendentes`);
    if (!empates.length) return;
    const [empate] = empates;
    await cliente.post(`/etapas/${etapa.id}/desempate`, {
      grupoId: empate.grupoId,
      ids: empate.participantes.map((p) => p.id),
      modo: "manual",
    });
  }
}

/**
 * Joga a eliminatória rodada a rodada. `rodadas` limita quantas rodadas
 * recebem resultado (Infinity = até a final).
 */
export async function jogarEliminatoria(cliente, etapa, rotaConfrontos, rodadas = Infinity) {
  for (let rodada = 0; rodada < rodadas; rodada++) {
    const confrontos = await cliente.get(`/etapas/${etapa.id}/${rotaConfrontos}`);
    const pendentes = confrontos.filter(
      (c) => c.dupla1Id && c.dupla2Id && c.status !== "finalizada"
    );
    if (!pendentes.length) return;
    for (const [i, c] of pendentes.entries()) {
      await cliente.post(`/etapas/confrontos-eliminatorios/${c.id}/resultado`, {
        placar: placar(i + rodada, i % 4 !== 1),
      });
    }
  }
}

// ---- Dupla Fixa ----

export async function duplaFixaGrupos(cliente, etapa, fracao = 1) {
  await cliente.post(`/etapas/${etapa.id}/gerar-chaves`);
  const partidas = await cliente.get(`/etapas/${etapa.id}/partidas`);
  const resultados = parte(partidas, fracao).map((p, i) => ({
    partidaId: p.id,
    placar: placar(i),
  }));
  if (resultados.length) await cliente.post("/partidas/resultados-lote", { resultados });
}

export async function duplaFixaEliminatoria(cliente, etapa, rodadas) {
  await resolverEmpates(cliente, etapa);
  await cliente.post(`/etapas/${etapa.id}/gerar-eliminatoria`, { classificadosPorGrupo: 2 });
  await jogarEliminatoria(cliente, etapa, "confrontos-eliminatorios", rodadas);
}

// ---- Rei da Praia e Super X (partidas individuais) ----

/** rota: "rei-da-praia" ou "super-x" */
export async function individuais(cliente, etapa, rota, fracao, empatar = false) {
  await cliente.post(`/etapas/${etapa.id}/${rota}/gerar-chaves`);
  const partidas = await cliente.get(`/etapas/${etapa.id}/${rota}/partidas`);
  const resultados = parte(partidas, fracao).map((p, i) => ({
    partidaId: p.id,
    placar: empatar ? [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }] : placar(i),
  }));
  if (resultados.length) {
    await cliente.post(`/etapas/${etapa.id}/${rota}/resultados-lote`, { resultados });
  }
}

// ---- Teams ----

export async function teamsConfrontos(cliente, etapa, fracao, tipoFormacaoJogos = "sorteio") {
  await cliente.post(`/etapas/${etapa.id}/teams/gerar-equipes`, { tipoFormacaoJogos });
  if (!fracao) return;
  const confrontos = await cliente.get(`/etapas/${etapa.id}/teams/confrontos`);
  const resultados = [];
  for (const [i, c] of parte(confrontos, fracao).entries()) {
    const partidas = await cliente.get(
      `/etapas/${etapa.id}/teams/confrontos/${c.id}/partidas`
    );
    // A mesma equipe vence os dois jogos: sem jogo decisivo
    for (const [j, p] of partidas.entries()) {
      resultados.push({ partidaId: p.id, placar: placar(i + j, i % 3 !== 2) });
    }
  }
  await cliente.post(`/etapas/${etapa.id}/teams/resultados-lote`, { resultados });
}
