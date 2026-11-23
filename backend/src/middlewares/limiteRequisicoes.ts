/**
 * Limite de requisições por IP (proteção contra abuso e custo de leitura)
 *
 * - geral: toda a API
 * - publico: rotas sem login (/api/public), que leem o Firestore a cada chamada
 * - cadastroArena: POST /api/arenas, que cria usuário no Firebase Auth
 *
 * Contagem em memória, por instância da Cloud Function: com N instâncias
 * ativas o teto real é N vezes o valor abaixo. Suficiente contra abuso
 * simples; contra ataque distribuído o caminho é o Cloud Armor.
 *
 * Desligado no emulador (FIRESTORE_EMULATOR_HOST), onde scripts como o
 * da galeria fazem centenas de chamadas seguidas do mesmo IP.
 */

import { RequestHandler } from "express";
import rateLimit, { HOUR, MINUTE } from "express-rate-limit";
import { ResponseHelper } from "../utils/responseHelper";
import logger from "../utils/logger";

interface Limite {
  nome: string;
  janelaMs: number;
  maximo: number;
  mensagem: string;
}

const criarLimite = ({ nome, janelaMs, maximo, mensagem }: Limite): RequestHandler =>
  rateLimit({
    windowMs: janelaMs,
    limit: maximo,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: () => Boolean(process.env.FIRESTORE_EMULATOR_HOST),
    handler: (req, res) => {
      // IP calculado e cadeia de proxies: conferir no log se o IP é do usuário
      logger.warn("Limite de requisições atingido", {
        limite: nome,
        ip: req.ip,
        encaminhadoPor: req.headers["x-forwarded-for"],
        rota: `${req.method} ${req.originalUrl}`,
      });
      ResponseHelper.tooManyRequests(res, mensagem, Math.ceil(janelaMs / 1000));
    },
  });

export const LIMITES = {
  geral: {
    nome: "geral",
    janelaMs: MINUTE,
    maximo: 300,
    mensagem: "Muitas requisições. Aguarde um minuto e tente novamente.",
  },
  publico: {
    nome: "publico",
    janelaMs: MINUTE,
    maximo: 120,
    mensagem: "Muitas requisições. Aguarde um minuto e tente novamente.",
  },
  cadastroArena: {
    nome: "cadastro de arena",
    janelaMs: HOUR,
    maximo: 5,
    mensagem:
      "Muitos cadastros de arena a partir desta rede. Tente novamente em 1 hora.",
  },
} satisfies Record<string, Limite>;

export const limiteGeral = criarLimite(LIMITES.geral);
export const limitePublico = criarLimite(LIMITES.publico);
export const limiteCadastroArena = criarLimite(LIMITES.cadastroArena);

export { criarLimite };
