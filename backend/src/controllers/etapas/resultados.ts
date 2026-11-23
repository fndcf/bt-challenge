/**
 * Conferência da lista de resultados enviada (Rei da Praia e Super X)
 */

import { BadRequestError } from "../../utils/errors";

export function validarResultados(resultados: unknown): void {
  if (!Array.isArray(resultados) || resultados.length === 0) {
    throw new BadRequestError("Lista de resultados inválida");
  }

  for (const { partidaId, placar } of resultados) {
    if (!partidaId) {
      throw new BadRequestError("partidaId é obrigatório em cada resultado");
    }

    if (!Array.isArray(placar) || placar.length < 1 || placar.length > 3) {
      throw new BadRequestError(
        `Placar deve ter entre 1 e 3 sets para partida ${partidaId}`
      );
    }
  }
}
