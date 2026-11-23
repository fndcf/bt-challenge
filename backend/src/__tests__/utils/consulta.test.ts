/**
 * Leitura dos filtros da URL
 */

import { StatusEtapa } from "../../models/Etapa";
import { lerNumero, lerOpcao, lerTexto, ORDENS } from "../../utils/consulta";
import { BadRequestError } from "../../utils/errors";

describe("lerOpcao", () => {
  it("aceita valor de enum e de lista", () => {
    expect(lerOpcao("finalizada", StatusEtapa, "status")).toBe(
      StatusEtapa.FINALIZADA
    );
    expect(lerOpcao("desc", ORDENS, "ordem")).toBe("desc");
  });

  it.each([undefined, ""])("sem valor (%p) não filtra", (valor) => {
    expect(lerOpcao(valor, ORDENS, "ordem")).toBeUndefined();
  });

  it.each([["outro"], [["asc", "desc"]], [1]])(
    "valor fora da lista (%p) é erro com o nome do filtro",
    (valor) => {
      expect(() => lerOpcao(valor, ORDENS, "ordem")).toThrow(
        new BadRequestError("Filtro inválido: ordem")
      );
    }
  );
});

describe("lerTexto", () => {
  it.each([
    ["ana", "ana"],
    [["ana", "bia"], "ana"],
    ["", undefined],
    [undefined, undefined],
  ])("%p vira %p", (valor, esperado) => {
    expect(lerTexto(valor)).toBe(esperado);
  });
});

describe("lerNumero", () => {
  it.each([
    ["10", 50, 10],
    [undefined, 50, 50],
    ["abc", 0, 0],
    [undefined, undefined, undefined],
  ])("%p com padrão %p vira %p", (valor, padrao, esperado) => {
    expect(lerNumero(valor, padrao)).toBe(esperado);
  });
});
