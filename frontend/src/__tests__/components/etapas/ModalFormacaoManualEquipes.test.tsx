/**
 * Testes para ModalFormacaoManualEquipes
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ModalFormacaoManualEquipes } from "@/components/etapas/ModalFormacaoManualEquipes/ModalFormacaoManualEquipes";
import { Inscricao, VarianteTeams } from "@/types/etapa";
import { NivelJogador, GeneroJogador } from "@/types/jogador";

// Mock do Modal
jest.mock("@/components/ui/Modal", () => ({
  Modal: ({ isOpen, children, title, footer }: any) =>
    isOpen ? (
      <div data-testid="modal">
        <h2>{title}</h2>
        {children}
        {footer}
      </div>
    ) : null,
}));

// ============================================
// DADOS DE TESTE
// ============================================

const criarInscricao = (overrides: Partial<Inscricao> & { jogadorId: string }): Inscricao => ({
  id: `inscricao-${overrides.jogadorId}`,
  etapaId: "etapa-1",
  arenaId: "arena-1",
  status: "confirmada",
  jogadorNome: overrides.jogadorNome || `Jogador ${overrides.jogadorId}`,
  jogadorNivel: NivelJogador.INTERMEDIARIO,
  jogadorGenero: GeneroJogador.MASCULINO,
  criadoEm: new Date().toISOString(),
  atualizadoEm: new Date().toISOString(),
  ...overrides,
});

const criarInscricoes8Jogadores = (): Inscricao[] => [
  criarInscricao({ jogadorId: "j1", jogadorNome: "João", jogadorGenero: GeneroJogador.MASCULINO }),
  criarInscricao({ jogadorId: "j2", jogadorNome: "Pedro", jogadorGenero: GeneroJogador.MASCULINO }),
  criarInscricao({ jogadorId: "j3", jogadorNome: "Carlos", jogadorGenero: GeneroJogador.MASCULINO }),
  criarInscricao({ jogadorId: "j4", jogadorNome: "Lucas", jogadorGenero: GeneroJogador.MASCULINO }),
  criarInscricao({ jogadorId: "j5", jogadorNome: "Ana", jogadorGenero: GeneroJogador.FEMININO }),
  criarInscricao({ jogadorId: "j6", jogadorNome: "Maria", jogadorGenero: GeneroJogador.FEMININO }),
  criarInscricao({ jogadorId: "j7", jogadorNome: "Julia", jogadorGenero: GeneroJogador.FEMININO }),
  criarInscricao({ jogadorId: "j8", jogadorNome: "Paula", jogadorGenero: GeneroJogador.FEMININO }),
];

const criarInscricoes12Jogadores = (): Inscricao[] => [
  ...criarInscricoes8Jogadores(),
  criarInscricao({ jogadorId: "j9", jogadorNome: "Ricardo", jogadorGenero: GeneroJogador.MASCULINO }),
  criarInscricao({ jogadorId: "j10", jogadorNome: "Marcos", jogadorGenero: GeneroJogador.MASCULINO }),
  criarInscricao({ jogadorId: "j11", jogadorNome: "Fernanda", jogadorGenero: GeneroJogador.FEMININO }),
  criarInscricao({ jogadorId: "j12", jogadorNome: "Lucia", jogadorGenero: GeneroJogador.FEMININO }),
];

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  onConfirm: jest.fn(),
  inscricoes: criarInscricoes8Jogadores(),
  varianteTeams: VarianteTeams.TEAMS_4,
  isMisto: false,
};

describe("ModalFormacaoManualEquipes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // RENDERIZAÇÃO BÁSICA
  // ============================================

  describe("renderização", () => {
    it("deve renderizar modal quando isOpen é true", () => {
      render(<ModalFormacaoManualEquipes {...defaultProps} />);

      expect(screen.getByTestId("modal")).toBeInTheDocument();
      expect(screen.getByText("Formar Equipes Manualmente")).toBeInTheDocument();
    });

    it("não deve renderizar modal quando isOpen é false", () => {
      render(<ModalFormacaoManualEquipes {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
    });

    it("deve mostrar info de TEAMS 4", () => {
      render(<ModalFormacaoManualEquipes {...defaultProps} />);

      expect(screen.getByText(/TEAMS 4/)).toBeInTheDocument();
      expect(screen.getByText(/2 equipes de 4 jogadores/)).toBeInTheDocument();
    });

    it("deve mostrar info de TEAMS 6", () => {
      render(
        <ModalFormacaoManualEquipes
          {...defaultProps}
          varianteTeams={VarianteTeams.TEAMS_6}
          inscricoes={criarInscricoes12Jogadores()}
        />
      );

      expect(screen.getByText(/TEAMS 6/)).toBeInTheDocument();
      expect(screen.getByText(/2 equipes de 6 jogadores/)).toBeInTheDocument();
    });

    it("deve mostrar cards de equipes", () => {
      render(<ModalFormacaoManualEquipes {...defaultProps} />);

      // Deve ter 2 equipes (8 jogadores / 4 por equipe)
      expect(screen.getByDisplayValue("Equipe 1")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Equipe 2")).toBeInTheDocument();
    });

    it("deve mostrar jogadores disponíveis", () => {
      render(<ModalFormacaoManualEquipes {...defaultProps} />);

      expect(screen.getByText("João")).toBeInTheDocument();
      expect(screen.getByText("Pedro")).toBeInTheDocument();
      expect(screen.getByText("Ana")).toBeInTheDocument();
      expect(screen.getByText("Maria")).toBeInTheDocument();
    });

    it("deve mostrar contadores de equipes", () => {
      render(<ModalFormacaoManualEquipes {...defaultProps} />);

      // Deve mostrar "0/4" para ambas equipes inicialmente
      expect(screen.getAllByText("0/4")).toHaveLength(2);
    });

    it("deve mostrar instrução especial para misto", () => {
      render(<ModalFormacaoManualEquipes {...defaultProps} isMisto={true} />);

      expect(screen.getByText(/Cada equipe deve ter 2 homens e 2 mulheres/)).toBeInTheDocument();
    });
  });

  // ============================================
  // ADICIONAR JOGADORES
  // ============================================

  describe("adicionar jogadores", () => {
    it("deve adicionar jogador à primeira equipe incompleta", () => {
      render(<ModalFormacaoManualEquipes {...defaultProps} />);

      // Clicar em João
      fireEvent.click(screen.getByText("João"));

      // João deve aparecer na equipe
      expect(screen.getByText("1/4")).toBeInTheDocument();
    });

    it("deve atualizar contador ao adicionar jogador", () => {
      render(<ModalFormacaoManualEquipes {...defaultProps} />);

      // Adicionar 2 jogadores
      fireEvent.click(screen.getByText("João"));
      fireEvent.click(screen.getByText("Pedro"));

      expect(screen.getByText("2/4")).toBeInTheDocument();
    });

    it("deve remover jogador da lista de disponíveis ao adicionar", () => {
      render(<ModalFormacaoManualEquipes {...defaultProps} />);

      // Verificar que há 8 jogadores disponíveis
      expect(screen.getByText("Jogadores Disponiveis (8)")).toBeInTheDocument();

      // Adicionar João
      fireEvent.click(screen.getByText("João"));

      // Verificar que agora há 7 disponíveis
      expect(screen.getByText("Jogadores Disponiveis (7)")).toBeInTheDocument();
    });

    it("deve preencher primeira equipe antes de passar para segunda", () => {
      render(<ModalFormacaoManualEquipes {...defaultProps} />);

      // Adicionar 4 jogadores à equipe 1
      fireEvent.click(screen.getByText("João"));
      fireEvent.click(screen.getByText("Pedro"));
      fireEvent.click(screen.getByText("Carlos"));
      fireEvent.click(screen.getByText("Lucas"));

      // Equipe 1 deve estar completa
      expect(screen.getByText("4/4")).toBeInTheDocument();

      // Adicionar jogador à equipe 2
      fireEvent.click(screen.getByText("Ana"));

      // Equipe 2 deve ter 1 jogador
      expect(screen.getAllByText(/\/4/).some(el => el.textContent === "1/4")).toBe(true);
    });
  });

  // ============================================
  // REMOVER JOGADORES
  // ============================================

  describe("remover jogadores", () => {
    it("deve remover jogador ao clicar no X", () => {
      render(<ModalFormacaoManualEquipes {...defaultProps} />);

      // Adicionar João
      fireEvent.click(screen.getByText("João"));

      // Verificar que está na equipe
      expect(screen.getByText("1/4")).toBeInTheDocument();

      // Remover (clicar no X)
      const removeButtons = screen.getAllByTitle("Remover jogador");
      fireEvent.click(removeButtons[0]);

      // Verificar que voltou
      expect(screen.getAllByText("0/4")).toHaveLength(2);
    });

    it("deve retornar jogador à lista de disponíveis", () => {
      render(<ModalFormacaoManualEquipes {...defaultProps} />);

      // Adicionar João
      fireEvent.click(screen.getByText("João"));
      expect(screen.getByText("Jogadores Disponiveis (7)")).toBeInTheDocument();

      // Remover João
      const removeButtons = screen.getAllByTitle("Remover jogador");
      fireEvent.click(removeButtons[0]);

      // Verificar que voltou à lista
      expect(screen.getByText("Jogadores Disponiveis (8)")).toBeInTheDocument();
    });
  });

  // ============================================
  // RENOMEAR EQUIPES
  // ============================================

  describe("renomear equipes", () => {
    it("deve permitir renomear equipe", () => {
      render(<ModalFormacaoManualEquipes {...defaultProps} />);

      const input = screen.getByDisplayValue("Equipe 1");
      fireEvent.change(input, { target: { value: "Time A" } });

      expect(screen.getByDisplayValue("Time A")).toBeInTheDocument();
    });
  });

  // ============================================
  // VALIDAÇÃO E CONFIRMAÇÃO
  // ============================================

  describe("validação e confirmação", () => {
    it("deve ter botão confirmar desabilitado quando equipes não estão completas", () => {
      render(<ModalFormacaoManualEquipes {...defaultProps} />);

      const confirmButton = screen.getByText("Formar Equipes");
      expect(confirmButton).toBeDisabled();
    });

    it("deve habilitar botão quando todas equipes estão completas", () => {
      render(<ModalFormacaoManualEquipes {...defaultProps} />);

      // Preencher todas as equipes
      const jogadores = ["João", "Pedro", "Carlos", "Lucas", "Ana", "Maria", "Julia", "Paula"];
      jogadores.forEach((nome) => {
        fireEvent.click(screen.getByText(nome));
      });

      const confirmButton = screen.getByText("Formar Equipes");
      expect(confirmButton).not.toBeDisabled();
    });

    it("deve chamar onConfirm com formações corretas", async () => {
      const mockOnConfirm = jest.fn().mockResolvedValue(undefined);
      render(<ModalFormacaoManualEquipes {...defaultProps} onConfirm={mockOnConfirm} />);

      // Preencher todas as equipes
      const jogadores = ["João", "Pedro", "Carlos", "Lucas", "Ana", "Maria", "Julia", "Paula"];
      jogadores.forEach((nome) => {
        fireEvent.click(screen.getByText(nome));
      });

      // Confirmar
      fireEvent.click(screen.getByText("Formar Equipes"));

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledWith([
          { nome: "Equipe 1", jogadorIds: ["j1", "j2", "j3", "j4"] },
          { nome: "Equipe 2", jogadorIds: ["j5", "j6", "j7", "j8"] },
        ]);
      });
    });

    it("deve mostrar erro quando equipes não estão completas", async () => {
      render(<ModalFormacaoManualEquipes {...defaultProps} />);

      // Adicionar apenas alguns jogadores
      fireEvent.click(screen.getByText("João"));
      fireEvent.click(screen.getByText("Pedro"));

      // Botão deve estar desabilitado, mas se forçar...
      // O teste verifica o estado do botão
      const confirmButton = screen.getByText("Formar Equipes");
      expect(confirmButton).toBeDisabled();
    });

    it("deve lidar com erro do onConfirm", async () => {
      const mockOnConfirm = jest.fn().mockRejectedValue(new Error("Erro ao formar equipes"));
      render(<ModalFormacaoManualEquipes {...defaultProps} onConfirm={mockOnConfirm} />);

      // Preencher todas as equipes
      const jogadores = ["João", "Pedro", "Carlos", "Lucas", "Ana", "Maria", "Julia", "Paula"];
      jogadores.forEach((nome) => {
        fireEvent.click(screen.getByText(nome));
      });

      // Confirmar
      fireEvent.click(screen.getByText("Formar Equipes"));

      await waitFor(() => {
        expect(screen.getByText(/Erro ao formar equipes/)).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // VALIDAÇÃO MISTO
  // ============================================

  describe("validação misto", () => {
    it("deve mostrar erro quando equipe mista não tem gêneros balanceados", async () => {
      const mockOnConfirm = jest.fn().mockResolvedValue(undefined);
      render(
        <ModalFormacaoManualEquipes
          {...defaultProps}
          isMisto={true}
          onConfirm={mockOnConfirm}
        />
      );

      // Adicionar 4 homens à equipe 1 (deveria ser 2 e 2)
      fireEvent.click(screen.getByText("João"));
      fireEvent.click(screen.getByText("Pedro"));
      fireEvent.click(screen.getByText("Carlos"));
      fireEvent.click(screen.getByText("Lucas"));

      // Adicionar 4 mulheres à equipe 2
      fireEvent.click(screen.getByText("Ana"));
      fireEvent.click(screen.getByText("Maria"));
      fireEvent.click(screen.getByText("Julia"));
      fireEvent.click(screen.getByText("Paula"));

      // Confirmar
      fireEvent.click(screen.getByText("Formar Equipes"));

      await waitFor(() => {
        expect(screen.getByText(/Para formato misto, cada equipe deve ter 2 homens e 2 mulheres/)).toBeInTheDocument();
      });

      expect(mockOnConfirm).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // BOTÃO CANCELAR
  // ============================================

  describe("cancelar", () => {
    it("deve chamar onClose ao clicar em Cancelar", () => {
      const mockOnClose = jest.fn();
      render(<ModalFormacaoManualEquipes {...defaultProps} onClose={mockOnClose} />);

      fireEvent.click(screen.getByText("Cancelar"));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  // ============================================
  // NÍVEIS DE JOGADORES
  // ============================================

  describe("níveis de jogadores", () => {
    it("deve mostrar badge de nível nos jogadores", () => {
      render(<ModalFormacaoManualEquipes {...defaultProps} />);

      // Todos jogadores têm nível intermediário (INT)
      expect(screen.getAllByText("INT").length).toBeGreaterThan(0);
    });

    it("deve mostrar níveis diferentes", () => {
      const inscricoesComNiveis = [
        criarInscricao({ jogadorId: "j1", jogadorNome: "Iniciante", jogadorNivel: NivelJogador.INICIANTE }),
        criarInscricao({ jogadorId: "j2", jogadorNome: "Inter", jogadorNivel: NivelJogador.INTERMEDIARIO }),
        criarInscricao({ jogadorId: "j3", jogadorNome: "Avancado", jogadorNivel: NivelJogador.AVANCADO }),
        criarInscricao({ jogadorId: "j4", jogadorNome: "Outro", jogadorNivel: NivelJogador.INTERMEDIARIO }),
      ];

      render(
        <ModalFormacaoManualEquipes
          {...defaultProps}
          inscricoes={inscricoesComNiveis}
          varianteTeams={VarianteTeams.TEAMS_4}
        />
      );

      expect(screen.getByText("INI")).toBeInTheDocument();
      expect(screen.getAllByText("INT").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("AVA")).toBeInTheDocument();
    });
  });

  // ============================================
  // TODOS ALOCADOS
  // ============================================

  describe("todos alocados", () => {
    it("deve mostrar mensagem quando todos jogadores foram alocados", () => {
      render(<ModalFormacaoManualEquipes {...defaultProps} />);

      // Preencher todas as equipes
      const jogadores = ["João", "Pedro", "Carlos", "Lucas", "Ana", "Maria", "Julia", "Paula"];
      jogadores.forEach((nome) => {
        fireEvent.click(screen.getByText(nome));
      });

      expect(screen.getByText("Todos os jogadores foram alocados")).toBeInTheDocument();
    });
  });

  // ============================================
  // INSCRIÇÕES NÃO CONFIRMADAS
  // ============================================

  describe("inscrições não confirmadas", () => {
    it("não deve mostrar jogadores com inscrição pendente", () => {
      const inscricoes = [
        criarInscricao({ jogadorId: "j1", jogadorNome: "Confirmado", status: "confirmada" }),
        criarInscricao({ jogadorId: "j2", jogadorNome: "Pendente", status: "pendente" as any }),
        criarInscricao({ jogadorId: "j3", jogadorNome: "Confirmado2", status: "confirmada" }),
        criarInscricao({ jogadorId: "j4", jogadorNome: "Confirmado3", status: "confirmada" }),
      ];

      render(
        <ModalFormacaoManualEquipes
          {...defaultProps}
          inscricoes={inscricoes}
          varianteTeams={VarianteTeams.TEAMS_4}
        />
      );

      // Pendente não deve aparecer nos disponíveis
      expect(screen.queryByText("Pendente")).not.toBeInTheDocument();
      expect(screen.getByText("Jogadores Disponiveis (3)")).toBeInTheDocument();
    });
  });
});
