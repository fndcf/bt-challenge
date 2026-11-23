/**
 * Login do admin pela tela, uma vez; a sessão (guardada pelo Firebase no
 * IndexedDB) vai para e2e/.auth e é reaproveitada pelos testes.
 */

import { test as setup, expect } from "@playwright/test";
import { config } from "../../../scripts/demo/dados.mjs";
import { SESSAO_ADMIN } from "../apoio/sessao";

setup("entra como admin da Arena Demo", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(config.ADMIN.email);
  await page.getByLabel("Senha", { exact: true }).fill(config.ADMIN.senha);
  await page.getByRole("button", { name: "Entrar" }).click();

  await page.waitForURL("**/admin");
  await expect(page.getByText(/Bem-vindo/)).toBeVisible();
  await page.context().storageState({ path: SESSAO_ADMIN, indexedDB: true });
});
