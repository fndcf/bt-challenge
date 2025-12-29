/**
 * Testes para useEtapaChaves
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useEtapaChaves } from "@/hooks/useEtapaChaves";
import { FormatoEtapa, TipoFormacaoEquipe } from "@/types/etapa";

// Mock dos services
const mockChaveService = {
  gerarChaves: jest.fn(),
  excluirChaves: jest.fn(),
};

const mockReiDaPraiaService = {
  gerarChaves: jest.fn(),
};

const mockSuperXService = {
  gerarChaves: jest.fn(),
  cancelarChaves: jest.fn(),
};

const mockTeamsService = {
  gerarEquipes: jest.fn(),
  cancelarChaves: jest.fn(),
  formarEquipesManual: jest.fn(),
};

jest.mock("@/services", () => ({
  getChaveService: () => mockChaveService,
  getReiDaPraiaService: () => mockReiDaPraiaService,
  getSuperXService: () => mockSuperXService,
  getTeamsService: () => mockTeamsService,
}));

// Mock do logger
jest.mock("@/utils/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Mock do window.confirm e window.alert
const mockConfirm = jest.fn();
const mockAlert = jest.fn();
Object.defineProperty(window, "confirm", { value: mockConfirm, writable: true });
Object.defineProperty(window, "alert", { value: mockAlert, writable: true });

describe("useEtapaChaves", () => {
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirm.mockReturnValue(true);
  });

  // ============================================
  // TESTES BÁSICOS
  // ============================================

  describe("inicialização", () => {
    it("deve retornar funções e estado inicial", () => {
      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: null, onSuccess: mockOnSuccess })
      );

      expect(result.current.handleGerarChaves).toBeDefined();
      expect(result.current.handleApagarChaves).toBeDefined();
      expect(result.current.handleGerarChavesManual).toBeDefined();
      expect(result.current.isFormacaoManual).toBe(false);
    });

    it("deve detectar formação manual para TEAMS", () => {
      const etapa = {
        id: "etapa-1",
        formato: FormatoEtapa.TEAMS,
        tipoFormacaoEquipe: TipoFormacaoEquipe.MANUAL,
        nome: "Etapa Teste",
        totalInscritos: 8,
        qtdGrupos: 1,
        varianteTeams: 4,
      } as any;

      const { result } = renderHook(() =>
        useEtapaChaves({ etapa, onSuccess: mockOnSuccess })
      );

      expect(result.current.isFormacaoManual).toBe(true);
    });
  });

  // ============================================
  // GERAR CHAVES - DUPLA FIXA
  // ============================================

  describe("handleGerarChaves - Dupla Fixa", () => {
    const etapaDuplaFixa = {
      id: "etapa-1",
      nome: "Etapa Dupla Fixa",
      formato: FormatoEtapa.DUPLA_FIXA,
      totalInscritos: 12,
      qtdGrupos: 2,
    } as any;

    it("deve gerar chaves para Dupla Fixa com sucesso", async () => {
      mockChaveService.gerarChaves.mockResolvedValue({});

      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: etapaDuplaFixa, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleGerarChaves();
      });

      expect(mockConfirm).toHaveBeenCalled();
      expect(mockChaveService.gerarChaves).toHaveBeenCalledWith("etapa-1");
      expect(mockOnSuccess).toHaveBeenCalledWith("chaves");
      expect(mockAlert).toHaveBeenCalledWith("Chaves geradas com sucesso!");
    });

    it("não deve gerar se usuário cancelar confirmação", async () => {
      mockConfirm.mockReturnValue(false);

      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: etapaDuplaFixa, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleGerarChaves();
      });

      expect(mockChaveService.gerarChaves).not.toHaveBeenCalled();
    });

    it("deve mostrar erro quando geração falha", async () => {
      mockChaveService.gerarChaves.mockRejectedValue(
        new Error("Erro ao gerar")
      );

      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: etapaDuplaFixa, onSuccess: mockOnSuccess })
      );

      await expect(
        act(async () => {
          await result.current.handleGerarChaves();
        })
      ).rejects.toThrow("Erro ao gerar");

      expect(mockAlert).toHaveBeenCalledWith("Erro ao gerar");
    });

    it("não deve fazer nada se etapa for null", async () => {
      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: null, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleGerarChaves();
      });

      expect(mockChaveService.gerarChaves).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // GERAR CHAVES - REI DA PRAIA
  // ============================================

  describe("handleGerarChaves - Rei da Praia", () => {
    const etapaReiDaPraia = {
      id: "etapa-2",
      nome: "Etapa Rei da Praia",
      formato: FormatoEtapa.REI_DA_PRAIA,
      totalInscritos: 16,
      qtdGrupos: 4,
    } as any;

    it("deve gerar chaves para Rei da Praia com sucesso", async () => {
      mockReiDaPraiaService.gerarChaves.mockResolvedValue({});

      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: etapaReiDaPraia, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleGerarChaves();
      });

      expect(mockReiDaPraiaService.gerarChaves).toHaveBeenCalledWith("etapa-2");
      expect(mockAlert).toHaveBeenCalledWith("Chaves geradas com sucesso!");
    });
  });

  // ============================================
  // GERAR CHAVES - SUPER X
  // ============================================

  describe("handleGerarChaves - Super X", () => {
    const etapaSuperX = {
      id: "etapa-3",
      nome: "Etapa Super 8",
      formato: FormatoEtapa.SUPER_X,
      totalInscritos: 8,
      varianteSuperX: 8,
      qtdGrupos: 1,
    } as any;

    it("deve gerar chaves para Super 8 com sucesso", async () => {
      mockSuperXService.gerarChaves.mockResolvedValue({});

      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: etapaSuperX, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleGerarChaves();
      });

      expect(mockSuperXService.gerarChaves).toHaveBeenCalledWith("etapa-3");
      expect(mockAlert).toHaveBeenCalledWith("Chaves geradas com sucesso!");
    });

    it("deve gerar chaves para Super 12 com detalhes corretos", async () => {
      const etapaSuperX12 = {
        ...etapaSuperX,
        id: "etapa-super12",
        varianteSuperX: 12,
        totalInscritos: 12,
      };

      mockSuperXService.gerarChaves.mockResolvedValue({});

      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: etapaSuperX12, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleGerarChaves();
      });

      expect(mockSuperXService.gerarChaves).toHaveBeenCalledWith("etapa-super12");
    });
  });

  // ============================================
  // GERAR CHAVES - TEAMS
  // ============================================

  describe("handleGerarChaves - TEAMS", () => {
    const etapaTeams4 = {
      id: "etapa-4",
      nome: "Etapa TEAMS 4",
      formato: FormatoEtapa.TEAMS,
      totalInscritos: 8,
      varianteTeams: 4,
      qtdGrupos: 1,
    } as any;

    const etapaTeams6 = {
      id: "etapa-6",
      nome: "Etapa TEAMS 6",
      formato: FormatoEtapa.TEAMS,
      totalInscritos: 12,
      varianteTeams: 6,
      qtdGrupos: 1,
    } as any;

    it("deve gerar equipes para TEAMS 4 com sucesso", async () => {
      mockTeamsService.gerarEquipes.mockResolvedValue({});

      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: etapaTeams4, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleGerarChaves();
      });

      expect(mockTeamsService.gerarEquipes).toHaveBeenCalledWith("etapa-4");
      expect(mockAlert).toHaveBeenCalledWith(
        "Equipes e confrontos gerados com sucesso!"
      );
    });

    it("deve gerar equipes para TEAMS 6 com detalhes corretos", async () => {
      mockTeamsService.gerarEquipes.mockResolvedValue({});

      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: etapaTeams6, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleGerarChaves();
      });

      expect(mockTeamsService.gerarEquipes).toHaveBeenCalledWith("etapa-6");
    });
  });

  // ============================================
  // APAGAR CHAVES
  // ============================================

  describe("handleApagarChaves", () => {
    it("deve apagar chaves de Dupla Fixa com sucesso", async () => {
      const etapa = {
        id: "etapa-1",
        formato: FormatoEtapa.DUPLA_FIXA,
        nome: "Etapa",
        totalInscritos: 12,
        qtdGrupos: 2,
      } as any;

      mockChaveService.excluirChaves.mockResolvedValue({});

      const { result } = renderHook(() =>
        useEtapaChaves({ etapa, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleApagarChaves();
      });

      expect(mockChaveService.excluirChaves).toHaveBeenCalledWith("etapa-1");
      expect(mockOnSuccess).toHaveBeenCalledWith("inscricoes");
      expect(mockAlert).toHaveBeenCalledWith("Chaves apagadas com sucesso!");
    });

    it("deve apagar chaves de Super X com sucesso", async () => {
      const etapa = {
        id: "etapa-3",
        formato: FormatoEtapa.SUPER_X,
        nome: "Etapa",
        totalInscritos: 8,
        qtdGrupos: 1,
      } as any;

      mockSuperXService.cancelarChaves.mockResolvedValue({});

      const { result } = renderHook(() =>
        useEtapaChaves({ etapa, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleApagarChaves();
      });

      expect(mockSuperXService.cancelarChaves).toHaveBeenCalledWith("etapa-3");
    });

    it("deve apagar chaves de TEAMS com sucesso", async () => {
      const etapa = {
        id: "etapa-4",
        formato: FormatoEtapa.TEAMS,
        nome: "Etapa",
        totalInscritos: 8,
        qtdGrupos: 1,
      } as any;

      mockTeamsService.cancelarChaves.mockResolvedValue({});

      const { result } = renderHook(() =>
        useEtapaChaves({ etapa, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleApagarChaves();
      });

      expect(mockTeamsService.cancelarChaves).toHaveBeenCalledWith("etapa-4");
      expect(mockAlert).toHaveBeenCalledWith(
        "Equipes e confrontos apagados com sucesso!"
      );
    });

    it("deve mostrar erro quando exclusão falha", async () => {
      const etapa = {
        id: "etapa-1",
        formato: FormatoEtapa.DUPLA_FIXA,
        nome: "Etapa",
        totalInscritos: 12,
        qtdGrupos: 2,
      } as any;

      mockChaveService.excluirChaves.mockRejectedValue(
        new Error("Erro ao apagar")
      );

      const { result } = renderHook(() =>
        useEtapaChaves({ etapa, onSuccess: mockOnSuccess })
      );

      await expect(
        act(async () => {
          await result.current.handleApagarChaves();
        })
      ).rejects.toThrow("Erro ao apagar");

      expect(mockAlert).toHaveBeenCalledWith("Erro ao apagar");
    });

    it("não deve fazer nada se etapa for null", async () => {
      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: null, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleApagarChaves();
      });

      expect(mockChaveService.excluirChaves).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // GERAR CHAVES MANUAL (TEAMS)
  // ============================================

  describe("handleGerarChavesManual", () => {
    const etapaTeamsManual = {
      id: "etapa-manual",
      nome: "Etapa TEAMS Manual",
      formato: FormatoEtapa.TEAMS,
      tipoFormacaoEquipe: TipoFormacaoEquipe.MANUAL,
      totalInscritos: 8,
      varianteTeams: 4,
      qtdGrupos: 1,
    } as any;

    const formacoes = [
      { jogadorIds: ["j1", "j2", "j3", "j4"] },
      { jogadorIds: ["j5", "j6", "j7", "j8"] },
    ];

    it("deve formar equipes manualmente com sucesso", async () => {
      mockTeamsService.formarEquipesManual.mockResolvedValue({});

      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: etapaTeamsManual, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleGerarChavesManual(formacoes);
      });

      expect(mockTeamsService.formarEquipesManual).toHaveBeenCalledWith(
        "etapa-manual",
        { formacoes }
      );
      expect(mockOnSuccess).toHaveBeenCalledWith("chaves");
      expect(mockAlert).toHaveBeenCalledWith("Equipes formadas com sucesso!");
    });

    it("deve mostrar erro quando formação manual falha", async () => {
      mockTeamsService.formarEquipesManual.mockRejectedValue(
        new Error("Erro na formação")
      );

      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: etapaTeamsManual, onSuccess: mockOnSuccess })
      );

      await expect(
        act(async () => {
          await result.current.handleGerarChavesManual(formacoes);
        })
      ).rejects.toThrow("Erro na formação");

      expect(mockAlert).toHaveBeenCalledWith("Erro na formação");
    });

    it("não deve fazer nada se etapa não for TEAMS", async () => {
      const etapaNaoTeams = {
        id: "etapa-1",
        formato: FormatoEtapa.DUPLA_FIXA,
        nome: "Etapa",
        totalInscritos: 12,
        qtdGrupos: 2,
      } as any;

      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: etapaNaoTeams, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleGerarChavesManual(formacoes);
      });

      expect(mockTeamsService.formarEquipesManual).not.toHaveBeenCalled();
    });

    it("não deve fazer nada se etapa for null", async () => {
      const { result } = renderHook(() =>
        useEtapaChaves({ etapa: null, onSuccess: mockOnSuccess })
      );

      await act(async () => {
        await result.current.handleGerarChavesManual(formacoes);
      });

      expect(mockTeamsService.formarEquipesManual).not.toHaveBeenCalled();
    });
  });
});
