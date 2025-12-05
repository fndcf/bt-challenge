/**
 * Testes do componente ConfirmDeleteModal
 */

import { render, screen, fireEvent } from "@testing-library/react";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal/ConfirmDeleteModal";

describe("ConfirmDeleteModal", () => {
  const defaultProps = {
    isOpen: true,
    title: "Confirmar Exclusão",
    message: "Tem certeza que deseja excluir?",
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("renderização", () => {
    it("não deve renderizar quando isOpen é false", () => {
      const { container } = render(
        <ConfirmDeleteModal {...defaultProps} isOpen={false} />
      );
      expect(container.firstChild).toBeNull();
    });

    it("deve renderizar quando isOpen é true", () => {
      render(<ConfirmDeleteModal {...defaultProps} />);
      expect(screen.getByText("Confirmar Exclusão")).toBeInTheDocument();
    });

    it("deve mostrar o título", () => {
      render(<ConfirmDeleteModal {...defaultProps} title="Deletar Jogador" />);
      expect(screen.getByText("Deletar Jogador")).toBeInTheDocument();
    });

    it("deve mostrar a mensagem", () => {
      render(
        <ConfirmDeleteModal
          {...defaultProps}
          message="Esta ação é irreversível"
        />
      );
      expect(screen.getByText("Esta ação é irreversível")).toBeInTheDocument();
    });

    it("deve mostrar aviso de ação irreversível", () => {
      render(<ConfirmDeleteModal {...defaultProps} />);
      expect(
        screen.getByText("Esta ação não pode ser desfeita!")
      ).toBeInTheDocument();
    });
  });

  describe("itemName", () => {
    it("deve mostrar itemName quando fornecido", () => {
      render(
        <ConfirmDeleteModal {...defaultProps} itemName="João da Silva" />
      );
      expect(screen.getByText("João da Silva")).toBeInTheDocument();
    });

    it("não deve mostrar highlight quando itemName não é fornecido", () => {
      render(<ConfirmDeleteModal {...defaultProps} />);
      expect(screen.queryByRole("strong")).toBeNull();
    });
  });

  describe("botões", () => {
    it("deve mostrar botão Cancelar", () => {
      render(<ConfirmDeleteModal {...defaultProps} />);
      expect(screen.getByText("Cancelar")).toBeInTheDocument();
    });

    it("deve mostrar botão Sim, Deletar", () => {
      render(<ConfirmDeleteModal {...defaultProps} />);
      expect(screen.getByText("Sim, Deletar")).toBeInTheDocument();
    });

    it("deve chamar onCancel ao clicar em Cancelar", () => {
      const onCancel = jest.fn();
      render(<ConfirmDeleteModal {...defaultProps} onCancel={onCancel} />);

      fireEvent.click(screen.getByText("Cancelar"));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("deve chamar onConfirm ao clicar em Sim, Deletar", () => {
      const onConfirm = jest.fn();
      render(<ConfirmDeleteModal {...defaultProps} onConfirm={onConfirm} />);

      fireEvent.click(screen.getByText("Sim, Deletar"));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe("loading state", () => {
    it("deve mostrar 'Deletando...' quando loading", () => {
      render(<ConfirmDeleteModal {...defaultProps} loading />);
      expect(screen.getByText("Deletando...")).toBeInTheDocument();
    });

    it("deve desabilitar botões quando loading", () => {
      render(<ConfirmDeleteModal {...defaultProps} loading />);
      expect(screen.getByText("Cancelar")).toBeDisabled();
      expect(screen.getByText("Deletando...")).toBeDisabled();
    });

    it("não deve chamar onConfirm quando loading", () => {
      const onConfirm = jest.fn();
      render(
        <ConfirmDeleteModal {...defaultProps} onConfirm={onConfirm} loading />
      );

      fireEvent.click(screen.getByText("Deletando..."));
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe("overlay", () => {
    it("deve chamar onCancel ao clicar no overlay", () => {
      const onCancel = jest.fn();
      const { container } = render(
        <ConfirmDeleteModal {...defaultProps} onCancel={onCancel} />
      );

      // O overlay é o primeiro elemento
      const overlay = container.firstChild as HTMLElement;
      fireEvent.click(overlay);
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("não deve chamar onCancel ao clicar no conteúdo do modal", () => {
      const onCancel = jest.fn();
      render(<ConfirmDeleteModal {...defaultProps} onCancel={onCancel} />);

      // Clicar no título (dentro do modal)
      fireEvent.click(screen.getByText("Confirmar Exclusão"));
      expect(onCancel).not.toHaveBeenCalled();
    });
  });
});
