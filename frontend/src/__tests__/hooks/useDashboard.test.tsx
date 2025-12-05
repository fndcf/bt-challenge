/**
 * Testes do hook useDashboard
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import { useDashboard } from "@/pages/Dashboard/hooks/useDashboard";

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

// Mocks dos services
const mockObterEstatisticas = jest.fn();
const mockListarJogadores = jest.fn();

jest.mock("@/services", () => ({
  getEtapaService: () => ({
    obterEstatisticas: mockObterEstatisticas,
  }),
  getJogadorService: () => ({
    listar: mockListarJogadores,
  }),
}));

describe("useDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve retornar estado inicial correto", () => {
    mockObterEstatisticas.mockResolvedValue({
      totalEtapas: 0,
      inscricoesAbertas: 0,
      emAndamento: 0,
      finalizadas: 0,
    });
    mockListarJogadores.mockResolvedValue({ total: 0, jogadores: [] });

    const { result } = renderHook(() => useDashboard());

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("deve carregar estatísticas com sucesso", async () => {
    mockObterEstatisticas.mockResolvedValue({
      totalEtapas: 10,
      inscricoesAbertas: 3,
      emAndamento: 2,
      finalizadas: 5,
    });
    mockListarJogadores.mockResolvedValue({ total: 50, jogadores: [] });

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toEqual({
      totalJogadores: 50,
      totalEtapas: 10,
      inscricoesAbertas: 3,
      emAndamento: 2,
      finalizadas: 5,
    });
    expect(result.current.error).toBeNull();
  });

  it("deve tratar erro no carregamento", async () => {
    mockObterEstatisticas.mockRejectedValue({
      response: { data: { error: "Erro de conexão" } },
    });
    mockListarJogadores.mockResolvedValue({ total: 0, jogadores: [] });

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Erro de conexão");
  });

  it("deve usar mensagem padrão quando erro não tem message", async () => {
    mockObterEstatisticas.mockRejectedValue({});
    mockListarJogadores.mockResolvedValue({ total: 0, jogadores: [] });

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Erro ao carregar estatísticas");
  });

  it("deve recarregar dados ao chamar recarregar", async () => {
    mockObterEstatisticas.mockResolvedValue({
      totalEtapas: 10,
      inscricoesAbertas: 3,
      emAndamento: 2,
      finalizadas: 5,
    });
    mockListarJogadores.mockResolvedValue({ total: 50, jogadores: [] });

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockObterEstatisticas).toHaveBeenCalledTimes(1);

    mockObterEstatisticas.mockClear();

    // Simular nova chamada
    mockObterEstatisticas.mockResolvedValue({
      totalEtapas: 15,
      inscricoesAbertas: 5,
      emAndamento: 3,
      finalizadas: 7,
    });

    await act(async () => {
      result.current.recarregar();
    });

    await waitFor(() => {
      expect(mockObterEstatisticas).toHaveBeenCalledTimes(1);
    });
  });

  it("deve atualizar stats quando recarregar sucede", async () => {
    mockObterEstatisticas.mockResolvedValue({
      totalEtapas: 10,
      inscricoesAbertas: 3,
      emAndamento: 2,
      finalizadas: 5,
    });
    mockListarJogadores.mockResolvedValue({ total: 50, jogadores: [] });

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats.totalEtapas).toBe(10);

    // Simular nova chamada com dados diferentes
    mockObterEstatisticas.mockResolvedValue({
      totalEtapas: 20,
      inscricoesAbertas: 8,
      emAndamento: 4,
      finalizadas: 8,
    });
    mockListarJogadores.mockResolvedValue({ total: 100, jogadores: [] });

    await act(async () => {
      result.current.recarregar();
    });

    await waitFor(() => {
      expect(result.current.stats.totalEtapas).toBe(20);
    });

    expect(result.current.stats.totalJogadores).toBe(100);
  });
});
