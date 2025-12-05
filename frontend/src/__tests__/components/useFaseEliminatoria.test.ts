import { renderHook, act, waitFor } from "@testing-library/react";
import { useFaseEliminatoria } from "@/components/etapas/FaseEliminatoria/hooks/useFaseEliminatoria";
import { TipoFase, StatusConfrontoEliminatorio, Grupo } from "@/types/chave";

// Mocks
const mockBuscarConfrontosEliminatorios = jest.fn();
const mockGerarFaseEliminatoria = jest.fn();
const mockCancelarFaseEliminatoria = jest.fn();
const mockBuscarPorId = jest.fn();
const mockEncerrarEtapa = jest.fn();

jest.mock("@/services", () => ({
  getChaveService: () => ({
    buscarConfrontosEliminatorios: mockBuscarConfrontosEliminatorios,
    gerarFaseEliminatoria: mockGerarFaseEliminatoria,
    cancelarFaseEliminatoria: mockCancelarFaseEliminatoria,
  }),
  getEtapaService: () => ({
    buscarPorId: mockBuscarPorId,
    encerrarEtapa: mockEncerrarEtapa,
  }),
}));

// Mock do confirm e alert
const mockConfirm = jest.fn();
const mockAlert = jest.fn();

window.confirm = mockConfirm;
window.alert = mockAlert;

// Mock de location.reload usando delete + redefine
delete (window as any).location;
(window as any).location = { reload: jest.fn() };

