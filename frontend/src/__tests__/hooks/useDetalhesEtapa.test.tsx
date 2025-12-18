/**
 * Testes do hook useDetalhesEtapa
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import { useDetalhesEtapa } from "@/hooks/useDetalhesEtapa";
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

// Mock dos services
const mockBuscarPorId = jest.fn();
const mockListarInscricoes = jest.fn();
const mockReabrirInscricoes = jest.fn();
const mockEncerrarInscricoes = jest.fn();
const mockEncerrarEtapa = jest.fn();
const mockCancelarInscricao = jest.fn();
const mockCancelarInscricoesEmLote = jest.fn();
const mockGerarChavesDuplaFixa = jest.fn();
const mockExcluirChaves = jest.fn();
const mockGerarChavesReiDaPraia = jest.fn();

jest.mock("@/services", () => ({
  getEtapaService: () => ({
    buscarPorId: mockBuscarPorId,
    listarInscricoes: mockListarInscricoes,
    reabrirInscricoes: mockReabrirInscricoes,
    encerrarInscricoes: mockEncerrarInscricoes,
    encerrarEtapa: mockEncerrarEtapa,
    cancelarInscricao: mockCancelarInscricao,
    cancelarInscricoesEmLote: mockCancelarInscricoesEmLote,
  }),
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

describe("useDetalhesEtapa", () => {
  const mockEtapa = {
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

  const mockInscricoes = [
    { id: "insc-1", jogadorId: "j1", jogadorNome: "Jogador 1" },
    { id: "insc-2", jogadorId: "j2", jogadorNome: "Jogador 2" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
    window.alert = jest.fn();
    mockBuscarPorId.mockResolvedValue(mockEtapa);
    mockListarInscricoes.mockResolvedValue(mockInscricoes);
    mockReabrirInscricoes.mockResolvedValue(undefined);
    mockEncerrarInscricoes.mockResolvedValue(undefined);
    mockEncerrarEtapa.mockResolvedValue(undefined);
    mockCancelarInscricoesEmLote.mockResolvedValue({ canceladas: 1, erros: [] });
    mockGerarChavesDuplaFixa.mockResolvedValue(undefined);
    mockExcluirChaves.mockResolvedValue(undefined);
  });

  afterAll(() => {
    window.confirm = originalConfirm;
    window.alert = originalAlert;
  });

  describe("composição de hooks", () => {
    it("deve carregar dados da etapa corretamente", async () => {
      const { result } = renderHook(() => useDetalhesEtapa("etapa-123"));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.etapa).toEqual({
        ...mockEtapa,
        inscricoes: mockInscricoes,
      });
      expect(result.current.error).toBe("");
    });

    it("deve expor flags derivadas corretas", async () => {
      const { result } = renderHook(() => useDetalhesEtapa("etapa-123"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isReiDaPraia).toBe(false);
      expect(result.current.progresso).toBe(50); // 16/32 = 50%
    });

    it("deve expor estado de UI inicial", async () => {
      const { result } = renderHook(() => useDetalhesEtapa("etapa-123"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.abaAtiva).toBe("inscricoes");
      expect(result.current.modalInscricaoAberto).toBe(false);
      expect(result.current.modalConfirmacaoAberto).toBe(false);
    });
  });

  describe("ações de UI", () => {
    it("deve mudar aba ativa", async () => {
      const { result } = renderHook(() => useDetalhesEtapa("etapa-123"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setAbaAtiva("chaves");
      });

      expect(result.current.abaAtiva).toBe("chaves");
    });

    it("deve abrir modal de inscrição", async () => {
      const { result } = renderHook(() => useDetalhesEtapa("etapa-123"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setModalInscricaoAberto(true);
      });

      expect(result.current.modalInscricaoAberto).toBe(true);
    });

    it("deve abrir modal de confirmação", async () => {
      const { result } = renderHook(() => useDetalhesEtapa("etapa-123"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setModalConfirmacaoAberto(true);
      });

      expect(result.current.modalConfirmacaoAberto).toBe(true);
    });
  });

  describe("ações de inscrições", () => {
    it("deve abrir inscrições", async () => {
      const { result } = renderHook(() => useDetalhesEtapa("etapa-123"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.handleAbrirInscricoes();
      });

      expect(mockReabrirInscricoes).toHaveBeenCalledWith("etapa-123");
    });

    it("deve encerrar inscrições", async () => {
      const { result } = renderHook(() => useDetalhesEtapa("etapa-123"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.handleEncerrarInscricoes();
      });

      expect(mockEncerrarInscricoes).toHaveBeenCalledWith("etapa-123");
    });

    it("deve finalizar etapa", async () => {
      const { result } = renderHook(() => useDetalhesEtapa("etapa-123"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.handleFinalizarEtapa();
      });

      expect(mockEncerrarEtapa).toHaveBeenCalledWith("etapa-123");
    });

    it("deve cancelar inscrição", async () => {
      const { result } = renderHook(() => useDetalhesEtapa("etapa-123"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.handleCancelarInscricao("insc-1", "Jogador 1");
      });

      expect(mockCancelarInscricoesEmLote).toHaveBeenCalledWith("etapa-123", ["insc-1"]);
    });

    it("deve cancelar múltiplas inscrições", async () => {
      mockCancelarInscricoesEmLote.mockResolvedValue({ canceladas: 2, erros: [] });
      const { result } = renderHook(() => useDetalhesEtapa("etapa-123"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.handleCancelarMultiplosInscricoes([
          "insc-1",
          "insc-2",
        ]);
      });

      expect(mockCancelarInscricoesEmLote).toHaveBeenCalledWith("etapa-123", [
        "insc-1",
        "insc-2",
      ]);
    });
  });

  describe("ações de chaves", () => {
    it("deve gerar chaves", async () => {
      const { result } = renderHook(() => useDetalhesEtapa("etapa-123"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.handleGerarChaves();
      });

      expect(mockGerarChavesDuplaFixa).toHaveBeenCalledWith("etapa-123");
    });

    it("deve apagar chaves", async () => {
      const { result } = renderHook(() => useDetalhesEtapa("etapa-123"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.handleApagarChaves();
      });

      expect(mockExcluirChaves).toHaveBeenCalledWith("etapa-123");
    });
  });

  describe("recarregar etapa", () => {
    it("deve recarregar dados da etapa", async () => {
      const { result } = renderHook(() => useDetalhesEtapa("etapa-123"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockBuscarPorId.mockClear();
      mockListarInscricoes.mockClear();

      await act(async () => {
        await result.current.carregarEtapa();
      });

      expect(mockBuscarPorId).toHaveBeenCalledWith("etapa-123");
      expect(mockListarInscricoes).toHaveBeenCalledWith("etapa-123");
    });
  });

  describe("sem etapaId", () => {
    it("deve mostrar erro quando etapaId não fornecido", async () => {
      const { result } = renderHook(() => useDetalhesEtapa(undefined));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("ID da etapa não fornecido");
      expect(result.current.etapa).toBeNull();
    });
  });

  describe("Rei da Praia", () => {
    it("deve identificar formato Rei da Praia", async () => {
      mockBuscarPorId.mockResolvedValue({
        ...mockEtapa,
        formato: FormatoEtapa.REI_DA_PRAIA,
      });

      const { result } = renderHook(() => useDetalhesEtapa("etapa-123"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isReiDaPraia).toBe(true);
    });
  });
});
