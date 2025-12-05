/**
 * Testes do componente Card
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { Card } from "@/components/ui/Card";

describe("Card", () => {
  describe("renderização básica", () => {
    it("deve renderizar o conteúdo do card", () => {
      render(<Card>Conteúdo do card</Card>);
      expect(screen.getByText("Conteúdo do card")).toBeInTheDocument();
    });

    it("deve usar variante default por padrão", () => {
      const { container } = render(<Card>Conteúdo</Card>);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("variantes", () => {
    it("deve renderizar variante outlined", () => {
      const { container } = render(<Card variant="outlined">Outlined</Card>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("deve renderizar variante elevated", () => {
      const { container } = render(<Card variant="elevated">Elevated</Card>);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("padding", () => {
    it("deve renderizar sem padding", () => {
      const { container } = render(<Card padding="none">No Padding</Card>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("deve renderizar com padding pequeno", () => {
      const { container } = render(<Card padding="sm">Small Padding</Card>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("deve renderizar com padding grande", () => {
      const { container } = render(<Card padding="lg">Large Padding</Card>);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("estados interativos", () => {
    it("deve aceitar prop hoverable", () => {
      const { container } = render(<Card hoverable>Hoverable</Card>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("deve aceitar prop clickable", () => {
      const { container } = render(<Card clickable>Clickable</Card>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("deve aceitar onClick quando clickable", () => {
      const handleClick = jest.fn();
      render(
        <Card clickable onClick={handleClick}>
          Clickable
        </Card>
      );

      fireEvent.click(screen.getByText("Clickable"));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("subcomponents", () => {
    it("deve renderizar Card.Header", () => {
      render(
        <Card>
          <Card.Header>Header Content</Card.Header>
        </Card>
      );

      expect(screen.getByText("Header Content")).toBeInTheDocument();
    });

    it("deve renderizar Card.Title", () => {
      render(
        <Card>
          <Card.Title>Título do Card</Card.Title>
        </Card>
      );

      expect(screen.getByText("Título do Card")).toBeInTheDocument();
    });

    it("deve renderizar Card.Description", () => {
      render(
        <Card>
          <Card.Description>Descrição do card</Card.Description>
        </Card>
      );

      expect(screen.getByText("Descrição do card")).toBeInTheDocument();
    });

    it("deve renderizar Card.Body", () => {
      render(
        <Card>
          <Card.Body>Corpo do card</Card.Body>
        </Card>
      );

      expect(screen.getByText("Corpo do card")).toBeInTheDocument();
    });

    it("deve renderizar Card.Footer", () => {
      render(
        <Card>
          <Card.Footer>Footer Content</Card.Footer>
        </Card>
      );

      expect(screen.getByText("Footer Content")).toBeInTheDocument();
    });

    it("deve renderizar estrutura completa do card", () => {
      render(
        <Card>
          <Card.Header>
            <Card.Title>Título</Card.Title>
            <Card.Description>Descrição</Card.Description>
          </Card.Header>
          <Card.Body>Conteúdo principal</Card.Body>
          <Card.Footer>Botões</Card.Footer>
        </Card>
      );

      expect(screen.getByText("Título")).toBeInTheDocument();
      expect(screen.getByText("Descrição")).toBeInTheDocument();
      expect(screen.getByText("Conteúdo principal")).toBeInTheDocument();
      expect(screen.getByText("Botões")).toBeInTheDocument();
    });
  });

  describe("props HTML", () => {
    it("deve aceitar className", () => {
      const { container } = render(
        <Card className="custom-class">Conteúdo</Card>
      );
      expect(container.firstChild).toHaveClass("custom-class");
    });

    it("deve aceitar data-testid", () => {
      render(<Card data-testid="my-card">Conteúdo</Card>);
      expect(screen.getByTestId("my-card")).toBeInTheDocument();
    });
  });
});
