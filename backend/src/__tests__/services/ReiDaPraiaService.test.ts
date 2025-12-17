/**
 * Testes do ReiDaPraiaService
 */

jest.mock("../../utils/logger", () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    critical: jest.fn(),
  },
}));

jest.mock("../../services/CabecaDeChaveService", () => ({
  __esModule: true,
  default: {
    obterIdsCabecas: jest.fn(),
  },
}));

jest.mock("../../services/EstatisticasJogadorService", () => ({
  __esModule: true,
  default: {
    criar: jest.fn(),
    criarEmLote: jest.fn(),
    atualizarGrupo: jest.fn(),
    atualizarGrupoEmLotePorId: jest.fn(),
    buscarPorGrupo: jest.fn(),
    atualizarAposPartidaGrupo: jest.fn(),
    atualizarAposPartida: jest.fn(),
    reverterAposPartidaGrupo: jest.fn(),
    reverterAposPartida: jest.fn(),
    atualizarPosicaoGrupo: jest.fn(),
    buscarClassificados: jest.fn(),
    marcarComoClassificado: jest.fn(),
    marcarComoClassificadoEmLote: jest.fn(),
    buscarPorJogadoresEtapa: jest.fn(),
    atualizarAposPartidaGrupoComIncrement: jest.fn(),
    reverterAposPartidaComIncrement: jest.fn(),
  },
}));

import { ReiDaPraiaService } from "../../services/ReiDaPraiaService";
import cabecaDeChaveService from "../../services/CabecaDeChaveService";
import estatisticasJogadorService from "../../services/EstatisticasJogadorService";
import { StatusEtapa } from "../../models/Etapa";
import { StatusPartida } from "../../models/Partida";
import { TipoChaveamentoReiDaPraia } from "../../models/TipoChaveamentoReiDaPraia";
import { StatusConfrontoEliminatorio } from "../../models/Eliminatoria";
import { TEST_IDS, NivelJogador, GeneroJogador } from "../fixtures";

