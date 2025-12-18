/**
 * Testes para Strategies de Eliminatória (5-8 grupos)
 *
 * Cada strategy gera a estrutura completa de:
 * - Oitavas de final (com BYEs quando necessário)
 * - Quartas de final
 * - Semifinais
 * - Final
 */

import { Eliminatoria2GruposStrategy } from "../../../../services/teams/strategies/Eliminatoria2GruposStrategy";
import { Eliminatoria3GruposStrategy } from "../../../../services/teams/strategies/Eliminatoria3GruposStrategy";
import { Eliminatoria4GruposStrategy } from "../../../../services/teams/strategies/Eliminatoria4GruposStrategy";
import { Eliminatoria5GruposStrategy } from "../../../../services/teams/strategies/Eliminatoria5GruposStrategy";
import { Eliminatoria6GruposStrategy } from "../../../../services/teams/strategies/Eliminatoria6GruposStrategy";
import { Eliminatoria7GruposStrategy } from "../../../../services/teams/strategies/Eliminatoria7GruposStrategy";
import { Eliminatoria8GruposStrategy } from "../../../../services/teams/strategies/Eliminatoria8GruposStrategy";
import {
  EliminatoriaContext,
  BaseEliminatoriaStrategy,
} from "../../../../services/teams/strategies/IEliminatoriaStrategy";
import { createMockConfrontoEquipeRepository } from "../../../mocks/repositories";
import { Etapa, FaseEtapa, FormatoEtapa, StatusEtapa } from "../../../../models/Etapa";
import { TipoFormacaoJogos, ConfrontoEquipe, StatusConfronto } from "../../../../models/Teams";

