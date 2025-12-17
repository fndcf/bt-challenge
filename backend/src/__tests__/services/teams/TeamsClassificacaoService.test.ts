/**
 * Testes para TeamsClassificacaoService
 *
 * Responsabilidades:
 * - Cálculo de classificação de equipes
 * - Preenchimento automático da fase eliminatória
 * - Propagação de vencedores para próximos confrontos
 */

import { TeamsClassificacaoService } from "../../../services/teams/TeamsClassificacaoService";
import { createMockEquipeRepository, createMockConfrontoEquipeRepository } from "../../mocks/repositories";
import { Equipe, ConfrontoEquipe, StatusConfronto } from "../../../models/Teams";
import { FaseEtapa } from "../../../models/Etapa";

describe("TeamsClassificacaoService", () => {
  let service: TeamsClassificacaoService;
  let mockEquipeRepository: ReturnType<typeof createMockEquipeRepository>;
  let mockConfrontoRepository: ReturnType<typeof createMockConfrontoEquipeRepository>;

  const etapaId = "etapa-1";
  const arenaId = "arena-1";

  // Helper para criar equipes
  function criarEquipe(overrides: Partial<Equipe> = {}): Equipe {
    return {
      id: "equipe-1",
      etapaId,
      arenaId,
      nome: "Equipe 1",
      ordem: 1,
      jogadores: [],
      confrontos: 0,
      vitorias: 0,
      derrotas: 0,
      pontos: 0,
      jogosVencidos: 0,
      jogosPerdidos: 0,
      saldoJogos: 0,
      gamesVencidos: 0,
      gamesPerdidos: 0,
      saldoGames: 0,
      criadoEm: "2024-01-01T00:00:00Z",
      atualizadoEm: "2024-01-01T00:00:00Z",
      ...overrides,
    };
  }

  // Helper para criar confrontos
  function criarConfronto(overrides: Partial<ConfrontoEquipe> = {}): ConfrontoEquipe {
    return {
      id: "confronto-1",
      etapaId,
      arenaId,
      fase: FaseEtapa.GRUPOS,
      ordem: 1,
      equipe1Id: "equipe-1",
      equipe1Nome: "Equipe 1",
      equipe2Id: "equipe-2",
      equipe2Nome: "Equipe 2",
      status: StatusConfronto.AGENDADO,
      jogosEquipe1: 0,
      jogosEquipe2: 0,
      partidas: [],
      totalPartidas: 2,
      partidasFinalizadas: 0,
      temDecider: false,
      tipoFormacaoJogos: "sorteio" as any,
      criadoEm: "2024-01-01T00:00:00Z",
      atualizadoEm: "2024-01-01T00:00:00Z",
      ...overrides,
    };
  }

  beforeEach(() => {
    mockEquipeRepository = createMockEquipeRepository();
    mockConfrontoRepository = createMockConfrontoEquipeRepository();

    service = new TeamsClassificacaoService(
      mockConfrontoRepository,
      mockEquipeRepository
    );
  });

  describe("recalcularClassificacao", () => {
    it("deve ordenar equipes por pontos (desc)", async () => {
      const equipes = [
        criarEquipe({ id: "e1", nome: "Equipe 1", pontos: 3 }),
        criarEquipe({ id: "e2", nome: "Equipe 2", pontos: 9 }),
        criarEquipe({ id: "e3", nome: "Equipe 3", pontos: 6 }),
      ];

      mockEquipeRepository.buscarPorEtapa.mockResolvedValue(equipes);
      mockEquipeRepository.atualizarPosicoesEmLote.mockResolvedValue(undefined);

      const resultado = await service.recalcularClassificacao(etapaId, arenaId);

      expect(resultado[0].nome).toBe("Equipe 2"); // 9 pontos - 1º
      expect(resultado[1].nome).toBe("Equipe 3"); // 6 pontos - 2º
      expect(resultado[2].nome).toBe("Equipe 1"); // 3 pontos - 3º
      expect(resultado[0].posicao).toBe(1);
      expect(resultado[1].posicao).toBe(2);
      expect(resultado[2].posicao).toBe(3);
    });

    it("deve usar saldo de jogos como desempate", async () => {
      const equipes = [
        criarEquipe({ id: "e1", nome: "Equipe 1", pontos: 6, saldoJogos: 2 }),
        criarEquipe({ id: "e2", nome: "Equipe 2", pontos: 6, saldoJogos: 5 }),
        criarEquipe({ id: "e3", nome: "Equipe 3", pontos: 6, saldoJogos: -1 }),
      ];

      mockEquipeRepository.buscarPorEtapa.mockResolvedValue(equipes);
      mockEquipeRepository.atualizarPosicoesEmLote.mockResolvedValue(undefined);

      const resultado = await service.recalcularClassificacao(etapaId, arenaId);

      expect(resultado[0].nome).toBe("Equipe 2"); // saldoJogos 5
      expect(resultado[1].nome).toBe("Equipe 1"); // saldoJogos 2
      expect(resultado[2].nome).toBe("Equipe 3"); // saldoJogos -1
    });

    it("deve usar saldo de games como segundo desempate", async () => {
      const equipes = [
        criarEquipe({ id: "e1", nome: "Equipe 1", pontos: 6, saldoJogos: 2, saldoGames: 10 }),
        criarEquipe({ id: "e2", nome: "Equipe 2", pontos: 6, saldoJogos: 2, saldoGames: 15 }),
        criarEquipe({ id: "e3", nome: "Equipe 3", pontos: 6, saldoJogos: 2, saldoGames: 5 }),
      ];

      mockEquipeRepository.buscarPorEtapa.mockResolvedValue(equipes);
      mockEquipeRepository.atualizarPosicoesEmLote.mockResolvedValue(undefined);

      const resultado = await service.recalcularClassificacao(etapaId, arenaId);

      expect(resultado[0].nome).toBe("Equipe 2"); // saldoGames 15
      expect(resultado[1].nome).toBe("Equipe 1"); // saldoGames 10
      expect(resultado[2].nome).toBe("Equipe 3"); // saldoGames 5
    });

    it("deve usar games vencidos como terceiro desempate", async () => {
      const equipes = [
        criarEquipe({ id: "e1", nome: "Equipe 1", pontos: 6, saldoJogos: 2, saldoGames: 10, gamesVencidos: 20 }),
        criarEquipe({ id: "e2", nome: "Equipe 2", pontos: 6, saldoJogos: 2, saldoGames: 10, gamesVencidos: 25 }),
        criarEquipe({ id: "e3", nome: "Equipe 3", pontos: 6, saldoJogos: 2, saldoGames: 10, gamesVencidos: 15 }),
      ];

      mockEquipeRepository.buscarPorEtapa.mockResolvedValue(equipes);
      mockEquipeRepository.atualizarPosicoesEmLote.mockResolvedValue(undefined);

      const resultado = await service.recalcularClassificacao(etapaId, arenaId);

      expect(resultado[0].nome).toBe("Equipe 2"); // 25 games
      expect(resultado[1].nome).toBe("Equipe 1"); // 20 games
      expect(resultado[2].nome).toBe("Equipe 3"); // 15 games
    });

    it("deve usar nome como último critério de desempate", async () => {
      const equipes = [
        criarEquipe({ id: "e1", nome: "Zebra", pontos: 6, saldoJogos: 2, saldoGames: 10, gamesVencidos: 20 }),
        criarEquipe({ id: "e2", nome: "Alpha", pontos: 6, saldoJogos: 2, saldoGames: 10, gamesVencidos: 20 }),
        criarEquipe({ id: "e3", nome: "Beta", pontos: 6, saldoJogos: 2, saldoGames: 10, gamesVencidos: 20 }),
      ];

      mockEquipeRepository.buscarPorEtapa.mockResolvedValue(equipes);
      mockEquipeRepository.atualizarPosicoesEmLote.mockResolvedValue(undefined);

      const resultado = await service.recalcularClassificacao(etapaId, arenaId);

      expect(resultado[0].nome).toBe("Alpha");
      expect(resultado[1].nome).toBe("Beta");
      expect(resultado[2].nome).toBe("Zebra");
    });

    it("deve atualizar posições em lote", async () => {
      const equipes = [
        criarEquipe({ id: "e1", nome: "Equipe 1", pontos: 3 }),
        criarEquipe({ id: "e2", nome: "Equipe 2", pontos: 6 }),
      ];

      mockEquipeRepository.buscarPorEtapa.mockResolvedValue(equipes);
      mockEquipeRepository.atualizarPosicoesEmLote.mockResolvedValue(undefined);

      await service.recalcularClassificacao(etapaId, arenaId);

      expect(mockEquipeRepository.atualizarPosicoesEmLote).toHaveBeenCalledWith([
        { id: "e2", posicao: 1 },
        { id: "e1", posicao: 2 },
      ]);
    });

    it("deve retornar lista vazia se não houver equipes", async () => {
      mockEquipeRepository.buscarPorEtapa.mockResolvedValue([]);
      mockEquipeRepository.atualizarPosicoesEmLote.mockResolvedValue(undefined);

      const resultado = await service.recalcularClassificacao(etapaId, arenaId);

      expect(resultado).toEqual([]);
    });
  });

  describe("verificarEPreencherFaseEliminatoria", () => {
    it("não deve preencher se fase de grupos não finalizou", async () => {
      mockConfrontoRepository.todosFinalizadosPorFase.mockResolvedValue(false);

      await service.verificarEPreencherFaseEliminatoria(etapaId, arenaId);

      expect(mockEquipeRepository.buscarPorEtapaOrdenadas).not.toHaveBeenCalled();
    });

    it("não deve preencher se não tem fase de grupos", async () => {
      mockConfrontoRepository.todosFinalizadosPorFase.mockResolvedValue(true);
      mockEquipeRepository.buscarPorEtapaOrdenadas.mockResolvedValue([
        criarEquipe({ id: "e1", nome: "Equipe 1", grupoId: undefined }),
        criarEquipe({ id: "e2", nome: "Equipe 2", grupoId: undefined }),
      ]);

      await service.verificarEPreencherFaseEliminatoria(etapaId, arenaId);

      expect(mockConfrontoRepository.buscarPorEtapa).not.toHaveBeenCalled();
    });

    it("não deve preencher se número de grupos for menor que 2", async () => {
      mockConfrontoRepository.todosFinalizadosPorFase.mockResolvedValue(true);
      mockEquipeRepository.buscarPorEtapaOrdenadas.mockResolvedValue([
        criarEquipe({ id: "e1", nome: "Equipe 1", grupoId: "A", pontos: 6 }),
        criarEquipe({ id: "e2", nome: "Equipe 2", grupoId: "A", pontos: 3 }),
      ]);

      await service.verificarEPreencherFaseEliminatoria(etapaId, arenaId);

      expect(mockConfrontoRepository.buscarPorEtapa).not.toHaveBeenCalled();
    });

    it("não deve preencher se número de grupos for maior que 8", async () => {
      mockConfrontoRepository.todosFinalizadosPorFase.mockResolvedValue(true);

      // 9 grupos
      const equipes = ["A", "B", "C", "D", "E", "F", "G", "H", "I"].flatMap((g, i) => [
        criarEquipe({ id: `e${i*2+1}`, nome: `Equipe ${i*2+1}`, grupoId: g, pontos: 6 }),
        criarEquipe({ id: `e${i*2+2}`, nome: `Equipe ${i*2+2}`, grupoId: g, pontos: 3 }),
      ]);
      mockEquipeRepository.buscarPorEtapaOrdenadas.mockResolvedValue(equipes);

      await service.verificarEPreencherFaseEliminatoria(etapaId, arenaId);

      expect(mockConfrontoRepository.buscarPorEtapa).not.toHaveBeenCalled();
    });

    it("deve preencher confrontos eliminatórios com classificados", async () => {
      mockConfrontoRepository.todosFinalizadosPorFase.mockResolvedValue(true);

      // 2 grupos com 2 equipes cada
      const equipes = [
        criarEquipe({ id: "e1", nome: "Equipe 1", grupoId: "A", pontos: 6 }),
        criarEquipe({ id: "e2", nome: "Equipe 2", grupoId: "A", pontos: 3 }),
        criarEquipe({ id: "e3", nome: "Equipe 3", grupoId: "B", pontos: 6 }),
        criarEquipe({ id: "e4", nome: "Equipe 4", grupoId: "B", pontos: 3 }),
      ];
      mockEquipeRepository.buscarPorEtapaOrdenadas.mockResolvedValue(equipes);

      // Confronto eliminatório para preencher
      const confrontosEliminatoria = [
        criarConfronto({
          id: "c1",
          fase: FaseEtapa.SEMIFINAL,
          equipe1Id: "",
          equipe1Nome: "",
          equipe2Id: "",
          equipe2Nome: "",
          equipe1Origem: "1º Grupo A",
          equipe2Origem: "2º Grupo B",
        }),
      ];
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue(confrontosEliminatoria);
      mockConfrontoRepository.atualizar.mockResolvedValue(undefined);

      await service.verificarEPreencherFaseEliminatoria(etapaId, arenaId);

      // Deve preencher equipe1 (1º do Grupo A = e1)
      expect(mockConfrontoRepository.atualizar).toHaveBeenCalledWith("c1", {
        equipe1Id: "e1",
        equipe1Nome: "Equipe 1",
      });
      // Deve preencher equipe2 (2º do Grupo B = e4)
      expect(mockConfrontoRepository.atualizar).toHaveBeenCalledWith("c1", {
        equipe2Id: "e4",
        equipe2Nome: "Equipe 4",
      });
    });

    it("deve processar BYE corretamente", async () => {
      mockConfrontoRepository.todosFinalizadosPorFase.mockResolvedValue(true);

      const equipes = [
        criarEquipe({ id: "e1", nome: "Equipe 1", grupoId: "A", pontos: 6 }),
        criarEquipe({ id: "e2", nome: "Equipe 2", grupoId: "A", pontos: 3 }),
        criarEquipe({ id: "e3", nome: "Equipe 3", grupoId: "B", pontos: 6 }),
        criarEquipe({ id: "e4", nome: "Equipe 4", grupoId: "B", pontos: 3 }),
      ];
      mockEquipeRepository.buscarPorEtapaOrdenadas.mockResolvedValue(equipes);

      // Confronto BYE
      const confrontosBye = [
        criarConfronto({
          id: "c-bye",
          fase: FaseEtapa.QUARTAS,
          isBye: true,
          equipe1Id: "",
          equipe1Nome: "",
          equipe2Id: "BYE",
          equipe2Nome: "BYE",
          equipe1Origem: "1º Grupo A",
          proximoConfrontoId: "c-semi",
        }),
      ];
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue(confrontosBye);
      mockConfrontoRepository.atualizar.mockResolvedValue(undefined);
      mockConfrontoRepository.buscarPorId.mockResolvedValue(
        criarConfronto({ id: "c-semi", fase: FaseEtapa.SEMIFINAL })
      );

      await service.verificarEPreencherFaseEliminatoria(etapaId, arenaId);

      // Deve preencher equipe1 do BYE
      expect(mockConfrontoRepository.atualizar).toHaveBeenCalledWith("c-bye", {
        equipe1Id: "e1",
        equipe1Nome: "Equipe 1",
      });
      // Deve marcar BYE como finalizado
      expect(mockConfrontoRepository.atualizar).toHaveBeenCalledWith("c-bye", {
        status: StatusConfronto.FINALIZADO,
        vencedoraId: "e1",
        vencedoraNome: "Equipe 1",
      });
    });

    it("não deve preencher confronto se já tem equipes definidas", async () => {
      mockConfrontoRepository.todosFinalizadosPorFase.mockResolvedValue(true);

      const equipes = [
        criarEquipe({ id: "e1", nome: "Equipe 1", grupoId: "A", pontos: 6 }),
        criarEquipe({ id: "e2", nome: "Equipe 2", grupoId: "B", pontos: 6 }),
      ];
      mockEquipeRepository.buscarPorEtapaOrdenadas.mockResolvedValue(equipes);

      // Confronto já preenchido
      const confrontos = [
        criarConfronto({
          id: "c1",
          fase: FaseEtapa.FINAL,
          equipe1Id: "e1",
          equipe1Nome: "Equipe 1",
          equipe2Id: "e2",
          equipe2Nome: "Equipe 2",
        }),
      ];
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue(confrontos);

      await service.verificarEPreencherFaseEliminatoria(etapaId, arenaId);

      // Não deve atualizar porque já está preenchido
      expect(mockConfrontoRepository.atualizar).not.toHaveBeenCalled();
    });

    it("deve ordenar equipes dentro do grupo usando todos os critérios", async () => {
      mockConfrontoRepository.todosFinalizadosPorFase.mockResolvedValue(true);

      // Equipes do mesmo grupo com empates
      const equipes = [
        criarEquipe({
          id: "e1", nome: "A", grupoId: "A",
          pontos: 6, saldoJogos: 2, saldoGames: 10, gamesVencidos: 20
        }),
        criarEquipe({
          id: "e2", nome: "B", grupoId: "A",
          pontos: 6, saldoJogos: 2, saldoGames: 15, gamesVencidos: 20 // Melhor saldo games
        }),
        criarEquipe({
          id: "e3", nome: "C", grupoId: "B",
          pontos: 3, saldoJogos: 0, saldoGames: 0, gamesVencidos: 10
        }),
        criarEquipe({
          id: "e4", nome: "D", grupoId: "B",
          pontos: 3, saldoJogos: 0, saldoGames: 0, gamesVencidos: 15 // Mais games
        }),
      ];
      mockEquipeRepository.buscarPorEtapaOrdenadas.mockResolvedValue(equipes);

      const confrontos = [
        criarConfronto({
          id: "c1",
          fase: FaseEtapa.SEMIFINAL,
          equipe1Id: "",
          equipe1Nome: "",
          equipe2Id: "",
          equipe2Nome: "",
          equipe1Origem: "1º Grupo A",
          equipe2Origem: "1º Grupo B",
        }),
      ];
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue(confrontos);
      mockConfrontoRepository.atualizar.mockResolvedValue(undefined);

      await service.verificarEPreencherFaseEliminatoria(etapaId, arenaId);

      // e2 deve ser 1º do grupo A (melhor saldoGames)
      expect(mockConfrontoRepository.atualizar).toHaveBeenCalledWith("c1", {
        equipe1Id: "e2",
        equipe1Nome: "B",
      });
      // e4 deve ser 1º do grupo B (mais gamesVencidos)
      expect(mockConfrontoRepository.atualizar).toHaveBeenCalledWith("c1", {
        equipe2Id: "e4",
        equipe2Nome: "D",
      });
    });
  });

  describe("preencherProximoConfronto", () => {
    it("não deve fazer nada se não tem próximo confronto", async () => {
      const confronto = criarConfronto({ proximoConfrontoId: undefined });

      await service.preencherProximoConfronto(confronto, "e1", "Equipe 1");

      expect(mockConfrontoRepository.buscarPorId).not.toHaveBeenCalled();
    });

    it("não deve fazer nada se próximo confronto não existe", async () => {
      const confronto = criarConfronto({ proximoConfrontoId: "c-proximo" });
      mockConfrontoRepository.buscarPorId.mockResolvedValue(null);

      await service.preencherProximoConfronto(confronto, "e1", "Equipe 1");

      expect(mockConfrontoRepository.atualizar).not.toHaveBeenCalled();
    });

    it("deve preencher equipe1 se vazia", async () => {
      const confronto = criarConfronto({ proximoConfrontoId: "c-proximo" });
      const proximoConfronto = criarConfronto({
        id: "c-proximo",
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "e3",
        equipe2Nome: "Equipe 3",
      });
      mockConfrontoRepository.buscarPorId.mockResolvedValue(proximoConfronto);
      mockConfrontoRepository.atualizar.mockResolvedValue(undefined);

      await service.preencherProximoConfronto(confronto, "e1", "Equipe 1");

      expect(mockConfrontoRepository.atualizar).toHaveBeenCalledWith("c-proximo", {
        equipe1Id: "e1",
        equipe1Nome: "Equipe 1",
      });
    });

    it("deve preencher equipe2 se equipe1 já está preenchida", async () => {
      const confronto = criarConfronto({ proximoConfrontoId: "c-proximo" });
      const proximoConfronto = criarConfronto({
        id: "c-proximo",
        equipe1Id: "e3",
        equipe1Nome: "Equipe 3",
        equipe2Id: "",
        equipe2Nome: "",
      });
      mockConfrontoRepository.buscarPorId.mockResolvedValue(proximoConfronto);
      mockConfrontoRepository.atualizar.mockResolvedValue(undefined);

      await service.preencherProximoConfronto(confronto, "e1", "Equipe 1");

      expect(mockConfrontoRepository.atualizar).toHaveBeenCalledWith("c-proximo", {
        equipe2Id: "e1",
        equipe2Nome: "Equipe 1",
      });
    });

    it("não deve preencher se ambas equipes já estão preenchidas", async () => {
      const confronto = criarConfronto({ proximoConfrontoId: "c-proximo" });
      const proximoConfronto = criarConfronto({
        id: "c-proximo",
        equipe1Id: "e3",
        equipe1Nome: "Equipe 3",
        equipe2Id: "e4",
        equipe2Nome: "Equipe 4",
      });
      mockConfrontoRepository.buscarPorId.mockResolvedValue(proximoConfronto);

      await service.preencherProximoConfronto(confronto, "e1", "Equipe 1");

      expect(mockConfrontoRepository.atualizar).not.toHaveBeenCalled();
    });
  });

  describe("extrairPosicaoDaOrigem (via verificarEPreencherFaseEliminatoria)", () => {
    it("deve extrair posição corretamente de '1º Grupo A'", async () => {
      mockConfrontoRepository.todosFinalizadosPorFase.mockResolvedValue(true);

      const equipes = [
        criarEquipe({ id: "e1", nome: "Equipe 1", grupoId: "A", pontos: 6 }),
        criarEquipe({ id: "e2", nome: "Equipe 2", grupoId: "B", pontos: 6 }),
      ];
      mockEquipeRepository.buscarPorEtapaOrdenadas.mockResolvedValue(equipes);

      const confrontos = [
        criarConfronto({
          id: "c1",
          fase: FaseEtapa.FINAL,
          equipe1Id: "",
          equipe1Nome: "",
          equipe2Id: "",
          equipe2Nome: "",
          equipe1Origem: "1º Grupo A",
          equipe2Origem: "1º Grupo B",
        }),
      ];
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue(confrontos);
      mockConfrontoRepository.atualizar.mockResolvedValue(undefined);

      await service.verificarEPreencherFaseEliminatoria(etapaId, arenaId);

      expect(mockConfrontoRepository.atualizar).toHaveBeenCalledWith("c1", {
        equipe1Id: "e1",
        equipe1Nome: "Equipe 1",
      });
    });

    it("deve extrair posição corretamente de '2º Grupo H'", async () => {
      mockConfrontoRepository.todosFinalizadosPorFase.mockResolvedValue(true);

      const equipes = [
        criarEquipe({ id: "e1", nome: "1-G", grupoId: "G", pontos: 6 }),
        criarEquipe({ id: "e2", nome: "2-G", grupoId: "G", pontos: 3 }),
        criarEquipe({ id: "e3", nome: "1-H", grupoId: "H", pontos: 6 }),
        criarEquipe({ id: "e4", nome: "2-H", grupoId: "H", pontos: 3 }),
      ];
      mockEquipeRepository.buscarPorEtapaOrdenadas.mockResolvedValue(equipes);

      const confrontos = [
        criarConfronto({
          id: "c1",
          fase: FaseEtapa.SEMIFINAL,
          equipe1Id: "",
          equipe1Nome: "",
          equipe2Id: "",
          equipe2Nome: "",
          equipe1Origem: "2º Grupo G",
          equipe2Origem: "2º Grupo H",
        }),
      ];
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue(confrontos);
      mockConfrontoRepository.atualizar.mockResolvedValue(undefined);

      await service.verificarEPreencherFaseEliminatoria(etapaId, arenaId);

      expect(mockConfrontoRepository.atualizar).toHaveBeenCalledWith("c1", {
        equipe1Id: "e2",
        equipe1Nome: "2-G",
      });
      expect(mockConfrontoRepository.atualizar).toHaveBeenCalledWith("c1", {
        equipe2Id: "e4",
        equipe2Nome: "2-H",
      });
    });

    it("não deve preencher se origem não é de grupo", async () => {
      mockConfrontoRepository.todosFinalizadosPorFase.mockResolvedValue(true);

      const equipes = [
        criarEquipe({ id: "e1", nome: "Equipe 1", grupoId: "A", pontos: 6 }),
        criarEquipe({ id: "e2", nome: "Equipe 2", grupoId: "B", pontos: 6 }),
      ];
      mockEquipeRepository.buscarPorEtapaOrdenadas.mockResolvedValue(equipes);

      // Origem não é de grupo (vem de outra fase)
      const confrontos = [
        criarConfronto({
          id: "c1",
          fase: FaseEtapa.FINAL,
          equipe1Id: "",
          equipe1Nome: "",
          equipe2Id: "",
          equipe2Nome: "",
          equipe1Origem: "Vencedor Semifinal 1",
          equipe2Origem: "Vencedor Semifinal 2",
        }),
      ];
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue(confrontos);

      await service.verificarEPreencherFaseEliminatoria(etapaId, arenaId);

      expect(mockConfrontoRepository.atualizar).not.toHaveBeenCalled();
    });
  });

  describe("processarBye (via verificarEPreencherFaseEliminatoria)", () => {
    it("não deve processar BYE se origem é inválida", async () => {
      mockConfrontoRepository.todosFinalizadosPorFase.mockResolvedValue(true);

      const equipes = [
        criarEquipe({ id: "e1", nome: "Equipe 1", grupoId: "A", pontos: 6 }),
        criarEquipe({ id: "e2", nome: "Equipe 2", grupoId: "B", pontos: 6 }),
      ];
      mockEquipeRepository.buscarPorEtapaOrdenadas.mockResolvedValue(equipes);

      const confrontosBye = [
        criarConfronto({
          id: "c-bye",
          fase: FaseEtapa.QUARTAS,
          isBye: true,
          equipe1Id: "",
          equipe1Nome: "",
          equipe2Id: "BYE",
          equipe2Nome: "BYE",
          equipe1Origem: "Origem Inválida", // Não segue padrão "Xº Grupo Y"
        }),
      ];
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue(confrontosBye);

      await service.verificarEPreencherFaseEliminatoria(etapaId, arenaId);

      expect(mockConfrontoRepository.atualizar).not.toHaveBeenCalled();
    });

    it("não deve processar BYE se equipe classificada não existe", async () => {
      mockConfrontoRepository.todosFinalizadosPorFase.mockResolvedValue(true);

      // Só temos grupos A e B, mas BYE espera grupo C
      const equipes = [
        criarEquipe({ id: "e1", nome: "Equipe 1", grupoId: "A", pontos: 6 }),
        criarEquipe({ id: "e2", nome: "Equipe 2", grupoId: "B", pontos: 6 }),
      ];
      mockEquipeRepository.buscarPorEtapaOrdenadas.mockResolvedValue(equipes);

      const confrontosBye = [
        criarConfronto({
          id: "c-bye",
          fase: FaseEtapa.QUARTAS,
          isBye: true,
          equipe1Id: "",
          equipe1Nome: "",
          equipe2Id: "BYE",
          equipe2Nome: "BYE",
          equipe1Origem: "1º Grupo C", // Grupo C não existe
        }),
      ];
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue(confrontosBye);

      await service.verificarEPreencherFaseEliminatoria(etapaId, arenaId);

      expect(mockConfrontoRepository.atualizar).not.toHaveBeenCalled();
    });

    it("deve propagar vencedor do BYE para próximo confronto", async () => {
      mockConfrontoRepository.todosFinalizadosPorFase.mockResolvedValue(true);

      const equipes = [
        criarEquipe({ id: "e1", nome: "Equipe 1", grupoId: "A", pontos: 6 }),
        criarEquipe({ id: "e2", nome: "Equipe 2", grupoId: "B", pontos: 6 }),
      ];
      mockEquipeRepository.buscarPorEtapaOrdenadas.mockResolvedValue(equipes);

      const confrontosBye = [
        criarConfronto({
          id: "c-bye",
          fase: FaseEtapa.QUARTAS,
          isBye: true,
          equipe1Id: "",
          equipe1Nome: "",
          equipe2Id: "BYE",
          equipe2Nome: "BYE",
          equipe1Origem: "1º Grupo A",
          proximoConfrontoId: "c-semi",
        }),
      ];
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue(confrontosBye);
      mockConfrontoRepository.atualizar.mockResolvedValue(undefined);
      mockConfrontoRepository.buscarPorId.mockResolvedValue(
        criarConfronto({
          id: "c-semi",
          fase: FaseEtapa.SEMIFINAL,
          equipe1Id: "",
          equipe1Nome: "",
        })
      );

      await service.verificarEPreencherFaseEliminatoria(etapaId, arenaId);

      // Deve preencher próximo confronto com vencedor do BYE
      expect(mockConfrontoRepository.buscarPorId).toHaveBeenCalledWith("c-semi");
      expect(mockConfrontoRepository.atualizar).toHaveBeenCalledWith("c-semi", {
        equipe1Id: "e1",
        equipe1Nome: "Equipe 1",
      });
    });
  });

  describe("cenários de integração", () => {
    it("deve lidar com grupos com apenas 1 equipe", async () => {
      mockConfrontoRepository.todosFinalizadosPorFase.mockResolvedValue(true);

      // Grupo A tem 1 equipe, Grupo B tem 2
      const equipes = [
        criarEquipe({ id: "e1", nome: "Sozinha", grupoId: "A", pontos: 0 }),
        criarEquipe({ id: "e2", nome: "Primeira", grupoId: "B", pontos: 6 }),
        criarEquipe({ id: "e3", nome: "Segunda", grupoId: "B", pontos: 3 }),
      ];
      mockEquipeRepository.buscarPorEtapaOrdenadas.mockResolvedValue(equipes);

      const confrontos = [
        criarConfronto({
          id: "c1",
          fase: FaseEtapa.FINAL,
          equipe1Id: "",
          equipe1Nome: "",
          equipe2Id: "",
          equipe2Nome: "",
          equipe1Origem: "1º Grupo A",
          equipe2Origem: "2º Grupo A", // Não existe segundo no grupo A
        }),
      ];
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue(confrontos);
      mockConfrontoRepository.atualizar.mockResolvedValue(undefined);

      await service.verificarEPreencherFaseEliminatoria(etapaId, arenaId);

      // Deve preencher equipe1
      expect(mockConfrontoRepository.atualizar).toHaveBeenCalledWith("c1", {
        equipe1Id: "e1",
        equipe1Nome: "Sozinha",
      });
      // Não deve preencher equipe2 (2º do grupo A não existe)
      expect(mockConfrontoRepository.atualizar).not.toHaveBeenCalledWith("c1",
        expect.objectContaining({ equipe2Id: expect.any(String) })
      );
    });

    it("deve processar múltiplos confrontos em sequência", async () => {
      mockConfrontoRepository.todosFinalizadosPorFase.mockResolvedValue(true);

      const equipes = [
        criarEquipe({ id: "e1", nome: "1A", grupoId: "A", pontos: 6 }),
        criarEquipe({ id: "e2", nome: "2A", grupoId: "A", pontos: 3 }),
        criarEquipe({ id: "e3", nome: "1B", grupoId: "B", pontos: 6 }),
        criarEquipe({ id: "e4", nome: "2B", grupoId: "B", pontos: 3 }),
      ];
      mockEquipeRepository.buscarPorEtapaOrdenadas.mockResolvedValue(equipes);

      // Dois confrontos de semifinal
      const confrontos = [
        criarConfronto({
          id: "semi1",
          fase: FaseEtapa.SEMIFINAL,
          equipe1Id: "",
          equipe1Nome: "",
          equipe2Id: "",
          equipe2Nome: "",
          equipe1Origem: "1º Grupo A",
          equipe2Origem: "2º Grupo B",
        }),
        criarConfronto({
          id: "semi2",
          fase: FaseEtapa.SEMIFINAL,
          equipe1Id: "",
          equipe1Nome: "",
          equipe2Id: "",
          equipe2Nome: "",
          equipe1Origem: "1º Grupo B",
          equipe2Origem: "2º Grupo A",
        }),
      ];
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue(confrontos);
      mockConfrontoRepository.atualizar.mockResolvedValue(undefined);

      await service.verificarEPreencherFaseEliminatoria(etapaId, arenaId);

      // Verificar que ambos confrontos foram preenchidos
      expect(mockConfrontoRepository.atualizar).toHaveBeenCalledTimes(4);

      // Semi 1: 1A vs 2B
      expect(mockConfrontoRepository.atualizar).toHaveBeenCalledWith("semi1", {
        equipe1Id: "e1",
        equipe1Nome: "1A",
      });
      expect(mockConfrontoRepository.atualizar).toHaveBeenCalledWith("semi1", {
        equipe2Id: "e4",
        equipe2Nome: "2B",
      });

      // Semi 2: 1B vs 2A
      expect(mockConfrontoRepository.atualizar).toHaveBeenCalledWith("semi2", {
        equipe1Id: "e3",
        equipe1Nome: "1B",
      });
      expect(mockConfrontoRepository.atualizar).toHaveBeenCalledWith("semi2", {
        equipe2Id: "e2",
        equipe2Nome: "2A",
      });
    });
  });
});
