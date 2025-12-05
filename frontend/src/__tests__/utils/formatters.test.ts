/**
 * Testes dos formatadores
 */

import {
  getFormatoLabel,
  getStatusLabel,
  getNivelLabel,
  getGeneroLabel,
  formatarData,
} from "@/utils/formatters";
import { FormatoEtapa } from "@/types/etapa";
import { NivelJogador, GeneroJogador } from "@/types/jogador";

describe("formatters", () => {
  describe("getFormatoLabel", () => {
    it("deve retornar 'Dupla Fixa' para DUPLA_FIXA", () => {
      expect(getFormatoLabel(FormatoEtapa.DUPLA_FIXA)).toBe("Dupla Fixa");
    });

    it("deve retornar 'Rei da Praia' para REI_DA_PRAIA", () => {
      expect(getFormatoLabel(FormatoEtapa.REI_DA_PRAIA)).toBe("Rei da Praia");
    });

    it("deve retornar o próprio valor para formato desconhecido", () => {
      expect(getFormatoLabel("outro_formato")).toBe("outro_formato");
    });
  });

  describe("getStatusLabel", () => {
    it("deve retornar 'Inscrições Abertas' para aberta", () => {
      expect(getStatusLabel("aberta")).toBe("Inscrições Abertas");
    });

    it("deve retornar 'Em Andamento' para em_andamento", () => {
      expect(getStatusLabel("em_andamento")).toBe("Em Andamento");
    });

    it("deve retornar 'Finalizada' para finalizada", () => {
      expect(getStatusLabel("finalizada")).toBe("Finalizada");
    });

    it("deve retornar 'Em Breve' para planejada", () => {
      expect(getStatusLabel("planejada")).toBe("Em Breve");
    });

    it("deve retornar o próprio valor para status desconhecido", () => {
      expect(getStatusLabel("outro_status")).toBe("outro_status");
    });
  });

  describe("getNivelLabel", () => {
    it("deve retornar 'Iniciante' para INICIANTE", () => {
      expect(getNivelLabel(NivelJogador.INICIANTE)).toBe("Iniciante");
    });

    it("deve retornar 'Intermediário' para INTERMEDIARIO", () => {
      expect(getNivelLabel(NivelJogador.INTERMEDIARIO)).toBe("Intermediário");
    });

    it("deve retornar 'Avançado' para AVANCADO", () => {
      expect(getNivelLabel(NivelJogador.AVANCADO)).toBe("Avançado");
    });

    it("deve retornar o próprio valor para nível desconhecido", () => {
      expect(getNivelLabel("outro_nivel")).toBe("outro_nivel");
    });
  });

  describe("getGeneroLabel", () => {
    it("deve retornar 'Feminino' para FEMININO", () => {
      expect(getGeneroLabel(GeneroJogador.FEMININO)).toBe("Feminino");
    });

    it("deve retornar 'Masculino' para MASCULINO", () => {
      expect(getGeneroLabel(GeneroJogador.MASCULINO)).toBe("Masculino");
    });

    it("deve retornar o próprio valor para gênero desconhecido", () => {
      expect(getGeneroLabel("outro_genero")).toBe("outro_genero");
    });
  });

  describe("formatarData", () => {
    it("deve formatar data do Firestore com _seconds", () => {
      // Usar uma data/hora específica que resulta em 01/01/2024 em qualquer timezone
      // Usando meio-dia UTC
      const firestoreDate = { _seconds: 1704110400 }; // 2024-01-01 12:00:00 UTC
      const result = formatarData(firestoreDate);
      // Verificar que retorna uma data formatada (dd/mm/yyyy)
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });

    it("deve formatar string ISO", () => {
      // Usar uma data com hora específica para evitar problemas de timezone
      const result = formatarData("2024-06-15T12:00:00");
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });

    it("deve formatar objeto Date", () => {
      const date = new Date(2024, 5, 15, 12, 0, 0); // Junho 15, 2024 ao meio-dia local
      expect(formatarData(date)).toBe("15/06/2024");
    });

    it("deve retornar 'Data inválida' para null", () => {
      expect(formatarData(null)).toBe("Data inválida");
    });

    it("deve retornar 'Data inválida' para undefined", () => {
      expect(formatarData(undefined)).toBe("Data inválida");
    });

    it("deve retornar 'Data inválida' para string inválida", () => {
      expect(formatarData("data-invalida")).toBe("Data inválida");
    });

    it("deve retornar 'Data inválida' para objeto vazio", () => {
      expect(formatarData({})).toBe("Data inválida");
    });
  });
});
