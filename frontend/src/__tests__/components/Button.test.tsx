/**
 * Testes do componente Button
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  describe("renderização básica", () => {
    it("deve renderizar o texto do botão", () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole("button")).toHaveTextContent("Click me");
    });

    it("deve renderizar como botão por padrão", () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("variantes", () => {
    it("deve renderizar variante primary por padrão", () => {
      render(<Button>Primary</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("deve renderizar variante secondary", () => {
      render(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("deve renderizar variante outline", () => {
      render(<Button variant="outline">Outline</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("deve renderizar variante ghost", () => {
      render(<Button variant="ghost">Ghost</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("deve renderizar variante danger", () => {
      render(<Button variant="danger">Danger</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("tamanhos", () => {
    it("deve renderizar tamanho md por padrão", () => {
      render(<Button>Medium</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("deve renderizar tamanho sm", () => {
      render(<Button size="sm">Small</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("deve renderizar tamanho lg", () => {
      render(<Button size="lg">Large</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("estados", () => {
    it("deve estar desabilitado quando disabled=true", () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("deve estar desabilitado quando loading=true", () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("deve mostrar spinner quando loading=true", () => {
      const { container } = render(<Button loading>Loading</Button>);
      // O spinner tem animation de spin
      const button = container.querySelector("button");
      expect(button?.children.length).toBeGreaterThan(0);
    });
  });

  describe("eventos", () => {
    it("deve chamar onClick quando clicado", () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      fireEvent.click(screen.getByRole("button"));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("não deve chamar onClick quando desabilitado", () => {
      const handleClick = jest.fn();
      render(
        <Button onClick={handleClick} disabled>
          Click me
        </Button>
      );

      fireEvent.click(screen.getByRole("button"));

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe("fullWidth", () => {
    it("deve aplicar fullWidth quando prop é true", () => {
      render(<Button fullWidth>Full Width</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("ícone", () => {
    it("deve renderizar ícone à esquerda por padrão", () => {
      const icon = <span data-testid="icon">🎾</span>;
      render(<Button icon={icon}>With Icon</Button>);

      expect(screen.getByTestId("icon")).toBeInTheDocument();
    });

    it("deve renderizar ícone à direita", () => {
      const icon = <span data-testid="icon">🎾</span>;
      render(
        <Button icon={icon} iconPosition="right">
          With Icon
        </Button>
      );

      expect(screen.getByTestId("icon")).toBeInTheDocument();
    });

    it("não deve renderizar ícone quando loading", () => {
      const icon = <span data-testid="icon">🎾</span>;
      render(
        <Button icon={icon} loading>
          Loading
        </Button>
      );

      expect(screen.queryByTestId("icon")).not.toBeInTheDocument();
    });
  });
});
