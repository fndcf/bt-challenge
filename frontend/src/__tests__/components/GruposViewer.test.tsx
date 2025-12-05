/**
 * Testes do componente GruposViewer
 */

import { render, screen, fireEvent } from "@testing-library/react";
import GruposViewer from "@/components/visualizadores/GruposViewer/GruposViewer";

const mockGruposDuplaFixa = [
  {
    id: "grupo-1",
    nome: "Grupo A",
    ordem: 1,
    completo: false,
    formato: "dupla_fixa" as const,
    duplas: [
      {
        id: "dupla-1",
        jogador1Nome: "João",
        jogador2Nome: "Maria",
        posicaoGrupo: 1,
        vitorias: 2,
        derrotas: 0,
        pontos: 6,
        saldoGames: 4,
        jogos: 2,
        classificada: true,
      },
      {
        id: "dupla-2",
        jogador1Nome: "Pedro",
        jogador2Nome: "Ana",
        posicaoGrupo: 2,
        vitorias: 1,
        derrotas: 1,
        pontos: 3,
        saldoGames: 0,
        jogos: 2,
        classificada: true,
      },
      {
        id: "dupla-3",
        jogador1Nome: "Carlos",
        jogador2Nome: "Lucia",
        posicaoGrupo: 3,
        vitorias: 0,
        derrotas: 2,
        pontos: 0,
        saldoGames: -4,
        jogos: 2,
        classificada: false,
      },
    ],
    partidas: [
      {
        id: "partida-1",
        dupla1Nome: "João & Maria",
        dupla2Nome: "Pedro & Ana",
        status: "FINALIZADA",
        setsDupla1: 2,
        setsDupla2: 1,
        vencedoraNome: "João & Maria",
        placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
      },
      {
        id: "partida-2",
        dupla1Nome: "João & Maria",
        dupla2Nome: "Carlos & Lucia",
        status: "FINALIZADA",
        setsDupla1: 2,
        setsDupla2: 0,
        vencedoraNome: "João & Maria",
        placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 2 }],
      },
      {
        id: "partida-3",
        dupla1Nome: "Pedro & Ana",
        dupla2Nome: "Carlos & Lucia",
        status: "AGENDADA",
        setsDupla1: 0,
        setsDupla2: 0,
      },
    ],
  },
];

const mockGruposReiDaPraia = [
  {
    id: "grupo-1",
    nome: "Grupo A",
    ordem: 1,
    completo: false,
    formato: "rei_da_praia" as const,
    jogadores: [
      {
        id: "j1",
        jogadorId: "jogador-1",
        jogadorNome: "Fernando",
        posicaoGrupo: 1,
        jogosGrupo: 3,
        vitoriasGrupo: 3,
        derrotasGrupo: 0,
        pontosGrupo: 9,
        saldoGamesGrupo: 12,
        gamesVencidosGrupo: 18,
        gamesPerdidosGrupo: 6,
        classificado: true,
      },
      {
        id: "j2",
        jogadorId: "jogador-2",
        jogadorNome: "Ricardo",
        posicaoGrupo: 2,
        jogosGrupo: 3,
        vitoriasGrupo: 2,
        derrotasGrupo: 1,
        pontosGrupo: 6,
        saldoGamesGrupo: 4,
        gamesVencidosGrupo: 15,
        gamesPerdidosGrupo: 11,
        classificado: true,
      },
      {
        id: "j3",
        jogadorId: "jogador-3",
        jogadorNome: "Lucas",
        posicaoGrupo: 3,
        jogosGrupo: 3,
        vitoriasGrupo: 0,
        derrotasGrupo: 3,
        pontosGrupo: 0,
        saldoGamesGrupo: -6,
        gamesVencidosGrupo: 8,
        gamesPerdidosGrupo: 14,
        classificado: false,
      },
    ],
    partidas: [
      {
        id: "partida-1",
        dupla1Nome: "Fernando",
        dupla2Nome: "Ricardo",
        status: "FINALIZADA",
        setsDupla1: 2,
        setsDupla2: 1,
        vencedoresNomes: "Fernando",
        placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
      },
    ],
  },
];

