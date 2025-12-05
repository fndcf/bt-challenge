/**
 * Testes do componente EmptyState da FaseEliminatoria
 */

import { render, screen, fireEvent } from "@testing-library/react";

// Mock dos styled components
jest.mock("@/components/etapas/FaseEliminatoria/styles", () => ({
  EmptyStateCard: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="empty-state-card">{children}</div>
  ),
  EmptyStateContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  EmptyTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
  AlertBox: ({
    children,
    $variant,
  }: {
    children: React.ReactNode;
    $variant: string;
  }) => <div data-variant={$variant}>{children}</div>,
  InfoBox: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  InfoText: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  ButtonGroup: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Button: ({
    children,
    onClick,
    disabled,
    $variant,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    $variant?: string;
  }) => (
    <button onClick={onClick} disabled={disabled} data-variant={$variant}>
      {children}
    </button>
  ),
  HintText: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));

import { EmptyState } from "@/components/etapas/FaseEliminatoria/components/EmptyState";

describe("EmptyState (FaseEliminatoria)", () => {
  const defaultProps = {
    isGrupoUnico: false,
    grupoUnicoCompleto: false,
    etapaFinalizada: false,
    todosGruposCompletos: false,
    partidasPendentes: 5,
    loading: false,
    onGerarEliminatoria: jest.fn(),
    onEncerrarEtapa: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("renderização básica", () => {
    it("deve renderizar o título", () => {
      render(<EmptyState {...defaultProps} />);
      expect(screen.getByText("Fase Eliminatória")).toBeInTheDocument();
    });
  });

  describe("grupo único", () => {
    it("deve mostrar informações de grupo único quando isGrupoUnico é true", () => {
      render(<EmptyState {...defaultProps} isGrupoUnico={true} />);
      expect(screen.getByText(/Grupo Único/)).toBeInTheDocument();
      // Round-Robin pode aparecer múltiplas vezes
      expect(screen.getAllByText(/Round-Robin/).length).toBeGreaterThan(0);
    });

    it("deve mostrar partidas pendentes quando grupo único não está completo", () => {
      render(
        <EmptyState
          {...defaultProps}
          isGrupoUnico={true}
          grupoUnicoCompleto={false}
          partidasPendentes={3}
        />
      );
      expect(screen.getByText(/3 partida\(s\) pendente\(s\)/)).toBeInTheDocument();
    });

    it("deve mostrar botão de encerrar quando grupo único está completo", () => {
      render(
        <EmptyState
          {...defaultProps}
          isGrupoUnico={true}
          grupoUnicoCompleto={true}
          etapaFinalizada={false}
        />
      );
      expect(
        screen.getByText("Encerrar Etapa e Atribuir Pontos")
      ).toBeInTheDocument();
    });

    it("deve chamar onEncerrarEtapa ao clicar no botão", () => {
      const onEncerrarEtapa = jest.fn();
      render(
        <EmptyState
          {...defaultProps}
          isGrupoUnico={true}
          grupoUnicoCompleto={true}
          etapaFinalizada={false}
          onEncerrarEtapa={onEncerrarEtapa}
        />
      );

      fireEvent.click(screen.getByText("Encerrar Etapa e Atribuir Pontos"));
      expect(onEncerrarEtapa).toHaveBeenCalledTimes(1);
    });

    it("deve mostrar mensagem de etapa finalizada quando já encerrada", () => {
      render(
        <EmptyState
          {...defaultProps}
          isGrupoUnico={true}
          grupoUnicoCompleto={true}
          etapaFinalizada={true}
        />
      );
      expect(screen.getByText(/Etapa Finalizada/)).toBeInTheDocument();
    });

    it("deve mostrar dica sobre configurar mais grupos", () => {
      render(<EmptyState {...defaultProps} isGrupoUnico={true} />);
      expect(
        screen.getByText(/Para ter fase eliminatória, configure a etapa com 2 ou mais grupos/)
      ).toBeInTheDocument();
    });
  });

  describe("múltiplos grupos - partidas pendentes", () => {
    it("deve mostrar mensagem de partidas pendentes", () => {
      render(
        <EmptyState
          {...defaultProps}
          isGrupoUnico={false}
          todosGruposCompletos={false}
          partidasPendentes={10}
        />
      );
      expect(
        screen.getByText(/Finalize todas as partidas da fase de grupos/)
      ).toBeInTheDocument();
      expect(screen.getByText(/10 partida\(s\) pendente\(s\)/)).toBeInTheDocument();
    });

    it("deve mostrar botão desabilitado quando há partidas pendentes", () => {
      render(
        <EmptyState
          {...defaultProps}
          isGrupoUnico={false}
          todosGruposCompletos={false}
        />
      );
      const button = screen.getByText("Gerar Fase Eliminatória");
      expect(button).toBeDisabled();
    });
  });

  describe("múltiplos grupos - pronto para gerar eliminatória", () => {
    it("deve mostrar mensagem quando todos os grupos estão completos", () => {
      render(
        <EmptyState
          {...defaultProps}
          isGrupoUnico={false}
          todosGruposCompletos={true}
        />
      );
      expect(
        screen.getByText(/A fase de grupos foi concluída/)
      ).toBeInTheDocument();
    });

    it("deve mostrar botão habilitado para gerar eliminatória", () => {
      render(
        <EmptyState
          {...defaultProps}
          isGrupoUnico={false}
          todosGruposCompletos={true}
        />
      );
      const button = screen.getByText("Gerar Fase Eliminatória");
      expect(button).not.toBeDisabled();
    });

    it("deve chamar onGerarEliminatoria ao clicar no botão", () => {
      const onGerarEliminatoria = jest.fn();
      render(
        <EmptyState
          {...defaultProps}
          isGrupoUnico={false}
          todosGruposCompletos={true}
          onGerarEliminatoria={onGerarEliminatoria}
        />
      );

      fireEvent.click(screen.getByText("Gerar Fase Eliminatória"));
      expect(onGerarEliminatoria).toHaveBeenCalledTimes(1);
    });
  });

  describe("estado de loading", () => {
    it("deve desabilitar botão quando loading", () => {
      render(
        <EmptyState
          {...defaultProps}
          isGrupoUnico={false}
          todosGruposCompletos={true}
          loading={true}
        />
      );
      const button = screen.getByText("Gerar Fase Eliminatória");
      expect(button).toBeDisabled();
    });
  });
});
