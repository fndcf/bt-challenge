/**
 * Testes do ServiceContainer
 */

// Mock de todos os repositories e services antes de importar
jest.mock("../../repositories/ArenaRepository", () => ({
  arenaRepository: { buscar: jest.fn() },
}));

jest.mock("../../repositories/firebase", () => ({
  etapaRepository: { buscar: jest.fn() },
  jogadorRepository: { buscar: jest.fn() },
  duplaRepository: { buscar: jest.fn() },
  grupoRepository: { buscar: jest.fn() },
  partidaRepository: { buscar: jest.fn() },
  inscricaoRepository: { buscar: jest.fn() },
  confrontoEliminatorioRepository: { buscar: jest.fn() },
}));

jest.mock("../../services/ArenaService", () => ({
  ArenaService: jest.fn(),
  arenaService: { criar: jest.fn() },
}));

jest.mock("../../services/EtapaService", () => ({
  __esModule: true,
  default: { buscar: jest.fn() },
}));

jest.mock("../../services/JogadorService", () => ({
  __esModule: true,
  default: { buscar: jest.fn() },
}));

jest.mock("../../services/DuplaService", () => ({
  __esModule: true,
  default: { buscar: jest.fn() },
}));

jest.mock("../../services/GrupoService", () => ({
  __esModule: true,
  default: { buscar: jest.fn() },
}));

jest.mock("../../services/PartidaGrupoService", () => ({
  __esModule: true,
  default: { buscar: jest.fn() },
}));

jest.mock("../../services/ClassificacaoService", () => ({
  __esModule: true,
  default: { buscar: jest.fn() },
}));

jest.mock("../../services/EliminatoriaService", () => ({
  __esModule: true,
  default: { buscar: jest.fn() },
}));

jest.mock("../../services/ChaveService", () => ({
  __esModule: true,
  default: { buscar: jest.fn() },
}));

jest.mock("../../services/CabecaDeChaveService", () => ({
  __esModule: true,
  default: { buscar: jest.fn() },
}));

jest.mock("../../services/EstatisticasJogadorService", () => ({
  __esModule: true,
  default: { buscar: jest.fn() },
}));

jest.mock("../../services/HistoricoDuplaService", () => ({
  __esModule: true,
  default: { buscar: jest.fn() },
}));

jest.mock("../../services/ReiDaPraiaService", () => ({
  __esModule: true,
  default: { buscar: jest.fn() },
}));

import {
  container,
  repositories,
  services,
  createTestContainer,
  resetContainer,
} from "../../services/ServiceContainer";

