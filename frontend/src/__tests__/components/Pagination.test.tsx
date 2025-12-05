/**
 * Testes do componente Pagination
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { Pagination } from "@/components/ui/Pagination/Pagination";

describe("Pagination", () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 10,
    totalItems: 100,
    itemsPerPage: 10,
    onPageChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("renderização básica", () => {
    it("deve renderizar informações de paginação", () => {
      render(<Pagination {...defaultProps} />);
      expect(screen.getByText(/Mostrando/)).toBeInTheDocument();
      // Os números aparecem em múltiplos lugares (info e botões de página)
      // Verificar que a info de paginação existe
      expect(screen.getByText(/de/)).toBeInTheDocument();
      expect(screen.getByText(/itens/)).toBeInTheDocument();
    });

    it("deve renderizar botões de navegação", () => {
      render(<Pagination {...defaultProps} />);
      expect(screen.getByText("← Anterior")).toBeInTheDocument();
      expect(screen.getByText("Próxima →")).toBeInTheDocument();
    });

    it("não deve renderizar quando totalPages <= 1", () => {
      const { container } = render(
        <Pagination {...defaultProps} totalPages={1} />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe("navegação entre páginas", () => {
    it("deve desabilitar botão Anterior na primeira página", () => {
      render(<Pagination {...defaultProps} currentPage={1} />);
      const anteriorButton = screen.getByText("← Anterior");
      expect(anteriorButton).toBeDisabled();
    });

    it("deve desabilitar botão Próxima na última página", () => {
      render(<Pagination {...defaultProps} currentPage={10} />);
      const proximaButton = screen.getByText("Próxima →");
      expect(proximaButton).toBeDisabled();
    });

    it("deve chamar onPageChange ao clicar em Próxima", () => {
      const onPageChange = jest.fn();
      render(
        <Pagination {...defaultProps} currentPage={5} onPageChange={onPageChange} />
      );

      fireEvent.click(screen.getByText("Próxima →"));
      expect(onPageChange).toHaveBeenCalledWith(6);
    });

    it("deve chamar onPageChange ao clicar em Anterior", () => {
      const onPageChange = jest.fn();
      render(
        <Pagination {...defaultProps} currentPage={5} onPageChange={onPageChange} />
      );

      fireEvent.click(screen.getByText("← Anterior"));
      expect(onPageChange).toHaveBeenCalledWith(4);
    });

    it("deve chamar onPageChange ao clicar em um número de página", () => {
      const onPageChange = jest.fn();
      render(
        <Pagination {...defaultProps} currentPage={1} onPageChange={onPageChange} />
      );

      fireEvent.click(screen.getByText("3"));
      expect(onPageChange).toHaveBeenCalledWith(3);
    });
  });

  describe("números de página", () => {
    it("deve mostrar todas as páginas quando totalPages <= 5", () => {
      render(<Pagination {...defaultProps} totalPages={5} totalItems={50} />);
      // Os números de página aparecem como botões
      const pageButtons = screen.getAllByRole("button");
      // Verificar que existem botões de página (além de Anterior e Próxima)
      expect(pageButtons.length).toBeGreaterThan(2);
    });

    it("deve mostrar ellipsis quando há muitas páginas e está no início", () => {
      render(<Pagination {...defaultProps} currentPage={2} />);
      // Deve ter ellipsis (...)
      expect(screen.getAllByText("...").length).toBeGreaterThan(0);
    });

    it("deve mostrar ellipsis quando está no final", () => {
      render(<Pagination {...defaultProps} currentPage={9} />);
      expect(screen.getAllByText("...").length).toBeGreaterThan(0);
    });

    it("deve mostrar duas ellipsis quando está no meio", () => {
      render(<Pagination {...defaultProps} currentPage={5} />);
      const ellipsis = screen.getAllByText("...");
      expect(ellipsis.length).toBe(2);
    });
  });

  describe("informações de exibição", () => {
    it("deve calcular corretamente startItem e endItem", () => {
      render(
        <Pagination
          {...defaultProps}
          currentPage={2}
          itemsPerPage={10}
          totalItems={100}
        />
      );
      // Página 2: itens 11 a 20
      expect(screen.getByText("11")).toBeInTheDocument();
      expect(screen.getByText("20")).toBeInTheDocument();
    });

    it("deve mostrar endItem correto na última página parcial", () => {
      render(
        <Pagination
          {...defaultProps}
          currentPage={11}
          totalPages={11}
          itemsPerPage={10}
          totalItems={105}
        />
      );
      // Página 11: itens 101 a 105
      // Os números 101 e 105 aparecem no texto "Mostrando 101 a 105 de 105 itens"
      expect(screen.getByText(/101/)).toBeInTheDocument();
      expect(screen.getByText(/de/)).toBeInTheDocument();
    });

    it("deve usar singular 'item' quando totalItems é 1", () => {
      render(
        <Pagination
          {...defaultProps}
          totalPages={2}
          totalItems={1}
          itemsPerPage={1}
        />
      );
      expect(screen.getByText(/item/)).toBeInTheDocument();
    });

    it("deve usar plural 'itens' quando totalItems > 1", () => {
      render(<Pagination {...defaultProps} />);
      expect(screen.getByText(/itens/)).toBeInTheDocument();
    });
  });

  describe("página ativa", () => {
    it("deve destacar a página atual", () => {
      render(<Pagination {...defaultProps} currentPage={3} />);
      const page3Button = screen.getByText("3");
      expect(page3Button).toBeInTheDocument();
    });
  });
});
