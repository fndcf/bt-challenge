/**
 * Testes do hook useEtapaDetalhe
 */

import { renderHook, waitFor } from "@testing-library/react";
import { useEtapaDetalhe } from "@/pages/EtapaDetalhe/hooks/useEtapaDetalhe";

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

// Mocks do service
const mockBuscarArena = jest.fn();
const mockBuscarEtapa = jest.fn();
const mockBuscarInscritosEtapa = jest.fn();
const mockBuscarGruposEtapa = jest.fn();
const mockBuscarChavesEtapa = jest.fn();

jest.mock("@/services", () => ({
  getArenaPublicService: () => ({
    buscarArena: mockBuscarArena,
    buscarEtapa: mockBuscarEtapa,
    buscarInscritosEtapa: mockBuscarInscritosEtapa,
    buscarGruposEtapa: mockBuscarGruposEtapa,
    buscarChavesEtapa: mockBuscarChavesEtapa,
  }),
}));

const mockArena = {
  id: "arena-1",
  nome: "Arena Teste",
  slug: "arena-teste",
};

const mockEtapa = {
  id: "etapa-1",
  nome: "Etapa 1",
  formato: "DUPLA_FIXA",
  status: "ABERTA",
  maxJogadores: 16,
  totalInscritos: 8,
};

const mockJogadores = [
  { id: "j1", nome: "João Silva", nivel: "INTERMEDIARIO" },
  { id: "j2", nome: "Maria Santos", nivel: "AVANCADO" },
];

const mockGrupos = [
  { id: "g1", nome: "Grupo A", jogadores: ["j1", "j2"] },
  { id: "g2", nome: "Grupo B", jogadores: ["j3", "j4"] },
];

const mockChaves = {
  eliminatorias: [{ rodada: 1, partidas: [] }],
};