describe("ServiceContainer", () => {
  beforeEach(() => {
    // Resetar container antes de cada teste
    resetContainer();
  });

  describe("Singleton", () => {
    it("deve retornar a mesma instância do container", () => {
      const container1 = container;
      const container2 = container;

      // Ambos devem ser a mesma instância
      expect(container1).toBe(container2);
    });

    it("deve resetar o container corretamente", () => {
      // Acessar repositories para inicializar cache
      void container.repositories;

      // Resetar
      resetContainer();

      // Após reset, deve ser uma nova instância
      // O container foi recriado, então os caches foram limpos
      expect(container.repositories).toBeDefined();
    });
  });

  describe("repositories", () => {
    it("deve expor todos os repositories", () => {
      expect(repositories).toBeDefined();
      expect(repositories.arena).toBeDefined();
      expect(repositories.etapa).toBeDefined();
      expect(repositories.jogador).toBeDefined();
      expect(repositories.dupla).toBeDefined();
      expect(repositories.grupo).toBeDefined();
      expect(repositories.partida).toBeDefined();
      expect(repositories.inscricao).toBeDefined();
      expect(repositories.confrontoEliminatorio).toBeDefined();
    });

    it("deve usar cache para repositories", () => {
      const repos1 = container.repositories;
      const repos2 = container.repositories;

      expect(repos1).toBe(repos2);
    });
  });

  describe("services", () => {
    it("deve expor todos os services", () => {
      expect(services).toBeDefined();
      expect(services.arena).toBeDefined();
      expect(services.etapa).toBeDefined();
      expect(services.jogador).toBeDefined();
      expect(services.dupla).toBeDefined();
      expect(services.grupo).toBeDefined();
      expect(services.partidaGrupo).toBeDefined();
      expect(services.classificacao).toBeDefined();
      expect(services.eliminatoria).toBeDefined();
      expect(services.chave).toBeDefined();
      expect(services.cabecaDeChave).toBeDefined();
      expect(services.estatisticasJogador).toBeDefined();
      expect(services.historicoDupla).toBeDefined();
      expect(services.reiDaPraia).toBeDefined();
    });

    it("deve usar cache para services", () => {
      const services1 = container.services;
      const services2 = container.services;

      expect(services1).toBe(services2);
    });
  });

  describe("createTestContainer", () => {
    it("deve criar container com repositories mockados", () => {
      const mockArenaRepo = { buscar: jest.fn().mockReturnValue("mock") };

      const testContainer = createTestContainer({
        repositories: {
          arena: mockArenaRepo as any,
        },
      });

      expect(testContainer.repositories.arena).toBe(mockArenaRepo);
    });

    it("deve criar container com services mockados", () => {
      const mockArenaService = { criar: jest.fn().mockReturnValue("mock") };

      const testContainer = createTestContainer({
        services: {
          arena: mockArenaService as any,
        },
      });

      expect(testContainer.services.arena).toBe(mockArenaService);
    });

    it("deve manter outros repositories/services ao fazer override parcial", () => {
      const mockArenaRepo = { buscar: jest.fn() };

      const testContainer = createTestContainer({
        repositories: {
          arena: mockArenaRepo as any,
        },
      });

      // Arena foi substituído
      expect(testContainer.repositories.arena).toBe(mockArenaRepo);

      // Outros ainda existem
      expect(testContainer.repositories.etapa).toBeDefined();
      expect(testContainer.repositories.jogador).toBeDefined();
    });

    it("deve resetar container antes de aplicar overrides", () => {
      // Primeiro container com mock
      const mock1 = { buscar: jest.fn() };
      createTestContainer({
        repositories: { arena: mock1 as any },
      });

      // Segundo container com outro mock
      const mock2 = { buscar: jest.fn() };
      const testContainer = createTestContainer({
        repositories: { arena: mock2 as any },
      });

      // Deve ter o segundo mock
      expect(testContainer.repositories.arena).toBe(mock2);
    });

    it("deve criar container sem overrides", () => {
      const testContainer = createTestContainer();

      expect(testContainer.repositories).toBeDefined();
      expect(testContainer.services).toBeDefined();
    });

    it("deve ignorar valores undefined em overrides", () => {
      const testContainer = createTestContainer({
        repositories: {
          arena: undefined,
        } as any,
      });

      // Deve manter o original
      expect(testContainer.repositories.arena).toBeDefined();
    });
  });

  describe("setRepository", () => {
    it("deve permitir substituir um repository específico", () => {
      resetContainer();

      const mockRepo = { customMethod: jest.fn() };

      // Acessar container diretamente não é possível pois é privado
      // Mas podemos testar via createTestContainer que usa setRepository internamente
      const testContainer = createTestContainer({
        repositories: {
          etapa: mockRepo as any,
        },
      });

      expect(testContainer.repositories.etapa).toBe(mockRepo);
    });
  });

  describe("setService", () => {
    it("deve permitir substituir um service específico", () => {
      resetContainer();

      const mockService = { customMethod: jest.fn() };

      const testContainer = createTestContainer({
        services: {
          etapa: mockService as any,
        },
      });

      expect(testContainer.services.etapa).toBe(mockService);
    });
  });

  describe("Integração", () => {
    it("deve permitir múltiplos overrides simultâneos", () => {
      const mockArenaRepo = { id: "arenaRepo" };
      const mockEtapaRepo = { id: "etapaRepo" };
      const mockArenaService = { id: "arenaService" };
      const mockEtapaService = { id: "etapaService" };

      const testContainer = createTestContainer({
        repositories: {
          arena: mockArenaRepo as any,
          etapa: mockEtapaRepo as any,
        },
        services: {
          arena: mockArenaService as any,
          etapa: mockEtapaService as any,
        },
      });

      expect(testContainer.repositories.arena).toBe(mockArenaRepo);
      expect(testContainer.repositories.etapa).toBe(mockEtapaRepo);
      expect(testContainer.services.arena).toBe(mockArenaService);
      expect(testContainer.services.etapa).toBe(mockEtapaService);
    });

    it("deve garantir isolamento entre testes ao resetar", () => {
      // Teste 1: Configura mock
      const mock1 = { id: "mock1" };
      createTestContainer({
        repositories: { arena: mock1 as any },
      });

      // Reset
      resetContainer();

      // Teste 2: Sem mock, deve ter o original
      const freshContainer = createTestContainer();

      expect(freshContainer.repositories.arena).not.toBe(mock1);
    });
  });
});
