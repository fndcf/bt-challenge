/**
 * Testes do utilitário de desempate de posições em grupos
 */

import {
  ordenarComDesempate,
  mesmosIds,
  listarEmpatesPendentes,
  garantirSemEmpatesPendentes,
} from "../../utils/desempate";
import { EmpatePendente } from "../../models/Etapa";

interface Item {
  id: string;
  pontos: number;
}

const comparar = (a: Item, b: Item) => b.pontos - a.pontos;
const getId = (i: Item) => i.id;

describe("utils/desempate", () => {
  describe("mesmosIds", () => {
    it("deve ignorar a ordem", () => {
      expect(mesmosIds(["a", "b", "c"], ["c", "a", "b"])).toBe(true);
    });

    it("deve rejeitar tamanhos diferentes", () => {
      expect(mesmosIds(["a", "b"], ["a", "b", "c"])).toBe(false);
    });

    it("deve rejeitar ids repetidos", () => {
      expect(mesmosIds(["a", "b"], ["a", "a"])).toBe(false);
    });
  });

  describe("ordenarComDesempate", () => {
    it("deve ordenar pelos critérios sem empates", () => {
      const itens = [
        { id: "a", pontos: 3 },
        { id: "b", pontos: 9 },
        { id: "c", pontos: 6 },
      ];

      const { ordenados, empates } = ordenarComDesempate(itens, comparar, getId);

      expect(ordenados.map(getId)).toEqual(["b", "c", "a"]);
      expect(empates).toEqual([]);
    });

    it("deve detectar bloco empatado com a posição inicial", () => {
      // Cenário da imagem: 1º isolado, 2º e 3º empatados, 4º isolado
      const itens = [
        { id: "neto", pontos: 0 },
        { id: "lipe", pontos: 6 },
        { id: "fernando", pontos: 9 },
        { id: "davi", pontos: 6 },
      ];

      const { ordenados, empates } = ordenarComDesempate(itens, comparar, getId);

      expect(ordenados.map(getId)).toEqual(["fernando", "davi", "lipe", "neto"]);
      expect(empates).toEqual([{ posicaoInicial: 2, ids: ["davi", "lipe"] }]);
    });

    it("deve detectar múltiplos blocos empatados", () => {
      const itens = [
        { id: "a", pontos: 6 },
        { id: "b", pontos: 6 },
        { id: "c", pontos: 0 },
        { id: "d", pontos: 0 },
        { id: "e", pontos: 0 },
      ];

      const { empates } = ordenarComDesempate(itens, comparar, getId);

      expect(empates).toEqual([
        { posicaoInicial: 1, ids: ["a", "b"] },
        { posicaoInicial: 3, ids: ["c", "d", "e"] },
      ]);
    });

    it("deve ser determinístico (sem sorteio) para empates não resolvidos", () => {
      const itens = [
        { id: "z", pontos: 3 },
        { id: "m", pontos: 3 },
        { id: "a", pontos: 3 },
      ];

      for (let i = 0; i < 10; i++) {
        const { ordenados } = ordenarComDesempate(itens, comparar, getId);
        expect(ordenados.map(getId)).toEqual(["a", "m", "z"]);
      }
    });

    it("deve aplicar a ordem definida pelo admin e não reportar o empate", () => {
      const itens = [
        { id: "fernando", pontos: 9 },
        { id: "davi", pontos: 6 },
        { id: "lipe", pontos: 6 },
      ];

      const { ordenados, empates } = ordenarComDesempate(itens, comparar, getId, [
        { ids: ["lipe", "davi"], modo: "manual" },
      ]);

      expect(ordenados.map(getId)).toEqual(["fernando", "lipe", "davi"]);
      expect(empates).toEqual([]);
    });

    it("deve ignorar desempate de outro conjunto (bloco mudou após edição de resultado)", () => {
      const itens = [
        { id: "a", pontos: 6 },
        { id: "b", pontos: 6 },
        { id: "c", pontos: 6 },
      ];

      const { empates } = ordenarComDesempate(itens, comparar, getId, [
        { ids: ["b", "a"], modo: "sorteio" },
      ]);

      expect(empates).toEqual([{ posicaoInicial: 1, ids: ["a", "b", "c"] }]);
    });

    it("não deve modificar o array original", () => {
      const itens = [
        { id: "a", pontos: 3 },
        { id: "b", pontos: 9 },
      ];

      ordenarComDesempate(itens, comparar, getId);

      expect(itens.map(getId)).toEqual(["a", "b"]);
    });
  });

  describe("listarEmpatesPendentes / garantirSemEmpatesPendentes", () => {
    const empate = (grupoNome: string, posicaoInicial: number): EmpatePendente => ({
      grupoId: grupoNome,
      grupoNome,
      posicaoInicial,
      participantes: [
        { id: "x", nome: "X" },
        { id: "y", nome: "Y" },
      ],
    });

    it("deve achatar e ordenar por grupo e posição", () => {
      const etapa = {
        empatesPendentes: {
          gB: [empate("Grupo B", 1)],
          gA: [empate("Grupo A", 3), empate("Grupo A", 1)],
        },
      };

      const lista = listarEmpatesPendentes(etapa);

      expect(lista.map((e) => `${e.grupoNome}:${e.posicaoInicial}`)).toEqual([
        "Grupo A:1",
        "Grupo A:3",
        "Grupo B:1",
      ]);
    });

    it("deve retornar vazio para etapa sem empates", () => {
      expect(listarEmpatesPendentes({})).toEqual([]);
      expect(listarEmpatesPendentes(null)).toEqual([]);
    });

    it("deve lançar erro listando os grupos com empate", () => {
      const etapa = { empatesPendentes: { gA: [empate("Grupo A", 2)] } };

      expect(() =>
        garantirSemEmpatesPendentes(etapa, "gerar a fase eliminatória")
      ).toThrow(
        "Não é possível gerar a fase eliminatória: há empate pendente em Grupo A"
      );
    });

    it("não deve lançar erro sem empates", () => {
      expect(() => garantirSemEmpatesPendentes({}, "encerrar a etapa")).not.toThrow();
    });
  });
});
