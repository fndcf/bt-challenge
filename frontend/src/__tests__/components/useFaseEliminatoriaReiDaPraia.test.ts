import { renderHook, act, waitFor } from "@testing-library/react";
import { useFaseEliminatoriaReiDaPraia } from "@/components/etapas/FaseEliminatoriaReiDaPraia/hooks/useFaseEliminatoriaReiDaPraia";
import { TipoFase, StatusConfrontoEliminatorio, Grupo } from "@/types/chave";
import { TipoChaveamentoReiDaPraia } from "@/types/reiDaPraia";

// Mocks
const mockBuscarConfrontosEliminatorios = jest.fn();
const mockGerarEliminatoria = jest.fn();
const mockCancelarEliminatoria = jest.fn();
const mockBuscarPorId = jest.fn();
const mockEncerrarEtapa = jest.fn();

jest.mock("@/services", () => ({
  getReiDaPraiaService: () => ({
    buscarConfrontosEliminatorios: mockBuscarConfrontosEliminatorios,
    gerarEliminatoria: mockGerarEliminatoria,
    cancelarEliminatoria: mockCancelarEliminatoria,
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
(window as any).location = { reload: jest.fn(), href: '' };

describe("useFaseEliminatoriaReiDaPraia", () => {
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
      dupla1Id: "dupla-1",
      dupla1Nome: "Dupla 1",
      dupla2Id: "dupla-2",
      dupla2Nome: "Dupla 2",
      status: StatusConfrontoEliminatorio.PENDENTE,
    },
    {
      id: "confronto-2",
      etapaId: "etapa-1",
      fase: TipoFase.FINAL,
      ordem: 1,
      dupla1Id: "dupla-1",
      dupla1Nome: "Dupla 1",
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
        useFaseEliminatoriaReiDaPraia({
          etapaId: "etapa-1",
          grupos: mockGrupos,
        })
      );

      expect(result.current.confrontos).toEqual([]);
      expect(result.current.loading).toBe(true);
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
        useFaseEliminatoriaReiDaPraia({
          etapaId: "etapa-1",
          grupos: mockGrupos,
        })
      );

      await waitFor(() => {
        expect(result.current.confrontos).toEqual(mockConfrontos);
      });

      expect(mockBuscarConfrontosEliminatorios).toHaveBeenCalledWith("etapa-1");
    });

    it("deve verificar status da etapa ao montar", async () => {
      mockBuscarPorId.mockResolvedValue({ status: "finalizada" });

      const { result } = renderHook(() =>
        useFaseEliminatoriaReiDaPraia({
          etapaId: "etapa-1",
          grupos: mockGrupos,
        })
      );

      await waitFor(() => {
        expect(result.current.etapaFinalizada).toBe(true);
      });
    });

    it("deve tratar erro ao verificar status da etapa silenciosamente", async () => {
      mockBuscarPorId.mockRejectedValue(new Error("Erro"));

      const { result } = renderHook(() =>
        useFaseEliminatoriaReiDaPraia({
          etapaId: "etapa-1",
          grupos: mockGrupos,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.erro).toBeNull();
    });
  });

  describe("Tipo de chaveamento", () => {
    it("deve retornar 'Melhores com Melhores' quando sem tipoChaveamento", async () => {
      const { result } = renderHook(() =>
        useFaseEliminatoriaReiDaPraia({
          etapaId: "etapa-1",
          grupos: mockGrupos,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tipoChaveamento).toBe("Melhores com Melhores");
    });

    it("deve formatar MELHORES_COM_MELHORES corretamente", async () => {
      const { result } = renderHook(() =>
        useFaseEliminatoriaReiDaPraia({
          etapaId: "etapa-1",
          grupos: mockGrupos,
          etapaTipoChaveamento: TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tipoChaveamento).toBe("Melhores com Melhores");
    });

    it("deve formatar PAREAMENTO_POR_RANKING corretamente", async () => {
      const { result } = renderHook(() =>
        useFaseEliminatoriaReiDaPraia({
          etapaId: "etapa-1",
          grupos: mockGrupos,
          etapaTipoChaveamento: TipoChaveamentoReiDaPraia.PAREAMENTO_POR_RANKING,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tipoChaveamento).toBe("Pareamento por Ranking");
    });

    it("deve formatar SORTEIO_ALEATORIO corretamente", async () => {
      const { result } = renderHook(() =>
        useFaseEliminatoriaReiDaPraia({
          etapaId: "etapa-1",
          grupos: mockGrupos,
          etapaTipoChaveamento: TipoChaveamentoReiDaPraia.SORTEIO_ALEATORIO,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tipoChaveamento).toBe("Sorteio Aleatório");
    });
  });

  describe("Dados computados", () => {
    it("deve calcular todosGruposCompletos corretamente quando completos", async () => {
      const { result } = renderHook(() =>
        useFaseEliminatoriaReiDaPraia({
          etapaId: "etapa-1",
          grupos: mockGrupos,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.todosGruposCompletos).toBe(true);
    });

    it("deve calcular todosGruposCompletos como false quando incompletos", async () => {
      const { result } = renderHook(() =>
        useFaseEliminatoriaReiDaPraia({
          etapaId: "etapa-1",
          grupos: mockGruposIncompletos,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.todosGruposCompletos).toBe(false);
    });

    it("deve calcular todosGruposCompletos como false quando sem grupos", async () => {
      const { result } = renderHook(() =>
        useFaseEliminatoriaReiDaPraia({
          etapaId: "etapa-1",
          grupos: [],
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.todosGruposCompletos).toBe(false);
    });

    it("deve identificar grupo único corretamente", async () => {
      const grupoUnico: Grupo[] = [mockGrupos[0]];

      const { result } = renderHook(() =>
        useFaseEliminatoriaReiDaPraia({
          etapaId: "etapa-1",
          grupos: grupoUnico,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isGrupoUnico).toBe(true);
    });

    it("deve retornar false para isGrupoUnico com múltiplos grupos", async () => {
      const { result } = renderHook(() =>
        useFaseEliminatoriaReiDaPraia({
          etapaId: "etapa-1",
          grupos: mockGrupos,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isGrupoUnico).toBe(false);
    });

    it("deve calcular partidasPendentes corretamente", async () => {
      const { result } = renderHook(() =>
        useFaseEliminatoriaReiDaPraia({
          etapaId: "etapa-1",
          grupos: mockGruposIncompletos,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.partidasPendentes).toBe(3);
    });

    it("deve retornar 0 para partidasPendentes sem grupos", async () => {
      const { result } = renderHook(() =>
        useFaseEliminatoriaReiDaPraia({
          etapaId: "etapa-1",
          grupos: [],
        })
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
        useFaseEliminatoriaReiDaPraia({
          etapaId: "etapa-1",
          grupos: mockGrupos,
        })
      );

      await waitFor(() => {
        expect(result.current.finalFinalizada).toBe(true);
      });
    });

    it("deve retornar false para finalFinalizada sem confrontos", async () => {
      mockBuscarConfrontosEliminatorios.mockResolvedValue([]);

      const { result } = renderHook(() =>
        useFaseEliminatoriaReiDaPraia({
          etapaId: "etapa-1",
          grupos: mockGrupos,
        })
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
        useFaseEliminatoriaReiDaPraia({
          etapaId: "etapa-1",
          grupos: grupoUnicoCompleto,
        })
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
        useFaseEliminatoriaReiDaPraia({
          etapaId: "etapa-1",
          grupos: mockGrupos,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setConfrontoSelecionado(mockConfrontos[0]);
      });

      expect(result.current.confrontoSelecionado).toEqual(mockConfrontos[0]);
    });

    it("deve atualizar faseAtual", async () => {
      const { result } = renderHook(() =>
        useFaseEliminatoriaReiDaPraia({
          etapaId: "etapa-1",
          grupos: mockGrupos,
        })
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
        useFaseEliminatoriaReiDaPraia({
          etapaId: "etapa-1",
          grupos: mockGrupos,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockBuscarConfrontosEliminatorios.mockClear();

      await act(async () => {
        await result.current.carregarConfrontos();
      });

      expect(mockBuscarConfrontosEliminatorios).toHaveBeenCalledWith("etapa-1");
    });

    it("deve tratar erro ao carregar confrontos", async () => {
      mockBuscarConfrontosEliminatorios.mockRejectedValue(
        new Error("Erro ao carregar")
      );

      const { result } = renderHook(() =>
        useFaseEliminatoriaReiDaPraia({
          etapaId: "etapa-1",
          grupos: mockGrupos,
        })
      );

      await waitFor(() => {
        expect(result.current.erro).toBe("Erro ao carregar");
      });
    });
  });

  describe("gerarEliminatoria", () => {
    // A confirmação agora é feita pelo componente (ConfirmacaoPerigosa modal)
    // O hook apenas executa a ação diretamente
    it("deve gerar eliminatória diretamente", async () => {
      mockGerarEliminatoria.mockResolvedValue({});

      const { result } = renderHook(() =>
        useFaseEliminatoriaReiDaPraia({
          etapaId: "etapa-1",
          grupos: mockGrupos,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.gerarEliminatoria();
      });

      expect(mockGerarEliminatoria).toHaveBeenCalledWith("etapa-1", {
        classificadosPorGrupo: 2,
        tipoChaveamento: TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES,
      });
      expect(mockAlert).toHaveBeenCalledWith(
        "Fase eliminatória Rei da Praia gerada com sucesso!"
      );
    });

    it("deve usar tipoChaveamento da etapa quando fornecido", async () => {
      mockGerarEliminatoria.mockResolvedValue({});

      const { result } = renderHook(() =>
        useFaseEliminatoriaReiDaPraia({
          etapaId: "etapa-1",
          grupos: mockGrupos,
          etapaTipoChaveamento: TipoChaveamentoReiDaPraia.SORTEIO_ALEATORIO,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.gerarEliminatoria();
      });

      expect(mockGerarEliminatoria).toHaveBeenCalledWith("etapa-1", {
        classificadosPorGrupo: 2,
        tipoChaveamento: TipoChaveamentoReiDaPraia.SORTEIO_ALEATORIO,
      });
    });

    it("deve tratar erro ao gerar eliminatória", async () => {
      mockGerarEliminatoria.mockRejectedValue(new Error("Erro ao gerar"));

      const { result } = renderHook(() =>
        useFaseEliminatoriaReiDaPraia({
          etapaId: "etapa-1",
          grupos: mockGrupos,
        })
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
    // A confirmação agora é feita pelo componente (ConfirmacaoPerigosa modal)
    // O hook apenas executa a ação diretamente
    it("deve cancelar eliminatória diretamente", async () => {
      mockCancelarEliminatoria.mockResolvedValue({});

      const { result } = renderHook(() =>
        useFaseEliminatoriaReiDaPraia({
          etapaId: "etapa-1",
          grupos: mockGrupos,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.cancelarEliminatoria();
      });

      expect(mockCancelarEliminatoria).toHaveBeenCalledWith("etapa-1");
      expect(mockAlert).toHaveBeenCalledWith("Fase eliminatória cancelada!");
    });

    it("deve tratar erro ao cancelar eliminatória", async () => {
      mockCancelarEliminatoria.mockRejectedValue(
        new Error("Erro ao cancelar")
      );

      const { result } = renderHook(() =>
        useFaseEliminatoriaReiDaPraia({
          etapaId: "etapa-1",
          grupos: mockGrupos,
        })
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
    // A confirmação agora é feita pelo componente (ConfirmacaoPerigosa modal)
    // O hook apenas executa a ação diretamente
    it("deve encerrar etapa diretamente", async () => {
      mockEncerrarEtapa.mockResolvedValue({});

      const { result } = renderHook(() =>
        useFaseEliminatoriaReiDaPraia({
          etapaId: "etapa-1",
          grupos: mockGrupos,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.encerrarEtapa();
      });

      expect(mockEncerrarEtapa).toHaveBeenCalledWith("etapa-1");
      expect(mockAlert).toHaveBeenCalledWith(
        "Etapa Rei da Praia encerrada com sucesso!"
      );
    });

    it("deve tratar erro ao encerrar etapa", async () => {
      mockEncerrarEtapa.mockRejectedValue(new Error("Erro ao encerrar"));

      const { result } = renderHook(() =>
        useFaseEliminatoriaReiDaPraia({
          etapaId: "etapa-1",
          grupos: mockGrupos,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.encerrarEtapa();
      });

      expect(mockAlert).toHaveBeenCalledWith("Erro: Erro ao encerrar");
    });
  });

  describe("Recarregamento por mudança de etapaId", () => {
    it("deve recarregar confrontos quando etapaId mudar", async () => {
      const { result, rerender } = renderHook(
        ({ etapaId }) =>
          useFaseEliminatoriaReiDaPraia({ etapaId, grupos: mockGrupos }),
        { initialProps: { etapaId: "etapa-1" } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockBuscarConfrontosEliminatorios.mockClear();

      rerender({ etapaId: "etapa-2" });

      await waitFor(() => {
        expect(mockBuscarConfrontosEliminatorios).toHaveBeenCalledWith(
          "etapa-2"
        );
      });
    });
  });
});
