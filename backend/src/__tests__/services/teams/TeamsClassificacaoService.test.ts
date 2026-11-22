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
import {
  createMockDesempateService,
  comoDesempateService,
  MockDesempateService,
} from "../../mocks/desempateService";

describe("TeamsClassificacaoService", () => {
  let service: TeamsClassificacaoService;
  let mockEquipeRepository: ReturnType<typeof createMockEquipeRepository>;
  let mockConfrontoRepository: ReturnType<typeof createMockConfrontoEquipeRepository>;
  let mockDesempate: MockDesempateService;

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

    mockDesempate = createMockDesempateService();
    // Sem confrontos na fase: vaga do próximo confronto cai no fallback
    mockConfrontoRepository.buscarPorFase.mockResolvedValue([]);

    service = new TeamsClassificacaoService(
      mockConfrontoRepository,
      mockEquipeRepository,
      comoDesempateService(mockDesempate)
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
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue([]);

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
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue([]);

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
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue([]);

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
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue([]);

      const resultado = await service.recalcularClassificacao(etapaId, arenaId);

      expect(resultado[0].nome).toBe("Equipe 2"); // 25 games
      expect(resultado[1].nome).toBe("Equipe 1"); // 20 games
      expect(resultado[2].nome).toBe("Equipe 3"); // 15 games
    });

    it("não deve sortear automaticamente quando todos os critérios são iguais", async () => {
      const equipes = [
        criarEquipe({ id: "e1", nome: "Zebra", pontos: 6, saldoJogos: 2, saldoGames: 10, gamesVencidos: 20 }),
        criarEquipe({ id: "e2", nome: "Alpha", pontos: 6, saldoJogos: 2, saldoGames: 10, gamesVencidos: 20 }),
        criarEquipe({ id: "e3", nome: "Beta", pontos: 6, saldoJogos: 2, saldoGames: 10, gamesVencidos: 20 }),
      ];

      mockEquipeRepository.buscarPorEtapa.mockResolvedValue(equipes);
      mockEquipeRepository.atualizarPosicoesEmLote.mockResolvedValue(undefined);
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue([]);

      const resultado = await service.recalcularClassificacao(etapaId, arenaId);

      // Ordem estável até o admin decidir (sorteio ou manual)
      expect(resultado.map((e) => e.id)).toEqual(["e1", "e2", "e3"]);
      const params = mockDesempate.classificarGrupo.mock.calls[0][0];
      expect(params.comparar(equipes[0], equipes[1])).toBe(0);
    });

    it("deve classificar cada grupo separadamente e informar se o grupo terminou", async () => {
      const equipes = [
        criarEquipe({ id: "a1", nome: "A1", grupoId: "A", grupoNome: "Grupo A", pontos: 3 }),
        criarEquipe({ id: "a2", nome: "A2", grupoId: "A", grupoNome: "Grupo A", pontos: 3 }),
        criarEquipe({ id: "b1", nome: "B1", grupoId: "B", grupoNome: "Grupo B", pontos: 3 }),
        criarEquipe({ id: "b2", nome: "B2", grupoId: "B", grupoNome: "Grupo B", pontos: 0 }),
      ];
      const confrontos = [
        criarConfronto({ id: "ca", grupoId: "A", equipe1Id: "a1", equipe2Id: "a2", status: StatusConfronto.FINALIZADO }),
        criarConfronto({ id: "cb", grupoId: "B", equipe1Id: "b1", equipe2Id: "b2", status: StatusConfronto.AGENDADO }),
      ];

      mockEquipeRepository.buscarPorEtapa.mockResolvedValue(equipes);
      mockEquipeRepository.atualizarPosicoesEmLote.mockResolvedValue(undefined);
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue(confrontos);

      await service.recalcularClassificacao(etapaId, arenaId);

      expect(mockDesempate.classificarGrupo).toHaveBeenCalledTimes(2);
      expect(mockDesempate.classificarGrupo).toHaveBeenCalledWith(
        expect.objectContaining({ grupoId: "A", grupoNome: "Grupo A", grupoCompleto: true, atualizarPendencias: true })
      );
      expect(mockDesempate.classificarGrupo).toHaveBeenCalledWith(
        expect.objectContaining({ grupoId: "B", grupoNome: "Grupo B", grupoCompleto: false })
      );
    });

    it("não deve atualizar pendências depois que a eliminatória foi preenchida", async () => {
      const equipes = [
        criarEquipe({ id: "a1", nome: "A1", grupoId: "A" }),
        criarEquipe({ id: "a2", nome: "A2", grupoId: "A" }),
      ];
      const confrontos = [
        criarConfronto({ id: "ca", grupoId: "A", equipe1Id: "a1", equipe2Id: "a2", status: StatusConfronto.FINALIZADO }),
        criarConfronto({ id: "final", fase: FaseEtapa.FINAL, equipe1Id: "a1", equipe2Id: "" }),
      ];

      mockEquipeRepository.buscarPorEtapa.mockResolvedValue(equipes);
      mockEquipeRepository.atualizarPosicoesEmLote.mockResolvedValue(undefined);
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue(confrontos);

      await service.recalcularClassificacao(etapaId, arenaId);

      expect(mockDesempate.classificarGrupo).toHaveBeenCalledWith(
        expect.objectContaining({ grupoId: "A", atualizarPendencias: false })
      );
    });

    it("deve aplicar a ordem definida no desempate", async () => {
      const equipes = [
        criarEquipe({ id: "e1", nome: "Equipe 1" }),
        criarEquipe({ id: "e2", nome: "Equipe 2" }),
      ];

      mockEquipeRepository.buscarPorEtapa.mockResolvedValue(equipes);
      mockEquipeRepository.atualizarPosicoesEmLote.mockResolvedValue(undefined);
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue([]);
      mockDesempate.classificarGrupo.mockResolvedValueOnce([equipes[1], equipes[0]]);

      const resultado = await service.recalcularClassificacao(etapaId, arenaId);

      expect(resultado.map((e) => e.id)).toEqual(["e2", "e1"]);
    });

    it("deve atualizar posições em lote", async () => {
      const equipes = [
        criarEquipe({ id: "e1", nome: "Equipe 1", pontos: 3 }),
        criarEquipe({ id: "e2", nome: "Equipe 2", pontos: 6 }),
      ];

      mockEquipeRepository.buscarPorEtapa.mockResolvedValue(equipes);
      mockEquipeRepository.atualizarPosicoesEmLote.mockResolvedValue(undefined);
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue([]);

      await service.recalcularClassificacao(etapaId, arenaId);

      expect(mockEquipeRepository.atualizarPosicoesEmLote).toHaveBeenCalledWith([
        { id: "e2", posicao: 1 },
        { id: "e1", posicao: 2 },
      ]);
    });

    it("deve retornar lista vazia se não houver equipes", async () => {
      mockEquipeRepository.buscarPorEtapa.mockResolvedValue([]);
      mockEquipeRepository.atualizarPosicoesEmLote.mockResolvedValue(undefined);
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue([]);

      const resultado = await service.recalcularClassificacao(etapaId, arenaId);

      expect(resultado).toEqual([]);
    });
  });

  describe("gerarFaseEliminatoria", () => {
    const grupoFinalizado = criarConfronto({ id: "g1", grupoId: "A", status: StatusConfronto.FINALIZADO });
    const semiVazia = criarConfronto({
      id: "s1", fase: FaseEtapa.SEMIFINAL, equipe1Id: "", equipe2Id: "",
      equipe1Origem: "1º Grupo A", equipe2Origem: "2º Grupo B",
    });

    it("deve recusar se ainda há confrontos de grupo pendentes", async () => {
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue([
        grupoFinalizado,
        criarConfronto({ id: "g2", grupoId: "A", status: StatusConfronto.AGENDADO }),
        semiVazia,
      ]);

      await expect(service.gerarFaseEliminatoria(etapaId, arenaId)).rejects.toThrow(
        "ainda há 1 confronto(s) pendente(s)"
      );
    });

    it("deve recusar se a eliminatória já foi gerada", async () => {
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue([
        grupoFinalizado,
        { ...semiVazia, equipe1Id: "e1" },
      ]);

      await expect(service.gerarFaseEliminatoria(etapaId, arenaId)).rejects.toThrow(
        "já foi gerada"
      );
    });

    it("deve recusar com empate pendente", async () => {
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue([grupoFinalizado, semiVazia]);
      mockDesempate.garantirSemEmpatesPendentes.mockRejectedValueOnce(
        new Error("Não é possível gerar a fase eliminatória: há empate pendente em Grupo A.")
      );

      await expect(service.gerarFaseEliminatoria(etapaId, arenaId)).rejects.toThrow(
        "empate pendente"
      );
      expect(mockConfrontoRepository.atualizar).not.toHaveBeenCalled();
    });

    it("deve preencher as vagas com a classificação", async () => {
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue([grupoFinalizado, semiVazia]);
      mockConfrontoRepository.todosFinalizadosPorFase.mockResolvedValue(true);
      mockEquipeRepository.buscarPorEtapaOrdenadas.mockResolvedValue([
        criarEquipe({ id: "a1", nome: "A1", grupoId: "A", posicao: 1 }),
        criarEquipe({ id: "a2", nome: "A2", grupoId: "A", posicao: 2 }),
        criarEquipe({ id: "b1", nome: "B1", grupoId: "B", posicao: 1 }),
        criarEquipe({ id: "b2", nome: "B2", grupoId: "B", posicao: 2 }),
        criarEquipe({ id: "b3", nome: "B3", grupoId: "B", posicao: 3 }),
      ]);
      mockConfrontoRepository.atualizar.mockResolvedValue(undefined);

      await service.gerarFaseEliminatoria(etapaId, arenaId);

      const classificadas = mockEquipeRepository.atualizarEmLote.mock.calls[0][0]
        .filter((e: any) => e.dados.classificada)
        .map((e: any) => e.id);
      expect(classificadas).toEqual(["a1", "a2", "b1", "b2"]);

      expect(mockConfrontoRepository.atualizar).toHaveBeenCalledWith("s1", {
        equipe1Id: "a1",
        equipe1Nome: "A1",
      });
      expect(mockConfrontoRepository.atualizar).toHaveBeenCalledWith("s1", {
        equipe2Id: "b2",
        equipe2Nome: "B2",
      });
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

    it("não deve preencher enquanto houver empate pendente", async () => {
      mockConfrontoRepository.todosFinalizadosPorFase.mockResolvedValue(true);
      mockDesempate.listarPendentes.mockResolvedValueOnce([
        { grupoId: "A", grupoNome: "Grupo A", posicaoInicial: 2, participantes: [] },
      ]);

      await service.verificarEPreencherFaseEliminatoria(etapaId, arenaId);

      expect(mockEquipeRepository.buscarPorEtapaOrdenadas).not.toHaveBeenCalled();
      expect(mockConfrontoRepository.atualizar).not.toHaveBeenCalled();
    });

    it("deve ordenar equipes dentro do grupo pela posição calculada", async () => {
      mockConfrontoRepository.todosFinalizadosPorFase.mockResolvedValue(true);

      // posicao vem de recalcularClassificacao (critérios + desempate do admin)
      const equipes = [
        criarEquipe({ id: "e1", nome: "A", grupoId: "A", posicao: 2 }),
        criarEquipe({ id: "e2", nome: "B", grupoId: "A", posicao: 1 }),
        criarEquipe({ id: "e3", nome: "C", grupoId: "B", posicao: 4 }),
        criarEquipe({ id: "e4", nome: "D", grupoId: "B", posicao: 3 }),
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

      // e2 deve ser 1º do grupo A
      expect(mockConfrontoRepository.atualizar).toHaveBeenCalledWith("c1", {
        equipe1Id: "e2",
        equipe1Nome: "B",
      });
      // e4 deve ser 1º do grupo B
      expect(mockConfrontoRepository.atualizar).toHaveBeenCalledWith("c1", {
        equipe2Id: "e4",
        equipe2Nome: "D",
      });
    });
  });

  describe("preencherProximoConfronto - vaga pela origem", () => {
    // Semifinais: S1 (ordem 13) e S2 (ordem 14) alimentam a final
    const s1 = criarConfronto({ id: "s1", fase: FaseEtapa.SEMIFINAL, ordem: 13, proximoConfrontoId: "final" });
    const s2 = criarConfronto({ id: "s2", fase: FaseEtapa.SEMIFINAL, ordem: 14, proximoConfrontoId: "final" });

    beforeEach(() => {
      mockConfrontoRepository.buscarPorFase.mockResolvedValue([s2, s1]);
      mockConfrontoRepository.atualizar.mockResolvedValue(undefined);
    });

    it("vencedor da Semifinal 2 vai para a vaga 2 mesmo terminando primeiro", async () => {
      mockConfrontoRepository.buscarPorId.mockResolvedValue(
        criarConfronto({
          id: "final", fase: FaseEtapa.FINAL, equipe1Id: "", equipe2Id: "",
          equipe1Origem: "Vencedor Semifinal 1", equipe2Origem: "Vencedor Semifinal 2",
        })
      );

      await service.preencherProximoConfronto(s2, "e9", "Equipe 9");

      expect(mockConfrontoRepository.atualizar).toHaveBeenCalledWith("final", {
        equipe2Id: "e9",
        equipe2Nome: "Equipe 9",
      });
    });

    it("sobrescreve a vaga quando o vencedor muda (edição)", async () => {
      mockConfrontoRepository.buscarPorId.mockResolvedValue(
        criarConfronto({
          id: "final", fase: FaseEtapa.FINAL, equipe1Id: "antiga", equipe2Id: "",
          equipe1Origem: "Vencedor Semifinal 1", equipe2Origem: "Vencedor Semifinal 2",
        })
      );

      await service.preencherProximoConfronto(s1, "nova", "Nova");

      expect(mockConfrontoRepository.atualizar).toHaveBeenCalledWith("final", {
        equipe1Id: "nova",
        equipe1Nome: "Nova",
      });
    });

    it("quartas também alimentam a semifinal pela origem", async () => {
      const quartas = [1, 2, 3, 4].map((n) =>
        criarConfronto({ id: `q${n}`, fase: FaseEtapa.QUARTAS, ordem: 8 + n, proximoConfrontoId: "s2" })
      );
      mockConfrontoRepository.buscarPorFase.mockResolvedValue(quartas);
      mockConfrontoRepository.buscarPorId.mockResolvedValue(
        criarConfronto({
          id: "s2", fase: FaseEtapa.SEMIFINAL, equipe1Id: "", equipe2Id: "",
          equipe1Origem: "Vencedor Quartas 3", equipe2Origem: "Vencedor Quartas 4",
        })
      );

      await service.preencherProximoConfronto(quartas[3], "e4", "Equipe 4");

      expect(mockConfrontoRepository.atualizar).toHaveBeenCalledWith("s2", {
        equipe2Id: "e4",
        equipe2Nome: "Equipe 4",
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

  describe("confronto direto", () => {
    const direto = (dados: object) =>
      (service as any).verificarConfrontoDireto(
        [{ equipe1Id: "e1", equipe2Id: "e2", vencedoraId: "e1", ...dados }],
        "e2",
        "e1"
      );

    it("vale o vencedor do confronto encerrado", () => {
      expect(direto({ status: "finalizado" })).toBe("e1");
    });

    it("ignora vencedor antigo de confronto reaberto", () => {
      expect(direto({ status: "em_andamento" })).toBeNull();
    });

    it("sem confronto entre as duas, não desempata", () => {
      expect(direto({ equipe2Id: "e9", status: "finalizado" })).toBeNull();
    });
  });
});
