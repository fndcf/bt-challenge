/**
 * Testes para TeamsService
 */

import teamsService from "@/services/teamsService";
import { apiClient } from "@/services/apiClient";
import { VarianteTeams, TipoFormacaoEquipe } from "@/types/etapa";

// Mock do apiClient
jest.mock("@/services/apiClient", () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
}));

// Mock do logger
jest.mock("@/utils/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Mock do errorHandler
jest.mock("@/utils/errorHandler", () => ({
  handleError: jest.fn((error) => ({
    message: error.message || "Erro desconhecido",
    code: "UNKNOWN_ERROR",
  })),
}));

describe("TeamsService", () => {
  const etapaId = "etapa-123";
  const confrontoId = "confronto-456";
  const partidaId = "partida-789";
  const equipeId = "equipe-abc";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // EQUIPES
  // ============================================

  describe("gerarEquipes", () => {
    it("deve gerar equipes com sucesso", async () => {
      const mockResponse = {
        equipes: [
          { id: "e1", nome: "Equipe 1" },
          { id: "e2", nome: "Equipe 2" },
        ],
        confrontos: [{ id: "c1" }],
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const resultado = await teamsService.gerarEquipes(etapaId);

      expect(apiClient.post).toHaveBeenCalledWith(
        `/etapas/${etapaId}/teams/gerar-equipes`,
        {}
      );
      expect(resultado.equipes).toHaveLength(2);
    });

    it("deve gerar equipes com DTO customizado", async () => {
      const dto = { tipoFormacao: TipoFormacaoEquipe.BALANCEADO };
      const mockResponse = { equipes: [], confrontos: [] };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      await teamsService.gerarEquipes(etapaId, dto);

      expect(apiClient.post).toHaveBeenCalledWith(
        `/etapas/${etapaId}/teams/gerar-equipes`,
        dto
      );
    });

    it("deve lançar erro quando geração falha", async () => {
      const mockError = new Error("Erro ao gerar equipes");
      (apiClient.post as jest.Mock).mockRejectedValue(mockError);

      await expect(teamsService.gerarEquipes(etapaId)).rejects.toThrow(
        "Erro ao gerar equipes"
      );
    });
  });

  describe("formarEquipesManual", () => {
    it("deve formar equipes manualmente com sucesso", async () => {
      const dto = {
        formacoes: [
          { jogadorIds: ["j1", "j2", "j3", "j4"] },
          { jogadorIds: ["j5", "j6", "j7", "j8"] },
        ],
      };
      const mockResponse = {
        equipes: [{ id: "e1" }, { id: "e2" }],
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const resultado = await teamsService.formarEquipesManual(etapaId, dto);

      expect(apiClient.post).toHaveBeenCalledWith(
        `/etapas/${etapaId}/teams/formar-equipes-manual`,
        dto
      );
      expect(resultado.equipes).toHaveLength(2);
    });

    it("deve lançar erro quando formação falha", async () => {
      const mockError = new Error("Erro ao formar equipes");
      (apiClient.post as jest.Mock).mockRejectedValue(mockError);

      await expect(
        teamsService.formarEquipesManual(etapaId, { formacoes: [] })
      ).rejects.toThrow("Erro ao formar equipes");
    });
  });

  describe("buscarEquipes", () => {
    it("deve buscar equipes com sucesso", async () => {
      const mockEquipes = [
        { id: "e1", nome: "Equipe 1" },
        { id: "e2", nome: "Equipe 2" },
      ];

      (apiClient.get as jest.Mock).mockResolvedValue(mockEquipes);

      const resultado = await teamsService.buscarEquipes(etapaId);

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining(`/etapas/${etapaId}/teams/equipes`)
      );
      expect(resultado).toHaveLength(2);
    });

    it("deve lançar erro quando busca falha", async () => {
      const mockError = new Error("Erro ao buscar equipes");
      (apiClient.get as jest.Mock).mockRejectedValue(mockError);

      await expect(teamsService.buscarEquipes(etapaId)).rejects.toThrow(
        "Erro ao buscar equipes"
      );
    });
  });

  describe("renomearEquipe", () => {
    it("deve renomear equipe com sucesso", async () => {
      (apiClient.patch as jest.Mock).mockResolvedValue(undefined);

      await teamsService.renomearEquipe(etapaId, equipeId, "Novo Nome");

      expect(apiClient.patch).toHaveBeenCalledWith(
        `/etapas/${etapaId}/teams/equipes/${equipeId}/renomear`,
        { nome: "Novo Nome" }
      );
    });

    it("deve lançar erro quando renomeação falha", async () => {
      const mockError = new Error("Erro ao renomear");
      (apiClient.patch as jest.Mock).mockRejectedValue(mockError);

      await expect(
        teamsService.renomearEquipe(etapaId, equipeId, "Nome")
      ).rejects.toThrow("Erro ao renomear");
    });
  });

  // ============================================
  // CONFRONTOS
  // ============================================

  describe("buscarConfrontos", () => {
    it("deve buscar confrontos com sucesso", async () => {
      const mockConfrontos = [
        { id: "c1", equipe1Id: "e1", equipe2Id: "e2" },
        { id: "c2", equipe1Id: "e1", equipe2Id: "e3" },
      ];

      (apiClient.get as jest.Mock).mockResolvedValue(mockConfrontos);

      const resultado = await teamsService.buscarConfrontos(etapaId);

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining(`/etapas/${etapaId}/teams/confrontos`)
      );
      expect(resultado).toHaveLength(2);
    });

    it("deve lançar erro quando busca falha", async () => {
      const mockError = new Error("Erro ao buscar confrontos");
      (apiClient.get as jest.Mock).mockRejectedValue(mockError);

      await expect(teamsService.buscarConfrontos(etapaId)).rejects.toThrow(
        "Erro ao buscar confrontos"
      );
    });
  });

  // ============================================
  // PARTIDAS
  // ============================================

  describe("gerarPartidasConfronto", () => {
    it("deve gerar partidas do confronto com sucesso", async () => {
      const mockResponse = {
        partidas: [{ id: "p1" }, { id: "p2" }],
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const resultado = await teamsService.gerarPartidasConfronto(
        etapaId,
        confrontoId
      );

      expect(apiClient.post).toHaveBeenCalledWith(
        `/etapas/${etapaId}/teams/confrontos/${confrontoId}/gerar-partidas`,
        {}
      );
      expect(resultado.partidas).toHaveLength(2);
    });

    it("deve lançar erro quando geração falha", async () => {
      const mockError = new Error("Erro ao gerar partidas");
      (apiClient.post as jest.Mock).mockRejectedValue(mockError);

      await expect(
        teamsService.gerarPartidasConfronto(etapaId, confrontoId)
      ).rejects.toThrow("Erro ao gerar partidas");
    });
  });

  describe("definirPartidasManual", () => {
    it("deve definir partidas manualmente com sucesso", async () => {
      const dto = {
        partidas: [
          {
            dupla1JogadorIds: ["j1", "j2"] as [string, string],
            dupla2JogadorIds: ["j3", "j4"] as [string, string],
          },
        ],
      };
      const mockResponse = { partidas: [{ id: "p1" }] };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const resultado = await teamsService.definirPartidasManual(
        etapaId,
        confrontoId,
        dto
      );

      expect(apiClient.post).toHaveBeenCalledWith(
        `/etapas/${etapaId}/teams/confrontos/${confrontoId}/definir-partidas`,
        dto
      );
      expect(resultado.partidas).toHaveLength(1);
    });

    it("deve lançar erro quando definição falha", async () => {
      const mockError = new Error("Erro ao definir partidas");
      (apiClient.post as jest.Mock).mockRejectedValue(mockError);

      await expect(
        teamsService.definirPartidasManual(etapaId, confrontoId, { partidas: [] })
      ).rejects.toThrow("Erro ao definir partidas");
    });
  });

  describe("buscarPartidasConfronto", () => {
    it("deve buscar partidas do confronto com sucesso", async () => {
      const mockPartidas = [
        { id: "p1", confrontoId },
        { id: "p2", confrontoId },
      ];

      (apiClient.get as jest.Mock).mockResolvedValue(mockPartidas);

      const resultado = await teamsService.buscarPartidasConfronto(
        etapaId,
        confrontoId
      );

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining(
          `/etapas/${etapaId}/teams/confrontos/${confrontoId}/partidas`
        )
      );
      expect(resultado).toHaveLength(2);
    });

    it("deve lançar erro quando busca falha", async () => {
      const mockError = new Error("Erro ao buscar partidas");
      (apiClient.get as jest.Mock).mockRejectedValue(mockError);

      await expect(
        teamsService.buscarPartidasConfronto(etapaId, confrontoId)
      ).rejects.toThrow("Erro ao buscar partidas");
    });
  });

  describe("definirJogadoresPartida", () => {
    it("deve definir jogadores da partida com sucesso", async () => {
      const mockResponse = { id: partidaId, status: "pendente" };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const resultado = await teamsService.definirJogadoresPartida(
        etapaId,
        partidaId,
        ["j1", "j2"],
        ["j3", "j4"]
      );

      expect(apiClient.post).toHaveBeenCalledWith(
        `/etapas/${etapaId}/teams/partidas/${partidaId}/definir-jogadores`,
        {
          dupla1JogadorIds: ["j1", "j2"],
          dupla2JogadorIds: ["j3", "j4"],
        }
      );
      expect(resultado.id).toBe(partidaId);
    });

    it("deve lançar erro quando definição falha", async () => {
      const mockError = new Error("Erro ao definir jogadores");
      (apiClient.post as jest.Mock).mockRejectedValue(mockError);

      await expect(
        teamsService.definirJogadoresPartida(
          etapaId,
          partidaId,
          ["j1", "j2"],
          ["j3", "j4"]
        )
      ).rejects.toThrow("Erro ao definir jogadores");
    });
  });

  // ============================================
  // RESULTADO
  // ============================================

  describe("registrarResultadosEmLote", () => {
    const mockResultados = [
      { partidaId: "p1", placar1: 6, placar2: 4 },
      { partidaId: "p2", placar1: 3, placar2: 6 },
    ];

    it("deve registrar resultados em lote com sucesso", async () => {
      const mockResponse = {
        processados: 2,
        erros: [],
        confrontosFinalizados: [],
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const resultado = await teamsService.registrarResultadosEmLote(
        etapaId,
        mockResultados
      );

      expect(apiClient.post).toHaveBeenCalledWith(
        `/etapas/${etapaId}/teams/resultados-lote`,
        { resultados: mockResultados }
      );
      expect(resultado.processados).toBe(2);
    });

    it("deve retornar confrontos finalizados", async () => {
      const mockResponse = {
        processados: 2,
        erros: [],
        confrontosFinalizados: [{ id: "c1", vencedor: "e1" }],
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const resultado = await teamsService.registrarResultadosEmLote(
        etapaId,
        mockResultados
      );

      expect(resultado.confrontosFinalizados).toHaveLength(1);
    });

    it("deve lançar erro quando registro falha", async () => {
      const mockError = new Error("Erro ao registrar");
      (apiClient.post as jest.Mock).mockRejectedValue(mockError);

      await expect(
        teamsService.registrarResultadosEmLote(etapaId, mockResultados)
      ).rejects.toThrow("Erro ao registrar");
    });
  });

  // ============================================
  // DECIDER
  // ============================================

  describe("gerarDecider", () => {
    it("deve gerar decider com sucesso", async () => {
      const mockResponse = {
        decider: { id: "d1", confrontoId },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const resultado = await teamsService.gerarDecider(etapaId, confrontoId);

      expect(apiClient.post).toHaveBeenCalledWith(
        `/etapas/${etapaId}/teams/confrontos/${confrontoId}/gerar-decider`,
        {}
      );
      expect(resultado.decider?.id).toBe("d1");
    });

    it("deve lançar erro quando geração falha", async () => {
      const mockError = new Error("Erro ao gerar decider");
      (apiClient.post as jest.Mock).mockRejectedValue(mockError);

      await expect(
        teamsService.gerarDecider(etapaId, confrontoId)
      ).rejects.toThrow("Erro ao gerar decider");
    });
  });

  // ============================================
  // CANCELAR
  // ============================================

  describe("cancelarChaves", () => {
    it("deve cancelar chaves com sucesso", async () => {
      (apiClient.delete as jest.Mock).mockResolvedValue(undefined);

      await teamsService.cancelarChaves(etapaId);

      expect(apiClient.delete).toHaveBeenCalledWith(
        `/etapas/${etapaId}/teams/cancelar`
      );
    });

    it("deve lançar erro quando cancelamento falha", async () => {
      const mockError = new Error("Erro ao cancelar");
      (apiClient.delete as jest.Mock).mockRejectedValue(mockError);

      await expect(teamsService.cancelarChaves(etapaId)).rejects.toThrow(
        "Erro ao cancelar"
      );
    });
  });

  describe("resetarPartidas", () => {
    it("deve resetar partidas com sucesso", async () => {
      (apiClient.delete as jest.Mock).mockResolvedValue(undefined);

      await teamsService.resetarPartidas(etapaId);

      expect(apiClient.delete).toHaveBeenCalledWith(
        `/etapas/${etapaId}/teams/resetar-partidas`
      );
    });

    it("deve lançar erro quando reset falha", async () => {
      const mockError = new Error("Erro ao resetar");
      (apiClient.delete as jest.Mock).mockRejectedValue(mockError);

      await expect(teamsService.resetarPartidas(etapaId)).rejects.toThrow(
        "Erro ao resetar"
      );
    });
  });

  // ============================================
  // CLASSIFICAÇÃO
  // ============================================

  describe("recalcularClassificacao", () => {
    it("deve recalcular classificação com sucesso", async () => {
      const mockEquipes = [
        { id: "e1", posicao: 1 },
        { id: "e2", posicao: 2 },
      ];

      (apiClient.post as jest.Mock).mockResolvedValue(mockEquipes);

      const resultado = await teamsService.recalcularClassificacao(etapaId);

      expect(apiClient.post).toHaveBeenCalledWith(
        `/etapas/${etapaId}/teams/recalcular-classificacao`,
        {}
      );
      expect(resultado).toHaveLength(2);
    });

    it("deve lançar erro quando recálculo falha", async () => {
      const mockError = new Error("Erro ao recalcular");
      (apiClient.post as jest.Mock).mockRejectedValue(mockError);

      await expect(teamsService.recalcularClassificacao(etapaId)).rejects.toThrow(
        "Erro ao recalcular"
      );
    });
  });

  // ============================================
  // VALIDAÇÕES
  // ============================================

  describe("validarGeracaoEquipes", () => {
    it("deve retornar válido para etapa correta TEAMS_4", () => {
      const etapa = {
        status: "inscricoes_encerradas",
        chavesGeradas: false,
        varianteTeams: VarianteTeams.TEAMS_4,
        totalInscritos: 8, // 2 equipes de 4
      };

      const resultado = teamsService.validarGeracaoEquipes(etapa);

      expect(resultado.podeGerar).toBe(true);
    });

    it("deve retornar válido para etapa correta TEAMS_6", () => {
      const etapa = {
        status: "inscricoes_encerradas",
        chavesGeradas: false,
        varianteTeams: VarianteTeams.TEAMS_6,
        totalInscritos: 12, // 2 equipes de 6
      };

      const resultado = teamsService.validarGeracaoEquipes(etapa);

      expect(resultado.podeGerar).toBe(true);
    });

    it("deve retornar inválido quando inscrições não estão encerradas", () => {
      const etapa = {
        status: "inscricoes_abertas",
        chavesGeradas: false,
        varianteTeams: VarianteTeams.TEAMS_4,
        totalInscritos: 8,
      };

      const resultado = teamsService.validarGeracaoEquipes(etapa);

      expect(resultado.podeGerar).toBe(false);
      expect(resultado.mensagem).toContain("inscrições");
    });

    it("deve retornar inválido quando equipes já foram geradas", () => {
      const etapa = {
        status: "inscricoes_encerradas",
        chavesGeradas: true,
        varianteTeams: VarianteTeams.TEAMS_4,
        totalInscritos: 8,
      };

      const resultado = teamsService.validarGeracaoEquipes(etapa);

      expect(resultado.podeGerar).toBe(false);
      expect(resultado.mensagem).toContain("já foram geradas");
    });

    it("deve retornar inválido quando variante é inválida", () => {
      const etapa = {
        status: "inscricoes_encerradas",
        chavesGeradas: false,
        varianteTeams: 5 as VarianteTeams, // Variante inválida
        totalInscritos: 10,
      };

      const resultado = teamsService.validarGeracaoEquipes(etapa);

      expect(resultado.podeGerar).toBe(false);
      expect(resultado.mensagem).toContain("inválida");
    });

    it("deve retornar inválido quando variante não está definida", () => {
      const etapa = {
        status: "inscricoes_encerradas",
        chavesGeradas: false,
        varianteTeams: undefined,
        totalInscritos: 8,
      };

      const resultado = teamsService.validarGeracaoEquipes(etapa);

      expect(resultado.podeGerar).toBe(false);
      expect(resultado.mensagem).toContain("inválida");
    });

    it("deve retornar inválido quando número de inscritos não é múltiplo da variante", () => {
      const etapa = {
        status: "inscricoes_encerradas",
        chavesGeradas: false,
        varianteTeams: VarianteTeams.TEAMS_4,
        totalInscritos: 10, // Não é múltiplo de 4
      };

      const resultado = teamsService.validarGeracaoEquipes(etapa);

      expect(resultado.podeGerar).toBe(false);
      expect(resultado.mensagem).toContain("múltiplo");
    });

    it("deve retornar inválido quando número de equipes é menor que 2", () => {
      const etapa = {
        status: "inscricoes_encerradas",
        chavesGeradas: false,
        varianteTeams: VarianteTeams.TEAMS_4,
        totalInscritos: 4, // Apenas 1 equipe
      };

      const resultado = teamsService.validarGeracaoEquipes(etapa);

      expect(resultado.podeGerar).toBe(false);
      expect(resultado.mensagem).toContain("Mínimo");
    });
  });

  describe("getDescricaoFormacao", () => {
    it("deve retornar descrição para MESMO_NIVEL", () => {
      const descricao = teamsService.getDescricaoFormacao(
        TipoFormacaoEquipe.MESMO_NIVEL
      );
      expect(descricao).toContain("mesmo nível");
    });

    it("deve retornar descrição para BALANCEADO", () => {
      const descricao = teamsService.getDescricaoFormacao(
        TipoFormacaoEquipe.BALANCEADO
      );
      expect(descricao).toContain("equilibrada");
    });

    it("deve retornar descrição para MANUAL", () => {
      const descricao = teamsService.getDescricaoFormacao(
        TipoFormacaoEquipe.MANUAL
      );
      expect(descricao).toContain("manualmente");
    });

    it("deve retornar string vazia para valor desconhecido", () => {
      const descricao = teamsService.getDescricaoFormacao(
        "UNKNOWN" as TipoFormacaoEquipe
      );
      expect(descricao).toBe("");
    });
  });

  describe("getDescricaoVariante", () => {
    it("deve retornar descrição para TEAMS_4", () => {
      const descricao = teamsService.getDescricaoVariante(VarianteTeams.TEAMS_4);
      expect(descricao).toContain("4 jogadores");
      expect(descricao).toContain("decider");
    });

    it("deve retornar descrição para TEAMS_6", () => {
      const descricao = teamsService.getDescricaoVariante(VarianteTeams.TEAMS_6);
      expect(descricao).toContain("6 jogadores");
      expect(descricao).toContain("3 jogos");
    });

    it("deve retornar string vazia para valor desconhecido", () => {
      const descricao = teamsService.getDescricaoVariante(
        99 as VarianteTeams
      );
      expect(descricao).toBe("");
    });
  });
});
