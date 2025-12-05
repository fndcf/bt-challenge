/**
 * Testes do hook useArenaPublica
 */

import { renderHook, waitFor } from "@testing-library/react";
import { useArenaPublica } from "@/hooks/useArenaPublica";

// Mock do serviço
const mockBuscarArena = jest.fn();
const mockListarEtapas = jest.fn();

jest.mock("@/services", () => ({
  getArenaPublicService: () => ({
    buscarArena: mockBuscarArena,
    listarEtapas: mockListarEtapas,
  }),
}));

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

const mockArena = {
  id: "arena-1",
  nome: "Arena Teste",
  slug: "arena-teste",
};

const mockEtapas = [
  { id: "etapa-1", nome: "Etapa 1" },
  { id: "etapa-2", nome: "Etapa 2" },
];

describe("useArenaPublica", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve iniciar com loading true", () => {
    mockBuscarArena.mockResolvedValue(mockArena);
    mockListarEtapas.mockResolvedValue(mockEtapas);

    const { result } = renderHook(() => useArenaPublica("arena-teste"));

    expect(result.current.loading).toBe(true);
  });

  it("deve carregar arena e etapas com sucesso", async () => {
    mockBuscarArena.mockResolvedValue(mockArena);
    mockListarEtapas.mockResolvedValue(mockEtapas);

    const { result } = renderHook(() => useArenaPublica("arena-teste"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.arena).toEqual(mockArena);
    expect(result.current.etapas).toEqual(mockEtapas);
    expect(result.current.error).toBe("");
  });

  it("deve setar erro quando slug não é fornecido", async () => {
    const { result } = renderHook(() => useArenaPublica(undefined));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Arena não encontrada");
    expect(result.current.arena).toBeNull();
  });

  it("deve setar erro quando busca falha", async () => {
    mockBuscarArena.mockRejectedValue(new Error("Erro de conexão"));

    const { result } = renderHook(() => useArenaPublica("arena-teste"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Erro de conexão");
    expect(result.current.arena).toBeNull();
  });

  it("deve chamar serviços com slug correto", async () => {
    mockBuscarArena.mockResolvedValue(mockArena);
    mockListarEtapas.mockResolvedValue(mockEtapas);

    renderHook(() => useArenaPublica("minha-arena"));

    await waitFor(() => {
      expect(mockBuscarArena).toHaveBeenCalledWith("minha-arena");
      expect(mockListarEtapas).toHaveBeenCalledWith("minha-arena");
    });
  });

  it("deve recarregar quando slug muda", async () => {
    mockBuscarArena.mockResolvedValue(mockArena);
    mockListarEtapas.mockResolvedValue(mockEtapas);

    const { rerender } = renderHook(({ slug }) => useArenaPublica(slug), {
      initialProps: { slug: "arena-1" },
    });

    await waitFor(() => {
      expect(mockBuscarArena).toHaveBeenCalledWith("arena-1");
    });

    rerender({ slug: "arena-2" });

    await waitFor(() => {
      expect(mockBuscarArena).toHaveBeenCalledWith("arena-2");
    });
  });

  it("deve limpar erro ao recarregar", async () => {
    mockBuscarArena.mockRejectedValueOnce(new Error("Erro"));
    mockBuscarArena.mockResolvedValueOnce(mockArena);
    mockListarEtapas.mockResolvedValue(mockEtapas);

    const { result, rerender } = renderHook(({ slug }) => useArenaPublica(slug), {
      initialProps: { slug: "arena-erro" },
    });

    await waitFor(() => {
      expect(result.current.error).toBe("Erro");
    });

    rerender({ slug: "arena-ok" });

    await waitFor(() => {
      expect(result.current.error).toBe("");
      expect(result.current.arena).toEqual(mockArena);
    });
  });
});
