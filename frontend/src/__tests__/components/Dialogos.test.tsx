/**
 * Confirmações e avisos do sistema (no lugar de window.confirm e alert)
 */

import { act, fireEvent, render, screen } from "@testing-library/react";
import { Dialogos } from "@/components/common/Dialogos";
import { ToastProvider } from "@/components/ui";
import {
  avisarAtencao,
  avisarErro,
  avisarSucesso,
  confirmar,
} from "@/utils/dialogos";

const montar = () =>
  render(
    <ToastProvider>
      <Dialogos />
    </ToastProvider>
  );

const perguntar = (titulo = "Excluir Etapa") => {
  let resposta!: Promise<boolean>;
  act(() => {
    resposta = confirmar({
      titulo,
      mensagem: "Tem certeza?",
      textoConfirmar: "Excluir",
      perigo: true,
    });
  });
  return resposta;
};

describe("Dialogos", () => {
  it("não usa os diálogos do navegador, que o iPhone pode suprimir", async () => {
    const nativo = jest.spyOn(window, "confirm").mockReturnValue(false);
    montar();

    const resposta = perguntar();
    expect(screen.getByRole("dialog")).toHaveTextContent("Tem certeza?");
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

    await expect(resposta).resolves.toBe(true);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(nativo).not.toHaveBeenCalled();
  });

  it.each(["Cancelar", "Fechar modal"])("%s vale como não", async (botao) => {
    montar();

    const resposta = perguntar();
    fireEvent.click(screen.getByRole("button", { name: botao }));

    await expect(resposta).resolves.toBe(false);
  });

  it("uma pergunta nova cancela a anterior", async () => {
    montar();

    const primeira = perguntar("Primeira");
    const segunda = perguntar("Segunda");
    await expect(primeira).resolves.toBe(false);

    expect(screen.getByRole("dialog")).toHaveTextContent("Segunda");
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    await expect(segunda).resolves.toBe(true);
  });

  it("sem quem desenhe a pergunta, vale não", async () => {
    await expect(perguntar()).resolves.toBe(false);
  });

  it("mostra os avisos, com erro anunciado na hora", () => {
    montar();
    act(() => {
      avisarSucesso("Salvo");
      avisarAtencao("Cuidado");
      avisarErro("Falhou");
    });

    expect(screen.getAllByRole("status").map((e) => e.textContent)).toEqual([
      "Salvo",
      "Cuidado",
    ]);
    expect(screen.getByRole("alert")).toHaveTextContent("Falhou");
  });

  it("mostra o aviso deixado antes de recarregar, uma vez só", () => {
    sessionStorage.setItem("avisoAposRecarregar", "Etapa encerrada!");

    const { unmount } = montar();
    expect(screen.getByRole("status")).toHaveTextContent("Etapa encerrada!");
    unmount();

    montar();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
