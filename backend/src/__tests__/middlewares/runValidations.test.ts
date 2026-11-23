/**
 * runValidations numa rota de verdade (express-validator real)
 *
 * O erro de validação precisa chegar ao errorHandler: antes ele escapava
 * da função async como rejeição não tratada e derrubava o processo.
 */

import express, { NextFunction, Request, Response } from "express";
import { body } from "express-validator";
import { AddressInfo } from "net";
import { Server } from "http";
import { runValidations } from "../../middlewares/validation";
import { AppError } from "../../utils/errors";

let servidor: Server;
let porta: number;
const naoTratadas: unknown[] = [];
const registrar = (motivo: unknown) => naoTratadas.push(motivo);

beforeAll(
  () =>
    new Promise<void>((pronto) => {
      process.on("unhandledRejection", registrar);
      const app = express();
      app.use(express.json());
      app.post(
        "/arenas",
        runValidations([body("nome").notEmpty().withMessage("Nome é obrigatório")]),
        (_req, res) => {
          res.status(201).json({ ok: true });
        }
      );
      app.use((erro: AppError, _req: Request, res: Response, _next: NextFunction) => {
        res.status(erro.statusCode ?? 500).json({ erro: erro.message });
      });
      servidor = app.listen(0, "127.0.0.1", () => {
        porta = (servidor.address() as AddressInfo).port;
        pronto();
      });
    })
);

afterAll(async () => {
  process.off("unhandledRejection", registrar);
  await new Promise((fim) => servidor.close(fim));
});

const enviar = (corpo: object) =>
  fetch(`http://127.0.0.1:${porta}/arenas`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(corpo),
  });

describe("runValidations", () => {
  it("corpo inválido vira 422 pelo tratador de erro, sem rejeição solta", async () => {
    const resposta = await enviar({});

    expect(resposta.status).toBe(422);
    expect(await resposta.json()).toEqual({ erro: "Erro de validação" });
    expect(naoTratadas).toEqual([]);
  });

  it("corpo válido segue para a rota", async () => {
    expect((await enviar({ nome: "Arena" })).status).toBe(201);
  });
});
