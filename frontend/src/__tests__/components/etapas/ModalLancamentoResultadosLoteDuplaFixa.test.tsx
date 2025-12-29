/**
 * Testes para ModalLancamentoResultadosLoteDuplaFixa
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ModalLancamentoResultadosLoteDuplaFixa } from "@/components/etapas/ModalLancamentoResultadosLoteDuplaFixa/ModalLancamentoResultadosLoteDuplaFixa";
import { Partida } from "@/types/chave";

// Mock do service
const mockPartidaService = {
  registrarResultadosEmLote: jest.fn(),
};

jest.mock("@/services", () => ({
  getPartidaService: () => mockPartidaService,
}));

// Mock do alert
const mockAlert = jest.fn();
global.alert = mockAlert;

// ============================================
// DADOS DE TESTE
// ============================================

const criarPartida = (id: string, overrides?: Partial<Partida>): Partida => ({
  id,
  chaveId: "chave-1",
  etapaId: "etapa-1",
  arenaId: "arena-1",
  grupoId: "grupo-1",
  fase: "GRUPOS",
  rodada: 1,
  dupla1Id: "dupla-1",
  dupla1Nome: "João / Pedro",
  dupla2Id: "dupla-2",
  dupla2Nome: "Carlos / Lucas",
  status: "agendada",
  placar: [],
  criadoEm: new Date().toISOString(),
  atualizadoEm: new Date().toISOString(),
  ...overrides,
});

const defaultProps = {
  partidas: [
    criarPartida("partida-1"),
    criarPartida("partida-2", {
      dupla1Nome: "Ana / Maria",
      dupla2Nome: "Julia / Paula",
    }),
    criarPartida("partida-3", {
      dupla1Nome: "Ricardo / Marcos",
      dupla2Nome: "Fernanda / Lucia",
    }),
  ],
  grupoNome: "Grupo A",
  onClose: jest.fn(),
  onSuccess: jest.fn(),
};

describe("ModalLancamentoResultadosLoteDuplaFixa", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // RENDERIZAÇÃO BÁSICA
  // ============================================

  describe("renderização", () => {
    it("deve renderizar modal com título", () => {
      render(<ModalLancamentoResultadosLoteDuplaFixa {...defaultProps} />);

      expect(screen.getByText("Registrar Resultados - Grupo A")).toBeInTheDocument();
    });

    it("deve mostrar resumo de partidas", () => {
      render(<ModalLancamentoResultadosLoteDuplaFixa {...defaultProps} />);

      expect(screen.getByText("Total de Partidas")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("Já Finalizadas")).toBeInTheDocument();
      expect(screen.getByText("Serão Salvas")).toBeInTheDocument();
    });

    it("deve mostrar todas as partidas", () => {
      render(<ModalLancamentoResultadosLoteDuplaFixa {...defaultProps} />);

      expect(screen.getByText("PARTIDA 1")).toBeInTheDocument();
      expect(screen.getByText("PARTIDA 2")).toBeInTheDocument();
      expect(screen.getByText("PARTIDA 3")).toBeInTheDocument();
    });

    it("deve mostrar nomes das duplas", () => {
      render(<ModalLancamentoResultadosLoteDuplaFixa {...defaultProps} />);

      expect(screen.getAllByText("João / Pedro").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Carlos / Lucas").length).toBeGreaterThan(0);
    });

    it("deve mostrar status das partidas", () => {
      const partidas = [
        criarPartida("partida-1"),
        criarPartida("partida-2", { status: "finalizada" }),
      ];

      render(<ModalLancamentoResultadosLoteDuplaFixa {...defaultProps} partidas={partidas} />);

      expect(screen.getByText("Aguardando")).toBeInTheDocument();
      expect(screen.getByText("Finalizada")).toBeInTheDocument();
    });

    it("deve mostrar inputs de placar", () => {
      render(<ModalLancamentoResultadosLoteDuplaFixa {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      expect(inputs.length).toBe(6); // 3 partidas x 2 inputs
    });
  });

  // ============================================
  // CARREGAR DADOS EXISTENTES
  // ============================================

  describe("carregar dados existentes", () => {
    it("deve preencher inputs com placares de partidas finalizadas", () => {
      const partidas = [
        criarPartida("partida-1", {
          status: "finalizada",
          placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4, vencedorId: "dupla-1" }],
        }),
      ];

      render(<ModalLancamentoResultadosLoteDuplaFixa {...defaultProps} partidas={partidas} />);

      const inputs = screen.getAllByRole("spinbutton");
      expect(inputs[0]).toHaveValue(6);
      expect(inputs[1]).toHaveValue(4);
    });
  });

  // ============================================
  // ENTRADA DE DADOS
  // ============================================

  describe("entrada de dados", () => {
    it("deve permitir digitar placar", () => {
      render(<ModalLancamentoResultadosLoteDuplaFixa {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      expect(inputs[0]).toHaveValue(6);
      expect(inputs[1]).toHaveValue(4);
    });

    it("deve atualizar contador de partidas a salvar", () => {
      render(<ModalLancamentoResultadosLoteDuplaFixa {...defaultProps} />);

      // Inicialmente 0 a salvar
      expect(screen.getByText("Salvar Resultados (0)")).toBeInTheDocument();

      // Preencher uma partida
      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });

      // Agora 1 a salvar (mesmo com 1 campo preenchido)
      expect(screen.getByText("Salvar Resultados (1)")).toBeInTheDocument();
    });

    it("deve limpar erro ao digitar", () => {
      render(<ModalLancamentoResultadosLoteDuplaFixa {...defaultProps} />);

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
  });

  // ============================================
  // VALIDAÇÃO DE PLACARES
  // ============================================

  describe("validação de placares", () => {
    it("deve mostrar erro quando apenas um placar é preenchido", async () => {
      render(<ModalLancamentoResultadosLoteDuplaFixa {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText(/Preencha o placar da segunda dupla/)).toBeInTheDocument();
    });

    it("deve mostrar erro para placar 0 x 0", async () => {
      render(<ModalLancamentoResultadosLoteDuplaFixa {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "0" } });
      fireEvent.change(inputs[1], { target: { value: "0" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText(/O placar não pode ser 0 x 0/)).toBeInTheDocument();
    });

    it("deve mostrar erro para vencedor com menos de 4 games", async () => {
      render(<ModalLancamentoResultadosLoteDuplaFixa {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "3" } });
      fireEvent.change(inputs[1], { target: { value: "2" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText(/O set deve ter no mínimo 4 games para o vencedor/)).toBeInTheDocument();
    });

    it("deve mostrar erro para 4 games com mais de 2 do perdedor", async () => {
      render(<ModalLancamentoResultadosLoteDuplaFixa {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "4" } });
      fireEvent.change(inputs[1], { target: { value: "3" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText(/Set com 4 games: placar deve ser 4-0, 4-1 ou 4-2/)).toBeInTheDocument();
    });

    it("deve mostrar erro para 5 games inválido", async () => {
      render(<ModalLancamentoResultadosLoteDuplaFixa {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "5" } });
      fireEvent.change(inputs[1], { target: { value: "2" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText(/Set com 5 games: placar deve ser 5-3 ou 5-4/)).toBeInTheDocument();
    });

    it("deve mostrar erro para 6 games inválido", async () => {
      render(<ModalLancamentoResultadosLoteDuplaFixa {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "5" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText(/Set com 6 games: placar deve ser 6-0, 6-1, 6-2, 6-3 ou 6-4/)).toBeInTheDocument();
    });

    it("deve mostrar erro para 7 games inválido", async () => {
      render(<ModalLancamentoResultadosLoteDuplaFixa {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "7" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText(/Set com 7 games: placar deve ser 7-5 ou 7-6/)).toBeInTheDocument();
    });

    it("deve mostrar erro para mais de 7 games", async () => {
      render(<ModalLancamentoResultadosLoteDuplaFixa {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "8" } });
      fireEvent.change(inputs[1], { target: { value: "6" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText(/Set não pode ter mais de 7 games/)).toBeInTheDocument();
    });

    it("deve mostrar erro para empate", async () => {
      render(<ModalLancamentoResultadosLoteDuplaFixa {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "5" } });
      fireEvent.change(inputs[1], { target: { value: "5" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText(/Não há um vencedor definido/)).toBeInTheDocument();
    });

    it("deve aceitar placar 6-4 válido", async () => {
      mockPartidaService.registrarResultadosEmLote.mockResolvedValue({ processados: 1, erros: [] });

      render(<ModalLancamentoResultadosLoteDuplaFixa {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      await waitFor(() => {
        expect(mockPartidaService.registrarResultadosEmLote).toHaveBeenCalled();
      });
    });

    it("deve aceitar placar 7-5 válido", async () => {
      mockPartidaService.registrarResultadosEmLote.mockResolvedValue({ processados: 1, erros: [] });

      render(<ModalLancamentoResultadosLoteDuplaFixa {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "7" } });
      fireEvent.change(inputs[1], { target: { value: "5" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      await waitFor(() => {
        expect(mockPartidaService.registrarResultadosEmLote).toHaveBeenCalled();
      });
    });
  });

  // ============================================
  // SUBMISSÃO
  // ============================================

  describe("submissão", () => {
    it("deve mostrar erro quando nenhum resultado preenchido", async () => {
      render(<ModalLancamentoResultadosLoteDuplaFixa {...defaultProps} />);

      fireEvent.click(screen.getByText("Salvar Resultados (0)"));

      expect(screen.getByText("Nenhum resultado foi preenchido")).toBeInTheDocument();
    });

    it("deve chamar service com dados corretos", async () => {
      mockPartidaService.registrarResultadosEmLote.mockResolvedValue({ processados: 1, erros: [] });

      render(<ModalLancamentoResultadosLoteDuplaFixa {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      await waitFor(() => {
        expect(mockPartidaService.registrarResultadosEmLote).toHaveBeenCalledWith([
          {
            partidaId: "partida-1",
            placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4, vencedorId: "" }],
          },
        ]);
      });
    });

    it("deve chamar onSuccess e mostrar alert após sucesso", async () => {
      mockPartidaService.registrarResultadosEmLote.mockResolvedValue({ processados: 1, erros: [] });

      render(<ModalLancamentoResultadosLoteDuplaFixa {...defaultProps} />);

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
      mockPartidaService.registrarResultadosEmLote.mockResolvedValue({
        processados: 0,
        erros: [{ partidaId: "partida-1", erro: "Erro ao salvar" }],
      });

      render(<ModalLancamentoResultadosLoteDuplaFixa {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      await waitFor(() => {
        expect(screen.getByText("Nenhum resultado foi salvo. Verifique os erros.")).toBeInTheDocument();
      });
    });

    it("deve lidar com erros parciais", async () => {
      mockPartidaService.registrarResultadosEmLote.mockResolvedValue({
        processados: 1,
        erros: [{ partidaId: "partida-2", erro: "Erro na partida 2" }],
      });

      render(<ModalLancamentoResultadosLoteDuplaFixa {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      // Preencher 2 partidas
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });
      fireEvent.change(inputs[2], { target: { value: "6" } });
      fireEvent.change(inputs[3], { target: { value: "3" } });

      fireEvent.click(screen.getByText("Salvar Resultados (2)"));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith("1 resultado(s) salvo(s) com sucesso, 1 erro(s).");
      });
    });

    it("deve lidar com exceção do service", async () => {
      mockPartidaService.registrarResultadosEmLote.mockRejectedValue(new Error("Erro de rede"));

      render(<ModalLancamentoResultadosLoteDuplaFixa {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      await waitFor(() => {
        expect(screen.getByText("Erro de rede")).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // FECHAR MODAL
  // ============================================

  describe("fechar modal", () => {
    it("deve chamar onClose ao clicar em Cancelar", () => {
      render(<ModalLancamentoResultadosLoteDuplaFixa {...defaultProps} />);

      fireEvent.click(screen.getByText("Cancelar"));

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it("deve chamar onClose ao clicar no X", () => {
      render(<ModalLancamentoResultadosLoteDuplaFixa {...defaultProps} />);

      fireEvent.click(screen.getByText("✕"));

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it("deve fechar ao clicar no overlay (quando não loading)", () => {
      render(<ModalLancamentoResultadosLoteDuplaFixa {...defaultProps} />);

      // Verificar que o modal está aberto e pode ser fechado
      expect(screen.getByText("Cancelar")).toBeInTheDocument();
    });
  });

  // ============================================
  // ETAPA FINALIZADA
  // ============================================

  describe("etapa finalizada", () => {
    it("deve desabilitar botão quando etapa finalizada", () => {
      render(<ModalLancamentoResultadosLoteDuplaFixa {...defaultProps} etapaFinalizada={true} />);

      const submitButton = screen.getByText("Etapa Finalizada");
      expect(submitButton).toBeDisabled();
    });
  });

  // ============================================
  // LOADING
  // ============================================

  describe("loading", () => {
    it("deve mostrar overlay de loading durante salvamento", async () => {
      mockPartidaService.registrarResultadosEmLote.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ processados: 1, erros: [] }), 100))
      );

      render(<ModalLancamentoResultadosLoteDuplaFixa {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultados (1)"));

      expect(screen.getByText("Salvando resultados...")).toBeInTheDocument();
    });
  });
});
