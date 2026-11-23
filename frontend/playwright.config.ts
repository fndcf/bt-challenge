/**
 * Testes de ponta a ponta (Playwright) — ver e2e/README.md
 *
 * Sobe um ambiente só dos testes (scripts/demo, DEMO_AMBIENTE=e2e):
 * emulador próprio (projeto demo-e2e), API e front em portas próprias.
 * Não encosta no emulador do dia a dia nem em staging.
 */

import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "@playwright/test";
import { SESSAO_ADMIN } from "./e2e/apoio/sessao";

process.env.DEMO_AMBIENTE = "e2e";

const require = createRequire(import.meta.url);
const { PORTAS, PROJETO } = require("../scripts/demo/config.cjs");

const aqui = path.dirname(fileURLToPath(import.meta.url));
const demo = path.resolve(aqui, "../scripts/demo");
const CI = Boolean(process.env.CI);

const logado = { storageState: SESSAO_ADMIN };

export default defineConfig({
  testDir: "./e2e/testes",
  outputDir: "./e2e/.resultados",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: CI ? 2 : undefined,
  reporter: [
    ["list"],
    ["html", { outputFolder: "e2e/relatorio", open: "never" }],
  ],
  use: {
    baseURL: `http://127.0.0.1:${PORTAS.front}`,
    channel: "chrome", // Chrome instalado: sem baixar navegador
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    viewport: { width: 1280, height: 800 },
    trace: CI ? "on-first-retry" : "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  expect: { timeout: 10_000 },
  projects: [
    // Arena Demo do zero no emulador dos testes
    { name: "dados", testMatch: /dados\.setup\.ts/ },
    // Login uma vez; os testes reaproveitam a sessão
    { name: "login", testMatch: /login\.setup\.ts/, dependencies: ["dados"] },
    // Críticos (tag @smoke): acesso, criar etapa e Dupla Fixa completa
    {
      name: "smoke",
      testMatch: /\.spec\.ts/,
      testIgnore: /\.celular\.spec\.ts/,
      grep: /@smoke/,
      use: logado,
      dependencies: ["login"],
    },
    {
      name: "regressao",
      testMatch: /\.spec\.ts/,
      testIgnore: /\.celular\.spec\.ts/,
      use: logado,
      dependencies: ["login"],
    },
    {
      name: "celular",
      testMatch: /\.celular\.spec\.ts/,
      use: {
        ...logado,
        viewport: { width: 393, height: 852 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
      dependencies: ["login"],
    },
  ],
  webServer: [
    {
      name: "Emulador",
      command: `firebase emulators:start --config firebase.e2e.json --project ${PROJETO} --only auth,firestore`,
      cwd: demo,
      url: `http://127.0.0.1:${PORTAS.firestore}`,
      timeout: 120_000,
      reuseExistingServer: !CI,
    },
    {
      name: "API",
      command: "node api.cjs",
      cwd: demo,
      env: { DEMO_AMBIENTE: "e2e" },
      url: `http://127.0.0.1:${PORTAS.api}/api/health`,
      timeout: 120_000,
      reuseExistingServer: !CI,
    },
    {
      name: "Front",
      command: `npx vite --port ${PORTAS.front} --host 127.0.0.1 --strictPort`,
      env: {
        VITE_USE_EMULATORS: "true",
        VITE_FIREBASE_PROJECT_ID: PROJETO,
        VITE_EMULADOR_AUTH_PORTA: String(PORTAS.auth),
        VITE_EMULADOR_FIRESTORE_PORTA: String(PORTAS.firestore),
        VITE_API_URL: `http://127.0.0.1:${PORTAS.api}/api`,
      },
      url: `http://127.0.0.1:${PORTAS.front}`,
      timeout: 120_000,
      reuseExistingServer: !CI,
    },
  ],
});
