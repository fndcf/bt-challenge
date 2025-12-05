/**
 * Testes do componente Modal
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { Modal } from "@/components/ui/Modal";

describe("Modal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    children: <div>Conteúdo do modal</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("renderização", () => {
    it("deve renderizar quando isOpen é true", () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByText("Conteúdo do modal")).toBeInTheDocument();
    });

    it("não deve renderizar quando isOpen é false", () => {
      render(<Modal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText("Conteúdo do modal")).not.toBeInTheDocument();
    });

    it("deve renderizar com título", () => {
      render(<Modal {...defaultProps} title="Título do Modal" />);
      expect(screen.getByText("Título do Modal")).toBeInTheDocument();
    });

    it("deve renderizar com footer", () => {
      render(
        <Modal {...defaultProps} footer={<button>Confirmar</button>} />
      );
      expect(screen.getByText("Confirmar")).toBeInTheDocument();
    });
  });

  describe("tamanhos", () => {
    it("deve renderizar com tamanho pequeno", () => {
      render(<Modal {...defaultProps} size="sm" />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("deve renderizar com tamanho médio (padrão)", () => {
      render(<Modal {...defaultProps} size="md" />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("deve renderizar com tamanho grande", () => {
      render(<Modal {...defaultProps} size="lg" />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("deve renderizar com tamanho extra grande", () => {
      render(<Modal {...defaultProps} size="xl" />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("deve renderizar em tela cheia", () => {
      render(<Modal {...defaultProps} size="full" />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("fechar modal", () => {
    it("deve chamar onClose ao clicar no botão de fechar", () => {
      const onClose = jest.fn();
      render(<Modal {...defaultProps} title="Modal" onClose={onClose} />);

      fireEvent.click(screen.getByRole("button", { name: /fechar/i }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("deve chamar onClose ao pressionar Escape", () => {
      const onClose = jest.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: "Escape" });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("não deve fechar com Escape quando closeOnEscape é false", () => {
      const onClose = jest.fn();
      render(
        <Modal {...defaultProps} onClose={onClose} closeOnEscape={false} />
      );

      fireEvent.keyDown(document, { key: "Escape" });

      expect(onClose).not.toHaveBeenCalled();
    });

    it("deve chamar onClose ao clicar no overlay", () => {
      const onClose = jest.fn();
      const { container } = render(
        <Modal {...defaultProps} onClose={onClose} />
      );

      // O overlay é o primeiro elemento filho do portal
      const overlay = container.parentElement?.querySelector('[class*="Overlay"]');
      if (overlay) {
        fireEvent.click(overlay);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });

    it("não deve fechar ao clicar no overlay quando closeOnOverlayClick é false", () => {
      const onClose = jest.fn();
      const { container } = render(
        <Modal
          {...defaultProps}
          onClose={onClose}
          closeOnOverlayClick={false}
        />
      );

      const overlay = container.parentElement?.querySelector('[class*="Overlay"]');
      if (overlay) {
        fireEvent.click(overlay);
        expect(onClose).not.toHaveBeenCalled();
      }
    });
  });

  describe("acessibilidade", () => {
    it("deve ter role dialog", () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("deve ter aria-modal true", () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
    });

    it("deve ter aria-label no botão de fechar", () => {
      render(<Modal {...defaultProps} title="Modal" />);
      expect(
        screen.getByRole("button", { name: /fechar modal/i })
      ).toBeInTheDocument();
    });
  });

  describe("scroll lock", () => {
    it("deve bloquear scroll do body quando aberto", () => {
      render(<Modal {...defaultProps} isOpen={true} />);
      expect(document.body.style.overflow).toBe("hidden");
    });

    it("deve restaurar scroll do body quando fechado", () => {
      const { rerender } = render(<Modal {...defaultProps} isOpen={true} />);

      rerender(<Modal {...defaultProps} isOpen={false} />);

      expect(document.body.style.overflow).toBe("");
    });

    it("deve restaurar scroll do body ao desmontar", () => {
      const { unmount } = render(<Modal {...defaultProps} isOpen={true} />);

      unmount();

      expect(document.body.style.overflow).toBe("");
    });
  });
});