describe("ReiDaPraiaService", () => {
  let service: ReiDaPraiaService;

  // Mock repositories
  const mockEtapaRepository = {
    buscarPorIdEArena: jest.fn(),
    marcarChavesGeradas: jest.fn(),
    atualizarStatus: jest.fn(),
  };

  const mockInscricaoRepository = {
    buscarConfirmadas: jest.fn(),
  };

  const mockGrupoRepository = {
    criar: jest.fn(),
    criarEmLote: jest.fn(),
    atualizarContadores: jest.fn(),
    adicionarPartida: jest.fn(),
    adicionarPartidasEmLote: jest.fn(),
    buscarCompletos: jest.fn(),
    marcarCompleto: jest.fn(),
  };

  const mockDuplaRepository = {
    criar: jest.fn(),
    marcarClassificada: jest.fn(),
    buscarPorId: jest.fn(),
    deletarPorEtapa: jest.fn(),
  };

  const mockConfrontoRepository = {
    criar: jest.fn(),
    registrarResultado: jest.fn(),
    buscarPorEtapa: jest.fn(),
    deletarPorEtapa: jest.fn(),
  };

  const mockPartidaReiDaPraiaRepository = {
    criar: jest.fn(),
    criarEmLote: jest.fn(),
    buscarPorIdEArena: jest.fn(),
    buscarPorEtapa: jest.fn(),
    registrarResultado: jest.fn(),
    contarFinalizadasPorGrupo: jest.fn(),
  };

  const mockEstatisticasJogadorRepository = {
    buscarPorGrupo: jest.fn(),
    buscarPorEtapa: jest.fn(),
    atualizar: jest.fn(),
  };

  const mockPartidaRepository = {
    buscarPorTipo: jest.fn(),
    deletarEliminatoriasPorEtapa: jest.fn(),
  };

  const TEST_ARENA_ID = TEST_IDS.arena;
  const TEST_ETAPA_ID = TEST_IDS.etapa;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new ReiDaPraiaService(
      mockEtapaRepository as any,
      mockInscricaoRepository as any,
      mockGrupoRepository as any,
      mockDuplaRepository as any,
      mockConfrontoRepository as any,
      mockPartidaReiDaPraiaRepository as any,
      mockEstatisticasJogadorRepository as any,
      mockPartidaRepository as any
    );
  });

  describe("gerarChaves", () => {
    it("deve lançar erro se etapa não encontrada", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(null);

      await expect(
        service.gerarChaves(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Etapa não encontrada");
    });

    it("deve lançar erro se inscrições não estão encerradas", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue({
        id: TEST_ETAPA_ID,
        status: StatusEtapa.INSCRICOES_ABERTAS,
      });

      await expect(
        service.gerarChaves(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Inscrições devem estar encerradas");
    });

    it("deve lançar erro se chaves já foram geradas", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue({
        id: TEST_ETAPA_ID,
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
        chavesGeradas: true,
      });

      await expect(
        service.gerarChaves(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Chaves já foram geradas");
    });

    it("deve lançar erro se menos de 8 jogadores", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue({
        id: TEST_ETAPA_ID,
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
        chavesGeradas: false,
        totalInscritos: 4,
      });

      await expect(
        service.gerarChaves(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Necessário no mínimo 8 jogadores");
    });

    it("deve lançar erro se número de jogadores não é múltiplo de 4", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue({
        id: TEST_ETAPA_ID,
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
        chavesGeradas: false,
        totalInscritos: 10,
      });

      await expect(
        service.gerarChaves(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Número de jogadores deve ser múltiplo de 4");
    });

    it("deve lançar erro se total inscritos diferente do máximo", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue({
        id: TEST_ETAPA_ID,
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
        chavesGeradas: false,
        totalInscritos: 8,
        maxJogadores: 16,
      });

      await expect(
        service.gerarChaves(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Etapa configurada para 16 jogadores");
    });

    it("deve gerar chaves com sucesso para 8 jogadores", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue({
        id: TEST_ETAPA_ID,
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
        chavesGeradas: false,
        totalInscritos: 8,
        maxJogadores: 8,
      });

      const inscricoes = Array.from({ length: 8 }, (_, i) => ({
        id: `inscricao-${i}`,
        jogadorId: `jogador-${i}`,
        jogadorNome: `Jogador ${i}`,
        jogadorNivel: NivelJogador.INTERMEDIARIO,
        jogadorGenero: GeneroJogador.MASCULINO,
      }));

      mockInscricaoRepository.buscarConfirmadas.mockResolvedValue(inscricoes);
      (cabecaDeChaveService.obterIdsCabecas as jest.Mock).mockResolvedValue([]);

      // Mock estatísticas criadas em lote
      (estatisticasJogadorService.criarEmLote as jest.Mock).mockImplementation(
        (dtos: any[]) => Promise.resolve(
          dtos.map((dto) => ({
            id: `estatistica-${dto.jogadorId}`,
            ...dto,
            jogosGrupo: 0,
            vitoriasGrupo: 0,
            pontosGrupo: 0,
          }))
        )
      );

      // Mock grupos criados em lote
      mockGrupoRepository.criarEmLote.mockImplementation((dtos: any[]) =>
        Promise.resolve(
          dtos.map((dto, idx) => ({
            id: `grupo-${dto.ordem || idx + 1}`,
            ...dto,
          }))
        )
      );

      // Mock estatísticas por grupo
      mockEstatisticasJogadorRepository.buscarPorGrupo.mockResolvedValue([
        { id: "e1", jogadorId: "j1", jogadorNome: "Jogador 1" },
        { id: "e2", jogadorId: "j2", jogadorNome: "Jogador 2" },
        { id: "e3", jogadorId: "j3", jogadorNome: "Jogador 3" },
        { id: "e4", jogadorId: "j4", jogadorNome: "Jogador 4" },
      ]);

      // Mock partidas criadas em lote
      mockPartidaReiDaPraiaRepository.criarEmLote.mockImplementation((dtos: any[]) =>
        Promise.resolve(
          dtos.map((dto) => ({
            id: `partida-${Date.now()}-${Math.random()}`,
            ...dto,
          }))
        )
      );

      const result = await service.gerarChaves(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(result.jogadores).toHaveLength(8);
      expect(result.grupos).toHaveLength(2);
      expect(result.partidas).toHaveLength(6); // 2 grupos * 3 partidas
      expect(mockEtapaRepository.marcarChavesGeradas).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        true
      );
    });
  });

  describe("buscarJogadores", () => {
    it("deve retornar jogadores da etapa", async () => {
      const jogadores = [
        { id: "e1", jogadorId: "j1", jogadorNome: "Jogador 1" },
        { id: "e2", jogadorId: "j2", jogadorNome: "Jogador 2" },
      ];

      mockEstatisticasJogadorRepository.buscarPorEtapa.mockResolvedValue(jogadores);

      const result = await service.buscarJogadores(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(result).toHaveLength(2);
      expect(mockEstatisticasJogadorRepository.buscarPorEtapa).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );
    });
  });

  describe("buscarPartidas", () => {
    it("deve retornar partidas da etapa", async () => {
      const partidas = [
        { id: "p1", grupoNome: "Grupo A" },
        { id: "p2", grupoNome: "Grupo A" },
        { id: "p3", grupoNome: "Grupo B" },
      ];

      mockPartidaReiDaPraiaRepository.buscarPorEtapa.mockResolvedValue(partidas);

      const result = await service.buscarPartidas(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(result).toHaveLength(3);
      expect(mockPartidaReiDaPraiaRepository.buscarPorEtapa).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );
    });
  });

  describe("gerarFaseEliminatoria", () => {
    it("deve lançar erro se nenhum grupo completo", async () => {
      mockGrupoRepository.buscarCompletos.mockResolvedValue([]);

      await expect(
        service.gerarFaseEliminatoria(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Nenhum grupo completo encontrado");
    });

    it("deve lançar erro se apenas 1 grupo", async () => {
      mockGrupoRepository.buscarCompletos.mockResolvedValue([
        { id: "grupo-1", nome: "Grupo A" },
      ]);

      await expect(
        service.gerarFaseEliminatoria(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Não é possível gerar fase eliminatória com apenas 1 grupo");
    });

    it("deve gerar fase eliminatória com sucesso", async () => {
      mockGrupoRepository.buscarCompletos.mockResolvedValue([
        { id: "grupo-1", nome: "Grupo A" },
        { id: "grupo-2", nome: "Grupo B" },
      ]);

      // Mock classificados de cada grupo
      (estatisticasJogadorService.buscarClassificados as jest.Mock)
        .mockResolvedValueOnce([
          { jogadorId: "j1", jogadorNome: "Jogador 1", posicaoGrupo: 1, grupoId: "grupo-1" },
          { jogadorId: "j2", jogadorNome: "Jogador 2", posicaoGrupo: 2, grupoId: "grupo-1" },
        ])
        .mockResolvedValueOnce([
          { jogadorId: "j3", jogadorNome: "Jogador 3", posicaoGrupo: 1, grupoId: "grupo-2" },
          { jogadorId: "j4", jogadorNome: "Jogador 4", posicaoGrupo: 2, grupoId: "grupo-2" },
        ]);

      // Mock criação de duplas
      mockDuplaRepository.criar.mockImplementation((dto: any) =>
        Promise.resolve({
          id: `dupla-${dto.jogador1Id}-${dto.jogador2Id}`,
          ...dto,
        })
      );

      // Mock criação de confrontos
      mockConfrontoRepository.criar.mockImplementation((dto: any) =>
        Promise.resolve({
          id: `confronto-${dto.ordem}`,
          ...dto,
          status: StatusConfrontoEliminatorio.AGENDADA,
        })
      );

      const result = await service.gerarFaseEliminatoria(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        2,
        TipoChaveamentoReiDaPraia.PAREAMENTO_POR_RANKING
      );

      expect(result.duplas).toHaveLength(2);
      expect(result.confrontos).toHaveLength(1); // 2 duplas = 1 confronto
      expect(mockEtapaRepository.atualizarStatus).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        StatusEtapa.FASE_ELIMINATORIA
      );
    });

    it("deve lançar erro para tipo de chaveamento inválido", async () => {
      mockGrupoRepository.buscarCompletos.mockResolvedValue([
        { id: "grupo-1", nome: "Grupo A" },
        { id: "grupo-2", nome: "Grupo B" },
      ]);

      (estatisticasJogadorService.buscarClassificados as jest.Mock)
        .mockResolvedValue([
          { jogadorId: "j1", jogadorNome: "Jogador 1", posicaoGrupo: 1 },
          { jogadorId: "j2", jogadorNome: "Jogador 2", posicaoGrupo: 2 },
        ]);

      await expect(
        service.gerarFaseEliminatoria(
          TEST_ETAPA_ID,
          TEST_ARENA_ID,
          2,
          "INVALIDO" as any
        )
      ).rejects.toThrow("Tipo de chaveamento inválido");
    });
  });

  describe("cancelarFaseEliminatoria", () => {
    it("deve lançar erro se etapa não encontrada", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(null);

      await expect(
        service.cancelarFaseEliminatoria(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Etapa não encontrada");
    });

    it("deve lançar erro se etapa não é Rei da Praia", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue({
        id: TEST_ETAPA_ID,
        formato: "dupla_fixa",
      });

      await expect(
        service.cancelarFaseEliminatoria(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Esta etapa não é do formato Rei da Praia");
    });

    it("deve lançar erro se não há fase eliminatória", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue({
        id: TEST_ETAPA_ID,
        formato: "rei_da_praia",
      });

      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue([]);

      await expect(
        service.cancelarFaseEliminatoria(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Nenhuma fase eliminatória encontrada para esta etapa");
    });

    it("deve cancelar fase eliminatória com sucesso", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue({
        id: TEST_ETAPA_ID,
        formato: "rei_da_praia",
      });

      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue([
        { id: "confronto-1" },
        { id: "confronto-2" },
      ]);

      mockPartidaRepository.buscarPorTipo.mockResolvedValue([]);
      mockConfrontoRepository.deletarPorEtapa.mockResolvedValue(2);
      mockDuplaRepository.deletarPorEtapa.mockResolvedValue(4);
      mockEstatisticasJogadorRepository.buscarPorEtapa.mockResolvedValue([]);

      await service.cancelarFaseEliminatoria(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(mockConfrontoRepository.deletarPorEtapa).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );
      expect(mockDuplaRepository.deletarPorEtapa).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );
      expect(mockEtapaRepository.atualizarStatus).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        StatusEtapa.CHAVES_GERADAS
      );
    });

    it("deve reverter estatísticas de partidas finalizadas ao cancelar", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue({
        id: TEST_ETAPA_ID,
        formato: "rei_da_praia",
      });

      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue([
        { id: "confronto-1" },
      ]);

      const partidaFinalizada = {
        id: "partida-elim-1",
        status: StatusPartida.FINALIZADA,
        dupla1Id: "dupla-1",
        dupla2Id: "dupla-2",
        vencedoraId: "dupla-1",
        placar: [{ gamesDupla1: 6, gamesDupla2: 4 }],
      };

      mockPartidaRepository.buscarPorTipo.mockResolvedValue([partidaFinalizada]);

      mockDuplaRepository.buscarPorId
        .mockResolvedValueOnce({
          id: "dupla-1",
          jogador1Id: "j1",
          jogador2Id: "j2",
        })
        .mockResolvedValueOnce({
          id: "dupla-2",
          jogador1Id: "j3",
          jogador2Id: "j4",
        });

      mockPartidaRepository.deletarEliminatoriasPorEtapa.mockResolvedValue(undefined);
      mockConfrontoRepository.deletarPorEtapa.mockResolvedValue(1);
      mockDuplaRepository.deletarPorEtapa.mockResolvedValue(2);
      mockEstatisticasJogadorRepository.buscarPorEtapa.mockResolvedValue([]);

      await service.cancelarFaseEliminatoria(TEST_ETAPA_ID, TEST_ARENA_ID);

      // Deve reverter estatísticas dos 4 jogadores
      expect(estatisticasJogadorService.reverterAposPartida).toHaveBeenCalledTimes(4);
    });

    it("deve atualizar estatísticas dos jogadores ao cancelar", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue({
        id: TEST_ETAPA_ID,
        formato: "rei_da_praia",
      });

      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue([
        { id: "confronto-1" },
      ]);

      mockPartidaRepository.buscarPorTipo.mockResolvedValue([]);
      mockConfrontoRepository.deletarPorEtapa.mockResolvedValue(1);
      mockDuplaRepository.deletarPorEtapa.mockResolvedValue(2);

      const estatisticas = [
        { id: "e1", jogadorId: "j1", classificado: true },
        { id: "e2", jogadorId: "j2", classificado: true },
      ];
      mockEstatisticasJogadorRepository.buscarPorEtapa.mockResolvedValue(estatisticas);

      await service.cancelarFaseEliminatoria(TEST_ETAPA_ID, TEST_ARENA_ID);

      // Deve desmarcar jogadores como classificados
      expect(mockEstatisticasJogadorRepository.atualizar).toHaveBeenCalledTimes(2);
    });
  });

  describe("gerarChaves - cabeças de chave", () => {
    it("deve distribuir cabeças de chave corretamente", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue({
        id: TEST_ETAPA_ID,
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
        chavesGeradas: false,
        totalInscritos: 8,
        maxJogadores: 8,
      });

      const inscricoes = Array.from({ length: 8 }, (_, i) => ({
        id: `inscricao-${i}`,
        jogadorId: `jogador-${i}`,
        jogadorNome: `Jogador ${i}`,
        jogadorNivel: NivelJogador.INTERMEDIARIO,
        jogadorGenero: GeneroJogador.MASCULINO,
      }));

      mockInscricaoRepository.buscarConfirmadas.mockResolvedValue(inscricoes);

      // Definir 2 cabeças de chave
      (cabecaDeChaveService.obterIdsCabecas as jest.Mock).mockResolvedValue([
        "jogador-0",
        "jogador-1",
      ]);

      (estatisticasJogadorService.criarEmLote as jest.Mock).mockImplementation(
        (dtos: any[]) => Promise.resolve(
          dtos.map((dto) => ({
            id: `estatistica-${dto.jogadorId}`,
            ...dto,
          }))
        )
      );

      mockGrupoRepository.criarEmLote.mockImplementation((dtos: any[]) =>
        Promise.resolve(
          dtos.map((dto, idx) => ({
            id: `grupo-${dto.ordem || idx + 1}`,
            ...dto,
          }))
        )
      );

      mockEstatisticasJogadorRepository.buscarPorGrupo.mockResolvedValue([
        { id: "e1", jogadorId: "j1", jogadorNome: "Jogador 1" },
        { id: "e2", jogadorId: "j2", jogadorNome: "Jogador 2" },
        { id: "e3", jogadorId: "j3", jogadorNome: "Jogador 3" },
        { id: "e4", jogadorId: "j4", jogadorNome: "Jogador 4" },
      ]);

      mockPartidaReiDaPraiaRepository.criarEmLote.mockImplementation((dtos: any[]) =>
        Promise.resolve(
          dtos.map((dto) => ({
            id: `partida-${Date.now()}-${Math.random()}`,
            ...dto,
          }))
        )
      );

      const result = await service.gerarChaves(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(result.jogadores).toHaveLength(8);
      expect(result.grupos).toHaveLength(2);
    });

    it("deve lançar erro se número de cabeças maior que grupos", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue({
        id: TEST_ETAPA_ID,
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
        chavesGeradas: false,
        totalInscritos: 8,
        maxJogadores: 8,
      });

      const inscricoes = Array.from({ length: 8 }, (_, i) => ({
        id: `inscricao-${i}`,
        jogadorId: `jogador-${i}`,
        jogadorNome: `Jogador ${i}`,
        jogadorNivel: NivelJogador.INTERMEDIARIO,
        jogadorGenero: GeneroJogador.MASCULINO,
      }));

      mockInscricaoRepository.buscarConfirmadas.mockResolvedValue(inscricoes);

      // Definir 3 cabeças de chave para 2 grupos (8/4=2)
      (cabecaDeChaveService.obterIdsCabecas as jest.Mock).mockResolvedValue([
        "jogador-0",
        "jogador-1",
        "jogador-2",
      ]);

      await expect(
        service.gerarChaves(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Falha ao distribuir jogadores");
    });
  });

  describe("gerarPartidas - erro", () => {
    it("deve lançar erro se grupo não tem 4 jogadores", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue({
        id: TEST_ETAPA_ID,
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
        chavesGeradas: false,
        totalInscritos: 8,
        maxJogadores: 8,
      });

      const inscricoes = Array.from({ length: 8 }, (_, i) => ({
        id: `inscricao-${i}`,
        jogadorId: `jogador-${i}`,
        jogadorNome: `Jogador ${i}`,
        jogadorNivel: NivelJogador.INTERMEDIARIO,
        jogadorGenero: GeneroJogador.MASCULINO,
      }));

      mockInscricaoRepository.buscarConfirmadas.mockResolvedValue(inscricoes);
      (cabecaDeChaveService.obterIdsCabecas as jest.Mock).mockResolvedValue([]);

      (estatisticasJogadorService.criarEmLote as jest.Mock).mockImplementation(
        (dtos: any[]) => Promise.resolve(
          dtos.map((dto) => ({
            id: `estatistica-${dto.jogadorId}`,
            ...dto,
          }))
        )
      );

      mockGrupoRepository.criarEmLote.mockImplementation((dtos: any[]) =>
        Promise.resolve(
          dtos.map((dto, idx) => ({
            id: `grupo-${dto.ordem || idx + 1}`,
            ...dto,
          }))
        )
      );

      // Retornar apenas 3 jogadores por grupo (erro)
      mockEstatisticasJogadorRepository.buscarPorGrupo.mockResolvedValue([
        { id: "e1", jogadorId: "j1", jogadorNome: "Jogador 1" },
        { id: "e2", jogadorId: "j2", jogadorNome: "Jogador 2" },
        { id: "e3", jogadorId: "j3", jogadorNome: "Jogador 3" },
      ]);

      await expect(
        service.gerarChaves(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Falha ao gerar partidas");
    });
  });

  describe("gerarFaseEliminatoria - tipo Melhores com Melhores", () => {
    it("deve formar duplas melhores com melhores (4 grupos)", async () => {
      mockGrupoRepository.buscarCompletos.mockResolvedValue([
        { id: "grupo-1", nome: "Grupo A" },
        { id: "grupo-2", nome: "Grupo B" },
        { id: "grupo-3", nome: "Grupo C" },
        { id: "grupo-4", nome: "Grupo D" },
      ]);

      // Mock classificados de cada grupo
      (estatisticasJogadorService.buscarClassificados as jest.Mock)
        .mockResolvedValueOnce([
          { jogadorId: "j1", jogadorNome: "Jogador 1", posicaoGrupo: 1, grupoId: "grupo-1", pontosGrupo: 9, vitoriasGrupo: 3 },
          { jogadorId: "j2", jogadorNome: "Jogador 2", posicaoGrupo: 2, grupoId: "grupo-1", pontosGrupo: 6, vitoriasGrupo: 2 },
        ])
        .mockResolvedValueOnce([
          { jogadorId: "j3", jogadorNome: "Jogador 3", posicaoGrupo: 1, grupoId: "grupo-2", pontosGrupo: 9, vitoriasGrupo: 3 },
          { jogadorId: "j4", jogadorNome: "Jogador 4", posicaoGrupo: 2, grupoId: "grupo-2", pontosGrupo: 6, vitoriasGrupo: 2 },
        ])
        .mockResolvedValueOnce([
          { jogadorId: "j5", jogadorNome: "Jogador 5", posicaoGrupo: 1, grupoId: "grupo-3", pontosGrupo: 6, vitoriasGrupo: 2 },
          { jogadorId: "j6", jogadorNome: "Jogador 6", posicaoGrupo: 2, grupoId: "grupo-3", pontosGrupo: 3, vitoriasGrupo: 1 },
        ])
        .mockResolvedValueOnce([
          { jogadorId: "j7", jogadorNome: "Jogador 7", posicaoGrupo: 1, grupoId: "grupo-4", pontosGrupo: 6, vitoriasGrupo: 2 },
          { jogadorId: "j8", jogadorNome: "Jogador 8", posicaoGrupo: 2, grupoId: "grupo-4", pontosGrupo: 3, vitoriasGrupo: 1 },
        ]);

      mockDuplaRepository.criar.mockImplementation((dto: any) =>
        Promise.resolve({
          id: `dupla-${dto.jogador1Id}-${dto.jogador2Id}`,
          ...dto,
        })
      );

      mockConfrontoRepository.criar.mockImplementation((dto: any) =>
        Promise.resolve({
          id: `confronto-${dto.ordem}`,
          ...dto,
          status: StatusConfrontoEliminatorio.AGENDADA,
        })
      );

      const result = await service.gerarFaseEliminatoria(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        2,
        TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES
      );

      expect(result.duplas).toHaveLength(4);
      expect(result.confrontos).toHaveLength(2); // 4 duplas = 2 confrontos
    });
  });

  describe("gerarFaseEliminatoria - tipo Sorteio Aleatório", () => {
    it("deve formar duplas por sorteio aleatório", async () => {
      mockGrupoRepository.buscarCompletos.mockResolvedValue([
        { id: "grupo-1", nome: "Grupo A" },
        { id: "grupo-2", nome: "Grupo B" },
      ]);

      // Mock classificados de cada grupo
      (estatisticasJogadorService.buscarClassificados as jest.Mock)
        .mockResolvedValueOnce([
          { jogadorId: "j1", jogadorNome: "Jogador 1", posicaoGrupo: 1, grupoId: "grupo-1" },
          { jogadorId: "j2", jogadorNome: "Jogador 2", posicaoGrupo: 2, grupoId: "grupo-1" },
        ])
        .mockResolvedValueOnce([
          { jogadorId: "j3", jogadorNome: "Jogador 3", posicaoGrupo: 1, grupoId: "grupo-2" },
          { jogadorId: "j4", jogadorNome: "Jogador 4", posicaoGrupo: 2, grupoId: "grupo-2" },
        ]);

      mockDuplaRepository.criar.mockImplementation((dto: any) =>
        Promise.resolve({
          id: `dupla-${dto.jogador1Id}-${dto.jogador2Id}`,
          ...dto,
        })
      );

      mockConfrontoRepository.criar.mockImplementation((dto: any) =>
        Promise.resolve({
          id: `confronto-${dto.ordem}`,
          ...dto,
          status: StatusConfrontoEliminatorio.AGENDADA,
        })
      );

      const result = await service.gerarFaseEliminatoria(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        2,
        TipoChaveamentoReiDaPraia.SORTEIO_ALEATORIO
      );

      expect(result.duplas).toHaveLength(2);
      expect(result.confrontos).toHaveLength(1);
    });
  });

  describe("gerarFaseEliminatoria - erro classificados insuficientes", () => {
    it("deve lançar erro se grupo não tem classificados suficientes", async () => {
      mockGrupoRepository.buscarCompletos.mockResolvedValue([
        { id: "grupo-1", nome: "Grupo A" },
        { id: "grupo-2", nome: "Grupo B" },
      ]);

      // Primeiro grupo retorna classificados insuficientes
      (estatisticasJogadorService.buscarClassificados as jest.Mock)
        .mockResolvedValueOnce([
          { jogadorId: "j1", jogadorNome: "Jogador 1", posicaoGrupo: 1 },
          // Falta o segundo classificado
        ]);

      await expect(
        service.gerarFaseEliminatoria(TEST_ETAPA_ID, TEST_ARENA_ID, 2)
      ).rejects.toThrow("Grupo Grupo A não tem 2 classificados");
    });
  });

  describe("gerarConfrontosEliminatorios - com BYE", () => {
    it("deve gerar confrontos com BYE para 3 duplas", async () => {
      mockGrupoRepository.buscarCompletos.mockResolvedValue([
        { id: "grupo-1", nome: "Grupo A" },
        { id: "grupo-2", nome: "Grupo B" },
        { id: "grupo-3", nome: "Grupo C" },
      ]);

      // 3 grupos = 6 classificados = 3 duplas
      (estatisticasJogadorService.buscarClassificados as jest.Mock)
        .mockResolvedValueOnce([
          { jogadorId: "j1", jogadorNome: "Jogador 1", posicaoGrupo: 1, grupoId: "grupo-1", pontosGrupo: 9 },
          { jogadorId: "j2", jogadorNome: "Jogador 2", posicaoGrupo: 2, grupoId: "grupo-1", pontosGrupo: 6 },
        ])
        .mockResolvedValueOnce([
          { jogadorId: "j3", jogadorNome: "Jogador 3", posicaoGrupo: 1, grupoId: "grupo-2", pontosGrupo: 9 },
          { jogadorId: "j4", jogadorNome: "Jogador 4", posicaoGrupo: 2, grupoId: "grupo-2", pontosGrupo: 6 },
        ])
        .mockResolvedValueOnce([
          { jogadorId: "j5", jogadorNome: "Jogador 5", posicaoGrupo: 1, grupoId: "grupo-3", pontosGrupo: 6 },
          { jogadorId: "j6", jogadorNome: "Jogador 6", posicaoGrupo: 2, grupoId: "grupo-3", pontosGrupo: 3 },
        ]);

      mockDuplaRepository.criar.mockImplementation((dto: any) =>
        Promise.resolve({
          id: `dupla-${dto.jogador1Id}-${dto.jogador2Id}`,
          jogador1Nome: dto.jogador1Nome,
          jogador2Nome: dto.jogador2Nome,
          ...dto,
        })
      );

      mockConfrontoRepository.criar.mockImplementation((dto: any) =>
        Promise.resolve({
          id: `confronto-${dto.ordem}`,
          ...dto,
          status: StatusConfrontoEliminatorio.AGENDADA,
        })
      );

      const result = await service.gerarFaseEliminatoria(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        2,
        TipoChaveamentoReiDaPraia.PAREAMENTO_POR_RANKING
      );

      expect(result.duplas).toHaveLength(3);
      // 3 duplas -> próxima potência de 2 é 4 -> 1 BYE + 1 confronto real = 2 confrontos
      expect(result.confrontos).toHaveLength(2);

      // Verificar que o BYE foi registrado
      expect(mockConfrontoRepository.registrarResultado).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          status: StatusConfrontoEliminatorio.BYE,
        })
      );
    });
  });

  describe("registrarResultadosEmLote", () => {
    it("deve registrar resultados em lote com sucesso", async () => {
      const partida = {
        id: "partida-1",
        grupoId: "grupo-1",
        jogador1AId: "j1",
        jogador1ANome: "Jogador 1",
        jogador1BId: "j2",
        jogador1BNome: "Jogador 2",
        jogador2AId: "j3",
        jogador2ANome: "Jogador 3",
        jogador2BId: "j4",
        jogador2BNome: "Jogador 4",
        status: StatusPartida.AGENDADA,
      };

      mockPartidaReiDaPraiaRepository.buscarPorIdEArena.mockResolvedValue(partida);
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue([]);

      const estatisticasMap = new Map([
        ["j1", { id: "e1" }],
        ["j2", { id: "e2" }],
        ["j3", { id: "e3" }],
        ["j4", { id: "e4" }],
      ]);
      (estatisticasJogadorService.buscarPorJogadoresEtapa as jest.Mock).mockResolvedValue(estatisticasMap);
      (estatisticasJogadorService.atualizarAposPartidaGrupoComIncrement as jest.Mock).mockResolvedValue(undefined);
      (estatisticasJogadorService.buscarPorGrupo as jest.Mock).mockResolvedValue([
        { jogadorId: "j1", pontosGrupo: 3, vitoriasGrupo: 1, saldoGamesGrupo: 2, gamesVencidosGrupo: 6, saldoSetsGrupo: 1 },
        { jogadorId: "j2", pontosGrupo: 3, vitoriasGrupo: 1, saldoGamesGrupo: 2, gamesVencidosGrupo: 6, saldoSetsGrupo: 1 },
        { jogadorId: "j3", pontosGrupo: 0, vitoriasGrupo: 0, saldoGamesGrupo: -2, gamesVencidosGrupo: 4, saldoSetsGrupo: -1 },
        { jogadorId: "j4", pontosGrupo: 0, vitoriasGrupo: 0, saldoGamesGrupo: -2, gamesVencidosGrupo: 4, saldoSetsGrupo: -1 },
      ]);
      mockPartidaReiDaPraiaRepository.contarFinalizadasPorGrupo.mockResolvedValue(1);

      const resultados = [
        {
          partidaId: "partida-1",
          placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
        },
      ];

      const result = await service.registrarResultadosEmLote(TEST_ETAPA_ID, TEST_ARENA_ID, resultados);

      expect(result.processados).toBe(1);
      expect(result.erros).toHaveLength(0);
      expect(mockPartidaReiDaPraiaRepository.registrarResultado).toHaveBeenCalled();
    });

    it("deve retornar erro para partida não encontrada", async () => {
      mockPartidaReiDaPraiaRepository.buscarPorIdEArena.mockResolvedValue(null);
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue([]);
      (estatisticasJogadorService.buscarPorJogadoresEtapa as jest.Mock).mockResolvedValue(new Map());

      const resultados = [
        {
          partidaId: "partida-inexistente",
          placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
        },
      ];

      const result = await service.registrarResultadosEmLote(TEST_ETAPA_ID, TEST_ARENA_ID, resultados);

      expect(result.processados).toBe(0);
      expect(result.erros).toHaveLength(1);
      expect(result.erros[0].erro).toBe("Partida não encontrada");
    });

    it("deve retornar erro para placar inválido", async () => {
      const partida = {
        id: "partida-1",
        grupoId: "grupo-1",
        jogador1AId: "j1",
        jogador1BId: "j2",
        jogador2AId: "j3",
        jogador2BId: "j4",
        status: StatusPartida.AGENDADA,
      };

      mockPartidaReiDaPraiaRepository.buscarPorIdEArena.mockResolvedValue(partida);
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue([]);
      (estatisticasJogadorService.buscarPorJogadoresEtapa as jest.Mock).mockResolvedValue(new Map());

      const resultados = [
        {
          partidaId: "partida-1",
          placar: [], // Placar vazio
        },
      ];

      const result = await service.registrarResultadosEmLote(TEST_ETAPA_ID, TEST_ARENA_ID, resultados);

      expect(result.processados).toBe(0);
      expect(result.erros).toHaveLength(1);
      expect(result.erros[0].erro).toBe("Placar deve ter exatamente 1 set");
    });

    it("deve retornar erro ao editar após gerar eliminatória", async () => {
      const partida = {
        id: "partida-1",
        grupoId: "grupo-1",
        jogador1AId: "j1",
        jogador1BId: "j2",
        jogador2AId: "j3",
        jogador2BId: "j4",
        status: StatusPartida.FINALIZADA, // Edição
        placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
      };

      mockPartidaReiDaPraiaRepository.buscarPorIdEArena.mockResolvedValue(partida);
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue([{ id: "confronto-1" }]); // Eliminatória gerada
      (estatisticasJogadorService.buscarPorJogadoresEtapa as jest.Mock).mockResolvedValue(new Map());

      const resultados = [
        {
          partidaId: "partida-1",
          placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 3 }],
        },
      ];

      const result = await service.registrarResultadosEmLote(TEST_ETAPA_ID, TEST_ARENA_ID, resultados);

      expect(result.processados).toBe(0);
      expect(result.erros).toHaveLength(1);
      expect(result.erros[0].erro).toBe("Não é possível editar após gerar eliminatória");
    });

    it("deve reverter e aplicar novo resultado ao editar partida", async () => {
      const partida = {
        id: "partida-1",
        grupoId: "grupo-1",
        jogador1AId: "j1",
        jogador1ANome: "Jogador 1",
        jogador1BId: "j2",
        jogador1BNome: "Jogador 2",
        jogador2AId: "j3",
        jogador2ANome: "Jogador 3",
        jogador2BId: "j4",
        jogador2BNome: "Jogador 4",
        status: StatusPartida.FINALIZADA,
        placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
        vencedores: ["j1", "j2"],
      };

      mockPartidaReiDaPraiaRepository.buscarPorIdEArena.mockResolvedValue(partida);
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue([]); // Sem eliminatória

      const estatisticasMap = new Map([
        ["j1", { id: "e1" }],
        ["j2", { id: "e2" }],
        ["j3", { id: "e3" }],
        ["j4", { id: "e4" }],
      ]);
      (estatisticasJogadorService.buscarPorJogadoresEtapa as jest.Mock).mockResolvedValue(estatisticasMap);
      (estatisticasJogadorService.reverterAposPartidaComIncrement as jest.Mock).mockResolvedValue(undefined);
      (estatisticasJogadorService.atualizarAposPartidaGrupoComIncrement as jest.Mock).mockResolvedValue(undefined);
      (estatisticasJogadorService.buscarPorGrupo as jest.Mock).mockResolvedValue([
        { jogadorId: "j1", pontosGrupo: 0, vitoriasGrupo: 0, saldoGamesGrupo: -2, gamesVencidosGrupo: 4, saldoSetsGrupo: -1 },
        { jogadorId: "j2", pontosGrupo: 0, vitoriasGrupo: 0, saldoGamesGrupo: -2, gamesVencidosGrupo: 4, saldoSetsGrupo: -1 },
        { jogadorId: "j3", pontosGrupo: 3, vitoriasGrupo: 1, saldoGamesGrupo: 2, gamesVencidosGrupo: 6, saldoSetsGrupo: 1 },
        { jogadorId: "j4", pontosGrupo: 3, vitoriasGrupo: 1, saldoGamesGrupo: 2, gamesVencidosGrupo: 6, saldoSetsGrupo: 1 },
      ]);
      mockPartidaReiDaPraiaRepository.contarFinalizadasPorGrupo.mockResolvedValue(1);

      const resultados = [
        {
          partidaId: "partida-1",
          placar: [{ numero: 1, gamesDupla1: 4, gamesDupla2: 6 }], // Inverter vencedor
        },
      ];

      const result = await service.registrarResultadosEmLote(TEST_ETAPA_ID, TEST_ARENA_ID, resultados);

      expect(result.processados).toBe(1);
      expect(result.erros).toHaveLength(0);
      expect(estatisticasJogadorService.reverterAposPartidaComIncrement).toHaveBeenCalled();
      expect(estatisticasJogadorService.atualizarAposPartidaGrupoComIncrement).toHaveBeenCalled();
    });

    it("deve recalcular classificação após registrar resultado", async () => {
      const partida = {
        id: "partida-1",
        grupoId: "grupo-1",
        jogador1AId: "j1",
        jogador1ANome: "Jogador 1",
        jogador1BId: "j2",
        jogador1BNome: "Jogador 2",
        jogador2AId: "j3",
        jogador2ANome: "Jogador 3",
        jogador2BId: "j4",
        jogador2BNome: "Jogador 4",
        status: StatusPartida.AGENDADA,
      };

      mockPartidaReiDaPraiaRepository.buscarPorIdEArena.mockResolvedValue(partida);
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue([]);

      const estatisticasMap = new Map([
        ["j1", { id: "e1" }],
        ["j2", { id: "e2" }],
        ["j3", { id: "e3" }],
        ["j4", { id: "e4" }],
      ]);
      (estatisticasJogadorService.buscarPorJogadoresEtapa as jest.Mock).mockResolvedValue(estatisticasMap);
      (estatisticasJogadorService.atualizarAposPartidaGrupoComIncrement as jest.Mock).mockResolvedValue(undefined);

      // Mock ordenação de jogadores
      (estatisticasJogadorService.buscarPorGrupo as jest.Mock).mockResolvedValue([
        { jogadorId: "j1", pontosGrupo: 6, vitoriasGrupo: 2, saldoGamesGrupo: 4, gamesVencidosGrupo: 12, saldoSetsGrupo: 2 },
        { jogadorId: "j2", pontosGrupo: 6, vitoriasGrupo: 2, saldoGamesGrupo: 4, gamesVencidosGrupo: 12, saldoSetsGrupo: 2 },
        { jogadorId: "j3", pontosGrupo: 0, vitoriasGrupo: 0, saldoGamesGrupo: -4, gamesVencidosGrupo: 8, saldoSetsGrupo: -2 },
        { jogadorId: "j4", pontosGrupo: 0, vitoriasGrupo: 0, saldoGamesGrupo: -4, gamesVencidosGrupo: 8, saldoSetsGrupo: -2 },
      ]);
      mockPartidaReiDaPraiaRepository.contarFinalizadasPorGrupo.mockResolvedValue(3);

      const resultados = [
        {
          partidaId: "partida-1",
          placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
        },
      ];

      await service.registrarResultadosEmLote(TEST_ETAPA_ID, TEST_ARENA_ID, resultados);

      expect(estatisticasJogadorService.atualizarPosicaoGrupo).toHaveBeenCalled();
      expect(mockGrupoRepository.marcarCompleto).toHaveBeenCalledWith("grupo-1", true);
    });

    it("deve processar múltiplos resultados em lote", async () => {
      const partida1 = {
        id: "partida-1",
        grupoId: "grupo-1",
        jogador1AId: "j1",
        jogador1ANome: "Jogador 1",
        jogador1BId: "j2",
        jogador1BNome: "Jogador 2",
        jogador2AId: "j3",
        jogador2ANome: "Jogador 3",
        jogador2BId: "j4",
        jogador2BNome: "Jogador 4",
        status: StatusPartida.AGENDADA,
      };

      const partida2 = {
        id: "partida-2",
        grupoId: "grupo-1",
        jogador1AId: "j1",
        jogador1ANome: "Jogador 1",
        jogador1BId: "j3",
        jogador1BNome: "Jogador 3",
        jogador2AId: "j2",
        jogador2ANome: "Jogador 2",
        jogador2BId: "j4",
        jogador2BNome: "Jogador 4",
        status: StatusPartida.AGENDADA,
      };

      mockPartidaReiDaPraiaRepository.buscarPorIdEArena
        .mockResolvedValueOnce(partida1)
        .mockResolvedValueOnce(partida2);

      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue([]);

      const estatisticasMap = new Map([
        ["j1", { id: "e1" }],
        ["j2", { id: "e2" }],
        ["j3", { id: "e3" }],
        ["j4", { id: "e4" }],
      ]);
      (estatisticasJogadorService.buscarPorJogadoresEtapa as jest.Mock).mockResolvedValue(estatisticasMap);
      (estatisticasJogadorService.atualizarAposPartidaGrupoComIncrement as jest.Mock).mockResolvedValue(undefined);
      (estatisticasJogadorService.buscarPorGrupo as jest.Mock).mockResolvedValue([
        { jogadorId: "j1", pontosGrupo: 6, vitoriasGrupo: 2, saldoGamesGrupo: 4, gamesVencidosGrupo: 12, saldoSetsGrupo: 2 },
        { jogadorId: "j2", pontosGrupo: 3, vitoriasGrupo: 1, saldoGamesGrupo: 0, gamesVencidosGrupo: 10, saldoSetsGrupo: 0 },
        { jogadorId: "j3", pontosGrupo: 3, vitoriasGrupo: 1, saldoGamesGrupo: 0, gamesVencidosGrupo: 10, saldoSetsGrupo: 0 },
        { jogadorId: "j4", pontosGrupo: 0, vitoriasGrupo: 0, saldoGamesGrupo: -4, gamesVencidosGrupo: 8, saldoSetsGrupo: -2 },
      ]);
      mockPartidaReiDaPraiaRepository.contarFinalizadasPorGrupo.mockResolvedValue(2);

      const resultados = [
        {
          partidaId: "partida-1",
          placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
        },
        {
          partidaId: "partida-2",
          placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 3 }],
        },
      ];

      const result = await service.registrarResultadosEmLote(TEST_ETAPA_ID, TEST_ARENA_ID, resultados);

      expect(result.processados).toBe(2);
      expect(result.erros).toHaveLength(0);
    });

    it("deve lidar com erro durante processamento de resultado individual", async () => {
      const partida = {
        id: "partida-1",
        grupoId: "grupo-1",
        jogador1AId: "j1",
        jogador1ANome: "Jogador 1",
        jogador1BId: "j2",
        jogador1BNome: "Jogador 2",
        jogador2AId: "j3",
        jogador2ANome: "Jogador 3",
        jogador2BId: "j4",
        jogador2BNome: "Jogador 4",
        status: StatusPartida.AGENDADA,
      };

      mockPartidaReiDaPraiaRepository.buscarPorIdEArena.mockResolvedValue(partida);
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue([]);

      const estatisticasMap = new Map([
        ["j1", { id: "e1" }],
        ["j2", { id: "e2" }],
        ["j3", { id: "e3" }],
        ["j4", { id: "e4" }],
      ]);
      (estatisticasJogadorService.buscarPorJogadoresEtapa as jest.Mock).mockResolvedValue(estatisticasMap);
      mockPartidaReiDaPraiaRepository.registrarResultado.mockRejectedValue(new Error("Erro ao registrar"));

      const resultados = [
        {
          partidaId: "partida-1",
          placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
        },
      ];

      const result = await service.registrarResultadosEmLote(TEST_ETAPA_ID, TEST_ARENA_ID, resultados);

      expect(result.processados).toBe(0);
      expect(result.erros).toHaveLength(1);
      expect(result.erros[0].erro).toBe("Erro ao registrar");
    });
  });

  describe("criarGrupos - erro", () => {
    it("deve lançar erro ao falhar ao criar grupos", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue({
        id: TEST_ETAPA_ID,
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
        chavesGeradas: false,
        totalInscritos: 8,
        maxJogadores: 8,
      });

      const inscricoes = Array.from({ length: 8 }, (_, i) => ({
        id: `inscricao-${i}`,
        jogadorId: `jogador-${i}`,
        jogadorNome: `Jogador ${i}`,
        jogadorNivel: NivelJogador.INTERMEDIARIO,
        jogadorGenero: GeneroJogador.MASCULINO,
      }));

      mockInscricaoRepository.buscarConfirmadas.mockResolvedValue(inscricoes);
      (cabecaDeChaveService.obterIdsCabecas as jest.Mock).mockResolvedValue([]);

      (estatisticasJogadorService.criarEmLote as jest.Mock).mockImplementation(
        (dtos: any[]) => Promise.resolve(
          dtos.map((dto) => ({
            id: `estatistica-${dto.jogadorId}`,
            ...dto,
          }))
        )
      );

      // Simular erro ao criar grupos
      mockGrupoRepository.criarEmLote.mockRejectedValue(new Error("Erro ao criar grupos"));

      await expect(
        service.gerarChaves(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Falha ao criar grupos");
    });
  });

  describe("formarDuplasSorteioAleatorio - erro", () => {
    it("deve lançar erro com número ímpar de classificados", async () => {
      mockGrupoRepository.buscarCompletos.mockResolvedValue([
        { id: "grupo-1", nome: "Grupo A" },
        { id: "grupo-2", nome: "Grupo B" },
      ]);

      // Retornar número ímpar de classificados (3)
      (estatisticasJogadorService.buscarClassificados as jest.Mock)
        .mockResolvedValueOnce([
          { jogadorId: "j1", jogadorNome: "Jogador 1", posicaoGrupo: 1, grupoId: "grupo-1" },
        ])
        .mockResolvedValueOnce([
          { jogadorId: "j3", jogadorNome: "Jogador 3", posicaoGrupo: 1, grupoId: "grupo-2" },
          { jogadorId: "j4", jogadorNome: "Jogador 4", posicaoGrupo: 2, grupoId: "grupo-2" },
        ]);

      await expect(
        service.gerarFaseEliminatoria(
          TEST_ETAPA_ID,
          TEST_ARENA_ID,
          1,
          TipoChaveamentoReiDaPraia.SORTEIO_ALEATORIO
        )
      ).rejects.toThrow("Número ímpar de classificados");
    });
  });

  describe("formarDuplasMelhoresComMelhores - ordenação", () => {
    it("deve ordenar por saldo de games quando pontos e vitórias iguais", async () => {
      mockGrupoRepository.buscarCompletos.mockResolvedValue([
        { id: "grupo-1", nome: "Grupo A" },
        { id: "grupo-2", nome: "Grupo B" },
        { id: "grupo-3", nome: "Grupo C" },
        { id: "grupo-4", nome: "Grupo D" },
      ]);

      // Jogadores com mesmos pontos e vitórias, diferentes saldos de games
      (estatisticasJogadorService.buscarClassificados as jest.Mock)
        .mockResolvedValueOnce([
          { jogadorId: "j1", jogadorNome: "Jogador 1", posicaoGrupo: 1, grupoId: "grupo-1", pontosGrupo: 9, vitoriasGrupo: 3, saldoGamesGrupo: 10 },
          { jogadorId: "j2", jogadorNome: "Jogador 2", posicaoGrupo: 2, grupoId: "grupo-1", pontosGrupo: 6, vitoriasGrupo: 2, saldoGamesGrupo: 4 },
        ])
        .mockResolvedValueOnce([
          { jogadorId: "j3", jogadorNome: "Jogador 3", posicaoGrupo: 1, grupoId: "grupo-2", pontosGrupo: 9, vitoriasGrupo: 3, saldoGamesGrupo: 8 },
          { jogadorId: "j4", jogadorNome: "Jogador 4", posicaoGrupo: 2, grupoId: "grupo-2", pontosGrupo: 6, vitoriasGrupo: 2, saldoGamesGrupo: 2 },
        ])
        .mockResolvedValueOnce([
          { jogadorId: "j5", jogadorNome: "Jogador 5", posicaoGrupo: 1, grupoId: "grupo-3", pontosGrupo: 9, vitoriasGrupo: 3, saldoGamesGrupo: 5 },
          { jogadorId: "j6", jogadorNome: "Jogador 6", posicaoGrupo: 2, grupoId: "grupo-3", pontosGrupo: 6, vitoriasGrupo: 2, saldoGamesGrupo: 1 },
        ])
        .mockResolvedValueOnce([
          { jogadorId: "j7", jogadorNome: "Jogador 7", posicaoGrupo: 1, grupoId: "grupo-4", pontosGrupo: 9, vitoriasGrupo: 3, saldoGamesGrupo: 3 },
          { jogadorId: "j8", jogadorNome: "Jogador 8", posicaoGrupo: 2, grupoId: "grupo-4", pontosGrupo: 6, vitoriasGrupo: 2, saldoGamesGrupo: 0 },
        ]);

      mockDuplaRepository.criar.mockImplementation((dto: any) =>
        Promise.resolve({
          id: `dupla-${dto.jogador1Id}-${dto.jogador2Id}`,
          ...dto,
        })
      );

      mockConfrontoRepository.criar.mockImplementation((dto: any) =>
        Promise.resolve({
          id: `confronto-${dto.ordem}`,
          ...dto,
          status: StatusConfrontoEliminatorio.AGENDADA,
        })
      );

      const result = await service.gerarFaseEliminatoria(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        2,
        TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES
      );

      expect(result.duplas).toHaveLength(4);
      expect(mockDuplaRepository.criar).toHaveBeenCalled();
    });
  });

  describe("recalcularClassificacaoGrupo - ordenação", () => {
    it("deve ordenar por vitórias quando pontos iguais", async () => {
      const partida = {
        id: "partida-1",
        grupoId: "grupo-1",
        jogador1AId: "j1",
        jogador1ANome: "Jogador 1",
        jogador1BId: "j2",
        jogador1BNome: "Jogador 2",
        jogador2AId: "j3",
        jogador2ANome: "Jogador 3",
        jogador2BId: "j4",
        jogador2BNome: "Jogador 4",
        status: StatusPartida.AGENDADA,
      };

      mockPartidaReiDaPraiaRepository.buscarPorIdEArena.mockResolvedValue(partida);
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue([]);

      const estatisticasMap = new Map([
        ["j1", { id: "e1" }],
        ["j2", { id: "e2" }],
        ["j3", { id: "e3" }],
        ["j4", { id: "e4" }],
      ]);
      (estatisticasJogadorService.buscarPorJogadoresEtapa as jest.Mock).mockResolvedValue(estatisticasMap);
      (estatisticasJogadorService.atualizarAposPartidaGrupoComIncrement as jest.Mock).mockResolvedValue(undefined);

      // Jogadores com mesmos pontos mas diferentes vitórias
      (estatisticasJogadorService.buscarPorGrupo as jest.Mock).mockResolvedValue([
        { jogadorId: "j1", pontosGrupo: 6, vitoriasGrupo: 2, saldoGamesGrupo: 4, gamesVencidosGrupo: 12, saldoSetsGrupo: 2 },
        { jogadorId: "j2", pontosGrupo: 6, vitoriasGrupo: 3, saldoGamesGrupo: 4, gamesVencidosGrupo: 12, saldoSetsGrupo: 2 }, // Mais vitórias
        { jogadorId: "j3", pontosGrupo: 6, vitoriasGrupo: 1, saldoGamesGrupo: 4, gamesVencidosGrupo: 12, saldoSetsGrupo: 2 },
        { jogadorId: "j4", pontosGrupo: 6, vitoriasGrupo: 2, saldoGamesGrupo: 4, gamesVencidosGrupo: 12, saldoSetsGrupo: 2 },
      ]);
      mockPartidaReiDaPraiaRepository.contarFinalizadasPorGrupo.mockResolvedValue(3);

      const resultados = [
        {
          partidaId: "partida-1",
          placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
        },
      ];

      await service.registrarResultadosEmLote(TEST_ETAPA_ID, TEST_ARENA_ID, resultados);

      // j2 deve ser o primeiro por ter mais vitórias
      expect(estatisticasJogadorService.atualizarPosicaoGrupo).toHaveBeenNthCalledWith(1, "j2", TEST_ETAPA_ID, 1);
    });

    it("deve ordenar por games vencidos quando saldo de games igual", async () => {
      const partida = {
        id: "partida-1",
        grupoId: "grupo-1",
        jogador1AId: "j1",
        jogador1ANome: "Jogador 1",
        jogador1BId: "j2",
        jogador1BNome: "Jogador 2",
        jogador2AId: "j3",
        jogador2ANome: "Jogador 3",
        jogador2BId: "j4",
        jogador2BNome: "Jogador 4",
        status: StatusPartida.AGENDADA,
      };

      mockPartidaReiDaPraiaRepository.buscarPorIdEArena.mockResolvedValue(partida);
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue([]);

      const estatisticasMap = new Map([
        ["j1", { id: "e1" }],
        ["j2", { id: "e2" }],
        ["j3", { id: "e3" }],
        ["j4", { id: "e4" }],
      ]);
      (estatisticasJogadorService.buscarPorJogadoresEtapa as jest.Mock).mockResolvedValue(estatisticasMap);
      (estatisticasJogadorService.atualizarAposPartidaGrupoComIncrement as jest.Mock).mockResolvedValue(undefined);

      // Jogadores com mesmos pontos, vitórias e saldo de games, mas diferentes games vencidos
      (estatisticasJogadorService.buscarPorGrupo as jest.Mock).mockResolvedValue([
        { jogadorId: "j1", pontosGrupo: 6, vitoriasGrupo: 2, saldoGamesGrupo: 4, gamesVencidosGrupo: 10, saldoSetsGrupo: 2 },
        { jogadorId: "j2", pontosGrupo: 6, vitoriasGrupo: 2, saldoGamesGrupo: 4, gamesVencidosGrupo: 15, saldoSetsGrupo: 2 }, // Mais games vencidos
        { jogadorId: "j3", pontosGrupo: 6, vitoriasGrupo: 2, saldoGamesGrupo: 4, gamesVencidosGrupo: 12, saldoSetsGrupo: 2 },
        { jogadorId: "j4", pontosGrupo: 6, vitoriasGrupo: 2, saldoGamesGrupo: 4, gamesVencidosGrupo: 8, saldoSetsGrupo: 2 },
      ]);
      mockPartidaReiDaPraiaRepository.contarFinalizadasPorGrupo.mockResolvedValue(3);

      const resultados = [
        {
          partidaId: "partida-1",
          placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
        },
      ];

      await service.registrarResultadosEmLote(TEST_ETAPA_ID, TEST_ARENA_ID, resultados);

      // j2 deve ser o primeiro por ter mais games vencidos
      expect(estatisticasJogadorService.atualizarPosicaoGrupo).toHaveBeenNthCalledWith(1, "j2", TEST_ETAPA_ID, 1);
    });

    it("deve ordenar por saldo de sets quando games vencidos iguais", async () => {
      const partida = {
        id: "partida-1",
        grupoId: "grupo-1",
        jogador1AId: "j1",
        jogador1ANome: "Jogador 1",
        jogador1BId: "j2",
        jogador1BNome: "Jogador 2",
        jogador2AId: "j3",
        jogador2ANome: "Jogador 3",
        jogador2BId: "j4",
        jogador2BNome: "Jogador 4",
        status: StatusPartida.AGENDADA,
      };

      mockPartidaReiDaPraiaRepository.buscarPorIdEArena.mockResolvedValue(partida);
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue([]);

      const estatisticasMap = new Map([
        ["j1", { id: "e1" }],
        ["j2", { id: "e2" }],
        ["j3", { id: "e3" }],
        ["j4", { id: "e4" }],
      ]);
      (estatisticasJogadorService.buscarPorJogadoresEtapa as jest.Mock).mockResolvedValue(estatisticasMap);
      (estatisticasJogadorService.atualizarAposPartidaGrupoComIncrement as jest.Mock).mockResolvedValue(undefined);

      // Jogadores com mesmos pontos, vitórias, saldo de games e games vencidos, mas diferentes saldos de sets
      (estatisticasJogadorService.buscarPorGrupo as jest.Mock).mockResolvedValue([
        { jogadorId: "j1", pontosGrupo: 6, vitoriasGrupo: 2, saldoGamesGrupo: 4, gamesVencidosGrupo: 12, saldoSetsGrupo: 1 },
        { jogadorId: "j2", pontosGrupo: 6, vitoriasGrupo: 2, saldoGamesGrupo: 4, gamesVencidosGrupo: 12, saldoSetsGrupo: 3 }, // Melhor saldo de sets
        { jogadorId: "j3", pontosGrupo: 6, vitoriasGrupo: 2, saldoGamesGrupo: 4, gamesVencidosGrupo: 12, saldoSetsGrupo: 2 },
        { jogadorId: "j4", pontosGrupo: 6, vitoriasGrupo: 2, saldoGamesGrupo: 4, gamesVencidosGrupo: 12, saldoSetsGrupo: 0 },
      ]);
      mockPartidaReiDaPraiaRepository.contarFinalizadasPorGrupo.mockResolvedValue(3);

      const resultados = [
        {
          partidaId: "partida-1",
          placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
        },
      ];

      await service.registrarResultadosEmLote(TEST_ETAPA_ID, TEST_ARENA_ID, resultados);

      // j2 deve ser o primeiro por ter melhor saldo de sets
      expect(estatisticasJogadorService.atualizarPosicaoGrupo).toHaveBeenNthCalledWith(1, "j2", TEST_ETAPA_ID, 1);
    });
  });

});
