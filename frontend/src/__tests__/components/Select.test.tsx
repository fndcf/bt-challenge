/**
 * Testes do componente Select
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { Select } from "@/components/ui/Select";

const defaultOptions = [
  { value: "option1", label: "Opção 1" },
  { value: "option2", label: "Opção 2" },
  { value: "option3", label: "Opção 3" },
];

describe("Select", () => {
  describe("renderização básica", () => {
    it("deve renderizar o select", () => {
      render(<Select options={defaultOptions} />);
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("deve renderizar todas as opções", () => {
      render(<Select options={defaultOptions} />);
      expect(screen.getByText("Opção 1")).toBeInTheDocument();
      expect(screen.getByText("Opção 2")).toBeInTheDocument();
      expect(screen.getByText("Opção 3")).toBeInTheDocument();
    });

    it("deve renderizar com label", () => {
      render(<Select label="Categoria" options={defaultOptions} />);
      expect(screen.getByText("Categoria")).toBeInTheDocument();
    });

    it("deve renderizar com placeholder", () => {
      render(
        <Select
          options={defaultOptions}
          placeholder="Selecione uma opção"
          defaultValue=""
        />
      );
      expect(screen.getByText("Selecione uma opção")).toBeInTheDocument();
    });
  });

  describe("erro e helper text", () => {
    it("deve mostrar mensagem de erro", () => {
      render(<Select options={defaultOptions} error="Campo obrigatório" />);
      expect(screen.getByText("Campo obrigatório")).toBeInTheDocument();
    });

    it("deve mostrar helper text", () => {
      render(
        <Select
          options={defaultOptions}
          helperText="Escolha uma das opções acima"
        />
      );
      expect(
        screen.getByText("Escolha uma das opções acima")
      ).toBeInTheDocument();
    });

    it("deve mostrar erro ao invés de helper text quando ambos estão presentes", () => {
      render(
        <Select
          options={defaultOptions}
          error="Erro"
          helperText="Dica"
        />
      );
      expect(screen.getByText("Erro")).toBeInTheDocument();
      expect(screen.queryByText("Dica")).not.toBeInTheDocument();
    });
  });

  describe("tamanhos", () => {
    it("deve renderizar com tamanho pequeno", () => {
      render(
        <Select options={defaultOptions} selectSize="sm" data-testid="select" />
      );
      expect(screen.getByTestId("select")).toBeInTheDocument();
    });

    it("deve renderizar com tamanho médio (padrão)", () => {
      render(
        <Select options={defaultOptions} selectSize="md" data-testid="select" />
      );
      expect(screen.getByTestId("select")).toBeInTheDocument();
    });

    it("deve renderizar com tamanho grande", () => {
      render(
        <Select options={defaultOptions} selectSize="lg" data-testid="select" />
      );
      expect(screen.getByTestId("select")).toBeInTheDocument();
    });
  });

  describe("fullWidth", () => {
    it("deve renderizar com fullWidth", () => {
      const { container } = render(
        <Select options={defaultOptions} fullWidth />
      );
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("estados", () => {
    it("deve estar desabilitado quando disabled=true", () => {
      render(<Select options={defaultOptions} disabled />);
      expect(screen.getByRole("combobox")).toBeDisabled();
    });

    it("deve aceitar required", () => {
      render(<Select options={defaultOptions} label="Campo" required />);
      expect(screen.getByRole("combobox")).toBeRequired();
    });
  });

  describe("opções desabilitadas", () => {
    it("deve desabilitar opções específicas", () => {
      const optionsWithDisabled = [
        { value: "1", label: "Ativo" },
        { value: "2", label: "Inativo", disabled: true },
      ];

      render(<Select options={optionsWithDisabled} />);

      const disabledOption = screen.getByText("Inativo");
      expect(disabledOption).toHaveAttribute("disabled");
    });
  });

  describe("eventos", () => {
    it("deve chamar onChange quando o valor muda", () => {
      const handleChange = jest.fn();
      render(<Select options={defaultOptions} onChange={handleChange} />);

      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "option2" },
      });

      expect(handleChange).toHaveBeenCalled();
    });

    it("deve chamar onFocus quando recebe foco", () => {
      const handleFocus = jest.fn();
      render(<Select options={defaultOptions} onFocus={handleFocus} />);

      fireEvent.focus(screen.getByRole("combobox"));

      expect(handleFocus).toHaveBeenCalled();
    });

    it("deve chamar onBlur quando perde foco", () => {
      const handleBlur = jest.fn();
      render(<Select options={defaultOptions} onBlur={handleBlur} />);

      fireEvent.blur(screen.getByRole("combobox"));

      expect(handleBlur).toHaveBeenCalled();
    });
  });

  describe("valor controlado", () => {
    it("deve exibir o valor selecionado", () => {
      render(<Select options={defaultOptions} value="option2" readOnly />);

      const select = screen.getByRole("combobox") as HTMLSelectElement;
      expect(select.value).toBe("option2");
    });
  });

  describe("ref forwarding", () => {
    it("deve encaminhar ref para o select", () => {
      const ref = { current: null };
      render(<Select options={defaultOptions} ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLSelectElement);
    });
  });

  describe("opções numéricas", () => {
    it("deve funcionar com valores numéricos", () => {
      const numericOptions = [
        { value: 1, label: "Um" },
        { value: 2, label: "Dois" },
        { value: 3, label: "Três" },
      ];

      render(<Select options={numericOptions} />);

      expect(screen.getByText("Um")).toBeInTheDocument();
      expect(screen.getByText("Dois")).toBeInTheDocument();
      expect(screen.getByText("Três")).toBeInTheDocument();
    });
  });
});
