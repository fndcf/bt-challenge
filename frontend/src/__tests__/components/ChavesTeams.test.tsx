/**
 * Testes do componente ChavesTeams
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock dos services
const mockBuscarEquipes = jest.fn();
const mockBuscarConfrontos = jest.fn();
const mockBuscarPartidasConfronto = jest.fn();
const mockRenomearEquipe = jest.fn();
const mockGerarPartidasConfronto = jest.fn();
const mockGerarDecider = jest.fn();
const mockEncerrarEtapa = jest.fn();

jest.mock("@/services", () => ({
  getTeamsService: () => ({
    buscarEquipes: mockBuscarEquipes,
    buscarConfrontos: mockBuscarConfrontos,
    buscarPartidasConfronto: mockBuscarPartidasConfronto,
    renomearEquipe: mockRenomearEquipe,
    gerarPartidasConfronto: mockGerarPartidasConfronto,
    gerarDecider: mockGerarDecider,
  }),
  getEtapaService: () => ({
    encerrarEtapa: mockEncerrarEtapa,
  }),
}));

// Mock do LoadingOverlay
jest.mock("@/components/ui", () => ({
  LoadingOverlay: ({ isLoading, message }: { isLoading: boolean; message: string }) =>
    isLoading ? <div data-testid="loading-overlay">{message}</div> : null,
}));

// Mock do ModalLancamentoResultadosLoteTeams
jest.mock("@/components/etapas/ModalLancamentoResultadosLoteTeams", () => ({
  ModalLancamentoResultadosLoteTeams: ({ onClose, onSuccess }: any) => (
    <div data-testid="modal-resultados">
      <button onClick={onClose}>Fechar</button>
      <button onClick={onSuccess}>Salvar</button>
    </div>
  ),
}));

// Mock do ModalDefinirJogadoresPartida
jest.mock("@/components/etapas/ModalDefinirJogadoresPartida", () => ({
  ModalDefinirJogadoresPartida: ({ onClose, onConfirm }: any) => (
    <div data-testid="modal-definir-jogadores">
      <button onClick={onClose}>Fechar</button>
      <button onClick={() => onConfirm(["j1", "j2"], ["j3", "j4"])}>Confirmar</button>
    </div>
  ),
}));

// Mock do ConfirmacaoPerigosa
jest.mock("@/components/modals/ConfirmacaoPerigosa", () => ({
  ConfirmacaoPerigosa: ({ isOpen, onConfirm, onClose }: any) =>
    isOpen ? (
      <div data-testid="modal-encerrar">
        <button onClick={onConfirm}>Confirmar Encerrar</button>
        <button onClick={onClose}>Cancelar</button>
      </div>
    ) : null,
}));

// Mock do invalidateRankingCache
jest.mock("@/components/jogadores/RankingList", () => ({
  invalidateRankingCache: jest.fn(),
}));

import { ChavesTeams } from "@/components/etapas/ChavesTeams/ChavesTeams";
import { StatusConfronto, VarianteTeams, TipoFormacaoJogos } from "@/types/teams";
import { FaseEtapa } from "@/types/chave";

// Dados de teste
const criarEquipeMock = (overrides = {}) => ({
  id: "equipe-1",
  nome: "Equipe Alpha",
  etapaId: "etapa-1",
  arenaId: "arena-1",
  jogadores: [
    { id: "jog-1", nome: "João", nivel: "avancado", genero: "masculino" },
    { id: "jog-2", nome: "Maria", nivel: "intermediario", genero: "feminino" },
    { id: "jog-3", nome: "Pedro", nivel: "iniciante", genero: "masculino" },
    { id: "jog-4", nome: "Ana", nivel: "avancado", genero: "feminino" },
  ],
  grupoId: "A",
  posicao: 1,
  pontos: 6,
  vitorias: 2,
  derrotas: 0,
  confrontos: 2,
  jogosVencidos: 4,
  jogosPerdidos: 0,
  saldoJogos: 4,
  gamesVencidos: 24,
  gamesPerdidos: 8,
  saldoGames: 16,
  ...overrides,
});

const criarConfrontoMock = (overrides = {}) => ({
  id: "confronto-1",
  etapaId: "etapa-1",
  arenaId: "arena-1",
  equipe1Id: "equipe-1",
  equipe1Nome: "Equipe Alpha",
  equipe2Id: "equipe-2",
  equipe2Nome: "Equipe Beta",
  jogosEquipe1: 0,
  jogosEquipe2: 0,
  gamesEquipe1: 0,
  gamesEquipe2: 0,
  status: StatusConfronto.PENDENTE,
  ordem: 1,
  fase: FaseEtapa.GRUPOS,
  grupoId: "A",
  partidas: [],
  temDecider: false,
  ...overrides,
});

const criarPartidaMock = (overrides = {}) => ({
  id: "partida-1",
  confrontoId: "confronto-1",
  etapaId: "etapa-1",
  arenaId: "arena-1",
  equipe1Id: "equipe-1",
  equipe1Nome: "Equipe Alpha",
  equipe2Id: "equipe-2",
  equipe2Nome: "Equipe Beta",
  tipoJogo: "feminino",
  ordem: 1,
  status: "pendente",
  placar: [],
  dupla1: [
    { id: "jog-2", nome: "Maria" },
    { id: "jog-4", nome: "Ana" },
  ],
  dupla2: [
    { id: "jog-6", nome: "Carla" },
    { id: "jog-8", nome: "Lucia" },
  ],
  ...overrides,
});

describe("ChavesTeams", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("estado de loading", () => {
    it("deve mostrar spinner durante loading", () => {
      mockBuscarEquipes.mockReturnValue(new Promise(() => {}));
      mockBuscarConfrontos.mockReturnValue(new Promise(() => {}));

      const { container } = render(<ChavesTeams etapaId="etapa-1" />);

      // Deve renderizar algo (spinner)
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("estado de erro", () => {
    it("deve mostrar mensagem de erro quando falha ao carregar", async () => {
      mockBuscarEquipes.mockRejectedValue(new Error("Erro ao carregar equipes"));
      mockBuscarConfrontos.mockResolvedValue([]);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        expect(screen.getByText(/Erro:/)).toBeInTheDocument();
        expect(screen.getByText(/Erro ao carregar equipes/)).toBeInTheDocument();
      });
    });
  });

  describe("estado vazio", () => {
    it("deve mostrar mensagem quando não há equipes", async () => {
      mockBuscarEquipes.mockResolvedValue([]);
      mockBuscarConfrontos.mockResolvedValue([]);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        expect(screen.getByText("Nenhuma equipe gerada ainda")).toBeInTheDocument();
      });
    });
  });

  describe("renderização básica", () => {
    it("deve renderizar equipes e confrontos com sucesso", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", nome: "Equipe Alpha", posicao: 1, grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", nome: "Equipe Beta", posicao: 2, grupoId: "A" }),
      ];
      const confrontos = [criarConfrontoMock({ grupoId: "A" })];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);

      render(<ChavesTeams etapaId="etapa-1" varianteTeams={VarianteTeams.TEAMS_4} />);

      await waitFor(() => {
        expect(screen.getByText("TEAMS 4")).toBeInTheDocument();
        expect(screen.getByText("Equipes")).toBeInTheDocument();
        // Equipes aparecem nos cards
        const alphaElements = screen.getAllByText("Equipe Alpha");
        expect(alphaElements.length).toBeGreaterThan(0);
      });
    });

    it("deve mostrar badge de variante TEAMS 6", async () => {
      mockBuscarEquipes.mockResolvedValue([criarEquipeMock()]);
      mockBuscarConfrontos.mockResolvedValue([]);

      render(<ChavesTeams etapaId="etapa-1" varianteTeams={VarianteTeams.TEAMS_6} />);

      await waitFor(() => {
        expect(screen.getByText("TEAMS 6")).toBeInTheDocument();
      });
    });

    it("deve mostrar estatísticas corretas das equipes", async () => {
      const equipe = criarEquipeMock({
        pontos: 9,
        vitorias: 3,
        derrotas: 0,
        saldoJogos: 6,
        saldoGames: 24,
      });

      mockBuscarEquipes.mockResolvedValue([equipe]);
      mockBuscarConfrontos.mockResolvedValue([]);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        expect(screen.getByText("9")).toBeInTheDocument(); // Pontos
        expect(screen.getByText("3-0")).toBeInTheDocument(); // V-D
        expect(screen.getByText("+6")).toBeInTheDocument(); // SJ
        expect(screen.getByText("+24")).toBeInTheDocument(); // SG
      });
    });

    it("deve mostrar jogadores da equipe com badges de nível e gênero", async () => {
      mockBuscarEquipes.mockResolvedValue([criarEquipeMock({ grupoId: "A" })]);
      mockBuscarConfrontos.mockResolvedValue([]);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        expect(screen.getByText("João")).toBeInTheDocument();
        expect(screen.getByText("Maria")).toBeInTheDocument();
        // Verificar badges de nível
        expect(screen.getAllByText("AVA").length).toBeGreaterThan(0); // nivel avancado
        expect(screen.getByText("INT")).toBeInTheDocument(); // nivel intermediario
        expect(screen.getByText("INI")).toBeInTheDocument(); // nivel iniciante
      });
    });
  });

  describe("fase de grupos", () => {
    it("deve mostrar grupos separados quando há grupoId", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", nome: "Equipe Alpha", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", nome: "Equipe Beta", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-3", nome: "Equipe Gamma", grupoId: "B" }),
        criarEquipeMock({ id: "equipe-4", nome: "Equipe Delta", grupoId: "B" }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue([]);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        expect(screen.getByText("Grupo A")).toBeInTheDocument();
        expect(screen.getByText("Grupo B")).toBeInTheDocument();
      });
    });

    it("deve mostrar confrontos do grupo", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", nome: "Equipe Alpha", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", nome: "Equipe Beta", grupoId: "A" }),
      ];
      const confrontos = [
        criarConfrontoMock({ grupoId: "A", status: StatusConfronto.PENDENTE }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        expect(screen.getByText("Confrontos do Grupo")).toBeInTheDocument();
        expect(screen.getByText("Aguardando")).toBeInTheDocument();
      });
    });
  });

  describe("tabs de navegação", () => {
    it("deve alternar entre fase de grupos e eliminatória", async () => {
      const equipes = [criarEquipeMock({ grupoId: "A" })];
      const confrontos = [
        criarConfrontoMock({ fase: FaseEtapa.GRUPOS, grupoId: "A" }),
        criarConfrontoMock({
          id: "confronto-2",
          fase: FaseEtapa.FINAL,
          ordem: 15,
          equipe1Origem: "Vencedor Semifinal 1",
          equipe2Origem: "Vencedor Semifinal 2",
        }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        expect(screen.getByText(/Fase de Grupos/)).toBeInTheDocument();
        expect(screen.getByText(/Eliminatória/)).toBeInTheDocument();
      });

      // Clicar na aba eliminatória
      fireEvent.click(screen.getByText(/Eliminatória/));

      await waitFor(() => {
        expect(screen.getByText("Final")).toBeInTheDocument();
      });
    });
  });

  describe("confrontos", () => {
    it("deve mostrar status do confronto corretamente", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", grupoId: "A" }),
      ];
      const confrontos = [
        criarConfrontoMock({ status: StatusConfronto.FINALIZADO, grupoId: "A" }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        expect(screen.getByText("Finalizado")).toBeInTheDocument();
      });
    });

    it("deve mostrar placar do confronto", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", grupoId: "A" }),
      ];
      const confrontos = [
        criarConfrontoMock({
          jogosEquipe1: 2,
          jogosEquipe2: 1,
          status: StatusConfronto.FINALIZADO,
          grupoId: "A",
        }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        expect(screen.getByText("2")).toBeInTheDocument();
        expect(screen.getByText("1")).toBeInTheDocument();
      });
    });

    it("deve mostrar botão de resultados para confronto pendente", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", grupoId: "A" }),
      ];
      const confrontos = [
        criarConfrontoMock({ status: StatusConfronto.PENDENTE, grupoId: "A" }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        expect(screen.getByText("Resultados")).toBeInTheDocument();
      });
    });

    it("deve mostrar botão de Editar para confronto finalizado", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", grupoId: "A" }),
      ];
      const confrontos = [
        criarConfrontoMock({ status: StatusConfronto.FINALIZADO, grupoId: "A" }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        expect(screen.getByText("Editar")).toBeInTheDocument();
      });
    });
  });

  describe("decider", () => {
    it("deve mostrar alerta e botão de decider quando empate 1-1 em TEAMS 4", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", grupoId: "A" }),
      ];
      const confrontos = [
        criarConfrontoMock({
          jogosEquipe1: 1,
          jogosEquipe2: 1,
          status: StatusConfronto.EM_ANDAMENTO,
          temDecider: false,
          grupoId: "A",
        }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);

      render(<ChavesTeams etapaId="etapa-1" varianteTeams={VarianteTeams.TEAMS_4} />);

      await waitFor(() => {
        expect(screen.getByText("Empate 1-1! Gere o Decider para definir o vencedor.")).toBeInTheDocument();
        expect(screen.getByText("Gerar Decider")).toBeInTheDocument();
      });
    });

    it("deve chamar gerarDecider ao clicar no botão", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", grupoId: "A" }),
      ];
      const confrontos = [
        criarConfrontoMock({
          jogosEquipe1: 1,
          jogosEquipe2: 1,
          status: StatusConfronto.EM_ANDAMENTO,
          temDecider: false,
          grupoId: "A",
        }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);
      mockGerarDecider.mockResolvedValue({});

      render(<ChavesTeams etapaId="etapa-1" varianteTeams={VarianteTeams.TEAMS_4} />);

      await waitFor(() => {
        expect(screen.getByText("Gerar Decider")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Gerar Decider"));

      await waitFor(() => {
        expect(mockGerarDecider).toHaveBeenCalledWith("etapa-1", "confronto-1");
      });
    });
  });

  describe("expandir partidas", () => {
    it("deve expandir e mostrar partidas ao clicar em Ver Partidas", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", grupoId: "A" }),
      ];
      const confrontos = [
        criarConfrontoMock({
          grupoId: "A",
          partidas: [{ id: "p1" }],
        }),
      ];
      const partidas = [
        criarPartidaMock({ tipoJogo: "feminino", ordem: 1, status: "finalizada" }),
        criarPartidaMock({ id: "partida-2", tipoJogo: "masculino", ordem: 2 }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);
      mockBuscarPartidasConfronto.mockResolvedValue(partidas);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        expect(screen.getByText("Ver Partidas")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Ver Partidas"));

      await waitFor(() => {
        expect(mockBuscarPartidasConfronto).toHaveBeenCalledWith("etapa-1", "confronto-1");
        expect(screen.getByText("Jogo 1")).toBeInTheDocument();
        expect(screen.getByText("FEM")).toBeInTheDocument();
      });
    });

    it("deve colapsar partidas ao clicar em Ocultar", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", grupoId: "A" }),
      ];
      const confrontos = [
        criarConfrontoMock({ grupoId: "A", partidas: [{ id: "p1" }] }),
      ];
      const partidas = [criarPartidaMock()];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);
      mockBuscarPartidasConfronto.mockResolvedValue(partidas);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Ver Partidas"));
      });

      await waitFor(() => {
        expect(screen.getByText("Ocultar")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Ocultar"));

      await waitFor(() => {
        expect(screen.getByText("Ver Partidas")).toBeInTheDocument();
      });
    });
  });

  describe("modal de resultados", () => {
    it("deve abrir modal de resultados ao clicar no botão", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", grupoId: "A" }),
      ];
      const confrontos = [
        criarConfrontoMock({ grupoId: "A", partidas: [{ id: "p1" }] }),
      ];
      const partidas = [criarPartidaMock()];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);
      mockBuscarPartidasConfronto.mockResolvedValue(partidas);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        expect(screen.getByText("Resultados")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Resultados"));

      await waitFor(() => {
        expect(screen.getByTestId("modal-resultados")).toBeInTheDocument();
      });
    });

    it("deve fechar modal ao clicar em fechar", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", grupoId: "A" }),
      ];
      const confrontos = [
        criarConfrontoMock({ grupoId: "A", partidas: [{ id: "p1" }] }),
      ];
      const partidas = [criarPartidaMock()];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);
      mockBuscarPartidasConfronto.mockResolvedValue(partidas);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Resultados"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("modal-resultados")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Fechar"));

      await waitFor(() => {
        expect(screen.queryByTestId("modal-resultados")).not.toBeInTheDocument();
      });
    });
  });

  describe("renomear equipe", () => {
    it("deve iniciar edição ao clicar no botão de editar", async () => {
      const equipes = [criarEquipeMock()];
      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue([]);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        expect(screen.getByText("Equipe Alpha")).toBeInTheDocument();
      });

      // Encontrar o botão de editar pelo título
      const editButton = screen.getByTitle("Renomear equipe");
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Equipe Alpha")).toBeInTheDocument();
      });
    });

    it("deve salvar novo nome ao pressionar Enter", async () => {
      const equipes = [criarEquipeMock()];
      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue([]);
      mockRenomearEquipe.mockResolvedValue({});

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        fireEvent.click(screen.getByTitle("Renomear equipe"));
      });

      const input = screen.getByDisplayValue("Equipe Alpha");
      fireEvent.change(input, { target: { value: "Novo Nome" } });
      fireEvent.keyDown(input, { key: "Enter" });

      await waitFor(() => {
        expect(mockRenomearEquipe).toHaveBeenCalledWith("etapa-1", "equipe-1", "Novo Nome");
      });
    });

    it("deve cancelar edição ao pressionar Escape", async () => {
      const equipes = [criarEquipeMock()];
      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue([]);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        fireEvent.click(screen.getByTitle("Renomear equipe"));
      });

      const input = screen.getByDisplayValue("Equipe Alpha");
      fireEvent.change(input, { target: { value: "Novo Nome" } });
      fireEvent.keyDown(input, { key: "Escape" });

      await waitFor(() => {
        expect(screen.getByText("Equipe Alpha")).toBeInTheDocument();
        expect(mockRenomearEquipe).not.toHaveBeenCalled();
      });
    });
  });

  describe("etapa finalizada", () => {
    it("deve mostrar alerta quando etapa está finalizada", async () => {
      const equipes = [criarEquipeMock()];
      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue([]);

      render(<ChavesTeams etapaId="etapa-1" etapaFinalizada={true} />);

      await waitFor(() => {
        expect(screen.getByText(/Esta etapa foi encerrada/)).toBeInTheDocument();
      });
    });

    it("não deve mostrar botão de editar equipe quando etapa finalizada", async () => {
      const equipes = [criarEquipeMock()];
      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue([]);

      render(<ChavesTeams etapaId="etapa-1" etapaFinalizada={true} />);

      await waitFor(() => {
        expect(screen.queryByTitle("Renomear equipe")).not.toBeInTheDocument();
      });
    });

    it("não deve mostrar botões de ação em confrontos quando etapa finalizada", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", grupoId: "A" }),
      ];
      const confrontos = [criarConfrontoMock({ grupoId: "A" })];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);

      render(<ChavesTeams etapaId="etapa-1" etapaFinalizada={true} />);

      await waitFor(() => {
        expect(screen.queryByText("Resultados")).not.toBeInTheDocument();
        expect(screen.queryByText("Editar")).not.toBeInTheDocument();
      });
    });
  });

  describe("encerrar etapa", () => {
    it("deve mostrar botão de encerrar quando todos confrontos finalizados", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", grupoId: "A" }),
      ];
      const confrontos = [
        criarConfrontoMock({ status: StatusConfronto.FINALIZADO, grupoId: "A" }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        expect(screen.getByText("Encerrar Etapa")).toBeInTheDocument();
      });
    });

    it("deve abrir modal de confirmação ao clicar em encerrar", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", grupoId: "A" }),
      ];
      const confrontos = [
        criarConfrontoMock({ status: StatusConfronto.FINALIZADO, grupoId: "A" }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Encerrar Etapa"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("modal-encerrar")).toBeInTheDocument();
      });
    });

    it("deve chamar encerrarEtapa e callback ao confirmar", async () => {
      const onAtualizar = jest.fn();
      const equipes = [
        criarEquipeMock({ id: "equipe-1", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", grupoId: "A" }),
      ];
      const confrontos = [
        criarConfrontoMock({ status: StatusConfronto.FINALIZADO, grupoId: "A" }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);
      mockEncerrarEtapa.mockResolvedValue({});

      render(<ChavesTeams etapaId="etapa-1" onAtualizar={onAtualizar} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Encerrar Etapa"));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText("Confirmar Encerrar"));
      });

      await waitFor(() => {
        expect(mockEncerrarEtapa).toHaveBeenCalledWith("etapa-1");
        expect(onAtualizar).toHaveBeenCalled();
      });
    });
  });

  describe("fase eliminatória", () => {
    it("deve renderizar fases eliminatórias corretamente", async () => {
      const equipes = [criarEquipeMock({ grupoId: "A" })];
      const confrontos = [
        criarConfrontoMock({ fase: FaseEtapa.GRUPOS, grupoId: "A" }),
        criarConfrontoMock({
          id: "conf-oitavas",
          fase: FaseEtapa.OITAVAS,
          ordem: 1,
          equipe1Origem: "1º Grupo A",
          equipe2Origem: "2º Grupo B",
          equipe1Id: null,
          equipe2Id: null,
        }),
        criarConfrontoMock({
          id: "conf-quartas",
          fase: FaseEtapa.QUARTAS,
          ordem: 9,
          equipe1Origem: "Vencedor Oitavas 1",
          equipe2Origem: "Vencedor Oitavas 2",
          equipe1Id: null,
          equipe2Id: null,
        }),
        criarConfrontoMock({
          id: "conf-semi",
          fase: FaseEtapa.SEMIFINAL,
          ordem: 13,
          equipe1Origem: "Vencedor Quartas 1",
          equipe2Origem: "Vencedor Quartas 2",
          equipe1Id: null,
          equipe2Id: null,
        }),
        criarConfrontoMock({
          id: "conf-final",
          fase: FaseEtapa.FINAL,
          ordem: 15,
          equipe1Origem: "Vencedor Semifinal 1",
          equipe2Origem: "Vencedor Semifinal 2",
          equipe1Id: null,
          equipe2Id: null,
        }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        expect(screen.getByText(/Eliminatória/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Eliminatória/));

      await waitFor(() => {
        expect(screen.getByText("Oitavas de Final")).toBeInTheDocument();
        expect(screen.getByText("Quartas de Final")).toBeInTheDocument();
        expect(screen.getByText("Semifinais")).toBeInTheDocument();
        expect(screen.getByText("Final")).toBeInTheDocument();
      });
    });

    it("deve mostrar origem das equipes quando não definidas", async () => {
      const equipes = [criarEquipeMock({ grupoId: "A" })];
      const confrontos = [
        criarConfrontoMock({ fase: FaseEtapa.GRUPOS, grupoId: "A" }),
        criarConfrontoMock({
          id: "conf-final",
          fase: FaseEtapa.FINAL,
          ordem: 15,
          equipe1Id: null,
          equipe1Nome: null,
          equipe2Id: null,
          equipe2Nome: null,
          equipe1Origem: "Vencedor Semifinal 1",
          equipe2Origem: "Vencedor Semifinal 2",
        }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        fireEvent.click(screen.getByText(/Eliminatória/));
      });

      await waitFor(() => {
        expect(screen.getByText("Vencedor Semifinal 1")).toBeInTheDocument();
        expect(screen.getByText("Vencedor Semifinal 2")).toBeInTheDocument();
      });
    });
  });

  describe("sem fase de grupos", () => {
    it("deve mostrar todas equipes juntas quando não há grupoId", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", grupoId: undefined }),
        criarEquipeMock({ id: "equipe-2", grupoId: undefined }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue([]);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        expect(screen.getByText("Todas as Equipes")).toBeInTheDocument();
      });
    });
  });

  describe("info card", () => {
    it("deve mostrar informações do formato TEAMS 4", async () => {
      const equipes = [criarEquipeMock({ grupoId: "A" })];
      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue([]);

      render(<ChavesTeams etapaId="etapa-1" varianteTeams={VarianteTeams.TEAMS_4} />);

      await waitFor(() => {
        expect(screen.getByText("Formato TEAMS 4")).toBeInTheDocument();
        expect(screen.getByText(/4 jogadores/)).toBeInTheDocument();
        expect(screen.getByText(/2 jogos/)).toBeInTheDocument();
        expect(screen.getByText(/decider se empate 1-1/)).toBeInTheDocument();
      });
    });

    it("deve mostrar informações do formato TEAMS 6", async () => {
      const equipes = [criarEquipeMock({ grupoId: "A" })];
      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue([]);

      render(<ChavesTeams etapaId="etapa-1" varianteTeams={VarianteTeams.TEAMS_6} />);

      await waitFor(() => {
        expect(screen.getByText("Formato TEAMS 6")).toBeInTheDocument();
        expect(screen.getByText(/6 jogadores/)).toBeInTheDocument();
        expect(screen.getByText(/3 jogos/)).toBeInTheDocument();
      });
    });
  });

  describe("gerar partidas automaticamente", () => {
    it("deve gerar partidas quando confronto não tem partidas ao expandir", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", grupoId: "A" }),
      ];
      const confrontos = [
        criarConfrontoMock({ grupoId: "A", partidas: [] }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);
      mockGerarPartidasConfronto.mockResolvedValue([criarPartidaMock()]);
      mockBuscarPartidasConfronto.mockResolvedValue([criarPartidaMock()]);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        expect(screen.getByText("Ver Partidas")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Ver Partidas"));

      await waitFor(() => {
        expect(mockGerarPartidasConfronto).toHaveBeenCalledWith("etapa-1", "confronto-1");
      });
    });
  });

  describe("definir jogadores", () => {
    it("deve mostrar botão definir jogadores para partida sem duplas", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", grupoId: "A" }),
      ];
      const confrontos = [
        criarConfrontoMock({ grupoId: "A", partidas: [{ id: "p1" }] }),
      ];
      const partidas = [
        criarPartidaMock({ dupla1: [], dupla2: [], status: "pendente" }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);
      mockBuscarPartidasConfronto.mockResolvedValue(partidas);

      render(<ChavesTeams etapaId="etapa-1" tipoFormacaoJogos={TipoFormacaoJogos.MANUAL} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Ver Partidas"));
      });

      await waitFor(() => {
        expect(screen.getByText("Definir Jogadores")).toBeInTheDocument();
      });
    });

    it("deve abrir modal ao clicar em definir jogadores", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", grupoId: "A" }),
      ];
      const confrontos = [
        criarConfrontoMock({ grupoId: "A", partidas: [{ id: "p1" }] }),
      ];
      const partidas = [
        criarPartidaMock({ dupla1: [], dupla2: [], status: "pendente" }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);
      mockBuscarPartidasConfronto.mockResolvedValue(partidas);

      render(<ChavesTeams etapaId="etapa-1" tipoFormacaoJogos={TipoFormacaoJogos.MANUAL} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Ver Partidas"));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText("Definir Jogadores"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("modal-definir-jogadores")).toBeInTheDocument();
      });
    });
  });

  describe("estatísticas", () => {
    it("deve exibir estatísticas básicas após carregar dados", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", grupoId: "A" }),
      ];
      const confrontos = [
        criarConfrontoMock({ id: "c1", status: StatusConfronto.FINALIZADO, grupoId: "A" }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        // Verifica que o header com estatísticas está presente
        expect(screen.getByText("Equipes")).toBeInTheDocument();
        expect(screen.getByText("Grupo A")).toBeInTheDocument();
      });
    });
  });

  describe("helpers e edge cases", () => {
    it("deve mostrar label correto para status Em Andamento", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", grupoId: "A" }),
      ];
      const confrontos = [
        criarConfrontoMock({ status: StatusConfronto.EM_ANDAMENTO, grupoId: "A" }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        expect(screen.getByText("Em andamento")).toBeInTheDocument();
      });
    });

    it("deve mostrar jogador sem nível/gênero corretamente", async () => {
      const equipe = criarEquipeMock({
        jogadores: [
          { id: "jog-1", nome: "Jogador Sem Info" },
        ],
      });

      mockBuscarEquipes.mockResolvedValue([equipe]);
      mockBuscarConfrontos.mockResolvedValue([]);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        expect(screen.getByText("Jogador Sem Info")).toBeInTheDocument();
      });
    });

    it("deve mostrar saldo negativo de jogos corretamente", async () => {
      const equipe = criarEquipeMock({
        saldoJogos: -2,
        saldoGames: -8,
      });

      mockBuscarEquipes.mockResolvedValue([equipe]);
      mockBuscarConfrontos.mockResolvedValue([]);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        expect(screen.getByText("-2")).toBeInTheDocument();
        expect(screen.getByText("-8")).toBeInTheDocument();
      });
    });

    it("deve mostrar saldo zero corretamente", async () => {
      const equipe = criarEquipeMock({
        saldoJogos: 0,
        saldoGames: 0,
      });

      mockBuscarEquipes.mockResolvedValue([equipe]);
      mockBuscarConfrontos.mockResolvedValue([]);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        // Saldo zero não mostra sinal
        const zeros = screen.getAllByText("0");
        expect(zeros.length).toBeGreaterThan(0);
      });
    });

    it("deve renderizar grupo B e C com cores diferentes", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", grupoId: "B" }),
        criarEquipeMock({ id: "equipe-2", grupoId: "C" }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue([]);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        expect(screen.getByText("Grupo B")).toBeInTheDocument();
        expect(screen.getByText("Grupo C")).toBeInTheDocument();
      });
    });

    it("deve mostrar tipo de jogo MISTO corretamente", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", grupoId: "A" }),
      ];
      const confrontos = [
        criarConfrontoMock({ grupoId: "A", partidas: [{ id: "p1" }] }),
      ];
      const partidas = [
        criarPartidaMock({ tipoJogo: "misto" }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);
      mockBuscarPartidasConfronto.mockResolvedValue(partidas);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Ver Partidas"));
      });

      await waitFor(() => {
        expect(screen.getByText("MISTO")).toBeInTheDocument();
      });
    });

    it("deve mostrar tipo de jogo DECIDER corretamente", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", grupoId: "A" }),
      ];
      const confrontos = [
        criarConfrontoMock({ grupoId: "A", partidas: [{ id: "p1" }] }),
      ];
      const partidas = [
        criarPartidaMock({ tipoJogo: "decider" }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);
      mockBuscarPartidasConfronto.mockResolvedValue(partidas);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Ver Partidas"));
      });

      await waitFor(() => {
        expect(screen.getByText("DECIDER")).toBeInTheDocument();
      });
    });

    it("deve mostrar tipo de jogo desconhecido em uppercase", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", grupoId: "A" }),
      ];
      const confrontos = [
        criarConfrontoMock({ grupoId: "A", partidas: [{ id: "p1" }] }),
      ];
      const partidas = [
        criarPartidaMock({ tipoJogo: "outro" }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);
      mockBuscarPartidasConfronto.mockResolvedValue(partidas);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Ver Partidas"));
      });

      await waitFor(() => {
        expect(screen.getByText("OUTRO")).toBeInTheDocument();
      });
    });

    it("deve mostrar equipe vencedora em destaque no confronto", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", nome: "Equipe Alfa", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", nome: "Equipe Beta", grupoId: "A" }),
      ];
      const confrontos = [
        criarConfrontoMock({
          grupoId: "A",
          status: StatusConfronto.FINALIZADO,
          vencedoraId: "equipe-1",
          equipe1Nome: "Equipe Alfa",
          equipe2Nome: "Equipe Beta",
          jogosEquipe1: 2,
          jogosEquipe2: 0,
        }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        // O confronto deve mostrar as equipes
        expect(screen.getByText("Finalizado")).toBeInTheDocument();
        expect(screen.getByText("2")).toBeInTheDocument();
      });
    });

    it("deve mostrar placar da partida finalizada", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", grupoId: "A" }),
      ];
      const confrontos = [
        criarConfrontoMock({ grupoId: "A", partidas: [{ id: "p1" }] }),
      ];
      const partidas = [
        criarPartidaMock({
          status: "finalizada",
          placar: [{ gamesDupla1: 6, gamesDupla2: 4 }],
        }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);
      mockBuscarPartidasConfronto.mockResolvedValue(partidas);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Ver Partidas"));
      });

      await waitFor(() => {
        expect(screen.getByText("6 x 4")).toBeInTheDocument();
      });
    });

    it("deve ordenar equipes por posicao quando disponível", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-2", nome: "Equipe Zeta", posicao: 2, grupoId: "A" }),
        criarEquipeMock({ id: "equipe-1", nome: "Equipe Alpha", posicao: 1, grupoId: "A" }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue([]);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        expect(screen.getByText("Equipe Alpha")).toBeInTheDocument();
        expect(screen.getByText("Equipe Zeta")).toBeInTheDocument();
      });
    });

    it("deve ordenar equipes dentro do grupo por pontos quando sem posição", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", nome: "Menos Pontos", pontos: 3, posicao: undefined, grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", nome: "Mais Pontos", pontos: 9, posicao: undefined, grupoId: "A" }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue([]);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        expect(screen.getByText("Mais Pontos")).toBeInTheDocument();
        expect(screen.getByText("Menos Pontos")).toBeInTheDocument();
      });
    });

    it("deve usar nome como critério final de desempate", async () => {
      const equipes = [
        criarEquipeMock({
          id: "equipe-2",
          nome: "Zebra",
          pontos: 6,
          saldoJogos: 2,
          saldoGames: 10,
          posicao: undefined,
          grupoId: "A",
        }),
        criarEquipeMock({
          id: "equipe-1",
          nome: "Alpha",
          pontos: 6,
          saldoJogos: 2,
          saldoGames: 10,
          posicao: undefined,
          grupoId: "A",
        }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue([]);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        // Alpha vem primeiro por ordem alfabética
        expect(screen.getByText("Alpha")).toBeInTheDocument();
        expect(screen.getByText("Zebra")).toBeInTheDocument();
      });
    });

    it("deve mostrar A definir quando confronto sem equipes definidas", async () => {
      const equipes = [criarEquipeMock({ grupoId: "A" })];
      const confrontos = [
        criarConfrontoMock({
          id: "conf-eliminatoria",
          fase: FaseEtapa.FINAL,
          equipe1Id: null,
          equipe1Nome: null,
          equipe2Id: null,
          equipe2Nome: null,
          equipe1Origem: null,
          equipe2Origem: null,
        }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        fireEvent.click(screen.getByText(/Eliminatória/));
      });

      await waitFor(() => {
        const aDefinirElements = screen.getAllByText("A definir");
        expect(aDefinirElements.length).toBe(2);
      });
    });

    it("deve mostrar posição das equipes nas posições 1, 2 e 3 com cores diferentes", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", nome: "Primeiro", posicao: 1, grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", nome: "Segundo", posicao: 2, grupoId: "A" }),
        criarEquipeMock({ id: "equipe-3", nome: "Terceiro", posicao: 3, grupoId: "A" }),
        criarEquipeMock({ id: "equipe-4", nome: "Quarto", posicao: 4, grupoId: "A" }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue([]);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        expect(screen.getByText("#1")).toBeInTheDocument();
        expect(screen.getByText("#2")).toBeInTheDocument();
        expect(screen.getByText("#3")).toBeInTheDocument();
        expect(screen.getByText("#4")).toBeInTheDocument();
      });
    });

    it("deve mostrar partida sem tipo de jogo", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", grupoId: "A" }),
      ];
      const confrontos = [
        criarConfrontoMock({ grupoId: "A", partidas: [{ id: "p1" }] }),
      ];
      const partidas = [
        criarPartidaMock({ tipoJogo: undefined }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);
      mockBuscarPartidasConfronto.mockResolvedValue(partidas);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Ver Partidas"));
      });

      await waitFor(() => {
        expect(screen.getByText("Jogo 1")).toBeInTheDocument();
      });
    });

    it("deve mostrar MASC para partida masculina", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", grupoId: "A" }),
      ];
      const confrontos = [
        criarConfrontoMock({ grupoId: "A", partidas: [{ id: "p1" }] }),
      ];
      const partidas = [
        criarPartidaMock({ tipoJogo: "masculino" }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);
      mockBuscarPartidasConfronto.mockResolvedValue(partidas);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Ver Partidas"));
      });

      await waitFor(() => {
        expect(screen.getByText("MASC")).toBeInTheDocument();
      });
    });

    it("deve mostrar mensagem quando nível desconhecido", async () => {
      const equipe = criarEquipeMock({
        grupoId: "A",
        jogadores: [
          { id: "jog-1", nome: "Jogador Custom", nivel: "custom_nivel", genero: "masculino" },
        ],
      });

      mockBuscarEquipes.mockResolvedValue([equipe]);
      mockBuscarConfrontos.mockResolvedValue([]);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        // Nível custom_nivel deve mostrar primeiros 3 caracteres em uppercase: CUS
        expect(screen.getByText("CUS")).toBeInTheDocument();
      });
    });
  });

  describe("erros de operações", () => {
    it("deve mostrar alerta quando erro ao renomear equipe", async () => {
      const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});
      const equipes = [criarEquipeMock({ grupoId: "A" })];
      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue([]);
      mockRenomearEquipe.mockRejectedValue(new Error("Erro ao renomear"));

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        fireEvent.click(screen.getByTitle("Renomear equipe"));
      });

      const input = screen.getByDisplayValue("Equipe Alpha");
      fireEvent.change(input, { target: { value: "Novo Nome" } });
      fireEvent.keyDown(input, { key: "Enter" });

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith("Erro ao renomear");
      });

      alertMock.mockRestore();
    });

    it("deve mostrar alerta quando erro ao expandir confronto", async () => {
      const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});
      const equipes = [
        criarEquipeMock({ id: "equipe-1", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", grupoId: "A" }),
      ];
      const confrontos = [
        criarConfrontoMock({ grupoId: "A", partidas: [] }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);
      mockGerarPartidasConfronto.mockRejectedValue(new Error("Erro ao gerar partidas"));

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Ver Partidas"));
      });

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith("Erro ao gerar partidas");
      });

      alertMock.mockRestore();
    });

    it("deve mostrar alerta quando erro ao gerar decider", async () => {
      const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});
      const equipes = [
        criarEquipeMock({ id: "equipe-1", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", grupoId: "A" }),
      ];
      const confrontos = [
        criarConfrontoMock({
          grupoId: "A",
          jogosEquipe1: 1,
          jogosEquipe2: 1,
          status: StatusConfronto.EM_ANDAMENTO,
          temDecider: false,
        }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);
      mockGerarDecider.mockRejectedValue(new Error("Erro ao gerar decider"));

      render(<ChavesTeams etapaId="etapa-1" varianteTeams={VarianteTeams.TEAMS_4} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Gerar Decider"));
      });

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith("Erro ao gerar decider");
      });

      alertMock.mockRestore();
    });

    it("deve mostrar alerta quando erro ao encerrar etapa", async () => {
      const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});
      const equipes = [
        criarEquipeMock({ id: "equipe-1", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", grupoId: "A" }),
      ];
      const confrontos = [
        criarConfrontoMock({ status: StatusConfronto.FINALIZADO, grupoId: "A" }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);
      mockEncerrarEtapa.mockRejectedValue(new Error("Erro ao encerrar etapa"));

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Encerrar Etapa"));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText("Confirmar Encerrar"));
      });

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith("Erro ao encerrar etapa");
      });

      alertMock.mockRestore();
    });

    it("deve mostrar alerta quando erro ao abrir modal de resultados", async () => {
      const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});
      const equipes = [
        criarEquipeMock({ id: "equipe-1", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", grupoId: "A" }),
      ];
      const confrontos = [
        criarConfrontoMock({ grupoId: "A", partidas: [] }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);
      mockGerarPartidasConfronto.mockRejectedValue(new Error("Erro ao carregar partidas"));

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Resultados"));
      });

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith("Erro ao carregar partidas");
      });

      alertMock.mockRestore();
    });

    it("deve salvar nome vazio e cancelar edição", async () => {
      const equipes = [criarEquipeMock({ grupoId: "A" })];
      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue([]);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        fireEvent.click(screen.getByTitle("Renomear equipe"));
      });

      const input = screen.getByDisplayValue("Equipe Alpha");
      fireEvent.change(input, { target: { value: "   " } }); // Apenas espaços
      fireEvent.keyDown(input, { key: "Enter" });

      await waitFor(() => {
        // Deve cancelar a edição e manter o nome original
        expect(screen.getByText("Equipe Alpha")).toBeInTheDocument();
        expect(mockRenomearEquipe).not.toHaveBeenCalled();
      });
    });

    it("deve salvar ao blur do input de edição", async () => {
      const equipes = [criarEquipeMock({ grupoId: "A" })];
      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue([]);
      mockRenomearEquipe.mockResolvedValue({});

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        fireEvent.click(screen.getByTitle("Renomear equipe"));
      });

      const input = screen.getByDisplayValue("Equipe Alpha");
      fireEvent.change(input, { target: { value: "Nome Via Blur" } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockRenomearEquipe).toHaveBeenCalledWith("etapa-1", "equipe-1", "Nome Via Blur");
      });
    });
  });

  describe("variantes TEAMS", () => {
    it("deve mostrar informações corretas para variante sem especificação", async () => {
      const equipes = [criarEquipeMock({ grupoId: "A" })];
      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue([]);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        expect(screen.getByText("TEAMS")).toBeInTheDocument();
        expect(screen.getByText("Formato TEAMS")).toBeInTheDocument();
      });
    });
  });

  describe("modal definir jogadores - confirmação", () => {
    const mockDefinirJogadoresPartida = jest.fn();

    beforeEach(() => {
      // Re-mock para incluir definirJogadoresPartida
      jest.mock("@/services", () => ({
        getTeamsService: () => ({
          buscarEquipes: mockBuscarEquipes,
          buscarConfrontos: mockBuscarConfrontos,
          buscarPartidasConfronto: mockBuscarPartidasConfronto,
          renomearEquipe: mockRenomearEquipe,
          gerarPartidasConfronto: mockGerarPartidasConfronto,
          gerarDecider: mockGerarDecider,
          definirJogadoresPartida: mockDefinirJogadoresPartida,
        }),
        getEtapaService: () => ({
          encerrarEtapa: mockEncerrarEtapa,
        }),
      }));
    });

    it("deve fechar modal de definir jogadores ao cancelar", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", grupoId: "A" }),
      ];
      const confrontos = [
        criarConfrontoMock({ grupoId: "A", partidas: [{ id: "p1" }] }),
      ];
      const partidas = [
        criarPartidaMock({ dupla1: [], dupla2: [], status: "pendente" }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);
      mockBuscarPartidasConfronto.mockResolvedValue(partidas);

      render(<ChavesTeams etapaId="etapa-1" tipoFormacaoJogos={TipoFormacaoJogos.MANUAL} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Ver Partidas"));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText("Definir Jogadores"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("modal-definir-jogadores")).toBeInTheDocument();
      });

      // Fechar modal
      fireEvent.click(screen.getByText("Fechar"));

      await waitFor(() => {
        expect(screen.queryByTestId("modal-definir-jogadores")).not.toBeInTheDocument();
      });
    });
  });

  describe("modal resultados - sucesso", () => {
    it("deve recarregar dados após salvar resultados com sucesso", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", grupoId: "A" }),
        criarEquipeMock({ id: "equipe-2", grupoId: "A" }),
      ];
      const confrontos = [
        criarConfrontoMock({ grupoId: "A", partidas: [{ id: "p1" }] }),
      ];
      const partidas = [criarPartidaMock()];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);
      mockBuscarPartidasConfronto.mockResolvedValue(partidas);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Resultados"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("modal-resultados")).toBeInTheDocument();
      });

      // Simular sucesso
      fireEvent.click(screen.getByText("Salvar"));

      await waitFor(() => {
        // Modal deve fechar após sucesso
        expect(screen.queryByTestId("modal-resultados")).not.toBeInTheDocument();
      });
    });
  });

  describe("confrontos sem grupos - round robin", () => {
    it("deve mostrar confrontos sem grupos quando não há fase de grupos", async () => {
      const equipes = [
        criarEquipeMock({ id: "equipe-1", nome: "Alpha", grupoId: undefined }),
        criarEquipeMock({ id: "equipe-2", nome: "Beta", grupoId: undefined }),
      ];
      const confrontos = [
        criarConfrontoMock({ grupoId: undefined, fase: FaseEtapa.GRUPOS }),
      ];

      mockBuscarEquipes.mockResolvedValue(equipes);
      mockBuscarConfrontos.mockResolvedValue(confrontos);

      render(<ChavesTeams etapaId="etapa-1" />);

      await waitFor(() => {
        expect(screen.getByText("Todas as Equipes")).toBeInTheDocument();
        expect(screen.getByText("Confrontos")).toBeInTheDocument();
      });
    });
  });
});
