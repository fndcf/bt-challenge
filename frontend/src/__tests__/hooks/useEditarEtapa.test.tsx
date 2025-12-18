/**
 * Testes do hook useEditarEtapa
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useEditarEtapa } from "@/pages/EditarEtapa/hooks/useEditarEtapa";
import { FormatoEtapa, StatusEtapa } from "@/types/etapa";
import { GeneroJogador, NivelJogador } from "@/types/jogador";

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

// Mock do react-router-dom
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock do service
const mockBuscarPorId = jest.fn();
const mockAtualizar = jest.fn();

jest.mock("@/services", () => ({
  getEtapaService: () => ({
    buscarPorId: mockBuscarPorId,
    atualizar: mockAtualizar,
  }),
}));

// Mock do date-fns
jest.mock("date-fns", () => ({
  format: jest.fn((date: Date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }),
}));

const mockEtapaDuplaFixa = {
  id: "1",
  nome: "Etapa Teste",
  descricao: "Descrição teste",
  formato: FormatoEtapa.DUPLA_FIXA,
  status: StatusEtapa.ABERTA,
  nivel: NivelJogador.INTERMEDIARIO,
  genero: GeneroJogador.MASCULINO,
  maxJogadores: 16,
  totalInscritos: 4,
  chavesGeradas: false,
  dataInicio: { _seconds: 1733011200 },
  dataFim: { _seconds: 1733097600 },
  dataRealizacao: { _seconds: 1733184000 },
  local: "Quadra 1",
};

const mockEtapaReiDaPraia = {
  ...mockEtapaDuplaFixa,
  id: "2",
  formato: FormatoEtapa.REI_DA_PRAIA,
  totalInscritos: 8,
};

const mockEtapaSuperX = {
  ...mockEtapaDuplaFixa,
  id: "3",
  formato: FormatoEtapa.SUPER_X,
  varianteSuperX: 8,
  maxJogadores: 8,
  totalInscritos: 0,
};

const mockEtapaTeams = {
  ...mockEtapaDuplaFixa,
  id: "4",
  formato: FormatoEtapa.TEAMS,
  varianteTeams: 4,
  maxJogadores: 16,
  totalInscritos: 0,
};

describe("useEditarEtapa", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Estado inicial e carregamento", () => {
    it("deve iniciar com loading true", () => {
      mockBuscarPorId.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useEditarEtapa("1"));

      expect(result.current.loading).toBe(true);
    });

    it("deve carregar etapa com sucesso", async () => {
      mockBuscarPorId.mockResolvedValue(mockEtapaDuplaFixa);

      const { result } = renderHook(() => useEditarEtapa("1"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.etapa).toEqual(mockEtapaDuplaFixa);
      expect(result.current.formData.nome).toBe("Etapa Teste");
      expect(result.current.formData.maxJogadores).toBe(16);
      expect(result.current.error).toBeNull();
    });

    it("deve definir erro quando ID não é informado", async () => {
      const { result } = renderHook(() => useEditarEtapa(undefined));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("ID da etapa não informado");
    });

    it("deve tratar erro ao carregar etapa", async () => {
      mockBuscarPorId.mockRejectedValue(new Error("Etapa não encontrada"));

      const { result } = renderHook(() => useEditarEtapa("999"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Etapa não encontrada");
    });
  });

  describe("Info computada", () => {
    it("deve identificar formato Dupla Fixa", async () => {
      mockBuscarPorId.mockResolvedValue(mockEtapaDuplaFixa);

      const { result } = renderHook(() => useEditarEtapa("1"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isReiDaPraia).toBe(false);
    });

    it("deve identificar formato Rei da Praia", async () => {
      mockBuscarPorId.mockResolvedValue(mockEtapaReiDaPraia);

      const { result } = renderHook(() => useEditarEtapa("2"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isReiDaPraia).toBe(true);
    });

    it("deve identificar quando tem inscritos", async () => {
      mockBuscarPorId.mockResolvedValue(mockEtapaDuplaFixa);

      const { result } = renderHook(() => useEditarEtapa("1"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.temInscritos).toBe(true);
    });

    it("deve identificar chaves geradas", async () => {
      mockBuscarPorId.mockResolvedValue({ ...mockEtapaDuplaFixa, chavesGeradas: true });

      const { result } = renderHook(() => useEditarEtapa("1"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.chavesGeradas).toBe(true);
    });
  });

  describe("handleChange", () => {
    it("deve atualizar campo do formulário", async () => {
      mockBuscarPorId.mockResolvedValue(mockEtapaDuplaFixa);

      const { result } = renderHook(() => useEditarEtapa("1"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleChange("nome", "Novo Nome");
      });

      expect(result.current.formData.nome).toBe("Novo Nome");
    });

    it("deve atualizar maxJogadores", async () => {
      mockBuscarPorId.mockResolvedValue(mockEtapaDuplaFixa);

      const { result } = renderHook(() => useEditarEtapa("1"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleChange("maxJogadores", 24);
      });

      expect(result.current.formData.maxJogadores).toBe(24);
    });
  });

  describe("calcularMinimoJogadores", () => {
    it("deve retornar 6 para Dupla Fixa sem inscritos", async () => {
      mockBuscarPorId.mockResolvedValue({ ...mockEtapaDuplaFixa, totalInscritos: 0 });

      const { result } = renderHook(() => useEditarEtapa("1"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.calcularMinimoJogadores()).toBe(6);
    });

    it("deve retornar 8 para Rei da Praia sem inscritos", async () => {
      mockBuscarPorId.mockResolvedValue({ ...mockEtapaReiDaPraia, totalInscritos: 0 });

      const { result } = renderHook(() => useEditarEtapa("2"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.calcularMinimoJogadores()).toBe(8);
    });

    it("deve considerar número de inscritos para Dupla Fixa", async () => {
      mockBuscarPorId.mockResolvedValue({ ...mockEtapaDuplaFixa, totalInscritos: 10 });

      const { result } = renderHook(() => useEditarEtapa("1"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.calcularMinimoJogadores()).toBe(10);
    });

    it("deve arredondar para múltiplo de 4 no Rei da Praia", async () => {
      mockBuscarPorId.mockResolvedValue({ ...mockEtapaReiDaPraia, totalInscritos: 10 });

      const { result } = renderHook(() => useEditarEtapa("2"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.calcularMinimoJogadores()).toBe(12);
    });
  });

  describe("ajustarValorJogadores", () => {
    it("deve retornar mínimo quando valor é menor", async () => {
      mockBuscarPorId.mockResolvedValue(mockEtapaDuplaFixa);

      const { result } = renderHook(() => useEditarEtapa("1"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.ajustarValorJogadores(2)).toBe(6);
    });

    it("deve arredondar para par em Dupla Fixa", async () => {
      mockBuscarPorId.mockResolvedValue(mockEtapaDuplaFixa);

      const { result } = renderHook(() => useEditarEtapa("1"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.ajustarValorJogadores(15)).toBe(16);
    });

    it("deve arredondar para múltiplo de 4 em Rei da Praia", async () => {
      mockBuscarPorId.mockResolvedValue(mockEtapaReiDaPraia);

      const { result } = renderHook(() => useEditarEtapa("2"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.ajustarValorJogadores(10)).toBe(12);
    });
  });

  describe("handleSubmit - Validações Dupla Fixa", () => {
    it("deve validar nome mínimo", async () => {
      mockBuscarPorId.mockResolvedValue(mockEtapaDuplaFixa);

      const { result } = renderHook(() => useEditarEtapa("1"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleChange("nome", "AB");
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.error).toBe("Nome deve ter no mínimo 3 caracteres");
    });

    it("deve validar máximo de jogadores obrigatório", async () => {
      mockBuscarPorId.mockResolvedValue(mockEtapaDuplaFixa);

      const { result } = renderHook(() => useEditarEtapa("1"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleChange("maxJogadores", 0);
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.error).toBe("Número máximo de jogadores é obrigatório");
    });

    it("deve validar mínimo de 6 jogadores para Dupla Fixa", async () => {
      mockBuscarPorId.mockResolvedValue({ ...mockEtapaDuplaFixa, totalInscritos: 0 });

      const { result } = renderHook(() => useEditarEtapa("1"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleChange("maxJogadores", 4);
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.error).toBe("Dupla Fixa: mínimo de 6 jogadores");
    });

    it("deve validar máximo de 52 jogadores para Dupla Fixa", async () => {
      mockBuscarPorId.mockResolvedValue(mockEtapaDuplaFixa);

      const { result } = renderHook(() => useEditarEtapa("1"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleChange("maxJogadores", 60);
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.error).toBe("Dupla Fixa: máximo de 52 jogadores");
    });

    it("deve validar número par para Dupla Fixa", async () => {
      mockBuscarPorId.mockResolvedValue(mockEtapaDuplaFixa);

      const { result } = renderHook(() => useEditarEtapa("1"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleChange("maxJogadores", 15);
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.error).toBe("Dupla Fixa: número de jogadores deve ser par");
    });
  });

  describe("handleSubmit - Validações Rei da Praia", () => {
    it("deve validar mínimo de 8 jogadores para Rei da Praia", async () => {
      mockBuscarPorId.mockResolvedValue({ ...mockEtapaReiDaPraia, totalInscritos: 0 });

      const { result } = renderHook(() => useEditarEtapa("2"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleChange("maxJogadores", 4);
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.error).toBe("Rei da Praia requer mínimo de 8 jogadores");
    });

    it("deve validar máximo de 64 jogadores para Rei da Praia", async () => {
      mockBuscarPorId.mockResolvedValue(mockEtapaReiDaPraia);

      const { result } = renderHook(() => useEditarEtapa("2"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleChange("maxJogadores", 72);
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.error).toBe("Rei da Praia: máximo de 64 jogadores");
    });

    it("deve validar múltiplo de 4 para Rei da Praia", async () => {
      mockBuscarPorId.mockResolvedValue(mockEtapaReiDaPraia);

      const { result } = renderHook(() => useEditarEtapa("2"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleChange("maxJogadores", 10);
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.error).toBe(
        "Rei da Praia: número de jogadores deve ser múltiplo de 4"
      );
    });
  });

  describe("Info computada - Super X e TEAMS", () => {
    it("deve identificar formato Super X", async () => {
      mockBuscarPorId.mockResolvedValue(mockEtapaSuperX);

      const { result } = renderHook(() => useEditarEtapa("3"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isSuperX).toBe(true);
      expect(result.current.isReiDaPraia).toBe(false);
      expect(result.current.isTeams).toBe(false);
    });

    it("deve identificar formato TEAMS", async () => {
      mockBuscarPorId.mockResolvedValue(mockEtapaTeams);

      const { result } = renderHook(() => useEditarEtapa("4"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isTeams).toBe(true);
      expect(result.current.isSuperX).toBe(false);
      expect(result.current.isReiDaPraia).toBe(false);
    });
  });

  describe("calcularMinimoJogadores - Super X e TEAMS", () => {
    it("deve retornar variante para Super X", async () => {
      mockBuscarPorId.mockResolvedValue(mockEtapaSuperX);

      const { result } = renderHook(() => useEditarEtapa("3"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.calcularMinimoJogadores()).toBe(8);
    });

    it("deve retornar mínimo baseado na variante para TEAMS", async () => {
      mockBuscarPorId.mockResolvedValue(mockEtapaTeams);

      const { result } = renderHook(() => useEditarEtapa("4"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Variante 4: mínimo 2 equipes = 8 jogadores
      expect(result.current.calcularMinimoJogadores()).toBe(8);
    });

    it("deve arredondar para múltiplo da variante em TEAMS", async () => {
      mockBuscarPorId.mockResolvedValue({ ...mockEtapaTeams, totalInscritos: 10 });

      const { result } = renderHook(() => useEditarEtapa("4"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // 10 inscritos, variante 4: arredonda para 12
      expect(result.current.calcularMinimoJogadores()).toBe(12);
    });

    it("deve retornar 6 quando etapa é null", async () => {
      mockBuscarPorId.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useEditarEtapa("1"));

      // Enquanto loading, etapa é null
      expect(result.current.calcularMinimoJogadores()).toBe(6);
    });
  });

  describe("ajustarValorJogadores - Super X e TEAMS", () => {
    it("deve retornar valor fixo da variante para Super X", async () => {
      mockBuscarPorId.mockResolvedValue(mockEtapaSuperX);

      const { result } = renderHook(() => useEditarEtapa("3"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Super X não permite ajuste, sempre retorna a variante
      expect(result.current.ajustarValorJogadores(100)).toBe(8);
      expect(result.current.ajustarValorJogadores(4)).toBe(8);
    });

    it("deve arredondar para múltiplo da variante em TEAMS", async () => {
      mockBuscarPorId.mockResolvedValue(mockEtapaTeams);

      const { result } = renderHook(() => useEditarEtapa("4"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Variante 4: arredonda para múltiplo de 4
      expect(result.current.ajustarValorJogadores(10)).toBe(12);
      expect(result.current.ajustarValorJogadores(13)).toBe(16);
    });

    it("deve manter valor par correto em Dupla Fixa", async () => {
      mockBuscarPorId.mockResolvedValue(mockEtapaDuplaFixa);

      const { result } = renderHook(() => useEditarEtapa("1"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Valor par deve ser mantido
      expect(result.current.ajustarValorJogadores(20)).toBe(20);
    });
  });

  describe("handleSubmit - Validações Super X", () => {
    it("deve validar que maxJogadores seja igual à variante Super X", async () => {
      mockBuscarPorId.mockResolvedValue(mockEtapaSuperX);

      const { result } = renderHook(() => useEditarEtapa("3"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleChange("maxJogadores", 12);
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.error).toBe(
        "Super 8: número de jogadores deve ser exatamente 8"
      );
    });
  });

  describe("handleSubmit - Validações TEAMS", () => {
    it("deve validar mínimo de jogadores para TEAMS", async () => {
      mockBuscarPorId.mockResolvedValue(mockEtapaTeams);

      const { result } = renderHook(() => useEditarEtapa("4"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleChange("maxJogadores", 4);
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.error).toBe(
        "TEAMS 4: mínimo de 8 jogadores (2 equipes)"
      );
    });

    it("deve validar máximo de jogadores para TEAMS 4", async () => {
      mockBuscarPorId.mockResolvedValue(mockEtapaTeams);

      const { result } = renderHook(() => useEditarEtapa("4"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleChange("maxJogadores", 100);
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.error).toBe(
        "TEAMS 4: máximo de 96 jogadores (24 equipes)"
      );
    });

    it("deve validar múltiplo da variante para TEAMS", async () => {
      mockBuscarPorId.mockResolvedValue(mockEtapaTeams);

      const { result } = renderHook(() => useEditarEtapa("4"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleChange("maxJogadores", 10);
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.error).toBe(
        "TEAMS 4: número de jogadores deve ser múltiplo de 4"
      );
    });
  });

  describe("handleSubmit - Validação de inscritos", () => {
    it("não deve permitir reduzir abaixo do número de inscritos", async () => {
      mockBuscarPorId.mockResolvedValue({ ...mockEtapaDuplaFixa, totalInscritos: 12 });

      const { result } = renderHook(() => useEditarEtapa("1"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleChange("maxJogadores", 10);
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.error).toBe(
        "Não é possível reduzir para 10. Já existem 12 jogador(es) inscrito(s)."
      );
    });
  });

  describe("handleSubmit - Sucesso", () => {
    it("deve atualizar etapa com sucesso", async () => {
      mockBuscarPorId.mockResolvedValue(mockEtapaDuplaFixa);
      mockAtualizar.mockResolvedValue({ id: "1" });

      const { result } = renderHook(() => useEditarEtapa("1"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleChange("nome", "Etapa Atualizada");
        result.current.handleChange("maxJogadores", 20);
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(mockAtualizar).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/admin/etapas/1");
    });

    it("deve tratar erro ao atualizar", async () => {
      mockBuscarPorId.mockResolvedValue(mockEtapaDuplaFixa);
      mockAtualizar.mockRejectedValue(new Error("Erro no servidor"));

      const { result } = renderHook(() => useEditarEtapa("1"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.error).toBe("Erro no servidor");
    });
  });
});
