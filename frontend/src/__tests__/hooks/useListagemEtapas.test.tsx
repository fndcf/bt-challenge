/**
 * Testes do hook useListagemEtapas
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import { useListagemEtapas } from "@/pages/ListagemEtapas/hooks/useListagemEtapas";
import { StatusEtapa, FormatoEtapa } from "@/types/etapa";
import { NivelJogador, GeneroJogador } from "@/types/jogador";

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
const mockListarEtapas = jest.fn();
const mockObterEstatisticas = jest.fn();

jest.mock("@/services", () => ({
  getEtapaService: () => ({
    listar: mockListarEtapas,
    obterEstatisticas: mockObterEstatisticas,
  }),
}));

describe("useListagemEtapas", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup padrão dos mocks
    mockListarEtapas.mockResolvedValue({
      etapas: [],
      total: 0,
    });
    mockObterEstatisticas.mockResolvedValue({
      totalEtapas: 0,
      inscricoesAbertas: 0,
      emAndamento: 0,
      finalizadas: 0,
    });
  });

  describe("Estado inicial", () => {
    it("deve retornar estado inicial correto", async () => {
      const { result } = renderHook(() => useListagemEtapas());

      expect(result.current.loading).toBe(true);
      expect(result.current.etapas).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.filtroStatus).toBe("");
      expect(result.current.filtroNivel).toBe("");
      expect(result.current.filtroGenero).toBe("");
      expect(result.current.filtroFormato).toBe("");
      expect(result.current.ordenacao).toBe("dataRealizacao");

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it("deve ter paginação inicial correta", async () => {
      const { result } = renderHook(() => useListagemEtapas());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.paginaAtual).toBe(1);
      expect(result.current.etapasPorPagina).toBe(12);
    });
  });

  describe("Carregamento de dados", () => {
    it("deve carregar etapas com sucesso", async () => {
      const etapasMock = [
        { id: "1", nome: "Etapa 1", formato: FormatoEtapa.DUPLA_FIXA },
        { id: "2", nome: "Etapa 2", formato: FormatoEtapa.REI_DA_PRAIA },
      ];
      mockListarEtapas.mockResolvedValue({
        etapas: etapasMock,
        total: 2,
      });
      mockObterEstatisticas.mockResolvedValue({
        totalEtapas: 2,
        inscricoesAbertas: 1,
        emAndamento: 1,
        finalizadas: 0,
      });

      const { result } = renderHook(() => useListagemEtapas());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.etapas).toHaveLength(2);
      expect(result.current.totalEtapas).toBe(2);
      expect(result.current.stats.totalEtapas).toBe(2);
    });

    it("deve tratar erro ao carregar etapas", async () => {
      mockListarEtapas.mockRejectedValue({
        response: { data: { error: "Erro no servidor" } },
      });

      const { result } = renderHook(() => useListagemEtapas());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Erro no servidor");
    });

    it("deve usar mensagem padrão quando erro não tem resposta", async () => {
      mockListarEtapas.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useListagemEtapas());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Erro ao carregar etapas");
    });

    it("deve calcular estatísticas por formato", async () => {
      const etapasMock = [
        { id: "1", formato: FormatoEtapa.REI_DA_PRAIA },
        { id: "2", formato: FormatoEtapa.REI_DA_PRAIA },
        { id: "3", formato: FormatoEtapa.DUPLA_FIXA },
      ];
      mockListarEtapas.mockResolvedValue({
        etapas: etapasMock,
        total: 3,
      });
      mockObterEstatisticas.mockResolvedValue({
        totalEtapas: 3,
        inscricoesAbertas: 1,
        emAndamento: 1,
        finalizadas: 1,
      });

      const { result } = renderHook(() => useListagemEtapas());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats.reiDaPraia).toBe(2);
      expect(result.current.stats.duplaFixa).toBe(1);
    });
  });

  describe("Filtros", () => {
    it("deve atualizar filtro de status", async () => {
      const { result } = renderHook(() => useListagemEtapas());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setFiltroStatus(StatusEtapa.ABERTA);
      });

      expect(result.current.filtroStatus).toBe(StatusEtapa.ABERTA);
    });

    it("deve atualizar filtro de nível", async () => {
      const { result } = renderHook(() => useListagemEtapas());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setFiltroNivel(NivelJogador.A);
      });

      expect(result.current.filtroNivel).toBe(NivelJogador.A);
    });

    it("deve atualizar filtro de gênero", async () => {
      const { result } = renderHook(() => useListagemEtapas());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setFiltroGenero(GeneroJogador.MASCULINO);
      });

      expect(result.current.filtroGenero).toBe(GeneroJogador.MASCULINO);
    });

    it("deve atualizar filtro de formato", async () => {
      const { result } = renderHook(() => useListagemEtapas());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setFiltroFormato(FormatoEtapa.REI_DA_PRAIA);
      });

      expect(result.current.filtroFormato).toBe(FormatoEtapa.REI_DA_PRAIA);
    });

    it("deve atualizar ordenação", async () => {
      const { result } = renderHook(() => useListagemEtapas());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setOrdenacao("criadoEm");
      });

      expect(result.current.ordenacao).toBe("criadoEm");
    });

    it("deve detectar filtros ativos corretamente", async () => {
      const { result } = renderHook(() => useListagemEtapas());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.temFiltrosAtivos).toBe(false);

      act(() => {
        result.current.setFiltroStatus(StatusEtapa.ABERTA);
      });

      expect(result.current.temFiltrosAtivos).toBe(true);
    });

    it("deve detectar ordenação diferente como filtro ativo", async () => {
      const { result } = renderHook(() => useListagemEtapas());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.temFiltrosAtivos).toBe(false);

      act(() => {
        result.current.setOrdenacao("criadoEm");
      });

      expect(result.current.temFiltrosAtivos).toBe(true);
    });

    it("deve limpar todos os filtros", async () => {
      const { result } = renderHook(() => useListagemEtapas());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setFiltroStatus(StatusEtapa.ABERTA);
        result.current.setFiltroNivel(NivelJogador.A);
        result.current.setFiltroGenero(GeneroJogador.MASCULINO);
        result.current.setFiltroFormato(FormatoEtapa.REI_DA_PRAIA);
        result.current.setOrdenacao("criadoEm");
      });

      expect(result.current.temFiltrosAtivos).toBe(true);

      act(() => {
        result.current.limparFiltros();
      });

      expect(result.current.filtroStatus).toBe("");
      expect(result.current.filtroNivel).toBe("");
      expect(result.current.filtroGenero).toBe("");
      expect(result.current.filtroFormato).toBe("");
      expect(result.current.ordenacao).toBe("dataRealizacao");
      expect(result.current.paginaAtual).toBe(1);
      expect(result.current.temFiltrosAtivos).toBe(false);
    });
  });

  describe("Paginação", () => {
    it("deve calcular total de páginas corretamente", async () => {
      mockListarEtapas.mockResolvedValue({
        etapas: Array(12).fill({ id: "1" }),
        total: 50,
      });

      const { result } = renderHook(() => useListagemEtapas());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.totalPaginas).toBe(5); // 50/12 arredondado para cima
    });

    it("deve navegar para próxima página", async () => {
      mockListarEtapas.mockResolvedValue({
        etapas: Array(12).fill({ id: "1" }),
        total: 24,
      });

      const { result } = renderHook(() => useListagemEtapas());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.proximaPagina();
      });

      expect(result.current.paginaAtual).toBe(2);
    });

    it("não deve navegar além da última página", async () => {
      mockListarEtapas.mockResolvedValue({
        etapas: Array(5).fill({ id: "1" }),
        total: 5,
      });

      const { result } = renderHook(() => useListagemEtapas());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.proximaPagina();
      });

      expect(result.current.paginaAtual).toBe(1);
    });

    it("deve navegar para página anterior", async () => {
      mockListarEtapas.mockResolvedValue({
        etapas: Array(12).fill({ id: "1" }),
        total: 24,
      });

      const { result } = renderHook(() => useListagemEtapas());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Primeiro vai para página 2
      act(() => {
        result.current.proximaPagina();
      });

      expect(result.current.paginaAtual).toBe(2);

      // Depois volta para página 1
      act(() => {
        result.current.paginaAnterior();
      });

      expect(result.current.paginaAtual).toBe(1);
    });

    it("não deve navegar antes da primeira página", async () => {
      const { result } = renderHook(() => useListagemEtapas());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.paginaAnterior();
      });

      expect(result.current.paginaAtual).toBe(1);
    });

    it("deve ir para página específica", async () => {
      mockListarEtapas.mockResolvedValue({
        etapas: Array(12).fill({ id: "1" }),
        total: 50,
      });

      const { result } = renderHook(() => useListagemEtapas());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.irParaPagina(3);
      });

      expect(result.current.paginaAtual).toBe(3);
    });

    it("não deve ir para página inválida", async () => {
      mockListarEtapas.mockResolvedValue({
        etapas: Array(12).fill({ id: "1" }),
        total: 24,
      });

      const { result } = renderHook(() => useListagemEtapas());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.irParaPagina(10);
      });

      expect(result.current.paginaAtual).toBe(1);

      act(() => {
        result.current.irParaPagina(0);
      });

      expect(result.current.paginaAtual).toBe(1);
    });
  });

  describe("Ações", () => {
    it("deve recarregar dados", async () => {
      const { result } = renderHook(() => useListagemEtapas());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockListarEtapas.mockClear();

      act(() => {
        result.current.recarregar();
      });

      expect(mockListarEtapas).toHaveBeenCalled();
    });
  });
});
