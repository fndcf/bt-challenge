/**
 * Testes do ArenaService
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

// Mock do Firebase
const mockDocSet = jest.fn();
const mockDoc = jest.fn(() => ({ set: mockDocSet }));
const mockCollection = jest.fn(() => ({ doc: mockDoc }));

const mockCreateUser = jest.fn();
const mockDeleteUser = jest.fn();
const mockGenerateEmailVerificationLink = jest.fn();

jest.mock("../../config/firebase", () => ({
  db: {
    collection: mockCollection,
  },
  auth: {
    createUser: mockCreateUser,
    deleteUser: mockDeleteUser,
    generateEmailVerificationLink: mockGenerateEmailVerificationLink,
  },
}));

jest.mock("../../utils/slugify", () => ({
  generateUniqueSlug: jest.fn((nome: string) =>
    Promise.resolve(nome.toLowerCase().replace(/\s+/g, "-"))
  ),
}));

import { ArenaService } from "../../services/ArenaService";
import { Arena } from "../../domain/Arena";
import { BadRequestError, ConflictError, NotFoundError } from "../../utils/errors";

describe("ArenaService", () => {
  let arenaService: ArenaService;
  let mockArenaRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockArenaRepository = {
      exists: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findByAdminUid: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    arenaService = new ArenaService(mockArenaRepository);
  });

  describe("createArena", () => {
    const validData = {
      nome: "Arena Beach Tennis",
      adminEmail: "admin@arena.com",
      adminPassword: "senha123",
    };

    it("deve criar arena com sucesso", async () => {
      mockArenaRepository.exists.mockResolvedValue(false);
      mockCreateUser.mockResolvedValue({ uid: "admin-uid-123" });

      const mockArena = new Arena({
        id: "arena-123",
        nome: validData.nome,
        slug: "arena-beach-tennis",
        adminEmail: validData.adminEmail,
        adminUid: "admin-uid-123",
        ativa: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockArenaRepository.create.mockResolvedValue(mockArena);
      mockDocSet.mockResolvedValue(undefined);
      mockGenerateEmailVerificationLink.mockResolvedValue("http://verify.link");

      const result = await arenaService.createArena(validData);

      expect(result.arena).toBeDefined();
      expect(result.adminUid).toBe("admin-uid-123");
      expect(result.message).toContain("criada com sucesso");
      expect(mockCreateUser).toHaveBeenCalledWith({
        email: validData.adminEmail,
        password: validData.adminPassword,
        emailVerified: false,
      });
    });

    it("deve lançar erro se slug já existe", async () => {
      mockArenaRepository.exists.mockResolvedValue(true);

      const dataComSlug = {
        ...validData,
        slug: "slug-existente",
      };

      await expect(arenaService.createArena(dataComSlug)).rejects.toThrow(
        ConflictError
      );
    });

    it("deve lançar erro se nome muito curto", async () => {
      const dataInvalida = {
        ...validData,
        nome: "AB",
      };

      await expect(arenaService.createArena(dataInvalida)).rejects.toThrow(
        BadRequestError
      );
    });

    it("deve lançar erro se email inválido", async () => {
      const dataInvalida = {
        ...validData,
        adminEmail: "email-invalido",
      };

      await expect(arenaService.createArena(dataInvalida)).rejects.toThrow(
        BadRequestError
      );
    });

    it("deve lançar erro se senha muito curta", async () => {
      const dataInvalida = {
        ...validData,
        adminPassword: "123",
      };

      await expect(arenaService.createArena(dataInvalida)).rejects.toThrow(
        BadRequestError
      );
    });

    it("deve fazer rollback se criação da arena falhar", async () => {
      mockArenaRepository.exists.mockResolvedValue(false);
      mockCreateUser.mockResolvedValue({ uid: "admin-uid-123" });
      mockArenaRepository.create.mockRejectedValue(
        new Error("Erro no Firestore")
      );
      mockDeleteUser.mockResolvedValue(undefined);

      await expect(arenaService.createArena(validData)).rejects.toThrow();

      expect(mockDeleteUser).toHaveBeenCalledWith("admin-uid-123");
    });

    it("deve lançar erro ConflictError se email já cadastrado", async () => {
      mockArenaRepository.exists.mockResolvedValue(false);
      const authError = new Error("Email already exists");
      (authError as any).code = "auth/email-already-exists";
      mockCreateUser.mockRejectedValue(authError);

      await expect(arenaService.createArena(validData)).rejects.toThrow(
        ConflictError
      );
    });

    it("deve rejeitar slug reservado", async () => {
      const dataComSlugReservado = {
        ...validData,
        slug: "admin",
      };

      await expect(arenaService.createArena(dataComSlugReservado)).rejects.toThrow(
        BadRequestError
      );
    });

    it("deve rejeitar slug com caracteres inválidos", async () => {
      const dataComSlugInvalido = {
        ...validData,
        slug: "Arena_Teste",
      };

      await expect(arenaService.createArena(dataComSlugInvalido)).rejects.toThrow(
        BadRequestError
      );
    });
  });

  describe("getArenaById", () => {
    it("deve retornar arena quando encontrada", async () => {
      const mockArena = new Arena({
        id: "arena-123",
        nome: "Arena Test",
        slug: "arena-test",
        adminEmail: "admin@test.com",
        adminUid: "uid-123",
        ativa: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockArenaRepository.findById.mockResolvedValue(mockArena);

      const result = await arenaService.getArenaById("arena-123");

      expect(result).toEqual(mockArena);
      expect(mockArenaRepository.findById).toHaveBeenCalledWith("arena-123");
    });

    it("deve lançar NotFoundError quando arena não encontrada", async () => {
      mockArenaRepository.findById.mockResolvedValue(null);

      await expect(
        arenaService.getArenaById("arena-inexistente")
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("getArenaBySlug", () => {
    it("deve retornar arena quando encontrada", async () => {
      const mockArena = new Arena({
        id: "arena-123",
        nome: "Arena Test",
        slug: "arena-test",
        adminEmail: "admin@test.com",
        adminUid: "uid-123",
        ativa: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockArenaRepository.findBySlug.mockResolvedValue(mockArena);

      const result = await arenaService.getArenaBySlug("arena-test");

      expect(result).toEqual(mockArena);
      expect(mockArenaRepository.findBySlug).toHaveBeenCalledWith("arena-test");
    });

    it("deve lançar NotFoundError quando arena não encontrada", async () => {
      mockArenaRepository.findBySlug.mockResolvedValue(null);

      await expect(
        arenaService.getArenaBySlug("slug-inexistente")
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("getAdminArena", () => {
    it("deve retornar arena do admin", async () => {
      const mockArena = new Arena({
        id: "arena-123",
        nome: "Arena Test",
        slug: "arena-test",
        adminEmail: "admin@test.com",
        adminUid: "admin-uid-123",
        ativa: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockArenaRepository.findByAdminUid.mockResolvedValue(mockArena);

      const result = await arenaService.getAdminArena("admin-uid-123");

      expect(result).toEqual(mockArena);
    });

    it("deve lançar NotFoundError quando admin não tem arena", async () => {
      mockArenaRepository.findByAdminUid.mockResolvedValue(null);

      await expect(
        arenaService.getAdminArena("admin-sem-arena")
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("listArenas", () => {
    it("deve retornar lista de arenas", async () => {
      const mockArenas = [
        new Arena({
          id: "arena-1",
          nome: "Arena 1",
          slug: "arena-1",
          adminEmail: "admin1@test.com",
          adminUid: "uid-1",
          ativa: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        new Arena({
          id: "arena-2",
          nome: "Arena 2",
          slug: "arena-2",
          adminEmail: "admin2@test.com",
          adminUid: "uid-2",
          ativa: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];
      mockArenaRepository.list.mockResolvedValue(mockArenas);

      const result = await arenaService.listArenas();

      expect(result).toHaveLength(2);
    });
  });

  describe("updateArena", () => {
    it("deve atualizar arena do admin", async () => {
      const mockArena = new Arena({
        id: "arena-123",
        nome: "Arena Test",
        slug: "arena-test",
        adminEmail: "admin@test.com",
        adminUid: "admin-uid-123",
        ativa: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockArenaRepository.findById.mockResolvedValue(mockArena);

      const updatedArena = new Arena({
        ...mockArena.toObject(),
        nome: "Arena Test Atualizada",
      });
      mockArenaRepository.update.mockResolvedValue(updatedArena);

      const result = await arenaService.updateArena(
        "arena-123",
        "admin-uid-123",
        { nome: "Arena Test Atualizada" }
      );

      expect(result.nome).toBe("Arena Test Atualizada");
    });

    it("deve lançar erro se admin não tem permissão", async () => {
      const mockArena = new Arena({
        id: "arena-123",
        nome: "Arena Test",
        slug: "arena-test",
        adminEmail: "admin@test.com",
        adminUid: "outro-admin-uid",
        ativa: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockArenaRepository.findById.mockResolvedValue(mockArena);

      await expect(
        arenaService.updateArena("arena-123", "admin-uid-diferente", {
          nome: "Novo Nome",
        })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("deactivateArena", () => {
    it("deve desativar arena do admin", async () => {
      const mockArena = new Arena({
        id: "arena-123",
        nome: "Arena Test",
        slug: "arena-test",
        adminEmail: "admin@test.com",
        adminUid: "admin-uid-123",
        ativa: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockArenaRepository.findById.mockResolvedValue(mockArena);
      mockArenaRepository.delete.mockResolvedValue(undefined);

      await arenaService.deactivateArena("arena-123", "admin-uid-123");

      expect(mockArenaRepository.delete).toHaveBeenCalledWith("arena-123");
    });

    it("deve lançar erro se admin não tem permissão", async () => {
      const mockArena = new Arena({
        id: "arena-123",
        nome: "Arena Test",
        slug: "arena-test",
        adminEmail: "admin@test.com",
        adminUid: "outro-admin-uid",
        ativa: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockArenaRepository.findById.mockResolvedValue(mockArena);

      await expect(
        arenaService.deactivateArena("arena-123", "admin-uid-diferente")
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("isSlugAvailable", () => {
    it("deve retornar true se slug disponível", async () => {
      mockArenaRepository.exists.mockResolvedValue(false);

      const result = await arenaService.isSlugAvailable("novo-slug");

      expect(result).toBe(true);
    });

    it("deve retornar false se slug em uso", async () => {
      mockArenaRepository.exists.mockResolvedValue(true);

      const result = await arenaService.isSlugAvailable("slug-existente");

      expect(result).toBe(false);
    });

    it("deve lançar erro para slug inválido", async () => {
      await expect(arenaService.isSlugAvailable("AB")).rejects.toThrow(
        BadRequestError
      );
    });
  });
});
