/**
 * Testes do componente Input
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { Input } from "@/components/ui/Input";

describe("Input", () => {
  describe("renderização básica", () => {
    it("deve renderizar o input", () => {
      render(<Input />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("deve renderizar com label", () => {
      render(<Input label="Nome" />);
      expect(screen.getByText("Nome")).toBeInTheDocument();
    });

    it("deve renderizar com placeholder", () => {
      render(<Input placeholder="Digite seu nome" />);
      expect(screen.getByPlaceholderText("Digite seu nome")).toBeInTheDocument();
    });
  });

  describe("erro e helper text", () => {
    it("deve mostrar mensagem de erro", () => {
      render(<Input error="Campo obrigatório" />);
      expect(screen.getByText("Campo obrigatório")).toBeInTheDocument();
    });

    it("deve mostrar helper text", () => {
      render(<Input helperText="Dica: use seu nome completo" />);
      expect(screen.getByText("Dica: use seu nome completo")).toBeInTheDocument();
    });

    it("deve mostrar erro ao invés de helper text quando ambos estão presentes", () => {
      render(
        <Input
          error="Campo inválido"
          helperText="Dica: use seu nome completo"
        />
      );
      expect(screen.getByText("Campo inválido")).toBeInTheDocument();
      expect(
        screen.queryByText("Dica: use seu nome completo")
      ).not.toBeInTheDocument();
    });
  });

  describe("tamanhos", () => {
    it("deve renderizar com tamanho pequeno", () => {
      render(<Input inputSize="sm" data-testid="input-sm" />);
      expect(screen.getByTestId("input-sm")).toBeInTheDocument();
    });

    it("deve renderizar com tamanho médio (padrão)", () => {
      render(<Input inputSize="md" data-testid="input-md" />);
      expect(screen.getByTestId("input-md")).toBeInTheDocument();
    });

    it("deve renderizar com tamanho grande", () => {
      render(<Input inputSize="lg" data-testid="input-lg" />);
      expect(screen.getByTestId("input-lg")).toBeInTheDocument();
    });
  });

  describe("ícone", () => {
    it("deve renderizar ícone à esquerda", () => {
      const icon = <span data-testid="icon">🔍</span>;
      render(<Input icon={icon} iconPosition="left" />);
      expect(screen.getByTestId("icon")).toBeInTheDocument();
    });

    it("deve renderizar ícone à direita", () => {
      const icon = <span data-testid="icon">✓</span>;
      render(<Input icon={icon} iconPosition="right" />);
      expect(screen.getByTestId("icon")).toBeInTheDocument();
    });
  });

  describe("fullWidth", () => {
    it("deve renderizar com fullWidth", () => {
      const { container } = render(<Input fullWidth />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("estados", () => {
    it("deve estar desabilitado quando disabled=true", () => {
      render(<Input disabled />);
      expect(screen.getByRole("textbox")).toBeDisabled();
    });

    it("deve aceitar required", () => {
      render(<Input label="Nome" required />);
      expect(screen.getByRole("textbox")).toBeRequired();
    });
  });

  describe("eventos", () => {
    it("deve chamar onChange quando o valor muda", () => {
      const handleChange = jest.fn();
      render(<Input onChange={handleChange} />);

      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "teste" },
      });

      expect(handleChange).toHaveBeenCalled();
    });

    it("deve chamar onFocus quando recebe foco", () => {
      const handleFocus = jest.fn();
      render(<Input onFocus={handleFocus} />);

      fireEvent.focus(screen.getByRole("textbox"));

      expect(handleFocus).toHaveBeenCalled();
    });

    it("deve chamar onBlur quando perde foco", () => {
      const handleBlur = jest.fn();
      render(<Input onBlur={handleBlur} />);

      fireEvent.blur(screen.getByRole("textbox"));

      expect(handleBlur).toHaveBeenCalled();
    });
  });

  describe("tipos de input", () => {
    it("deve renderizar input de email", () => {
      render(<Input type="email" />);
      expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");
    });

    it("deve renderizar input de password", () => {
      render(<Input type="password" data-testid="password-input" />);
      expect(screen.getByTestId("password-input")).toHaveAttribute(
        "type",
        "password"
      );
    });

    it("deve renderizar input numérico", () => {
      render(<Input type="number" data-testid="number-input" />);
      expect(screen.getByTestId("number-input")).toHaveAttribute(
        "type",
        "number"
      );
    });
  });

  describe("ref forwarding", () => {
    it("deve encaminhar ref para o input", () => {
      const ref = { current: null };
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });
});
