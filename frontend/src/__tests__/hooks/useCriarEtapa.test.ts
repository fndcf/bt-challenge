/**
 * Testes para useCriarEtapa
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useCriarEtapa } from "@/pages/CriarEtapa/hooks/useCriarEtapa";
import { FormatoEtapa, VarianteSuperX, VarianteTeams, TipoFormacaoEquipe, TipoFormacaoDupla } from "@/types/etapa";
import { TipoChaveamentoReiDaPraia } from "@/types/reiDaPraia";
import { GeneroJogador, NivelJogador } from "@/types/jogador";

// Mock do react-router-dom
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock dos services
const mockEtapaService = {
  criar: jest.fn(),
};

jest.mock("@/services", () => ({
  getEtapaService: () => mockEtapaService,
}));

describe("useCriarEtapa", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // INICIALIZAÇÃO
  // ============================================

  describe("inicialização", () => {
    it("deve retornar estado inicial correto", () => {
      const { result } = renderHook(() => useCriarEtapa());

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.formData.nome).toBe("");
      expect(result.current.formData.formato).toBe(FormatoEtapa.DUPLA_FIXA);
      expect(result.current.formData.maxJogadores).toBe(16);
      expect(result.current.formData.contaPontosRanking).toBe(true);
    });

    it("deve ter handleChange e handleSubmit definidos", () => {
      const { result } = renderHook(() => useCriarEtapa());

      expect(result.current.handleChange).toBeDefined();
      expect(result.current.handleSubmit).toBeDefined();
    });
  });

  // ============================================
  // HANDLECHANGE
  // ============================================

  describe("handleChange", () => {
    it("deve atualizar campo do formulário", () => {
      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("nome", "Minha Etapa");
      });

      expect(result.current.formData.nome).toBe("Minha Etapa");
    });

    it("deve atualizar formato", () => {
      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("formato", FormatoEtapa.REI_DA_PRAIA);
      });

      expect(result.current.formData.formato).toBe(FormatoEtapa.REI_DA_PRAIA);
    });

    it("deve atualizar maxJogadores", () => {
      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("maxJogadores", 24);
      });

      expect(result.current.formData.maxJogadores).toBe(24);
    });
  });

  // ============================================
  // CÁLCULO DE DISTRIBUIÇÃO - DUPLA FIXA
  // ============================================

  describe("calcularDistribuicaoDuplaFixa", () => {
    it("deve calcular distribuição correta para 12 jogadores", () => {
      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("maxJogadores", 12);
      });

      expect(result.current.infoDuplaFixa.valido).toBe(true);
      expect(result.current.infoDuplaFixa.totalDuplas).toBe(6);
      expect(result.current.infoDuplaFixa.qtdGrupos).toBe(2);
    });

    it("deve calcular distribuição correta para 10 jogadores (5 duplas)", () => {
      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("maxJogadores", 10);
      });

      expect(result.current.infoDuplaFixa.valido).toBe(true);
      expect(result.current.infoDuplaFixa.totalDuplas).toBe(5);
      expect(result.current.infoDuplaFixa.qtdGrupos).toBe(1);
      expect(result.current.infoDuplaFixa.distribuicao).toEqual([5]);
    });

    it("deve retornar inválido para menos de 4 jogadores", () => {
      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("maxJogadores", 2);
      });

      expect(result.current.infoDuplaFixa.valido).toBe(false);
      expect(result.current.infoDuplaFixa.descricao).toContain("mínimo");
    });

    it("deve retornar inválido para número ímpar", () => {
      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("maxJogadores", 11);
      });

      expect(result.current.infoDuplaFixa.valido).toBe(false);
      expect(result.current.infoDuplaFixa.descricao).toContain("par");
    });

    it("deve retornar inválido para menos de 3 duplas", () => {
      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("maxJogadores", 4);
      });

      expect(result.current.infoDuplaFixa.valido).toBe(false);
      expect(result.current.infoDuplaFixa.descricao).toContain("Mínimo de 6");
    });

    it("deve retornar inválido para valor NaN", () => {
      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("maxJogadores", NaN);
      });

      expect(result.current.infoDuplaFixa.valido).toBe(false);
    });
  });

  // ============================================
  // CÁLCULO DE DISTRIBUIÇÃO - REI DA PRAIA
  // ============================================

  describe("calcularDistribuicaoReiDaPraia", () => {
    it("deve calcular distribuição correta para 16 jogadores", () => {
      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("formato", FormatoEtapa.REI_DA_PRAIA);
        result.current.handleChange("maxJogadores", 16);
      });

      expect(result.current.infoReiDaPraia.valido).toBe(true);
      expect(result.current.infoReiDaPraia.qtdGrupos).toBe(4);
      expect(result.current.infoReiDaPraia.jogadoresPorGrupo).toBe(4);
      expect(result.current.infoReiDaPraia.partidasPorGrupo).toBe(3);
    });

    it("deve retornar inválido para menos de 8 jogadores", () => {
      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("maxJogadores", 4);
      });

      expect(result.current.infoReiDaPraia.valido).toBe(false);
      expect(result.current.infoReiDaPraia.descricao).toContain("mínimo 8");
    });

    it("deve retornar inválido para número não múltiplo de 4", () => {
      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("maxJogadores", 10);
      });

      expect(result.current.infoReiDaPraia.valido).toBe(false);
      expect(result.current.infoReiDaPraia.descricao).toContain("múltiplo de 4");
    });
  });

  // ============================================
  // CÁLCULO DE DISTRIBUIÇÃO - SUPER X
  // ============================================

  describe("calcularDistribuicaoSuperX", () => {
    it("deve calcular distribuição correta para Super 8", () => {
      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("formato", FormatoEtapa.SUPER_X);
        result.current.handleChange("varianteSuperX", VarianteSuperX.SUPER_8);
      });

      expect(result.current.infoSuperX.valido).toBe(true);
      expect(result.current.infoSuperX.variante).toBe(8);
      expect(result.current.infoSuperX.totalRodadas).toBe(7);
      expect(result.current.infoSuperX.partidasPorRodada).toBe(2);
    });

    it("deve calcular distribuição correta para Super 12", () => {
      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("formato", FormatoEtapa.SUPER_X);
        result.current.handleChange("varianteSuperX", VarianteSuperX.SUPER_12);
      });

      expect(result.current.infoSuperX.valido).toBe(true);
      expect(result.current.infoSuperX.variante).toBe(12);
      expect(result.current.infoSuperX.totalRodadas).toBe(11);
      expect(result.current.infoSuperX.partidasPorRodada).toBe(3);
    });
  });

  // ============================================
  // CÁLCULO DE DISTRIBUIÇÃO - TEAMS
  // ============================================

  describe("calcularDistribuicaoTeams", () => {
    it("deve calcular distribuição correta para TEAMS 4 com 8 jogadores", () => {
      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("formato", FormatoEtapa.TEAMS);
        result.current.handleChange("varianteTeams", VarianteTeams.TEAMS_4);
        result.current.handleChange("maxJogadores", 8);
      });

      expect(result.current.infoTeams.valido).toBe(true);
      expect(result.current.infoTeams.totalEquipes).toBe(2);
      expect(result.current.infoTeams.jogadoresPorEquipe).toBe(4);
      expect(result.current.infoTeams.totalConfrontos).toBe(1);
      expect(result.current.infoTeams.jogosPorConfronto).toBe(2);
    });

    it("deve calcular distribuição correta para TEAMS 6 com 12 jogadores", () => {
      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("formato", FormatoEtapa.TEAMS);
        result.current.handleChange("varianteTeams", VarianteTeams.TEAMS_6);
        result.current.handleChange("maxJogadores", 12);
      });

      expect(result.current.infoTeams.valido).toBe(true);
      expect(result.current.infoTeams.totalEquipes).toBe(2);
      expect(result.current.infoTeams.jogadoresPorEquipe).toBe(6);
      expect(result.current.infoTeams.jogosPorConfronto).toBe(3);
    });

    it("deve mostrar descrição com mínimo de jogadores para 2 equipes", () => {
      const { result } = renderHook(() => useCriarEtapa());

      // Verificar que a descrição mostra info sobre mínimo de jogadores
      act(() => {
        result.current.handleChange("varianteTeams", VarianteTeams.TEAMS_4);
        result.current.handleChange("maxJogadores", 0);
      });

      expect(result.current.infoTeams.descricao).toContain("mínimo");
    });

    it("deve mostrar descrição quando número não é múltiplo da variante", () => {
      const { result } = renderHook(() => useCriarEtapa());

      // Testar com TEAMS_6 e 14 jogadores (não múltiplo de 6, mas acima do mínimo de 12)
      act(() => {
        result.current.handleChange("varianteTeams", VarianteTeams.TEAMS_6);
        result.current.handleChange("maxJogadores", 14);
      });

      expect(result.current.infoTeams.descricao).toContain("múltiplo");
    });
  });

  // ============================================
  // INFO ATUAL
  // ============================================

  describe("infoAtual", () => {
    it("deve retornar info de Dupla Fixa quando formato é DUPLA_FIXA", () => {
      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("formato", FormatoEtapa.DUPLA_FIXA);
      });

      expect(result.current.infoAtual).toBe(result.current.infoDuplaFixa);
    });

    it("deve retornar info de Rei da Praia quando formato é REI_DA_PRAIA", () => {
      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("formato", FormatoEtapa.REI_DA_PRAIA);
      });

      expect(result.current.infoAtual).toBe(result.current.infoReiDaPraia);
    });

    it("deve retornar info de Super X quando formato é SUPER_X", () => {
      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("formato", FormatoEtapa.SUPER_X);
      });

      expect(result.current.infoAtual).toBe(result.current.infoSuperX);
    });

    it("deve retornar info de TEAMS quando formato é TEAMS", () => {
      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("formato", FormatoEtapa.TEAMS);
      });

      expect(result.current.infoAtual).toBe(result.current.infoTeams);
    });
  });

  // ============================================
  // VALIDAÇÃO DE DATAS
  // ============================================

  describe("validação de datas", () => {
    it("deve detectar erro quando data fim é antes da data início", async () => {
      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("dataInicio", "2024-01-15");
        result.current.handleChange("dataFim", "2024-01-10");
        result.current.handleChange("dataRealizacao", "2024-01-20");
      });

      await waitFor(() => {
        expect(result.current.errosDatas.dataFim).toBeDefined();
      });
    });

    it("deve detectar erro quando data realização é antes da data fim", async () => {
      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("dataInicio", "2024-01-01");
        result.current.handleChange("dataFim", "2024-01-15");
        result.current.handleChange("dataRealizacao", "2024-01-10");
      });

      await waitFor(() => {
        expect(result.current.errosDatas.dataRealizacao).toBeDefined();
      });
    });

    it("não deve ter erros quando datas são válidas", async () => {
      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("dataInicio", "2024-01-01");
        result.current.handleChange("dataFim", "2024-01-15");
        result.current.handleChange("dataRealizacao", "2024-01-20");
      });

      await waitFor(() => {
        expect(Object.keys(result.current.errosDatas).length).toBe(0);
      });
    });
  });

  // ============================================
  // HANDLESUBMIT
  // ============================================

  describe("handleSubmit", () => {
    const mockEvent = {
      preventDefault: jest.fn(),
    } as any;

    it("deve criar etapa Dupla Fixa com sucesso", async () => {
      mockEtapaService.criar.mockResolvedValue({});

      const { result } = renderHook(() => useCriarEtapa());

      // Preencher formulário
      act(() => {
        result.current.handleChange("nome", "Etapa Teste");
        result.current.handleChange("formato", FormatoEtapa.DUPLA_FIXA);
        result.current.handleChange("maxJogadores", 12);
        result.current.handleChange("nivel", NivelJogador.INTERMEDIARIO);
        result.current.handleChange("genero", GeneroJogador.MASCULINO);
        result.current.handleChange("dataInicio", "2024-01-01");
        result.current.handleChange("dataFim", "2024-01-15");
        result.current.handleChange("dataRealizacao", "2024-01-20");
      });

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEtapaService.criar).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/admin/etapas");
    });

    it("deve mostrar erro quando nome é muito curto", async () => {
      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("nome", "AB");
        result.current.handleChange("dataInicio", "2024-01-01");
        result.current.handleChange("dataFim", "2024-01-15");
        result.current.handleChange("dataRealizacao", "2024-01-20");
      });

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.error).toContain("3 caracteres");
      expect(mockEtapaService.criar).not.toHaveBeenCalled();
    });

    it("deve mostrar erro para Dupla Fixa com menos de 6 jogadores", async () => {
      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("nome", "Etapa Teste");
        result.current.handleChange("formato", FormatoEtapa.DUPLA_FIXA);
        result.current.handleChange("maxJogadores", 4);
        result.current.handleChange("dataInicio", "2024-01-01");
        result.current.handleChange("dataFim", "2024-01-15");
        result.current.handleChange("dataRealizacao", "2024-01-20");
      });

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.error).toContain("6 jogadores");
    });

    it("deve mostrar erro para Dupla Fixa com mais de 52 jogadores", async () => {
      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("nome", "Etapa Teste");
        result.current.handleChange("formato", FormatoEtapa.DUPLA_FIXA);
        result.current.handleChange("maxJogadores", 60);
        result.current.handleChange("dataInicio", "2024-01-01");
        result.current.handleChange("dataFim", "2024-01-15");
        result.current.handleChange("dataRealizacao", "2024-01-20");
      });

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.error).toContain("52");
    });

    it("deve mostrar erro para Dupla Fixa com número ímpar", async () => {
      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("nome", "Etapa Teste");
        result.current.handleChange("formato", FormatoEtapa.DUPLA_FIXA);
        result.current.handleChange("maxJogadores", 11);
        result.current.handleChange("dataInicio", "2024-01-01");
        result.current.handleChange("dataFim", "2024-01-15");
        result.current.handleChange("dataRealizacao", "2024-01-20");
      });

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.error).toContain("par");
    });

    it("deve criar etapa Rei da Praia com sucesso", async () => {
      mockEtapaService.criar.mockResolvedValue({});

      const { result } = renderHook(() => useCriarEtapa());

      // Primeiro muda o formato, depois espera o useEffect ajustar
      act(() => {
        result.current.handleChange("formato", FormatoEtapa.REI_DA_PRAIA);
      });

      // Agora define os outros campos (maxJogadores já foi ajustado para 8)
      act(() => {
        result.current.handleChange("nome", "Etapa Rei da Praia");
        result.current.handleChange("maxJogadores", 16);
        result.current.handleChange("dataInicio", "2024-01-01");
        result.current.handleChange("dataFim", "2024-01-15");
        result.current.handleChange("dataRealizacao", "2024-01-20");
      });

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(mockEtapaService.criar).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/admin/etapas");
    });

    it("deve validar distribuição Rei da Praia corretamente", () => {
      const { result } = renderHook(() => useCriarEtapa());

      // Testar cálculo de distribuição válida
      act(() => {
        result.current.handleChange("maxJogadores", 16);
      });

      expect(result.current.infoReiDaPraia.valido).toBe(true);
      expect(result.current.infoReiDaPraia.qtdGrupos).toBe(4);
    });

    it("deve indicar distribuição inválida para Rei da Praia com poucos jogadores", () => {
      const { result } = renderHook(() => useCriarEtapa());

      // Forçar valor abaixo do mínimo
      act(() => {
        result.current.handleChange("maxJogadores", 4);
      });

      // O cálculo deve indicar inválido
      expect(result.current.infoReiDaPraia.valido).toBe(false);
      expect(result.current.infoReiDaPraia.descricao).toContain("mínimo");
    });

    it("deve indicar distribuição inválida para Rei da Praia com número não múltiplo de 4", () => {
      const { result } = renderHook(() => useCriarEtapa());

      // Forçar valor não múltiplo de 4
      act(() => {
        result.current.handleChange("maxJogadores", 10);
      });

      // O cálculo deve indicar inválido
      expect(result.current.infoReiDaPraia.valido).toBe(false);
      expect(result.current.infoReiDaPraia.descricao).toContain("múltiplo");
    });

    it("deve criar etapa Super X com sucesso", async () => {
      mockEtapaService.criar.mockResolvedValue({});

      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("formato", FormatoEtapa.SUPER_X);
      });

      act(() => {
        result.current.handleChange("nome", "Etapa Super X");
        result.current.handleChange("varianteSuperX", VarianteSuperX.SUPER_8);
        result.current.handleChange("maxJogadores", 8);
        result.current.handleChange("dataInicio", "2024-01-01");
        result.current.handleChange("dataFim", "2024-01-15");
        result.current.handleChange("dataRealizacao", "2024-01-20");
      });

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(mockEtapaService.criar).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/admin/etapas");
    });

    it("deve mostrar erro para Super X com variante inválida", async () => {
      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("formato", FormatoEtapa.SUPER_X);
      });

      act(() => {
        result.current.handleChange("nome", "Etapa Teste");
        result.current.handleChange("varianteSuperX", 10 as VarianteSuperX);
        result.current.handleChange("maxJogadores", 10);
        result.current.handleChange("dataInicio", "2024-01-01");
        result.current.handleChange("dataFim", "2024-01-15");
        result.current.handleChange("dataRealizacao", "2024-01-20");
      });

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.error).toContain("inválida");
    });

    it("deve mostrar erro para Super X com número de jogadores errado", async () => {
      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("formato", FormatoEtapa.SUPER_X);
      });

      act(() => {
        result.current.handleChange("nome", "Etapa Teste");
        result.current.handleChange("varianteSuperX", VarianteSuperX.SUPER_8);
        result.current.handleChange("maxJogadores", 10);
        result.current.handleChange("dataInicio", "2024-01-01");
        result.current.handleChange("dataFim", "2024-01-15");
        result.current.handleChange("dataRealizacao", "2024-01-20");
      });

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.error).toContain("8");
    });

    it("deve criar etapa TEAMS com sucesso", async () => {
      mockEtapaService.criar.mockResolvedValue({});

      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("formato", FormatoEtapa.TEAMS);
      });

      act(() => {
        result.current.handleChange("nome", "Etapa TEAMS");
        result.current.handleChange("varianteTeams", VarianteTeams.TEAMS_4);
        result.current.handleChange("tipoFormacaoEquipe", TipoFormacaoEquipe.BALANCEADO);
        result.current.handleChange("maxJogadores", 8);
        result.current.handleChange("dataInicio", "2024-01-01");
        result.current.handleChange("dataFim", "2024-01-15");
        result.current.handleChange("dataRealizacao", "2024-01-20");
      });

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(mockEtapaService.criar).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/admin/etapas");
    });

    it("deve mostrar erro para TEAMS com variante inválida", async () => {
      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("formato", FormatoEtapa.TEAMS);
      });

      act(() => {
        result.current.handleChange("nome", "Etapa Teste");
        result.current.handleChange("varianteTeams", 5 as VarianteTeams);
        result.current.handleChange("tipoFormacaoEquipe", TipoFormacaoEquipe.BALANCEADO);
        result.current.handleChange("maxJogadores", 10);
        result.current.handleChange("dataInicio", "2024-01-01");
        result.current.handleChange("dataFim", "2024-01-15");
        result.current.handleChange("dataRealizacao", "2024-01-20");
      });

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.error).toContain("inválida");
    });

    it("deve mostrar erro para TEAMS sem tipo de formação", async () => {
      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("formato", FormatoEtapa.TEAMS);
      });

      act(() => {
        result.current.handleChange("nome", "Etapa Teste");
        result.current.handleChange("varianteTeams", VarianteTeams.TEAMS_4);
        result.current.handleChange("tipoFormacaoEquipe", undefined);
        result.current.handleChange("maxJogadores", 8);
        result.current.handleChange("dataInicio", "2024-01-01");
        result.current.handleChange("dataFim", "2024-01-15");
        result.current.handleChange("dataRealizacao", "2024-01-20");
      });

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.error).toContain("formação");
    });

    it("deve mostrar erro para TEAMS com menos jogadores que o mínimo", async () => {
      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("formato", FormatoEtapa.TEAMS);
      });

      act(() => {
        result.current.handleChange("nome", "Etapa Teste");
        result.current.handleChange("varianteTeams", VarianteTeams.TEAMS_4);
        result.current.handleChange("tipoFormacaoEquipe", TipoFormacaoEquipe.BALANCEADO);
        result.current.handleChange("maxJogadores", 4);
        result.current.handleChange("dataInicio", "2024-01-01");
        result.current.handleChange("dataFim", "2024-01-15");
        result.current.handleChange("dataRealizacao", "2024-01-20");
      });

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.error).toContain("8 jogadores");
    });

    it("deve mostrar erro para TEAMS com número não múltiplo da variante", async () => {
      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("formato", FormatoEtapa.TEAMS);
      });

      act(() => {
        result.current.handleChange("nome", "Etapa Teste");
        result.current.handleChange("varianteTeams", VarianteTeams.TEAMS_4);
        result.current.handleChange("tipoFormacaoEquipe", TipoFormacaoEquipe.BALANCEADO);
        result.current.handleChange("maxJogadores", 10);
        result.current.handleChange("dataInicio", "2024-01-01");
        result.current.handleChange("dataFim", "2024-01-15");
        result.current.handleChange("dataRealizacao", "2024-01-20");
      });

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.error).toContain("múltiplo");
    });

    it("deve mostrar erro para TEAMS Mesmo Nível sem nível selecionado", async () => {
      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("formato", FormatoEtapa.TEAMS);
      });

      act(() => {
        result.current.handleChange("nome", "Etapa Teste");
        result.current.handleChange("varianteTeams", VarianteTeams.TEAMS_4);
        result.current.handleChange("tipoFormacaoEquipe", TipoFormacaoEquipe.MESMO_NIVEL);
        result.current.handleChange("nivel", undefined);
        result.current.handleChange("maxJogadores", 8);
        result.current.handleChange("dataInicio", "2024-01-01");
        result.current.handleChange("dataFim", "2024-01-15");
        result.current.handleChange("dataRealizacao", "2024-01-20");
      });

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.error).toContain("nível");
    });

    it("deve lidar com erro do service", async () => {
      mockEtapaService.criar.mockRejectedValue(new Error("Erro do servidor"));

      const { result } = renderHook(() => useCriarEtapa());

      act(() => {
        result.current.handleChange("nome", "Etapa Teste");
        result.current.handleChange("formato", FormatoEtapa.DUPLA_FIXA);
        result.current.handleChange("maxJogadores", 12);
        result.current.handleChange("dataInicio", "2024-01-01");
        result.current.handleChange("dataFim", "2024-01-15");
        result.current.handleChange("dataRealizacao", "2024-01-20");
      });

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.error).toBe("Erro do servidor");
    });
  });
});
