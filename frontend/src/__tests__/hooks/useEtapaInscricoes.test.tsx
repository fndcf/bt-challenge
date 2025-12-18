/**
 * Testes do hook useEtapaInscricoes
 */

import { renderHook, act } from "@testing-library/react";
import { useEtapaInscricoes } from "@/hooks/useEtapaInscricoes";
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

// Mock do etapaService
const mockReabrirInscricoes = jest.fn();
const mockEncerrarInscricoes = jest.fn();
const mockEncerrarEtapa = jest.fn();
const mockCancelarInscricoesEmLote = jest.fn();

jest.mock("@/services", () => ({
  getEtapaService: () => ({
    reabrirInscricoes: mockReabrirInscricoes,
    encerrarInscricoes: mockEncerrarInscricoes,
    encerrarEtapa: mockEncerrarEtapa,
    cancelarInscricoesEmLote: mockCancelarInscricoesEmLote,
  }),
}));

// Mock do window.confirm e window.alert
const originalConfirm = window.confirm;
const originalAlert = window.alert;

describe("useEtapaInscricoes", () => {
  const mockEtapa: Etapa = {
    id: "etapa-123",
    nome: "Etapa Teste",
    formato: FormatoEtapa.DUPLA_FIXA,
    totalInscritos: 16,
    maxJogadores: 32,
    qtdGrupos: 4,
    status: "aberta",
    arenaId: "arena-1",
    dataInicio: new Date().toISOString(),
    dataFim: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
    window.alert = jest.fn();
    mockReabrirInscricoes.mockResolvedValue(undefined);
    mockEncerrarInscricoes.mockResolvedValue(undefined);
    mockEncerrarEtapa.mockResolvedValue(undefined);
    mockCancelarInscricoesEmLote.mockResolvedValue({ canceladas: 1, erros: [] });
  });

  afterAll(() => {
    window.confirm = originalConfirm;
    window.alert = originalAlert;
  });

  describe("handleAbrirInscricoes", () => {
    it("deve reabrir inscrições quando confirmado", async () => {
      const { result } = renderHook(() =>
        useEtapaInscricoes({ etapa: mockEtapa, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleAbrirInscricoes();
      });

      expect(window.confirm).toHaveBeenCalled();
      expect(mockReabrirInscricoes).toHaveBeenCalledWith("etapa-123");
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith(
        "Inscrições reabertas com sucesso!"
      );
    });

    it("não deve reabrir quando cancelado", async () => {
      (window.confirm as jest.Mock).mockReturnValue(false);

      const { result } = renderHook(() =>
        useEtapaInscricoes({ etapa: mockEtapa, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleAbrirInscricoes();
      });

      expect(mockReabrirInscricoes).not.toHaveBeenCalled();
    });

    it("não deve fazer nada quando etapa é null", async () => {
      const { result } = renderHook(() =>
        useEtapaInscricoes({ etapa: null, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleAbrirInscricoes();
      });

      expect(window.confirm).not.toHaveBeenCalled();
      expect(mockReabrirInscricoes).not.toHaveBeenCalled();
    });

    it("deve tratar erro ao reabrir inscrições", async () => {
      mockReabrirInscricoes.mockRejectedValue(new Error("Erro ao reabrir"));

      const { result } = renderHook(() =>
        useEtapaInscricoes({ etapa: mockEtapa, onSuccess: mockOnSuccess })
      );

      await expect(
        act(async () => {
          await result.current.handleAbrirInscricoes();
        })
      ).rejects.toThrow("Erro ao reabrir");

      expect(window.alert).toHaveBeenCalledWith("Erro ao reabrir");
    });

    it("deve mostrar mensagem padrão quando erro não tem message ao reabrir", async () => {
      mockReabrirInscricoes.mockRejectedValue({});

      const { result } = renderHook(() =>
        useEtapaInscricoes({ etapa: mockEtapa, onSuccess: mockOnSuccess })
      );

      await expect(
        act(async () => {
          await result.current.handleAbrirInscricoes();
        })
      ).rejects.toBeDefined();

      expect(window.alert).toHaveBeenCalledWith("Erro ao reabrir inscrições");
    });
  });

  describe("handleEncerrarInscricoes", () => {
    it("deve encerrar inscrições quando confirmado", async () => {
      const { result } = renderHook(() =>
        useEtapaInscricoes({ etapa: mockEtapa, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleEncerrarInscricoes();
      });

      expect(window.confirm).toHaveBeenCalled();
      expect(mockEncerrarInscricoes).toHaveBeenCalledWith("etapa-123");
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith(
        "Inscrições encerradas com sucesso!"
      );
    });

    it("não deve encerrar quando cancelado", async () => {
      (window.confirm as jest.Mock).mockReturnValue(false);

      const { result } = renderHook(() =>
        useEtapaInscricoes({ etapa: mockEtapa, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleEncerrarInscricoes();
      });

      expect(mockEncerrarInscricoes).not.toHaveBeenCalled();
    });

    it("não deve fazer nada quando etapa é null", async () => {
      const { result } = renderHook(() =>
        useEtapaInscricoes({ etapa: null, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleEncerrarInscricoes();
      });

      expect(mockEncerrarInscricoes).not.toHaveBeenCalled();
    });

    it("deve tratar erro ao encerrar inscrições", async () => {
      mockEncerrarInscricoes.mockRejectedValue(new Error("Erro ao encerrar"));

      const { result } = renderHook(() =>
        useEtapaInscricoes({ etapa: mockEtapa, onSuccess: mockOnSuccess })
      );

      await expect(
        act(async () => {
          await result.current.handleEncerrarInscricoes();
        })
      ).rejects.toThrow("Erro ao encerrar");

      expect(window.alert).toHaveBeenCalledWith("Erro ao encerrar");
    });

    it("deve mostrar mensagem padrão quando erro não tem message", async () => {
      mockEncerrarInscricoes.mockRejectedValue({});

      const { result } = renderHook(() =>
        useEtapaInscricoes({ etapa: mockEtapa, onSuccess: mockOnSuccess })
      );

      await expect(
        act(async () => {
          await result.current.handleEncerrarInscricoes();
        })
      ).rejects.toBeDefined();

      expect(window.alert).toHaveBeenCalledWith("Erro ao encerrar inscrições");
    });
  });

  describe("handleFinalizarEtapa", () => {
    it("deve finalizar etapa quando confirmado", async () => {
      const { result } = renderHook(() =>
        useEtapaInscricoes({ etapa: mockEtapa, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleFinalizarEtapa();
      });

      expect(window.confirm).toHaveBeenCalled();
      expect(mockEncerrarEtapa).toHaveBeenCalledWith("etapa-123");
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith(
        "Etapa finalizada com sucesso!"
      );
    });

    it("não deve finalizar quando cancelado", async () => {
      (window.confirm as jest.Mock).mockReturnValue(false);

      const { result } = renderHook(() =>
        useEtapaInscricoes({ etapa: mockEtapa, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleFinalizarEtapa();
      });

      expect(mockEncerrarEtapa).not.toHaveBeenCalled();
    });

    it("não deve fazer nada quando etapa é null", async () => {
      const { result } = renderHook(() =>
        useEtapaInscricoes({ etapa: null, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleFinalizarEtapa();
      });

      expect(mockEncerrarEtapa).not.toHaveBeenCalled();
    });

    it("deve tratar erro ao finalizar etapa", async () => {
      mockEncerrarEtapa.mockRejectedValue(new Error("Erro ao finalizar"));

      const { result } = renderHook(() =>
        useEtapaInscricoes({ etapa: mockEtapa, onSuccess: mockOnSuccess })
      );

      await expect(
        act(async () => {
          await result.current.handleFinalizarEtapa();
        })
      ).rejects.toThrow("Erro ao finalizar");

      expect(window.alert).toHaveBeenCalledWith("Erro ao finalizar");
    });

    it("deve mostrar mensagem padrão quando erro não tem message ao finalizar", async () => {
      mockEncerrarEtapa.mockRejectedValue({});

      const { result } = renderHook(() =>
        useEtapaInscricoes({ etapa: mockEtapa, onSuccess: mockOnSuccess })
      );

      await expect(
        act(async () => {
          await result.current.handleFinalizarEtapa();
        })
      ).rejects.toBeDefined();

      expect(window.alert).toHaveBeenCalledWith("Erro ao finalizar etapa");
    });
  });

  describe("handleCancelarInscricao", () => {
    it("deve cancelar inscrição quando confirmado", async () => {
      const { result } = renderHook(() =>
        useEtapaInscricoes({ etapa: mockEtapa, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleCancelarInscricao("insc-123", "João Silva");
      });

      expect(window.confirm).toHaveBeenCalledWith(
        "Deseja cancelar a inscrição de João Silva?"
      );
      expect(mockCancelarInscricoesEmLote).toHaveBeenCalledWith("etapa-123", ["insc-123"]);
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith(
        "Inscrição cancelada com sucesso!"
      );
    });

    it("não deve cancelar quando usuário nega", async () => {
      (window.confirm as jest.Mock).mockReturnValue(false);

      const { result } = renderHook(() =>
        useEtapaInscricoes({ etapa: mockEtapa, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleCancelarInscricao("insc-123", "João Silva");
      });

      expect(mockCancelarInscricoesEmLote).not.toHaveBeenCalled();
    });

    it("não deve fazer nada quando etapa é null", async () => {
      const { result } = renderHook(() =>
        useEtapaInscricoes({ etapa: null, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleCancelarInscricao("insc-123", "João Silva");
      });

      expect(mockCancelarInscricoesEmLote).not.toHaveBeenCalled();
    });

    it("deve tratar erro ao cancelar inscrição", async () => {
      mockCancelarInscricoesEmLote.mockRejectedValue(new Error("Erro ao cancelar"));

      const { result } = renderHook(() =>
        useEtapaInscricoes({ etapa: mockEtapa, onSuccess: mockOnSuccess })
      );

      await expect(
        act(async () => {
          await result.current.handleCancelarInscricao("insc-123", "João Silva");
        })
      ).rejects.toThrow("Erro ao cancelar");

      expect(window.alert).toHaveBeenCalledWith("Erro ao cancelar");
    });

    it("deve mostrar mensagem padrão quando erro não tem message ao cancelar", async () => {
      mockCancelarInscricoesEmLote.mockRejectedValue({});

      const { result } = renderHook(() =>
        useEtapaInscricoes({ etapa: mockEtapa, onSuccess: mockOnSuccess })
      );

      await expect(
        act(async () => {
          await result.current.handleCancelarInscricao("insc-123", "João Silva");
        })
      ).rejects.toBeDefined();

      expect(window.alert).toHaveBeenCalledWith("Erro ao cancelar inscrição");
    });
  });

  describe("handleCancelarMultiplosInscricoes", () => {
    it("deve cancelar múltiplas inscrições", async () => {
      mockCancelarInscricoesEmLote.mockResolvedValue({ canceladas: 3, erros: [] });

      const { result } = renderHook(() =>
        useEtapaInscricoes({ etapa: mockEtapa, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleCancelarMultiplosInscricoes([
          "insc-1",
          "insc-2",
          "insc-3",
        ]);
      });

      expect(mockCancelarInscricoesEmLote).toHaveBeenCalledWith("etapa-123", [
        "insc-1",
        "insc-2",
        "insc-3",
      ]);
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith(
        "3 inscrição(ões) cancelada(s) com sucesso!"
      );
    });

    it("deve mostrar erros quando alguns cancelamentos falham", async () => {
      mockCancelarInscricoesEmLote.mockResolvedValue({
        canceladas: 2,
        erros: ["Erro no insc-3"],
      });

      const { result } = renderHook(() =>
        useEtapaInscricoes({ etapa: mockEtapa, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleCancelarMultiplosInscricoes([
          "insc-1",
          "insc-2",
          "insc-3",
        ]);
      });

      expect(window.alert).toHaveBeenCalledWith(
        "2 inscrição(ões) cancelada(s).\n1 erro(s): Erro no insc-3"
      );
    });

    it("não deve fazer nada quando etapa é null", async () => {
      const { result } = renderHook(() =>
        useEtapaInscricoes({ etapa: null, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleCancelarMultiplosInscricoes(["insc-1"]);
      });

      expect(mockCancelarInscricoesEmLote).not.toHaveBeenCalled();
    });

    it("deve propagar erro ao cancelar múltiplas inscrições", async () => {
      mockCancelarInscricoesEmLote.mockRejectedValue(new Error("Erro ao cancelar"));

      const { result } = renderHook(() =>
        useEtapaInscricoes({ etapa: mockEtapa, onSuccess: mockOnSuccess })
      );

      await expect(
        act(async () => {
          await result.current.handleCancelarMultiplosInscricoes(["insc-1"]);
        })
      ).rejects.toThrow("Erro ao cancelar");
    });
  });

  describe("sem callback onSuccess", () => {
    it("deve funcionar sem onSuccess", async () => {
      const { result } = renderHook(() =>
        useEtapaInscricoes({ etapa: mockEtapa })
      );

      await act(async () => {
        await result.current.handleAbrirInscricoes();
      });

      expect(mockReabrirInscricoes).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith(
        "Inscrições reabertas com sucesso!"
      );
    });
  });
});
