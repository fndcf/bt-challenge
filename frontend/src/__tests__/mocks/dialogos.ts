/**
 * Diálogos nos testes: responde às confirmações e guarda os avisos
 */

import { registrarDialogos } from "@/utils/dialogos";

export const confirmarMock = jest.fn();
export const avisarMock = jest.fn();

/** Chame no topo do arquivo. Confirma tudo, até o teste dizer o contrário. */
export const usarDialogosDeTeste = () => {
  let desfazer: () => void;

  beforeEach(() => {
    confirmarMock.mockReset().mockResolvedValue(true);
    avisarMock.mockReset();
    desfazer = registrarDialogos({
      confirmar: confirmarMock,
      avisar: avisarMock,
    });
  });

  afterEach(() => desfazer());
};
