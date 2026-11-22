/**
 * Mock do DesempateService
 *
 * classificarGrupo usa a ordenação real (utils/desempate) sem acessar o
 * Firestore, para os testes de classificação continuarem validando os critérios.
 */

import type { DesempateService } from "../../services/DesempateService";
import { ordenarComDesempate } from "../../utils/desempate";

export function createMockDesempateService() {
  return {
    classificarGrupo: jest.fn(
      async (params: any) =>
        ordenarComDesempate(params.itens, params.comparar, params.getId)
          .ordenados
    ),
    listarPendentes: jest.fn().mockResolvedValue([]),
    garantirSemEmpatesPendentes: jest.fn().mockResolvedValue(undefined),
    definirDesempate: jest.fn(),
    limpar: jest.fn().mockResolvedValue(undefined),
    renomearParticipante: jest.fn().mockResolvedValue(undefined),
    limparGrupos: jest.fn().mockResolvedValue(undefined),
  };
}

export type MockDesempateService = ReturnType<typeof createMockDesempateService>;

export const comoDesempateService = (mock: MockDesempateService) =>
  mock as unknown as DesempateService;
