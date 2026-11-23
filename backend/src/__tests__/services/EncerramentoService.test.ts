/**
 * Testes do EncerramentoService, com os formatos reais
 */

jest.mock("../../utils/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock("../../config/firebase", () => ({
  db: { collection: jest.fn() },
  auth: {},
}));

import { EncerramentoService } from "../../services/EncerramentoService";
import { FormatoTorneio } from "../../services/formatos";
import { DuplaFixaFormato } from "../../services/formatos/DuplaFixaFormato";
import { ReiDaPraiaFormato } from "../../services/formatos/ReiDaPraiaFormato";
import { SuperXFormato } from "../../services/formatos/SuperXFormato";
import { TeamsFormato } from "../../services/formatos/TeamsFormato";
import {
  createMockConfigRepository,
  createMockConfrontoEquipeRepository,
  createMockConfrontoRepository,
  createMockDuplaRepository,
  createMockEquipeRepository,
  createMockEstatisticasRepository,
  createMockEtapaRepository,
  createMockGrupoRepository,
  createMockPartidaReiDaPraiaRepository,
  createMockPartidaRepository,
} from "../mocks/repositories";
import {
  createConfrontoFixture,
  createDuplaFixture,
  createEstatisticasJogadorFixture,
  createEtapaFixture,
  createGrupoFixture,
  StatusEtapa,
  TEST_IDS,
  TipoFase,
} from "../fixtures";
import { FaseEtapa, FormatoEtapa } from "../../models/Etapa";
import { StatusConfronto } from "../../models/Teams";

