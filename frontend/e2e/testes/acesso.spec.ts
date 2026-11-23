/**
 * Acesso: login, erro de senha, sair e rota protegida
 */

import { test, expect, ADMIN } from "../apoio/fixtures";
import { SEM_SESSAO } from "../apoio/sessao";

test.describe("Login", { tag: "@smoke" }, () => {
  test.use({ storageState: SEM_SESSAO });

  test("entra com email e senha e chega ao painel", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(ADMIN.email);
    await page.getByLabel("Senha", { exact: true }).fill(ADMIN.senha);
    await page.getByRole("button", { name: "Entrar" }).click();

    await page.waitForURL("**/admin");
    await expect(page.getByText(/Bem-vindo/)).toBeVisible();
  });

  test("mostra erro com senha errada e continua no login", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(ADMIN.email);
    await page.getByLabel("Senha", { exact: true }).fill("senha-errada");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("manda para o login quem abre o admin sem estar logado", async ({ page }) => {
    await page.goto("/admin/jogadores");

    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Sair", { tag: "@smoke" }, () => {
  test("sai do sistema e volta a pedir login", async ({ page }) => {
    await page.goto("/admin");
    await page.getByRole("button", { name: "Sair" }).click();
    // Confirmação do AdminLayout
    await page.getByRole("dialog").getByRole("button", { name: "Sair" }).click();

    await expect(page).toHaveURL(/\/login|\/$/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });
});
