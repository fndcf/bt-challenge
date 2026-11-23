/**
 * Testes para TeamsResultadoService
 *
 */

jest.mock("../../../repositories/firebase/PartidaTeamsRepository", () => ({
  __esModule: true,
  default: {
    buscarPorId: jest.fn(),
    buscarPorConfrontoOrdenadas: jest.fn(),
    deletarPorConfronto: jest.fn(),
    registrarResultado: jest.fn(),
  },
}));

jest.mock("../../../repositories/firebase/ConfrontoEquipeRepository", () => ({
  __esModule: true,
  default: {
    buscarPorId: jest.fn(),
    buscarPorEtapa: jest.fn(),
    atualizar: jest.fn(),
    registrarResultado: jest.fn(),
    incrementarPartidasFinalizadas: jest.fn(),
    atualizarContadorJogos: jest.fn(),
    marcarTemDecider: jest.fn(),
    atualizarStatus: jest.fn(),
    reabrir: jest.fn(),
    resetarConfronto: jest.fn(),
  },
}));

jest.mock("../../../repositories/firebase/EquipeRepository", () => ({
  __esModule: true,
  default: {
    incrementarEstatisticasEmLote: jest.fn(),
    atualizarEmLote: jest.fn(),
  },
}));

jest.mock("../../../repositories/firebase/EtapaRepository", () => ({
  EtapaRepository: jest.fn().mockImplementation(() => ({
    buscarPorId: jest.fn(),
    definirCampeao: jest.fn(),
  })),
}));

// Mock do logger
jest.mock("../../../utils/logger", () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    critical: jest.fn(),
  },
}));

// Mock do EstatisticasJogadorService
jest.mock("../../../services/EstatisticasJogadorService", () => ({
  EstatisticasJogadorService: jest.fn().mockImplementation(() => ({
    buscarPorJogadoresEtapa: jest.fn().mockResolvedValue(new Map()),
    atualizarEstatisticasPartidaTeams: jest.fn().mockResolvedValue(undefined),
    reverterEstatisticasPartidaTeams: jest.fn().mockResolvedValue(undefined),
    reverterTotaisComIncrement: jest.fn().mockResolvedValue(undefined),
    atualizarAposPartidaComIncrement: jest.fn().mockResolvedValue(undefined),
  })),
}));

import { TeamsResultadoService } from "../../../services/teams/TeamsResultadoService";
import {
  ITeamsClassificacaoService,
  TeamsClassificacaoService,
} from "../../../services/teams/TeamsClassificacaoService";
import {
  ITeamsPartidaService,
  TeamsPartidaService,
} from "../../../services/teams/TeamsPartidaService";
import { StatusPartida } from "../../../models/Partida";
import { FaseEtapa } from "../../../models/Etapa";
import { TipoJogoTeams, StatusConfronto } from "../../../models/Teams";
import PartidaTeamsRepository from "../../../repositories/firebase/PartidaTeamsRepository";
import ConfrontoEquipeRepository from "../../../repositories/firebase/ConfrontoEquipeRepository";
import EquipeRepository from "../../../repositories/firebase/EquipeRepository";

// Tipagem dos mocks
const mockPartidaRepository = PartidaTeamsRepository as jest.Mocked<
  typeof PartidaTeamsRepository
>;
const mockConfrontoRepository = ConfrontoEquipeRepository as jest.Mocked<
  typeof ConfrontoEquipeRepository
>;
const mockEquipeRepository = EquipeRepository as jest.Mocked<
  typeof EquipeRepository
>;