describe("useFaseEliminatoria", () => {
  const mockGrupos: Grupo[] = [
    {
      id: "grupo-1",
      etapaId: "etapa-1",
      nome: "Grupo A",
      jogadores: [],
      classificacao: [],
      totalPartidas: 6,
      partidasFinalizadas: 6,
      completo: true,
    },
    {
      id: "grupo-2",
      etapaId: "etapa-1",
      nome: "Grupo B",
      jogadores: [],
      classificacao: [],
      totalPartidas: 6,
      partidasFinalizadas: 6,
      completo: true,
    },
  ];

  const mockGruposIncompletos: Grupo[] = [
    {
      id: "grupo-1",
      etapaId: "etapa-1",
      nome: "Grupo A",
      jogadores: [],
      classificacao: [],
      totalPartidas: 6,
      partidasFinalizadas: 3,
      completo: false,
    },
  ];

  const mockConfrontos = [
    {
      id: "confronto-1",
      etapaId: "etapa-1",
      fase: TipoFase.SEMIFINAL,
      ordem: 1,
      jogador1Id: "jogador-1",
      jogador1Nome: "João",
      jogador2Id: "jogador-2",
      jogador2Nome: "Pedro",
      status: StatusConfrontoEliminatorio.PENDENTE,
    },
    {
      id: "confronto-2",
      etapaId: "etapa-1",
      fase: TipoFase.FINAL,
      ordem: 1,
      jogador1Id: "jogador-1",
      jogador1Nome: "João",
      status: StatusConfrontoEliminatorio.PENDENTE,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockBuscarConfrontosEliminatorios.mockResolvedValue([]);
    mockBuscarPorId.mockResolvedValue({ status: "em_andamento" });
  });

  describe("Estado inicial", () => {
    it("deve inicializar com estado correto", async () => {
      const { result } = renderHook(() =>
        useFaseEliminatoria({ etapaId: "etapa-1", grupos: mockGrupos })
      );

      expect(result.current.confrontos).toEqual([]);
      expect(result.current.loading).toBe(true); // Loading inicial
      expect(result.current.erro).toBeNull();
      expect(result.current.confrontoSelecionado).toBeNull();
      expect(result.current.faseAtual).toBe("todas");
      expect(result.current.etapaFinalizada).toBe(false);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it("deve carregar confrontos ao montar", async () => {
      mockBuscarConfrontosEliminatorios.mockResolvedValue(mockConfrontos);

      const { result } = renderHook(() =>
        useFaseEliminatoria({ etapaId: "etapa-1", grupos: mockGrupos })
      );

      await waitFor(() => {
        expect(result.current.confrontos).toEqual(mockConfrontos);
      });

      expect(mockBuscarConfrontosEliminatorios).toHaveBeenCalledWith(
        "etapa-1",
        undefined
      );
    });

    it("deve verificar status da etapa ao montar", async () => {
      mockBuscarPorId.mockResolvedValue({ status: "finalizada" });

      const { result } = renderHook(() =>
        useFaseEliminatoria({ etapaId: "etapa-1", grupos: mockGrupos })
      );

      await waitFor(() => {
        expect(result.current.etapaFinalizada).toBe(true);
      });
    });

    it("deve tratar erro ao verificar status da etapa silenciosamente", async () => {
      mockBuscarPorId.mockRejectedValue(new Error("Erro"));

      const { result } = renderHook(() =>
        useFaseEliminatoria({ etapaId: "etapa-1", grupos: mockGrupos })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Não deve ter erro visível
      expect(result.current.erro).toBeNull();
    });
  });

  describe("Dados computados", () => {
    it("deve calcular todosGruposCompletos corretamente quando completos", async () => {
      const { result } = renderHook(() =>
        useFaseEliminatoria({ etapaId: "etapa-1", grupos: mockGrupos })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.todosGruposCompletos).toBe(true);
    });

    it("deve calcular todosGruposCompletos como false quando incompletos", async () => {
      const { result } = renderHook(() =>
        useFaseEliminatoria({ etapaId: "etapa-1", grupos: mockGruposIncompletos })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.todosGruposCompletos).toBe(false);
    });

    it("deve calcular todosGruposCompletos como false quando sem grupos", async () => {
      const { result } = renderHook(() =>
        useFaseEliminatoria({ etapaId: "etapa-1", grupos: [] })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.todosGruposCompletos).toBe(false);
    });

    it("deve identificar grupo único corretamente", async () => {
      const grupoUnico: Grupo[] = [mockGrupos[0]];

      const { result } = renderHook(() =>
        useFaseEliminatoria({ etapaId: "etapa-1", grupos: grupoUnico })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isGrupoUnico).toBe(true);
    });

    it("deve retornar false para isGrupoUnico com múltiplos grupos", async () => {
      const { result } = renderHook(() =>
        useFaseEliminatoria({ etapaId: "etapa-1", grupos: mockGrupos })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isGrupoUnico).toBe(false);
    });

    it("deve calcular partidasPendentes corretamente", async () => {
      const { result } = renderHook(() =>
        useFaseEliminatoria({ etapaId: "etapa-1", grupos: mockGruposIncompletos })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // 6 total - 3 finalizadas = 3 pendentes
      expect(result.current.partidasPendentes).toBe(3);
    });

    it("deve retornar 0 para partidasPendentes sem grupos", async () => {
      const { result } = renderHook(() =>
        useFaseEliminatoria({ etapaId: "etapa-1", grupos: [] })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.partidasPendentes).toBe(0);
    });

    it("deve detectar final finalizada", async () => {
      const confrontosComFinalFinalizada = [
        ...mockConfrontos.slice(0, 1),
        {
          ...mockConfrontos[1],
          status: StatusConfrontoEliminatorio.FINALIZADA,
        },
      ];
      mockBuscarConfrontosEliminatorios.mockResolvedValue(
        confrontosComFinalFinalizada
      );

      const { result } = renderHook(() =>
        useFaseEliminatoria({ etapaId: "etapa-1", grupos: mockGrupos })
      );

      await waitFor(() => {
        expect(result.current.finalFinalizada).toBe(true);
      });
    });

    it("deve retornar false para finalFinalizada sem confrontos", async () => {
      mockBuscarConfrontosEliminatorios.mockResolvedValue([]);

      const { result } = renderHook(() =>
        useFaseEliminatoria({ etapaId: "etapa-1", grupos: mockGrupos })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.finalFinalizada).toBe(false);
    });

    it("deve calcular grupoUnicoCompleto corretamente", async () => {
      const grupoUnicoCompleto: Grupo[] = [
        {
          ...mockGrupos[0],
          completo: true,
        },
      ];

      const { result } = renderHook(() =>
        useFaseEliminatoria({ etapaId: "etapa-1", grupos: grupoUnicoCompleto })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.grupoUnicoCompleto).toBe(true);
    });
  });

  describe("Actions", () => {
    it("deve atualizar confrontoSelecionado", async () => {
      mockBuscarConfrontosEliminatorios.mockResolvedValue(mockConfrontos);

      const { result } = renderHook(() =>
        useFaseEliminatoria({ etapaId: "etapa-1", grupos: mockGrupos })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setConfrontoSelecionado(mockConfrontos[0] as any);
      });

      expect(result.current.confrontoSelecionado).toEqual(mockConfrontos[0]);
    });

    it("deve atualizar faseAtual", async () => {
      const { result } = renderHook(() =>
        useFaseEliminatoria({ etapaId: "etapa-1", grupos: mockGrupos })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setFaseAtual(TipoFase.SEMIFINAL);
      });

      expect(result.current.faseAtual).toBe(TipoFase.SEMIFINAL);
    });

    it("deve carregar confrontos via carregarConfrontos", async () => {
      mockBuscarConfrontosEliminatorios.mockResolvedValue(mockConfrontos);

      const { result } = renderHook(() =>
        useFaseEliminatoria({ etapaId: "etapa-1", grupos: mockGrupos })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Limpar chamadas do mount
      mockBuscarConfrontosEliminatorios.mockClear();

      await act(async () => {
        await result.current.carregarConfrontos();
      });

      expect(mockBuscarConfrontosEliminatorios).toHaveBeenCalledWith(
        "etapa-1",
        undefined
      );
    });

    it("deve tratar erro ao carregar confrontos", async () => {
      mockBuscarConfrontosEliminatorios.mockRejectedValue(
        new Error("Erro ao carregar")
      );

      const { result } = renderHook(() =>
        useFaseEliminatoria({ etapaId: "etapa-1", grupos: mockGrupos })
      );

      await waitFor(() => {
        expect(result.current.erro).toBe("Erro ao carregar");
      });
    });
  });

  describe("gerarEliminatoria", () => {
    it("deve gerar eliminatória quando confirmado", async () => {
      mockConfirm.mockReturnValue(true);
      mockGerarFaseEliminatoria.mockResolvedValue({});

      const { result } = renderHook(() =>
        useFaseEliminatoria({ etapaId: "etapa-1", grupos: mockGrupos })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.gerarEliminatoria();
      });

      expect(mockGerarFaseEliminatoria).toHaveBeenCalledWith("etapa-1", 2);
      expect(mockAlert).toHaveBeenCalledWith(
        "Fase eliminatória gerada com sucesso!"
      );
    });

    it("não deve gerar eliminatória quando cancelado", async () => {
      mockConfirm.mockReturnValue(false);

      const { result } = renderHook(() =>
        useFaseEliminatoria({ etapaId: "etapa-1", grupos: mockGrupos })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.gerarEliminatoria();
      });

      expect(mockGerarFaseEliminatoria).not.toHaveBeenCalled();
    });

    it("deve tratar erro ao gerar eliminatória", async () => {
      mockConfirm.mockReturnValue(true);
      mockGerarFaseEliminatoria.mockRejectedValue(new Error("Erro ao gerar"));

      const { result } = renderHook(() =>
        useFaseEliminatoria({ etapaId: "etapa-1", grupos: mockGrupos })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.gerarEliminatoria();
      });

      expect(mockAlert).toHaveBeenCalledWith("Erro: Erro ao gerar");
    });
  });

  describe("cancelarEliminatoria", () => {
    it("deve cancelar eliminatória quando confirmado", async () => {
      mockConfirm.mockReturnValue(true);
      mockCancelarFaseEliminatoria.mockResolvedValue({});

      const { result } = renderHook(() =>
        useFaseEliminatoria({ etapaId: "etapa-1", grupos: mockGrupos })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.cancelarEliminatoria();
      });

      expect(mockCancelarFaseEliminatoria).toHaveBeenCalledWith("etapa-1");
      expect(mockAlert).toHaveBeenCalled();
    });

    it("não deve cancelar eliminatória quando usuário cancela", async () => {
      mockConfirm.mockReturnValue(false);

      const { result } = renderHook(() =>
        useFaseEliminatoria({ etapaId: "etapa-1", grupos: mockGrupos })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.cancelarEliminatoria();
      });

      expect(mockCancelarFaseEliminatoria).not.toHaveBeenCalled();
    });

    it("deve tratar erro ao cancelar eliminatória", async () => {
      mockConfirm.mockReturnValue(true);
      mockCancelarFaseEliminatoria.mockRejectedValue(
        new Error("Erro ao cancelar")
      );

      const { result } = renderHook(() =>
        useFaseEliminatoria({ etapaId: "etapa-1", grupos: mockGrupos })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.cancelarEliminatoria();
      });

      expect(mockAlert).toHaveBeenCalledWith("Erro: Erro ao cancelar");
    });
  });

  describe("encerrarEtapa", () => {
    it("deve encerrar etapa quando confirmado", async () => {
      mockConfirm.mockReturnValue(true);
      mockEncerrarEtapa.mockResolvedValue({});

      const { result } = renderHook(() =>
        useFaseEliminatoria({ etapaId: "etapa-1", grupos: mockGrupos })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.encerrarEtapa();
      });

      expect(mockEncerrarEtapa).toHaveBeenCalledWith("etapa-1");
      expect(mockAlert).toHaveBeenCalledWith("Etapa encerrada com sucesso!");
      // O reload é chamado, mas jsdom gera um erro "not implemented"
      // O importante é que encerrarEtapa foi chamado com sucesso
    });

    it("não deve encerrar etapa quando usuário cancela", async () => {
      mockConfirm.mockReturnValue(false);

      const { result } = renderHook(() =>
        useFaseEliminatoria({ etapaId: "etapa-1", grupos: mockGrupos })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.encerrarEtapa();
      });

      expect(mockEncerrarEtapa).not.toHaveBeenCalled();
    });

    it("deve tratar erro ao encerrar etapa", async () => {
      mockConfirm.mockReturnValue(true);
      mockEncerrarEtapa.mockRejectedValue(new Error("Erro ao encerrar"));

      const { result } = renderHook(() =>
        useFaseEliminatoria({ etapaId: "etapa-1", grupos: mockGrupos })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.encerrarEtapa();
      });

      expect(mockAlert).toHaveBeenCalledWith("❌ Erro: Erro ao encerrar");
    });
  });

  describe("Recarregamento por mudança de etapaId", () => {
    it("deve recarregar confrontos quando etapaId mudar", async () => {
      const { result, rerender } = renderHook(
        ({ etapaId }) =>
          useFaseEliminatoria({ etapaId, grupos: mockGrupos }),
        { initialProps: { etapaId: "etapa-1" } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Limpar chamadas
      mockBuscarConfrontosEliminatorios.mockClear();

      // Mudar etapaId
      rerender({ etapaId: "etapa-2" });

      await waitFor(() => {
        expect(mockBuscarConfrontosEliminatorios).toHaveBeenCalledWith(
          "etapa-2",
          undefined
        );
      });
    });
  });
});
