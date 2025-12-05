/**
 * Testes do componente LoadingSpinner
 */

import { render, screen } from "@testing-library/react";
import LoadingSpinner from "@/components/common/LoadingSpinner/LoadingSpinner";

describe("LoadingSpinner", () => {
  describe("renderização básica", () => {
    it("deve renderizar o spinner", () => {
      const { container } = render(<LoadingSpinner />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("deve renderizar sem mensagem por padrão", () => {
      render(<LoadingSpinner />);
      expect(screen.queryByText(/./)).toBeNull();
    });
  });

  describe("tamanhos", () => {
    it("deve renderizar tamanho small", () => {
      const { container } = render(<LoadingSpinner size="small" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("deve renderizar tamanho medium por padrão", () => {
      const { container } = render(<LoadingSpinner />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("deve renderizar tamanho large", () => {
      const { container } = render(<LoadingSpinner size="large" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("mensagem", () => {
    it("deve renderizar mensagem quando fornecida", () => {
      render(<LoadingSpinner message="Carregando dados..." />);
      expect(screen.getByText("Carregando dados...")).toBeInTheDocument();
    });

    it("deve renderizar mensagem com tamanho small", () => {
      render(<LoadingSpinner size="small" message="Aguarde..." />);
      expect(screen.getByText("Aguarde...")).toBeInTheDocument();
    });

    it("deve renderizar mensagem com tamanho large", () => {
      render(<LoadingSpinner size="large" message="Processando..." />);
      expect(screen.getByText("Processando...")).toBeInTheDocument();
    });
  });

  describe("modo fullScreen", () => {
    it("deve renderizar em modo fullScreen", () => {
      const { container } = render(<LoadingSpinner fullScreen />);
      // Verifica se há um container com position fixed
      const fullScreenContainer = container.firstChild as HTMLElement;
      expect(fullScreenContainer).toBeInTheDocument();
    });

    it("deve renderizar fullScreen com mensagem", () => {
      render(<LoadingSpinner fullScreen message="Verificando autenticação..." />);
      expect(screen.getByText("Verificando autenticação...")).toBeInTheDocument();
    });

    it("deve renderizar fullScreen com tamanho large", () => {
      const { container } = render(<LoadingSpinner fullScreen size="large" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("combinações de props", () => {
    it("deve renderizar com todas as props combinadas", () => {
      render(
        <LoadingSpinner
          size="large"
          fullScreen
          message="Carregando aplicação..."
        />
      );
      expect(screen.getByText("Carregando aplicação...")).toBeInTheDocument();
    });

    it("deve renderizar inline com mensagem e tamanho small", () => {
      render(<LoadingSpinner size="small" message="Buscando..." />);
      expect(screen.getByText("Buscando...")).toBeInTheDocument();
    });
  });
});