describe("EncerramentoService", () => {
  let mockEtapaRepository: ReturnType<typeof createMockEtapaRepository>;
  let mockConfigRepository: ReturnType<typeof createMockConfigRepository>;
  let mockEstatisticasRepository: ReturnType<typeof createMockEstatisticasRepository>;
  let mockGrupoRepository: ReturnType<typeof createMockGrupoRepository>;
  let mockDuplaRepository: ReturnType<typeof createMockDuplaRepository>;
  let mockConfrontoRepository: ReturnType<typeof createMockConfrontoRepository>;
  let mockEquipeRepository: ReturnType<typeof createMockEquipeRepository>;
  let mockConfrontoEquipeRepository: ReturnType<typeof createMockConfrontoEquipeRepository>;
  let encerramentoService: EncerramentoService;

  const TEST_ARENA_ID = TEST_IDS.arena;
  const TEST_ETAPA_ID = TEST_IDS.etapa;

  beforeEach(() => {
    jest.clearAllMocks();

    mockEtapaRepository = createMockEtapaRepository();
    mockConfigRepository = createMockConfigRepository();
    mockEstatisticasRepository = createMockEstatisticasRepository();
    mockGrupoRepository = createMockGrupoRepository();
    mockDuplaRepository = createMockDuplaRepository();
    mockConfrontoRepository = createMockConfrontoRepository();
    mockEquipeRepository = createMockEquipeRepository();
    mockConfrontoEquipeRepository = createMockConfrontoEquipeRepository();

    const formatos: Record<FormatoEtapa, FormatoTorneio> = {
      [FormatoEtapa.DUPLA_FIXA]: new DuplaFixaFormato(
        createMockPartidaRepository(),
        mockGrupoRepository,
        mockDuplaRepository,
        mockConfrontoRepository,
        mockEstatisticasRepository
      ),
      [FormatoEtapa.REI_DA_PRAIA]: new ReiDaPraiaFormato(
        createMockPartidaReiDaPraiaRepository(),
        mockGrupoRepository,
        mockDuplaRepository,
        mockConfrontoRepository,
        mockEstatisticasRepository
      ),
      [FormatoEtapa.SUPER_X]: new SuperXFormato(
        createMockPartidaReiDaPraiaRepository(),
        mockGrupoRepository,
        mockEstatisticasRepository
      ),
      [FormatoEtapa.TEAMS]: new TeamsFormato(
        mockConfrontoEquipeRepository,
        mockEquipeRepository,
        mockEstatisticasRepository
      ),
    };

    encerramentoService = new EncerramentoService(
      mockEtapaRepository,
      mockConfigRepository,
      mockEstatisticasRepository,
      (formato = FormatoEtapa.DUPLA_FIXA) => formatos[formato]
    );
  });

  describe("encerrarEtapa", () => {
    it("deve lançar erro se etapa não encontrada", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(null);

      await expect(
        encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Etapa não encontrada");
    });

    it("deve lançar erro se etapa já está finalizada", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.FINALIZADA,
      });
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);

      await expect(
        encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Etapa já está finalizada");
    });

    it("deve lançar erro se não há grupos", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.EM_ANDAMENTO,
      });
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockConfigRepository.buscarPontuacao.mockResolvedValue({
        campeao: 100,
        vice: 70,
        semifinalista: 50,
        quartas: 30,
        oitavas: 20,
        participacao: 10,
      });
      mockGrupoRepository.buscarPorEtapa.mockResolvedValue([]);

      await expect(
        encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Nenhum grupo encontrado para esta etapa");
    });

    describe("cenário grupo único", () => {
      it("deve encerrar etapa com grupo único completo", async () => {
        const etapa = createEtapaFixture({
          status: StatusEtapa.EM_ANDAMENTO,
        });
        const grupo = createGrupoFixture({
          completo: true,
        });
        const duplas = [
          createDuplaFixture({ id: "dupla-1", jogador1Id: "j1", jogador2Id: "j2", posicaoGrupo: 1 }),
          createDuplaFixture({ id: "dupla-2", jogador1Id: "j3", jogador2Id: "j4", posicaoGrupo: 2 }),
        ];

        mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
        mockConfigRepository.buscarPontuacao.mockResolvedValue({
          campeao: 100,
          vice: 70,
          semifinalista: 50,
          quartas: 30,
          oitavas: 20,
          participacao: 10,
        });
        mockGrupoRepository.buscarPorEtapa.mockResolvedValue([grupo]);
        mockDuplaRepository.buscarPorGrupoOrdenado.mockResolvedValue(duplas);
        mockDuplaRepository.buscarPorId.mockImplementation((id: string) =>
          Promise.resolve(duplas.find(d => d.id === id) || null)
        );
        mockEstatisticasRepository.buscarPorJogadorEEtapa.mockResolvedValue(
          createEstatisticasJogadorFixture()
        );
        mockEtapaRepository.definirCampeao.mockResolvedValue(undefined);

        await encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

        expect(mockEtapaRepository.definirCampeao).toHaveBeenCalled();
      });

      it("deve zerar pontos de participação (grupo único) quando darPontosParticipacao=false", async () => {
        const etapa = createEtapaFixture({
          status: StatusEtapa.EM_ANDAMENTO,
          darPontosParticipacao: false,
        });
        const grupo = createGrupoFixture({ completo: true });
        // 5 duplas: as 4 primeiras caem em campeao/vice/semi/quartas, a 5ª
        // cairia em "participacao" (grupo único não tem faixa de oitavas).
        const duplas = Array.from({ length: 5 }, (_, i) =>
          createDuplaFixture({
            id: `dupla-${i + 1}`,
            jogador1Id: `j${i * 2 + 1}`,
            jogador2Id: `j${i * 2 + 2}`,
            posicaoGrupo: i + 1,
          })
        );

        mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
        mockConfigRepository.buscarPontuacao.mockResolvedValue({
          campeao: 100,
          vice: 70,
          semifinalista: 50,
          quartas: 30,
          oitavas: 20,
          participacao: 10,
        });
        mockGrupoRepository.buscarPorEtapa.mockResolvedValue([grupo]);
        mockDuplaRepository.buscarPorGrupoOrdenado.mockResolvedValue(duplas);
        mockDuplaRepository.buscarPorId.mockImplementation((id: string) =>
          Promise.resolve(duplas.find((d) => d.id === id) || null)
        );
        mockEstatisticasRepository.buscarPorJogadorEEtapa.mockImplementation(
          (jogadorId: string) =>
            Promise.resolve(
              createEstatisticasJogadorFixture({ id: `e-${jogadorId}`, jogadorId })
            )
        );
        mockEstatisticasRepository.atualizarPontuacaoEmLote.mockResolvedValue(undefined);
        mockEtapaRepository.definirCampeao.mockResolvedValue(undefined);

        await encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

        const [batch] = mockEstatisticasRepository.atualizarPontuacaoEmLote.mock.calls[0];
        const pontosDupla5 = batch.filter((b: any) =>
          ["e-j9", "e-j10"].includes(b.estatisticaId)
        );
        expect(pontosDupla5).toEqual([
          { estatisticaId: "e-j9", pontos: 0, colocacao: "participacao" },
          { estatisticaId: "e-j10", pontos: 0, colocacao: "participacao" },
        ]);

        const pontosDupla1 = batch.filter((b: any) =>
          ["e-j1", "e-j2"].includes(b.estatisticaId)
        );
        expect(pontosDupla1).toEqual([
          { estatisticaId: "e-j1", pontos: 100, colocacao: "campeao" },
          { estatisticaId: "e-j2", pontos: 100, colocacao: "campeao" },
        ]);
      });

      it("deve lançar erro se grupo único não está completo", async () => {
        const etapa = createEtapaFixture({
          status: StatusEtapa.EM_ANDAMENTO,
        });
        const grupo = createGrupoFixture({
          completo: false,
        });

        mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
        mockConfigRepository.buscarPontuacao.mockResolvedValue({
          campeao: 100,
          vice: 70,
          semifinalista: 50,
          quartas: 30,
          oitavas: 20,
          participacao: 10,
        });
        mockGrupoRepository.buscarPorEtapa.mockResolvedValue([grupo]);

        await expect(
          encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID)
        ).rejects.toThrow("O grupo ainda possui partidas pendentes");
      });

      it("deve lançar erro se não há duplas no grupo único", async () => {
        const etapa = createEtapaFixture({
          status: StatusEtapa.EM_ANDAMENTO,
        });
        const grupo = createGrupoFixture({
          completo: true,
        });

        mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
        mockConfigRepository.buscarPontuacao.mockResolvedValue({
          campeao: 100,
          vice: 70,
          semifinalista: 50,
          quartas: 30,
          oitavas: 20,
          participacao: 10,
        });
        mockGrupoRepository.buscarPorEtapa.mockResolvedValue([grupo]);
        mockDuplaRepository.buscarPorGrupoOrdenado.mockResolvedValue([]);

        await expect(
          encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID)
        ).rejects.toThrow("Nenhuma dupla encontrada no grupo");
      });
    });

    describe("cenário com eliminatória", () => {
      it("deve lançar erro se não há fase eliminatória", async () => {
        const etapa = createEtapaFixture({
          status: StatusEtapa.EM_ANDAMENTO,
        });
        const grupos = [
          createGrupoFixture({ id: "g1" }),
          createGrupoFixture({ id: "g2" }),
        ];

        mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
        mockConfigRepository.buscarPontuacao.mockResolvedValue({
          campeao: 100,
          vice: 70,
          semifinalista: 50,
          quartas: 30,
          oitavas: 20,
          participacao: 10,
        });
        mockGrupoRepository.buscarPorEtapa.mockResolvedValue(grupos);
        mockConfrontoRepository.buscarPorFase.mockResolvedValue([]);

        await expect(
          encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID)
        ).rejects.toThrow("Não há fase eliminatória para esta etapa");
      });

      it("deve lançar erro se a final não está finalizada", async () => {
        const etapa = createEtapaFixture({
          status: StatusEtapa.EM_ANDAMENTO,
        });
        const grupos = [
          createGrupoFixture({ id: "g1" }),
          createGrupoFixture({ id: "g2" }),
        ];
        const confrontoFinal = createConfrontoFixture({
          fase: TipoFase.FINAL,
          status: "agendada" as any,
        });

        mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
        mockConfigRepository.buscarPontuacao.mockResolvedValue({
          campeao: 100,
          vice: 70,
          semifinalista: 50,
          quartas: 30,
          oitavas: 20,
          participacao: 10,
        });
        mockGrupoRepository.buscarPorEtapa.mockResolvedValue(grupos);
        mockConfrontoRepository.buscarPorFase.mockResolvedValue([confrontoFinal]);

        await expect(
          encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID)
        ).rejects.toThrow("A final ainda não foi finalizada");
      });

      it("deve encerrar etapa com eliminatória completa", async () => {
        const etapa = createEtapaFixture({
          status: StatusEtapa.EM_ANDAMENTO,
        });
        const grupos = [
          createGrupoFixture({ id: "g1" }),
          createGrupoFixture({ id: "g2" }),
        ];
        const confrontoFinal = createConfrontoFixture({
          fase: TipoFase.FINAL,
          status: "finalizada" as any,
          vencedoraId: "dupla-campeao",
          vencedoraNome: "Dupla Campeã",
          dupla1Id: "dupla-campeao",
          dupla2Id: "dupla-vice",
        });
        const confrontosSemi = [
          createConfrontoFixture({
            fase: TipoFase.SEMIFINAL,
            status: "finalizada" as any,
            vencedoraId: "dupla-campeao",
            dupla1Id: "dupla-campeao",
            dupla2Id: "dupla-semi1",
          }),
          createConfrontoFixture({
            fase: TipoFase.SEMIFINAL,
            status: "finalizada" as any,
            vencedoraId: "dupla-vice",
            dupla1Id: "dupla-vice",
            dupla2Id: "dupla-semi2",
          }),
        ];
        const duplasNaoClassificadas = [
          createDuplaFixture({ id: "dupla-nc1", classificada: false }),
        ];

        mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
        mockConfigRepository.buscarPontuacao.mockResolvedValue({
          campeao: 100,
          vice: 70,
          semifinalista: 50,
          quartas: 30,
          oitavas: 20,
          participacao: 10,
        });
        mockGrupoRepository.buscarPorEtapa.mockResolvedValue(grupos);
        mockConfrontoRepository.buscarPorFase.mockResolvedValue([confrontoFinal]);
        mockConfrontoRepository.buscarFinalizadosPorFase
          .mockResolvedValueOnce(confrontosSemi) // semifinal
          .mockResolvedValueOnce([]) // quartas
          .mockResolvedValueOnce([]); // oitavas
        mockDuplaRepository.buscarPorEtapa.mockResolvedValue(duplasNaoClassificadas);
        mockDuplaRepository.buscarPorId.mockImplementation((id: string) =>
          Promise.resolve(createDuplaFixture({ id, jogador1Id: `j1-${id}`, jogador2Id: `j2-${id}` }))
        );
        mockEstatisticasRepository.buscarPorJogadorEEtapa.mockResolvedValue(
          createEstatisticasJogadorFixture()
        );
        mockEtapaRepository.definirCampeao.mockResolvedValue(undefined);

        await encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

        expect(mockEtapaRepository.definirCampeao).toHaveBeenCalledWith(
          TEST_ETAPA_ID,
          "dupla-campeao",
          "Dupla Campeã"
        );
      });

      it("deve zerar pontos das duplas não classificadas quando darPontosParticipacao=false", async () => {
        const etapa = createEtapaFixture({
          status: StatusEtapa.EM_ANDAMENTO,
          darPontosParticipacao: false,
        });
        const grupos = [
          createGrupoFixture({ id: "g1" }),
          createGrupoFixture({ id: "g2" }),
        ];
        const confrontoFinal = createConfrontoFixture({
          fase: TipoFase.FINAL,
          status: "finalizada" as any,
          vencedoraId: "dupla-campeao",
          vencedoraNome: "Dupla Campeã",
          dupla1Id: "dupla-campeao",
          dupla2Id: "dupla-vice",
        });
        const confrontosSemi = [
          createConfrontoFixture({
            fase: TipoFase.SEMIFINAL,
            status: "finalizada" as any,
            vencedoraId: "dupla-campeao",
            dupla1Id: "dupla-campeao",
            dupla2Id: "dupla-semi1",
          }),
          createConfrontoFixture({
            fase: TipoFase.SEMIFINAL,
            status: "finalizada" as any,
            vencedoraId: "dupla-vice",
            dupla1Id: "dupla-vice",
            dupla2Id: "dupla-semi2",
          }),
        ];
        const duplasNaoClassificadas = [
          createDuplaFixture({
            id: "dupla-nc1",
            classificada: false,
            jogador1Id: "j-nc1-a",
            jogador2Id: "j-nc1-b",
          }),
        ];

        mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
        mockConfigRepository.buscarPontuacao.mockResolvedValue({
          campeao: 100,
          vice: 70,
          semifinalista: 50,
          quartas: 30,
          oitavas: 20,
          participacao: 10,
        });
        mockGrupoRepository.buscarPorEtapa.mockResolvedValue(grupos);
        mockConfrontoRepository.buscarPorFase.mockResolvedValue([confrontoFinal]);
        mockConfrontoRepository.buscarFinalizadosPorFase
          .mockResolvedValueOnce(confrontosSemi)
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([]);
        mockDuplaRepository.buscarPorEtapa.mockResolvedValue(duplasNaoClassificadas);
        mockDuplaRepository.buscarPorId.mockImplementation((id: string) =>
          Promise.resolve(
            duplasNaoClassificadas.find((d) => d.id === id) ||
              createDuplaFixture({ id, jogador1Id: `j1-${id}`, jogador2Id: `j2-${id}` })
          )
        );
        mockEstatisticasRepository.buscarPorJogadorEEtapa.mockImplementation(
          (jogadorId: string) =>
            Promise.resolve(
              createEstatisticasJogadorFixture({ id: `e-${jogadorId}`, jogadorId })
            )
        );
        mockEstatisticasRepository.atualizarPontuacaoEmLote.mockResolvedValue(undefined);
        mockEtapaRepository.definirCampeao.mockResolvedValue(undefined);

        await encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

        const [batch] = mockEstatisticasRepository.atualizarPontuacaoEmLote.mock.calls[0];
        const pontosNaoClassificada = batch.filter((b: any) =>
          ["e-j-nc1-a", "e-j-nc1-b"].includes(b.estatisticaId)
        );
        expect(pontosNaoClassificada).toEqual([
          { estatisticaId: "e-j-nc1-a", pontos: 0, colocacao: "participacao" },
          { estatisticaId: "e-j-nc1-b", pontos: 0, colocacao: "participacao" },
        ]);

        const pontosCampeao = batch.filter((b: any) =>
          ["e-j1-dupla-campeao", "e-j2-dupla-campeao"].includes(b.estatisticaId)
        );
        expect(pontosCampeao).toEqual([
          { estatisticaId: "e-j1-dupla-campeao", pontos: 100, colocacao: "campeao" },
          { estatisticaId: "e-j2-dupla-campeao", pontos: 100, colocacao: "campeao" },
        ]);
      });

      it("deve atribuir pontos para quartas e oitavas", async () => {
        const etapa = createEtapaFixture({
          status: StatusEtapa.EM_ANDAMENTO,
        });
        const grupos = [
          createGrupoFixture({ id: "g1" }),
          createGrupoFixture({ id: "g2" }),
        ];
        const confrontoFinal = createConfrontoFixture({
          fase: TipoFase.FINAL,
          status: "finalizada" as any,
          vencedoraId: "dupla-campeao",
          vencedoraNome: "Dupla Campeã",
          dupla1Id: "dupla-campeao",
          dupla2Id: "dupla-vice",
        });
        const confrontosQuartas = [
          createConfrontoFixture({
            fase: TipoFase.QUARTAS,
            status: "finalizada" as any,
            vencedoraId: "dupla-q1",
            dupla1Id: "dupla-q1",
            dupla2Id: "dupla-q1-perdedor",
          }),
        ];
        const confrontosOitavas = [
          createConfrontoFixture({
            fase: TipoFase.OITAVAS,
            status: "finalizada" as any,
            vencedoraId: "dupla-o1",
            dupla1Id: "dupla-o1",
            dupla2Id: "dupla-o1-perdedor",
          }),
        ];

        mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
        mockConfigRepository.buscarPontuacao.mockResolvedValue({
          campeao: 100,
          vice: 70,
          semifinalista: 50,
          quartas: 30,
          oitavas: 20,
          participacao: 10,
        });
        mockGrupoRepository.buscarPorEtapa.mockResolvedValue(grupos);
        mockConfrontoRepository.buscarPorFase.mockResolvedValue([confrontoFinal]);
        mockConfrontoRepository.buscarFinalizadosPorFase
          .mockResolvedValueOnce([]) // semifinal
          .mockResolvedValueOnce(confrontosQuartas) // quartas
          .mockResolvedValueOnce(confrontosOitavas); // oitavas
        mockDuplaRepository.buscarPorEtapa.mockResolvedValue([]);
        mockDuplaRepository.buscarPorId.mockImplementation((id: string) =>
          Promise.resolve(createDuplaFixture({ id, jogador1Id: `j1-${id}`, jogador2Id: `j2-${id}` }))
        );
        mockEstatisticasRepository.buscarPorJogadorEEtapa.mockResolvedValue(
          createEstatisticasJogadorFixture()
        );
        mockEtapaRepository.definirCampeao.mockResolvedValue(undefined);

        await encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

        // Verificar que buscarFinalizadosPorFase foi chamado para quartas e oitavas
        expect(mockConfrontoRepository.buscarFinalizadosPorFase).toHaveBeenCalledWith(
          TEST_ETAPA_ID,
          TEST_ARENA_ID,
          TipoFase.QUARTAS
        );
        expect(mockConfrontoRepository.buscarFinalizadosPorFase).toHaveBeenCalledWith(
          TEST_ETAPA_ID,
          TEST_ARENA_ID,
          TipoFase.OITAVAS
        );
      });
    });

    describe("atribuição de pontos", () => {
      it("deve lidar com dupla não encontrada ao atribuir pontos", async () => {
        const etapa = createEtapaFixture({
          status: StatusEtapa.EM_ANDAMENTO,
        });
        const grupo = createGrupoFixture({
          completo: true,
        });
        const duplas = [
          createDuplaFixture({ id: "dupla-1" }),
        ];

        mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
        mockConfigRepository.buscarPontuacao.mockResolvedValue({
          campeao: 100,
          vice: 70,
          semifinalista: 50,
          quartas: 30,
          oitavas: 20,
          participacao: 10,
        });
        mockGrupoRepository.buscarPorEtapa.mockResolvedValue([grupo]);
        mockDuplaRepository.buscarPorGrupoOrdenado.mockResolvedValue(duplas);
        mockDuplaRepository.buscarPorId.mockResolvedValue(null); // Dupla não encontrada
        mockEstatisticasRepository.buscarPorJogadorEEtapa.mockResolvedValue(null);
        mockEstatisticasRepository.atualizarPontuacaoEmLote.mockResolvedValue(undefined);
        mockEtapaRepository.definirCampeao.mockResolvedValue(undefined);

        // Não deve lançar erro, apenas logar warning
        await encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

        expect(mockEtapaRepository.definirCampeao).toHaveBeenCalled();
      });

      it("deve lidar com estatísticas não encontradas ao atribuir pontos", async () => {
        const etapa = createEtapaFixture({
          status: StatusEtapa.EM_ANDAMENTO,
        });
        const grupo = createGrupoFixture({
          completo: true,
        });
        const duplas = [
          createDuplaFixture({ id: "dupla-1", jogador1Id: "j1", jogador2Id: "j2" }),
        ];

        mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
        mockConfigRepository.buscarPontuacao.mockResolvedValue({
          campeao: 100,
          vice: 70,
          semifinalista: 50,
          quartas: 30,
          oitavas: 20,
          participacao: 10,
        });
        mockGrupoRepository.buscarPorEtapa.mockResolvedValue([grupo]);
        mockDuplaRepository.buscarPorGrupoOrdenado.mockResolvedValue(duplas);
        mockDuplaRepository.buscarPorId.mockResolvedValue(duplas[0]);
        mockEstatisticasRepository.buscarPorJogadorEEtapa.mockResolvedValue(null);
        mockEtapaRepository.definirCampeao.mockResolvedValue(undefined);

        // Não deve lançar erro, apenas logar warning
        await encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

        expect(mockEtapaRepository.definirCampeao).toHaveBeenCalled();
      });
    });
  });

  describe("encerrarEtapa - formato TEAMS", () => {
    it("deve encerrar etapa TEAMS com sucesso", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.EM_ANDAMENTO,
        formato: FormatoEtapa.TEAMS,
        contaPontosRanking: true,
      });

      const equipes = [
        {
          id: "eq1",
          nome: "Equipe Campeã",
          jogadores: [
            { id: "j1", nome: "Jogador 1" },
            { id: "j2", nome: "Jogador 2" },
          ],
        },
        {
          id: "eq2",
          nome: "Equipe Vice",
          jogadores: [
            { id: "j3", nome: "Jogador 3" },
            { id: "j4", nome: "Jogador 4" },
          ],
        },
      ];

      const confrontos = [
        { id: "c1", status: StatusConfronto.FINALIZADO },
      ];

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockConfigRepository.buscarPontuacao.mockResolvedValue({
        campeao: 100,
        vice: 70,
        semifinalista: 50,
        quartas: 30,
        oitavas: 20,
        participacao: 10,
      });
      mockConfrontoEquipeRepository.buscarPorEtapa.mockResolvedValue(confrontos);
      mockEquipeRepository.buscarPorClassificacao.mockResolvedValue(equipes);
      mockEstatisticasRepository.buscarPorJogadorEEtapa.mockResolvedValue(
        createEstatisticasJogadorFixture()
      );
      mockEstatisticasRepository.atualizarPontuacaoEmLote.mockResolvedValue(undefined);
      mockEquipeRepository.atualizarPosicoesEmLote.mockResolvedValue(undefined);
      mockEtapaRepository.definirCampeao.mockResolvedValue(undefined);

      await encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(mockEtapaRepository.definirCampeao).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        "eq1",
        "Equipe Campeã"
      );
    });

    it("deve zerar pontos de participação para equipes fora da colocação quando darPontosParticipacao=false", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.EM_ANDAMENTO,
        formato: FormatoEtapa.TEAMS,
        contaPontosRanking: true,
        darPontosParticipacao: false,
      });

      // 6 equipes: as 5 primeiras caem nas faixas campeao/vice/semi/quartas/oitavas,
      // a 6ª cairia em "participacao" — é essa que precisa ficar com 0 pontos.
      const equipes = Array.from({ length: 6 }, (_, i) => ({
        id: `eq${i + 1}`,
        nome: `Equipe ${i + 1}`,
        jogadores: [
          { id: `j${i * 2 + 1}`, nome: `Jogador ${i * 2 + 1}` },
          { id: `j${i * 2 + 2}`, nome: `Jogador ${i * 2 + 2}` },
        ],
      }));

      const confrontos = [{ id: "c1", status: StatusConfronto.FINALIZADO }];

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockConfigRepository.buscarPontuacao.mockResolvedValue({
        campeao: 100,
        vice: 70,
        semifinalista: 50,
        quartas: 30,
        oitavas: 20,
        participacao: 10,
      });
      mockConfrontoEquipeRepository.buscarPorEtapa.mockResolvedValue(confrontos);
      mockEquipeRepository.buscarPorClassificacao.mockResolvedValue(equipes);
      mockEstatisticasRepository.buscarPorJogadorEEtapa.mockImplementation(
        (jogadorId: string) =>
          Promise.resolve(
            createEstatisticasJogadorFixture({ id: `e-${jogadorId}`, jogadorId })
          )
      );
      mockEstatisticasRepository.atualizarPontuacaoEmLote.mockResolvedValue(undefined);
      mockEquipeRepository.atualizarPosicoesEmLote.mockResolvedValue(undefined);
      mockEtapaRepository.definirCampeao.mockResolvedValue(undefined);

      await encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

      const [batch] = mockEstatisticasRepository.atualizarPontuacaoEmLote.mock.calls[0];
      const pontosEquipe6 = batch.filter((b: any) =>
        ["e-j11", "e-j12"].includes(b.estatisticaId)
      );
      expect(pontosEquipe6).toEqual([
        { estatisticaId: "e-j11", pontos: 0, colocacao: "participacao" },
        { estatisticaId: "e-j12", pontos: 0, colocacao: "participacao" },
      ]);

      // Campeão continua recebendo os pontos normalmente — o toggle só afeta participação
      const pontosEquipe1 = batch.filter((b: any) =>
        ["e-j1", "e-j2"].includes(b.estatisticaId)
      );
      expect(pontosEquipe1).toEqual([
        { estatisticaId: "e-j1", pontos: 100, colocacao: "campeao" },
        { estatisticaId: "e-j2", pontos: 100, colocacao: "campeao" },
      ]);
    });

    it("deve lançar erro se não há confrontos TEAMS", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.EM_ANDAMENTO,
        formato: FormatoEtapa.TEAMS,
      });

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockConfigRepository.buscarPontuacao.mockResolvedValue({
        campeao: 100,
        vice: 70,
        semifinalista: 50,
        quartas: 30,
        oitavas: 20,
        participacao: 10,
      });
      mockConfrontoEquipeRepository.buscarPorEtapa.mockResolvedValue([]);

      await expect(
        encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Nenhum confronto encontrado para esta etapa");
    });

    it("deve lançar erro se há confrontos pendentes TEAMS", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.EM_ANDAMENTO,
        formato: FormatoEtapa.TEAMS,
      });

      const confrontos = [
        { id: "c1", status: StatusConfronto.AGENDADO },
      ];

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockConfigRepository.buscarPontuacao.mockResolvedValue({
        campeao: 100,
        vice: 70,
        semifinalista: 50,
        quartas: 30,
        oitavas: 20,
        participacao: 10,
      });
      mockConfrontoEquipeRepository.buscarPorEtapa.mockResolvedValue(confrontos);

      await expect(
        encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Ainda há 1 confronto(s) pendente(s)");
    });

    it("deve lançar erro se não há equipes TEAMS", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.EM_ANDAMENTO,
        formato: FormatoEtapa.TEAMS,
      });

      const confrontos = [{ id: "c1", status: StatusConfronto.FINALIZADO }];

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockConfigRepository.buscarPontuacao.mockResolvedValue({
        campeao: 100,
        vice: 70,
        semifinalista: 50,
        quartas: 30,
        oitavas: 20,
        participacao: 10,
      });
      mockConfrontoEquipeRepository.buscarPorEtapa.mockResolvedValue(confrontos);
      mockEquipeRepository.buscarPorClassificacao.mockResolvedValue([]);

      await expect(
        encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Nenhuma equipe encontrada para esta etapa");
    });

    it("deve pular atribuição de pontos se etapa não conta no ranking", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.EM_ANDAMENTO,
        formato: FormatoEtapa.TEAMS,
        contaPontosRanking: false,
      });

      const equipes = [
        {
          id: "eq1",
          nome: "Equipe Campeã",
          jogadores: [{ id: "j1", nome: "Jogador 1" }],
        },
      ];

      const confrontos = [{ id: "c1", status: StatusConfronto.FINALIZADO }];

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockConfigRepository.buscarPontuacao.mockResolvedValue({
        campeao: 100,
        vice: 70,
        semifinalista: 50,
        quartas: 30,
        oitavas: 20,
        participacao: 10,
      });
      mockConfrontoEquipeRepository.buscarPorEtapa.mockResolvedValue(confrontos);
      mockEquipeRepository.buscarPorClassificacao.mockResolvedValue(equipes);
      mockEtapaRepository.definirCampeao.mockResolvedValue(undefined);

      await encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(mockEstatisticasRepository.atualizarPontuacaoEmLote).not.toHaveBeenCalled();
      expect(mockEtapaRepository.definirCampeao).toHaveBeenCalled();
    });
  });

  describe("encerrarEtapa - TEAMS com eliminatória", () => {
    const pontuacao = {
      campeao: 100,
      vice: 70,
      semifinalista: 50,
      quartas: 30,
      oitavas: 20,
      participacao: 10,
    };
    const confronto = (
      fase: FaseEtapa,
      equipe1Id: string,
      equipe2Id: string,
      vencedoraId?: string
    ) => ({
      fase,
      equipe1Id,
      equipe2Id,
      vencedoraId,
      status: StatusConfronto.FINALIZADO,
    });

    // Ordem da tabela: a líder perdeu a final, a lanterna nem se classificou
    const tabela = ["lider", "c", "d", "campea", "e", "fora"];

    const preparar = (confrontos: object[], dados = {}) => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(
        createEtapaFixture({
          status: StatusEtapa.EM_ANDAMENTO,
          formato: FormatoEtapa.TEAMS,
          ...dados,
        })
      );
      mockConfigRepository.buscarPontuacao.mockResolvedValue(pontuacao);
      mockConfrontoEquipeRepository.buscarPorEtapa.mockResolvedValue(confrontos);
      mockEquipeRepository.buscarPorClassificacao.mockResolvedValue(
        tabela.map((id) => ({
          id,
          nome: id.toUpperCase(),
          jogadores: [{ id: `${id}-1` }, { id: `${id}-2` }],
        }))
      );
      mockEstatisticasRepository.buscarPorJogadorEEtapa.mockImplementation(
        async (jogadorId: string) => ({ id: `est-${jogadorId}`, jogadorId })
      );
    };

    const { GRUPOS, OITAVAS, QUARTAS, SEMIFINAL, FINAL } = FaseEtapa;
    const eliminatoria = [
      confronto(GRUPOS, "lider", "fora", "lider"),
      confronto(QUARTAS, "c", "e", "c"),
      confronto(QUARTAS, "campea", "BYE", "campea"),
      confronto(SEMIFINAL, "lider", "c", "lider"),
      confronto(SEMIFINAL, "d", "campea", "campea"),
      confronto(FINAL, "lider", "campea", "campea"),
    ];

    it("campeã é quem vence a final, mesmo com menos pontos na tabela", async () => {
      preparar(eliminatoria);

      await encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(mockEtapaRepository.definirCampeao).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        "campea",
        "CAMPEA"
      );
    });

    it("cada equipe pontua pela fase em que parou, nos dois jogadores", async () => {
      preparar(eliminatoria);

      await encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

      const [gravadas] =
        mockEstatisticasRepository.atualizarPontuacaoEmLote.mock.calls[0];
      const de = (equipe: string) =>
        [1, 2].map((n) => {
          const { colocacao, pontos } = gravadas.find(
            (g: { estatisticaId: string }) =>
              g.estatisticaId === `est-${equipe}-${n}`
          );
          return `${colocacao} ${pontos}`;
        });

      expect(gravadas).toHaveLength(12);
      expect(de("campea")).toEqual(["campeao 100", "campeao 100"]);
      expect(de("lider")).toEqual(["vice 70", "vice 70"]);
      expect(de("c")).toEqual(["semifinalista 50", "semifinalista 50"]);
      expect(de("d")).toEqual(["semifinalista 50", "semifinalista 50"]);
      expect(de("e")).toEqual(["quartas 30", "quartas 30"]);
      expect(de("fora")).toEqual(["participacao 10", "participacao 10"]);
    });

    it("quem para nas oitavas pontua oitavas", async () => {
      preparar([...eliminatoria, confronto(OITAVAS, "e", "fora", "e")]);

      await encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(
        mockEstatisticasRepository.atualizarPontuacaoEmLote.mock.calls[0][0]
      ).toContainEqual({
        estatisticaId: "est-fora-1",
        colocacao: "oitavas",
        pontos: 20,
      });
    });

    it("sem pontos de participação, só quem não se classificou fica com zero", async () => {
      preparar(eliminatoria, { darPontosParticipacao: false });

      await encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

      const zerados = mockEstatisticasRepository.atualizarPontuacaoEmLote.mock.calls[0][0]
        .filter((g: { pontos: number }) => g.pontos === 0)
        .map((g: { estatisticaId: string }) => g.estatisticaId);
      expect(zerados).toEqual(["est-fora-1", "est-fora-2"]);
    });

    it("não encerra com a final sem vencedora", async () => {
      preparar([confronto(FINAL, "lider", "campea")]);

      await expect(
        encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("A final ainda não foi finalizada");
      expect(mockEtapaRepository.definirCampeao).not.toHaveBeenCalled();
    });
  });

  describe("encerrarEtapa - formato SUPER_X", () => {
    it("deve encerrar etapa SUPER_X com sucesso", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.EM_ANDAMENTO,
        formato: FormatoEtapa.SUPER_X,
        contaPontosRanking: true,
      });

      const grupo = createGrupoFixture({ completo: true });
      const jogadores = [
        createEstatisticasJogadorFixture({
          id: "e1",
          jogadorId: "j1",
          jogadorNome: "Campeão",
          posicaoGrupo: 1,
        }),
        createEstatisticasJogadorFixture({
          id: "e2",
          jogadorId: "j2",
          jogadorNome: "Vice",
          posicaoGrupo: 2,
        }),
      ];

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockConfigRepository.buscarPontuacao.mockResolvedValue({
        campeao: 100,
        vice: 70,
        semifinalista: 50,
        quartas: 30,
        oitavas: 20,
        participacao: 10,
      });
      mockGrupoRepository.buscarPorEtapa.mockResolvedValue([grupo]);
      mockEstatisticasRepository.buscarPorGrupoOrdenado.mockResolvedValue(jogadores);
      mockEstatisticasRepository.atualizarPontuacaoEmLote.mockResolvedValue(undefined);
      mockEtapaRepository.definirCampeao.mockResolvedValue(undefined);

      await encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(mockEtapaRepository.definirCampeao).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        "j1",
        "Campeão"
      );
    });

    it("deve atribuir pontos por posição (Super 12) — sem fase eliminatória, cada posição tem sua própria pontuação", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.EM_ANDAMENTO,
        formato: FormatoEtapa.SUPER_X,
        contaPontosRanking: true,
      });

      const grupo = createGrupoFixture({ completo: true });
      const jogadores = Array.from({ length: 12 }, (_, i) =>
        createEstatisticasJogadorFixture({
          id: `e${i + 1}`,
          jogadorId: `j${i + 1}`,
          jogadorNome: `Jogador ${i + 1}`,
          posicaoGrupo: i + 1,
        })
      );

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockConfigRepository.buscarPontuacao.mockResolvedValue({
        campeao: 100,
        vice: 70,
        semifinalista: 50,
        quartas: 30,
        oitavas: 20,
        participacao: 10,
      });
      mockGrupoRepository.buscarPorEtapa.mockResolvedValue([grupo]);
      mockEstatisticasRepository.buscarPorGrupoOrdenado.mockResolvedValue(jogadores);
      mockEstatisticasRepository.atualizarPontuacaoEmLote.mockResolvedValue(undefined);
      mockEtapaRepository.definirCampeao.mockResolvedValue(undefined);

      await encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

      // Tabela combinada com o usuário: 1º ao 12º, independente dos valores
      // de campeao/vice/etc configurados em config/global (Super X tem sua
      // própria tabela fixa, ver SUPER_X_PONTOS_POR_POSICAO).
      expect(mockEstatisticasRepository.atualizarPontuacaoEmLote).toHaveBeenCalledWith([
        { estatisticaId: "e1", pontos: 100, colocacao: "campeao" },
        { estatisticaId: "e2", pontos: 92, colocacao: "vice" },
        { estatisticaId: "e3", pontos: 84, colocacao: "3o_lugar" },
        { estatisticaId: "e4", pontos: 76, colocacao: "4o_lugar" },
        { estatisticaId: "e5", pontos: 64, colocacao: "5o_lugar" },
        { estatisticaId: "e6", pontos: 56, colocacao: "6o_lugar" },
        { estatisticaId: "e7", pontos: 48, colocacao: "7o_lugar" },
        { estatisticaId: "e8", pontos: 40, colocacao: "8o_lugar" },
        { estatisticaId: "e9", pontos: 32, colocacao: "9o_lugar" },
        { estatisticaId: "e10", pontos: 24, colocacao: "10o_lugar" },
        { estatisticaId: "e11", pontos: 16, colocacao: "11o_lugar" },
        { estatisticaId: "e12", pontos: 10, colocacao: "12o_lugar" },
      ]);
    });

    it("deve atribuir pontos por posição (Super 8) — último colocado fica com 40 pontos, não com o piso de 10", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.EM_ANDAMENTO,
        formato: FormatoEtapa.SUPER_X,
        contaPontosRanking: true,
      });

      const grupo = createGrupoFixture({ completo: true });
      const jogadores = Array.from({ length: 8 }, (_, i) =>
        createEstatisticasJogadorFixture({
          id: `e${i + 1}`,
          jogadorId: `j${i + 1}`,
          jogadorNome: `Jogador ${i + 1}`,
          posicaoGrupo: i + 1,
        })
      );

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockConfigRepository.buscarPontuacao.mockResolvedValue({
        campeao: 100,
        vice: 70,
        semifinalista: 50,
        quartas: 30,
        oitavas: 20,
        participacao: 10,
      });
      mockGrupoRepository.buscarPorEtapa.mockResolvedValue([grupo]);
      mockEstatisticasRepository.buscarPorGrupoOrdenado.mockResolvedValue(jogadores);
      mockEstatisticasRepository.atualizarPontuacaoEmLote.mockResolvedValue(undefined);
      mockEtapaRepository.definirCampeao.mockResolvedValue(undefined);

      await encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(mockEstatisticasRepository.atualizarPontuacaoEmLote).toHaveBeenCalledWith([
        { estatisticaId: "e1", pontos: 100, colocacao: "campeao" },
        { estatisticaId: "e2", pontos: 92, colocacao: "vice" },
        { estatisticaId: "e3", pontos: 84, colocacao: "3o_lugar" },
        { estatisticaId: "e4", pontos: 76, colocacao: "4o_lugar" },
        { estatisticaId: "e5", pontos: 64, colocacao: "5o_lugar" },
        { estatisticaId: "e6", pontos: 56, colocacao: "6o_lugar" },
        { estatisticaId: "e7", pontos: 48, colocacao: "7o_lugar" },
        { estatisticaId: "e8", pontos: 40, colocacao: "8o_lugar" },
      ]);
    });

    it("deve lançar erro se grupo SUPER_X não está completo", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.EM_ANDAMENTO,
        formato: FormatoEtapa.SUPER_X,
      });

      const grupo = createGrupoFixture({ completo: false });

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockConfigRepository.buscarPontuacao.mockResolvedValue({
        campeao: 100,
        vice: 70,
        semifinalista: 50,
        quartas: 30,
        oitavas: 20,
        participacao: 10,
      });
      mockGrupoRepository.buscarPorEtapa.mockResolvedValue([grupo]);

      await expect(
        encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("O grupo ainda possui partidas pendentes");
    });

    it("deve lançar erro se não há jogadores no grupo SUPER_X", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.EM_ANDAMENTO,
        formato: FormatoEtapa.SUPER_X,
      });

      const grupo = createGrupoFixture({ completo: true });

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockConfigRepository.buscarPontuacao.mockResolvedValue({
        campeao: 100,
        vice: 70,
        semifinalista: 50,
        quartas: 30,
        oitavas: 20,
        participacao: 10,
      });
      mockGrupoRepository.buscarPorEtapa.mockResolvedValue([grupo]);
      mockEstatisticasRepository.buscarPorGrupoOrdenado.mockResolvedValue([]);

      await expect(
        encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Nenhum jogador encontrado no grupo");
    });

    it("deve pular atribuição de pontos se SUPER_X não conta no ranking", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.EM_ANDAMENTO,
        formato: FormatoEtapa.SUPER_X,
        contaPontosRanking: false,
      });

      const grupo = createGrupoFixture({ completo: true });
      const jogadores = [
        createEstatisticasJogadorFixture({
          id: "e1",
          jogadorId: "j1",
          jogadorNome: "Campeão",
        }),
      ];

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockConfigRepository.buscarPontuacao.mockResolvedValue({
        campeao: 100,
        vice: 70,
        semifinalista: 50,
        quartas: 30,
        oitavas: 20,
        participacao: 10,
      });
      mockGrupoRepository.buscarPorEtapa.mockResolvedValue([grupo]);
      mockEstatisticasRepository.buscarPorGrupoOrdenado.mockResolvedValue(jogadores);
      mockEtapaRepository.definirCampeao.mockResolvedValue(undefined);

      await encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(mockEstatisticasRepository.atualizarPontuacaoEmLote).not.toHaveBeenCalled();
      expect(mockEtapaRepository.definirCampeao).toHaveBeenCalled();
    });
  });

  describe("encerrarEtapa - formato REI_DA_PRAIA", () => {
    it("deve lançar erro se não há fase eliminatória", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.EM_ANDAMENTO,
        formato: FormatoEtapa.REI_DA_PRAIA,
      });
      const grupos = [createGrupoFixture({ id: "g1" })];

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockConfigRepository.buscarPontuacao.mockResolvedValue({
        campeao: 100,
        vice: 70,
        semifinalista: 50,
        quartas: 30,
        oitavas: 20,
        participacao: 10,
      });
      mockGrupoRepository.buscarPorEtapa.mockResolvedValue(grupos);
      mockConfrontoRepository.buscarPorFase.mockResolvedValue([]);

      await expect(
        encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Não há fase eliminatória para esta etapa");
    });

    it("deve lançar erro se a final não está finalizada", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.EM_ANDAMENTO,
        formato: FormatoEtapa.REI_DA_PRAIA,
      });
      const grupos = [createGrupoFixture({ id: "g1" })];
      const confrontoFinal = createConfrontoFixture({
        fase: TipoFase.FINAL,
        status: "agendada" as any,
      });

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockConfigRepository.buscarPontuacao.mockResolvedValue({
        campeao: 100,
        vice: 70,
        semifinalista: 50,
        quartas: 30,
        oitavas: 20,
        participacao: 10,
      });
      mockGrupoRepository.buscarPorEtapa.mockResolvedValue(grupos);
      mockConfrontoRepository.buscarPorFase.mockResolvedValue([confrontoFinal]);

      await expect(
        encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("A final ainda não foi finalizada");
    });

    it("deve atribuir pontos de participação para quem jogou os grupos mas não chegou na eliminatória", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.EM_ANDAMENTO,
        formato: FormatoEtapa.REI_DA_PRAIA,
        contaPontosRanking: true,
      });
      const grupos = [createGrupoFixture({ id: "g1" })];

      const confrontoFinal = createConfrontoFixture({
        fase: TipoFase.FINAL,
        status: "finalizada" as any,
        vencedoraId: "dupla-campeao",
        vencedoraNome: "Campeão A & Campeão B",
        dupla1Id: "dupla-campeao",
        dupla2Id: "dupla-vice",
      });

      // Duplas só existem para quem chegou na eliminatória (comportamento real do Rei da Praia)
      const duplasEliminatoria: Record<string, ReturnType<typeof createDuplaFixture>> = {
        "dupla-campeao": createDuplaFixture({
          id: "dupla-campeao",
          jogador1Id: "j-campeao-a",
          jogador1Nome: "Campeão A",
          jogador2Id: "j-campeao-b",
          jogador2Nome: "Campeão B",
        }),
        "dupla-vice": createDuplaFixture({
          id: "dupla-vice",
          jogador1Id: "j-vice-a",
          jogador1Nome: "Vice A",
          jogador2Id: "j-vice-b",
          jogador2Nome: "Vice B",
        }),
      };

      // Roster completo da etapa: 2 jogadores da eliminatória + 2 que só jogaram os grupos
      const todosJogadores = [
        createEstatisticasJogadorFixture({ id: "e-campeao-a", jogadorId: "j-campeao-a" }),
        createEstatisticasJogadorFixture({ id: "e-campeao-b", jogadorId: "j-campeao-b" }),
        createEstatisticasJogadorFixture({ id: "e-vice-a", jogadorId: "j-vice-a" }),
        createEstatisticasJogadorFixture({ id: "e-vice-b", jogadorId: "j-vice-b" }),
        createEstatisticasJogadorFixture({ id: "e-grupo-1", jogadorId: "j-so-grupo-1" }),
        createEstatisticasJogadorFixture({ id: "e-grupo-2", jogadorId: "j-so-grupo-2" }),
      ];

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockConfigRepository.buscarPontuacao.mockResolvedValue({
        campeao: 100,
        vice: 70,
        semifinalista: 50,
        quartas: 30,
        oitavas: 20,
        participacao: 10,
      });
      mockGrupoRepository.buscarPorEtapa.mockResolvedValue(grupos);
      mockConfrontoRepository.buscarPorFase.mockResolvedValue([confrontoFinal]);
      mockConfrontoRepository.buscarFinalizadosPorFase
        .mockResolvedValueOnce([]) // semifinal
        .mockResolvedValueOnce([]) // quartas
        .mockResolvedValueOnce([]); // oitavas
      mockEstatisticasRepository.buscarPorEtapa.mockResolvedValue(todosJogadores);
      mockDuplaRepository.buscarPorId.mockImplementation((id: string) =>
        Promise.resolve(duplasEliminatoria[id] || null)
      );
      mockEstatisticasRepository.atualizarPontuacaoEmLote.mockResolvedValue(undefined);
      mockEtapaRepository.definirCampeao.mockResolvedValue(undefined);

      await encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(mockEstatisticasRepository.atualizarPontuacaoEmLote).toHaveBeenCalledWith(
        expect.arrayContaining([
          { estatisticaId: "e-campeao-a", pontos: 100, colocacao: "campeao" },
          { estatisticaId: "e-campeao-b", pontos: 100, colocacao: "campeao" },
          { estatisticaId: "e-vice-a", pontos: 70, colocacao: "vice" },
          { estatisticaId: "e-vice-b", pontos: 70, colocacao: "vice" },
          // Estes dois jogaram os grupos mas não chegaram na eliminatória —
          // é exatamente o caso que estava ficando com 0 pontos antes do fix
          { estatisticaId: "e-grupo-1", pontos: 10, colocacao: "participacao" },
          { estatisticaId: "e-grupo-2", pontos: 10, colocacao: "participacao" },
        ])
      );
      expect(mockEtapaRepository.definirCampeao).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        "dupla-campeao",
        "Campeão A & Campeão B"
      );
    });

    it("deve zerar pontos de quem só jogou os grupos quando darPontosParticipacao=false, sem afetar campeão/vice", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.EM_ANDAMENTO,
        formato: FormatoEtapa.REI_DA_PRAIA,
        contaPontosRanking: true,
        darPontosParticipacao: false,
      });
      const grupos = [createGrupoFixture({ id: "g1" })];

      const confrontoFinal = createConfrontoFixture({
        fase: TipoFase.FINAL,
        status: "finalizada" as any,
        vencedoraId: "dupla-campeao",
        vencedoraNome: "Campeão A & Campeão B",
        dupla1Id: "dupla-campeao",
        dupla2Id: "dupla-vice",
      });

      const duplasEliminatoria: Record<string, ReturnType<typeof createDuplaFixture>> = {
        "dupla-campeao": createDuplaFixture({
          id: "dupla-campeao",
          jogador1Id: "j-campeao-a",
          jogador1Nome: "Campeão A",
          jogador2Id: "j-campeao-b",
          jogador2Nome: "Campeão B",
        }),
        "dupla-vice": createDuplaFixture({
          id: "dupla-vice",
          jogador1Id: "j-vice-a",
          jogador1Nome: "Vice A",
          jogador2Id: "j-vice-b",
          jogador2Nome: "Vice B",
        }),
      };

      const todosJogadores = [
        createEstatisticasJogadorFixture({ id: "e-campeao-a", jogadorId: "j-campeao-a" }),
        createEstatisticasJogadorFixture({ id: "e-campeao-b", jogadorId: "j-campeao-b" }),
        createEstatisticasJogadorFixture({ id: "e-vice-a", jogadorId: "j-vice-a" }),
        createEstatisticasJogadorFixture({ id: "e-vice-b", jogadorId: "j-vice-b" }),
        createEstatisticasJogadorFixture({ id: "e-grupo-1", jogadorId: "j-so-grupo-1" }),
        createEstatisticasJogadorFixture({ id: "e-grupo-2", jogadorId: "j-so-grupo-2" }),
      ];

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockConfigRepository.buscarPontuacao.mockResolvedValue({
        campeao: 100,
        vice: 70,
        semifinalista: 50,
        quartas: 30,
        oitavas: 20,
        participacao: 10,
      });
      mockGrupoRepository.buscarPorEtapa.mockResolvedValue(grupos);
      mockConfrontoRepository.buscarPorFase.mockResolvedValue([confrontoFinal]);
      mockConfrontoRepository.buscarFinalizadosPorFase
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockEstatisticasRepository.buscarPorEtapa.mockResolvedValue(todosJogadores);
      mockDuplaRepository.buscarPorId.mockImplementation((id: string) =>
        Promise.resolve(duplasEliminatoria[id] || null)
      );
      mockEstatisticasRepository.atualizarPontuacaoEmLote.mockResolvedValue(undefined);
      mockEtapaRepository.definirCampeao.mockResolvedValue(undefined);

      await encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(mockEstatisticasRepository.atualizarPontuacaoEmLote).toHaveBeenCalledWith(
        expect.arrayContaining([
          { estatisticaId: "e-campeao-a", pontos: 100, colocacao: "campeao" },
          { estatisticaId: "e-vice-a", pontos: 70, colocacao: "vice" },
          { estatisticaId: "e-grupo-1", pontos: 0, colocacao: "participacao" },
          { estatisticaId: "e-grupo-2", pontos: 0, colocacao: "participacao" },
        ])
      );
    });

    it("deve pular atribuição de pontos se Rei da Praia não conta no ranking", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.EM_ANDAMENTO,
        formato: FormatoEtapa.REI_DA_PRAIA,
        contaPontosRanking: false,
      });
      const grupos = [createGrupoFixture({ id: "g1" })];
      const confrontoFinal = createConfrontoFixture({
        fase: TipoFase.FINAL,
        status: "finalizada" as any,
        vencedoraId: "dupla-campeao",
        vencedoraNome: "Campeão A & Campeão B",
      });

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockConfigRepository.buscarPontuacao.mockResolvedValue({
        campeao: 100,
        vice: 70,
        semifinalista: 50,
        quartas: 30,
        oitavas: 20,
        participacao: 10,
      });
      mockGrupoRepository.buscarPorEtapa.mockResolvedValue(grupos);
      mockConfrontoRepository.buscarPorFase.mockResolvedValue([confrontoFinal]);
      mockEtapaRepository.definirCampeao.mockResolvedValue(undefined);

      await encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(mockEstatisticasRepository.atualizarPontuacaoEmLote).not.toHaveBeenCalled();
      expect(mockEtapaRepository.definirCampeao).toHaveBeenCalled();
    });
  });

  describe("encerrarEtapa - grupo único sem pontos ranking", () => {
    it("deve pular atribuição de pontos se grupo único não conta no ranking", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.EM_ANDAMENTO,
        formato: FormatoEtapa.DUPLA_FIXA,
        contaPontosRanking: false,
      });

      const grupo = createGrupoFixture({ completo: true });
      const duplas = [
        createDuplaFixture({
          id: "dupla-1",
          jogador1Id: "j1",
          jogador1Nome: "J1",
          jogador2Id: "j2",
          jogador2Nome: "J2",
        }),
      ];

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockConfigRepository.buscarPontuacao.mockResolvedValue({
        campeao: 100,
        vice: 70,
        semifinalista: 50,
        quartas: 30,
        oitavas: 20,
        participacao: 10,
      });
      mockGrupoRepository.buscarPorEtapa.mockResolvedValue([grupo]);
      mockDuplaRepository.buscarPorGrupoOrdenado.mockResolvedValue(duplas);
      mockEtapaRepository.definirCampeao.mockResolvedValue(undefined);

      await encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(mockEstatisticasRepository.buscarPorJogadorEEtapa).not.toHaveBeenCalled();
      expect(mockEtapaRepository.definirCampeao).toHaveBeenCalled();
    });
  });

  describe("encerrarEtapa - eliminatória sem pontos ranking", () => {
    it("deve pular atribuição de pontos se eliminatória não conta no ranking", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.EM_ANDAMENTO,
        contaPontosRanking: false,
      });

      const grupos = [
        createGrupoFixture({ id: "g1" }),
        createGrupoFixture({ id: "g2" }),
      ];

      const confrontoFinal = createConfrontoFixture({
        fase: TipoFase.FINAL,
        status: "finalizada" as any,
        vencedoraId: "dupla-campeao",
        vencedoraNome: "Dupla Campeã",
        dupla1Id: "dupla-campeao",
        dupla2Id: "dupla-vice",
      });

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockConfigRepository.buscarPontuacao.mockResolvedValue({
        campeao: 100,
        vice: 70,
        semifinalista: 50,
        quartas: 30,
        oitavas: 20,
        participacao: 10,
      });
      mockGrupoRepository.buscarPorEtapa.mockResolvedValue(grupos);
      mockConfrontoRepository.buscarPorFase.mockResolvedValue([confrontoFinal]);
      mockEtapaRepository.definirCampeao.mockResolvedValue(undefined);

      await encerramentoService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(mockConfrontoRepository.buscarFinalizadosPorFase).not.toHaveBeenCalled();
      expect(mockDuplaRepository.buscarPorEtapa).not.toHaveBeenCalled();
      expect(mockEtapaRepository.definirCampeao).toHaveBeenCalled();
    });
  });
});
