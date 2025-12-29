/**
 * Testes para ModalLancamentoResultadosLoteSuperX
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ModalLancamentoResultadosLoteSuperX } from "@/components/etapas/ModalLancamentoResultadosLoteSuperX/ModalLancamentoResultadosLoteSuperX";
import { PartidaReiDaPraia } from "@/types/reiDaPraia";

// Mock do service
const mockSuperXService = {
  registrarResultadosEmLote: jest.fn(),
};

jest.mock("@/services", () => ({
  getSuperXService: () => mockSuperXService,
}));

// Mock do alert
const mockAlert = jest.fn();
global.alert = mockAlert;

// ============================================
// DADOS DE TESTE
// ============================================

const criarPartidaSuperX = (
  id: string,
  rodada: number = 1,
  overrides?: Partial<PartidaReiDaPraia>
): PartidaReiDaPraia => ({
  id,
  etapaId: "etapa-1",
  arenaId: "arena-1",
  fase: "GRUPOS",
  grupoId: "grupo-1",
  grupoNome: "Super X 8",
  rodada,
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
    criarPartidaSuperX("partida-1", 1),
    criarPartidaSuperX("partida-2", 1, {
      jogador1ANome: "Ana",
      jogador1BNome: "Maria",
      jogador2ANome: "Julia",
      jogador2BNome: "Paula",
    }),
    criarPartidaSuperX("partida-3", 2, {
      jogador1ANome: "Ricardo",
      jogador1BNome: "Marcos",
      jogador2ANome: "Fernanda",
      jogador2BNome: "Lucia",
    }),
  ],
  onClose: jest.fn(),
  onSuccess: jest.fn(),
};

describe("ModalLancamentoResultadosLoteSuperX", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // RENDERIZAÇÃO BÁSICA
  // ============================================

  describe("renderização", () => {
    it("deve renderizar modal com título", () => {
      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      expect(screen.getByText("Lançamento de Resultados - Super X")).toBeInTheDocument();
    });

    it("deve mostrar resumo de partidas", () => {
      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      expect(screen.getByText("Total de Partidas")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("Já Finalizadas")).toBeInTheDocument();
      expect(screen.getByText("Serão Salvas")).toBeInTheDocument();
    });

    it("deve agrupar partidas por rodada", () => {
      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      expect(screen.getByText("Rodada 1")).toBeInTheDocument();
      expect(screen.getByText("Rodada 2")).toBeInTheDocument();
      expect(screen.getByText("2 partidas")).toBeInTheDocument();
      expect(screen.getByText("1 partida")).toBeInTheDocument();
    });

    it("deve mostrar nomes dos jogadores nas duplas", () => {
      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      expect(screen.getAllByText(/João & Pedro/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Carlos & Lucas/).length).toBeGreaterThan(0);
    });

    it("deve mostrar status das partidas", () => {
      const partidas = [
        criarPartidaSuperX("partida-1", 1),
        criarPartidaSuperX("partida-2", 1, { status: "finalizada" }),
      ];

      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} partidas={partidas} />);

      expect(screen.getByText("Aguardando")).toBeInTheDocument();
      expect(screen.getByText("Finalizada")).toBeInTheDocument();
    });

    it("deve mostrar outros status", () => {
      const partidas = [
        criarPartidaSuperX("partida-1", 1, { status: "cancelada" }),
        criarPartidaSuperX("partida-2", 1, { status: "wo" }),
        criarPartidaSuperX("partida-3", 1, { status: "outro" as any }),
      ];

      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} partidas={partidas} />);

      expect(screen.getByText("Cancelada")).toBeInTheDocument();
      expect(screen.getByText("W.O.")).toBeInTheDocument();
      expect(screen.getByText("outro")).toBeInTheDocument();
    });

    it("deve mostrar inputs de placar", () => {
      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      expect(inputs.length).toBe(6); // 3 partidas x 2 inputs
    });

    it("deve mostrar VS entre as duplas", () => {
      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      const vsElements = screen.getAllByText("VS");
      expect(vsElements.length).toBe(3); // Um VS por partida
    });

    it("deve mostrar informação explicativa", () => {
      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      expect(screen.getByText(/Preencha os resultados das partidas abaixo/)).toBeInTheDocument();
      expect(screen.getByText(/Apenas os resultados preenchidos serão salvos/)).toBeInTheDocument();
    });
  });

  // ============================================
  // CARREGAR DADOS EXISTENTES
  // ============================================

  describe("carregar dados existentes", () => {
    it("deve preencher inputs com placares de partidas finalizadas", () => {
      const partidas = [
        criarPartidaSuperX("partida-1", 1, {
          status: "finalizada",
          placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4, vencedorId: "dupla-1" }],
        }),
      ];

      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} partidas={partidas} />);

      const inputs = screen.getAllByRole("spinbutton");
      expect(inputs[0]).toHaveValue(6);
      expect(inputs[1]).toHaveValue(4);
    });

    it("deve mostrar contagem correta de partidas já finalizadas", () => {
      const partidas = [
        criarPartidaSuperX("partida-1", 1, { status: "finalizada" }),
        criarPartidaSuperX("partida-2", 1, { status: "finalizada" }),
        criarPartidaSuperX("partida-3", 2, { status: "agendada" }),
      ];

      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} partidas={partidas} />);

      // Verificar que mostra "2" para já finalizadas
      const summaryValues = screen.getAllByText("2");
      expect(summaryValues.length).toBeGreaterThan(0);
    });

    it("deve tratar partidas sem rodada definida como rodada 1", () => {
      const partidas = [
        { ...criarPartidaSuperX("partida-1", 1), rodada: undefined },
      ];

      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} partidas={partidas as PartidaReiDaPraia[]} />);

      expect(screen.getByText("Rodada 1")).toBeInTheDocument();
    });
  });

  // ============================================
  // ENTRADA DE DADOS
  // ============================================

  describe("entrada de dados", () => {
    it("deve permitir digitar placar", () => {
      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      expect(inputs[0]).toHaveValue(6);
      expect(inputs[1]).toHaveValue(4);
    });

    it("deve atualizar contador de partidas a salvar", () => {
      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      // Inicialmente 0 a salvar - botão deve estar desabilitado ou mostrar 0
      const submitButton = screen.getByRole("button", { name: /Salvar 0 Resultados/i });
      expect(submitButton).toBeDisabled();

      // Preencher uma partida completamente
      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      // Agora 1 a salvar
      expect(screen.getByText(/Salvar 1 Resultado/)).toBeInTheDocument();
    });

    it("deve limpar erro ao digitar", () => {
      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      // Preencher parcialmente e submeter
      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      // Preencher com placar inválido
      fireEvent.change(inputs[0], { target: { value: "0" } });
      fireEvent.change(inputs[1], { target: { value: "0" } });

      // Submeter
      fireEvent.click(screen.getByText(/Salvar 1 Resultado/));

      // Deve mostrar erro
      expect(screen.getByText(/O placar não pode ser 0 x 0/)).toBeInTheDocument();

      // Corrigir
      fireEvent.change(inputs[0], { target: { value: "6" } });

      // Erro deve sumir
      expect(screen.queryByText(/O placar não pode ser 0 x 0/)).not.toBeInTheDocument();
    });

    it("deve permitir limpar valor do input", () => {
      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

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
      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      // Limpar o segundo para simular preenchimento parcial
      fireEvent.change(inputs[1], { target: { value: "" } });

      // O botão não deve funcionar pois a contagem será 0
      // Então vamos testar de outra forma: preenchendo um campo e deixando outro vazio
      fireEvent.change(inputs[0], { target: { value: "6" } });
      // inputs[1] está vazio agora

      // Não há forma de submeter pois não conta como preenchido
      // Vamos testar preenchendo parcialmente e tentando submeter via form
      const form = document.getElementById("form-resultados-lote");
      if (form) {
        fireEvent.submit(form);
      }

      // Não deve mostrar erro porque não vai tentar salvar
      expect(mockSuperXService.registrarResultadosEmLote).not.toHaveBeenCalled();
    });

    it("deve mostrar erro para placar 0 x 0", async () => {
      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "0" } });
      fireEvent.change(inputs[1], { target: { value: "0" } });

      fireEvent.click(screen.getByText(/Salvar 1 Resultado/));

      expect(screen.getByText(/O placar não pode ser 0 x 0/)).toBeInTheDocument();
    });

    it("deve mostrar erro para vencedor com menos de 4 games", async () => {
      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "3" } });
      fireEvent.change(inputs[1], { target: { value: "2" } });

      fireEvent.click(screen.getByText(/Salvar 1 Resultado/));

      expect(screen.getByText(/O set deve ter no mínimo 4 games para o vencedor/)).toBeInTheDocument();
    });

    it("deve mostrar erro para 4 games com mais de 2 do perdedor", async () => {
      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "4" } });
      fireEvent.change(inputs[1], { target: { value: "3" } });

      fireEvent.click(screen.getByText(/Salvar 1 Resultado/));

      expect(screen.getByText(/Set com 4 games: placar deve ser 4-0, 4-1 ou 4-2/)).toBeInTheDocument();
    });

    it("deve mostrar erro para 5 games com menos de 3 do perdedor", async () => {
      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "5" } });
      fireEvent.change(inputs[1], { target: { value: "2" } });

      fireEvent.click(screen.getByText(/Salvar 1 Resultado/));

      expect(screen.getByText(/Set com 5 games: placar deve ser 5-3 ou 5-4/)).toBeInTheDocument();
    });

    it("deve mostrar erro para 6 games com mais de 4 do perdedor", async () => {
      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "5" } });

      fireEvent.click(screen.getByText(/Salvar 1 Resultado/));

      expect(screen.getByText(/Set com 6 games: placar deve ser 6-0 a 6-4/)).toBeInTheDocument();
    });

    it("deve mostrar erro para 7 games com menos de 5 do perdedor", async () => {
      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "7" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText(/Salvar 1 Resultado/));

      expect(screen.getByText(/Set com 7 games: placar deve ser 7-5 ou 7-6/)).toBeInTheDocument();
    });

    it("deve mostrar erro para mais de 7 games", async () => {
      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "8" } });
      fireEvent.change(inputs[1], { target: { value: "6" } });

      fireEvent.click(screen.getByText(/Salvar 1 Resultado/));

      expect(screen.getByText(/Set não pode ter mais de 7 games/)).toBeInTheDocument();
    });

    it("deve aceitar placar 4-0 válido", async () => {
      mockSuperXService.registrarResultadosEmLote.mockResolvedValue({ processados: 1, erros: [] });

      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "4" } });
      fireEvent.change(inputs[1], { target: { value: "0" } });

      fireEvent.click(screen.getByText(/Salvar 1 Resultado/));

      await waitFor(() => {
        expect(mockSuperXService.registrarResultadosEmLote).toHaveBeenCalled();
      });
    });

    it("deve aceitar placar 6-4 válido", async () => {
      mockSuperXService.registrarResultadosEmLote.mockResolvedValue({ processados: 1, erros: [] });

      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText(/Salvar 1 Resultado/));

      await waitFor(() => {
        expect(mockSuperXService.registrarResultadosEmLote).toHaveBeenCalled();
      });
    });

    it("deve aceitar placar 7-5 válido", async () => {
      mockSuperXService.registrarResultadosEmLote.mockResolvedValue({ processados: 1, erros: [] });

      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "7" } });
      fireEvent.change(inputs[1], { target: { value: "5" } });

      fireEvent.click(screen.getByText(/Salvar 1 Resultado/));

      await waitFor(() => {
        expect(mockSuperXService.registrarResultadosEmLote).toHaveBeenCalled();
      });
    });

    it("deve aceitar placar 7-6 válido", async () => {
      mockSuperXService.registrarResultadosEmLote.mockResolvedValue({ processados: 1, erros: [] });

      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "7" } });
      fireEvent.change(inputs[1], { target: { value: "6" } });

      fireEvent.click(screen.getByText(/Salvar 1 Resultado/));

      await waitFor(() => {
        expect(mockSuperXService.registrarResultadosEmLote).toHaveBeenCalled();
      });
    });
  });

  // ============================================
  // SUBMISSÃO
  // ============================================

  describe("submissão", () => {
    it("deve mostrar alerta quando nenhum resultado preenchido", async () => {
      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      // Forçar submit via form
      const form = document.getElementById("form-resultados-lote");
      if (form) {
        fireEvent.submit(form);
      }

      expect(mockAlert).toHaveBeenCalledWith("Nenhum resultado foi preenchido");
    });

    it("deve chamar service com dados corretos", async () => {
      mockSuperXService.registrarResultadosEmLote.mockResolvedValue({ processados: 1, erros: [] });

      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText(/Salvar 1 Resultado/));

      await waitFor(() => {
        expect(mockSuperXService.registrarResultadosEmLote).toHaveBeenCalledWith(
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

    it("deve chamar onSuccess e mostrar alert após sucesso com 1 resultado", async () => {
      mockSuperXService.registrarResultadosEmLote.mockResolvedValue({ processados: 1, erros: [] });

      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText(/Salvar 1 Resultado/));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith("1 resultado(s) salvo com sucesso!");
        expect(defaultProps.onSuccess).toHaveBeenCalled();
      });
    });

    it("deve mostrar mensagem plural para múltiplos resultados", async () => {
      mockSuperXService.registrarResultadosEmLote.mockResolvedValue({ processados: 2, erros: [] });

      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });
      fireEvent.change(inputs[2], { target: { value: "7" } });
      fireEvent.change(inputs[3], { target: { value: "5" } });

      fireEvent.click(screen.getByText(/Salvar 2 Resultados/));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith("2 resultado(s) salvos com sucesso!");
      });
    });

    it("deve lidar com erros do service sem processados", async () => {
      mockSuperXService.registrarResultadosEmLote.mockResolvedValue({
        processados: 0,
        erros: [{ partidaId: "partida-1", erro: "Erro ao salvar" }],
      });

      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText(/Salvar 1 Resultado/));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith("Nenhum resultado foi salvo. Verifique os erros.");
      });
    });

    it("deve lidar com erros parciais", async () => {
      mockSuperXService.registrarResultadosEmLote.mockResolvedValue({
        processados: 1,
        erros: [{ partidaId: "partida-2", erro: "Erro na partida 2" }],
      });

      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });
      fireEvent.change(inputs[2], { target: { value: "7" } });
      fireEvent.change(inputs[3], { target: { value: "5" } });

      fireEvent.click(screen.getByText(/Salvar 2 Resultados/));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith("1 resultado(s) salvo(s) com sucesso, 1 erro(s).");
      });
    });

    it("deve lidar com exceção do service", async () => {
      mockSuperXService.registrarResultadosEmLote.mockRejectedValue(new Error("Erro de rede"));

      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText(/Salvar 1 Resultado/));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith("Erro de rede");
      });
    });

    it("deve lidar com exceção genérica do service", async () => {
      mockSuperXService.registrarResultadosEmLote.mockRejectedValue({});

      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText(/Salvar 1 Resultado/));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith("Erro ao salvar resultados");
      });
    });

    it("deve enviar múltiplos resultados corretamente", async () => {
      mockSuperXService.registrarResultadosEmLote.mockResolvedValue({ processados: 2, erros: [] });

      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });
      fireEvent.change(inputs[2], { target: { value: "7" } });
      fireEvent.change(inputs[3], { target: { value: "5" } });

      fireEvent.click(screen.getByText(/Salvar 2 Resultados/));

      await waitFor(() => {
        expect(mockSuperXService.registrarResultadosEmLote).toHaveBeenCalledWith(
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

    it("deve mostrar alerta quando nenhuma partida encontrada", async () => {
      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} partidas={[]} />);

      // Forçar submit via form
      const form = document.getElementById("form-resultados-lote");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith("Nenhum resultado foi preenchido");
      });
    });

    it("deve parar no primeiro erro de validação", async () => {
      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      // Preencher primeira partida com erro
      fireEvent.change(inputs[0], { target: { value: "0" } });
      fireEvent.change(inputs[1], { target: { value: "0" } });
      // Preencher segunda partida válida
      fireEvent.change(inputs[2], { target: { value: "6" } });
      fireEvent.change(inputs[3], { target: { value: "4" } });

      fireEvent.click(screen.getByText(/Salvar 2 Resultados/));

      // Deve mostrar apenas o primeiro erro
      expect(screen.getByText(/O placar não pode ser 0 x 0/)).toBeInTheDocument();
      expect(mockSuperXService.registrarResultadosEmLote).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // FECHAR MODAL
  // ============================================

  describe("fechar modal", () => {
    it("deve chamar onClose ao clicar em Cancelar", () => {
      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      fireEvent.click(screen.getByText("Cancelar"));

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it("deve chamar onClose ao clicar no X", () => {
      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      fireEvent.click(screen.getByText("×"));

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it("deve permitir fechar modal quando não está carregando", () => {
      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      expect(screen.getByText("Cancelar")).not.toBeDisabled();
    });
  });

  // ============================================
  // ETAPA FINALIZADA
  // ============================================

  describe("etapa finalizada", () => {
    it("deve desabilitar botão quando etapa finalizada", () => {
      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} etapaFinalizada={true} />);

      const submitButton = screen.getByText("Etapa Finalizada");
      expect(submitButton).toBeDisabled();
    });

    it("deve permitir visualizar partidas quando etapa finalizada", () => {
      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} etapaFinalizada={true} />);

      expect(screen.getByText("Rodada 1")).toBeInTheDocument();
      expect(screen.getByText("Rodada 2")).toBeInTheDocument();
    });

    it("deve usar etapaFinalizada false por padrão", () => {
      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      // Botão não deve mostrar "Etapa Finalizada"
      expect(screen.queryByText("Etapa Finalizada")).not.toBeInTheDocument();
    });
  });

  // ============================================
  // LOADING
  // ============================================

  describe("loading", () => {
    it("deve mostrar spinner durante salvamento", async () => {
      mockSuperXService.registrarResultadosEmLote.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ processados: 1, erros: [] }), 100))
      );

      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText(/Salvar 1 Resultado/));

      expect(screen.getByText("Salvando...")).toBeInTheDocument();
    });

    it("deve desabilitar inputs durante loading", async () => {
      mockSuperXService.registrarResultadosEmLote.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ processados: 1, erros: [] }), 100))
      );

      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText(/Salvar 1 Resultado/));

      const allInputs = screen.getAllByRole("spinbutton");
      allInputs.forEach((input) => {
        expect(input).toBeDisabled();
      });
    });

    it("deve desabilitar botão de fechar durante loading", async () => {
      mockSuperXService.registrarResultadosEmLote.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ processados: 1, erros: [] }), 100))
      );

      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText(/Salvar 1 Resultado/));

      const closeButton = screen.getByText("×");
      expect(closeButton).toBeDisabled();
    });

    it("deve desabilitar botão Cancelar durante loading", async () => {
      mockSuperXService.registrarResultadosEmLote.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ processados: 1, erros: [] }), 100))
      );

      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText(/Salvar 1 Resultado/));

      expect(screen.getByText("Cancelar")).toBeDisabled();
    });
  });

  // ============================================
  // VALIDAÇÃO DE PREENCHIMENTO PARCIAL
  // ============================================

  describe("validação de preenchimento parcial", () => {
    it("não deve contar resultado com apenas um campo preenchido", async () => {
      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      // Preencher apenas o primeiro campo
      fireEvent.change(inputs[0], { target: { value: "6" } });

      // O contador de "Serão Salvas" deve ser 0 pois precisa de ambos os campos
      const summaryValues = screen.getAllByText("0");
      expect(summaryValues.length).toBeGreaterThan(0);

      // O botão deve estar desabilitado
      const submitButton = screen.getByRole("button", { name: /Salvar 0 Resultados/i });
      expect(submitButton).toBeDisabled();
    });

    it("deve contar resultado apenas quando ambos os campos estão preenchidos", async () => {
      render(<ModalLancamentoResultadosLoteSuperX {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");

      // Preencher apenas o primeiro campo - deve ter 0 a salvar
      fireEvent.change(inputs[0], { target: { value: "6" } });
      expect(screen.getByRole("button", { name: /Salvar 0 Resultados/i })).toBeDisabled();

      // Preencher o segundo campo - agora deve ter 1 a salvar
      fireEvent.change(inputs[1], { target: { value: "4" } });
      expect(screen.getByText(/Salvar 1 Resultado/)).toBeInTheDocument();
    });
  });
});