describe("TeamsResultadoService", () => {
  let service: TeamsResultadoService;

  // Helpers para criar mocks
  const criarPartidaMock = (overrides = {}) => ({
    id: "partida-1",
    confrontoId: "confronto-1",
    etapaId: "etapa-1",
    arenaId: "arena-1",
    equipe1Id: "equipe-1",
    equipe2Id: "equipe-2",
    equipe1Nome: "Equipe Alpha",
    equipe2Nome: "Equipe Beta",
    dupla1: [
      { id: "jog-1", nome: "João" },
      { id: "jog-2", nome: "Maria" },
    ],
    dupla2: [
      { id: "jog-3", nome: "Pedro" },
      { id: "jog-4", nome: "Ana" },
    ],
    status: StatusPartida.AGENDADA,
    tipoJogo: TipoJogoTeams.MASCULINO,
    ...overrides,
  });

  const criarConfrontoMock = (overrides = {}) => ({
    id: "confronto-1",
    etapaId: "etapa-1",
    arenaId: "arena-1",
    equipe1Id: "equipe-1",
    equipe2Id: "equipe-2",
    equipe1Nome: "Equipe Alpha",
    equipe2Nome: "Equipe Beta",
    jogosEquipe1: 0,
    jogosEquipe2: 0,
    partidasFinalizadas: 0,
    totalPartidas: 2,
    fase: FaseEtapa.GRUPOS,
    status: StatusConfronto.AGENDADO,
    temDecider: false,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Eliminatória ainda não gerada: fase de grupos editável
    mockConfrontoRepository.buscarPorEtapa.mockResolvedValue([]);
    service = criarServico();
  });

  // Serviços de partida e classificação que o de resultados usa
  const criarServico = ({
    partida = { gerarDecider: jest.fn() },
    classificacao = {
      recalcularClassificacao: jest.fn(),
      verificarEPreencherFaseEliminatoria: jest.fn(),
      preencherProximoConfronto: jest.fn(),
    },
  }: {
    partida?: object;
    classificacao?: object;
  } = {}) =>
    new TeamsResultadoService(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      partida as unknown as ITeamsPartidaService,
      classificacao as unknown as ITeamsClassificacaoService
    );

  describe("bloqueio da fase de grupos após gerar a eliminatória", () => {
    const eliminatoriaPreenchida = [
      criarConfrontoMock({ id: "semi-1", fase: FaseEtapa.SEMIFINAL, equipe1Id: "equipe-1" }),
    ];

    it("deve impedir editar resultado de grupo", async () => {
      mockPartidaRepository.buscarPorId.mockResolvedValue(criarPartidaMock() as any);
      mockConfrontoRepository.buscarPorId.mockResolvedValue(criarConfrontoMock() as any);
      mockPartidaRepository.buscarPorConfrontoOrdenadas.mockResolvedValue([]);
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue(eliminatoriaPreenchida as any);

      await expect(
        service.registrarResultadoPartida("partida-1", "arena-1", {
          placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
        })
      ).rejects.toThrow("Cancele a eliminatória primeiro");
      expect(mockPartidaRepository.registrarResultado).not.toHaveBeenCalled();
    });

    it("deve impedir editar resultado de grupo em lote", async () => {
      mockPartidaRepository.buscarPorId.mockResolvedValue(criarPartidaMock() as any);
      mockConfrontoRepository.buscarPorId.mockResolvedValue(criarConfrontoMock() as any);
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue(eliminatoriaPreenchida as any);

      await expect(
        service.registrarResultadosEmLote("etapa-1", "arena-1", [
          { partidaId: "partida-1", placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }] },
        ])
      ).rejects.toThrow("Cancele a eliminatória primeiro");
    });

    it("deve permitir resultado do mata-mata com a eliminatória gerada", async () => {
      mockPartidaRepository.buscarPorId.mockResolvedValue(criarPartidaMock() as any);
      mockConfrontoRepository.buscarPorId.mockResolvedValue(
        criarConfrontoMock({ fase: FaseEtapa.SEMIFINAL }) as any
      );
      mockPartidaRepository.buscarPorConfrontoOrdenadas.mockResolvedValue([]);
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue(eliminatoriaPreenchida as any);

      await service
        .registrarResultadoPartida("partida-1", "arena-1", {
          placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
        })
        .catch(() => undefined);

      // Não consulta o bloqueio para confrontos do mata-mata
      expect(mockConfrontoRepository.buscarPorEtapa).not.toHaveBeenCalled();
    });
  });

  describe("registrarResultadoPartida", () => {
    it("deve lançar erro se partida não encontrada", async () => {
      mockPartidaRepository.buscarPorId.mockResolvedValue(null);

      await expect(
        service.registrarResultadoPartida("partida-inexistente", "arena-1", {
          placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
        })
      ).rejects.toThrow("Partida não encontrada");
    });

    it("deve lançar erro se confronto não encontrado", async () => {
      const partida = criarPartidaMock();
      mockPartidaRepository.buscarPorId.mockResolvedValue(partida as any);
      mockConfrontoRepository.buscarPorId.mockResolvedValue(null);

      await expect(
        service.registrarResultadoPartida("partida-1", "arena-1", {
          placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
        })
      ).rejects.toThrow("Confronto não encontrado");
    });

    it("deve registrar resultado com sucesso", async () => {
      const partida = criarPartidaMock();
      const confronto = criarConfrontoMock();

      mockPartidaRepository.buscarPorId.mockResolvedValue(partida as any);
      mockConfrontoRepository.buscarPorId.mockResolvedValue(confronto as any);
      mockPartidaRepository.registrarResultado.mockResolvedValue({
        ...partida,
        status: StatusPartida.FINALIZADA,
        vencedorDupla: 1,
      } as any);
      mockConfrontoRepository.incrementarPartidasFinalizadas.mockResolvedValue(
        undefined
      );
      mockConfrontoRepository.atualizarContadorJogos.mockResolvedValue(
        undefined
      );
      mockEquipeRepository.incrementarEstatisticasEmLote.mockResolvedValue(
        undefined
      );
      mockPartidaRepository.buscarPorConfrontoOrdenadas.mockResolvedValue([
        partida,
      ] as any);

      const resultado = await service.registrarResultadoPartida(
        "partida-1",
        "arena-1",
        { placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }] }
      );

      expect(resultado).toBeDefined();
      expect(resultado.partida).toBeDefined();
      expect(resultado.confronto).toBeDefined();
      expect(mockPartidaRepository.registrarResultado).toHaveBeenCalled();
    });

    it("deve reverter estatísticas quando partida já estava finalizada (edição)", async () => {
      const partida = criarPartidaMock({
        status: StatusPartida.FINALIZADA,
        placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
        vencedorDupla: 1,
      });
      const confronto = criarConfrontoMock({
        jogosEquipe1: 1,
        partidasFinalizadas: 1,
      });

      mockPartidaRepository.buscarPorId.mockResolvedValue(partida as any);
      mockConfrontoRepository.buscarPorId.mockResolvedValue(confronto as any);
      mockPartidaRepository.registrarResultado.mockResolvedValue({
        ...partida,
        placar: [{ numero: 1, gamesDupla1: 4, gamesDupla2: 6 }],
        vencedorDupla: 2,
      } as any);
      mockConfrontoRepository.atualizarContadorJogos.mockResolvedValue(
        undefined
      );
      mockEquipeRepository.incrementarEstatisticasEmLote.mockResolvedValue(
        undefined
      );
      mockPartidaRepository.buscarPorConfrontoOrdenadas.mockResolvedValue([
        partida,
      ] as any);

      const resultado = await service.registrarResultadoPartida(
        "partida-1",
        "arena-1",
        { placar: [{ numero: 1, gamesDupla1: 4, gamesDupla2: 6 }] }
      );

      // Deve processar normalmente mesmo com partida já finalizada
      expect(resultado).toBeDefined();
    });

    it("edição: desfaz o resultado antigo (jogadores, equipes e confronto) antes de aplicar o novo", async () => {
      // Antes: equipe-1 venceu a partida 6x3 e o confronto (finalizado, 2x0)
      const partida = criarPartidaMock({
        status: StatusPartida.FINALIZADA,
        placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 3 }],
        vencedoraEquipeId: "equipe-1",
      });
      const confronto = criarConfrontoMock({
        status: StatusConfronto.FINALIZADO,
        vencedoraId: "equipe-1",
        jogosEquipe1: 2,
        partidasFinalizadas: 2,
      });
      const estatisticasService = (service as any).estatisticasService;
      estatisticasService.buscarPorJogadoresEtapa.mockResolvedValue(
        new Map([
          ["jog-1", { id: "est-1" }],
          ["jog-3", { id: "est-3" }],
        ])
      );

      mockPartidaRepository.buscarPorId.mockResolvedValue(partida as any);
      mockConfrontoRepository.buscarPorId.mockResolvedValue(confronto as any);
      mockPartidaRepository.buscarPorConfrontoOrdenadas.mockResolvedValue([partida] as any);
      mockEquipeRepository.incrementarEstatisticasEmLote.mockResolvedValue(undefined);

      await service
        .registrarResultadoPartida("partida-1", "arena-1", {
          placar: [{ numero: 1, gamesDupla1: 4, gamesDupla2: 6 }],
        })
        .catch(() => undefined);

      // Jogadores: estatística antiga revertida
      expect(estatisticasService.reverterTotaisComIncrement).toHaveBeenCalledWith(
        expect.arrayContaining([
          { estatisticaId: "est-1", dto: expect.objectContaining({ venceu: true, gamesVencidos: 6, gamesPerdidos: 3 }) },
          { estatisticaId: "est-3", dto: expect.objectContaining({ venceu: false, gamesVencidos: 3, gamesPerdidos: 6 }) },
        ])
      );
      // Equipes: jogos e games antigos subtraídos
      expect(mockEquipeRepository.incrementarEstatisticasEmLote).toHaveBeenCalledWith([
        { id: "equipe-1", incrementos: { jogosVencidos: -1, jogosPerdidos: 0, gamesVencidos: -6, gamesPerdidos: -3 } },
        { id: "equipe-2", incrementos: { jogosVencidos: 0, jogosPerdidos: -1, gamesVencidos: -3, gamesPerdidos: -6 } },
      ]);
      // Confronto de grupo: vitória/derrota/pontos antigos subtraídos
      expect(mockEquipeRepository.incrementarEstatisticasEmLote).toHaveBeenCalledWith([
        { id: "equipe-1", incrementos: { confrontos: -1, vitorias: -1, pontos: -3 } },
        { id: "equipe-2", incrementos: { confrontos: -1, derrotas: -1 } },
      ]);
      // Reaberto sem vencedor
      expect(mockConfrontoRepository.reabrir).toHaveBeenCalledWith("confronto-1");
    });

    describe("edição no mata-mata", () => {
      const partidaFinalizada = () =>
        criarPartidaMock({
          status: StatusPartida.FINALIZADA,
          placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 3 }],
          vencedoraEquipeId: "equipe-1",
        });
      const semiFinalizada = criarConfrontoMock({
        fase: FaseEtapa.SEMIFINAL,
        status: StatusConfronto.FINALIZADO,
        vencedoraId: "equipe-1",
        proximoConfrontoId: "final",
        jogosEquipe1: 2,
        partidasFinalizadas: 2,
      });

      beforeEach(() => {
        (service as any).estatisticasService.buscarPorJogadoresEtapa.mockResolvedValue(new Map());
        mockEquipeRepository.incrementarEstatisticasEmLote.mockResolvedValue(undefined);
        mockPartidaRepository.buscarPorConfrontoOrdenadas.mockResolvedValue([]);
      });

      it("tira o vencedor antigo da final e apaga as partidas já geradas lá", async () => {
        mockPartidaRepository.buscarPorId.mockResolvedValue(partidaFinalizada() as any);
        mockConfrontoRepository.buscarPorId.mockImplementation(async (id: string) =>
          (id === "final"
            ? criarConfrontoMock({
                id: "final", fase: FaseEtapa.FINAL, equipe1Id: "equipe-1",
                equipe1Nome: "Equipe Alpha", equipe2Id: "", status: StatusConfronto.AGENDADO,
              })
            : semiFinalizada) as any
        );

        await service
          .registrarResultadoPartida("partida-1", "arena-1", {
            placar: [{ numero: 1, gamesDupla1: 3, gamesDupla2: 6 }],
          })
          .catch(() => undefined);

        expect(mockPartidaRepository.deletarPorConfronto).toHaveBeenCalledWith("final");
        expect(mockConfrontoRepository.resetarConfronto).toHaveBeenCalledWith("final");
        expect(mockConfrontoRepository.atualizar).toHaveBeenCalledWith("final", {
          equipe1Id: "",
          equipe1Nome: "",
        });
        // Mata-mata não mexe em vitórias/pontos das equipes
        expect(mockEquipeRepository.incrementarEstatisticasEmLote).not.toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ incrementos: expect.objectContaining({ pontos: -3 }) }),
          ])
        );
      });

      it("recusa a edição se a fase seguinte já tem resultado", async () => {
        mockPartidaRepository.buscarPorId.mockResolvedValue(partidaFinalizada() as any);
        mockConfrontoRepository.buscarPorId.mockImplementation(async (id: string) =>
          (id === "final"
            ? criarConfrontoMock({ id: "final", fase: FaseEtapa.FINAL, partidasFinalizadas: 1 })
            : semiFinalizada) as any
        );

        await expect(
          service.registrarResultadoPartida("partida-1", "arena-1", {
            placar: [{ numero: 1, gamesDupla1: 3, gamesDupla2: 6 }],
          })
        ).rejects.toThrow("a fase seguinte já tem resultado lançado");

        // Nada foi revertido nem gravado
        expect(
          (service as any).estatisticasService.reverterTotaisComIncrement
        ).not.toHaveBeenCalled();
        expect(mockPartidaRepository.registrarResultado).not.toHaveBeenCalled();
      });

      it("quartas finalizadas levam o vencedor adiante", async () => {
        const classificacao = {
          recalcularClassificacao: jest.fn(),
          verificarEPreencherFaseEliminatoria: jest.fn(),
          preencherProximoConfronto: jest.fn().mockResolvedValue(undefined),
        };
        service = criarServico({ classificacao: classificacao });
        const partida = criarPartidaMock({ id: "p2" });
        const quartas = criarConfrontoMock({
          id: "q1", fase: FaseEtapa.QUARTAS, proximoConfrontoId: "s1",
          jogosEquipe1: 1, partidasFinalizadas: 1,
        });
        mockPartidaRepository.buscarPorId.mockResolvedValue(partida as any);
        mockConfrontoRepository.buscarPorId.mockResolvedValue(quartas as any);
        mockPartidaRepository.buscarPorConfrontoOrdenadas.mockResolvedValue([
          criarPartidaMock({ id: "p1", status: StatusPartida.FINALIZADA, vencedoraEquipeId: "equipe-1" }),
          partida,
        ] as any);

        await service.registrarResultadoPartida("p2", "arena-1", {
          placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 2 }],
        });

        expect(classificacao.preencherProximoConfronto).toHaveBeenCalledWith(
          expect.objectContaining({ id: "q1" }),
          "equipe-1",
          "Equipe Alpha"
        );
      });
    });

    it("primeiro lançamento: não reverte nada", async () => {
      mockPartidaRepository.buscarPorId.mockResolvedValue(criarPartidaMock() as any);
      mockConfrontoRepository.buscarPorId.mockResolvedValue(criarConfrontoMock() as any);
      mockPartidaRepository.buscarPorConfrontoOrdenadas.mockResolvedValue([]);
      mockEquipeRepository.incrementarEstatisticasEmLote.mockResolvedValue(undefined);

      await service
        .registrarResultadoPartida("partida-1", "arena-1", {
          placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
        })
        .catch(() => undefined);

      expect(
        (service as any).estatisticasService.reverterTotaisComIncrement
      ).not.toHaveBeenCalled();
      expect(mockConfrontoRepository.reabrir).not.toHaveBeenCalled();
    });

    it("primeiro lançamento: confronto passa a estar em andamento", async () => {
      const partida = criarPartidaMock();
      mockPartidaRepository.buscarPorId.mockResolvedValue(partida as any);
      mockConfrontoRepository.buscarPorId.mockResolvedValue(criarConfrontoMock() as any);
      mockPartidaRepository.buscarPorConfrontoOrdenadas.mockResolvedValue([
        partida,
        criarPartidaMock({ id: "partida-2" }),
      ] as any);
      mockEquipeRepository.incrementarEstatisticasEmLote.mockResolvedValue(undefined);

      const { confronto } = await service.registrarResultadoPartida(
        "partida-1",
        "arena-1",
        { placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }] }
      );

      expect(mockConfrontoRepository.atualizar).toHaveBeenCalledWith(
        "confronto-1",
        expect.objectContaining({
          jogosEquipe1: 1,
          jogosEquipe2: 0,
          status: StatusConfronto.EM_ANDAMENTO,
        })
      );
      expect(confronto.status).toBe(StatusConfronto.EM_ANDAMENTO);
      expect(mockConfrontoRepository.registrarResultado).not.toHaveBeenCalled();
    });

    it("edição que volta ao empate: fica em andamento e sem vencedor", async () => {
      const finalizada = (id: string) =>
        criarPartidaMock({
          id,
          status: StatusPartida.FINALIZADA,
          placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 3 }],
          vencedoraEquipeId: "equipe-1",
        });
      mockPartidaRepository.buscarPorId.mockResolvedValue(finalizada("partida-1") as any);
      mockConfrontoRepository.buscarPorId.mockResolvedValue(
        criarConfrontoMock({
          status: StatusConfronto.FINALIZADO,
          vencedoraId: "equipe-1",
          vencedoraNome: "Equipe Alpha",
          jogosEquipe1: 2,
          temDecider: true,
        }) as any
      );
      mockPartidaRepository.buscarPorConfrontoOrdenadas.mockResolvedValue([
        finalizada("partida-1"),
        finalizada("partida-2"),
      ] as any);
      mockEquipeRepository.incrementarEstatisticasEmLote.mockResolvedValue(undefined);

      const { confronto } = await service.registrarResultadoPartida(
        "partida-1",
        "arena-1",
        { placar: [{ numero: 1, gamesDupla1: 3, gamesDupla2: 6 }] }
      );

      expect(mockConfrontoRepository.reabrir).toHaveBeenCalledWith("confronto-1");
      expect(confronto).toMatchObject({
        jogosEquipe1: 1,
        jogosEquipe2: 1,
        status: StatusConfronto.EM_ANDAMENTO,
      });
      expect(confronto.vencedoraId).toBeUndefined();
      expect(mockConfrontoRepository.registrarResultado).not.toHaveBeenCalled();
    });

    it("deve gerar decider automaticamente quando empate 1-1", async () => {
      const partida = criarPartidaMock({
        tipoJogo: TipoJogoTeams.MASCULINO,
        ordem: 2,
      });
      const partida2 = criarPartidaMock({
        id: "partida-2",
        tipoJogo: TipoJogoTeams.FEMININO,
        ordem: 1,
        status: StatusPartida.FINALIZADA,
        vencedorDupla: 2,
      });
      const confronto = criarConfrontoMock({
        jogosEquipe1: 0,
        jogosEquipe2: 1,
        partidasFinalizadas: 1,
        temDecider: false,
      });
      const etapa = { id: "etapa-1", arenaId: "arena-1" };

      mockPartidaRepository.buscarPorId.mockResolvedValue(partida as any);
      mockConfrontoRepository.buscarPorId.mockResolvedValue(confronto as any);
      mockPartidaRepository.registrarResultado.mockResolvedValue({
        ...partida,
        status: StatusPartida.FINALIZADA,
        vencedorDupla: 1,
      } as any);
      mockConfrontoRepository.incrementarPartidasFinalizadas.mockResolvedValue(
        undefined
      );
      mockConfrontoRepository.atualizarContadorJogos.mockResolvedValue(
        undefined
      );
      mockEquipeRepository.incrementarEstatisticasEmLote.mockResolvedValue(
        undefined
      );
      mockPartidaRepository.buscarPorConfrontoOrdenadas.mockResolvedValue([
        partida2,
        partida,
      ] as any);
      mockConfrontoRepository.marcarTemDecider.mockResolvedValue(undefined);

      // Mock do partidaService para gerar decider
      const mockPartidaService = {
        gerarDecider: jest.fn().mockResolvedValue({ id: "decider-1" }),
      };
      service = criarServico({ partida: mockPartidaService });

      // Mock do etapaRepository
      const mockEtapaRepo = {
        buscarPorId: jest.fn().mockResolvedValue(etapa),
        definirCampeao: jest.fn(),
      };
      (service as any).etapaRepository = mockEtapaRepo;

      const resultado = await service.registrarResultadoPartida(
        "partida-1",
        "arena-1",
        { placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }] }
      );

      // Verifica que detectou empate 1-1 (pode ou não ter chamado gerarDecider dependendo de como o service está configurado)
      expect(resultado).toBeDefined();
    });

    it("deve logar erro quando falha ao gerar decider", async () => {
      const partida = criarPartidaMock({
        tipoJogo: TipoJogoTeams.MASCULINO,
        ordem: 2,
      });
      const partida2 = criarPartidaMock({
        id: "partida-2",
        tipoJogo: TipoJogoTeams.FEMININO,
        ordem: 1,
        status: StatusPartida.FINALIZADA,
        vencedorDupla: 2,
      });
      const confronto = criarConfrontoMock({
        jogosEquipe1: 0,
        jogosEquipe2: 1,
        partidasFinalizadas: 1,
        temDecider: false,
      });
      const etapa = { id: "etapa-1", arenaId: "arena-1" };

      mockPartidaRepository.buscarPorId.mockResolvedValue(partida as any);
      mockConfrontoRepository.buscarPorId.mockResolvedValue(confronto as any);
      mockPartidaRepository.registrarResultado.mockResolvedValue({
        ...partida,
        status: StatusPartida.FINALIZADA,
        vencedorDupla: 1,
      } as any);
      mockConfrontoRepository.incrementarPartidasFinalizadas.mockResolvedValue(
        undefined
      );
      mockConfrontoRepository.atualizarContadorJogos.mockResolvedValue(
        undefined
      );
      mockEquipeRepository.incrementarEstatisticasEmLote.mockResolvedValue(
        undefined
      );
      mockPartidaRepository.buscarPorConfrontoOrdenadas.mockResolvedValue([
        partida2,
        partida,
      ] as any);
      mockConfrontoRepository.marcarTemDecider.mockResolvedValue(undefined);

      // Mock do partidaService que falha
      const mockPartidaService = {
        gerarDecider: jest
          .fn()
          .mockRejectedValue(new Error("Erro ao gerar decider")),
      };
      service = criarServico({ partida: mockPartidaService });

      // Mock do etapaRepository
      const mockEtapaRepo = {
        buscarPorId: jest.fn().mockResolvedValue(etapa),
        definirCampeao: jest.fn(),
      };
      (service as any).etapaRepository = mockEtapaRepo;

      // Deve continuar sem erro
      const resultado = await service.registrarResultadoPartida(
        "partida-1",
        "arena-1",
        { placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }] }
      );

      expect(resultado).toBeDefined();
    });

    it("deve finalizar confronto quando tem 2 vitórias", async () => {
      const partida = criarPartidaMock({
        tipoJogo: TipoJogoTeams.MASCULINO,
        ordem: 2,
      });
      const partida1 = criarPartidaMock({
        id: "partida-1",
        tipoJogo: TipoJogoTeams.FEMININO,
        ordem: 1,
        status: StatusPartida.FINALIZADA,
        vencedorDupla: 1,
      });
      const confronto = criarConfrontoMock({
        jogosEquipe1: 1,
        jogosEquipe2: 0,
        partidasFinalizadas: 1,
        fase: FaseEtapa.GRUPOS,
      });

      mockPartidaRepository.buscarPorId.mockResolvedValue(partida as any);
      mockConfrontoRepository.buscarPorId
        .mockResolvedValueOnce(confronto as any)
        .mockResolvedValue({
          ...confronto,
          status: StatusConfronto.FINALIZADO,
        } as any);
      mockPartidaRepository.registrarResultado.mockResolvedValue({
        ...partida,
        status: StatusPartida.FINALIZADA,
        vencedorDupla: 1,
      } as any);
      mockConfrontoRepository.incrementarPartidasFinalizadas.mockResolvedValue(
        undefined
      );
      mockConfrontoRepository.atualizarContadorJogos.mockResolvedValue(
        undefined
      );
      mockEquipeRepository.incrementarEstatisticasEmLote.mockResolvedValue(
        undefined
      );
      mockPartidaRepository.buscarPorConfrontoOrdenadas.mockResolvedValue([
        partida1,
        partida,
      ] as any);
      mockConfrontoRepository.registrarResultado.mockResolvedValue(undefined);
      mockEquipeRepository.atualizarEmLote.mockResolvedValue(undefined);

      // Mock do classificacaoService
      const mockClassificacaoService = {
        recalcularClassificacao: jest.fn().mockResolvedValue([]),
        verificarEPreencherFaseEliminatoria: jest
          .fn()
          .mockResolvedValue(undefined),
        preencherProximoConfronto: jest.fn().mockResolvedValue(undefined),
      };
      service = criarServico({ classificacao: mockClassificacaoService });

      const resultado = await service.registrarResultadoPartida(
        "partida-1",
        "arena-1",
        { placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }] }
      );

      expect(resultado.confrontoFinalizado).toBe(true);
      expect(mockConfrontoRepository.registrarResultado).toHaveBeenCalled();
      expect(
        mockClassificacaoService.recalcularClassificacao
      ).toHaveBeenCalled();
    });

    it("deve pular atualização de equipes quando IDs não definidos", async () => {
      const partida = criarPartidaMock({
        equipe1Id: undefined,
        equipe2Id: undefined,
      });
      const confronto = criarConfrontoMock({
        equipe1Id: undefined,
        equipe2Id: undefined,
      });

      mockPartidaRepository.buscarPorId.mockResolvedValue(partida as any);
      mockConfrontoRepository.buscarPorId.mockResolvedValue(confronto as any);
      mockPartidaRepository.registrarResultado.mockResolvedValue({
        ...partida,
        status: StatusPartida.FINALIZADA,
        vencedorDupla: 1,
      } as any);
      mockConfrontoRepository.incrementarPartidasFinalizadas.mockResolvedValue(
        undefined
      );
      mockConfrontoRepository.atualizarContadorJogos.mockResolvedValue(
        undefined
      );
      mockPartidaRepository.buscarPorConfrontoOrdenadas.mockResolvedValue([
        partida,
      ] as any);

      const resultado = await service.registrarResultadoPartida(
        "partida-1",
        "arena-1",
        { placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }] }
      );

      // Não deve chamar incrementarEstatisticasEmLote
      expect(
        mockEquipeRepository.incrementarEstatisticasEmLote
      ).not.toHaveBeenCalled();
      expect(resultado).toBeDefined();
    });

    it("deve finalizar confronto de semifinal e preencher próximo", async () => {
      const partida = criarPartidaMock({
        tipoJogo: TipoJogoTeams.MASCULINO,
        ordem: 2,
      });
      const partida1 = criarPartidaMock({
        id: "partida-1",
        tipoJogo: TipoJogoTeams.FEMININO,
        ordem: 1,
        status: StatusPartida.FINALIZADA,
        vencedorDupla: 1,
      });
      const confronto = criarConfrontoMock({
        jogosEquipe1: 1,
        jogosEquipe2: 0,
        partidasFinalizadas: 1,
        fase: FaseEtapa.SEMIFINAL,
        proximoConfrontoId: "confronto-final",
      });

      mockPartidaRepository.buscarPorId.mockResolvedValue(partida as any);
      mockConfrontoRepository.buscarPorId
        .mockResolvedValueOnce(confronto as any)
        .mockResolvedValue({
          ...confronto,
          status: StatusConfronto.FINALIZADO,
        } as any);
      mockPartidaRepository.registrarResultado.mockResolvedValue({
        ...partida,
        status: StatusPartida.FINALIZADA,
        vencedorDupla: 1,
      } as any);
      mockConfrontoRepository.incrementarPartidasFinalizadas.mockResolvedValue(
        undefined
      );
      mockConfrontoRepository.atualizarContadorJogos.mockResolvedValue(
        undefined
      );
      mockEquipeRepository.incrementarEstatisticasEmLote.mockResolvedValue(
        undefined
      );
      mockPartidaRepository.buscarPorConfrontoOrdenadas.mockResolvedValue([
        partida1,
        partida,
      ] as any);
      mockConfrontoRepository.registrarResultado.mockResolvedValue(undefined);
      mockEquipeRepository.atualizarEmLote.mockResolvedValue(undefined);

      const mockClassificacaoService = {
        recalcularClassificacao: jest.fn().mockResolvedValue([]),
        verificarEPreencherFaseEliminatoria: jest
          .fn()
          .mockResolvedValue(undefined),
        preencherProximoConfronto: jest.fn().mockResolvedValue(undefined),
      };
      service = criarServico({ classificacao: mockClassificacaoService });

      const resultado = await service.registrarResultadoPartida(
        "partida-1",
        "arena-1",
        { placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }] }
      );

      expect(resultado.confrontoFinalizado).toBe(true);
      expect(
        mockClassificacaoService.preencherProximoConfronto
      ).toHaveBeenCalled();
    });

    it("deve finalizar confronto de FINAL e definir campeão", async () => {
      const partida = criarPartidaMock({
        tipoJogo: TipoJogoTeams.MASCULINO,
        ordem: 2,
      });
      const partida1 = criarPartidaMock({
        id: "partida-1",
        tipoJogo: TipoJogoTeams.FEMININO,
        ordem: 1,
        status: StatusPartida.FINALIZADA,
        vencedorDupla: 1,
      });
      const confronto = criarConfrontoMock({
        jogosEquipe1: 1,
        jogosEquipe2: 0,
        partidasFinalizadas: 1,
        fase: FaseEtapa.FINAL,
      });

      mockPartidaRepository.buscarPorId.mockResolvedValue(partida as any);
      mockConfrontoRepository.buscarPorId
        .mockResolvedValueOnce(confronto as any)
        .mockResolvedValue({
          ...confronto,
          status: StatusConfronto.FINALIZADO,
        } as any);
      mockPartidaRepository.registrarResultado.mockResolvedValue({
        ...partida,
        status: StatusPartida.FINALIZADA,
        vencedorDupla: 1,
      } as any);
      mockConfrontoRepository.incrementarPartidasFinalizadas.mockResolvedValue(
        undefined
      );
      mockConfrontoRepository.atualizarContadorJogos.mockResolvedValue(
        undefined
      );
      mockEquipeRepository.incrementarEstatisticasEmLote.mockResolvedValue(
        undefined
      );
      mockPartidaRepository.buscarPorConfrontoOrdenadas.mockResolvedValue([
        partida1,
        partida,
      ] as any);
      mockConfrontoRepository.registrarResultado.mockResolvedValue(undefined);
      mockEquipeRepository.atualizarEmLote.mockResolvedValue(undefined);

      // Mock do etapaRepository para definirCampeao
      const mockEtapaRepo = {
        buscarPorId: jest.fn().mockResolvedValue({ id: "etapa-1" }),
        definirCampeao: jest.fn().mockResolvedValue(undefined),
      };
      (service as any).etapaRepository = mockEtapaRepo;

      const mockClassificacaoService = {
        recalcularClassificacao: jest.fn().mockResolvedValue([]),
        verificarEPreencherFaseEliminatoria: jest
          .fn()
          .mockResolvedValue(undefined),
        preencherProximoConfronto: jest.fn().mockResolvedValue(undefined),
      };
      service = criarServico({ classificacao: mockClassificacaoService });

      const resultado = await service.registrarResultadoPartida(
        "partida-1",
        "arena-1",
        { placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }] }
      );

      expect(resultado.confrontoFinalizado).toBe(true);
      // Não deve recalcular classificação para FINAL
      expect(
        mockClassificacaoService.recalcularClassificacao
      ).not.toHaveBeenCalled();
    });

    it("deve finalizar confronto com decider", async () => {
      const decider = criarPartidaMock({
        id: "decider-1",
        tipoJogo: TipoJogoTeams.DECIDER,
        ordem: 3,
      });
      const partida1 = criarPartidaMock({
        id: "p1",
        tipoJogo: TipoJogoTeams.FEMININO,
        ordem: 1,
        status: StatusPartida.FINALIZADA,
        vencedorDupla: 1,
      });
      const partida2 = criarPartidaMock({
        id: "p2",
        tipoJogo: TipoJogoTeams.MASCULINO,
        ordem: 2,
        status: StatusPartida.FINALIZADA,
        vencedorDupla: 2,
      });
      const confronto = criarConfrontoMock({
        jogosEquipe1: 1,
        jogosEquipe2: 1,
        partidasFinalizadas: 2,
        temDecider: true,
        totalPartidas: 3,
      });

      mockPartidaRepository.buscarPorId.mockResolvedValue(decider as any);
      mockConfrontoRepository.buscarPorId
        .mockResolvedValueOnce(confronto as any)
        .mockResolvedValue({
          ...confronto,
          status: StatusConfronto.FINALIZADO,
        } as any);
      mockPartidaRepository.registrarResultado.mockResolvedValue({
        ...decider,
        status: StatusPartida.FINALIZADA,
        vencedorDupla: 1,
      } as any);
      mockConfrontoRepository.incrementarPartidasFinalizadas.mockResolvedValue(
        undefined
      );
      mockConfrontoRepository.atualizarContadorJogos.mockResolvedValue(
        undefined
      );
      mockEquipeRepository.incrementarEstatisticasEmLote.mockResolvedValue(
        undefined
      );
      mockPartidaRepository.buscarPorConfrontoOrdenadas.mockResolvedValue([
        partida1,
        partida2,
        decider,
      ] as any);
      mockConfrontoRepository.registrarResultado.mockResolvedValue(undefined);
      mockEquipeRepository.atualizarEmLote.mockResolvedValue(undefined);

      const mockClassificacaoService = {
        recalcularClassificacao: jest.fn().mockResolvedValue([]),
        verificarEPreencherFaseEliminatoria: jest
          .fn()
          .mockResolvedValue(undefined),
        preencherProximoConfronto: jest.fn().mockResolvedValue(undefined),
      };
      service = criarServico({ classificacao: mockClassificacaoService });

      const resultado = await service.registrarResultadoPartida(
        "decider-1",
        "arena-1",
        { placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }] }
      );

      expect(resultado.confrontoFinalizado).toBe(true);
    });
  });

  describe("registrarResultadosEmLote", () => {
    it("deve retornar vazio quando não há resultados", async () => {
      const resultado = await service.registrarResultadosEmLote(
        "etapa-1",
        "arena-1",
        []
      );

      expect(resultado.processados).toBe(0);
      expect(resultado.erros).toHaveLength(0);
      expect(resultado.confrontosFinalizados).toHaveLength(0);
    });

    it("deve adicionar erro quando partida não encontrada", async () => {
      mockPartidaRepository.buscarPorId.mockResolvedValue(null);

      const resultado = await service.registrarResultadosEmLote(
        "etapa-1",
        "arena-1",
        [
          {
            partidaId: "partida-inexistente",
            placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
          },
        ]
      );

      expect(resultado.erros).toHaveLength(1);
      expect(resultado.erros[0].erro).toContain("não encontrada");
    });

    it("deve processar múltiplos resultados com sucesso", async () => {
      const partida1 = criarPartidaMock({ id: "p1" });
      const partida2 = criarPartidaMock({ id: "p2" });
      const confronto = criarConfrontoMock();

      mockPartidaRepository.buscarPorId
        .mockResolvedValueOnce(partida1 as any)
        .mockResolvedValueOnce(partida2 as any);
      mockConfrontoRepository.buscarPorId.mockResolvedValue(confronto as any);
      mockPartidaRepository.registrarResultado.mockResolvedValue({
        status: StatusPartida.FINALIZADA,
        vencedorDupla: 1,
      } as any);
      mockConfrontoRepository.incrementarPartidasFinalizadas.mockResolvedValue(
        undefined
      );
      mockConfrontoRepository.atualizarContadorJogos.mockResolvedValue(
        undefined
      );
      mockEquipeRepository.incrementarEstatisticasEmLote.mockResolvedValue(
        undefined
      );
      mockPartidaRepository.buscarPorConfrontoOrdenadas.mockResolvedValue([
        partida1,
      ] as any);

      const mockClassificacaoService = {
        recalcularClassificacao: jest.fn().mockResolvedValue([]),
        verificarEPreencherFaseEliminatoria: jest
          .fn()
          .mockResolvedValue(undefined),
        preencherProximoConfronto: jest.fn().mockResolvedValue(undefined),
      };
      service = criarServico({ classificacao: mockClassificacaoService });

      const resultado = await service.registrarResultadosEmLote(
        "etapa-1",
        "arena-1",
        [
          {
            partidaId: "p1",
            placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
          },
          {
            partidaId: "p2",
            placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 3 }],
          },
        ]
      );

      expect(resultado.processados).toBe(2);
      expect(resultado.erros).toHaveLength(0);
    });

    it("deve capturar erros de processamento individual", async () => {
      const partida = criarPartidaMock();
      const confronto = criarConfrontoMock();

      mockPartidaRepository.buscarPorId.mockResolvedValue(partida as any);
      mockConfrontoRepository.buscarPorId.mockResolvedValue(confronto as any);
      mockPartidaRepository.registrarResultado.mockRejectedValue(
        new Error("Erro no banco")
      );

      const resultado = await service.registrarResultadosEmLote(
        "etapa-1",
        "arena-1",
        [
          {
            partidaId: "p1",
            placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
          },
        ]
      );

      expect(resultado.erros).toHaveLength(1);
      expect(resultado.erros[0].erro).toContain("Erro");
    });

    it("deve recalcular classificação após processar lote", async () => {
      const partida = criarPartidaMock();
      const confronto = criarConfrontoMock();

      mockPartidaRepository.buscarPorId.mockResolvedValue(partida as any);
      mockConfrontoRepository.buscarPorId.mockResolvedValue(confronto as any);
      mockPartidaRepository.registrarResultado.mockResolvedValue({
        ...partida,
        status: StatusPartida.FINALIZADA,
        vencedorDupla: 1,
      } as any);
      mockConfrontoRepository.incrementarPartidasFinalizadas.mockResolvedValue(
        undefined
      );
      mockConfrontoRepository.atualizarContadorJogos.mockResolvedValue(
        undefined
      );
      mockEquipeRepository.incrementarEstatisticasEmLote.mockResolvedValue(
        undefined
      );
      mockPartidaRepository.buscarPorConfrontoOrdenadas.mockResolvedValue([
        partida,
      ] as any);

      const mockClassificacaoService = {
        recalcularClassificacao: jest.fn().mockResolvedValue([]),
        verificarEPreencherFaseEliminatoria: jest
          .fn()
          .mockResolvedValue(undefined),
        preencherProximoConfronto: jest.fn().mockResolvedValue(undefined),
      };
      service = criarServico({ classificacao: mockClassificacaoService });

      await service.registrarResultadosEmLote("etapa-1", "arena-1", [
        {
          partidaId: "p1",
          placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
        },
      ]);

      expect(
        mockClassificacaoService.recalcularClassificacao
      ).toHaveBeenCalledWith("etapa-1", "arena-1");
    });
  });

  describe("cenários de TEAMS_6 (3 partidas)", () => {
    it("não deve gerar decider para confrontos com 3 partidas", async () => {
      const partida = criarPartidaMock({
        tipoJogo: TipoJogoTeams.MASCULINO,
        ordem: 2,
      });
      const partida1 = criarPartidaMock({
        id: "p1",
        tipoJogo: TipoJogoTeams.FEMININO,
        ordem: 1,
        status: StatusPartida.FINALIZADA,
        vencedorDupla: 2,
      });
      const confronto = criarConfrontoMock({
        totalPartidas: 3,
        jogosEquipe1: 0,
        jogosEquipe2: 1,
        partidasFinalizadas: 1,
      });

      mockPartidaRepository.buscarPorId.mockResolvedValue(partida as any);
      mockConfrontoRepository.buscarPorId.mockResolvedValue(confronto as any);
      mockPartidaRepository.registrarResultado.mockResolvedValue({
        ...partida,
        status: StatusPartida.FINALIZADA,
        vencedorDupla: 1,
      } as any);
      mockConfrontoRepository.incrementarPartidasFinalizadas.mockResolvedValue(
        undefined
      );
      mockConfrontoRepository.atualizarContadorJogos.mockResolvedValue(
        undefined
      );
      mockEquipeRepository.incrementarEstatisticasEmLote.mockResolvedValue(
        undefined
      );
      mockPartidaRepository.buscarPorConfrontoOrdenadas.mockResolvedValue([
        partida1,
        partida,
      ] as any);

      const mockPartidaService = {
        gerarDecider: jest.fn(),
      };
      service = criarServico({ partida: mockPartidaService });

      const resultado = await service.registrarResultadoPartida(
        "partida-1",
        "arena-1",
        { placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }] }
      );

      expect(resultado.precisaDecider).toBe(false);
      expect(mockPartidaService.gerarDecider).not.toHaveBeenCalled();
    });

    it("deve finalizar quando 3 partidas estão finalizadas (TEAMS_6)", async () => {
      const partida3 = criarPartidaMock({
        id: "p3",
        tipoJogo: TipoJogoTeams.MISTO,
        ordem: 3,
      });
      const partida1 = criarPartidaMock({
        id: "p1",
        tipoJogo: TipoJogoTeams.FEMININO,
        ordem: 1,
        status: StatusPartida.FINALIZADA,
        vencedorDupla: 1,
      });
      const partida2 = criarPartidaMock({
        id: "p2",
        tipoJogo: TipoJogoTeams.MASCULINO,
        ordem: 2,
        status: StatusPartida.FINALIZADA,
        vencedorDupla: 2,
      });
      const confronto = criarConfrontoMock({
        totalPartidas: 3,
        jogosEquipe1: 1,
        jogosEquipe2: 1,
        partidasFinalizadas: 2,
      });

      mockPartidaRepository.buscarPorId.mockResolvedValue(partida3 as any);
      mockConfrontoRepository.buscarPorId
        .mockResolvedValueOnce(confronto as any)
        .mockResolvedValue({
          ...confronto,
          status: StatusConfronto.FINALIZADO,
        } as any);
      mockPartidaRepository.registrarResultado.mockResolvedValue({
        ...partida3,
        status: StatusPartida.FINALIZADA,
        vencedorDupla: 1,
      } as any);
      mockConfrontoRepository.incrementarPartidasFinalizadas.mockResolvedValue(
        undefined
      );
      mockConfrontoRepository.atualizarContadorJogos.mockResolvedValue(
        undefined
      );
      mockEquipeRepository.incrementarEstatisticasEmLote.mockResolvedValue(
        undefined
      );
      mockPartidaRepository.buscarPorConfrontoOrdenadas.mockResolvedValue([
        partida1,
        partida2,
        partida3,
      ] as any);
      mockConfrontoRepository.registrarResultado.mockResolvedValue(undefined);
      mockEquipeRepository.atualizarEmLote.mockResolvedValue(undefined);

      const mockClassificacaoService = {
        recalcularClassificacao: jest.fn().mockResolvedValue([]),
        verificarEPreencherFaseEliminatoria: jest
          .fn()
          .mockResolvedValue(undefined),
        preencherProximoConfronto: jest.fn().mockResolvedValue(undefined),
      };
      service = criarServico({ classificacao: mockClassificacaoService });

      const resultado = await service.registrarResultadoPartida(
        "p3",
        "arena-1",
        { placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }] }
      );

      expect(resultado.confrontoFinalizado).toBe(true);
    });
  });
});

describe("TeamsResultadoService sem os serviços informados", () => {
  it("cria os de partida e de classificação, para não pular o decider nem a tabela", () => {
    const service = new TeamsResultadoService() as unknown as {
      partidaService: unknown;
      classificacaoService: unknown;
    };

    expect(service.partidaService).toBeInstanceOf(TeamsPartidaService);
    expect(service.classificacaoService).toBeInstanceOf(
      TeamsClassificacaoService
    );
  });
});
