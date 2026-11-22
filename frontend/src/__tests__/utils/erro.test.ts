import { getCodigoErro, getMensagemErro, paraError } from "@/utils/erro";

describe("utils/erro", () => {
  it.each([
    [new Error("falhou"), "falhou"],
    [{ message: "do objeto" }, "do objeto"],
    [{ message: "" }, "padrão"],
    [{ message: 42 }, "padrão"],
    ["texto solto", "padrão"],
    [null, "padrão"],
    [undefined, "padrão"],
  ])("mensagem de %p é %s", (erro, esperado) => {
    expect(getMensagemErro(erro, "padrão")).toBe(esperado);
  });

  it("lê o código do Firebase", () => {
    expect(getCodigoErro({ code: "auth/user-disabled" })).toBe(
      "auth/user-disabled"
    );
    expect(getCodigoErro(new Error("x"))).toBeUndefined();
  });

  it("mantém o Error original e converte o resto", () => {
    const original = new Error("x");
    expect(paraError(original)).toBe(original);
    expect(paraError({ message: "y" }).message).toBe("y");
    expect(paraError(null).message).toBe("Erro desconhecido");
  });
});
