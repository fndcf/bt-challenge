/**
 * Testes do componente ConfirmacaoPerigosa
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmacaoPerigosa } from "@/components/modals/ConfirmacaoPerigosa/ConfirmacaoPerigosa";

describe("ConfirmacaoPerigosa", () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    titulo: "Ação Perigosa",
    mensagem: "Esta ação é muito perigosa",
    palavraConfirmacao: "CONFIRMAR",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("renderização", () => {
    it("não deve renderizar quando isOpen é false", () => {
      const { container } = render(
        <ConfirmacaoPerigosa {...defaultProps} isOpen={false} />
      );
      expect(container.firstChild).toBeNull();
    });

    it("deve renderizar quando isOpen é true", () => {
      render(<ConfirmacaoPerigosa {...defaultProps} />);
      expect(screen.getByText("Ação Perigosa")).toBeInTheDocument();
    });

    it("deve mostrar o título", () => {
      render(
        <ConfirmacaoPerigosa {...defaultProps} titulo="Excluir Permanentemente" />
      );
      expect(screen.getByText("Excluir Permanentemente")).toBeInTheDocument();
    });

    it("deve mostrar a mensagem", () => {
      render(
        <ConfirmacaoPerigosa
          {...defaultProps}
          mensagem="Todos os dados serão perdidos"
        />
      );
      expect(
        screen.getByText("Todos os dados serão perdidos")
      ).toBeInTheDocument();
    });

    it("deve mostrar a palavra de confirmação", () => {
      render(
        <ConfirmacaoPerigosa {...defaultProps} palavraConfirmacao="DELETAR" />
      );
      expect(screen.getByText("DELETAR")).toBeInTheDocument();
    });

    it("deve mostrar placeholder com a palavra de confirmação", () => {
      render(
        <ConfirmacaoPerigosa {...defaultProps} palavraConfirmacao="APAGAR" />
      );
      expect(
        screen.getByPlaceholderText('Digite "APAGAR"')
      ).toBeInTheDocument();
    });
  });

  describe("input de confirmação", () => {
    it("deve desabilitar botão de confirmação quando input está vazio", () => {
      render(<ConfirmacaoPerigosa {...defaultProps} />);
      const confirmButton = screen.getByText("Confirmar").closest("button");
      expect(confirmButton).toBeDisabled();
    });

    it("deve desabilitar botão quando texto está incorreto", () => {
      render(<ConfirmacaoPerigosa {...defaultProps} />);
      const input = screen.getByPlaceholderText('Digite "CONFIRMAR"');

      fireEvent.change(input, { target: { value: "ERRADO" } });

      const confirmButton = screen.getByText("Confirmar").closest("button");
      expect(confirmButton).toBeDisabled();
    });

    it("deve habilitar botão quando texto está correto", () => {
      render(<ConfirmacaoPerigosa {...defaultProps} />);
      const input = screen.getByPlaceholderText('Digite "CONFIRMAR"');

      fireEvent.change(input, { target: { value: "CONFIRMAR" } });

      const confirmButton = screen.getByText("Confirmar").closest("button");
      expect(confirmButton).not.toBeDisabled();
    });

    it("deve aceitar texto case-insensitive", () => {
      render(<ConfirmacaoPerigosa {...defaultProps} />);
      const input = screen.getByPlaceholderText('Digite "CONFIRMAR"');

      fireEvent.change(input, { target: { value: "confirmar" } });

      const confirmButton = screen.getByText("Confirmar").closest("button");
      expect(confirmButton).not.toBeDisabled();
    });

    it("deve mostrar mensagem de texto incorreto", () => {
      render(<ConfirmacaoPerigosa {...defaultProps} />);
      const input = screen.getByPlaceholderText('Digite "CONFIRMAR"');

      fireEvent.change(input, { target: { value: "ERRADO" } });

      expect(screen.getByText("Texto incorreto")).toBeInTheDocument();
    });

    it("deve mostrar mensagem de texto correto", () => {
      render(<ConfirmacaoPerigosa {...defaultProps} />);
      const input = screen.getByPlaceholderText('Digite "CONFIRMAR"');

      fireEvent.change(input, { target: { value: "CONFIRMAR" } });

      expect(screen.getByText("Texto correto")).toBeInTheDocument();
    });
  });

  describe("botões", () => {
    it("deve mostrar botão Cancelar", () => {
      render(<ConfirmacaoPerigosa {...defaultProps} />);
      expect(screen.getByText("Cancelar")).toBeInTheDocument();
    });

    it("deve mostrar texto customizado no botão de confirmação", () => {
      render(
        <ConfirmacaoPerigosa {...defaultProps} textoBotao="Excluir Tudo" />
      );
      expect(screen.getByText("Excluir Tudo")).toBeInTheDocument();
    });

    it("deve chamar onClose ao clicar em Cancelar", () => {
      const onClose = jest.fn();
      render(<ConfirmacaoPerigosa {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByText("Cancelar"));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("deve chamar onConfirm ao clicar em Confirmar com texto correto", () => {
      const onConfirm = jest.fn();
      render(<ConfirmacaoPerigosa {...defaultProps} onConfirm={onConfirm} />);

      const input = screen.getByPlaceholderText('Digite "CONFIRMAR"');
      fireEvent.change(input, { target: { value: "CONFIRMAR" } });

      fireEvent.click(screen.getByText("Confirmar"));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it("não deve chamar onConfirm quando texto está incorreto", () => {
      const onConfirm = jest.fn();
      render(<ConfirmacaoPerigosa {...defaultProps} onConfirm={onConfirm} />);

      const input = screen.getByPlaceholderText('Digite "CONFIRMAR"');
      fireEvent.change(input, { target: { value: "ERRADO" } });

      // Força o clique mesmo com disabled
      const confirmButton = screen.getByText("Confirmar");
      fireEvent.click(confirmButton);

      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe("loading state", () => {
    it("deve mostrar spinner quando loading", () => {
      render(<ConfirmacaoPerigosa {...defaultProps} loading />);
      expect(screen.getByText("Processando...")).toBeInTheDocument();
    });

    it("deve desabilitar input quando loading", () => {
      render(<ConfirmacaoPerigosa {...defaultProps} loading />);
      const input = screen.getByPlaceholderText('Digite "CONFIRMAR"');
      expect(input).toBeDisabled();
    });

    it("deve desabilitar botão Cancelar quando loading", () => {
      render(<ConfirmacaoPerigosa {...defaultProps} loading />);
      expect(screen.getByText("Cancelar")).toBeDisabled();
    });

    it("deve desabilitar botão Confirmar quando loading", () => {
      render(<ConfirmacaoPerigosa {...defaultProps} loading />);
      // O botão mostra "Processando..." quando loading
      expect(screen.getByText("Processando...").closest("button")).toBeDisabled();
    });
  });

  describe("overlay", () => {
    it("deve chamar onClose ao clicar no overlay background", () => {
      const onClose = jest.fn();
      const { container } = render(
        <ConfirmacaoPerigosa {...defaultProps} onClose={onClose} />
      );

      // O OverlayBackground é o segundo elemento dentro do Overlay
      const allDivs = container.querySelectorAll("div");
      // Encontrar o overlay background (segundo div dentro do overlay)
      const overlayBackground = allDivs[1];
      if (overlayBackground) {
        fireEvent.click(overlayBackground);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });

    it("deve limpar input ao fechar", () => {
      const onClose = jest.fn();
      const { rerender } = render(
        <ConfirmacaoPerigosa {...defaultProps} onClose={onClose} />
      );

      const input = screen.getByPlaceholderText('Digite "CONFIRMAR"');
      fireEvent.change(input, { target: { value: "CONFIRMAR" } });

      fireEvent.click(screen.getByText("Cancelar"));

      // Reabrir o modal
      rerender(<ConfirmacaoPerigosa {...defaultProps} onClose={onClose} />);

      const newInput = screen.getByPlaceholderText('Digite "CONFIRMAR"');
      expect(newInput).toHaveValue("");
    });
  });
});
