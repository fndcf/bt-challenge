/**
 * Testes do hook useEtapaChaves
 */

import { renderHook, act } from "@testing-library/react";
import { useEtapaChaves } from "@/hooks/useEtapaChaves";
import { Etapa, FormatoEtapa } from "@/types/etapa";
import { avisarMock, confirmarMock, usarDialogosDeTeste } from "../mocks/dialogos";

usarDialogosDeTeste();

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
    mockGerarChavesDuplaFixa.mockResolvedValue(undefined);
    mockGerarChavesReiDaPraia.mockResolvedValue(undefined);
    mockExcluirChaves.mockResolvedValue(undefined);
  });

  afterAll(() => {
  });

  describe("handleGerarChaves - Dupla Fixa", () => {
    it("deve gerar chaves para Dupla Fixa quando confirmado", async () => {
      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: mockEtapaDuplaFixa, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleGerarChaves();
      });

      expect(confirmarMock).toHaveBeenCalled();
      expect(mockGerarChavesDuplaFixa).toHaveBeenCalledWith("etapa-123");
      expect(mockOnSuccess).toHaveBeenCalledWith("chaves");
      expect(avisarMock).toHaveBeenCalledWith("Chaves geradas com sucesso!", "success");
    });

    it("não deve gerar chaves quando cancelado", async () => {
      confirmarMock.mockResolvedValue(false);

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

      expect(confirmarMock).not.toHaveBeenCalled();
      expect(mockGerarChavesDuplaFixa).not.toHaveBeenCalled();
    });

    it("deve tratar erro ao gerar chaves", async () => {
      mockGerarChavesDuplaFixa.mockRejectedValue(new Error("Erro ao gerar"));

      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: mockEtapaDuplaFixa, onSuccess: mockOnSuccess })
      );

      await expect(
        Promise.resolve(
          act(async () => {
            await result.current.handleGerarChaves();
          })
        )
      ).rejects.toThrow("Erro ao gerar");

      expect(avisarMock).toHaveBeenCalledWith("Erro ao gerar", "error");
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

      expect(confirmarMock).toHaveBeenCalled();
      expect(mockGerarChavesReiDaPraia).toHaveBeenCalledWith("etapa-456");
      expect(mockGerarChavesDuplaFixa).not.toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalledWith("chaves");
      expect(avisarMock).toHaveBeenCalledWith("Chaves geradas com sucesso!", "success");
    });

    it("deve mostrar informações de Rei da Praia no confirm", async () => {
      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: mockEtapaReiDaPraia, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleGerarChaves();
      });

      const confirmCall = confirmarMock.mock.calls[0][0].mensagem;
      expect(confirmCall).toContain("Rei da Praia");
      expect(confirmCall).toContain("grupos de 4 jogadores");
    });
  });

  describe("handleApagarChaves", () => {
    // Nota: A confirmação agora é feita pelo componente (ConfirmacaoPerigosa modal)
    // O hook apenas executa a ação diretamente
    it("deve apagar chaves diretamente (sem confirm - confirmação feita pelo componente)", async () => {
      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: mockEtapaDuplaFixa, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleApagarChaves();
      });

      // Não deve chamar confirmarMock - a confirmação é feita pelo componente
      expect(confirmarMock).not.toHaveBeenCalled();
      expect(mockExcluirChaves).toHaveBeenCalledWith("etapa-123");
      expect(mockOnSuccess).toHaveBeenCalledWith("inscricoes");
      expect(avisarMock).toHaveBeenCalledWith("Chaves apagadas com sucesso!", "success");
    });

    it("não deve fazer nada quando etapa é null", async () => {
      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: null, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleApagarChaves();
      });

      expect(mockExcluirChaves).not.toHaveBeenCalled();
    });

    it("deve tratar erro ao apagar chaves", async () => {
      mockExcluirChaves.mockRejectedValue(new Error("Erro ao apagar"));

      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: mockEtapaDuplaFixa, onSuccess: mockOnSuccess })
      );

      await expect(
        Promise.resolve(
          act(async () => {
            await result.current.handleApagarChaves();
          })
        )
      ).rejects.toThrow("Erro ao apagar");

      expect(avisarMock).toHaveBeenCalledWith("Erro ao apagar", "error");
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
      expect(avisarMock).toHaveBeenCalledWith("Chaves geradas com sucesso!", "success");
    });

    it("deve funcionar sem onSuccess ao apagar chaves", async () => {
      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: mockEtapaDuplaFixa })
      );

      await act(async () => {
        await result.current.handleApagarChaves();
      });

      expect(mockExcluirChaves).toHaveBeenCalled();
      expect(avisarMock).toHaveBeenCalledWith("Chaves apagadas com sucesso!", "success");
    });
  });
});
