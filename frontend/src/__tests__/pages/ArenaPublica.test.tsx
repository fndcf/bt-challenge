/**
 * Testes de renderização da página ArenaPublica
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useArenaPublica } from "@/hooks/useArenaPublica";
import ArenaPublica from "@/pages/ArenaPublica";

// Mock do logger
jest.mock("@/utils/logger", () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock do useDocumentTitle
jest.mock("@/hooks", () => ({
  useDocumentTitle: jest.fn(),
}));

// Mock do useArenaPublica para testes de componente
jest.mock("@/hooks/useArenaPublica", () => ({
  useArenaPublica: jest.fn(),
}));

// Mock do react-router-dom
const mockSlug = "arena-teste";
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({ slug: mockSlug }),
}));

// Mock dos componentes filhos
jest.mock("@/components/arena/EtapaCardList", () => ({
  EtapaCardList: ({ etapas }: { etapas: any[] }) => (
    <div data-testid="etapa-card-list">
      {etapas.map((e: any) => (
        <div key={e.id} data-testid={`etapa-${e.id}`}>
          {e.nome}
        </div>
      ))}
    </div>
  ),
}));

jest.mock("@/components/jogadores/RankingList", () => ({
  RankingList: () => <div data-testid="ranking-list">Ranking</div>,
}));

jest.mock("@/components/layout/Footer", () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

const mockArena = {
  id: "arena-1",
  nome: "Arena Beach Tennis",
  slug: "arena-beach",
  descricao: "A melhor arena de beach tennis",
};

const mockEtapas = [
  {
    id: "etapa-1",
    nome: "Etapa 1",
    formato: "DUPLA_FIXA",
    status: "ABERTA",
    dataRealizacao: "2025-01-15",
    maxJogadores: 16,
    totalInscritos: 8,
  },
  {
    id: "etapa-2",
    nome: "Etapa 2",
    formato: "REI_DA_PRAIA",
    status: "FINALIZADA",
    dataRealizacao: "2025-01-10",
    maxJogadores: 24,
    totalInscritos: 24,
  },
];

// ============================================
// TESTES DE RENDERIZAÇÃO DO COMPONENTE
// ============================================

const renderWithRouter = (component: React.ReactElement) => {
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

describe("ArenaPublica - Renderização", () => {
  const mockUseArenaPublica = useArenaPublica as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Estado de loading", () => {
    it("deve renderizar spinner durante carregamento", () => {
      mockUseArenaPublica.mockReturnValue({
        arena: null,
        etapas: [],
        loading: true,
        error: "",
      });

      renderWithRouter(<ArenaPublica />);

      expect(screen.getByText("Carregando arena...")).toBeInTheDocument();
    });
  });

  describe("Estado de erro", () => {
    it("deve renderizar mensagem de erro quando arena não encontrada", () => {
      mockUseArenaPublica.mockReturnValue({
        arena: null,
        etapas: [],
        loading: false,
        error: "Arena não encontrada",
      });

      renderWithRouter(<ArenaPublica />);

      expect(screen.getByText("Arena Não Encontrada")).toBeInTheDocument();
      expect(screen.getByText("Arena não encontrada")).toBeInTheDocument();
    });

    it("deve renderizar botão para voltar ao início quando erro", () => {
      mockUseArenaPublica.mockReturnValue({
        arena: null,
        etapas: [],
        loading: false,
        error: "Erro genérico",
      });

      renderWithRouter(<ArenaPublica />);

      expect(screen.getByText("Voltar para o Início")).toBeInTheDocument();
    });

    it("deve renderizar mensagem padrão quando arena é null sem erro", () => {
      mockUseArenaPublica.mockReturnValue({
        arena: null,
        etapas: [],
        loading: false,
        error: "",
      });

      renderWithRouter(<ArenaPublica />);

      expect(
        screen.getByText("A arena que você está procurando não existe.")
      ).toBeInTheDocument();
    });
  });

  describe("Renderização com sucesso", () => {
    const mockArenaData = {
      id: "arena-1",
      nome: "Arena Beach Tennis",
      slug: "arena-beach",
    };

    const mockEtapasData = [
      { id: "etapa-1", nome: "Etapa 1" },
      { id: "etapa-2", nome: "Etapa 2" },
    ];

    beforeEach(() => {
      mockUseArenaPublica.mockReturnValue({
        arena: mockArenaData,
        etapas: mockEtapasData,
        loading: false,
        error: "",
      });
    });

    it("deve renderizar nome da arena no header", () => {
      renderWithRouter(<ArenaPublica />);

      expect(screen.getByRole("heading", { name: "Arena Beach Tennis" })).toBeInTheDocument();
    });

    it("deve renderizar subtítulo do header", () => {
      renderWithRouter(<ArenaPublica />);

      expect(screen.getByText("Torneios e Desafios de Beach Tennis")).toBeInTheDocument();
    });

    it("deve renderizar botão de login admin", () => {
      renderWithRouter(<ArenaPublica />);

      expect(screen.getByText("Área do Admin")).toBeInTheDocument();
    });

    it("deve renderizar card de boas-vindas", () => {
      renderWithRouter(<ArenaPublica />);

      expect(screen.getByText("Bem-vindo à Arena Beach Tennis!")).toBeInTheDocument();
    });

    it("deve renderizar seção de etapas", () => {
      renderWithRouter(<ArenaPublica />);

      expect(screen.getByText("Etapas e Torneios")).toBeInTheDocument();
      expect(screen.getByTestId("etapa-card-list")).toBeInTheDocument();
    });

    it("deve renderizar seção de ranking", () => {
      renderWithRouter(<ArenaPublica />);

      expect(screen.getByText("Ranking Completo")).toBeInTheDocument();
      expect(screen.getByTestId("ranking-list")).toBeInTheDocument();
    });

    it("deve renderizar footer", () => {
      renderWithRouter(<ArenaPublica />);

      expect(screen.getByTestId("footer")).toBeInTheDocument();
    });

    it("deve renderizar lista de etapas corretamente", () => {
      renderWithRouter(<ArenaPublica />);

      expect(screen.getByTestId("etapa-etapa-1")).toBeInTheDocument();
      expect(screen.getByTestId("etapa-etapa-2")).toBeInTheDocument();
      expect(screen.getByText("Etapa 1")).toBeInTheDocument();
      expect(screen.getByText("Etapa 2")).toBeInTheDocument();
    });
  });

  describe("Arena sem etapas", () => {
    it("deve renderizar lista vazia de etapas", () => {
      mockUseArenaPublica.mockReturnValue({
        arena: { id: "1", nome: "Arena Vazia", slug: "arena-vazia" },
        etapas: [],
        loading: false,
        error: "",
      });

      renderWithRouter(<ArenaPublica />);

      expect(screen.getByTestId("etapa-card-list")).toBeInTheDocument();
      expect(screen.getByText("Bem-vindo à Arena Vazia!")).toBeInTheDocument();
    });
  });
});
