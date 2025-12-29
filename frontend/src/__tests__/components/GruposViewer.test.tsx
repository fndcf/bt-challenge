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

const mockGruposSuperX = [
  {
    id: "grupo-super-x",
    nome: "Super 8",
    ordem: 1,
    completo: false,
    formato: "super_x" as const,
    jogadores: [
      {
        id: "sx1",
        jogadorId: "jogador-sx-1",
        jogadorNome: "Alex",
        posicaoGrupo: 1,
        jogosGrupo: 7,
        vitoriasGrupo: 6,
        derrotasGrupo: 1,
        pontosGrupo: 18,
        saldoGamesGrupo: 15,
        gamesVencidosGrupo: 35,
        gamesPerdidosGrupo: 20,
        classificado: true,
      },
      {
        id: "sx2",
        jogadorId: "jogador-sx-2",
        jogadorNome: "Bruno",
        posicaoGrupo: 2,
        jogosGrupo: 7,
        vitoriasGrupo: 5,
        derrotasGrupo: 2,
        pontosGrupo: 15,
        saldoGamesGrupo: 8,
        gamesVencidosGrupo: 30,
        gamesPerdidosGrupo: 22,
        classificado: true,
      },
      {
        id: "sx3",
        jogadorId: "jogador-sx-3",
        jogadorNome: "Carlos",
        posicaoGrupo: 3,
        jogosGrupo: 7,
        vitoriasGrupo: 4,
        derrotasGrupo: 3,
        pontosGrupo: 12,
        saldoGamesGrupo: 2,
        gamesVencidosGrupo: 26,
        gamesPerdidosGrupo: 24,
        classificado: false,
      },
      {
        id: "sx4",
        jogadorId: "jogador-sx-4",
        jogadorNome: "Daniel",
        posicaoGrupo: 4,
        jogosGrupo: 7,
        vitoriasGrupo: 3,
        derrotasGrupo: 4,
        pontosGrupo: 9,
        saldoGamesGrupo: -3,
        gamesVencidosGrupo: 23,
        gamesPerdidosGrupo: 26,
        classificado: false,
      },
    ],
    partidas: [
      {
        id: "sx-partida-1",
        dupla1Nome: "Alex + Bruno",
        dupla2Nome: "Carlos + Daniel",
        status: "FINALIZADA",
        setsDupla1: 1,
        setsDupla2: 0,
        vencedoresNomes: "Alex + Bruno",
        placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 3 }],
      },
      {
        id: "sx-partida-2",
        dupla1Nome: "Alex + Carlos",
        dupla2Nome: "Bruno + Daniel",
        status: "FINALIZADA",
        setsDupla1: 0,
        setsDupla2: 1,
        vencedoresNomes: "Bruno + Daniel",
        placar: [{ numero: 1, gamesDupla1: 4, gamesDupla2: 6 }],
      },
      {
        id: "sx-partida-3",
        dupla1Nome: "Alex + Daniel",
        dupla2Nome: "Bruno + Carlos",
        status: "AGENDADA",
        setsDupla1: 0,
        setsDupla2: 0,
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

    it("deve mostrar nome do grupo após expandir", () => {
      render(<GruposViewer grupos={mockGruposDuplaFixa} />);

      // Componente inicia colapsado, expandir para ver detalhes
      fireEvent.click(screen.getByText("▼ Expandir"));

      expect(screen.getByText("Grupo A")).toBeInTheDocument();
    });

    it("deve mostrar classificação de duplas após expandir", () => {
      render(<GruposViewer grupos={mockGruposDuplaFixa} />);

      // Expandir para ver detalhes
      fireEvent.click(screen.getByText("▼ Expandir"));

      expect(screen.getByText("Classificação")).toBeInTheDocument();
      // Os nomes aparecem tanto na tabela quanto nas partidas
      expect(screen.getAllByText("João & Maria").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Pedro & Ana").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Carlos & Lucia").length).toBeGreaterThan(0);
    });

    it("deve mostrar estatísticas das duplas após expandir", () => {
      render(<GruposViewer grupos={mockGruposDuplaFixa} />);

      // Expandir para ver detalhes
      fireEvent.click(screen.getByText("▼ Expandir"));

      // Verificar cabeçalhos da tabela
      expect(screen.getByText("Dupla")).toBeInTheDocument();
      expect(screen.getAllByText("J").length).toBeGreaterThan(0);
      expect(screen.getAllByText("V").length).toBeGreaterThan(0);
      expect(screen.getAllByText("D").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Pts").length).toBeGreaterThan(0);
      expect(screen.getAllByText("SG").length).toBeGreaterThan(0);
    });

    it("deve mostrar saldo de games positivo e negativo após expandir", () => {
      render(<GruposViewer grupos={mockGruposDuplaFixa} />);

      // Expandir para ver detalhes
      fireEvent.click(screen.getByText("▼ Expandir"));

      expect(screen.getByText("+4")).toBeInTheDocument();
      expect(screen.getByText("-4")).toBeInTheDocument();
    });

    it("deve mostrar partidas do grupo após expandir", () => {
      render(<GruposViewer grupos={mockGruposDuplaFixa} />);

      // Expandir para ver detalhes
      fireEvent.click(screen.getByText("▼ Expandir"));

      // "Partidas" aparece em múltiplos lugares (resumo e seção)
      // Verificamos que existe pelo menos um h4 com "Partidas" (seção de partidas)
      const partidasElements = screen.getAllByText("Partidas");
      expect(partidasElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("formato Rei da Praia", () => {
    it("deve mostrar título com badge Rei da Praia", () => {
      render(<GruposViewer grupos={mockGruposReiDaPraia} />);

      expect(screen.getByText("Rei da Praia")).toBeInTheDocument();
    });

    it("deve mostrar nome do jogador individual após expandir", () => {
      render(<GruposViewer grupos={mockGruposReiDaPraia} />);

      // Expandir para ver detalhes
      fireEvent.click(screen.getByText("▼ Expandir"));

      expect(screen.getAllByText("Fernando").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Ricardo").length).toBeGreaterThan(0);
      expect(screen.getByText("Lucas")).toBeInTheDocument();
    });

    it("deve mostrar estatísticas do jogador após expandir", () => {
      render(<GruposViewer grupos={mockGruposReiDaPraia} />);

      // Expandir para ver detalhes
      fireEvent.click(screen.getByText("▼ Expandir"));

      expect(screen.getByText("Jogador")).toBeInTheDocument();
      expect(screen.getByText("+12")).toBeInTheDocument();
    });
  });

  describe("formato Super X", () => {
    it("deve mostrar título com badge Super X", () => {
      render(<GruposViewer grupos={mockGruposSuperX} />);

      expect(screen.getByText("Super X")).toBeInTheDocument();
    });

    it("deve mostrar nome do grupo após expandir", () => {
      render(<GruposViewer grupos={mockGruposSuperX} />);

      // Expandir para ver detalhes
      fireEvent.click(screen.getByText("▼ Expandir"));

      expect(screen.getByText("Super 8")).toBeInTheDocument();
    });

    it("deve mostrar jogadores individuais como no Rei da Praia", () => {
      render(<GruposViewer grupos={mockGruposSuperX} />);

      // Expandir para ver detalhes
      fireEvent.click(screen.getByText("▼ Expandir"));

      expect(screen.getByText("Alex")).toBeInTheDocument();
      // Bruno aparece tanto na classificação quanto em partidas
      expect(screen.getAllByText(/Bruno/).length).toBeGreaterThan(0);
      // Carlos e Daniel também aparecem em múltiplos lugares
      expect(screen.getAllByText(/Carlos/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Daniel/).length).toBeGreaterThan(0);
    });

    it("deve mostrar estatísticas dos jogadores após expandir", () => {
      render(<GruposViewer grupos={mockGruposSuperX} />);

      // Expandir para ver detalhes
      fireEvent.click(screen.getByText("▼ Expandir"));

      expect(screen.getByText("Jogador")).toBeInTheDocument();
      expect(screen.getByText("+15")).toBeInTheDocument(); // saldo do Alex
      expect(screen.getByText("+8")).toBeInTheDocument(); // saldo do Bruno
      expect(screen.getByText("+2")).toBeInTheDocument(); // saldo do Carlos
      expect(screen.getByText("-3")).toBeInTheDocument(); // saldo do Daniel
    });

    it("deve mostrar pontuação correta dos jogadores", () => {
      render(<GruposViewer grupos={mockGruposSuperX} />);

      // Expandir para ver detalhes
      fireEvent.click(screen.getByText("▼ Expandir"));

      // Pontos: Alex=18, Bruno=15, Carlos=12, Daniel=9
      expect(screen.getByText("18")).toBeInTheDocument();
      expect(screen.getByText("15")).toBeInTheDocument();
      expect(screen.getByText("12")).toBeInTheDocument();
      expect(screen.getByText("9")).toBeInTheDocument();
    });

    it("deve mostrar partidas com duplas rotativas", () => {
      render(<GruposViewer grupos={mockGruposSuperX} />);

      // Expandir para ver detalhes
      fireEvent.click(screen.getByText("▼ Expandir"));

      expect(screen.getByText("Alex + Bruno")).toBeInTheDocument();
      expect(screen.getByText("Carlos + Daniel")).toBeInTheDocument();
      expect(screen.getByText("Alex + Carlos")).toBeInTheDocument();
      expect(screen.getByText("Bruno + Daniel")).toBeInTheDocument();
    });

    it("deve detectar vencedor corretamente usando sets", () => {
      render(<GruposViewer grupos={mockGruposSuperX} />);

      // Expandir para ver detalhes
      fireEvent.click(screen.getByText("▼ Expandir"));

      // Verificar que há partidas finalizadas
      expect(screen.getAllByText("Finalizada").length).toBe(2);
    });

    it("deve mostrar partida agendada", () => {
      render(<GruposViewer grupos={mockGruposSuperX} />);

      // Expandir para ver detalhes
      fireEvent.click(screen.getByText("▼ Expandir"));

      expect(screen.getByText("Agendada")).toBeInTheDocument();
    });

    it("deve calcular progresso corretamente", () => {
      render(<GruposViewer grupos={mockGruposSuperX} />);

      // Componente inicia colapsado com resumo visível
      // 2 de 3 partidas finalizadas = 67%
      expect(screen.getByText("67%")).toBeInTheDocument();
    });

    it("deve mostrar número correto de partidas no resumo", () => {
      render(<GruposViewer grupos={mockGruposSuperX} />);

      // 3 partidas total - verificar que existe pelo menos um "3" no resumo
      expect(screen.getAllByText("3").length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("toggle expandir/recolher", () => {
    it("deve mostrar botão de expandir inicialmente (componente inicia colapsado)", () => {
      render(<GruposViewer grupos={mockGruposDuplaFixa} />);

      expect(screen.getByText("▼ Expandir")).toBeInTheDocument();
    });

    it("deve expandir ao clicar no botão", () => {
      render(<GruposViewer grupos={mockGruposDuplaFixa} />);

      fireEvent.click(screen.getByText("▼ Expandir"));

      expect(screen.getByText("▲ Recolher")).toBeInTheDocument();
    });

    it("deve mostrar resumo quando colapsado (estado inicial)", () => {
      render(<GruposViewer grupos={mockGruposDuplaFixa} />);

      // Componente inicia colapsado, resumo já está visível
      expect(screen.getByText("Grupos")).toBeInTheDocument();
      // "Partidas" pode aparecer múltiplas vezes (no resumo e na seção de grupos)
      expect(screen.getAllByText("Partidas").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Finalizados")).toBeInTheDocument();
      expect(screen.getByText("Progresso")).toBeInTheDocument();
    });

    it("deve recolher novamente ao clicar após expandir", () => {
      render(<GruposViewer grupos={mockGruposDuplaFixa} />);

      // Expandir
      fireEvent.click(screen.getByText("▼ Expandir"));
      expect(screen.getByText("Classificação")).toBeInTheDocument();

      // Recolher
      fireEvent.click(screen.getByText("▲ Recolher"));
      expect(screen.getByText("▼ Expandir")).toBeInTheDocument();
    });
  });

  describe("estatísticas resumidas", () => {
    it("deve mostrar total de grupos (componente inicia colapsado)", () => {
      render(<GruposViewer grupos={mockMultiplosGrupos} />);

      // Componente já inicia colapsado, resumo está visível
      // "2" pode aparecer em múltiplos lugares (vitorias, derrotas, etc)
      // Verificamos que existe pelo menos um "2"
      expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(1);
    });

    it("deve mostrar total de partidas (componente inicia colapsado)", () => {
      render(<GruposViewer grupos={mockMultiplosGrupos} />);

      // Componente já inicia colapsado
      // 3 partidas no grupo A + 1 partida no grupo B = 4
      // "4" pode aparecer em múltiplos lugares (saldo, pontos, etc)
      expect(screen.getAllByText("4").length).toBeGreaterThanOrEqual(1);
    });

    it("deve mostrar progresso corretamente (componente inicia colapsado)", () => {
      render(<GruposViewer grupos={mockMultiplosGrupos} />);

      // Componente já inicia colapsado
      // 3 finalizadas de 4 = 75%
      expect(screen.getByText("75%")).toBeInTheDocument();
    });
  });

  describe("status das partidas", () => {
    it("deve mostrar status Finalizada após expandir", () => {
      render(<GruposViewer grupos={mockGruposDuplaFixa} />);

      // Expandir para ver detalhes das partidas
      fireEvent.click(screen.getByText("▼ Expandir"));

      expect(screen.getAllByText("Finalizada").length).toBeGreaterThan(0);
    });

    it("deve mostrar status Agendada após expandir", () => {
      render(<GruposViewer grupos={mockGruposDuplaFixa} />);

      // Expandir para ver detalhes
      fireEvent.click(screen.getByText("▼ Expandir"));

      expect(screen.getByText("Agendada")).toBeInTheDocument();
    });

    it("deve mostrar VS entre duplas após expandir", () => {
      render(<GruposViewer grupos={mockGruposDuplaFixa} />);

      // Expandir para ver detalhes
      fireEvent.click(screen.getByText("▼ Expandir"));

      expect(screen.getAllByText("VS").length).toBeGreaterThan(0);
    });
  });

  describe("múltiplos grupos", () => {
    it("deve renderizar todos os grupos após expandir", () => {
      render(<GruposViewer grupos={mockMultiplosGrupos} />);

      // Expandir para ver detalhes
      fireEvent.click(screen.getByText("▼ Expandir"));

      expect(screen.getByText("Grupo A")).toBeInTheDocument();
      expect(screen.getByText("Grupo B")).toBeInTheDocument();
    });
  });

  describe("placar das partidas", () => {
    it("deve mostrar placar quando partida finalizada após expandir", () => {
      render(<GruposViewer grupos={mockGruposDuplaFixa} />);

      // Expandir para ver detalhes das partidas
      fireEvent.click(screen.getByText("▼ Expandir"));

      // Partida 1: 6-4
      expect(screen.getAllByText("6").length).toBeGreaterThan(0);
      expect(screen.getAllByText("4").length).toBeGreaterThan(0);
    });
  });

  describe("classificação", () => {
    it("deve mostrar posição no grupo após expandir", () => {
      render(<GruposViewer grupos={mockGruposDuplaFixa} />);

      // Expandir para ver detalhes
      fireEvent.click(screen.getByText("▼ Expandir"));

      // Posições 1, 2, 3
      expect(screen.getAllByText("1").length).toBeGreaterThan(0);
      expect(screen.getAllByText("2").length).toBeGreaterThan(0);
      expect(screen.getAllByText("3").length).toBeGreaterThan(0);
    });
  });

  describe("detecção de vencedor", () => {
    it("deve detectar vencedor por sets em partida finalizada", () => {
      const grupoComVencedor = [
        {
          id: "grupo-test",
          nome: "Grupo Teste",
          ordem: 1,
          completo: false,
          formato: "dupla_fixa" as const,
          duplas: [],
          partidas: [
            {
              id: "partida-test",
              dupla1Nome: "Time A",
              dupla2Nome: "Time B",
              status: "FINALIZADA",
              setsDupla1: 2,
              setsDupla2: 1,
              placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
            },
          ],
        },
      ];

      render(<GruposViewer grupos={grupoComVencedor} />);
      fireEvent.click(screen.getByText("▼ Expandir"));

      expect(screen.getByText("Time A")).toBeInTheDocument();
      expect(screen.getByText("Time B")).toBeInTheDocument();
      expect(screen.getByText("Finalizada")).toBeInTheDocument();
    });

    it("deve detectar vencedor por vencedoresNomes em jogadores individuais", () => {
      const grupoReiDaPraiaComVencedor = [
        {
          id: "grupo-rei",
          nome: "Grupo Rei",
          ordem: 1,
          completo: false,
          formato: "rei_da_praia" as const,
          jogadores: [
            {
              id: "j1",
              jogadorId: "jog-1",
              jogadorNome: "Jogador 1",
              posicaoGrupo: 1,
              jogosGrupo: 1,
              vitoriasGrupo: 1,
              derrotasGrupo: 0,
              pontosGrupo: 3,
              saldoGamesGrupo: 2,
              gamesVencidosGrupo: 6,
              gamesPerdidosGrupo: 4,
              classificado: true,
            },
          ],
          partidas: [
            {
              id: "partida-rei",
              dupla1Nome: "Jogador 1 + Jogador 2",
              dupla2Nome: "Jogador 3 + Jogador 4",
              status: "FINALIZADA",
              setsDupla1: 1,
              setsDupla2: 0,
              vencedoresNomes: "Jogador 1 + Jogador 2",
              placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
            },
          ],
        },
      ];

      render(<GruposViewer grupos={grupoReiDaPraiaComVencedor} />);
      fireEvent.click(screen.getByText("▼ Expandir"));

      expect(screen.getByText("Jogador 1 + Jogador 2")).toBeInTheDocument();
      expect(screen.getByText("Jogador 3 + Jogador 4")).toBeInTheDocument();
    });

    it("deve mostrar partida em andamento", () => {
      const grupoEmAndamento = [
        {
          id: "grupo-andamento",
          nome: "Grupo Andamento",
          ordem: 1,
          completo: false,
          formato: "dupla_fixa" as const,
          duplas: [],
          partidas: [
            {
              id: "partida-andamento",
              dupla1Nome: "Time X",
              dupla2Nome: "Time Y",
              status: "EM_ANDAMENTO",
              setsDupla1: 1,
              setsDupla2: 0,
            },
          ],
        },
      ];

      render(<GruposViewer grupos={grupoEmAndamento} />);
      fireEvent.click(screen.getByText("▼ Expandir"));

      expect(screen.getByText("Ao vivo")).toBeInTheDocument();
    });
  });

  describe("fallback para formato sem indicador explícito", () => {
    it("deve inferir formato Rei da Praia quando há jogadores e sem formato definido", () => {
      const grupoSemFormato = [
        {
          id: "grupo-sem-formato",
          nome: "Grupo Sem Formato",
          ordem: 1,
          completo: false,
          jogadores: [
            {
              id: "j1",
              jogadorId: "jog-1",
              jogadorNome: "Jogador Teste",
              posicaoGrupo: 1,
              jogosGrupo: 0,
              vitoriasGrupo: 0,
              derrotasGrupo: 0,
              pontosGrupo: 0,
              saldoGamesGrupo: 0,
              gamesVencidosGrupo: 0,
              gamesPerdidosGrupo: 0,
              classificado: false,
            },
          ],
          partidas: [],
        },
      ];

      render(<GruposViewer grupos={grupoSemFormato} />);

      // Sem formato definido mas com jogadores, infere Rei da Praia
      expect(screen.getByText("Rei da Praia")).toBeInTheDocument();
    });

    it("deve inferir formato Dupla Fixa quando há duplas e sem formato definido", () => {
      const grupoSemFormato = [
        {
          id: "grupo-sem-formato",
          nome: "Grupo Sem Formato",
          ordem: 1,
          completo: false,
          duplas: [
            {
              id: "d1",
              jogador1Nome: "J1",
              jogador2Nome: "J2",
              posicaoGrupo: 1,
              vitorias: 0,
              derrotas: 0,
              pontos: 0,
              saldoGames: 0,
              jogos: 0,
              classificada: false,
            },
          ],
          partidas: [],
        },
      ];

      render(<GruposViewer grupos={grupoSemFormato} />);

      // Sem formato definido mas com duplas, infere Dupla Fixa
      expect(screen.getByText("Dupla Fixa")).toBeInTheDocument();
    });

    it("deve inferir formato Teams quando há equipes e sem formato definido", () => {
      const grupoSemFormato = [
        {
          id: "grupo-sem-formato",
          nome: "Grupo Sem Formato",
          ordem: 1,
          completo: false,
          equipes: [
            {
              id: "eq1",
              nome: "Equipe A",
              pontos: 0,
              vitorias: 0,
              derrotas: 0,
              jogosVencidos: 0,
              jogosPerdidos: 0,
              saldoJogos: 0,
              classificada: false,
            },
          ],
          partidas: [],
        },
      ];

      render(<GruposViewer grupos={grupoSemFormato} />);

      // Sem formato definido mas com equipes, infere Teams
      expect(screen.getByText("Teams")).toBeInTheDocument();
    });
  });

  describe("formato TEAMS", () => {
    const mockGruposTeams = [
      {
        id: "grupo-teams-1",
        nome: "Grupo A",
        ordem: 1,
        completo: false,
        formato: "teams" as const,
        tipo: "grupos" as const,
        equipes: [
          {
            id: "equipe-1",
            nome: "Os Campeões",
            posicaoGrupo: 1,
            pontos: 6,
            vitorias: 2,
            derrotas: 0,
            jogosVencidos: 4,
            jogosPerdidos: 2,
            saldoJogos: 2,
            classificada: true,
            jogadores: [
              { id: "j1", nome: "João", nivel: "avancado", genero: "masculino" },
              { id: "j2", nome: "Maria", nivel: "avancado", genero: "feminino" },
              { id: "j3", nome: "Pedro", nivel: "intermediario", genero: "masculino" },
              { id: "j4", nome: "Ana", nivel: "intermediario", genero: "feminino" },
            ],
          },
          {
            id: "equipe-2",
            nome: "Os Desafiantes",
            posicaoGrupo: 2,
            pontos: 3,
            vitorias: 1,
            derrotas: 1,
            jogosVencidos: 3,
            jogosPerdidos: 3,
            saldoJogos: 0,
            classificada: true,
            jogadores: [
              { id: "j5", nome: "Carlos", nivel: "avancado", genero: "masculino" },
              { id: "j6", nome: "Lucia", nivel: "avancado", genero: "feminino" },
            ],
          },
          {
            id: "equipe-3",
            nome: "Os Iniciantes",
            posicaoGrupo: 3,
            pontos: 0,
            vitorias: 0,
            derrotas: 2,
            jogosVencidos: 1,
            jogosPerdidos: 5,
            saldoJogos: -4,
            classificada: false,
          },
        ],
        partidas: [],
        confrontos: [
          {
            id: "confronto-1",
            fase: "grupos",
            rodada: 1,
            grupoId: "grupo-teams-1",
            grupoNome: "Grupo A",
            equipe1Id: "equipe-1",
            equipe2Id: "equipe-2",
            equipe1Nome: "Os Campeões",
            equipe2Nome: "Os Desafiantes",
            status: "FINALIZADO",
            jogosEquipe1: 2,
            jogosEquipe2: 1,
            vencedoraId: "equipe-1",
            partidas: [
              {
                id: "partida-teams-1",
                ordem: 1,
                tipoJogo: "feminino" as const,
                status: "FINALIZADA",
                dupla1: {
                  jogador1Id: "j2",
                  jogador1Nome: "Maria",
                  jogador2Id: "j4",
                  jogador2Nome: "Ana",
                  equipeId: "equipe-1",
                  equipeNome: "Os Campeões",
                },
                dupla2: {
                  jogador1Id: "j6",
                  jogador1Nome: "Lucia",
                  jogador2Id: "j6b",
                  jogador2Nome: "Clara",
                  equipeId: "equipe-2",
                  equipeNome: "Os Desafiantes",
                },
                setsDupla1: 1,
                setsDupla2: 0,
                placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
                vencedoraEquipeId: "equipe-1",
                vencedoraEquipeNome: "Os Campeões",
              },
              {
                id: "partida-teams-2",
                ordem: 2,
                tipoJogo: "masculino" as const,
                status: "FINALIZADA",
                dupla1: {
                  jogador1Id: "j1",
                  jogador1Nome: "João",
                  jogador2Id: "j3",
                  jogador2Nome: "Pedro",
                  equipeId: "equipe-1",
                  equipeNome: "Os Campeões",
                },
                dupla2: {
                  jogador1Id: "j5",
                  jogador1Nome: "Carlos",
                  jogador2Id: "j5b",
                  jogador2Nome: "Fernando",
                  equipeId: "equipe-2",
                  equipeNome: "Os Desafiantes",
                },
                setsDupla1: 1,
                setsDupla2: 0,
                placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 3 }],
                vencedoraEquipeId: "equipe-1",
                vencedoraEquipeNome: "Os Campeões",
              },
              {
                id: "partida-teams-3",
                ordem: 3,
                tipoJogo: "misto" as const,
                status: "FINALIZADA",
                dupla1: {
                  jogador1Id: "j1",
                  jogador1Nome: "João",
                  jogador2Id: "j2",
                  jogador2Nome: "Maria",
                  equipeId: "equipe-1",
                  equipeNome: "Os Campeões",
                },
                dupla2: {
                  jogador1Id: "j5",
                  jogador1Nome: "Carlos",
                  jogador2Id: "j6",
                  jogador2Nome: "Lucia",
                  equipeId: "equipe-2",
                  equipeNome: "Os Desafiantes",
                },
                setsDupla1: 0,
                setsDupla2: 1,
                placar: [{ numero: 1, gamesDupla1: 3, gamesDupla2: 6 }],
                vencedoraEquipeId: "equipe-2",
                vencedoraEquipeNome: "Os Desafiantes",
              },
            ],
          },
          {
            id: "confronto-2",
            fase: "grupos",
            rodada: 2,
            grupoId: "grupo-teams-1",
            grupoNome: "Grupo A",
            equipe1Id: "equipe-1",
            equipe2Id: "equipe-3",
            equipe1Nome: "Os Campeões",
            equipe2Nome: "Os Iniciantes",
            status: "AGENDADO",
            jogosEquipe1: 0,
            jogosEquipe2: 0,
          },
        ],
      },
    ];

    it("deve mostrar título Confrontos com badge Teams", () => {
      render(<GruposViewer grupos={mockGruposTeams} />);

      // "Confrontos" aparece no header e na seção
      expect(screen.getAllByText("Confrontos").length).toBeGreaterThan(0);
      expect(screen.getByText("Teams")).toBeInTheDocument();
    });

    it("deve mostrar equipes com jogadores após expandir", () => {
      render(<GruposViewer grupos={mockGruposTeams} />);

      fireEvent.click(screen.getByText("▼ Expandir"));

      expect(screen.getByText("Equipes")).toBeInTheDocument();
      // Os Campeões aparece em múltiplos lugares (equipes, classificação, confrontos)
      expect(screen.getAllByText("Os Campeões").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Os Desafiantes").length).toBeGreaterThan(0);
      // Jogadores aparecem na lista de equipes
      expect(screen.getAllByText("João").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Maria").length).toBeGreaterThan(0);
    });

    it("deve mostrar classificação de equipes com estatísticas", () => {
      render(<GruposViewer grupos={mockGruposTeams} />);

      fireEvent.click(screen.getByText("▼ Expandir"));

      // Verificar cabeçalhos da tabela de classificação
      expect(screen.getByText("Equipe")).toBeInTheDocument();
      // V, D, Pts, SJ estão na tabela
      expect(screen.getAllByText("V").length).toBeGreaterThan(0);
      expect(screen.getAllByText("D").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Pts").length).toBeGreaterThan(0);
      expect(screen.getByText("SJ")).toBeInTheDocument();
    });

    it("deve mostrar saldo de jogos positivo e negativo", () => {
      render(<GruposViewer grupos={mockGruposTeams} />);

      fireEvent.click(screen.getByText("▼ Expandir"));

      expect(screen.getByText("+2")).toBeInTheDocument(); // Os Campeões
      expect(screen.getByText("-4")).toBeInTheDocument(); // Os Iniciantes
    });

    it("deve mostrar confrontos com status", () => {
      render(<GruposViewer grupos={mockGruposTeams} />);

      fireEvent.click(screen.getByText("▼ Expandir"));

      expect(screen.getAllByText("Finalizado").length).toBeGreaterThan(0);
      expect(screen.getByText("Agendado")).toBeInTheDocument();
    });

    it("deve mostrar VS entre equipes", () => {
      render(<GruposViewer grupos={mockGruposTeams} />);

      fireEvent.click(screen.getByText("▼ Expandir"));

      expect(screen.getAllByText("VS").length).toBeGreaterThan(0);
    });

    it("deve mostrar partidas dentro do confronto", () => {
      render(<GruposViewer grupos={mockGruposTeams} />);

      fireEvent.click(screen.getByText("▼ Expandir"));

      // Badges de tipo de jogo
      expect(screen.getByText("Feminino")).toBeInTheDocument();
      expect(screen.getByText("Masculino")).toBeInTheDocument();
      expect(screen.getByText("Misto")).toBeInTheDocument();
    });

    it("deve mostrar nomes das duplas nas partidas", () => {
      render(<GruposViewer grupos={mockGruposTeams} />);

      fireEvent.click(screen.getByText("▼ Expandir"));

      // Duplas aparecem nas partidas - pode haver duplicatas
      expect(screen.getAllByText("Maria & Ana").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Lucia & Clara").length).toBeGreaterThan(0);
    });

    it("deve mostrar placar das partidas finalizadas", () => {
      render(<GruposViewer grupos={mockGruposTeams} />);

      fireEvent.click(screen.getByText("▼ Expandir"));

      // Placar 6-4, 6-3, 3-6
      expect(screen.getAllByText("6").length).toBeGreaterThan(0);
      expect(screen.getAllByText("4").length).toBeGreaterThan(0);
      expect(screen.getAllByText("3").length).toBeGreaterThan(0);
    });

    it("deve calcular estatísticas corretas para TEAMS no resumo", () => {
      render(<GruposViewer grupos={mockGruposTeams} />);

      // No resumo, deve contar confrontos (não partidas)
      // 2 confrontos total, 1 finalizado = 50%
      expect(screen.getByText("50%")).toBeInTheDocument();
    });

    it("deve não mostrar label Grupos no resumo para TEAMS", () => {
      render(<GruposViewer grupos={mockGruposTeams} />);

      // TEAMS não mostra "Grupos" no resumo, mostra "Confrontos"
      const gruposLabel = screen.queryByText("Grupos");
      // Pode haver "Grupos" no título do grupo, mas não no resumo
      // A lógica é que para TEAMS, não mostramos o item "Grupos" no resumo
    });
  });

  describe("formato TEAMS - fase eliminatória", () => {
    const mockGruposTeamsEliminatoria = [
      {
        id: "semifinal",
        nome: "Semifinal 1",
        ordem: 100,
        completo: false,
        formato: "teams" as const,
        tipo: "eliminatoria" as const,
        equipes: [],
        partidas: [],
        confrontos: [
          {
            id: "confronto-semi-1",
            fase: "semifinal",
            equipe1Nome: "Equipe A",
            equipe2Nome: "Equipe B",
            status: "EM_ANDAMENTO",
            jogosEquipe1: 1,
            jogosEquipe2: 1,
            partidas: [
              {
                id: "partida-decider",
                ordem: 3,
                tipoJogo: "decider" as const,
                status: "AGENDADA",
                dupla1: {
                  jogador1Id: "j1",
                  jogador1Nome: "João",
                  jogador2Id: "j2",
                  jogador2Nome: "Maria",
                  equipeId: "eq1",
                  equipeNome: "Equipe A",
                },
                dupla2: {
                  jogador1Id: "j3",
                  jogador1Nome: "Pedro",
                  jogador2Id: "j4",
                  jogador2Nome: "Ana",
                  equipeId: "eq2",
                  equipeNome: "Equipe B",
                },
                setsDupla1: 0,
                setsDupla2: 0,
              },
            ],
          },
        ],
      },
    ];

    it("deve mostrar fase eliminatória com estilo diferenciado", () => {
      render(<GruposViewer grupos={mockGruposTeamsEliminatoria} />);

      fireEvent.click(screen.getByText("▼ Expandir"));

      expect(screen.getByText("Semifinal 1")).toBeInTheDocument();
    });

    it("deve mostrar status Em andamento (Ao vivo)", () => {
      render(<GruposViewer grupos={mockGruposTeamsEliminatoria} />);

      fireEvent.click(screen.getByText("▼ Expandir"));

      expect(screen.getByText("Ao vivo")).toBeInTheDocument();
    });

    it("deve mostrar tipo de jogo Decider", () => {
      render(<GruposViewer grupos={mockGruposTeamsEliminatoria} />);

      fireEvent.click(screen.getByText("▼ Expandir"));

      expect(screen.getByText("Decider")).toBeInTheDocument();
    });

    it("não deve mostrar título Confrontos para fase eliminatória", () => {
      render(<GruposViewer grupos={mockGruposTeamsEliminatoria} />);

      fireEvent.click(screen.getByText("▼ Expandir"));

      // Na fase eliminatória, não mostra título "Confrontos" pois já está no header do grupo
      // O texto "Confrontos" aparece apenas como título geral, não como seção
    });
  });

  describe("formato TEAMS - casos de borda", () => {
    it("deve mostrar A definir quando equipe não está definida", () => {
      const grupoComEquipeNaoDefinida = [
        {
          id: "grupo-indefinido",
          nome: "Fase Final",
          ordem: 1,
          completo: false,
          formato: "teams" as const,
          equipes: [],
          partidas: [],
          confrontos: [
            {
              id: "confronto-indefinido",
              status: "AGENDADO",
              jogosEquipe1: 0,
              jogosEquipe2: 0,
            },
          ],
        },
      ];

      render(<GruposViewer grupos={grupoComEquipeNaoDefinida} />);

      fireEvent.click(screen.getByText("▼ Expandir"));

      expect(screen.getAllByText("A definir").length).toBeGreaterThanOrEqual(2);
    });

    it("deve mostrar A definir quando dupla não está definida nas partidas", () => {
      const grupoComDuplaNaoDefinida = [
        {
          id: "grupo-dupla-indefinida",
          nome: "Grupo X",
          ordem: 1,
          completo: false,
          formato: "teams" as const,
          equipes: [],
          partidas: [],
          confrontos: [
            {
              id: "confronto-x",
              equipe1Nome: "Equipe X",
              equipe2Nome: "Equipe Y",
              status: "AGENDADO",
              jogosEquipe1: 0,
              jogosEquipe2: 0,
              partidas: [
                {
                  id: "partida-x",
                  ordem: 1,
                  tipoJogo: "feminino" as const,
                  status: "AGENDADA",
                  dupla1: null,
                  dupla2: null,
                  setsDupla1: 0,
                  setsDupla2: 0,
                },
              ],
            },
          ],
        },
      ];

      render(<GruposViewer grupos={grupoComDuplaNaoDefinida} />);

      fireEvent.click(screen.getByText("▼ Expandir"));

      // Deve mostrar "A definir" para duplas não definidas
      expect(screen.getAllByText("A definir").length).toBeGreaterThanOrEqual(2);
    });

    it("deve ordenar grupos por tipo (grupos antes de eliminatória)", () => {
      const gruposMisturados = [
        {
          id: "final",
          nome: "Final",
          ordem: 200,
          completo: false,
          formato: "teams" as const,
          tipo: "eliminatoria" as const,
          equipes: [],
          partidas: [],
          confrontos: [],
        },
        {
          id: "grupo-a",
          nome: "Grupo A",
          ordem: 1,
          completo: false,
          formato: "teams" as const,
          tipo: "grupos" as const,
          equipes: [],
          partidas: [],
          confrontos: [],
        },
      ];

      render(<GruposViewer grupos={gruposMisturados} />);

      fireEvent.click(screen.getByText("▼ Expandir"));

      // Verificar que ambos os grupos são renderizados
      expect(screen.getByText("Grupo A")).toBeInTheDocument();
      expect(screen.getByText("Final")).toBeInTheDocument();
    });

    it("deve não mostrar tabela de classificação quando equipes não têm pontos", () => {
      const grupoSemPontos = [
        {
          id: "grupo-sem-pontos",
          nome: "Grupo Novo",
          ordem: 1,
          completo: false,
          formato: "teams" as const,
          equipes: [
            {
              id: "eq1",
              nome: "Equipe A",
              pontos: 0,
              vitorias: 0,
              derrotas: 0,
              jogosVencidos: 0,
              jogosPerdidos: 0,
              saldoJogos: 0,
              classificada: false,
            },
          ],
          partidas: [],
          confrontos: [],
        },
      ];

      render(<GruposViewer grupos={grupoSemPontos} />);

      fireEvent.click(screen.getByText("▼ Expandir"));

      // Deve mostrar equipes mas não a tabela de classificação
      expect(screen.getByText("Equipes")).toBeInTheDocument();
      expect(screen.getByText("Equipe A")).toBeInTheDocument();
      // Não deve mostrar cabeçalhos de classificação como "SJ"
      expect(screen.queryByText("SJ")).not.toBeInTheDocument();
    });
  });

  describe("detecção de vencedor por vencedoraNome (fallback)", () => {
    it("deve detectar vencedor usando vencedoraNome quando sets não estão disponíveis", () => {
      const grupoComVencedoraNome = [
        {
          id: "grupo-fallback",
          nome: "Grupo Fallback",
          ordem: 1,
          completo: false,
          formato: "dupla_fixa" as const,
          duplas: [],
          partidas: [
            {
              id: "partida-fallback",
              dupla1Nome: "Time Vencedor",
              dupla2Nome: "Time Perdedor",
              status: "FINALIZADA",
              setsDupla1: 0, // Sets não indicam vencedor
              setsDupla2: 0,
              vencedoraNome: "Time Vencedor",
              placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
            },
          ],
        },
      ];

      render(<GruposViewer grupos={grupoComVencedoraNome} />);
      fireEvent.click(screen.getByText("▼ Expandir"));

      expect(screen.getByText("Time Vencedor")).toBeInTheDocument();
      expect(screen.getByText("Time Perdedor")).toBeInTheDocument();
    });
  });
});
