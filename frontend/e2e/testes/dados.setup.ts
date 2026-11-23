/**
 * Apaga o emulador dos testes e cria a Arena Demo (scripts/demo/semear.mjs)
 */

import { test as setup } from "@playwright/test";
import { semear } from "../../../scripts/demo/semear.mjs";

setup("cria a Arena Demo no emulador dos testes", async () => {
  setup.setTimeout(180_000);
  await semear();
});