describe("EliminatoriaStrategies", () => {
  let mockConfrontoRepository: ReturnType<typeof createMockConfrontoEquipeRepository>;
  let confrontoIdCounter: number;

  // Criar etapa mock
  function criarEtapaMock(): Etapa {
    return {
      id: "etapa-1",
      arenaId: "arena-1",
      nome: "Etapa Teste",
      formato: FormatoEtapa.TEAMS,
      status: StatusEtapa.EM_ANDAMENTO,
      genero: "misto" as any,
      dataInicio: "2024-01-01T00:00:00Z",
      dataFim: "2024-01-31T00:00:00Z",
      dataRealizacao: "2024-01-15T00:00:00Z",
      maxJogadores: 32,
      jogadoresPorGrupo: 4,
      faseAtual: FaseEtapa.GRUPOS,
      totalInscritos: 0,
      jogadoresInscritos: [],
      chavesGeradas: false,
      contaPontosRanking: true,
      criadoEm: "2024-01-01T00:00:00Z",
      atualizadoEm: "2024-01-01T00:00:00Z",
      criadoPor: "user-1",
    } as Etapa;
  }

  // Helper para criar confronto mock a partir do DTO
  function criarConfrontoMock(dto: any): ConfrontoEquipe {
    confrontoIdCounter++;
    return {
      id: `confronto-${confrontoIdCounter}`,
      etapaId: dto.etapaId,
      arenaId: dto.arenaId,
      fase: dto.fase,
      ordem: dto.ordem,
      equipe1Id: dto.equipe1Id || "",
      equipe1Nome: dto.equipe1Nome || "",
      equipe2Id: dto.equipe2Id || "",
      equipe2Nome: dto.equipe2Nome || "",
      equipe1Origem: dto.equipe1Origem,
      equipe2Origem: dto.equipe2Origem,
      proximoConfrontoId: dto.proximoConfrontoId,
      isBye: dto.isBye || false,
      status: StatusConfronto.AGENDADO,
      jogosEquipe1: 0,
      jogosEquipe2: 0,
      partidas: [],
      totalPartidas: 2,
      partidasFinalizadas: 0,
      temDecider: false,
      tipoFormacaoJogos: dto.tipoFormacaoJogos,
      criadoEm: "2024-01-01T00:00:00Z",
      atualizadoEm: "2024-01-01T00:00:00Z",
    };
  }

  beforeEach(() => {
    confrontoIdCounter = 0;
    mockConfrontoRepository = createMockConfrontoEquipeRepository();

    // Mock criarEmLote para retornar array de confrontos (funciona para 1 ou mais)
    mockConfrontoRepository.criarEmLote.mockImplementation(async (dtos: any[]) => {
      return dtos.map((dto: any) => criarConfrontoMock(dto));
    });
  });

  describe("Eliminatoria2GruposStrategy", () => {
    let strategy: Eliminatoria2GruposStrategy;

    beforeEach(() => {
      strategy = new Eliminatoria2GruposStrategy();
    });

    it("deve ter numGrupos = 2", () => {
      expect(strategy.numGrupos).toBe(2);
    });

    it("deve gerar estrutura completa (semis + final)", async () => {
      const context: EliminatoriaContext = {
        etapa: criarEtapaMock(),
        grupos: ["A", "B"],
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        confrontoRepository: mockConfrontoRepository,
      };

      const confrontos = await strategy.gerar(context);

      // 2 semis + 1 final = 3
      expect(confrontos.length).toBe(3);
    });

    it("deve criar semifinais com 1A x 2B e 1B x 2A", async () => {
      const context: EliminatoriaContext = {
        etapa: criarEtapaMock(),
        grupos: ["A", "B"],
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        confrontoRepository: mockConfrontoRepository,
      };

      await strategy.gerar(context);

      // Verificar chamadas - [0]=final, [1]=semis
      const semisCall = mockConfrontoRepository.criarEmLote.mock.calls[1];
      const semis = semisCall[0];

      expect(semis.length).toBe(2);

      // 1A x 2B
      const semi1 = semis.find(
        (c: any) => c.equipe1Origem === "1º Grupo A" && c.equipe2Origem === "2º Grupo B"
      );
      expect(semi1).toBeDefined();

      // 1B x 2A
      const semi2 = semis.find(
        (c: any) => c.equipe1Origem === "1º Grupo B" && c.equipe2Origem === "2º Grupo A"
      );
      expect(semi2).toBeDefined();
    });

    it("deve conectar semifinais à final", async () => {
      const context: EliminatoriaContext = {
        etapa: criarEtapaMock(),
        grupos: ["A", "B"],
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        confrontoRepository: mockConfrontoRepository,
      };

      const confrontos = await strategy.gerar(context);

      const final = confrontos.find((c) => c.fase === FaseEtapa.FINAL);
      const semis = confrontos.filter((c) => c.fase === FaseEtapa.SEMIFINAL);

      semis.forEach((semi) => {
        expect(semi.proximoConfrontoId).toBe(final?.id);
      });
    });
  });

  describe("Eliminatoria3GruposStrategy", () => {
    let strategy: Eliminatoria3GruposStrategy;

    beforeEach(() => {
      strategy = new Eliminatoria3GruposStrategy();
    });

    it("deve ter numGrupos = 3", () => {
      expect(strategy.numGrupos).toBe(3);
    });

    it("deve gerar estrutura completa (quartas + semis + final)", async () => {
      const context: EliminatoriaContext = {
        etapa: criarEtapaMock(),
        grupos: ["A", "B", "C"],
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        confrontoRepository: mockConfrontoRepository,
      };

      const confrontos = await strategy.gerar(context);

      // 4 quartas + 2 semis + 1 final = 7
      expect(confrontos.length).toBe(7);
    });

    it("deve criar quartas com BYEs para 1A e 1B", async () => {
      const context: EliminatoriaContext = {
        etapa: criarEtapaMock(),
        grupos: ["A", "B", "C"],
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        confrontoRepository: mockConfrontoRepository,
      };

      await strategy.gerar(context);

      // [0]=final, [1]=semis, [2]=quartas
      const quartasCall = mockConfrontoRepository.criarEmLote.mock.calls[2];
      const quartas = quartasCall[0];

      expect(quartas.length).toBe(4);

      // BYEs para 1A e 1B
      const byes = quartas.filter((c: any) => c.isBye === true);
      expect(byes.length).toBe(2);

      const origensComBye = byes.map((c: any) => c.equipe1Origem);
      expect(origensComBye).toContain("1º Grupo A");
      expect(origensComBye).toContain("1º Grupo B");
    });
  });

  describe("Eliminatoria4GruposStrategy", () => {
    let strategy: Eliminatoria4GruposStrategy;

    beforeEach(() => {
      strategy = new Eliminatoria4GruposStrategy();
    });

    it("deve ter numGrupos = 4", () => {
      expect(strategy.numGrupos).toBe(4);
    });

    it("deve gerar estrutura completa (quartas + semis + final)", async () => {
      const context: EliminatoriaContext = {
        etapa: criarEtapaMock(),
        grupos: ["A", "B", "C", "D"],
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        confrontoRepository: mockConfrontoRepository,
      };

      const confrontos = await strategy.gerar(context);

      // 4 quartas + 2 semis + 1 final = 7
      expect(confrontos.length).toBe(7);
    });

    it("deve criar 4 quartas sem BYEs", async () => {
      const context: EliminatoriaContext = {
        etapa: criarEtapaMock(),
        grupos: ["A", "B", "C", "D"],
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        confrontoRepository: mockConfrontoRepository,
      };

      await strategy.gerar(context);

      // [0]=final, [1]=semis, [2]=quartas
      const quartasCall = mockConfrontoRepository.criarEmLote.mock.calls[2];
      const quartas = quartasCall[0];

      expect(quartas.length).toBe(4);

      // Nenhum BYE para 4 grupos
      const byes = quartas.filter((c: any) => c.isBye === true);
      expect(byes.length).toBe(0);
    });

    it("deve criar confrontos 1º vs 2º cruzados", async () => {
      const context: EliminatoriaContext = {
        etapa: criarEtapaMock(),
        grupos: ["A", "B", "C", "D"],
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        confrontoRepository: mockConfrontoRepository,
      };

      await strategy.gerar(context);

      const quartasCall = mockConfrontoRepository.criarEmLote.mock.calls[2];
      const quartas = quartasCall[0];

      // 1A x 2B
      const confronto1Avs2B = quartas.find(
        (c: any) => c.equipe1Origem === "1º Grupo A" && c.equipe2Origem === "2º Grupo B"
      );
      expect(confronto1Avs2B).toBeDefined();

      // 1B x 2A
      const confronto1Bvs2A = quartas.find(
        (c: any) => c.equipe1Origem === "1º Grupo B" && c.equipe2Origem === "2º Grupo A"
      );
      expect(confronto1Bvs2A).toBeDefined();

      // 1C x 2D
      const confronto1Cvs2D = quartas.find(
        (c: any) => c.equipe1Origem === "1º Grupo C" && c.equipe2Origem === "2º Grupo D"
      );
      expect(confronto1Cvs2D).toBeDefined();

      // 1D x 2C
      const confronto1Dvs2C = quartas.find(
        (c: any) => c.equipe1Origem === "1º Grupo D" && c.equipe2Origem === "2º Grupo C"
      );
      expect(confronto1Dvs2C).toBeDefined();
    });
  });

  describe("Eliminatoria5GruposStrategy", () => {
    let strategy: Eliminatoria5GruposStrategy;

    beforeEach(() => {
      strategy = new Eliminatoria5GruposStrategy();
    });

    it("deve ter numGrupos = 5", () => {
      expect(strategy.numGrupos).toBe(5);
    });

    it("deve gerar estrutura completa com 6 BYEs", async () => {
      const context: EliminatoriaContext = {
        etapa: criarEtapaMock(),
        grupos: ["A", "B", "C", "D", "E"],
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        confrontoRepository: mockConfrontoRepository,
      };

      const confrontos = await strategy.gerar(context);

      // 8 oitavas + 4 quartas + 2 semis + 1 final = 15
      expect(confrontos.length).toBe(15);

      // Verificar que criarEmLote foi chamado 4 vezes (final, semis, quartas, oitavas)
      expect(mockConfrontoRepository.criarEmLote).toHaveBeenCalledTimes(4);
    });

    it("deve criar oitavas com BYEs para 1º colocados", async () => {
      const context: EliminatoriaContext = {
        etapa: criarEtapaMock(),
        grupos: ["A", "B", "C", "D", "E"],
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        confrontoRepository: mockConfrontoRepository,
      };

      await strategy.gerar(context);

      // Verificar chamadas do criarEmLote para oitavas
      // Ordem: [0]=final, [1]=semis, [2]=quartas, [3]=oitavas
      const oitavasCall = mockConfrontoRepository.criarEmLote.mock.calls[3];
      const oitavas = oitavasCall[0];

      // Verificar BYEs
      const byes = oitavas.filter((c: any) => c.isBye === true);
      expect(byes.length).toBe(6);

      // Verificar origens dos BYEs (1º de cada grupo + 2A)
      const origensComBye = byes.map((c: any) => c.equipe1Origem);
      expect(origensComBye).toContain("1º Grupo A");
      expect(origensComBye).toContain("1º Grupo B");
      expect(origensComBye).toContain("1º Grupo C");
      expect(origensComBye).toContain("1º Grupo D");
      expect(origensComBye).toContain("1º Grupo E");
      expect(origensComBye).toContain("2º Grupo A");
    });

    it("deve criar confrontos entre 2º colocados", async () => {
      const context: EliminatoriaContext = {
        etapa: criarEtapaMock(),
        grupos: ["A", "B", "C", "D", "E"],
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        confrontoRepository: mockConfrontoRepository,
      };

      await strategy.gerar(context);

      // Ordem: [0]=final, [1]=semis, [2]=quartas, [3]=oitavas
      const oitavasCall = mockConfrontoRepository.criarEmLote.mock.calls[3];
      const oitavas = oitavasCall[0];

      // Verificar confrontos sem BYE (2º vs 2º)
      const semBye = oitavas.filter((c: any) => !c.isBye);
      expect(semBye.length).toBe(2);

      // O7: 2B x 2C
      const confronto2Bvs2C = semBye.find(
        (c: any) => c.equipe1Origem === "2º Grupo B" && c.equipe2Origem === "2º Grupo C"
      );
      expect(confronto2Bvs2C).toBeDefined();

      // O8: 2D x 2E
      const confronto2Dvs2E = semBye.find(
        (c: any) => c.equipe1Origem === "2º Grupo D" && c.equipe2Origem === "2º Grupo E"
      );
      expect(confronto2Dvs2E).toBeDefined();
    });

    it("deve conectar oitavas às quartas corretamente", async () => {
      const context: EliminatoriaContext = {
        etapa: criarEtapaMock(),
        grupos: ["A", "B", "C", "D", "E"],
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        confrontoRepository: mockConfrontoRepository,
      };

      const confrontos = await strategy.gerar(context);

      // Todas as oitavas devem ter proximoConfrontoId
      const oitavas = confrontos.filter((c) => c.fase === FaseEtapa.OITAVAS);
      expect(oitavas.every((c) => c.proximoConfrontoId)).toBe(true);
    });

    it("deve usar TipoFormacaoJogos correto", async () => {
      const context: EliminatoriaContext = {
        etapa: criarEtapaMock(),
        grupos: ["A", "B", "C", "D", "E"],
        tipoFormacaoJogos: TipoFormacaoJogos.MANUAL,
        confrontoRepository: mockConfrontoRepository,
      };

      await strategy.gerar(context);

      // Verificar que todos os DTOs usam MANUAL (primeiro criarEmLote é a final)
      const finalCall = mockConfrontoRepository.criarEmLote.mock.calls[0][0][0];
      expect(finalCall.tipoFormacaoJogos).toBe(TipoFormacaoJogos.MANUAL);
    });
  });

  describe("Eliminatoria6GruposStrategy", () => {
    let strategy: Eliminatoria6GruposStrategy;

    beforeEach(() => {
      strategy = new Eliminatoria6GruposStrategy();
    });

    it("deve ter numGrupos = 6", () => {
      expect(strategy.numGrupos).toBe(6);
    });

    it("deve gerar estrutura completa com 4 BYEs", async () => {
      const context: EliminatoriaContext = {
        etapa: criarEtapaMock(),
        grupos: ["A", "B", "C", "D", "E", "F"],
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        confrontoRepository: mockConfrontoRepository,
      };

      const confrontos = await strategy.gerar(context);

      expect(confrontos.length).toBe(15);
    });

    it("deve criar 4 BYEs para 1º de A, B, C, D", async () => {
      const context: EliminatoriaContext = {
        etapa: criarEtapaMock(),
        grupos: ["A", "B", "C", "D", "E", "F"],
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        confrontoRepository: mockConfrontoRepository,
      };

      await strategy.gerar(context);

      const oitavasCall = mockConfrontoRepository.criarEmLote.mock.calls[3];
      const oitavas = oitavasCall[0];

      const byes = oitavas.filter((c: any) => c.isBye === true);
      expect(byes.length).toBe(4);

      const origensComBye = byes.map((c: any) => c.equipe1Origem);
      expect(origensComBye).toContain("1º Grupo A");
      expect(origensComBye).toContain("1º Grupo B");
      expect(origensComBye).toContain("1º Grupo C");
      expect(origensComBye).toContain("1º Grupo D");
    });

    it("deve criar confrontos E e F jogando entre si", async () => {
      const context: EliminatoriaContext = {
        etapa: criarEtapaMock(),
        grupos: ["A", "B", "C", "D", "E", "F"],
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        confrontoRepository: mockConfrontoRepository,
      };

      await strategy.gerar(context);

      const oitavasCall = mockConfrontoRepository.criarEmLote.mock.calls[3];
      const oitavas = oitavasCall[0];

      // 1E x 2F
      const confronto1Evs2F = oitavas.find(
        (c: any) => c.equipe1Origem === "1º Grupo E" && c.equipe2Origem === "2º Grupo F"
      );
      expect(confronto1Evs2F).toBeDefined();
      expect(confronto1Evs2F.isBye).toBeFalsy();

      // 1F x 2E
      const confronto1Fvs2E = oitavas.find(
        (c: any) => c.equipe1Origem === "1º Grupo F" && c.equipe2Origem === "2º Grupo E"
      );
      expect(confronto1Fvs2E).toBeDefined();
      expect(confronto1Fvs2E.isBye).toBeFalsy();
    });

    it("deve criar confrontos entre segundos colocados (A-D)", async () => {
      const context: EliminatoriaContext = {
        etapa: criarEtapaMock(),
        grupos: ["A", "B", "C", "D", "E", "F"],
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        confrontoRepository: mockConfrontoRepository,
      };

      await strategy.gerar(context);

      const oitavasCall = mockConfrontoRepository.criarEmLote.mock.calls[3];
      const oitavas = oitavasCall[0];

      // 2B x 2C
      const confronto2Bvs2C = oitavas.find(
        (c: any) => c.equipe1Origem === "2º Grupo B" && c.equipe2Origem === "2º Grupo C"
      );
      expect(confronto2Bvs2C).toBeDefined();

      // 2D x 2A
      const confronto2Dvs2A = oitavas.find(
        (c: any) => c.equipe1Origem === "2º Grupo D" && c.equipe2Origem === "2º Grupo A"
      );
      expect(confronto2Dvs2A).toBeDefined();
    });
  });

  describe("Eliminatoria7GruposStrategy", () => {
    let strategy: Eliminatoria7GruposStrategy;

    beforeEach(() => {
      strategy = new Eliminatoria7GruposStrategy();
    });

    it("deve ter numGrupos = 7", () => {
      expect(strategy.numGrupos).toBe(7);
    });

    it("deve gerar estrutura completa com 2 BYEs", async () => {
      const context: EliminatoriaContext = {
        etapa: criarEtapaMock(),
        grupos: ["A", "B", "C", "D", "E", "F", "G"],
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        confrontoRepository: mockConfrontoRepository,
      };

      const confrontos = await strategy.gerar(context);

      expect(confrontos.length).toBe(15);

      const oitavasCall = mockConfrontoRepository.criarEmLote.mock.calls[3];
      const oitavas = oitavasCall[0];

      const byes = oitavas.filter((c: any) => c.isBye === true);
      expect(byes.length).toBe(2);
    });

    it("deve criar BYEs para 1A e 1B", async () => {
      const context: EliminatoriaContext = {
        etapa: criarEtapaMock(),
        grupos: ["A", "B", "C", "D", "E", "F", "G"],
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        confrontoRepository: mockConfrontoRepository,
      };

      await strategy.gerar(context);

      const oitavasCall = mockConfrontoRepository.criarEmLote.mock.calls[3];
      const oitavas = oitavasCall[0];

      const byes = oitavas.filter((c: any) => c.isBye === true);
      const origensComBye = byes.map((c: any) => c.equipe1Origem);
      expect(origensComBye).toContain("1º Grupo A");
      expect(origensComBye).toContain("1º Grupo B");
    });

    it("deve criar 6 confrontos normais nas oitavas", async () => {
      const context: EliminatoriaContext = {
        etapa: criarEtapaMock(),
        grupos: ["A", "B", "C", "D", "E", "F", "G"],
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        confrontoRepository: mockConfrontoRepository,
      };

      await strategy.gerar(context);

      const oitavasCall = mockConfrontoRepository.criarEmLote.mock.calls[3];
      const oitavas = oitavasCall[0];

      const semBye = oitavas.filter((c: any) => !c.isBye);
      expect(semBye.length).toBe(6);
    });

    it("deve incluir confrontos do grupo G", async () => {
      const context: EliminatoriaContext = {
        etapa: criarEtapaMock(),
        grupos: ["A", "B", "C", "D", "E", "F", "G"],
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        confrontoRepository: mockConfrontoRepository,
      };

      await strategy.gerar(context);

      const oitavasCall = mockConfrontoRepository.criarEmLote.mock.calls[3];
      const oitavas = oitavasCall[0];

      // Verificar que há confrontos envolvendo grupo G
      const comGrupoG = oitavas.filter(
        (c: any) =>
          c.equipe1Origem?.includes("Grupo G") || c.equipe2Origem?.includes("Grupo G")
      );
      expect(comGrupoG.length).toBeGreaterThan(0);
    });
  });

  describe("Eliminatoria8GruposStrategy", () => {
    let strategy: Eliminatoria8GruposStrategy;

    beforeEach(() => {
      strategy = new Eliminatoria8GruposStrategy();
    });

    it("deve ter numGrupos = 8", () => {
      expect(strategy.numGrupos).toBe(8);
    });

    it("deve gerar estrutura completa sem BYEs", async () => {
      const context: EliminatoriaContext = {
        etapa: criarEtapaMock(),
        grupos: ["A", "B", "C", "D", "E", "F", "G", "H"],
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        confrontoRepository: mockConfrontoRepository,
      };

      const confrontos = await strategy.gerar(context);

      expect(confrontos.length).toBe(15);

      const oitavasCall = mockConfrontoRepository.criarEmLote.mock.calls[3];
      const oitavas = oitavasCall[0];

      // Nenhum BYE para 8 grupos
      const byes = oitavas.filter((c: any) => c.isBye === true);
      expect(byes.length).toBe(0);
    });

    it("deve criar 8 confrontos nas oitavas (1º vs 2º cruzados)", async () => {
      const context: EliminatoriaContext = {
        etapa: criarEtapaMock(),
        grupos: ["A", "B", "C", "D", "E", "F", "G", "H"],
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        confrontoRepository: mockConfrontoRepository,
      };

      await strategy.gerar(context);

      const oitavasCall = mockConfrontoRepository.criarEmLote.mock.calls[3];
      const oitavas = oitavasCall[0];

      expect(oitavas.length).toBe(8);

      // Todos devem ser 1º vs 2º de grupos diferentes
      oitavas.forEach((c: any) => {
        expect(c.equipe1Origem).toMatch(/^1º Grupo [A-H]$/);
        expect(c.equipe2Origem).toMatch(/^2º Grupo [A-H]$/);
      });
    });

    it("deve ter chaveamento correto (1A x 2B, 1B x 2A, etc)", async () => {
      const context: EliminatoriaContext = {
        etapa: criarEtapaMock(),
        grupos: ["A", "B", "C", "D", "E", "F", "G", "H"],
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        confrontoRepository: mockConfrontoRepository,
      };

      await strategy.gerar(context);

      const oitavasCall = mockConfrontoRepository.criarEmLote.mock.calls[3];
      const oitavas = oitavasCall[0];

      // 1A x 2B
      const confronto1Avs2B = oitavas.find(
        (c: any) => c.equipe1Origem === "1º Grupo A" && c.equipe2Origem === "2º Grupo B"
      );
      expect(confronto1Avs2B).toBeDefined();

      // 1B x 2A
      const confronto1Bvs2A = oitavas.find(
        (c: any) => c.equipe1Origem === "1º Grupo B" && c.equipe2Origem === "2º Grupo A"
      );
      expect(confronto1Bvs2A).toBeDefined();

      // 1H x 2G
      const confronto1Hvs2G = oitavas.find(
        (c: any) => c.equipe1Origem === "1º Grupo H" && c.equipe2Origem === "2º Grupo G"
      );
      expect(confronto1Hvs2G).toBeDefined();
    });

    it("deve usar todos os 8 grupos nas oitavas", async () => {
      const context: EliminatoriaContext = {
        etapa: criarEtapaMock(),
        grupos: ["A", "B", "C", "D", "E", "F", "G", "H"],
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        confrontoRepository: mockConfrontoRepository,
      };

      await strategy.gerar(context);

      const oitavasCall = mockConfrontoRepository.criarEmLote.mock.calls[3];
      const oitavas = oitavasCall[0];

      // Cada grupo deve aparecer como 1º e como 2º uma vez
      const grupos = ["A", "B", "C", "D", "E", "F", "G", "H"];

      grupos.forEach((grupo) => {
        const como1 = oitavas.filter((c: any) => c.equipe1Origem === `1º Grupo ${grupo}`);
        const como2 = oitavas.filter((c: any) => c.equipe2Origem === `2º Grupo ${grupo}`);
        expect(como1.length).toBe(1);
        expect(como2.length).toBe(1);
      });
    });
  });

  describe("Verificações comuns a todas as strategies", () => {
    const strategies = [
      { name: "5 grupos", strategy: new Eliminatoria5GruposStrategy(), grupos: ["A", "B", "C", "D", "E"] },
      { name: "6 grupos", strategy: new Eliminatoria6GruposStrategy(), grupos: ["A", "B", "C", "D", "E", "F"] },
      { name: "7 grupos", strategy: new Eliminatoria7GruposStrategy(), grupos: ["A", "B", "C", "D", "E", "F", "G"] },
      { name: "8 grupos", strategy: new Eliminatoria8GruposStrategy(), grupos: ["A", "B", "C", "D", "E", "F", "G", "H"] },
    ];

    strategies.forEach(({ name, strategy, grupos }) => {
      describe(`${name}`, () => {
        it("deve gerar exatamente 15 confrontos", async () => {
          const context: EliminatoriaContext = {
            etapa: criarEtapaMock(),
            grupos,
            tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
            confrontoRepository: mockConfrontoRepository,
          };

          const confrontos = await strategy.gerar(context);
          expect(confrontos.length).toBe(15);
        });

        it("deve gerar 1 final", async () => {
          const context: EliminatoriaContext = {
            etapa: criarEtapaMock(),
            grupos,
            tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
            confrontoRepository: mockConfrontoRepository,
          };

          const confrontos = await strategy.gerar(context);
          const finais = confrontos.filter((c) => c.fase === FaseEtapa.FINAL);
          expect(finais.length).toBe(1);
        });

        it("deve gerar 2 semifinais", async () => {
          const context: EliminatoriaContext = {
            etapa: criarEtapaMock(),
            grupos,
            tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
            confrontoRepository: mockConfrontoRepository,
          };

          const confrontos = await strategy.gerar(context);
          const semis = confrontos.filter((c) => c.fase === FaseEtapa.SEMIFINAL);
          expect(semis.length).toBe(2);
        });

        it("deve gerar 4 quartas de final", async () => {
          const context: EliminatoriaContext = {
            etapa: criarEtapaMock(),
            grupos,
            tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
            confrontoRepository: mockConfrontoRepository,
          };

          const confrontos = await strategy.gerar(context);
          const quartas = confrontos.filter((c) => c.fase === FaseEtapa.QUARTAS);
          expect(quartas.length).toBe(4);
        });

        it("deve gerar 8 oitavas de final", async () => {
          const context: EliminatoriaContext = {
            etapa: criarEtapaMock(),
            grupos,
            tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
            confrontoRepository: mockConfrontoRepository,
          };

          const confrontos = await strategy.gerar(context);
          const oitavas = confrontos.filter((c) => c.fase === FaseEtapa.OITAVAS);
          expect(oitavas.length).toBe(8);
        });

        it("deve conectar semifinais à final", async () => {
          const context: EliminatoriaContext = {
            etapa: criarEtapaMock(),
            grupos,
            tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
            confrontoRepository: mockConfrontoRepository,
          };

          const confrontos = await strategy.gerar(context);
          const final = confrontos.find((c) => c.fase === FaseEtapa.FINAL);
          const semis = confrontos.filter((c) => c.fase === FaseEtapa.SEMIFINAL);

          semis.forEach((semi) => {
            expect(semi.proximoConfrontoId).toBe(final?.id);
          });
        });

        it("deve conectar quartas às semifinais", async () => {
          const context: EliminatoriaContext = {
            etapa: criarEtapaMock(),
            grupos,
            tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
            confrontoRepository: mockConfrontoRepository,
          };

          const confrontos = await strategy.gerar(context);
          const semis = confrontos.filter((c) => c.fase === FaseEtapa.SEMIFINAL);
          const quartas = confrontos.filter((c) => c.fase === FaseEtapa.QUARTAS);

          quartas.forEach((quarta) => {
            expect(semis.some((s) => s.id === quarta.proximoConfrontoId)).toBe(true);
          });
        });

        it("deve usar etapaId e arenaId corretos", async () => {
          const etapa = criarEtapaMock();
          const context: EliminatoriaContext = {
            etapa,
            grupos,
            tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
            confrontoRepository: mockConfrontoRepository,
          };

          await strategy.gerar(context);

          // Verificar o DTO da final (primeiro criarEmLote é a final)
          const finalCall = mockConfrontoRepository.criarEmLote.mock.calls[0][0][0];
          expect(finalCall.etapaId).toBe(etapa.id);
          expect(finalCall.arenaId).toBe(etapa.arenaId);
        });
      });
    });
  });

  describe("BaseEliminatoriaStrategy - criarSemifinais", () => {
    // Classe concreta de teste para acessar métodos protegidos
    class TestStrategy extends BaseEliminatoriaStrategy {
      readonly numGrupos = 2;

      async gerar(context: EliminatoriaContext): Promise<ConfrontoEquipe[]> {
        // Usa criarFinal e criarSemifinais da classe base
        const final = await this.criarFinal(context, 3);
        const semis = await this.criarSemifinais(context, 1, 2, final.id);
        return [...semis, final];
      }

      // Expor métodos para testes
      public async testCriarSemifinais(
        context: EliminatoriaContext,
        ordem1: number,
        ordem2: number,
        finalId: string
      ): Promise<ConfrontoEquipe[]> {
        return this.criarSemifinais(context, ordem1, ordem2, finalId);
      }
    }

    let testStrategy: TestStrategy;

    beforeEach(() => {
      testStrategy = new TestStrategy();
    });

    it("deve criar 2 semifinais com origens de quartas", async () => {
      const context: EliminatoriaContext = {
        etapa: criarEtapaMock(),
        grupos: ["A", "B"],
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        confrontoRepository: mockConfrontoRepository,
      };

      const semis = await testStrategy.testCriarSemifinais(
        context,
        1,
        2,
        "final-id"
      );

      expect(semis.length).toBe(2);
    });

    it("deve conectar semifinais à final via proximoConfrontoId", async () => {
      const context: EliminatoriaContext = {
        etapa: criarEtapaMock(),
        grupos: ["A", "B"],
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        confrontoRepository: mockConfrontoRepository,
      };

      await testStrategy.testCriarSemifinais(context, 1, 2, "final-id-123");

      // Verificar DTOs passados ao criarEmLote
      const semisCall = mockConfrontoRepository.criarEmLote.mock.calls[0][0];
      expect(semisCall[0].proximoConfrontoId).toBe("final-id-123");
      expect(semisCall[1].proximoConfrontoId).toBe("final-id-123");
    });

    it("deve usar ordens corretas para cada semifinal", async () => {
      const context: EliminatoriaContext = {
        etapa: criarEtapaMock(),
        grupos: ["A", "B"],
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        confrontoRepository: mockConfrontoRepository,
      };

      await testStrategy.testCriarSemifinais(context, 5, 6, "final-id");

      const semisCall = mockConfrontoRepository.criarEmLote.mock.calls[0][0];
      expect(semisCall[0].ordem).toBe(5);
      expect(semisCall[1].ordem).toBe(6);
    });

    it("deve definir origens como vencedores das quartas", async () => {
      const context: EliminatoriaContext = {
        etapa: criarEtapaMock(),
        grupos: ["A", "B"],
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        confrontoRepository: mockConfrontoRepository,
      };

      await testStrategy.testCriarSemifinais(context, 1, 2, "final-id");

      const semisCall = mockConfrontoRepository.criarEmLote.mock.calls[0][0];

      // Semi 1: Vencedor Quartas 1 x Vencedor Quartas 2
      expect(semisCall[0].equipe1Origem).toBe("Vencedor Quartas 1");
      expect(semisCall[0].equipe2Origem).toBe("Vencedor Quartas 2");

      // Semi 2: Vencedor Quartas 3 x Vencedor Quartas 4
      expect(semisCall[1].equipe1Origem).toBe("Vencedor Quartas 3");
      expect(semisCall[1].equipe2Origem).toBe("Vencedor Quartas 4");
    });

    it("deve usar fase SEMIFINAL", async () => {
      const context: EliminatoriaContext = {
        etapa: criarEtapaMock(),
        grupos: ["A", "B"],
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        confrontoRepository: mockConfrontoRepository,
      };

      await testStrategy.testCriarSemifinais(context, 1, 2, "final-id");

      const semisCall = mockConfrontoRepository.criarEmLote.mock.calls[0][0];
      expect(semisCall[0].fase).toBe(FaseEtapa.SEMIFINAL);
      expect(semisCall[1].fase).toBe(FaseEtapa.SEMIFINAL);
    });

    it("deve funcionar via gerar() que usa criarFinal e criarSemifinais", async () => {
      const context: EliminatoriaContext = {
        etapa: criarEtapaMock(),
        grupos: ["A", "B"],
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        confrontoRepository: mockConfrontoRepository,
      };

      const confrontos = await testStrategy.gerar(context);

      // 2 semis + 1 final
      expect(confrontos.length).toBe(3);

      const final = confrontos.find((c) => c.fase === FaseEtapa.FINAL);
      const semis = confrontos.filter((c) => c.fase === FaseEtapa.SEMIFINAL);

      expect(final).toBeDefined();
      expect(semis.length).toBe(2);
    });
  });
});
