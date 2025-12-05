/**
 * Testes do hook useEtapaChaves
 */

import { renderHook, act } from "@testing-library/react";
import { useEtapaChaves } from "@/hooks/useEtapaChaves";
import { Etapa, FormatoEtapa } from "@/types/etapa";

// Mock do logger
jest.mock("@/utils/logger", () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock dos services
const mockGerarChavesDuplaFixa = jest.fn();
const mockExcluirChaves = jest.fn();
const mockGerarChavesReiDaPraia = jest.fn();

jest.mock("@/services", () => ({
  getChaveService: () => ({
    gerarChaves: mockGerarChavesDuplaFixa,
    excluirChaves: mockExcluirChaves,
  }),
  getReiDaPraiaService: () => ({
    gerarChaves: mockGerarChavesReiDaPraia,
  }),
}));

// Mock do window.confirm e window.alert
const originalConfirm = window.confirm;
const originalAlert = window.alert;

describe("useEtapaChaves", () => {
  const mockEtapaDuplaFixa: Etapa = {
    id: "etapa-123",
    nome: "Etapa Dupla Fixa",
    formato: FormatoEtapa.DUPLA_FIXA,
    totalInscritos: 16,
    maxJogadores: 32,
    qtdGrupos: 4,
    status: "em_andamento",
    arenaId: "arena-1",
    dataInicio: new Date().toISOString(),
    dataFim: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockEtapaReiDaPraia: Etapa = {
    ...mockEtapaDuplaFixa,
    id: "etapa-456",
    nome: "Etapa Rei da Praia",
    formato: FormatoEtapa.REI_DA_PRAIA,
    totalInscritos: 20,
  };

  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
    window.alert = jest.fn();
    mockGerarChavesDuplaFixa.mockResolvedValue(undefined);
    mockGerarChavesReiDaPraia.mockResolvedValue(undefined);
    mockExcluirChaves.mockResolvedValue(undefined);
  });

  afterAll(() => {
    window.confirm = originalConfirm;
    window.alert = originalAlert;
  });

  describe("handleGerarChaves - Dupla Fixa", () => {
    it("deve gerar chaves para Dupla Fixa quando confirmado", async () => {
      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: mockEtapaDuplaFixa, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleGerarChaves();
      });

      expect(window.confirm).toHaveBeenCalled();
      expect(mockGerarChavesDuplaFixa).toHaveBeenCalledWith("etapa-123");
      expect(mockOnSuccess).toHaveBeenCalledWith("chaves");
      expect(window.alert).toHaveBeenCalledWith("Chaves geradas com sucesso!");
    });

    it("não deve gerar chaves quando cancelado", async () => {
      (window.confirm as jest.Mock).mockReturnValue(false);

      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: mockEtapaDuplaFixa, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleGerarChaves();
      });

      expect(mockGerarChavesDuplaFixa).not.toHaveBeenCalled();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("não deve fazer nada quando etapa é null", async () => {
      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: null, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleGerarChaves();
      });

      expect(window.confirm).not.toHaveBeenCalled();
      expect(mockGerarChavesDuplaFixa).not.toHaveBeenCalled();
    });

    it("deve tratar erro ao gerar chaves", async () => {
      mockGerarChavesDuplaFixa.mockRejectedValue(new Error("Erro ao gerar"));

      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: mockEtapaDuplaFixa, onSuccess: mockOnSuccess })
      );

      await expect(
        act(async () => {
          await result.current.handleGerarChaves();
        })
      ).rejects.toThrow("Erro ao gerar");

      expect(window.alert).toHaveBeenCalledWith("Erro ao gerar");
    });
  });

  describe("handleGerarChaves - Rei da Praia", () => {
    it("deve gerar chaves para Rei da Praia quando confirmado", async () => {
      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: mockEtapaReiDaPraia, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleGerarChaves();
      });

      expect(window.confirm).toHaveBeenCalled();
      expect(mockGerarChavesReiDaPraia).toHaveBeenCalledWith("etapa-456");
      expect(mockGerarChavesDuplaFixa).not.toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalledWith("chaves");
      expect(window.alert).toHaveBeenCalledWith("Chaves geradas com sucesso!");
    });

    it("deve mostrar informações de Rei da Praia no confirm", async () => {
      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: mockEtapaReiDaPraia, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleGerarChaves();
      });

      const confirmCall = (window.confirm as jest.Mock).mock.calls[0][0];
      expect(confirmCall).toContain("Rei da Praia");
      expect(confirmCall).toContain("grupos de 4 jogadores");
    });
  });

  describe("handleApagarChaves", () => {
    it("deve apagar chaves quando confirmado", async () => {
      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: mockEtapaDuplaFixa, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleApagarChaves();
      });

      expect(window.confirm).toHaveBeenCalled();
      expect(mockExcluirChaves).toHaveBeenCalledWith("etapa-123");
      expect(mockOnSuccess).toHaveBeenCalledWith("inscricoes");
      expect(window.alert).toHaveBeenCalledWith("Chaves apagadas com sucesso!");
    });

    it("não deve apagar chaves quando cancelado", async () => {
      (window.confirm as jest.Mock).mockReturnValue(false);

      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: mockEtapaDuplaFixa, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleApagarChaves();
      });

      expect(mockExcluirChaves).not.toHaveBeenCalled();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("não deve fazer nada quando etapa é null", async () => {
      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: null, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleApagarChaves();
      });

      expect(window.confirm).not.toHaveBeenCalled();
      expect(mockExcluirChaves).not.toHaveBeenCalled();
    });

    it("deve tratar erro ao apagar chaves", async () => {
      mockExcluirChaves.mockRejectedValue(new Error("Erro ao apagar"));

      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: mockEtapaDuplaFixa, onSuccess: mockOnSuccess })
      );

      await expect(
        act(async () => {
          await result.current.handleApagarChaves();
        })
      ).rejects.toThrow("Erro ao apagar");

      expect(window.alert).toHaveBeenCalledWith("Erro ao apagar");
    });

    it("deve mostrar mensagem de alerta no confirm de apagar", async () => {
      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: mockEtapaDuplaFixa, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleApagarChaves();
      });

      const confirmCall = (window.confirm as jest.Mock).mock.calls[0][0];
      expect(confirmCall).toContain("ATENÇÃO");
      expect(confirmCall).toContain("Todos os grupos");
      expect(confirmCall).toContain("Todas as partidas");
      expect(confirmCall).toContain("Todos os resultados");
    });
  });

  describe("sem callback onSuccess", () => {
    it("deve funcionar sem onSuccess ao gerar chaves", async () => {
      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: mockEtapaDuplaFixa })
      );

      await act(async () => {
        await result.current.handleGerarChaves();
      });

      expect(mockGerarChavesDuplaFixa).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith("Chaves geradas com sucesso!");
    });

    it("deve funcionar sem onSuccess ao apagar chaves", async () => {
      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: mockEtapaDuplaFixa })
      );

      await act(async () => {
        await result.current.handleApagarChaves();
      });

      expect(mockExcluirChaves).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith("Chaves apagadas com sucesso!");
    });
  });
});
