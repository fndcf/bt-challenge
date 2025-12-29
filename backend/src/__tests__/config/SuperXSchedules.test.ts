/**
 * Testes para SuperXSchedules
 */

import {
  SUPER_8_SCHEDULE,
  SUPER_12_SCHEDULE,
  SUPER_X_SCHEDULES,
  getSuperXSchedule,
  getTotalRodadas,
  getPartidasPorRodada,
  getTotalPartidas,
  validarSchedule,
  RodadaSuperX,
  PartidaSuperX,
} from "../../config/SuperXSchedules";

describe("SuperXSchedules", () => {
  describe("SUPER_8_SCHEDULE", () => {
    it("deve ter 7 rodadas", () => {
      expect(SUPER_8_SCHEDULE).toHaveLength(7);
    });

    it("cada rodada deve ter 2 partidas", () => {
      for (const rodada of SUPER_8_SCHEDULE) {
        expect(rodada.partidas).toHaveLength(2);
      }
    });

    it("cada rodada deve ter número correto", () => {
      SUPER_8_SCHEDULE.forEach((rodada, index) => {
        expect(rodada.rodada).toBe(index + 1);
      });
    });

    it("todos os 8 jogadores devem participar de todas as rodadas (sem BYE)", () => {
      for (const rodada of SUPER_8_SCHEDULE) {
        const jogadoresNaRodada = new Set<number>();
        for (const partida of rodada.partidas) {
          jogadoresNaRodada.add(partida.dupla1[0]);
          jogadoresNaRodada.add(partida.dupla1[1]);
          jogadoresNaRodada.add(partida.dupla2[0]);
          jogadoresNaRodada.add(partida.dupla2[1]);
        }
        // Nenhum jogador está de folga
        expect(jogadoresNaRodada.size).toBe(8);
      }
    });

    it("cada jogador deve jogar exatamente uma vez por rodada", () => {
      for (const rodada of SUPER_8_SCHEDULE) {
        const jogadoresNaRodada = new Set<number>();

        for (const partida of rodada.partidas) {
          jogadoresNaRodada.add(partida.dupla1[0]);
          jogadoresNaRodada.add(partida.dupla1[1]);
          jogadoresNaRodada.add(partida.dupla2[0]);
          jogadoresNaRodada.add(partida.dupla2[1]);
        }

        // Todos os 8 jogadores devem estar presentes
        expect(jogadoresNaRodada.size).toBe(8);

        // Verificar que são os índices 0-7
        for (let i = 0; i < 8; i++) {
          expect(jogadoresNaRodada.has(i)).toBe(true);
        }
      }
    });

    it("cada jogador deve jogar 7 partidas no total", () => {
      const partidasPorJogador: Record<number, number> = {};

      for (let i = 0; i < 8; i++) {
        partidasPorJogador[i] = 0;
      }

      for (const rodada of SUPER_8_SCHEDULE) {
        for (const partida of rodada.partidas) {
          partidasPorJogador[partida.dupla1[0]]++;
          partidasPorJogador[partida.dupla1[1]]++;
          partidasPorJogador[partida.dupla2[0]]++;
          partidasPorJogador[partida.dupla2[1]]++;
        }
      }

      // Cada jogador deve ter 7 partidas (uma por rodada)
      for (let i = 0; i < 8; i++) {
        expect(partidasPorJogador[i]).toBe(7);
      }
    });

    it("índices dos jogadores devem ser válidos (0-7)", () => {
      for (const rodada of SUPER_8_SCHEDULE) {
        for (const partida of rodada.partidas) {
          expect(partida.dupla1[0]).toBeGreaterThanOrEqual(0);
          expect(partida.dupla1[0]).toBeLessThan(8);
          expect(partida.dupla1[1]).toBeGreaterThanOrEqual(0);
          expect(partida.dupla1[1]).toBeLessThan(8);
          expect(partida.dupla2[0]).toBeGreaterThanOrEqual(0);
          expect(partida.dupla2[0]).toBeLessThan(8);
          expect(partida.dupla2[1]).toBeGreaterThanOrEqual(0);
          expect(partida.dupla2[1]).toBeLessThan(8);
        }
      }
    });

    it("cada dupla deve ter jogadores diferentes", () => {
      for (const rodada of SUPER_8_SCHEDULE) {
        for (const partida of rodada.partidas) {
          expect(partida.dupla1[0]).not.toBe(partida.dupla1[1]);
          expect(partida.dupla2[0]).not.toBe(partida.dupla2[1]);
        }
      }
    });
  });

  describe("SUPER_12_SCHEDULE", () => {
    it("deve ter 11 rodadas", () => {
      expect(SUPER_12_SCHEDULE).toHaveLength(11);
    });

    it("cada rodada deve ter 3 partidas", () => {
      for (const rodada of SUPER_12_SCHEDULE) {
        expect(rodada.partidas).toHaveLength(3);
      }
    });

    it("cada rodada deve ter número correto", () => {
      SUPER_12_SCHEDULE.forEach((rodada, index) => {
        expect(rodada.rodada).toBe(index + 1);
      });
    });

    it("todos os 12 jogadores devem participar de todas as rodadas (sem BYE)", () => {
      for (const rodada of SUPER_12_SCHEDULE) {
        const jogadoresNaRodada = new Set<number>();
        for (const partida of rodada.partidas) {
          jogadoresNaRodada.add(partida.dupla1[0]);
          jogadoresNaRodada.add(partida.dupla1[1]);
          jogadoresNaRodada.add(partida.dupla2[0]);
          jogadoresNaRodada.add(partida.dupla2[1]);
        }
        // Nenhum jogador está de folga
        expect(jogadoresNaRodada.size).toBe(12);
      }
    });

    it("cada jogador deve jogar exatamente uma vez por rodada", () => {
      for (const rodada of SUPER_12_SCHEDULE) {
        const jogadoresNaRodada = new Set<number>();

        for (const partida of rodada.partidas) {
          jogadoresNaRodada.add(partida.dupla1[0]);
          jogadoresNaRodada.add(partida.dupla1[1]);
          jogadoresNaRodada.add(partida.dupla2[0]);
          jogadoresNaRodada.add(partida.dupla2[1]);
        }

        // Todos os 12 jogadores devem estar presentes
        expect(jogadoresNaRodada.size).toBe(12);

        // Verificar que são os índices 0-11
        for (let i = 0; i < 12; i++) {
          expect(jogadoresNaRodada.has(i)).toBe(true);
        }
      }
    });

    it("cada jogador deve jogar 11 partidas no total", () => {
      const partidasPorJogador: Record<number, number> = {};

      for (let i = 0; i < 12; i++) {
        partidasPorJogador[i] = 0;
      }

      for (const rodada of SUPER_12_SCHEDULE) {
        for (const partida of rodada.partidas) {
          partidasPorJogador[partida.dupla1[0]]++;
          partidasPorJogador[partida.dupla1[1]]++;
          partidasPorJogador[partida.dupla2[0]]++;
          partidasPorJogador[partida.dupla2[1]]++;
        }
      }

      // Cada jogador deve ter 11 partidas (uma por rodada)
      for (let i = 0; i < 12; i++) {
        expect(partidasPorJogador[i]).toBe(11);
      }
    });

    it("índices dos jogadores devem ser válidos (0-11)", () => {
      for (const rodada of SUPER_12_SCHEDULE) {
        for (const partida of rodada.partidas) {
          expect(partida.dupla1[0]).toBeGreaterThanOrEqual(0);
          expect(partida.dupla1[0]).toBeLessThan(12);
          expect(partida.dupla1[1]).toBeGreaterThanOrEqual(0);
          expect(partida.dupla1[1]).toBeLessThan(12);
          expect(partida.dupla2[0]).toBeGreaterThanOrEqual(0);
          expect(partida.dupla2[0]).toBeLessThan(12);
          expect(partida.dupla2[1]).toBeGreaterThanOrEqual(0);
          expect(partida.dupla2[1]).toBeLessThan(12);
        }
      }
    });

    it("cada dupla deve ter jogadores diferentes", () => {
      for (const rodada of SUPER_12_SCHEDULE) {
        for (const partida of rodada.partidas) {
          expect(partida.dupla1[0]).not.toBe(partida.dupla1[1]);
          expect(partida.dupla2[0]).not.toBe(partida.dupla2[1]);
        }
      }
    });
  });

  describe("SUPER_X_SCHEDULES", () => {
    it("deve ter schedules para Super 8 e Super 12", () => {
      expect(SUPER_X_SCHEDULES[8]).toBeDefined();
      expect(SUPER_X_SCHEDULES[12]).toBeDefined();
    });

    it("schedule 8 deve ser igual a SUPER_8_SCHEDULE", () => {
      expect(SUPER_X_SCHEDULES[8]).toBe(SUPER_8_SCHEDULE);
    });

    it("schedule 12 deve ser igual a SUPER_12_SCHEDULE", () => {
      expect(SUPER_X_SCHEDULES[12]).toBe(SUPER_12_SCHEDULE);
    });
  });

  describe("getSuperXSchedule", () => {
    it("deve retornar SUPER_8_SCHEDULE para variante 8", () => {
      expect(getSuperXSchedule(8)).toBe(SUPER_8_SCHEDULE);
    });

    it("deve retornar SUPER_12_SCHEDULE para variante 12", () => {
      expect(getSuperXSchedule(12)).toBe(SUPER_12_SCHEDULE);
    });
  });

  describe("getTotalRodadas", () => {
    it("deve retornar 7 para Super 8", () => {
      expect(getTotalRodadas(8)).toBe(7);
    });

    it("deve retornar 11 para Super 12", () => {
      expect(getTotalRodadas(12)).toBe(11);
    });
  });

  describe("getPartidasPorRodada", () => {
    it("deve retornar 2 para Super 8", () => {
      expect(getPartidasPorRodada(8)).toBe(2);
    });

    it("deve retornar 3 para Super 12", () => {
      expect(getPartidasPorRodada(12)).toBe(3);
    });
  });

  describe("getTotalPartidas", () => {
    it("deve retornar 14 para Super 8 (7 rodadas x 2 partidas)", () => {
      expect(getTotalPartidas(8)).toBe(14);
    });

    it("deve retornar 33 para Super 12 (11 rodadas x 3 partidas)", () => {
      expect(getTotalPartidas(12)).toBe(33);
    });
  });

  describe("validarSchedule", () => {
    it("deve validar Super 8 como correto", () => {
      const resultado = validarSchedule(8);
      expect(resultado.valido).toBe(true);
      expect(resultado.erros).toHaveLength(0);
    });

    it("deve validar Super 12 como correto", () => {
      const resultado = validarSchedule(12);
      expect(resultado.valido).toBe(true);
      expect(resultado.erros).toHaveLength(0);
    });

    it("deve detectar número incorreto de rodadas", () => {
      // Mockando SUPER_X_SCHEDULES temporariamente para testar erro
      const originalSchedule = SUPER_X_SCHEDULES[8];

      // Schedule com rodadas faltando (apenas 5 em vez de 7)
      const scheduleIncompleto = originalSchedule.slice(0, 5);
      (SUPER_X_SCHEDULES as any)[8] = scheduleIncompleto;

      const resultado = validarSchedule(8);

      // Restaurar schedule original
      (SUPER_X_SCHEDULES as any)[8] = originalSchedule;

      expect(resultado.valido).toBe(false);
      expect(resultado.erros.length).toBeGreaterThan(0);
      expect(resultado.erros[0]).toContain("rodadas");
    });

    it("deve detectar jogadores faltando em uma rodada", () => {
      const originalSchedule = SUPER_X_SCHEDULES[8];

      // Schedule com jogadores faltando na primeira rodada (só 4 jogadores em vez de 8)
      const scheduleComJogadoresFaltando: RodadaSuperX[] = [
        {
          rodada: 1,
          partidas: [
            { dupla1: [0, 1], dupla2: [2, 3] }, // Só 4 jogadores
          ],
        },
        ...originalSchedule.slice(1),
      ];
      (SUPER_X_SCHEDULES as any)[8] = scheduleComJogadoresFaltando;

      const resultado = validarSchedule(8);

      // Restaurar schedule original
      (SUPER_X_SCHEDULES as any)[8] = originalSchedule;

      expect(resultado.valido).toBe(false);
      expect(resultado.erros.some((e) => e.includes("jogadores"))).toBe(true);
    });

    it("deve detectar índice de jogador inválido", () => {
      const originalSchedule = SUPER_X_SCHEDULES[8];

      // Schedule com índice inválido (jogador 99 não existe)
      const scheduleComIndiceInvalido: RodadaSuperX[] = [
        {
          rodada: 1,
          partidas: [
            { dupla1: [0, 1], dupla2: [2, 3] },
            { dupla1: [4, 5], dupla2: [6, 99] }, // 99 é inválido para Super 8
          ],
        },
        ...originalSchedule.slice(1),
      ];
      (SUPER_X_SCHEDULES as any)[8] = scheduleComIndiceInvalido;

      const resultado = validarSchedule(8);

      // Restaurar schedule original
      (SUPER_X_SCHEDULES as any)[8] = originalSchedule;

      expect(resultado.valido).toBe(false);
      expect(resultado.erros.some((e) => e.includes("inválido"))).toBe(true);
    });
  });

  describe("Integridade das estruturas", () => {
    it("PartidaSuperX deve ter estrutura correta", () => {
      const partida: PartidaSuperX = {
        dupla1: [0, 1],
        dupla2: [2, 3],
      };

      expect(partida.dupla1).toHaveLength(2);
      expect(partida.dupla2).toHaveLength(2);
    });

    it("RodadaSuperX deve ter estrutura correta", () => {
      const rodada: RodadaSuperX = {
        rodada: 1,
        partidas: [{ dupla1: [0, 1], dupla2: [2, 3] }],
      };

      expect(rodada.rodada).toBe(1);
      expect(rodada.partidas).toHaveLength(1);
    });
  });
});