describe("useEtapaDetalhe", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Estado inicial", () => {
    it("deve iniciar com loading true", () => {
      mockBuscarArena.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() =>
        useEtapaDetalhe("arena-teste", "etapa-1")
      );

      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe("");
    });
  });

  describe("Validação de parâmetros", () => {
    it("deve retornar erro quando slug não é fornecido", async () => {
      const { result } = renderHook(() =>
        useEtapaDetalhe(undefined, "etapa-1")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Parâmetros inválidos");
    });

    it("deve retornar erro quando etapaId não é fornecido", async () => {
      const { result } = renderHook(() =>
        useEtapaDetalhe("arena-teste", undefined)
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Parâmetros inválidos");
    });
  });

  describe("Carregamento de dados", () => {
    it("deve carregar todos os dados com sucesso", async () => {
      mockBuscarArena.mockResolvedValue(mockArena);
      mockBuscarEtapa.mockResolvedValue(mockEtapa);
      mockBuscarInscritosEtapa.mockResolvedValue(mockJogadores);
      mockBuscarGruposEtapa.mockResolvedValue(mockGrupos);
      mockBuscarChavesEtapa.mockResolvedValue(mockChaves);

      const { result } = renderHook(() =>
        useEtapaDetalhe("arena-teste", "etapa-1")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.arena).toEqual(mockArena);
      expect(result.current.etapa).toEqual(mockEtapa);
      expect(result.current.jogadores).toEqual(mockJogadores);
      expect(result.current.grupos).toEqual(mockGrupos);
      expect(result.current.chaves).toEqual(mockChaves);
      expect(result.current.error).toBe("");
    });

    it("deve carregar arena corretamente", async () => {
      mockBuscarArena.mockResolvedValue(mockArena);
      mockBuscarEtapa.mockResolvedValue(mockEtapa);
      mockBuscarInscritosEtapa.mockResolvedValue([]);
      mockBuscarGruposEtapa.mockResolvedValue([]);
      mockBuscarChavesEtapa.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useEtapaDetalhe("arena-teste", "etapa-1")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockBuscarArena).toHaveBeenCalledWith("arena-teste");
      expect(result.current.arena?.nome).toBe("Arena Teste");
    });

    it("deve carregar etapa corretamente", async () => {
      mockBuscarArena.mockResolvedValue(mockArena);
      mockBuscarEtapa.mockResolvedValue(mockEtapa);
      mockBuscarInscritosEtapa.mockResolvedValue([]);
      mockBuscarGruposEtapa.mockResolvedValue([]);
      mockBuscarChavesEtapa.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useEtapaDetalhe("arena-teste", "etapa-1")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockBuscarEtapa).toHaveBeenCalledWith("arena-teste", "etapa-1");
      expect(result.current.etapa?.nome).toBe("Etapa 1");
    });

    it("deve carregar jogadores inscritos", async () => {
      mockBuscarArena.mockResolvedValue(mockArena);
      mockBuscarEtapa.mockResolvedValue(mockEtapa);
      mockBuscarInscritosEtapa.mockResolvedValue(mockJogadores);
      mockBuscarGruposEtapa.mockResolvedValue([]);
      mockBuscarChavesEtapa.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useEtapaDetalhe("arena-teste", "etapa-1")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockBuscarInscritosEtapa).toHaveBeenCalledWith(
        "arena-teste",
        "etapa-1"
      );
      expect(result.current.jogadores).toHaveLength(2);
      expect(result.current.jogadores[0].nome).toBe("João Silva");
    });

    it("deve carregar grupos quando existem", async () => {
      mockBuscarArena.mockResolvedValue(mockArena);
      mockBuscarEtapa.mockResolvedValue(mockEtapa);
      mockBuscarInscritosEtapa.mockResolvedValue([]);
      mockBuscarGruposEtapa.mockResolvedValue(mockGrupos);
      mockBuscarChavesEtapa.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useEtapaDetalhe("arena-teste", "etapa-1")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockBuscarGruposEtapa).toHaveBeenCalledWith(
        "arena-teste",
        "etapa-1"
      );
      expect(result.current.grupos).toHaveLength(2);
      expect(result.current.grupos[0].nome).toBe("Grupo A");
    });

    it("deve retornar array vazio quando não há grupos", async () => {
      mockBuscarArena.mockResolvedValue(mockArena);
      mockBuscarEtapa.mockResolvedValue(mockEtapa);
      mockBuscarInscritosEtapa.mockResolvedValue([]);
      mockBuscarGruposEtapa.mockResolvedValue(null);
      mockBuscarChavesEtapa.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useEtapaDetalhe("arena-teste", "etapa-1")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.grupos).toEqual([]);
    });

    it("deve carregar chaves quando existem", async () => {
      mockBuscarArena.mockResolvedValue(mockArena);
      mockBuscarEtapa.mockResolvedValue(mockEtapa);
      mockBuscarInscritosEtapa.mockResolvedValue([]);
      mockBuscarGruposEtapa.mockResolvedValue([]);
      mockBuscarChavesEtapa.mockResolvedValue(mockChaves);

      const { result } = renderHook(() =>
        useEtapaDetalhe("arena-teste", "etapa-1")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockBuscarChavesEtapa).toHaveBeenCalledWith(
        "arena-teste",
        "etapa-1"
      );
      expect(result.current.chaves).toBeTruthy();
    });
  });

  describe("Tratamento de erros", () => {
    it("deve tratar erro ao buscar arena", async () => {
      mockBuscarArena.mockRejectedValue(new Error("Arena não encontrada"));

      const { result } = renderHook(() =>
        useEtapaDetalhe("arena-inexistente", "etapa-1")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Arena não encontrada");
    });

    it("deve tratar erro ao buscar etapa", async () => {
      mockBuscarArena.mockResolvedValue(mockArena);
      mockBuscarEtapa.mockRejectedValue(new Error("Etapa não encontrada"));

      const { result } = renderHook(() =>
        useEtapaDetalhe("arena-teste", "etapa-inexistente")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Etapa não encontrada");
    });

    it("deve usar mensagem padrão quando erro não tem message", async () => {
      mockBuscarArena.mockRejectedValue({});

      const { result } = renderHook(() =>
        useEtapaDetalhe("arena-teste", "etapa-1")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Erro ao carregar detalhes da etapa");
    });
  });

  describe("Recarregamento quando parâmetros mudam", () => {
    it("deve recarregar dados quando slug muda", async () => {
      mockBuscarArena.mockResolvedValue(mockArena);
      mockBuscarEtapa.mockResolvedValue(mockEtapa);
      mockBuscarInscritosEtapa.mockResolvedValue([]);
      mockBuscarGruposEtapa.mockResolvedValue([]);
      mockBuscarChavesEtapa.mockResolvedValue(null);

      const { result, rerender } = renderHook(
        ({ slug, etapaId }) => useEtapaDetalhe(slug, etapaId),
        { initialProps: { slug: "arena-1", etapaId: "etapa-1" } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockBuscarArena).toHaveBeenCalledTimes(1);

      rerender({ slug: "arena-2", etapaId: "etapa-1" });

      await waitFor(() => {
        expect(mockBuscarArena).toHaveBeenCalledTimes(2);
      });
    });

    it("deve recarregar dados quando etapaId muda", async () => {
      mockBuscarArena.mockResolvedValue(mockArena);
      mockBuscarEtapa.mockResolvedValue(mockEtapa);
      mockBuscarInscritosEtapa.mockResolvedValue([]);
      mockBuscarGruposEtapa.mockResolvedValue([]);
      mockBuscarChavesEtapa.mockResolvedValue(null);

      const { result, rerender } = renderHook(
        ({ slug, etapaId }) => useEtapaDetalhe(slug, etapaId),
        { initialProps: { slug: "arena-teste", etapaId: "etapa-1" } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockBuscarEtapa).toHaveBeenCalledTimes(1);

      rerender({ slug: "arena-teste", etapaId: "etapa-2" });

      await waitFor(() => {
        expect(mockBuscarEtapa).toHaveBeenCalledTimes(2);
      });
    });
  });
});
