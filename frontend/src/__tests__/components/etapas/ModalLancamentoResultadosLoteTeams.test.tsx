/**
 * Testes para ModalLancamentoResultadosLoteTeams
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ModalLancamentoResultadosLoteTeams } from "@/components/etapas/ModalLancamentoResultadosLoteTeams/ModalLancamentoResultadosLoteTeams";
import {
  PartidaTeams,
  ConfrontoEquipe,
  Equipe,
  StatusPartidaTeams,
  StatusConfronto,
  TipoJogoTeams,
  JogadorEquipe,
} from "@/types/teams";
import { NivelJogador, GeneroJogador } from "@/types/jogador";

// Mock do service
const mockTeamsService = {
  registrarResultadosEmLote: jest.fn(),
  buscarPartidasConfronto: jest.fn(),
  definirJogadoresPartida: jest.fn(),
};

jest.mock("@/services", () => ({
  getTeamsService: () => mockTeamsService,
}));

// Mock do ModalDefinirJogadoresPartida
jest.mock("@/components/etapas/ModalDefinirJogadoresPartida", () => ({
  ModalDefinirJogadoresPartida: ({ isOpen, onClose, onConfirm }: { isOpen: boolean; onClose: () => void; onConfirm: (d1: string[], d2: string[]) => void }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="modal-definir-jogadores">
        <button onClick={onClose} data-testid="modal-close">Fechar</button>
        <button onClick={() => onConfirm(["j1", "j2"], ["j3", "j4"])} data-testid="modal-confirm">Confirmar</button>
      </div>
    );
  },
}));

// Mock do alert
const mockAlert = jest.fn();
global.alert = mockAlert;

// Mock do console.error para não poluir output
const mockConsoleError = jest.fn();
console.error = mockConsoleError;

// ============================================
// DADOS DE TESTE
// ============================================

const criarJogadorEquipe = (id: string, nome: string, genero: GeneroJogador = GeneroJogador.MASCULINO): JogadorEquipe => ({
  id,
  nome,
  nivel: NivelJogador.INTERMEDIARIO,
  genero,
});

const criarEquipe = (id: string, nome: string): Equipe => ({
  id,
  etapaId: "etapa-1",
  arenaId: "arena-1",
  nome,
  ordem: 1,
  jogadores: [
    criarJogadorEquipe("j1", "João"),
    criarJogadorEquipe("j2", "Pedro"),
    criarJogadorEquipe("j3", "Ana", GeneroJogador.FEMININO),
    criarJogadorEquipe("j4", "Maria", GeneroJogador.FEMININO),
  ],
  confrontos: 0,
  vitorias: 0,
  derrotas: 0,
  pontos: 0,
  jogosVencidos: 0,
  jogosPerdidos: 0,
  saldoJogos: 0,
  gamesVencidos: 0,
  gamesPerdidos: 0,
  saldoGames: 0,
  criadoEm: new Date().toISOString(),
  atualizadoEm: new Date().toISOString(),
});

const criarConfronto = (): ConfrontoEquipe => ({
  id: "confronto-1",
  etapaId: "etapa-1",
  arenaId: "arena-1",
  fase: "GRUPOS",
  rodada: 1,
  ordem: 1,
  equipe1Id: "equipe-1",
  equipe1Nome: "Equipe Alpha",
  equipe2Id: "equipe-2",
  equipe2Nome: "Equipe Beta",
  status: StatusConfronto.EM_ANDAMENTO,
  jogosEquipe1: 0,
  jogosEquipe2: 0,
  partidas: ["partida-1", "partida-2"],
  totalPartidas: 2,
  partidasFinalizadas: 0,
  temDecider: false,
  tipoFormacaoJogos: "sorteio",
  criadoEm: new Date().toISOString(),
  atualizadoEm: new Date().toISOString(),
});

const criarPartidaTeams = (
  id: string,
  tipoJogo: TipoJogoTeams = TipoJogoTeams.MASCULINO,
  overrides?: Partial<PartidaTeams>
): PartidaTeams => ({
  id,
  etapaId: "etapa-1",
  arenaId: "arena-1",
  confrontoId: "confronto-1",
  ordem: 1,
  tipoJogo,
  dupla1: [criarJogadorEquipe("j1", "João"), criarJogadorEquipe("j2", "Pedro")],
  dupla2: [criarJogadorEquipe("j3", "Carlos"), criarJogadorEquipe("j4", "Lucas")],
  equipe1Id: "equipe-1",
  equipe1Nome: "Equipe Alpha",
  equipe2Id: "equipe-2",
  equipe2Nome: "Equipe Beta",
  status: StatusPartidaTeams.AGENDADA,
  setsDupla1: 0,
  setsDupla2: 0,
  placar: [],
  criadoEm: new Date().toISOString(),
  atualizadoEm: new Date().toISOString(),
  ...overrides,
});

const defaultProps = {
  etapaId: "etapa-1",
  confronto: criarConfronto(),
  partidas: [
    criarPartidaTeams("partida-1", TipoJogoTeams.MASCULINO),
    criarPartidaTeams("partida-2", TipoJogoTeams.FEMININO, {
      dupla1: [criarJogadorEquipe("j3", "Ana", GeneroJogador.FEMININO), criarJogadorEquipe("j4", "Maria", GeneroJogador.FEMININO)],
      dupla2: [criarJogadorEquipe("j5", "Julia", GeneroJogador.FEMININO), criarJogadorEquipe("j6", "Paula", GeneroJogador.FEMININO)],
    }),
  ],
  equipes: [
    criarEquipe("equipe-1", "Equipe Alpha"),
    criarEquipe("equipe-2", "Equipe Beta"),
  ],
  onClose: jest.fn(),
  onSuccess: jest.fn(),
};

describe("ModalLancamentoResultadosLoteTeams", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // RENDERIZAÇÃO BÁSICA
  // ============================================

  describe("renderização", () => {
    it("deve renderizar modal com título", () => {
      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} />);

      expect(screen.getByText("Registrar Resultados - Confronto")).toBeInTheDocument();
    });

    it("deve mostrar informações do confronto", () => {
      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} />);

      expect(screen.getAllByText("Equipe Alpha").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Equipe Beta").length).toBeGreaterThan(0);
      expect(screen.getByText("x")).toBeInTheDocument();
    });

    it("deve mostrar resumo de partidas", () => {
      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} />);

      expect(screen.getByText("Total Partidas")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("Finalizadas")).toBeInTheDocument();
      expect(screen.getByText("Serão Salvas")).toBeInTheDocument();
    });

    it("deve mostrar jogos com tipos corretos", () => {
      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} />);

      expect(screen.getByText("JOGO 1")).toBeInTheDocument();
      expect(screen.getByText("JOGO 2")).toBeInTheDocument();
      expect(screen.getByText("MASC")).toBeInTheDocument();
      expect(screen.getByText("FEM")).toBeInTheDocument();
    });

    it("deve mostrar outros tipos de jogo", () => {
      const partidas = [
        criarPartidaTeams("partida-1", TipoJogoTeams.MISTO),
        criarPartidaTeams("partida-2", TipoJogoTeams.DECIDER),
        criarPartidaTeams("partida-3", "outro" as TipoJogoTeams),
      ];

      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} partidas={partidas} />);

      expect(screen.getByText("MISTO")).toBeInTheDocument();
      expect(screen.getByText("DECIDER")).toBeInTheDocument();
      expect(screen.getByText("OUTRO")).toBeInTheDocument();
    });

    it("deve mostrar status das partidas", () => {
      const partidas = [
        criarPartidaTeams("partida-1", TipoJogoTeams.MASCULINO),
        criarPartidaTeams("partida-2", TipoJogoTeams.FEMININO, { status: StatusPartidaTeams.FINALIZADA }),
      ];

      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} partidas={partidas} />);

      expect(screen.getByText("Aguardando")).toBeInTheDocument();
      expect(screen.getByText("Finalizada")).toBeInTheDocument();
    });

    it("deve mostrar status desconhecido", () => {
      const partidas = [
        criarPartidaTeams("partida-1", TipoJogoTeams.MASCULINO, { status: "outro" as StatusPartidaTeams }),
      ];

      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} partidas={partidas} />);

      expect(screen.getByText("outro")).toBeInTheDocument();
    });

    it("deve mostrar nomes dos jogadores nas duplas", () => {
      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} />);

      expect(screen.getByText("João / Pedro")).toBeInTheDocument();
      expect(screen.getByText("Carlos / Lucas")).toBeInTheDocument();
    });

    it("deve mostrar inputs de placar", () => {
      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      expect(inputs.length).toBe(4); // 2 partidas x 2 inputs
    });

    it("deve mostrar VS entre as duplas", () => {
      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} />);

      const vsElements = screen.getAllByText("VS");
      expect(vsElements.length).toBe(2); // Um VS por partida
    });
  });

  // ============================================
  // CARREGAR DADOS EXISTENTES
  // ============================================

  describe("carregar dados existentes", () => {
    it("deve preencher inputs com placares de partidas finalizadas", () => {
      const partidas = [
        criarPartidaTeams("partida-1", TipoJogoTeams.MASCULINO, {
          status: StatusPartidaTeams.FINALIZADA,
          placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
        }),
      ];

      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} partidas={partidas} />);

      const inputs = screen.getAllByRole("spinbutton");
      expect(inputs[0]).toHaveValue(6);
      expect(inputs[1]).toHaveValue(4);
    });

    it("deve mostrar contagem correta de partidas já finalizadas", () => {
      const partidas = [
        criarPartidaTeams("partida-1", TipoJogoTeams.MASCULINO, { status: StatusPartidaTeams.FINALIZADA }),
        criarPartidaTeams("partida-2", TipoJogoTeams.FEMININO, { status: StatusPartidaTeams.AGENDADA }),
      ];

      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} partidas={partidas} />);

      const summaryValues = screen.getAllByText("1");
      expect(summaryValues.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // ENTRADA DE DADOS
  // ============================================

  describe("entrada de dados", () => {
    it("deve permitir digitar placar", () => {
      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      expect(inputs[0]).toHaveValue(6);
      expect(inputs[1]).toHaveValue(4);
    });

    it("deve atualizar contador de partidas a salvar", () => {
      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} />);

      expect(screen.getByText("Salvar Resultados (0)")).toBeInTheDocument();

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });

      expect(screen.getByText("Salvar Resultados (1)")).toBeInTheDocument();
    });

    it("deve limpar erro ao digitar", () => {
      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText(/Preencha o placar da segunda dupla/)).toBeInTheDocument();

      fireEvent.change(inputs[1], { target: { value: "4" } });

      expect(screen.queryByText(/Preencha o placar da segunda dupla/)).not.toBeInTheDocument();
    });
  });

  // ============================================
  // VALIDAÇÃO DE PLACARES
  // ============================================

  describe("validação de placares", () => {
    it("deve mostrar erro quando apenas primeiro placar é preenchido", async () => {
      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText(/Preencha o placar da segunda dupla/)).toBeInTheDocument();
    });

    it("deve mostrar erro quando apenas segundo placar é preenchido", async () => {
      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[1], { target: { value: "6" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText(/Preencha o placar da primeira dupla/)).toBeInTheDocument();
    });

    it("deve mostrar erro para placar 0 x 0", async () => {
      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "0" } });
      fireEvent.change(inputs[1], { target: { value: "0" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText(/O placar não pode ser 0 x 0/)).toBeInTheDocument();
    });

    it("deve mostrar erro para vencedor com menos de 4 games", async () => {
      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "3" } });
      fireEvent.change(inputs[1], { target: { value: "2" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText(/O set deve ter no mínimo 4 games para o vencedor/)).toBeInTheDocument();
    });

    it("deve mostrar erro para 4 games com mais de 2 do perdedor", async () => {
      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "4" } });
      fireEvent.change(inputs[1], { target: { value: "3" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText(/Set com 4 games: placar deve ser 4-0, 4-1 ou 4-2/)).toBeInTheDocument();
    });

    it("deve mostrar erro para 5 games com menos de 3 do perdedor", async () => {
      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "5" } });
      fireEvent.change(inputs[1], { target: { value: "2" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText(/Set com 5 games: placar deve ser 5-3 ou 5-4/)).toBeInTheDocument();
    });

    it("deve mostrar erro para 6 games com mais de 4 do perdedor", async () => {
      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "5" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText(/Set com 6 games: placar deve ser 6-0, 6-1, 6-2, 6-3 ou 6-4/)).toBeInTheDocument();
    });

    it("deve mostrar erro para 7 games com menos de 5 do perdedor", async () => {
      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "7" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText(/Set com 7 games: placar deve ser 7-5 ou 7-6/)).toBeInTheDocument();
    });

    it("deve mostrar erro para mais de 7 games", async () => {
      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "8" } });
      fireEvent.change(inputs[1], { target: { value: "6" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText(/Set não pode ter mais de 7 games/)).toBeInTheDocument();
    });

    it("deve mostrar erro para empate", async () => {
      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "5" } });
      fireEvent.change(inputs[1], { target: { value: "5" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText(/Não há um vencedor definido/)).toBeInTheDocument();
    });

    it("deve aceitar placar 6-4 válido", async () => {
      mockTeamsService.registrarResultadosEmLote.mockResolvedValue({ processados: 1, erros: [] });

      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      await waitFor(() => {
        expect(mockTeamsService.registrarResultadosEmLote).toHaveBeenCalled();
      });
    });

    it("deve mostrar erro global quando há múltiplos erros de validação", async () => {
      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "0" } });
      fireEvent.change(inputs[1], { target: { value: "0" } });
      fireEvent.change(inputs[2], { target: { value: "3" } });
      fireEvent.change(inputs[3], { target: { value: "2" } });

      fireEvent.click(screen.getByText("Salvar Resultados (2)"));

      expect(screen.getByText(/2 partida\(s\) com erro de validação/)).toBeInTheDocument();
    });
  });

  // ============================================
  // SUBMISSÃO
  // ============================================

  describe("submissão", () => {
    it("deve mostrar erro quando nenhum resultado preenchido", async () => {
      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} />);

      fireEvent.click(screen.getByText("Salvar Resultados (0)"));

      expect(screen.getByText("Nenhum resultado foi preenchido")).toBeInTheDocument();
    });

    it("deve chamar service com dados corretos", async () => {
      mockTeamsService.registrarResultadosEmLote.mockResolvedValue({ processados: 1, erros: [] });

      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      await waitFor(() => {
        expect(mockTeamsService.registrarResultadosEmLote).toHaveBeenCalledWith(
          "etapa-1",
          [
            {
              partidaId: "partida-1",
              placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
            },
          ]
        );
      });
    });

    it("deve chamar onSuccess e mostrar alert após sucesso", async () => {
      mockTeamsService.registrarResultadosEmLote.mockResolvedValue({ processados: 1, erros: [] });

      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith("1 resultado(s) salvo(s) com sucesso!");
        expect(defaultProps.onSuccess).toHaveBeenCalled();
      });
    });

    it("deve lidar com erros do service", async () => {
      mockTeamsService.registrarResultadosEmLote.mockResolvedValue({
        processados: 0,
        erros: [{ partidaId: "partida-1", erro: "Erro ao salvar" }],
      });

      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      await waitFor(() => {
        expect(screen.getByText(/0 resultado\(s\) salvo\(s\), mas 1 erro\(s\) ocorreram/)).toBeInTheDocument();
      });
    });

    it("deve lidar com exceção do service", async () => {
      mockTeamsService.registrarResultadosEmLote.mockRejectedValue(new Error("Erro de rede"));

      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      await waitFor(() => {
        expect(screen.getByText("Erro de rede")).toBeInTheDocument();
      });
    });

    it("deve lidar com exceção genérica do service", async () => {
      mockTeamsService.registrarResultadosEmLote.mockRejectedValue({});

      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      await waitFor(() => {
        expect(screen.getByText("Erro ao salvar resultados. Tente novamente.")).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // FECHAR MODAL
  // ============================================

  describe("fechar modal", () => {
    it("deve chamar onClose ao clicar em Cancelar", () => {
      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} />);

      fireEvent.click(screen.getByText("Cancelar"));

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it("deve chamar onClose ao clicar no X", () => {
      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} />);

      fireEvent.click(screen.getByText("✕"));

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  // ============================================
  // ETAPA FINALIZADA
  // ============================================

  describe("etapa finalizada", () => {
    it("deve desabilitar botão quando etapa finalizada", () => {
      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} etapaFinalizada={true} />);

      const submitButton = screen.getByText("Etapa Finalizada");
      expect(submitButton).toBeDisabled();
    });

    it("deve usar etapaFinalizada false por padrão", () => {
      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} />);

      expect(screen.queryByText("Etapa Finalizada")).not.toBeInTheDocument();
    });
  });

  // ============================================
  // LOADING
  // ============================================

  describe("loading", () => {
    it("deve mostrar overlay de loading durante salvamento", async () => {
      mockTeamsService.registrarResultadosEmLote.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ processados: 1, erros: [] }), 100))
      );

      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText("Salvando resultados...")).toBeInTheDocument();
    });

    it("deve desabilitar inputs durante loading", async () => {
      mockTeamsService.registrarResultadosEmLote.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ processados: 1, erros: [] }), 100))
      );

      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      const allInputs = screen.getAllByRole("spinbutton");
      allInputs.forEach((input) => {
        expect(input).toBeDisabled();
      });
    });

    it("deve desabilitar botões durante loading", async () => {
      mockTeamsService.registrarResultadosEmLote.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ processados: 1, erros: [] }), 100))
      );

      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText("Cancelar")).toBeDisabled();
      expect(screen.getByText("✕")).toBeDisabled();
    });
  });

  // ============================================
  // FORMAÇÃO MANUAL
  // ============================================

  describe("formação manual", () => {
    it("deve mostrar alerta quando partida precisa definir jogadores", () => {
      const partidas = [
        criarPartidaTeams("partida-1", TipoJogoTeams.MASCULINO, {
          dupla1: [],
          dupla2: [],
        }),
      ];

      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} partidas={partidas} tipoFormacaoManual={true} />);

      expect(screen.getByText("Jogadores não definidos")).toBeInTheDocument();
      expect(screen.getByText("Definir Jogadores")).toBeInTheDocument();
    });

    it("deve mostrar contador de partidas sem jogadores", () => {
      const partidas = [
        criarPartidaTeams("partida-1", TipoJogoTeams.MASCULINO, { dupla1: [], dupla2: [] }),
        criarPartidaTeams("partida-2", TipoJogoTeams.FEMININO),
      ];

      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} partidas={partidas} tipoFormacaoManual={true} />);

      expect(screen.getByText("Sem Jogadores")).toBeInTheDocument();
    });

    it("deve abrir modal de definir jogadores ao clicar no botão", () => {
      const partidas = [
        criarPartidaTeams("partida-1", TipoJogoTeams.MASCULINO, { dupla1: [], dupla2: [] }),
      ];

      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} partidas={partidas} tipoFormacaoManual={true} />);

      fireEvent.click(screen.getByText("Definir Jogadores"));

      expect(screen.getByTestId("modal-definir-jogadores")).toBeInTheDocument();
    });

    it("deve fechar modal de definir jogadores", () => {
      const partidas = [
        criarPartidaTeams("partida-1", TipoJogoTeams.MASCULINO, { dupla1: [], dupla2: [] }),
      ];

      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} partidas={partidas} tipoFormacaoManual={true} />);

      fireEvent.click(screen.getByText("Definir Jogadores"));
      fireEvent.click(screen.getByTestId("modal-close"));

      expect(screen.queryByTestId("modal-definir-jogadores")).not.toBeInTheDocument();
    });

    it("deve recarregar partidas após definir jogadores", async () => {
      const partidas = [
        criarPartidaTeams("partida-1", TipoJogoTeams.MASCULINO, { dupla1: [], dupla2: [] }),
      ];

      mockTeamsService.definirJogadoresPartida.mockResolvedValue({});
      mockTeamsService.buscarPartidasConfronto.mockResolvedValue([
        criarPartidaTeams("partida-1", TipoJogoTeams.MASCULINO),
      ]);

      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} partidas={partidas} tipoFormacaoManual={true} />);

      fireEvent.click(screen.getByText("Definir Jogadores"));
      fireEvent.click(screen.getByTestId("modal-confirm"));

      await waitFor(() => {
        expect(mockTeamsService.definirJogadoresPartida).toHaveBeenCalled();
        expect(mockTeamsService.buscarPartidasConfronto).toHaveBeenCalled();
      });
    });

    it("deve lidar com erro ao recarregar partidas", async () => {
      const partidas = [
        criarPartidaTeams("partida-1", TipoJogoTeams.MASCULINO, { dupla1: [], dupla2: [] }),
      ];

      mockTeamsService.definirJogadoresPartida.mockResolvedValue({});
      mockTeamsService.buscarPartidasConfronto.mockRejectedValue(new Error("Erro ao recarregar"));

      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} partidas={partidas} tipoFormacaoManual={true} />);

      fireEvent.click(screen.getByText("Definir Jogadores"));
      fireEvent.click(screen.getByTestId("modal-confirm"));

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalled();
      });
    });

    it("deve mostrar erro quando tenta salvar partida sem jogadores definidos", async () => {
      const partidas = [
        criarPartidaTeams("partida-1", TipoJogoTeams.MASCULINO, { dupla1: [], dupla2: [] }),
      ];

      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} partidas={partidas} tipoFormacaoManual={true} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText("Defina os jogadores antes de registrar o resultado")).toBeInTheDocument();
    });

    it("deve desabilitar inputs quando partida precisa definir jogadores", () => {
      const partidas = [
        criarPartidaTeams("partida-1", TipoJogoTeams.MASCULINO, { dupla1: [], dupla2: [] }),
      ];

      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} partidas={partidas} tipoFormacaoManual={true} />);

      const inputs = screen.getAllByRole("spinbutton");
      inputs.forEach((input) => {
        expect(input).toBeDisabled();
      });
    });
  });

  // ============================================
  // LABELS DE DUPLAS
  // ============================================

  describe("labels de duplas", () => {
    it("deve mostrar nome da equipe quando dupla não definida", () => {
      const partidas = [
        criarPartidaTeams("partida-1", TipoJogoTeams.MASCULINO, {
          dupla1: [],
          dupla2: [],
          equipe1Nome: "Time Alpha",
          equipe2Nome: "Time Beta",
        }),
      ];

      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} partidas={partidas} tipoFormacaoManual={false} />);

      // Nome da equipe aparece em múltiplos lugares (header do confronto e nos cards)
      expect(screen.getAllByText("Time Alpha").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Time Beta").length).toBeGreaterThan(0);
    });

    it("deve mostrar 'A definir' quando sem equipe e sem dupla", () => {
      const partidas = [
        criarPartidaTeams("partida-1", TipoJogoTeams.MASCULINO, {
          dupla1: [],
          dupla2: [],
          equipe1Nome: undefined,
          equipe2Nome: undefined,
        }),
      ];

      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} partidas={partidas} tipoFormacaoManual={false} />);

      const aDefinir = screen.getAllByText("A definir");
      expect(aDefinir.length).toBe(2);
    });
  });

  // ============================================
  // PARTIDA SEM TIPO
  // ============================================

  describe("partida sem tipo", () => {
    it("deve renderizar partida sem tipoJogo definido", () => {
      const partidas = [
        { ...criarPartidaTeams("partida-1", TipoJogoTeams.MASCULINO), tipoJogo: undefined as any },
      ];

      render(<ModalLancamentoResultadosLoteTeams {...defaultProps} partidas={partidas} />);

      expect(screen.getByText("JOGO 1")).toBeInTheDocument();
      expect(screen.queryByText("MASC")).not.toBeInTheDocument();
    });
  });
});
