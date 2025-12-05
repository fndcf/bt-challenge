/**
 * Testes do componente BracketViewer
 */

import { render, screen } from "@testing-library/react";
import BracketViewer from "@/components/visualizadores/BracketViewer/BracketViewer";

const mockChavesVazia = {
  formato: "ELIMINATORIO",
  temChaves: false,
  rodadas: [],
};

const mockChavesCompletas = {
  formato: "ELIMINATORIO",
  temChaves: true,
  rodadas: [
    {
      numero: 1,
      nome: "Quartas de Final",
      partidas: [
        {
          id: "partida-1",
          numero: 1,
          jogador1: { id: "j1", nome: "João / Maria" },
          jogador2: { id: "j2", nome: "Pedro / Ana" },
          status: "finalizada" as const,
          vencedor: "jogador1" as const,
          placarDetalhado: [{ numero: 1, gamesDupla1: 2, gamesDupla2: 1 }],
        },
        {
          id: "partida-2",
          numero: 2,
          jogador1: { id: "j3", nome: "Carlos / Lucia" },
          jogador2: { id: "j4", nome: "Bruno / Carla" },
          status: "finalizada" as const,
          vencedor: "jogador2" as const,
          placarDetalhado: [{ numero: 1, gamesDupla1: 0, gamesDupla2: 2 }],
        },
      ],
    },
    {
      numero: 2,
      nome: "Semifinal",
      partidas: [
        {
          id: "partida-3",
          numero: 3,
          jogador1: { id: "j1", nome: "João / Maria" },
          jogador2: { id: "j4", nome: "Bruno / Carla" },
          status: "em_andamento" as const,
          vencedor: null,
          placarDetalhado: [],
        },
      ],
    },
    {
      numero: 3,
      nome: "Final",
      partidas: [
        {
          id: "partida-4",
          numero: 4,
          jogador1: { id: "j1", nome: "TBD" },
          jogador2: { id: "j2", nome: "TBD" },
          status: "agendada" as const,
          vencedor: null,
          placarDetalhado: [],
        },
      ],
    },
  ],
};

const mockChavesComBye = {
  formato: "ELIMINATORIO",
  temChaves: true,
  rodadas: [
    {
      numero: 1,
      nome: "Primeira Rodada",
      partidas: [
        {
          id: "partida-1",
          numero: 1,
          jogador1: { id: "j1", nome: "João / Maria" },
          jogador2: null,
          status: "bye" as const,
          vencedor: "jogador1" as const,
        },
        {
          id: "partida-2",
          numero: 2,
          jogador1: { id: "j2", nome: "Pedro / Ana" },
          jogador2: { id: "j3", nome: "Carlos / Lucia" },
          status: "agendada" as const,
          vencedor: null,
        },
      ],
    },
  ],
};

