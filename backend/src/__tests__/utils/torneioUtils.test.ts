/**
 * Testes do torneioUtils
 */

import {
  calcularDistribuicaoGrupos,
  calcularByes,
  determinarTipoFase,
  calcularTotalPartidas,
  obterProximaFase,
  gerarOrdemBracket,
  gerarNomeGrupo,
  LETRAS_GRUPOS,
} from "../../utils/torneioUtils";
import { TipoFase } from "../../models/Eliminatoria";

describe("torneioUtils", () => {
  describe("calcularDistribuicaoGrupos", () => {
    it("deve retornar [5] para 5 duplas (caso especial)", () => {
      expect(calcularDistribuicaoGrupos(5)).toEqual([5]);
    });

    it("deve distribuir em grupos de 3 quando divisível por 3", () => {
      expect(calcularDistribuicaoGrupos(6)).toEqual([3, 3]);
      expect(calcularDistribuicaoGrupos(9)).toEqual([3, 3, 3]);
      expect(calcularDistribuicaoGrupos(12)).toEqual([3, 3, 3, 3]);
    });

    it("deve criar grupo de 4 quando resto é 1", () => {
      expect(calcularDistribuicaoGrupos(4)).toEqual([4]);
      expect(calcularDistribuicaoGrupos(7)).toEqual([3, 4]);
      expect(calcularDistribuicaoGrupos(10)).toEqual([3, 3, 4]);
    });

    it("deve criar 2 grupos de 4 quando resto é 2", () => {
      expect(calcularDistribuicaoGrupos(8)).toEqual([4, 4]);
      expect(calcularDistribuicaoGrupos(11)).toEqual([3, 4, 4]);
      expect(calcularDistribuicaoGrupos(14)).toEqual([3, 3, 4, 4]);
    });
  });

  describe("calcularByes", () => {
    it("deve retornar 0 byes para potências de 2", () => {
      const resultado = calcularByes(8);
      expect(resultado.byes).toBe(0);
      expect(resultado.confrontosNecessarios).toBe(4);
      expect(resultado.proximaPotencia).toBe(8);
    });

    it("deve calcular byes corretamente para 6 classificados", () => {
      const resultado = calcularByes(6);
      expect(resultado.byes).toBe(2);
      expect(resultado.confrontosNecessarios).toBe(2);
      expect(resultado.proximaPotencia).toBe(8);
    });

    it("deve calcular byes corretamente para 5 classificados", () => {
      const resultado = calcularByes(5);
      expect(resultado.byes).toBe(3);
      expect(resultado.confrontosNecessarios).toBe(1);
      expect(resultado.proximaPotencia).toBe(8);
    });

    it("deve funcionar para 16 classificados", () => {
      const resultado = calcularByes(16);
      expect(resultado.byes).toBe(0);
      expect(resultado.proximaPotencia).toBe(16);
    });
  });

  describe("determinarTipoFase", () => {
    it("deve retornar OITAVAS para mais de 8 classificados", () => {
      expect(determinarTipoFase(16)).toBe(TipoFase.OITAVAS);
      expect(determinarTipoFase(12)).toBe(TipoFase.OITAVAS);
      expect(determinarTipoFase(9)).toBe(TipoFase.OITAVAS);
    });

    it("deve retornar QUARTAS para 5-8 classificados", () => {
      expect(determinarTipoFase(8)).toBe(TipoFase.QUARTAS);
      expect(determinarTipoFase(6)).toBe(TipoFase.QUARTAS);
      expect(determinarTipoFase(5)).toBe(TipoFase.QUARTAS);
    });

    it("deve retornar SEMIFINAL para 3-4 classificados", () => {
      expect(determinarTipoFase(4)).toBe(TipoFase.SEMIFINAL);
      expect(determinarTipoFase(3)).toBe(TipoFase.SEMIFINAL);
    });

    it("deve retornar FINAL para 2 classificados", () => {
      expect(determinarTipoFase(2)).toBe(TipoFase.FINAL);
    });
  });

  describe("calcularTotalPartidas", () => {
    it("deve calcular corretamente para grupo de 3", () => {
      // A×B, A×C, B×C = 3 partidas
      expect(calcularTotalPartidas(3)).toBe(3);
    });

    it("deve calcular corretamente para grupo de 4", () => {
      // A×B, A×C, A×D, B×C, B×D, C×D = 6 partidas
      expect(calcularTotalPartidas(4)).toBe(6);
    });

    it("deve calcular corretamente para grupo de 5", () => {
      // 5*(5-1)/2 = 10 partidas
      expect(calcularTotalPartidas(5)).toBe(10);
    });
  });

  describe("obterProximaFase", () => {
    it("deve retornar QUARTAS após OITAVAS", () => {
      expect(obterProximaFase(TipoFase.OITAVAS)).toBe(TipoFase.QUARTAS);
    });

    it("deve retornar SEMIFINAL após QUARTAS", () => {
      expect(obterProximaFase(TipoFase.QUARTAS)).toBe(TipoFase.SEMIFINAL);
    });

    it("deve retornar FINAL após SEMIFINAL", () => {
      expect(obterProximaFase(TipoFase.SEMIFINAL)).toBe(TipoFase.FINAL);
    });

    it("deve retornar null após FINAL", () => {
      expect(obterProximaFase(TipoFase.FINAL)).toBeNull();
    });
  });

  describe("gerarOrdemBracket", () => {
    it("deve retornar [1] para n=1", () => {
      expect(gerarOrdemBracket(1)).toEqual([1]);
    });

    it("deve gerar ordem correta para 4 seeds", () => {
      // 1 vs 4, 2 vs 3 -> [1, 4, 2, 3]
      expect(gerarOrdemBracket(4)).toEqual([1, 4, 2, 3]);
    });

    it("deve gerar ordem correta para 8 seeds", () => {
      // Garante que 1 vs 8, 4 vs 5, 2 vs 7, 3 vs 6
      const resultado = gerarOrdemBracket(8);
      expect(resultado).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
    });
  });

  describe("gerarNomeGrupo", () => {
    it("deve gerar nomes corretos", () => {
      expect(gerarNomeGrupo(0)).toBe("Grupo A");
      expect(gerarNomeGrupo(1)).toBe("Grupo B");
      expect(gerarNomeGrupo(2)).toBe("Grupo C");
    });

    it("deve usar número para índices além do alfabeto", () => {
      expect(gerarNomeGrupo(26)).toBe("Grupo 27");
    });
  });

  describe("LETRAS_GRUPOS", () => {
    it("deve ter 26 letras", () => {
      expect(LETRAS_GRUPOS.length).toBe(26);
      expect(LETRAS_GRUPOS[0]).toBe("A");
      expect(LETRAS_GRUPOS[25]).toBe("Z");
    });
  });
});
