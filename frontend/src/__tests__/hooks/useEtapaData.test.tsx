/**
 * Testes do hook useEtapaData
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import { useEtapaData } from "@/hooks/useEtapaData";
import { FormatoEtapa } from "@/types/etapa";

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
const mockBuscarPorId = jest.fn();
const mockListarInscricoes = jest.fn();

jest.mock("@/services", () => ({
  getEtapaService: () => ({
    buscarPorId: mockBuscarPorId,
    listarInscricoes: mockListarInscricoes,
  }),
}));

describe("useEtapaData", () => {
  const mockEtapa = {
    id: "etapa-123",
    nome: "Etapa Teste",
    formato: FormatoEtapa.DUPLA_FIXA,
    totalInscritos: 16,
    maxJogadores: 32,
    qtdGrupos: 4,
    status: "aberta",
  };

  const mockInscricoes = [
    { id: "insc-1", jogadorId: "j1", jogadorNome: "Jogador 1" },
    { id: "insc-2", jogadorId: "j2", jogadorNome: "Jogador 2" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockBuscarPorId.mockResolvedValue(mockEtapa);
    mockListarInscricoes.mockResolvedValue(mockInscricoes);
  });

  describe("carregamento inicial", () => {
    it("deve iniciar com loading true", () => {
      const { result } = renderHook(() => useEtapaData("etapa-123"));

      expect(result.current.loading).toBe(true);
    });

    it("deve carregar etapa e inscrições com sucesso", async () => {
      const { result } = renderHook(() => useEtapaData("etapa-123"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.etapa).toEqual({
        ...mockEtapa,
        inscricoes: mockInscricoes,
      });
      expect(result.current.error).toBe("");
    });

    it("deve definir erro quando etapaId não fornecido", async () => {
      const { result } = renderHook(() => useEtapaData(undefined));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("ID da etapa não fornecido");
      expect(result.current.etapa).toBeNull();
    });

    it("deve definir erro quando API falha", async () => {
      mockBuscarPorId.mockRejectedValue(new Error("Erro de conexão"));

      const { result } = renderHook(() => useEtapaData("etapa-123"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Erro de conexão");
      expect(result.current.etapa).toBeNull();
    });
  });

  describe("flags derivadas", () => {
    it("deve calcular isReiDaPraia corretamente para DUPLA_FIXA", async () => {
      const { result } = renderHook(() => useEtapaData("etapa-123"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isReiDaPraia).toBe(false);
    });

    it("deve calcular isReiDaPraia corretamente para REI_DA_PRAIA", async () => {
      mockBuscarPorId.mockResolvedValue({
        ...mockEtapa,
        formato: FormatoEtapa.REI_DA_PRAIA,
      });

      const { result } = renderHook(() => useEtapaData("etapa-123"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isReiDaPraia).toBe(true);
    });

    it("deve calcular progresso corretamente", async () => {
      const { result } = renderHook(() => useEtapaData("etapa-123"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // 16/32 = 50%
      expect(result.current.progresso).toBe(50);
    });

    it("deve retornar progresso 0 quando maxJogadores é 0", async () => {
      mockBuscarPorId.mockResolvedValue({
        ...mockEtapa,
        maxJogadores: 0,
      });

      const { result } = renderHook(() => useEtapaData("etapa-123"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.progresso).toBe(0);
    });

    it("deve retornar progresso 0 quando etapa é null", () => {
      const { result } = renderHook(() => useEtapaData(undefined));

      expect(result.current.progresso).toBe(0);
    });
  });

  describe("recarregar", () => {
    it("deve recarregar dados da etapa", async () => {
      const { result } = renderHook(() => useEtapaData("etapa-123"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Limpar chamadas anteriores
      mockBuscarPorId.mockClear();
      mockListarInscricoes.mockClear();

      // Recarregar
      await act(async () => {
        await result.current.recarregar();
      });

      expect(mockBuscarPorId).toHaveBeenCalledWith("etapa-123");
      expect(mockListarInscricoes).toHaveBeenCalledWith("etapa-123");
    });
  });

  describe("mudança de etapaId", () => {
    it("deve recarregar quando etapaId muda", async () => {
      const { result, rerender } = renderHook(
        ({ etapaId }) => useEtapaData(etapaId),
        { initialProps: { etapaId: "etapa-123" } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Mudar para nova etapa
      mockBuscarPorId.mockClear();
      mockListarInscricoes.mockClear();

      rerender({ etapaId: "etapa-456" });

      await waitFor(() => {
        expect(mockBuscarPorId).toHaveBeenCalledWith("etapa-456");
      });
    });
  });
});