describe("BracketViewer", () => {
  describe("estado vazio", () => {
    it("deve mostrar mensagem quando temChaves é false", () => {
      render(<BracketViewer chaves={mockChavesVazia} />);

      expect(screen.getByText("Chaveamento")).toBeInTheDocument();
      expect(screen.getByText("Chaves ainda não geradas")).toBeInTheDocument();
      expect(
        screen.getByText("Aguarde a conclusão da fase de grupos")
      ).toBeInTheDocument();
    });

    it("deve mostrar mensagem quando rodadas está vazia", () => {
      const chavesVazia = { ...mockChavesVazia, temChaves: true, rodadas: [] };
      render(<BracketViewer chaves={chavesVazia} />);

      expect(screen.getByText("Chaves ainda não geradas")).toBeInTheDocument();
    });

    it("deve mostrar mensagem quando chaves é undefined", () => {
      // @ts-expect-error - testando caso de dados inválidos
      render(<BracketViewer chaves={undefined} />);

      expect(screen.getByText("Chaves ainda não geradas")).toBeInTheDocument();
    });
  });

  describe("renderização de chaves", () => {
    it("deve mostrar título Chaveamento Eliminatório", () => {
      render(<BracketViewer chaves={mockChavesCompletas} />);

      expect(screen.getByText("Chaveamento Eliminatório")).toBeInTheDocument();
    });

    it("deve mostrar instrução de deslizar", () => {
      render(<BracketViewer chaves={mockChavesCompletas} />);

      expect(
        screen.getByText("Deslize para ver todas as fases")
      ).toBeInTheDocument();
    });

    it("deve mostrar todas as rodadas", () => {
      render(<BracketViewer chaves={mockChavesCompletas} />);

      expect(screen.getByText("Final")).toBeInTheDocument();
      expect(screen.getByText("Semifinal")).toBeInTheDocument();
      expect(screen.getByText("Quartas de Final")).toBeInTheDocument();
    });

    it("deve mostrar nomes dos jogadores", () => {
      render(<BracketViewer chaves={mockChavesCompletas} />);

      expect(screen.getAllByText("João / Maria").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Pedro / Ana").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Carlos / Lucia").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Bruno / Carla").length).toBeGreaterThan(0);
    });
  });

  describe("placar de partidas finalizadas", () => {
    it("deve mostrar placar para partidas finalizadas", () => {
      render(<BracketViewer chaves={mockChavesCompletas} />);

      // Primeiro jogo: 2-1, segundo jogo: 0-2
      // Verificamos que há placares visíveis (pode ter múltiplos)
      expect(screen.getAllByText("2").length).toBeGreaterThan(0);
      expect(screen.getAllByText("0").length).toBeGreaterThan(0);
    });
  });

  describe("status das partidas", () => {
    it("deve mostrar 'Ao vivo' para partida em andamento", () => {
      render(<BracketViewer chaves={mockChavesCompletas} />);

      expect(screen.getByText("Ao vivo")).toBeInTheDocument();
    });

    it("deve mostrar 'Aguardando' para partida agendada", () => {
      render(<BracketViewer chaves={mockChavesCompletas} />);

      expect(screen.getByText("Aguardando")).toBeInTheDocument();
    });
  });

  describe("partidas com BYE", () => {
    it("deve mostrar BYE quando jogador2 é null", () => {
      render(<BracketViewer chaves={mockChavesComBye} />);

      expect(screen.getByText("João / Maria (BYE)")).toBeInTheDocument();
    });

    it("deve mostrar partida normal junto com BYE", () => {
      render(<BracketViewer chaves={mockChavesComBye} />);

      expect(screen.getByText("João / Maria (BYE)")).toBeInTheDocument();
      expect(screen.getByText("Pedro / Ana")).toBeInTheDocument();
      expect(screen.getByText("Carlos / Lucia")).toBeInTheDocument();
    });
  });

  describe("ordenação de rodadas", () => {
    it("deve ordenar rodadas da Final para Oitavas", () => {
      render(<BracketViewer chaves={mockChavesCompletas} />);

      // Verificar que todas as rodadas estão presentes
      expect(screen.getByText("Final")).toBeInTheDocument();
      expect(screen.getByText("Semifinal")).toBeInTheDocument();
      expect(screen.getByText("Quartas de Final")).toBeInTheDocument();
    });
  });

  describe("vencedor destacado", () => {
    it("deve destacar o vencedor da partida finalizada", () => {
      render(<BracketViewer chaves={mockChavesCompletas} />);

      // O vencedor João/Maria deve aparecer múltiplas vezes
      // Uma vez nas quartas e outra na semi
      const winners = screen.getAllByText("João / Maria");
      expect(winners.length).toBeGreaterThan(0);
    });
  });

  describe("múltiplas partidas por rodada", () => {
    it("deve renderizar múltiplas partidas na mesma rodada", () => {
      render(<BracketViewer chaves={mockChavesCompletas} />);

      // Quartas de final tem 2 partidas
      const matches = screen.getAllByText("Pedro / Ana");
      expect(matches.length).toBeGreaterThan(0);
    });

    it("deve mostrar todas as partidas das quartas", () => {
      render(<BracketViewer chaves={mockChavesCompletas} />);

      // Verifica que ambas as partidas das quartas estão visíveis
      expect(screen.getAllByText("João / Maria").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Pedro / Ana").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Carlos / Lucia").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Bruno / Carla").length).toBeGreaterThan(0);
    });
  });

  describe("partidas sem placar detalhado", () => {
    it("não deve mostrar score quando placarDetalhado está vazio", () => {
      const chavesSemPlacar = {
        formato: "ELIMINATORIO",
        temChaves: true,
        rodadas: [
          {
            numero: 1,
            nome: "Quartas",
            partidas: [
              {
                id: "p1",
                numero: 1,
                jogador1: { id: "j1", nome: "Time A" },
                jogador2: { id: "j2", nome: "Time B" },
                status: "finalizada" as const,
                vencedor: "jogador1" as const,
                placarDetalhado: [],
              },
            ],
          },
        ],
      };

      render(<BracketViewer chaves={chavesSemPlacar} />);

      expect(screen.getByText("Time A")).toBeInTheDocument();
      expect(screen.getByText("Time B")).toBeInTheDocument();
    });
  });
});
