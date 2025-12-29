/**
 * Testes para ModalDefinirJogadoresPartida
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ModalDefinirJogadoresPartida } from "@/components/etapas/ModalDefinirJogadoresPartida/ModalDefinirJogadoresPartida";
import { JogadorEquipe, PartidaTeams, TipoJogoTeams, StatusPartidaTeams } from "@/types/teams";
import { NivelJogador, GeneroJogador } from "@/types/jogador";

// Mock do Modal
jest.mock("@/components/ui/Modal", () => ({
  Modal: ({ isOpen, children, title, onClose, loading }: any) =>
    isOpen ? (
      <div data-testid="modal">
        <h2>{title}</h2>
        {loading && <span data-testid="loading">Loading...</span>}
        <button onClick={onClose} data-testid="close-modal">Close</button>
        {children}
      </div>
    ) : null,
}));

// ============================================
// DADOS DE TESTE
// ============================================

const mockJogadoresEquipe1: JogadorEquipe[] = [
  { id: "j1", nome: "João", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
  { id: "j2", nome: "Pedro", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
  { id: "j3", nome: "Ana", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
  { id: "j4", nome: "Maria", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
];

const mockJogadoresEquipe2: JogadorEquipe[] = [
  { id: "j5", nome: "Carlos", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
  { id: "j6", nome: "Lucas", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
  { id: "j7", nome: "Julia", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
  { id: "j8", nome: "Paula", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
];

const criarPartida = (overrides?: Partial<PartidaTeams>): PartidaTeams => ({
  id: "partida-1",
  etapaId: "etapa-1",
  arenaId: "arena-1",
  confrontoId: "confronto-1",
  ordem: 1,
  tipoJogo: TipoJogoTeams.MASCULINO,
  dupla1: [],
  dupla2: [],
  status: StatusPartidaTeams.AGENDADA,
  setsDupla1: 0,
  setsDupla2: 0,
  placar: [],
  criadoEm: new Date().toISOString(),
  atualizadoEm: new Date().toISOString(),
  ...overrides,
});

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  onConfirm: jest.fn(),
  partida: criarPartida(),
  equipe1Nome: "Equipe Alpha",
  equipe2Nome: "Equipe Beta",
  equipe1Jogadores: mockJogadoresEquipe1,
  equipe2Jogadores: mockJogadoresEquipe2,
  partidasConfrontoComJogadores: [],
};

describe("ModalDefinirJogadoresPartida", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // RENDERIZAÇÃO BÁSICA
  // ============================================

  describe("renderização", () => {
    it("deve renderizar modal quando isOpen é true", () => {
      render(<ModalDefinirJogadoresPartida {...defaultProps} />);

      expect(screen.getByTestId("modal")).toBeInTheDocument();
      expect(screen.getByText("Definir Jogadores da Partida")).toBeInTheDocument();
    });

    it("não deve renderizar modal quando isOpen é false", () => {
      render(<ModalDefinirJogadoresPartida {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
    });

    it("deve mostrar nomes das equipes", () => {
      render(<ModalDefinirJogadoresPartida {...defaultProps} />);

      // Equipes aparecem em múltiplos lugares (info e cabeçalhos)
      expect(screen.getAllByText(/Equipe Alpha/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Equipe Beta/).length).toBeGreaterThanOrEqual(1);
    });

    it("deve mostrar jogadores de ambas as equipes", () => {
      render(<ModalDefinirJogadoresPartida {...defaultProps} />);

      expect(screen.getByText("João")).toBeInTheDocument();
      expect(screen.getByText("Pedro")).toBeInTheDocument();
      expect(screen.getByText("Carlos")).toBeInTheDocument();
      expect(screen.getByText("Lucas")).toBeInTheDocument();
    });

    it("deve mostrar tipo de jogo na info", () => {
      render(<ModalDefinirJogadoresPartida {...defaultProps} />);

      expect(screen.getByText(/Partida Masculina/)).toBeInTheDocument();
    });

    it("deve mostrar tipo de jogo feminino", () => {
      const partidaFeminina = criarPartida({ tipoJogo: TipoJogoTeams.FEMININO });
      render(<ModalDefinirJogadoresPartida {...defaultProps} partida={partidaFeminina} />);

      expect(screen.getByText(/Partida Feminina/)).toBeInTheDocument();
    });

    it("deve mostrar tipo de jogo misto", () => {
      const partidaMista = criarPartida({ tipoJogo: TipoJogoTeams.MISTO });
      render(<ModalDefinirJogadoresPartida {...defaultProps} partida={partidaMista} />);

      expect(screen.getByText(/Partida Mista/)).toBeInTheDocument();
    });

    it("deve mostrar tipo de jogo decider", () => {
      const partidaDecider = criarPartida({ tipoJogo: TipoJogoTeams.DECIDER });
      render(<ModalDefinirJogadoresPartida {...defaultProps} partida={partidaDecider} />);

      expect(screen.getByText(/Partida Decider/)).toBeInTheDocument();
    });

    it("deve mostrar instruções", () => {
      render(<ModalDefinirJogadoresPartida {...defaultProps} />);

      expect(screen.getByText(/Selecione 2 jogadores de cada equipe/)).toBeInTheDocument();
    });

    it("deve mostrar contadores de seleção", () => {
      render(<ModalDefinirJogadoresPartida {...defaultProps} />);

      // Contadores aparecem em ambas as equipes
      expect(screen.getAllByText(/\(0\/2\)/).length).toBeGreaterThanOrEqual(2);
    });
  });

  // ============================================
  // SELEÇÃO DE JOGADORES
  // ============================================

  describe("seleção de jogadores", () => {
    it("deve permitir selecionar jogador da equipe 1", () => {
      render(<ModalDefinirJogadoresPartida {...defaultProps} />);

      const checkbox = screen.getByText("João").closest("label")?.querySelector("input");
      expect(checkbox).not.toBeChecked();

      fireEvent.click(checkbox!);

      expect(checkbox).toBeChecked();
    });

    it("deve permitir selecionar jogador da equipe 2", () => {
      render(<ModalDefinirJogadoresPartida {...defaultProps} />);

      const checkbox = screen.getByText("Carlos").closest("label")?.querySelector("input");
      expect(checkbox).not.toBeChecked();

      fireEvent.click(checkbox!);

      expect(checkbox).toBeChecked();
    });

    it("deve permitir desmarcar jogador selecionado", () => {
      render(<ModalDefinirJogadoresPartida {...defaultProps} />);

      const checkbox = screen.getByText("João").closest("label")?.querySelector("input");

      fireEvent.click(checkbox!);
      expect(checkbox).toBeChecked();

      fireEvent.click(checkbox!);
      expect(checkbox).not.toBeChecked();
    });

    it("deve mostrar erro ao tentar selecionar mais de 2 jogadores", () => {
      render(<ModalDefinirJogadoresPartida {...defaultProps} />);

      // Selecionar 2 jogadores da equipe 1
      fireEvent.click(screen.getByText("João").closest("label")?.querySelector("input")!);
      fireEvent.click(screen.getByText("Pedro").closest("label")?.querySelector("input")!);

      // Tentar selecionar um terceiro
      fireEvent.click(screen.getByText("Ana").closest("label")?.querySelector("input")!);

      expect(screen.getByText(/Selecione apenas 2 jogadores por equipe/)).toBeInTheDocument();
    });

    it("deve atualizar contador ao selecionar jogadores", () => {
      render(<ModalDefinirJogadoresPartida {...defaultProps} />);

      fireEvent.click(screen.getByText("João").closest("label")?.querySelector("input")!);

      expect(screen.getByText(/Equipe Alpha \(1\/2\)/)).toBeInTheDocument();

      fireEvent.click(screen.getByText("Pedro").closest("label")?.querySelector("input")!);

      expect(screen.getByText(/Equipe Alpha \(2\/2\)/)).toBeInTheDocument();
    });
  });

  // ============================================
  // VALIDAÇÃO DE JOGADORES JÁ USADOS
  // ============================================

  describe("validação de jogadores já usados", () => {
    it("deve marcar jogador como já jogou quando já participou", () => {
      const partidaAnterior = criarPartida({
        id: "partida-anterior",
        dupla1: [mockJogadoresEquipe1[0], mockJogadoresEquipe1[1]], // João e Pedro
        dupla2: [mockJogadoresEquipe2[0], mockJogadoresEquipe2[1]], // Carlos e Lucas
      });

      render(
        <ModalDefinirJogadoresPartida
          {...defaultProps}
          partidasConfrontoComJogadores={[partidaAnterior]}
        />
      );

      expect(screen.getAllByText("Já jogou")).toHaveLength(4);
    });

    it("deve mostrar erro ao tentar selecionar jogador que já jogou", () => {
      const partidaAnterior = criarPartida({
        id: "partida-anterior",
        dupla1: [mockJogadoresEquipe1[0]], // João (dupla incompleta para teste)
        dupla2: [],
      });

      // Criar props com partida anterior que tem João na dupla1
      const propsComPartidaAnterior = {
        ...defaultProps,
        partidasConfrontoComJogadores: [{
          ...partidaAnterior,
          dupla1: [mockJogadoresEquipe1[0], mockJogadoresEquipe1[1]],
          dupla2: [mockJogadoresEquipe2[0], mockJogadoresEquipe2[1]],
        }],
      };

      render(<ModalDefinirJogadoresPartida {...propsComPartidaAnterior} />);

      // Tentar selecionar João que já jogou
      const joaoCheckbox = screen.getByText("João").closest("label")?.querySelector("input");
      fireEvent.click(joaoCheckbox!);

      expect(screen.getByText(/Este jogador já participou de uma partida/)).toBeInTheDocument();
    });

    it("deve permitir jogadores repetidos no decider", () => {
      const partidaDecider = criarPartida({ tipoJogo: TipoJogoTeams.DECIDER });
      const partidaAnterior = criarPartida({
        id: "partida-anterior",
        dupla1: [mockJogadoresEquipe1[0], mockJogadoresEquipe1[1]],
        dupla2: [mockJogadoresEquipe2[0], mockJogadoresEquipe2[1]],
      });

      render(
        <ModalDefinirJogadoresPartida
          {...defaultProps}
          partida={partidaDecider}
          partidasConfrontoComJogadores={[partidaAnterior]}
        />
      );

      // No decider, jogadores podem repetir
      expect(screen.queryByText("Já jogou")).not.toBeInTheDocument();
    });
  });

  // ============================================
  // VALIDAÇÃO DE DUPLAS JÁ USADAS
  // ============================================

  describe("validação de duplas já usadas", () => {
    it("deve mostrar erro ao formar dupla já usada", () => {
      // Partida anterior com dupla João-Pedro
      const partidaAnterior = criarPartida({
        id: "partida-anterior",
        tipoJogo: TipoJogoTeams.DECIDER, // Decider permite jogadores repetidos
        dupla1: [mockJogadoresEquipe1[0], mockJogadoresEquipe1[1]], // João e Pedro
        dupla2: [mockJogadoresEquipe2[0], mockJogadoresEquipe2[1]],
      });

      const partidaDecider = criarPartida({ tipoJogo: TipoJogoTeams.DECIDER });

      render(
        <ModalDefinirJogadoresPartida
          {...defaultProps}
          partida={partidaDecider}
          partidasConfrontoComJogadores={[partidaAnterior]}
        />
      );

      // Selecionar João primeiro
      fireEvent.click(screen.getByText("João").closest("label")?.querySelector("input")!);

      // Tentar formar a mesma dupla João-Pedro (já usada)
      fireEvent.click(screen.getByText("Pedro").closest("label")?.querySelector("input")!);

      // Deve mostrar erro de dupla já usada
      expect(screen.getByText(/Esta dupla já jogou neste confronto/)).toBeInTheDocument();
    });

    it("deve validar dupla equipe 2 quando já usada", () => {
      const partidaAnterior = criarPartida({
        id: "partida-anterior",
        tipoJogo: TipoJogoTeams.DECIDER,
        dupla1: [mockJogadoresEquipe1[0], mockJogadoresEquipe1[1]],
        dupla2: [mockJogadoresEquipe2[0], mockJogadoresEquipe2[1]], // Carlos e Lucas
      });

      const partidaDecider = criarPartida({ tipoJogo: TipoJogoTeams.DECIDER });

      render(
        <ModalDefinirJogadoresPartida
          {...defaultProps}
          partida={partidaDecider}
          partidasConfrontoComJogadores={[partidaAnterior]}
        />
      );

      // Selecionar Carlos primeiro na equipe 2
      fireEvent.click(screen.getByText("Carlos").closest("label")?.querySelector("input")!);

      // Tentar formar a mesma dupla Carlos-Lucas (já usada)
      fireEvent.click(screen.getByText("Lucas").closest("label")?.querySelector("input")!);

      expect(screen.getByText(/Esta dupla já jogou neste confronto/)).toBeInTheDocument();
    });

    it("deve mostrar label Dupla já usada quando seleção forma dupla usada", () => {
      const partidaAnterior = criarPartida({
        id: "partida-anterior",
        tipoJogo: TipoJogoTeams.DECIDER,
        dupla1: [mockJogadoresEquipe1[0], mockJogadoresEquipe1[1]], // João e Pedro
        dupla2: [mockJogadoresEquipe2[0], mockJogadoresEquipe2[1]],
      });

      const partidaDecider = criarPartida({ tipoJogo: TipoJogoTeams.DECIDER });

      render(
        <ModalDefinirJogadoresPartida
          {...defaultProps}
          partida={partidaDecider}
          partidasConfrontoComJogadores={[partidaAnterior]}
        />
      );

      // Selecionar João
      fireEvent.click(screen.getByText("João").closest("label")?.querySelector("input")!);

      // Pedro deve mostrar "Dupla já usada" pois formar João-Pedro é duplicado
      expect(screen.getByText("Dupla já usada")).toBeInTheDocument();
    });
  });

  describe("validação de jogadores equipe 2", () => {
    it("deve mostrar erro ao selecionar jogador equipe 2 que já jogou", () => {
      const partidaAnterior = criarPartida({
        id: "partida-anterior",
        dupla1: [mockJogadoresEquipe1[0], mockJogadoresEquipe1[1]],
        dupla2: [mockJogadoresEquipe2[0], mockJogadoresEquipe2[1]], // Carlos e Lucas
      });

      render(
        <ModalDefinirJogadoresPartida
          {...defaultProps}
          partidasConfrontoComJogadores={[partidaAnterior]}
        />
      );

      // Tentar selecionar Carlos que já jogou
      const carlosCheckbox = screen.getByText("Carlos").closest("label")?.querySelector("input");
      fireEvent.click(carlosCheckbox!);

      expect(screen.getByText(/Este jogador já participou de uma partida/)).toBeInTheDocument();
    });

    it("deve mostrar erro ao tentar selecionar mais de 2 jogadores equipe 2", () => {
      render(<ModalDefinirJogadoresPartida {...defaultProps} />);

      // Selecionar 2 jogadores da equipe 2
      fireEvent.click(screen.getByText("Carlos").closest("label")?.querySelector("input")!);
      fireEvent.click(screen.getByText("Lucas").closest("label")?.querySelector("input")!);

      // Tentar selecionar um terceiro
      fireEvent.click(screen.getByText("Julia").closest("label")?.querySelector("input")!);

      expect(screen.getByText(/Selecione apenas 2 jogadores por equipe/)).toBeInTheDocument();
    });
  });

  // ============================================
  // CONFIRMAÇÃO
  // ============================================

  describe("confirmação", () => {
    it("deve ter botão confirmar desabilitado sem seleção completa", () => {
      render(<ModalDefinirJogadoresPartida {...defaultProps} />);

      const confirmButton = screen.getByText("Confirmar");
      expect(confirmButton).toBeDisabled();
    });

    it("deve habilitar botão confirmar com seleção completa", () => {
      render(<ModalDefinirJogadoresPartida {...defaultProps} />);

      // Selecionar 2 da equipe 1
      fireEvent.click(screen.getByText("João").closest("label")?.querySelector("input")!);
      fireEvent.click(screen.getByText("Pedro").closest("label")?.querySelector("input")!);

      // Selecionar 2 da equipe 2
      fireEvent.click(screen.getByText("Carlos").closest("label")?.querySelector("input")!);
      fireEvent.click(screen.getByText("Lucas").closest("label")?.querySelector("input")!);

      const confirmButton = screen.getByText("Confirmar");
      expect(confirmButton).not.toBeDisabled();
    });

    it("deve chamar onConfirm com IDs corretos", async () => {
      const mockOnConfirm = jest.fn().mockResolvedValue(undefined);
      render(<ModalDefinirJogadoresPartida {...defaultProps} onConfirm={mockOnConfirm} />);

      // Selecionar jogadores
      fireEvent.click(screen.getByText("João").closest("label")?.querySelector("input")!);
      fireEvent.click(screen.getByText("Pedro").closest("label")?.querySelector("input")!);
      fireEvent.click(screen.getByText("Carlos").closest("label")?.querySelector("input")!);
      fireEvent.click(screen.getByText("Lucas").closest("label")?.querySelector("input")!);

      // Confirmar
      fireEvent.click(screen.getByText("Confirmar"));

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledWith(
          ["j1", "j2"], // João e Pedro
          ["j5", "j6"]  // Carlos e Lucas
        );
      });
    });

    it("deve mostrar erro se menos de 2 jogadores selecionados", async () => {
      render(<ModalDefinirJogadoresPartida {...defaultProps} />);

      // Selecionar apenas 1 de cada
      fireEvent.click(screen.getByText("João").closest("label")?.querySelector("input")!);
      fireEvent.click(screen.getByText("Carlos").closest("label")?.querySelector("input")!);

      // Botão deve estar desabilitado
      const confirmButton = screen.getByText("Confirmar");
      expect(confirmButton).toBeDisabled();
    });

    it("deve lidar com erro do onConfirm", async () => {
      const mockOnConfirm = jest.fn().mockRejectedValue(new Error("Erro ao salvar"));
      render(<ModalDefinirJogadoresPartida {...defaultProps} onConfirm={mockOnConfirm} />);

      // Selecionar jogadores
      fireEvent.click(screen.getByText("João").closest("label")?.querySelector("input")!);
      fireEvent.click(screen.getByText("Pedro").closest("label")?.querySelector("input")!);
      fireEvent.click(screen.getByText("Carlos").closest("label")?.querySelector("input")!);
      fireEvent.click(screen.getByText("Lucas").closest("label")?.querySelector("input")!);

      // Confirmar
      fireEvent.click(screen.getByText("Confirmar"));

      await waitFor(() => {
        expect(screen.getByText(/Erro ao salvar/)).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // FECHAR MODAL
  // ============================================

  describe("fechar modal", () => {
    it("deve chamar onClose ao clicar em Cancelar", () => {
      const mockOnClose = jest.fn();
      render(<ModalDefinirJogadoresPartida {...defaultProps} onClose={mockOnClose} />);

      fireEvent.click(screen.getByText("Cancelar"));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("deve limpar seleções ao fechar", () => {
      const mockOnClose = jest.fn();
      render(<ModalDefinirJogadoresPartida {...defaultProps} onClose={mockOnClose} />);

      // Selecionar jogadores
      fireEvent.click(screen.getByText("João").closest("label")?.querySelector("input")!);

      // Fechar
      fireEvent.click(screen.getByText("Cancelar"));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("deve limpar erros ao fechar", () => {
      render(<ModalDefinirJogadoresPartida {...defaultProps} />);

      // Selecionar 2 da equipe 1
      fireEvent.click(screen.getByText("João").closest("label")?.querySelector("input")!);
      fireEvent.click(screen.getByText("Pedro").closest("label")?.querySelector("input")!);

      // Gerar erro tentando selecionar terceiro
      fireEvent.click(screen.getByText("Ana").closest("label")?.querySelector("input")!);

      expect(screen.getByText(/Selecione apenas 2 jogadores por equipe/)).toBeInTheDocument();

      // Fechar
      fireEvent.click(screen.getByText("Cancelar"));

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  // ============================================
  // ESTADO DE LOADING
  // ============================================

  describe("estado de loading", () => {
    it("deve mostrar texto de loading durante salvamento", async () => {
      const mockOnConfirm = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<ModalDefinirJogadoresPartida {...defaultProps} onConfirm={mockOnConfirm} />);

      // Selecionar jogadores
      fireEvent.click(screen.getByText("João").closest("label")?.querySelector("input")!);
      fireEvent.click(screen.getByText("Pedro").closest("label")?.querySelector("input")!);
      fireEvent.click(screen.getByText("Carlos").closest("label")?.querySelector("input")!);
      fireEvent.click(screen.getByText("Lucas").closest("label")?.querySelector("input")!);

      // Confirmar
      fireEvent.click(screen.getByText("Confirmar"));

      expect(screen.getByText("Salvando...")).toBeInTheDocument();
    });
  });
});
