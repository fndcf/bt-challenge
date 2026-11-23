/**
 * Ambientes de demonstração: emulador próprio + API + front, com a
 * "Arena Demo" criada pelo semear.mjs.
 *
 * - galeria: prints da Home (npm run galeria)
 * - e2e: testes do Playwright (npm run e2e)
 *
 * Portas fora das do emulador do dia a dia (8080, 9099, 9199): os três
 * rodam juntos sem conflito. Escolha pelo DEMO_AMBIENTE (padrão: galeria).
 */

const AMBIENTES = {
  galeria: {
    PROJETO: "demo-galeria",
    PORTAS: { auth: 19099, firestore: 18080, api: 15100, front: 13100 },
  },
  e2e: {
    PROJETO: "demo-e2e",
    PORTAS: { auth: 29099, firestore: 28080, api: 25100, front: 23100 },
  },
};

const nome = process.env.DEMO_AMBIENTE ?? "galeria";
const ambiente = AMBIENTES[nome];
if (!ambiente) throw new Error(`DEMO_AMBIENTE desconhecido: ${nome}`);

module.exports = {
  AMBIENTE: nome,
  ...ambiente,
  ADMIN: { email: "admin@arenademo.com", senha: "galeria123" },
  ARENA: { nome: "Arena Demo", slug: "arena-demo" },
};
