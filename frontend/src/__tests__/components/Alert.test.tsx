/**
 * Testes do componente Alert
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { Alert } from "@/components/ui/Alert";

describe("Alert", () => {
  describe("renderização básica", () => {
    it("deve renderizar o conteúdo da mensagem", () => {
      render(<Alert>Mensagem de alerta</Alert>);
      expect(screen.getByText("Mensagem de alerta")).toBeInTheDocument();
    });

    it("deve renderizar com título", () => {
      render(<Alert title="Atenção">Mensagem de alerta</Alert>);
      expect(screen.getByText("Atenção")).toBeInTheDocument();
      expect(screen.getByText("Mensagem de alerta")).toBeInTheDocument();
    });
  });

  describe("variantes", () => {
    it("deve renderizar variante info (padrão)", () => {
      const { container } = render(<Alert>Info</Alert>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("deve renderizar variante success", () => {
      const { container } = render(<Alert variant="success">Sucesso</Alert>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("deve renderizar variante warning", () => {
      const { container } = render(<Alert variant="warning">Aviso</Alert>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("deve renderizar variante error", () => {
      const { container } = render(<Alert variant="error">Erro</Alert>);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("ícone", () => {
    it("deve renderizar ícone padrão para cada variante", () => {
      const { rerender, container } = render(<Alert>Info</Alert>);
      expect(container.querySelector("svg")).toBeInTheDocument();

      rerender(<Alert variant="success">Sucesso</Alert>);
      expect(container.querySelector("svg")).toBeInTheDocument();

      rerender(<Alert variant="warning">Aviso</Alert>);
      expect(container.querySelector("svg")).toBeInTheDocument();

      rerender(<Alert variant="error">Erro</Alert>);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("deve renderizar ícone customizado", () => {
      const customIcon = <span data-testid="custom-icon">⚡</span>;
      render(<Alert icon={customIcon}>Custom Icon</Alert>);
      expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    });
  });

  describe("botão de fechar", () => {
    it("deve mostrar botão de fechar quando onClose é fornecido", () => {
      const handleClose = jest.fn();
      render(<Alert onClose={handleClose}>Fechável</Alert>);
      expect(screen.getByRole("button", { name: /fechar/i })).toBeInTheDocument();
    });

    it("não deve mostrar botão de fechar quando onClose não é fornecido", () => {
      render(<Alert>Não fechável</Alert>);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("deve chamar onClose quando botão é clicado", () => {
      const handleClose = jest.fn();
      render(<Alert onClose={handleClose}>Fechável</Alert>);

      fireEvent.click(screen.getByRole("button", { name: /fechar/i }));

      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("acessibilidade", () => {
    it("deve ter aria-label no botão de fechar", () => {
      const handleClose = jest.fn();
      render(<Alert onClose={handleClose}>Fechável</Alert>);
      expect(
        screen.getByRole("button", { name: /fechar alerta/i })
      ).toBeInTheDocument();
    });
  });

  describe("uso completo", () => {
    it("deve renderizar alert completo com título, mensagem e fechar", () => {
      const handleClose = jest.fn();

      render(
        <Alert
          variant="success"
          title="Operação concluída"
          onClose={handleClose}
        >
          A operação foi realizada com sucesso.
        </Alert>
      );

      expect(screen.getByText("Operação concluída")).toBeInTheDocument();
      expect(
        screen.getByText("A operação foi realizada com sucesso.")
      ).toBeInTheDocument();
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });
});
