/**
 * Testes do arrayUtils
 */

import {
  embaralhar,
  dividirEmChunks,
  removerDuplicatas,
} from "../../utils/arrayUtils";

describe("arrayUtils", () => {
  describe("embaralhar", () => {
    it("deve retornar array com mesmos elementos", () => {
      const original = [1, 2, 3, 4, 5];
      const embaralhado = embaralhar(original);

      expect(embaralhado).toHaveLength(original.length);
      expect(embaralhado.sort()).toEqual(original.sort());
    });

    it("não deve modificar array original", () => {
      const original = [1, 2, 3, 4, 5];
      const copia = [...original];
      embaralhar(original);

      expect(original).toEqual(copia);
    });

    it("deve funcionar com array vazio", () => {
      expect(embaralhar([])).toEqual([]);
    });

    it("deve funcionar com array de um elemento", () => {
      expect(embaralhar([1])).toEqual([1]);
    });

    it("deve funcionar com objetos", () => {
      const jogadores = [
        { id: 1, nome: "A" },
        { id: 2, nome: "B" },
        { id: 3, nome: "C" },
      ];

      const embaralhados = embaralhar(jogadores);

      expect(embaralhados).toHaveLength(3);
      expect(embaralhados.map((j) => j.id).sort()).toEqual([1, 2, 3]);
    });
  });

  describe("dividirEmChunks", () => {
    it("deve dividir array em chunks do tamanho especificado", () => {
      const nums = [1, 2, 3, 4, 5, 6];
      const chunks = dividirEmChunks(nums, 2);

      expect(chunks).toEqual([
        [1, 2],
        [3, 4],
        [5, 6],
      ]);
    });

    it("deve lidar com array não divisível uniformemente", () => {
      const nums = [1, 2, 3, 4, 5];
      const chunks = dividirEmChunks(nums, 2);

      expect(chunks).toEqual([[1, 2], [3, 4], [5]]);
    });

    it("deve funcionar com chunk maior que array", () => {
      const nums = [1, 2, 3];
      const chunks = dividirEmChunks(nums, 10);

      expect(chunks).toEqual([[1, 2, 3]]);
    });

    it("deve funcionar com array vazio", () => {
      expect(dividirEmChunks([], 3)).toEqual([]);
    });

    it("deve funcionar com chunks de 1", () => {
      const nums = [1, 2, 3];
      const chunks = dividirEmChunks(nums, 1);

      expect(chunks).toEqual([[1], [2], [3]]);
    });

    it("não deve modificar array original", () => {
      const original = [1, 2, 3, 4];
      const copia = [...original];
      dividirEmChunks(original, 2);

      expect(original).toEqual(copia);
    });
  });

  describe("removerDuplicatas", () => {
    it("deve remover duplicatas baseado em chave", () => {
      const jogadores = [
        { id: 1, nome: "A" },
        { id: 1, nome: "A duplicado" },
        { id: 2, nome: "B" },
      ];

      const unicos = removerDuplicatas(jogadores, (j) => j.id);

      expect(unicos).toHaveLength(2);
      expect(unicos.map((j) => j.id)).toEqual([1, 2]);
    });

    it("deve manter primeiro item quando há duplicatas", () => {
      const jogadores = [
        { id: 1, nome: "Primeiro" },
        { id: 1, nome: "Segundo" },
        { id: 1, nome: "Terceiro" },
      ];

      const unicos = removerDuplicatas(jogadores, (j) => j.id);

      expect(unicos).toHaveLength(1);
      expect(unicos[0].nome).toBe("Primeiro");
    });

    it("deve funcionar com chave string", () => {
      const items = [
        { email: "a@test.com", nome: "A" },
        { email: "b@test.com", nome: "B" },
        { email: "a@test.com", nome: "A duplicado" },
      ];

      const unicos = removerDuplicatas(items, (i) => i.email);

      expect(unicos).toHaveLength(2);
      expect(unicos.map((i) => i.email)).toEqual(["a@test.com", "b@test.com"]);
    });

    it("deve retornar array vazio para entrada vazia", () => {
      expect(removerDuplicatas([], (x: any) => x.id)).toEqual([]);
    });

    it("deve retornar mesmo array se não houver duplicatas", () => {
      const items = [
        { id: 1, nome: "A" },
        { id: 2, nome: "B" },
        { id: 3, nome: "C" },
      ];

      const unicos = removerDuplicatas(items, (i) => i.id);

      expect(unicos).toHaveLength(3);
      expect(unicos).toEqual(items);
    });

    it("não deve modificar array original", () => {
      const original = [
        { id: 1, nome: "A" },
        { id: 1, nome: "B" },
      ];
      const copia = [...original];
      removerDuplicatas(original, (i) => i.id);

      expect(original).toEqual(copia);
    });
  });
});
