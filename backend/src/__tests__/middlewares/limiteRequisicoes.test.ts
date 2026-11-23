/**
 * Limite de requisições por IP
 */

import express from "express";
import { AddressInfo } from "net";
import { Server } from "http";
import { MINUTE } from "express-rate-limit";
import { criarLimite, LIMITES } from "../../middlewares/limiteRequisicoes";

jest.mock("../../utils/logger");

const emuladorOriginal = process.env.FIRESTORE_EMULATOR_HOST;
let servidor: Server;
let porta: number;

const subir = (maximo: number) =>
  new Promise<void>((pronto) => {
    const app = express();
    app.set("trust proxy", 1);
    app.use(
      criarLimite({ nome: "teste", janelaMs: MINUTE, maximo, mensagem: "Calma" })
    );
    app.get("/", (_req, res) => {
      res.json({ ok: true });
    });
    servidor = app.listen(0, "127.0.0.1", () => {
      porta = (servidor.address() as AddressInfo).port;
      pronto();
    });
  });

const chamar = (ip = "203.0.113.1") =>
  fetch(`http://127.0.0.1:${porta}/`, { headers: { "x-forwarded-for": ip } });

beforeEach(() => {
  // setupEnv.ts aponta para um emulador, o que desligaria o limite
  delete process.env.FIRESTORE_EMULATOR_HOST;
});

afterEach(async () => {
  process.env.FIRESTORE_EMULATOR_HOST = emuladorOriginal;
  await new Promise((fim) => servidor.close(fim));
});

describe("limite de requisições", () => {
  it("passado o limite, responde 429 com mensagem e Retry-After", async () => {
    await subir(2);

    expect((await chamar()).status).toBe(200);
    expect((await chamar()).status).toBe(200);

    const bloqueada = await chamar();
    expect(bloqueada.status).toBe(429);
    expect(bloqueada.headers.get("retry-after")).toBe("60");
    expect(await bloqueada.json()).toEqual({ success: false, error: "Calma" });
  });

  it("conta cada IP separado (IP do X-Forwarded-For, atrás do proxy)", async () => {
    await subir(1);

    expect((await chamar("203.0.113.1")).status).toBe(200);
    expect((await chamar("203.0.113.1")).status).toBe(429);
    expect((await chamar("198.51.100.7")).status).toBe(200);
  });

  it("não conta no emulador", async () => {
    process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:18080";
    await subir(1);

    for (let i = 0; i < 3; i++) {
      expect((await chamar()).status).toBe(200);
    }
  });

  it("cadastro de arena é o limite mais apertado", () => {
    expect(LIMITES.cadastroArena.maximo).toBeLessThan(LIMITES.publico.maximo);
    expect(LIMITES.publico.maximo).toBeLessThan(LIMITES.geral.maximo);
  });
});
