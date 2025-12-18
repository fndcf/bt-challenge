/**
 * Testes do ServiceContainer
 */

// Mock de todos os services antes de importar o container
jest.mock("@/services/arenaAdminService", () => ({
  __esModule: true,
  default: { criar: jest.fn(), listar: jest.fn() },
}));

jest.mock("@/services/arenaPublicService", () => ({
  __esModule: true,
  default: { buscarArena: jest.fn() },
}));

jest.mock("@/services/etapaService", () => ({
  __esModule: true,
  default: { criar: jest.fn(), listar: jest.fn() },
}));

jest.mock("@/services/jogadorService", () => ({
  __esModule: true,
  default: { criar: jest.fn(), listar: jest.fn() },
}));

jest.mock("@/services/chaveService", () => ({
  __esModule: true,
  default: { gerarChaves: jest.fn() },
}));

jest.mock("@/services/cabecaDeChaveService", () => ({
  __esModule: true,
  default: { criar: jest.fn() },
}));

jest.mock("@/services/partidaService", () => ({
  __esModule: true,
  default: { registrarResultado: jest.fn() },
}));

jest.mock("@/services/reiDaPraiaService", () => ({
  __esModule: true,
  default: { gerarChaves: jest.fn() },
}));

jest.mock("@/services/superXService", () => ({
  __esModule: true,
  default: { buscarGrupo: jest.fn(), buscarJogadores: jest.fn(), buscarPartidas: jest.fn() },
}));

jest.mock("@/services/teamsService", () => ({
  __esModule: true,
  default: { gerarEquipes: jest.fn() },
}));

jest.mock("@/services/apiClient", () => ({
  __esModule: true,
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

import {
  container,
  getArenaAdminService,
  getArenaPublicService,
  getEtapaService,
  getJogadorService,
  getChaveService,
  getCabecaDeChaveService,
  getPartidaService,
  getReiDaPraiaService,
} from "@/services/container";

describe("ServiceContainer", () => {
  // Testar helper functions PRIMEIRO, antes de qualquer clear
  describe("helper functions", () => {
    it("getArenaAdminService deve retornar o service", () => {
      const service = getArenaAdminService();
      expect(service).toBeDefined();
    });

    it("getArenaPublicService deve retornar o service", () => {
      const service = getArenaPublicService();
      expect(service).toBeDefined();
    });

    it("getEtapaService deve retornar o service", () => {
      const service = getEtapaService();
      expect(service).toBeDefined();
    });

    it("getJogadorService deve retornar o service", () => {
      const service = getJogadorService();
      expect(service).toBeDefined();
    });

    it("getChaveService deve retornar o service", () => {
      const service = getChaveService();
      expect(service).toBeDefined();
    });

    it("getCabecaDeChaveService deve retornar o service", () => {
      const service = getCabecaDeChaveService();
      expect(service).toBeDefined();
    });

    it("getPartidaService deve retornar o service", () => {
      const service = getPartidaService();
      expect(service).toBeDefined();
    });

    it("getReiDaPraiaService deve retornar o service", () => {
      const service = getReiDaPraiaService();
      expect(service).toBeDefined();
    });
  });

  describe("register e get", () => {
    it("deve registrar e obter um service", () => {
      const mockService = { test: jest.fn() };
      container.register("testService", mockService);

      const retrieved = container.get("testService");

      expect(retrieved).toBe(mockService);

      // Cleanup
      container.remove("testService");
    });

    it("deve lançar erro ao obter service não registrado", () => {
      expect(() => container.get("serviceInexistente")).toThrow(
        'Service "serviceInexistente" não encontrado no container'
      );
    });
  });

  describe("has", () => {
    it("deve retornar true para service registrado", () => {
      expect(container.has("etapaService")).toBe(true);
    });

    it("deve retornar false para service não registrado", () => {
      expect(container.has("serviceInexistente")).toBe(false);
    });
  });

  describe("remove", () => {
    it("deve remover um service", () => {
      const mockService = { remove: jest.fn() };
      container.register("toRemove", mockService);

      expect(container.has("toRemove")).toBe(true);

      container.remove("toRemove");

      expect(container.has("toRemove")).toBe(false);
    });
  });

  describe("clear", () => {
    it("deve limpar todos os services temporários", () => {
      // Registrar services de teste temporários
      container.register("temp1", { a: 1 });
      container.register("temp2", { b: 2 });

      expect(container.has("temp1")).toBe(true);
      expect(container.has("temp2")).toBe(true);

      // Remover apenas os temporários (não usar clear para não afetar outros testes)
      container.remove("temp1");
      container.remove("temp2");

      expect(container.has("temp1")).toBe(false);
      expect(container.has("temp2")).toBe(false);
    });

    it("clear deve remover todos os services", () => {
      // Criar um container separado para testar clear
      // Usamos o container real mas vamos re-registrar depois
      const originalServices = [
        "arenaAdminService",
        "arenaPublicService",
        "etapaService",
        "jogadorService",
        "chaveService",
        "cabecaDeChaveService",
        "partidaService",
        "reiDaPraiaService",
      ];

      // Salvar referências
      const savedServices: Record<string, any> = {};
      originalServices.forEach((key) => {
        if (container.has(key)) {
          savedServices[key] = container.get(key);
        }
      });

      // Adicionar temporários
      container.register("clearTest1", { x: 1 });
      container.register("clearTest2", { y: 2 });

      // Clear
      container.clear();

      expect(container.has("clearTest1")).toBe(false);
      expect(container.has("clearTest2")).toBe(false);
      expect(container.has("etapaService")).toBe(false);

      // Restaurar services originais
      Object.entries(savedServices).forEach(([key, service]) => {
        container.register(key, service);
      });
    });
  });
});
