/**
 * Testes para SuperXService
 *
 * Nota: Este arquivo testa a integração com os schedules.
 * Os testes completos de integração estão nos testes de API.
 */

import {
  getSuperXSchedule,
  getTotalRodadas,
  getPartidasPorRodada,
  getTotalPartidas,
  validarSchedule,
} from "../../config/SuperXSchedules";

describe("SuperXService - Validações de Schedule", () => {
  describe("Schedule do Super 8", () => {
    it("deve ter configurações corretas", () => {
      const schedule = getSuperXSchedule(8);

      expect(schedule).toHaveLength(7); // 7 rodadas
      expect(getTotalRodadas(8)).toBe(7);
      expect(getPartidasPorRodada(8)).toBe(2);
      expect(getTotalPartidas(8)).toBe(14);
    });

    it("deve passar na validação completa", () => {
      const resultado = validarSchedule(8);

      expect(resultado.valido).toBe(true);
      expect(resultado.erros).toHaveLength(0);
    });

    it("todos os jogadores devem participar de cada rodada", () => {
      const schedule = getSuperXSchedule(8);

      for (const rodada of schedule) {
        const jogadoresNaRodada = new Set<number>();

        for (const partida of rodada.partidas) {
          jogadoresNaRodada.add(partida.dupla1[0]);
          jogadoresNaRodada.add(partida.dupla1[1]);
          jogadoresNaRodada.add(partida.dupla2[0]);
          jogadoresNaRodada.add(partida.dupla2[1]);
        }

        expect(jogadoresNaRodada.size).toBe(8);
      }
    });
  });

  describe("Schedule do Super 12", () => {
    it("deve ter configurações corretas", () => {
      const schedule = getSuperXSchedule(12);

      expect(schedule).toHaveLength(11); // 11 rodadas
      expect(getTotalRodadas(12)).toBe(11);
      expect(getPartidasPorRodada(12)).toBe(3);
      expect(getTotalPartidas(12)).toBe(33);
    });

    it("deve passar na validação completa", () => {
      const resultado = validarSchedule(12);

      expect(resultado.valido).toBe(true);
      expect(resultado.erros).toHaveLength(0);
    });

    it("todos os jogadores devem participar de cada rodada", () => {
      const schedule = getSuperXSchedule(12);

      for (const rodada of schedule) {
        const jogadoresNaRodada = new Set<number>();

        for (const partida of rodada.partidas) {
          jogadoresNaRodada.add(partida.dupla1[0]);
          jogadoresNaRodada.add(partida.dupla1[1]);
          jogadoresNaRodada.add(partida.dupla2[0]);
          jogadoresNaRodada.add(partida.dupla2[1]);
        }

        expect(jogadoresNaRodada.size).toBe(12);
      }
    });
  });

  describe("Consistência entre variantes", () => {
    it("Super 8 e Super 12 devem ter estrutura consistente", () => {
      const schedule8 = getSuperXSchedule(8);
      const schedule12 = getSuperXSchedule(12);

      // Ambos começam na rodada 1
      expect(schedule8[0].rodada).toBe(1);
      expect(schedule12[0].rodada).toBe(1);

      // Rodadas são sequenciais
      schedule8.forEach((rodada, index) => {
        expect(rodada.rodada).toBe(index + 1);
      });

      schedule12.forEach((rodada, index) => {
        expect(rodada.rodada).toBe(index + 1);
      });
    });

    it("cada jogador deve jogar uma partida por rodada", () => {
      // Super 8
      for (const rodada of getSuperXSchedule(8)) {
        const partidasPorJogador: Record<number, number> = {};
        for (let i = 0; i < 8; i++) partidasPorJogador[i] = 0;

        for (const partida of rodada.partidas) {
          partidasPorJogador[partida.dupla1[0]]++;
          partidasPorJogador[partida.dupla1[1]]++;
          partidasPorJogador[partida.dupla2[0]]++;
          partidasPorJogador[partida.dupla2[1]]++;
        }

        for (let i = 0; i < 8; i++) {
          expect(partidasPorJogador[i]).toBe(1);
        }
      }

      // Super 12
      for (const rodada of getSuperXSchedule(12)) {
        const partidasPorJogador: Record<number, number> = {};
        for (let i = 0; i < 12; i++) partidasPorJogador[i] = 0;

        for (const partida of rodada.partidas) {
          partidasPorJogador[partida.dupla1[0]]++;
          partidasPorJogador[partida.dupla1[1]]++;
          partidasPorJogador[partida.dupla2[0]]++;
          partidasPorJogador[partida.dupla2[1]]++;
        }

        for (let i = 0; i < 12; i++) {
          expect(partidasPorJogador[i]).toBe(1);
        }
      }
    });
  });
});
