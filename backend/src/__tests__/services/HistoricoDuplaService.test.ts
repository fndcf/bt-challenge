/**
 * Testes do HistoricoDuplaService
 */

jest.mock("../../utils/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock("../../config/firebase", () => ({
  db: { collection: jest.fn() },
}));

import { HistoricoDuplaService } from "../../services/HistoricoDuplaService";
import { TEST_IDS } from "../fixtures";
import { createMockHistoricoDuplaRepository } from "../mocks/repositories";

describe("HistoricoDuplaService", () => {
  let service: HistoricoDuplaService;
  let repo: ReturnType<typeof createMockHistoricoDuplaRepository>;

  const dto = {
    arenaId: TEST_IDS.arena,
    etapaId: TEST_IDS.etapa,
    etapaNome: "Etapa Teste",
    jogador1Id: "jogador-z",
    jogador1Nome: "Jogador Z",
    jogador2Id: "jogador-a",
    jogador2Nome: "Jogador A",
    ambosForamCabecas: true,
  };

  beforeEach(() => {
    repo = createMockHistoricoDuplaRepository();
    service = new HistoricoDuplaService(repo);
  });

  describe("registrarEmLote", () => {
    it("deve gravar com a chave em ordem alfabética, qualquer que seja a ordem dos jogadores", async () => {
      repo.criarEmLote.mockResolvedValue([{ id: "h1" }]);

      const result = await service.registrarEmLote([dto]);

      expect(result).toEqual([{ id: "h1" }]);
      expect(repo.criarEmLote).toHaveBeenCalledWith([
        { ...dto, chaveNormalizada: "jogador-a_jogador-z" },
      ]);
    });

    it("deve retornar vazio sem gravar se a lista é vazia", async () => {
      expect(await service.registrarEmLote([])).toEqual([]);
      expect(repo.criarEmLote).not.toHaveBeenCalled();
    });

    it("deve propagar erro", async () => {
      repo.criarEmLote.mockRejectedValue(new Error("Erro de batch"));

      await expect(service.registrarEmLote([dto])).rejects.toThrow(
        "Erro de batch"
      );
    });
  });

  describe("limparDaEtapa", () => {
    it("deve limpar o histórico da etapa na arena", async () => {
      repo.deletarPorEtapa.mockResolvedValue(3);

      await service.limparDaEtapa(TEST_IDS.arena, TEST_IDS.etapa);

      expect(repo.deletarPorEtapa).toHaveBeenCalledWith(
        TEST_IDS.etapa,
        TEST_IDS.arena
      );
    });

    it("deve propagar erro", async () => {
      repo.deletarPorEtapa.mockRejectedValue(new Error("Erro ao limpar"));

      await expect(
        service.limparDaEtapa(TEST_IDS.arena, TEST_IDS.etapa)
      ).rejects.toThrow("Erro ao limpar");
    });
  });
});
