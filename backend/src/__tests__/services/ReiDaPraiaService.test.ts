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
    atualizarGrupo: jest.fn(),
    buscarPorGrupo: jest.fn(),
    atualizarAposPartidaGrupo: jest.fn(),
    atualizarAposPartida: jest.fn(),
    reverterAposPartidaGrupo: jest.fn(),
    reverterAposPartida: jest.fn(),
    atualizarPosicaoGrupo: jest.fn(),
    buscarClassificados: jest.fn(),
    marcarComoClassificado: jest.fn(),
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
    atualizarContadores: jest.fn(),
    adicionarPartida: jest.fn(),
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

      // Mock estatísticas criadas
      (estatisticasJogadorService.criar as jest.Mock).mockImplementation(
        (dto: any) => Promise.resolve({
          id: `estatistica-${dto.jogadorId}`,
          ...dto,
          jogosGrupo: 0,
          vitoriasGrupo: 0,
          pontosGrupo: 0,
        })
      );

      // Mock grupos criados
      mockGrupoRepository.criar.mockImplementation((dto: any) =>
        Promise.resolve({
          id: `grupo-${dto.ordem}`,
          ...dto,
        })
      );

      // Mock estatísticas por grupo
      mockEstatisticasJogadorRepository.buscarPorGrupo.mockResolvedValue([
        { id: "e1", jogadorId: "j1", jogadorNome: "Jogador 1" },
        { id: "e2", jogadorId: "j2", jogadorNome: "Jogador 2" },
        { id: "e3", jogadorId: "j3", jogadorNome: "Jogador 3" },
        { id: "e4", jogadorId: "j4", jogadorNome: "Jogador 4" },
      ]);

      // Mock partidas criadas
      mockPartidaReiDaPraiaRepository.criar.mockImplementation((dto: any) =>
        Promise.resolve({
          id: `partida-${Date.now()}`,
          ...dto,
        })
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

      (estatisticasJogadorService.criar as jest.Mock).mockImplementation(
        (dto: any) => Promise.resolve({
          id: `estatistica-${dto.jogadorId}`,
          ...dto,
        })
      );

      mockGrupoRepository.criar.mockImplementation((dto: any) =>
        Promise.resolve({
          id: `grupo-${dto.ordem}`,
          ...dto,
        })
      );

      mockEstatisticasJogadorRepository.buscarPorGrupo.mockResolvedValue([
        { id: "e1", jogadorId: "j1", jogadorNome: "Jogador 1" },
        { id: "e2", jogadorId: "j2", jogadorNome: "Jogador 2" },
        { id: "e3", jogadorId: "j3", jogadorNome: "Jogador 3" },
        { id: "e4", jogadorId: "j4", jogadorNome: "Jogador 4" },
      ]);

      mockPartidaReiDaPraiaRepository.criar.mockImplementation((dto: any) =>
        Promise.resolve({
          id: `partida-${Date.now()}`,
          ...dto,
        })
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

      (estatisticasJogadorService.criar as jest.Mock).mockImplementation(
        (dto: any) => Promise.resolve({
          id: `estatistica-${dto.jogadorId}`,
          ...dto,
        })
      );

      mockGrupoRepository.criar.mockImplementation((dto: any) =>
        Promise.resolve({
          id: `grupo-${dto.ordem}`,
          ...dto,
        })
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

});