const mockMultiplosGrupos = [
  ...mockGruposDuplaFixa,
  {
    id: "grupo-2",
    nome: "Grupo B",
    ordem: 2,
    completo: true,
    formato: "dupla_fixa" as const,
    duplas: [
      {
        id: "dupla-4",
        jogador1Nome: "Bruno",
        jogador2Nome: "Carla",
        posicaoGrupo: 1,
        vitorias: 2,
        derrotas: 0,
        pontos: 6,
        saldoGames: 5,
        jogos: 2,
        classificada: true,
      },
    ],
    partidas: [
      {
        id: "partida-4",
        dupla1Nome: "Bruno & Carla",
        dupla2Nome: "Time X",
        status: "FINALIZADA",
        setsDupla1: 2,
        setsDupla2: 0,
        vencedoraNome: "Bruno & Carla",
        placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 1 }],
      },
    ],
  },
];

describe("GruposViewer", () => {
  describe("estado vazio", () => {
    it("deve mostrar mensagem quando não há grupos", () => {
      render(<GruposViewer grupos={[]} />);

      expect(screen.getByText("Fase de Grupos")).toBeInTheDocument();
      expect(screen.getByText("Grupos ainda não formados")).toBeInTheDocument();
    });

    it("deve mostrar mensagem quando grupos é undefined", () => {
      // @ts-expect-error - testando caso de dados inválidos
      render(<GruposViewer grupos={undefined} />);

      expect(screen.getByText("Grupos ainda não formados")).toBeInTheDocument();
    });
  });

  describe("formato Dupla Fixa", () => {
    it("deve mostrar título com badge Dupla Fixa", () => {
      render(<GruposViewer grupos={mockGruposDuplaFixa} />);

      expect(screen.getByText("Fase de Grupos")).toBeInTheDocument();
      expect(screen.getByText("Dupla Fixa")).toBeInTheDocument();
    });

    it("deve mostrar nome do grupo", () => {
      render(<GruposViewer grupos={mockGruposDuplaFixa} />);

      expect(screen.getByText("Grupo A")).toBeInTheDocument();
    });

    it("deve mostrar classificação de duplas", () => {
      render(<GruposViewer grupos={mockGruposDuplaFixa} />);

      expect(screen.getByText("Classificação")).toBeInTheDocument();
      // Os nomes aparecem tanto na tabela quanto nas partidas
      expect(screen.getAllByText("João & Maria").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Pedro & Ana").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Carlos & Lucia").length).toBeGreaterThan(0);
    });

    it("deve mostrar estatísticas das duplas", () => {
      render(<GruposViewer grupos={mockGruposDuplaFixa} />);

      // Verificar cabeçalhos da tabela
      expect(screen.getByText("Dupla")).toBeInTheDocument();
      expect(screen.getAllByText("J").length).toBeGreaterThan(0);
      expect(screen.getAllByText("V").length).toBeGreaterThan(0);
      expect(screen.getAllByText("D").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Pts").length).toBeGreaterThan(0);
      expect(screen.getAllByText("SG").length).toBeGreaterThan(0);
    });

    it("deve mostrar saldo de games positivo e negativo", () => {
      render(<GruposViewer grupos={mockGruposDuplaFixa} />);

      expect(screen.getByText("+4")).toBeInTheDocument();
      expect(screen.getByText("-4")).toBeInTheDocument();
    });

    it("deve mostrar partidas do grupo", () => {
      render(<GruposViewer grupos={mockGruposDuplaFixa} />);

      expect(screen.getByText("Partidas")).toBeInTheDocument();
    });
  });

  describe("formato Rei da Praia", () => {
    it("deve mostrar título com badge Rei da Praia", () => {
      render(<GruposViewer grupos={mockGruposReiDaPraia} />);

      expect(screen.getByText("Rei da Praia")).toBeInTheDocument();
    });

    it("deve mostrar nome do jogador individual", () => {
      render(<GruposViewer grupos={mockGruposReiDaPraia} />);

      expect(screen.getAllByText("Fernando").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Ricardo").length).toBeGreaterThan(0);
      expect(screen.getByText("Lucas")).toBeInTheDocument();
    });

    it("deve mostrar estatísticas do jogador", () => {
      render(<GruposViewer grupos={mockGruposReiDaPraia} />);

      expect(screen.getByText("Jogador")).toBeInTheDocument();
      expect(screen.getByText("+12")).toBeInTheDocument();
    });
  });

  describe("toggle expandir/recolher", () => {
    it("deve mostrar botão de recolher quando expandido", () => {
      render(<GruposViewer grupos={mockGruposDuplaFixa} />);

      expect(screen.getByText("▲ Recolher")).toBeInTheDocument();
    });

    it("deve recolher ao clicar no botão", () => {
      render(<GruposViewer grupos={mockGruposDuplaFixa} />);

      fireEvent.click(screen.getByText("▲ Recolher"));

      expect(screen.getByText("▼ Expandir")).toBeInTheDocument();
    });

    it("deve mostrar resumo quando recolhido", () => {
      render(<GruposViewer grupos={mockGruposDuplaFixa} />);

      fireEvent.click(screen.getByText("▲ Recolher"));

      expect(screen.getByText("Grupos")).toBeInTheDocument();
      expect(screen.getByText("Partidas")).toBeInTheDocument();
      expect(screen.getByText("Finalizadas")).toBeInTheDocument();
      expect(screen.getByText("Progresso")).toBeInTheDocument();
    });

    it("deve expandir novamente ao clicar", () => {
      render(<GruposViewer grupos={mockGruposDuplaFixa} />);

      fireEvent.click(screen.getByText("▲ Recolher"));
      fireEvent.click(screen.getByText("▼ Expandir"));

      expect(screen.getByText("▲ Recolher")).toBeInTheDocument();
      expect(screen.getByText("Classificação")).toBeInTheDocument();
    });
  });

  describe("estatísticas resumidas", () => {
    it("deve mostrar total de grupos quando recolhido", () => {
      render(<GruposViewer grupos={mockMultiplosGrupos} />);

      fireEvent.click(screen.getByText("▲ Recolher"));

      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("deve mostrar total de partidas quando recolhido", () => {
      render(<GruposViewer grupos={mockMultiplosGrupos} />);

      fireEvent.click(screen.getByText("▲ Recolher"));

      // 3 partidas no grupo A + 1 partida no grupo B = 4
      expect(screen.getByText("4")).toBeInTheDocument();
    });

    it("deve mostrar progresso corretamente", () => {
      render(<GruposViewer grupos={mockMultiplosGrupos} />);

      fireEvent.click(screen.getByText("▲ Recolher"));

      // 3 finalizadas de 4 = 75%
      expect(screen.getByText("75%")).toBeInTheDocument();
    });
  });

  describe("status das partidas", () => {
    it("deve mostrar status Finalizada", () => {
      render(<GruposViewer grupos={mockGruposDuplaFixa} />);

      expect(screen.getAllByText("Finalizada").length).toBeGreaterThan(0);
    });

    it("deve mostrar status Agendada", () => {
      render(<GruposViewer grupos={mockGruposDuplaFixa} />);

      expect(screen.getByText("Agendada")).toBeInTheDocument();
    });

    it("deve mostrar VS entre duplas", () => {
      render(<GruposViewer grupos={mockGruposDuplaFixa} />);

      expect(screen.getAllByText("VS").length).toBeGreaterThan(0);
    });
  });

  describe("múltiplos grupos", () => {
    it("deve renderizar todos os grupos", () => {
      render(<GruposViewer grupos={mockMultiplosGrupos} />);

      expect(screen.getByText("Grupo A")).toBeInTheDocument();
      expect(screen.getByText("Grupo B")).toBeInTheDocument();
    });
  });

  describe("placar das partidas", () => {
    it("deve mostrar placar quando partida finalizada", () => {
      render(<GruposViewer grupos={mockGruposDuplaFixa} />);

      // Partida 1: 6-4
      expect(screen.getAllByText("6").length).toBeGreaterThan(0);
      expect(screen.getAllByText("4").length).toBeGreaterThan(0);
    });
  });

  describe("classificação", () => {
    it("deve mostrar posição no grupo", () => {
      render(<GruposViewer grupos={mockGruposDuplaFixa} />);

      // Posições 1, 2, 3
      expect(screen.getAllByText("1").length).toBeGreaterThan(0);
      expect(screen.getAllByText("2").length).toBeGreaterThan(0);
      expect(screen.getAllByText("3").length).toBeGreaterThan(0);
    });
  });
});
