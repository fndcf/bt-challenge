/**
 * Sobe a API apontando para o emulador do ambiente de demonstração
 * (DEMO_AMBIENTE=galeria ou e2e). Não encosta no emulador nem no banco do dia a dia.
 */

const path = require("path");
const { AMBIENTE, PORTAS, PROJETO } = require("./config.cjs");

Object.assign(process.env, {
  GCLOUD_PROJECT: PROJETO,
  FIRESTORE_EMULATOR_HOST: `127.0.0.1:${PORTAS.firestore}`,
  FIREBASE_AUTH_EMULATOR_HOST: `127.0.0.1:${PORTAS.auth}`,
  ALLOWED_ORIGINS: `http://127.0.0.1:${PORTAS.front}`,
});

const backend = path.resolve(__dirname, "../../backend");
require(path.join(backend, "node_modules/ts-node")).register({
  transpileOnly: true,
  project: path.join(backend, "tsconfig.json"),
});

const app = require(path.join(backend, "src/index.ts")).default;
app.listen(PORTAS.api, "127.0.0.1", () =>
  console.log(`API (${AMBIENTE}) em http://127.0.0.1:${PORTAS.api}`)
);
