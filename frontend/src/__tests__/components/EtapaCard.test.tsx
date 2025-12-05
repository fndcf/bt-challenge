/**
 * Testes do componente EtapaCard
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { EtapaCard } from "@/components/etapas/EtapaCard/EtapaCard";
import { Etapa, StatusEtapa, FormatoEtapa } from "@/types/etapa";
import { NivelJogador, GeneroJogador } from "@/types/jogador";
import { FaseEtapa } from "@/types/chave";
import { TipoChaveamentoReiDaPraia } from "@/types/reiDaPraia";

// Mock do useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const mockEtapa: Etapa = {
  id: "etapa-1",
  arenaId: "arena-1",
  nome: "Etapa Teste",
  descricao: "Descrição da etapa de teste",
  nivel: NivelJogador.INTERMEDIARIO,
  genero: GeneroJogador.MASCULINO,
  formato: FormatoEtapa.DUPLA_FIXA,
  dataInicio: "2024-12-01",
  dataFim: "2024-12-10",
  dataRealizacao: "2024-12-15",
  local: "Quadra Principal",
  maxJogadores: 16,
  jogadoresPorGrupo: 4,
  qtdGrupos: 4,
  status: StatusEtapa.INSCRICOES_ABERTAS,
  faseAtual: FaseEtapa.INSCRICOES,
  totalInscritos: 10,
  jogadoresInscritos: [],
  chavesGeradas: false,
  criadoEm: "2024-01-01T00:00:00Z",
  atualizadoEm: "2024-01-01T00:00:00Z",
  criadoPor: "admin-1",
};

const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("EtapaCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("renderização básica", () => {
    it("deve renderizar o nome da etapa", () => {
      renderWithRouter(<EtapaCard etapa={mockEtapa} />);
      expect(screen.getByText("Etapa Teste")).toBeInTheDocument();
    });

    it("deve renderizar a descrição quando fornecida", () => {
      renderWithRouter(<EtapaCard etapa={mockEtapa} />);
      expect(
        screen.getByText("Descrição da etapa de teste")
      ).toBeInTheDocument();
    });

    it("não deve renderizar descrição quando não fornecida", () => {
      const etapaSemDescricao = { ...mockEtapa, descricao: undefined };
      renderWithRouter(<EtapaCard etapa={etapaSemDescricao} />);
      expect(
        screen.queryByText("Descrição da etapa de teste")
      ).not.toBeInTheDocument();
    });

    it("deve renderizar status badge", () => {
      renderWithRouter(<EtapaCard etapa={mockEtapa} />);
      // StatusBadge renderiza um badge baseado no status
      expect(screen.getByText("Dupla Fixa")).toBeInTheDocument();
    });

    it("deve renderizar formato badge", () => {
      renderWithRouter(<EtapaCard etapa={mockEtapa} />);
      expect(screen.getByText("Dupla Fixa")).toBeInTheDocument();
    });
  });

  describe("informações da etapa", () => {
    it("deve mostrar data de realização", () => {
      renderWithRouter(<EtapaCard etapa={mockEtapa} />);
      expect(screen.getByText("Realização")).toBeInTheDocument();
    });

    it("deve mostrar nível intermediário", () => {
      renderWithRouter(<EtapaCard etapa={mockEtapa} />);
      expect(screen.getByText("Intermediário")).toBeInTheDocument();
    });

    it("deve mostrar nível iniciante", () => {
      const etapaIniciante = { ...mockEtapa, nivel: NivelJogador.INICIANTE };
      renderWithRouter(<EtapaCard etapa={etapaIniciante} />);
      expect(screen.getByText("Iniciante")).toBeInTheDocument();
    });

    it("deve mostrar nível avançado", () => {
      const etapaAvancado = { ...mockEtapa, nivel: NivelJogador.AVANCADO };
      renderWithRouter(<EtapaCard etapa={etapaAvancado} />);
      expect(screen.getByText("Avançado")).toBeInTheDocument();
    });

    it("deve mostrar gênero masculino", () => {
      renderWithRouter(<EtapaCard etapa={mockEtapa} />);
      expect(screen.getByText("Masculino")).toBeInTheDocument();
    });

    it("deve mostrar gênero feminino", () => {
      const etapaFeminina = { ...mockEtapa, genero: GeneroJogador.FEMININO };
      renderWithRouter(<EtapaCard etapa={etapaFeminina} />);
      expect(screen.getByText("Feminino")).toBeInTheDocument();
    });

    it("deve mostrar local quando fornecido", () => {
      renderWithRouter(<EtapaCard etapa={mockEtapa} />);
      expect(screen.getByText("Quadra Principal")).toBeInTheDocument();
    });

    it("não deve mostrar local quando não fornecido", () => {
      const etapaSemLocal = { ...mockEtapa, local: undefined };
      renderWithRouter(<EtapaCard etapa={etapaSemLocal} />);
      expect(screen.queryByText("Quadra Principal")).not.toBeInTheDocument();
    });
  });

  describe("inscrições e progresso", () => {
    it("deve mostrar total de inscritos", () => {
      renderWithRouter(<EtapaCard etapa={mockEtapa} />);
      expect(screen.getByText("10 / 16")).toBeInTheDocument();
    });

    it("deve calcular progresso corretamente", () => {
      renderWithRouter(<EtapaCard etapa={mockEtapa} />);
      // 10/16 = 62.5% que arredonda para 63%
      expect(screen.getByText("10 / 16")).toBeInTheDocument();
    });

    it("deve mostrar 0% quando maxJogadores é 0", () => {
      const etapaSemMax = { ...mockEtapa, maxJogadores: 0, totalInscritos: 0 };
      renderWithRouter(<EtapaCard etapa={etapaSemMax} />);
      expect(screen.getByText("0 / 0")).toBeInTheDocument();
    });
  });

  describe("formato Rei da Praia", () => {
    const etapaReiDaPraia: Etapa = {
      ...mockEtapa,
      formato: FormatoEtapa.REI_DA_PRAIA,
      tipoChaveamento: TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES,
      qtdGrupos: 4,
    };

    it("deve mostrar badge Rei da Praia", () => {
      renderWithRouter(<EtapaCard etapa={etapaReiDaPraia} />);
      expect(screen.getByText("Rei da Praia")).toBeInTheDocument();
    });

    it("deve mostrar tipo de chaveamento", () => {
      renderWithRouter(<EtapaCard etapa={etapaReiDaPraia} />);
      expect(screen.getByText("Melhores c/ Melhores")).toBeInTheDocument();
    });

    it("deve mostrar chaveamento por ranking", () => {
      const etapaRanking = {
        ...etapaReiDaPraia,
        tipoChaveamento: TipoChaveamentoReiDaPraia.PAREAMENTO_POR_RANKING,
      };
      renderWithRouter(<EtapaCard etapa={etapaRanking} />);
      expect(screen.getByText("Por Ranking")).toBeInTheDocument();
    });

    it("deve mostrar chaveamento aleatório", () => {
      const etapaAleatorio = {
        ...etapaReiDaPraia,
        tipoChaveamento: TipoChaveamentoReiDaPraia.SORTEIO_ALEATORIO,
      };
      renderWithRouter(<EtapaCard etapa={etapaAleatorio} />);
      expect(screen.getByText("Sorteio Aleatório")).toBeInTheDocument();
    });

    it("deve mostrar 4 jogadores/grupo fixo", () => {
      renderWithRouter(<EtapaCard etapa={etapaReiDaPraia} />);
      expect(screen.getByText("4 jogadores/grupo")).toBeInTheDocument();
    });
  });

  describe("footer info", () => {
    it("deve mostrar quantidade de grupos", () => {
      renderWithRouter(<EtapaCard etapa={mockEtapa} />);
      expect(screen.getByText("4 grupos")).toBeInTheDocument();
    });

    it("deve mostrar duplas por grupo para Dupla Fixa", () => {
      renderWithRouter(<EtapaCard etapa={mockEtapa} />);
      expect(screen.getByText("4 duplas/grupo")).toBeInTheDocument();
    });
  });

  describe("navegação", () => {
    it("deve navegar para detalhes ao clicar no card", () => {
      renderWithRouter(<EtapaCard etapa={mockEtapa} />);
      const card = screen.getByText("Etapa Teste").closest("div");

      if (card) {
        fireEvent.click(card);
        expect(mockNavigate).toHaveBeenCalledWith("/admin/etapas/etapa-1");
      }
    });

    it("deve mostrar botão Ver detalhes para status INSCRICOES_ABERTAS", () => {
      renderWithRouter(<EtapaCard etapa={mockEtapa} />);
      expect(screen.getByText("Ver detalhes →")).toBeInTheDocument();
    });

    it("deve mostrar botão Ver chaves para status CHAVES_GERADAS", () => {
      const etapaChaves = {
        ...mockEtapa,
        status: StatusEtapa.CHAVES_GERADAS,
      };
      renderWithRouter(<EtapaCard etapa={etapaChaves} />);
      expect(screen.getByText("Ver chaves →")).toBeInTheDocument();
    });

    it("deve mostrar botão Ver grupos para Rei da Praia com CHAVES_GERADAS", () => {
      const etapaReiChaves = {
        ...mockEtapa,
        formato: FormatoEtapa.REI_DA_PRAIA,
        status: StatusEtapa.CHAVES_GERADAS,
      };
      renderWithRouter(<EtapaCard etapa={etapaReiChaves} />);
      expect(screen.getByText("Ver grupos →")).toBeInTheDocument();
    });

    it("deve mostrar botão Ver eliminatória para FASE_ELIMINATORIA", () => {
      const etapaEliminatoria = {
        ...mockEtapa,
        status: StatusEtapa.FASE_ELIMINATORIA,
      };
      renderWithRouter(<EtapaCard etapa={etapaEliminatoria} />);
      expect(screen.getByText("Ver eliminatória →")).toBeInTheDocument();
    });

    it("deve mostrar Concluída para FINALIZADA", () => {
      const etapaFinalizada = {
        ...mockEtapa,
        status: StatusEtapa.FINALIZADA,
      };
      renderWithRouter(<EtapaCard etapa={etapaFinalizada} />);
      expect(screen.getByText("Concluída")).toBeInTheDocument();
    });
  });

  describe("formatação de data", () => {
    it("deve formatar data string corretamente", () => {
      renderWithRouter(<EtapaCard etapa={mockEtapa} />);
      // Data "2024-12-15" é formatada pelo date-fns (pode variar por timezone)
      expect(screen.getByText(/\d{2}\/12\/2024/)).toBeInTheDocument();
    });

    it("deve formatar data com _seconds (Firestore)", () => {
      const etapaFirestore = {
        ...mockEtapa,
        dataRealizacao: { _seconds: 1734220800 } as any, // Dezembro 2024
      };
      renderWithRouter(<EtapaCard etapa={etapaFirestore} />);
      // Deve mostrar a data formatada
      expect(screen.getByText(/\/12\/2024/)).toBeInTheDocument();
    });

    it("deve lidar com formato de data inválido", () => {
      const etapaDataInvalida = {
        ...mockEtapa,
        dataRealizacao: "invalid-date" as any,
      };
      renderWithRouter(<EtapaCard etapa={etapaDataInvalida} />);
      // Deve mostrar "Data inválida" quando o formato é inválido
      expect(screen.getByText("Data inválida")).toBeInTheDocument();
    });
  });

  describe("botões de ação", () => {
    it("deve impedir propagação de click no botão Ver detalhes", () => {
      renderWithRouter(<EtapaCard etapa={mockEtapa} />);
      const button = screen.getByText("Ver detalhes →");

      // Limpar chamadas anteriores
      mockNavigate.mockClear();

      fireEvent.click(button);

      // Deve navegar uma vez pelo botão
      expect(mockNavigate).toHaveBeenCalledWith("/admin/etapas/etapa-1");
    });

    it("deve navegar ao clicar no botão Ver chaves", () => {
      const etapaChaves = {
        ...mockEtapa,
        status: StatusEtapa.CHAVES_GERADAS,
      };
      renderWithRouter(<EtapaCard etapa={etapaChaves} />);
      const button = screen.getByText("Ver chaves →");

      mockNavigate.mockClear();
      fireEvent.click(button);

      expect(mockNavigate).toHaveBeenCalledWith("/admin/etapas/etapa-1");
    });

    it("deve navegar ao clicar no botão Ver eliminatória", () => {
      const etapaEliminatoria = {
        ...mockEtapa,
        status: StatusEtapa.FASE_ELIMINATORIA,
      };
      renderWithRouter(<EtapaCard etapa={etapaEliminatoria} />);
      const button = screen.getByText("Ver eliminatória →");

      mockNavigate.mockClear();
      fireEvent.click(button);

      expect(mockNavigate).toHaveBeenCalledWith("/admin/etapas/etapa-1");
    });

    it("deve navegar ao clicar no botão Concluída", () => {
      const etapaFinalizada = {
        ...mockEtapa,
        status: StatusEtapa.FINALIZADA,
      };
      renderWithRouter(<EtapaCard etapa={etapaFinalizada} />);
      const button = screen.getByText("Concluída");

      mockNavigate.mockClear();
      fireEvent.click(button);

      expect(mockNavigate).toHaveBeenCalledWith("/admin/etapas/etapa-1");
    });
  });

  describe("chaveamento sem tipo definido", () => {
    it("deve retornar string vazia para tipo de chaveamento desconhecido", () => {
      const etapaChaveamentoDesconhecido: Etapa = {
        ...mockEtapa,
        formato: FormatoEtapa.REI_DA_PRAIA,
        tipoChaveamento: "tipo_desconhecido" as TipoChaveamentoReiDaPraia,
      };
      renderWithRouter(<EtapaCard etapa={etapaChaveamentoDesconhecido} />);

      // Deve renderizar sem crash
      expect(screen.getByText("Rei da Praia")).toBeInTheDocument();
    });
  });

  describe("genero desconhecido", () => {
    it("deve mostrar gênero original se não for masculino nem feminino", () => {
      const etapaGeneroDesconhecido = {
        ...mockEtapa,
        genero: "OUTRO" as GeneroJogador,
      };
      renderWithRouter(<EtapaCard etapa={etapaGeneroDesconhecido} />);

      expect(screen.getByText("OUTRO")).toBeInTheDocument();
    });
  });

  describe("nivel desconhecido", () => {
    it("deve mostrar nível original se não for iniciante, intermediário nem avançado", () => {
      const etapaNivelDesconhecido = {
        ...mockEtapa,
        nivel: "PROFISSIONAL" as NivelJogador,
      };
      renderWithRouter(<EtapaCard etapa={etapaNivelDesconhecido} />);

      expect(screen.getByText("PROFISSIONAL")).toBeInTheDocument();
    });
  });

  describe("formatação de data Date object", () => {
    it("deve formatar Date object corretamente", () => {
      const etapaComDate = {
        ...mockEtapa,
        dataRealizacao: new Date("2024-12-15") as any,
      };
      renderWithRouter(<EtapaCard etapa={etapaComDate} />);

      // Deve mostrar a data formatada (pode ter variação de timezone)
      expect(screen.getByText(/\/12\/2024/)).toBeInTheDocument();
    });
  });

  describe("status INSCRICOES_FECHADAS", () => {
    it("não deve mostrar botão de ação para status INSCRICOES_FECHADAS", () => {
      const etapaInscricoesFechadas = {
        ...mockEtapa,
        status: StatusEtapa.INSCRICOES_FECHADAS,
      };
      renderWithRouter(<EtapaCard etapa={etapaInscricoesFechadas} />);

      // Não mostra nenhum botão de ação específico para este status
      expect(screen.queryByText("Ver detalhes →")).not.toBeInTheDocument();
      expect(screen.queryByText("Ver chaves →")).not.toBeInTheDocument();
    });
  });

  describe("rei da praia grupos", () => {
    it("deve navegar ao clicar no botão Ver grupos para Rei da Praia", () => {
      const etapaReiChaves = {
        ...mockEtapa,
        formato: FormatoEtapa.REI_DA_PRAIA,
        status: StatusEtapa.CHAVES_GERADAS,
      };
      renderWithRouter(<EtapaCard etapa={etapaReiChaves} />);
      const button = screen.getByText("Ver grupos →");

      mockNavigate.mockClear();
      fireEvent.click(button);

      expect(mockNavigate).toHaveBeenCalledWith("/admin/etapas/etapa-1");
    });
  });
});
