/**
 * Testes para useEtapaData
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useEtapaData } from "@/hooks/useEtapaData";
import { FormatoEtapa } from "@/types/etapa";
import { StatusConfronto } from "@/types/teams";

// Mock dos services
const mockEtapaService = {
  buscarPorId: jest.fn(),
  listarInscricoes: jest.fn(),
};

const mockSuperXService = {
  buscarPartidas: jest.fn(),
};

const mockTeamsService = {
  buscarConfrontos: jest.fn(),
};

jest.mock("@/services", () => ({
  getEtapaService: () => mockEtapaService,
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

describe("useEtapaData", () => {
  const etapaId = "etapa-123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // TESTES BÁSICOS
  // ============================================

  describe("inicialização", () => {
    it("deve retornar estado inicial correto", () => {
      mockEtapaService.buscarPorId.mockImplementation(() => new Promise(() => {}));
      mockEtapaService.listarInscricoes.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useEtapaData(etapaId));

      expect(result.current.etapa).toBeNull();
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe("");
      expect(result.current.isReiDaPraia).toBe(false);
      expect(result.current.isSuperX).toBe(false);
      expect(result.current.isTeams).toBe(false);
      expect(result.current.progresso).toBe(0);
      expect(result.current.todasPartidasFinalizadas).toBe(false);
    });

    it("deve definir erro quando etapaId não é fornecido", async () => {
      const { result } = renderHook(() => useEtapaData(undefined));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("ID da etapa não fornecido");
    });
  });

  // ============================================
  // CARREGAR ETAPA
  // ============================================

  describe("carregarEtapa", () => {
    const mockEtapa = {
      id: etapaId,
      nome: "Etapa Teste",
      formato: FormatoEtapa.DUPLA_FIXA,
      totalInscritos: 8,
      maxJogadores: 16,
      chavesGeradas: false,
    };

    const mockInscricoes = [
      { id: "i1", jogadorId: "j1" },
      { id: "i2", jogadorId: "j2" },
    ];

    it("deve carregar etapa com sucesso", async () => {
      mockEtapaService.buscarPorId.mockResolvedValue(mockEtapa);
      mockEtapaService.listarInscricoes.mockResolvedValue(mockInscricoes);

      const { result } = renderHook(() => useEtapaData(etapaId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.etapa).not.toBeNull();
      expect(result.current.etapa?.id).toBe(etapaId);
      expect(result.current.etapa?.inscricoes).toHaveLength(2);
      expect(result.current.error).toBe("");
    });

    it("deve calcular progresso corretamente", async () => {
      mockEtapaService.buscarPorId.mockResolvedValue(mockEtapa);
      mockEtapaService.listarInscricoes.mockResolvedValue(mockInscricoes);

      const { result } = renderHook(() => useEtapaData(etapaId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // 8/16 = 50%
      expect(result.current.progresso).toBe(50);
    });

    it("deve definir erro quando carregamento falha", async () => {
      mockEtapaService.buscarPorId.mockRejectedValue(
        new Error("Erro de conexão")
      );
      mockEtapaService.listarInscricoes.mockResolvedValue([]);

      const { result } = renderHook(() => useEtapaData(etapaId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Erro de conexão");
    });
  });

  // ============================================
  // FLAGS DE FORMATO
  // ============================================

  describe("flags de formato", () => {
    it("deve detectar formato Rei da Praia", async () => {
      const etapaReiDaPraia = {
        id: etapaId,
        formato: FormatoEtapa.REI_DA_PRAIA,
        totalInscritos: 8,
        maxJogadores: 16,
        chavesGeradas: false,
      };

      mockEtapaService.buscarPorId.mockResolvedValue(etapaReiDaPraia);
      mockEtapaService.listarInscricoes.mockResolvedValue([]);

      const { result } = renderHook(() => useEtapaData(etapaId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isReiDaPraia).toBe(true);
      expect(result.current.isSuperX).toBe(false);
      expect(result.current.isTeams).toBe(false);
    });

    it("deve detectar formato Super X", async () => {
      const etapaSuperX = {
        id: etapaId,
        formato: FormatoEtapa.SUPER_X,
        totalInscritos: 8,
        maxJogadores: 8,
        chavesGeradas: false,
      };

      mockEtapaService.buscarPorId.mockResolvedValue(etapaSuperX);
      mockEtapaService.listarInscricoes.mockResolvedValue([]);

      const { result } = renderHook(() => useEtapaData(etapaId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isReiDaPraia).toBe(false);
      expect(result.current.isSuperX).toBe(true);
      expect(result.current.isTeams).toBe(false);
    });

    it("deve detectar formato TEAMS", async () => {
      const etapaTeams = {
        id: etapaId,
        formato: FormatoEtapa.TEAMS,
        totalInscritos: 8,
        maxJogadores: 16,
        chavesGeradas: false,
      };

      mockEtapaService.buscarPorId.mockResolvedValue(etapaTeams);
      mockEtapaService.listarInscricoes.mockResolvedValue([]);

      const { result } = renderHook(() => useEtapaData(etapaId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isReiDaPraia).toBe(false);
      expect(result.current.isSuperX).toBe(false);
      expect(result.current.isTeams).toBe(true);
    });
  });

  // ============================================
  // VERIFICAÇÃO DE PARTIDAS FINALIZADAS
  // ============================================

  describe("verificação de partidas finalizadas", () => {
    it("deve verificar partidas Super X finalizadas", async () => {
      const etapaSuperX = {
        id: etapaId,
        formato: FormatoEtapa.SUPER_X,
        totalInscritos: 8,
        maxJogadores: 8,
        chavesGeradas: true,
      };

      const partidasFinalizadas = [
        { id: "p1", status: "finalizada" },
        { id: "p2", status: "finalizada" },
      ];

      mockEtapaService.buscarPorId.mockResolvedValue(etapaSuperX);
      mockEtapaService.listarInscricoes.mockResolvedValue([]);
      mockSuperXService.buscarPartidas.mockResolvedValue(partidasFinalizadas);

      const { result } = renderHook(() => useEtapaData(etapaId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.todasPartidasFinalizadas).toBe(true);
      });
    });

    it("deve detectar partidas Super X não finalizadas", async () => {
      const etapaSuperX = {
        id: etapaId,
        formato: FormatoEtapa.SUPER_X,
        totalInscritos: 8,
        maxJogadores: 8,
        chavesGeradas: true,
      };

      const partidasMistas = [
        { id: "p1", status: "finalizada" },
        { id: "p2", status: "pendente" },
      ];

      mockEtapaService.buscarPorId.mockResolvedValue(etapaSuperX);
      mockEtapaService.listarInscricoes.mockResolvedValue([]);
      mockSuperXService.buscarPartidas.mockResolvedValue(partidasMistas);

      const { result } = renderHook(() => useEtapaData(etapaId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.todasPartidasFinalizadas).toBe(false);
      });
    });

    it("deve verificar confrontos TEAMS finalizados", async () => {
      const etapaTeams = {
        id: etapaId,
        formato: FormatoEtapa.TEAMS,
        totalInscritos: 8,
        maxJogadores: 16,
        chavesGeradas: true,
      };

      const confrontosFinalizados = [
        { id: "c1", status: StatusConfronto.FINALIZADO },
        { id: "c2", status: StatusConfronto.FINALIZADO },
      ];

      mockEtapaService.buscarPorId.mockResolvedValue(etapaTeams);
      mockEtapaService.listarInscricoes.mockResolvedValue([]);
      mockTeamsService.buscarConfrontos.mockResolvedValue(confrontosFinalizados);

      const { result } = renderHook(() => useEtapaData(etapaId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.todasPartidasFinalizadas).toBe(true);
      });
    });

    it("deve detectar confrontos TEAMS não finalizados", async () => {
      const etapaTeams = {
        id: etapaId,
        formato: FormatoEtapa.TEAMS,
        totalInscritos: 8,
        maxJogadores: 16,
        chavesGeradas: true,
      };

      const confrontosMistos = [
        { id: "c1", status: StatusConfronto.FINALIZADO },
        { id: "c2", status: StatusConfronto.EM_ANDAMENTO },
      ];

      mockEtapaService.buscarPorId.mockResolvedValue(etapaTeams);
      mockEtapaService.listarInscricoes.mockResolvedValue([]);
      mockTeamsService.buscarConfrontos.mockResolvedValue(confrontosMistos);

      const { result } = renderHook(() => useEtapaData(etapaId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.todasPartidasFinalizadas).toBe(false);
      });
    });

    it("deve lidar com erro ao buscar partidas/confrontos", async () => {
      const etapaSuperX = {
        id: etapaId,
        formato: FormatoEtapa.SUPER_X,
        totalInscritos: 8,
        maxJogadores: 8,
        chavesGeradas: true,
      };

      mockEtapaService.buscarPorId.mockResolvedValue(etapaSuperX);
      mockEtapaService.listarInscricoes.mockResolvedValue([]);
      mockSuperXService.buscarPartidas.mockRejectedValue(new Error("Erro"));

      const { result } = renderHook(() => useEtapaData(etapaId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Deve assumir false em caso de erro
      expect(result.current.todasPartidasFinalizadas).toBe(false);
    });

    it("não deve verificar partidas quando chaves não foram geradas", async () => {
      const etapaSuperX = {
        id: etapaId,
        formato: FormatoEtapa.SUPER_X,
        totalInscritos: 8,
        maxJogadores: 8,
        chavesGeradas: false,
      };

      mockEtapaService.buscarPorId.mockResolvedValue(etapaSuperX);
      mockEtapaService.listarInscricoes.mockResolvedValue([]);

      const { result } = renderHook(() => useEtapaData(etapaId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockSuperXService.buscarPartidas).not.toHaveBeenCalled();
      expect(result.current.todasPartidasFinalizadas).toBe(false);
    });

    it("não deve verificar partidas para formato Dupla Fixa", async () => {
      const etapaDuplaFixa = {
        id: etapaId,
        formato: FormatoEtapa.DUPLA_FIXA,
        totalInscritos: 8,
        maxJogadores: 16,
        chavesGeradas: true,
      };

      mockEtapaService.buscarPorId.mockResolvedValue(etapaDuplaFixa);
      mockEtapaService.listarInscricoes.mockResolvedValue([]);

      const { result } = renderHook(() => useEtapaData(etapaId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockSuperXService.buscarPartidas).not.toHaveBeenCalled();
      expect(mockTeamsService.buscarConfrontos).not.toHaveBeenCalled();
      expect(result.current.todasPartidasFinalizadas).toBe(false);
    });
  });

  // ============================================
  // RECARREGAR
  // ============================================

  describe("recarregar", () => {
    it("deve recarregar etapa com sucesso", async () => {
      const mockEtapa = {
        id: etapaId,
        nome: "Etapa Teste",
        formato: FormatoEtapa.DUPLA_FIXA,
        totalInscritos: 8,
        maxJogadores: 16,
        chavesGeradas: false,
      };

      mockEtapaService.buscarPorId.mockResolvedValue(mockEtapa);
      mockEtapaService.listarInscricoes.mockResolvedValue([]);

      const { result } = renderHook(() => useEtapaData(etapaId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Limpar chamadas anteriores
      mockEtapaService.buscarPorId.mockClear();
      mockEtapaService.listarInscricoes.mockClear();

      // Recarregar
      await act(async () => {
        await result.current.recarregar();
      });

      expect(mockEtapaService.buscarPorId).toHaveBeenCalledWith(etapaId);
      expect(mockEtapaService.listarInscricoes).toHaveBeenCalledWith(etapaId);
    });
  });

  // ============================================
  // PROGRESSO
  // ============================================

  describe("progresso", () => {
    it("deve calcular 0% quando maxJogadores é 0", async () => {
      const etapa = {
        id: etapaId,
        formato: FormatoEtapa.DUPLA_FIXA,
        totalInscritos: 5,
        maxJogadores: 0,
        chavesGeradas: false,
      };

      mockEtapaService.buscarPorId.mockResolvedValue(etapa);
      mockEtapaService.listarInscricoes.mockResolvedValue([]);

      const { result } = renderHook(() => useEtapaData(etapaId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.progresso).toBe(0);
    });

    it("deve calcular 100% quando etapa está cheia", async () => {
      const etapa = {
        id: etapaId,
        formato: FormatoEtapa.DUPLA_FIXA,
        totalInscritos: 16,
        maxJogadores: 16,
        chavesGeradas: false,
      };

      mockEtapaService.buscarPorId.mockResolvedValue(etapa);
      mockEtapaService.listarInscricoes.mockResolvedValue([]);

      const { result } = renderHook(() => useEtapaData(etapaId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.progresso).toBe(100);
    });

    it("deve arredondar progresso corretamente", async () => {
      const etapa = {
        id: etapaId,
        formato: FormatoEtapa.DUPLA_FIXA,
        totalInscritos: 3,
        maxJogadores: 16,
        chavesGeradas: false,
      };

      mockEtapaService.buscarPorId.mockResolvedValue(etapa);
      mockEtapaService.listarInscricoes.mockResolvedValue([]);

      const { result } = renderHook(() => useEtapaData(etapaId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // 3/16 = 18.75% -> arredondado para 19%
      expect(result.current.progresso).toBe(19);
    });
  });
});
