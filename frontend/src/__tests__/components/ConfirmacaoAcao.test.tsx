/**
 * Testes do ConfirmacaoAcao (confirmações destrutivas padronizadas)
 */

import { render, screen, fireEvent } from "@testing-library/react";
import {
  ConfirmacaoAcao,
  PREDEFINICOES_ACAO,
  AcaoDestrutiva,
} from "@/components/modals/ConfirmacaoAcao";

const ACOES = Object.keys(PREDEFINICOES_ACAO) as AcaoDestrutiva[];

const renderizar = (acao: AcaoDestrutiva, onConfirm = jest.fn(), onClose = jest.fn()) =>
  render(
    <ConfirmacaoAcao acao={acao} isOpen onConfirm={onConfirm} onClose={onClose} />
  );

describe("ConfirmacaoAcao", () => {
  it("segue o padrão do ARCHITECTURE.md (palavra por ação)", () => {
    expect(PREDEFINICOES_ACAO.encerrarEtapa.palavraConfirmacao).toBe("ENCERRAR");
    expect(PREDEFINICOES_ACAO.cancelarEliminatoria.palavraConfirmacao).toBe("CANCELAR");
    expect(PREDEFINICOES_ACAO.excluirChaves.palavraConfirmacao).toBe("EXCLUIR");
  });

  it.each(ACOES)("%s: mostra título, mensagem e botão da predefinição", (acao) => {
    const predefinicao = PREDEFINICOES_ACAO[acao];
    renderizar(acao);

    expect(screen.getByText(predefinicao.titulo, { selector: "h2, h3, div" })).toBeInTheDocument();
    expect(screen.getByText(predefinicao.mensagem)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: predefinicao.textoBotao })).toBeInTheDocument();
  });

  it.each(ACOES)("%s: só confirma depois de digitar a palavra", (acao) => {
    const { palavraConfirmacao, textoBotao } = PREDEFINICOES_ACAO[acao];
    const onConfirm = jest.fn();
    renderizar(acao, onConfirm);

    const botao = screen.getByRole("button", { name: textoBotao });
    expect(botao).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText(`Digite "${palavraConfirmacao}"`), {
      target: { value: palavraConfirmacao.toLowerCase() },
    });
    expect(botao).not.toBeDisabled();

    fireEvent.click(botao);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("limpa a palavra digitada depois de confirmar", () => {
    const { palavraConfirmacao, textoBotao } = PREDEFINICOES_ACAO.encerrarEtapa;
    const { rerender } = renderizar("encerrarEtapa");
    const campo = screen.getByPlaceholderText(`Digite "${palavraConfirmacao}"`);

    fireEvent.change(campo, { target: { value: palavraConfirmacao } });
    fireEvent.click(screen.getByRole("button", { name: textoBotao }));

    rerender(
      <ConfirmacaoAcao acao="encerrarEtapa" isOpen onConfirm={jest.fn()} onClose={jest.fn()} />
    );
    expect(screen.getByPlaceholderText(`Digite "${palavraConfirmacao}"`)).toHaveValue("");
  });

  it("Cancelar fecha sem confirmar", () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();
    renderizar("excluirChaves", onConfirm, onClose);

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onClose).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("não renderiza fechado", () => {
    const { container } = render(
      <ConfirmacaoAcao acao="encerrarEtapa" isOpen={false} onConfirm={jest.fn()} onClose={jest.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
