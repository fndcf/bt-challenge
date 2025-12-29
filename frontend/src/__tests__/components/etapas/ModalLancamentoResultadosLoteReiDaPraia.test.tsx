/**
 * Testes para ModalLancamentoResultadosLoteReiDaPraia
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ModalLancamentoResultadosLoteReiDaPraia } from "@/components/etapas/ModalLancamentoResultadosLoteReiDaPraia/ModalLancamentoResultadosLoteReiDaPraia";
import { PartidaReiDaPraia } from "@/types/reiDaPraia";

// Mock do service
const mockReiDaPraiaService = {
  registrarResultadosEmLote: jest.fn(),
};

jest.mock("@/services", () => ({
  getReiDaPraiaService: () => mockReiDaPraiaService,
}));

// Mock do alert
const mockAlert = jest.fn();
global.alert = mockAlert;

// ============================================
// DADOS DE TESTE
// ============================================

const criarPartidaReiDaPraia = (
  id: string,
  overrides?: Partial<PartidaReiDaPraia>
): PartidaReiDaPraia => ({
  id,
  etapaId: "etapa-1",
  arenaId: "arena-1",
  fase: "GRUPOS",
  grupoId: "grupo-1",
  grupoNome: "Grupo A",
  rodada: 1,
  jogador1AId: "jogador-1",
  jogador1ANome: "João",
  jogador1BId: "jogador-2",
  jogador1BNome: "Pedro",
  dupla1Nome: "João & Pedro",
  jogador2AId: "jogador-3",
  jogador2ANome: "Carlos",
  jogador2BId: "jogador-4",
  jogador2BNome: "Lucas",
  dupla2Nome: "Carlos & Lucas",
  status: "agendada",
  setsDupla1: 0,
  setsDupla2: 0,
  placar: [],
  criadoEm: new Date().toISOString(),
  atualizadoEm: new Date().toISOString(),
  ...overrides,
});

const defaultProps = {
  partidas: [
    criarPartidaReiDaPraia("partida-1"),
    criarPartidaReiDaPraia("partida-2", {
      jogador1ANome: "Ana",
      jogador1BNome: "Maria",
      jogador2ANome: "Julia",
      jogador2BNome: "Paula",
    }),
    criarPartidaReiDaPraia("partida-3", {
      jogador1ANome: "Ricardo",
      jogador1BNome: "Marcos",
      jogador2ANome: "Fernanda",
      jogador2BNome: "Lucia",
    }),
  ],
  grupoNome: "Grupo A",
  onClose: jest.fn(),
  onSuccess: jest.fn(),
};

describe("ModalLancamentoResultadosLoteReiDaPraia", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // RENDERIZAÇÃO BÁSICA
  // ============================================

  describe("renderização", () => {
    it("deve renderizar modal com título", () => {
      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      expect(screen.getByText("Registrar Resultados - Grupo A")).toBeInTheDocument();
    });

    it("deve mostrar resumo de partidas", () => {
      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      expect(screen.getByText("Total de Partidas")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("Já Finalizadas")).toBeInTheDocument();
      expect(screen.getByText("Serão Salvas")).toBeInTheDocument();
    });

    it("deve mostrar todas as partidas", () => {
      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      expect(screen.getByText("PARTIDA 1")).toBeInTheDocument();
      expect(screen.getByText("PARTIDA 2")).toBeInTheDocument();
      expect(screen.getByText("PARTIDA 3")).toBeInTheDocument();
    });

    it("deve mostrar nomes dos jogadores nas duplas", () => {
      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      // Verifica que os nomes dos jogadores aparecem (formato: Jogador1 & Jogador2)
      expect(screen.getAllByText(/João & Pedro/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Carlos & Lucas/).length).toBeGreaterThan(0);
    });

    it("deve mostrar status das partidas", () => {
      const partidas = [
        criarPartidaReiDaPraia("partida-1"),
        criarPartidaReiDaPraia("partida-2", { status: "finalizada" }),
      ];

      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} partidas={partidas} />);

      expect(screen.getByText("Aguardando")).toBeInTheDocument();
      expect(screen.getByText("Finalizada")).toBeInTheDocument();
    });

    it("deve mostrar inputs de placar", () => {
      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      expect(inputs.length).toBe(6); // 3 partidas x 2 inputs
    });

    it("deve mostrar VS entre as duplas", () => {
      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const vsElements = screen.getAllByText("VS");
      expect(vsElements.length).toBe(3); // Um VS por partida
    });
  });

  // ============================================
  // CARREGAR DADOS EXISTENTES
  // ============================================

  describe("carregar dados existentes", () => {
    it("deve preencher inputs com placares de partidas finalizadas", () => {
      const partidas = [
        criarPartidaReiDaPraia("partida-1", {
          status: "finalizada",
          placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4, vencedorId: "dupla-1" }],
        }),
      ];

      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} partidas={partidas} />);

      const inputs = screen.getAllByRole("spinbutton");
      expect(inputs[0]).toHaveValue(6);
      expect(inputs[1]).toHaveValue(4);
    });

    it("deve mostrar contagem correta de partidas já finalizadas", () => {
      const partidas = [
        criarPartidaReiDaPraia("partida-1", { status: "finalizada" }),
        criarPartidaReiDaPraia("partida-2", { status: "finalizada" }),
        criarPartidaReiDaPraia("partida-3", { status: "agendada" }),
      ];

      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} partidas={partidas} />);

      // Verificar que mostra "2" para já finalizadas
      const summaryValues = screen.getAllByText("2");
      expect(summaryValues.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // ENTRADA DE DADOS
  // ============================================

  describe("entrada de dados", () => {
    it("deve permitir digitar placar", () => {
      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      expect(inputs[0]).toHaveValue(6);
      expect(inputs[1]).toHaveValue(4);
    });

    it("deve atualizar contador de partidas a salvar", () => {
      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      // Inicialmente 0 a salvar
      expect(screen.getByText("Salvar Resultados (0)")).toBeInTheDocument();

      // Preencher uma partida
      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });

      // Agora 1 a salvar (mesmo com 1 campo preenchido)
      expect(screen.getByText("Salvar Resultados (1)")).toBeInTheDocument();
    });

    it("deve limpar erro ao digitar", () => {
      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      // Preencher parcialmente e submeter
      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });

      // Submeter
      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      // Deve mostrar erro
      expect(screen.getByText(/Preencha o placar da segunda dupla/)).toBeInTheDocument();

      // Corrigir
      fireEvent.change(inputs[1], { target: { value: "4" } });

      // Erro deve sumir
      expect(screen.queryByText(/Preencha o placar da segunda dupla/)).not.toBeInTheDocument();
    });

    it("deve permitir limpar valor do input", () => {
      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      expect(inputs[0]).toHaveValue(6);

      fireEvent.change(inputs[0], { target: { value: "" } });
      expect(inputs[0]).toHaveValue(null);
    });
  });

  // ============================================
  // VALIDAÇÃO DE PLACARES
  // ============================================

  describe("validação de placares", () => {
    it("deve mostrar erro quando apenas primeiro placar é preenchido", async () => {
      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText(/Preencha o placar da segunda dupla/)).toBeInTheDocument();
    });

    it("deve mostrar erro quando apenas segundo placar é preenchido", async () => {
      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[1], { target: { value: "6" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText(/Preencha o placar da primeira dupla/)).toBeInTheDocument();
    });

    it("deve mostrar erro para placar 0 x 0", async () => {
      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "0" } });
      fireEvent.change(inputs[1], { target: { value: "0" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText(/O placar não pode ser 0 x 0/)).toBeInTheDocument();
    });

    it("deve mostrar erro para vencedor com menos de 4 games", async () => {
      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "3" } });
      fireEvent.change(inputs[1], { target: { value: "2" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText(/O set deve ter no mínimo 4 games para o vencedor/)).toBeInTheDocument();
    });

    it("deve mostrar erro para 4 games com mais de 2 do perdedor", async () => {
      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "4" } });
      fireEvent.change(inputs[1], { target: { value: "3" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText(/Set com 4 games: placar deve ser 4-0, 4-1 ou 4-2/)).toBeInTheDocument();
    });

    it("deve mostrar erro para 5 games com menos de 3 do perdedor", async () => {
      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "5" } });
      fireEvent.change(inputs[1], { target: { value: "2" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText(/Set com 5 games: placar deve ser 5-3 ou 5-4/)).toBeInTheDocument();
    });

    it("deve mostrar erro para 6 games com mais de 4 do perdedor", async () => {
      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "5" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText(/Set com 6 games: placar deve ser 6-0, 6-1, 6-2, 6-3 ou 6-4/)).toBeInTheDocument();
    });

    it("deve mostrar erro para 7 games com menos de 5 do perdedor", async () => {
      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "7" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText(/Set com 7 games: placar deve ser 7-5 ou 7-6/)).toBeInTheDocument();
    });

    it("deve mostrar erro para mais de 7 games", async () => {
      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "8" } });
      fireEvent.change(inputs[1], { target: { value: "6" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText(/Set não pode ter mais de 7 games/)).toBeInTheDocument();
    });

    it("deve mostrar erro para empate", async () => {
      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "5" } });
      fireEvent.change(inputs[1], { target: { value: "5" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText(/Não há um vencedor definido/)).toBeInTheDocument();
    });

    it("deve aceitar placar 4-0 válido", async () => {
      mockReiDaPraiaService.registrarResultadosEmLote.mockResolvedValue({ processados: 1, erros: [] });

      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "4" } });
      fireEvent.change(inputs[1], { target: { value: "0" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      await waitFor(() => {
        expect(mockReiDaPraiaService.registrarResultadosEmLote).toHaveBeenCalled();
      });
    });

    it("deve aceitar placar 4-1 válido", async () => {
      mockReiDaPraiaService.registrarResultadosEmLote.mockResolvedValue({ processados: 1, erros: [] });

      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "4" } });
      fireEvent.change(inputs[1], { target: { value: "1" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      await waitFor(() => {
        expect(mockReiDaPraiaService.registrarResultadosEmLote).toHaveBeenCalled();
      });
    });

    it("deve aceitar placar 4-2 válido", async () => {
      mockReiDaPraiaService.registrarResultadosEmLote.mockResolvedValue({ processados: 1, erros: [] });

      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "4" } });
      fireEvent.change(inputs[1], { target: { value: "2" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      await waitFor(() => {
        expect(mockReiDaPraiaService.registrarResultadosEmLote).toHaveBeenCalled();
      });
    });

    it("deve aceitar placar 5-3 válido", async () => {
      mockReiDaPraiaService.registrarResultadosEmLote.mockResolvedValue({ processados: 1, erros: [] });

      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "5" } });
      fireEvent.change(inputs[1], { target: { value: "3" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      await waitFor(() => {
        expect(mockReiDaPraiaService.registrarResultadosEmLote).toHaveBeenCalled();
      });
    });

    it("deve aceitar placar 5-4 válido", async () => {
      mockReiDaPraiaService.registrarResultadosEmLote.mockResolvedValue({ processados: 1, erros: [] });

      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "5" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      await waitFor(() => {
        expect(mockReiDaPraiaService.registrarResultadosEmLote).toHaveBeenCalled();
      });
    });

    it("deve aceitar placar 6-4 válido", async () => {
      mockReiDaPraiaService.registrarResultadosEmLote.mockResolvedValue({ processados: 1, erros: [] });

      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      await waitFor(() => {
        expect(mockReiDaPraiaService.registrarResultadosEmLote).toHaveBeenCalled();
      });
    });

    it("deve aceitar placar 7-5 válido", async () => {
      mockReiDaPraiaService.registrarResultadosEmLote.mockResolvedValue({ processados: 1, erros: [] });

      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "7" } });
      fireEvent.change(inputs[1], { target: { value: "5" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      await waitFor(() => {
        expect(mockReiDaPraiaService.registrarResultadosEmLote).toHaveBeenCalled();
      });
    });

    it("deve aceitar placar 7-6 válido", async () => {
      mockReiDaPraiaService.registrarResultadosEmLote.mockResolvedValue({ processados: 1, erros: [] });

      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "7" } });
      fireEvent.change(inputs[1], { target: { value: "6" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      await waitFor(() => {
        expect(mockReiDaPraiaService.registrarResultadosEmLote).toHaveBeenCalled();
      });
    });

    it("deve mostrar erro global quando há múltiplos erros de validação", async () => {
      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      // Preencher duas partidas com placares inválidos
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
      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      fireEvent.click(screen.getByText("Salvar Resultados (0)"));

      expect(screen.getByText("Nenhum resultado foi preenchido")).toBeInTheDocument();
    });

    it("deve chamar service com dados corretos", async () => {
      mockReiDaPraiaService.registrarResultadosEmLote.mockResolvedValue({ processados: 1, erros: [] });

      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      await waitFor(() => {
        expect(mockReiDaPraiaService.registrarResultadosEmLote).toHaveBeenCalledWith(
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
      mockReiDaPraiaService.registrarResultadosEmLote.mockResolvedValue({ processados: 1, erros: [] });

      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

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
      mockReiDaPraiaService.registrarResultadosEmLote.mockResolvedValue({
        processados: 0,
        erros: [{ partidaId: "partida-1", erro: "Erro ao salvar" }],
      });

      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      await waitFor(() => {
        expect(screen.getByText(/0 resultado\(s\) salvo\(s\), mas 1 erro\(s\) encontrado\(s\)/)).toBeInTheDocument();
      });
    });

    it("deve mostrar erros individuais das partidas retornados pelo service", async () => {
      mockReiDaPraiaService.registrarResultadosEmLote.mockResolvedValue({
        processados: 0,
        erros: [{ partidaId: "partida-1", erro: "Partida já finalizada" }],
      });

      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      await waitFor(() => {
        // O erro é prefixado com "❌ " no componente
        expect(screen.getByText(/Partida já finalizada/)).toBeInTheDocument();
      });
    });

    it("deve lidar com erros parciais", async () => {
      mockReiDaPraiaService.registrarResultadosEmLote.mockResolvedValue({
        processados: 1,
        erros: [{ partidaId: "partida-2", erro: "Erro na partida 2" }],
      });

      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      // Preencher 2 partidas
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });
      fireEvent.change(inputs[2], { target: { value: "6" } });
      fireEvent.change(inputs[3], { target: { value: "3" } });

      fireEvent.click(screen.getByText("Salvar Resultados (2)"));

      await waitFor(() => {
        expect(screen.getByText(/1 resultado\(s\) salvo\(s\), mas 1 erro\(s\) encontrado\(s\)/)).toBeInTheDocument();
      });
    });

    it("deve lidar com exceção do service", async () => {
      mockReiDaPraiaService.registrarResultadosEmLote.mockRejectedValue(new Error("Erro de rede"));

      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      await waitFor(() => {
        expect(screen.getByText("Erro de rede")).toBeInTheDocument();
      });
    });

    it("deve lidar com exceção genérica do service", async () => {
      mockReiDaPraiaService.registrarResultadosEmLote.mockRejectedValue({});

      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      await waitFor(() => {
        expect(screen.getByText("Erro ao salvar resultados. Tente novamente.")).toBeInTheDocument();
      });
    });

    it("deve enviar múltiplos resultados corretamente", async () => {
      mockReiDaPraiaService.registrarResultadosEmLote.mockResolvedValue({ processados: 2, erros: [] });

      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      // Preencher 2 partidas
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });
      fireEvent.change(inputs[2], { target: { value: "7" } });
      fireEvent.change(inputs[3], { target: { value: "5" } });

      fireEvent.click(screen.getByText("Salvar Resultados (2)"));

      await waitFor(() => {
        expect(mockReiDaPraiaService.registrarResultadosEmLote).toHaveBeenCalledWith(
          "etapa-1",
          [
            {
              partidaId: "partida-1",
              placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
            },
            {
              partidaId: "partida-2",
              placar: [{ numero: 1, gamesDupla1: 7, gamesDupla2: 5 }],
            },
          ]
        );
      });
    });

    it("deve mostrar erro quando etapa não encontrada", async () => {
      const partidasSemEtapa = [
        {
          ...criarPartidaReiDaPraia("partida-1"),
          etapaId: "",
        },
      ];

      render(
        <ModalLancamentoResultadosLoteReiDaPraia
          {...defaultProps}
          partidas={partidasSemEtapa as PartidaReiDaPraia[]}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      await waitFor(() => {
        expect(screen.getByText("Etapa não encontrada")).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // FECHAR MODAL
  // ============================================

  describe("fechar modal", () => {
    it("deve chamar onClose ao clicar em Cancelar", () => {
      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      fireEvent.click(screen.getByText("Cancelar"));

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it("deve chamar onClose ao clicar no X", () => {
      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      fireEvent.click(screen.getByText("✕"));

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it("deve permitir fechar modal quando não está carregando", () => {
      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      // Verificar que o modal está aberto e pode ser fechado
      expect(screen.getByText("Cancelar")).not.toBeDisabled();
    });
  });

  // ============================================
  // ETAPA FINALIZADA
  // ============================================

  describe("etapa finalizada", () => {
    it("deve desabilitar botão quando etapa finalizada", () => {
      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} etapaFinalizada={true} />);

      const submitButton = screen.getByText("Etapa Finalizada");
      expect(submitButton).toBeDisabled();
    });

    it("deve permitir visualizar partidas quando etapa finalizada", () => {
      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} etapaFinalizada={true} />);

      // As partidas devem ser exibidas
      expect(screen.getByText("PARTIDA 1")).toBeInTheDocument();
      expect(screen.getByText("PARTIDA 2")).toBeInTheDocument();
      expect(screen.getByText("PARTIDA 3")).toBeInTheDocument();
    });

    it("deve usar etapaFinalizada false por padrão", () => {
      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const submitButton = screen.getByText("Salvar Resultados (0)");
      expect(submitButton).not.toBeDisabled();
    });
  });

  // ============================================
  // LOADING
  // ============================================

  describe("loading", () => {
    it("deve mostrar overlay de loading durante salvamento", async () => {
      mockReiDaPraiaService.registrarResultadosEmLote.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ processados: 1, erros: [] }), 100))
      );

      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText("Salvando resultados...")).toBeInTheDocument();
    });

    it("deve desabilitar inputs durante loading", async () => {
      mockReiDaPraiaService.registrarResultadosEmLote.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ processados: 1, erros: [] }), 100))
      );

      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      // Durante loading, os inputs devem estar desabilitados
      const allInputs = screen.getAllByRole("spinbutton");
      allInputs.forEach((input) => {
        expect(input).toBeDisabled();
      });
    });

    it("deve desabilitar botão de fechar durante loading", async () => {
      mockReiDaPraiaService.registrarResultadosEmLote.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ processados: 1, erros: [] }), 100))
      );

      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      // O botão de fechar (X) deve estar desabilitado
      const closeButton = screen.getByText("✕");
      expect(closeButton).toBeDisabled();
    });

    it("deve desabilitar botão Cancelar durante loading", async () => {
      mockReiDaPraiaService.registrarResultadosEmLote.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ processados: 1, erros: [] }), 100))
      );

      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      // O botão Cancelar deve estar desabilitado
      expect(screen.getByText("Cancelar")).toBeDisabled();
    });

    it("deve mostrar texto Salvando no botão durante loading", async () => {
      mockReiDaPraiaService.registrarResultadosEmLote.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ processados: 1, erros: [] }), 100))
      );

      render(<ModalLancamentoResultadosLoteReiDaPraia {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText("Salvando...")).toBeInTheDocument();
    });
  });
});
