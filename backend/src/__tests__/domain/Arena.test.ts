/**
 * Testes do Domain Arena
 */

import { Arena, ArenaType } from "../../domain/Arena";

describe("Arena Domain", () => {
  const createArenaData = (overrides?: Partial<ArenaType>): ArenaType => ({
    id: "arena-123",
    nome: "Arena Beach Tennis",
    slug: "arena-beach-tennis",
    adminEmail: "admin@arena.com",
    adminUid: "admin-uid-123",
    ativa: true,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-15T00:00:00Z"),
    ...overrides,
  });

  describe("constructor", () => {
    it("deve criar instância com todos os campos", () => {
      const data = createArenaData();
      const arena = new Arena(data);

      expect(arena.id).toBe("arena-123");
      expect(arena.nome).toBe("Arena Beach Tennis");
      expect(arena.slug).toBe("arena-beach-tennis");
      expect(arena.adminEmail).toBe("admin@arena.com");
      expect(arena.adminUid).toBe("admin-uid-123");
      expect(arena.ativa).toBe(true);
      expect(arena.createdAt).toEqual(new Date("2024-01-01T00:00:00Z"));
      expect(arena.updatedAt).toEqual(new Date("2024-01-15T00:00:00Z"));
    });

    it("deve criar arena inativa", () => {
      const data = createArenaData({ ativa: false });
      const arena = new Arena(data);

      expect(arena.ativa).toBe(false);
    });
  });

  describe("getPublicUrl", () => {
    it("deve retornar URL pública com base URL padrão", () => {
      const arena = new Arena(createArenaData());

      const url = arena.getPublicUrl();

      expect(url).toBe("https://challengebt.com.br/arena/arena-beach-tennis");
    });

    it("deve retornar URL pública com base URL customizada", () => {
      const arena = new Arena(createArenaData());

      const url = arena.getPublicUrl("https://meusite.com");

      expect(url).toBe("https://meusite.com/arena/arena-beach-tennis");
    });

    it("deve funcionar com slugs simples", () => {
      const arena = new Arena(createArenaData({ slug: "arena" }));

      const url = arena.getPublicUrl();

      expect(url).toBe("https://challengebt.com.br/arena/arena");
    });

    it("deve funcionar com slugs com números", () => {
      const arena = new Arena(createArenaData({ slug: "arena-123-bt" }));

      const url = arena.getPublicUrl();

      expect(url).toBe("https://challengebt.com.br/arena/arena-123-bt");
    });
  });

  describe("toObject", () => {
    it("deve converter para objeto simples", () => {
      const data = createArenaData();
      const arena = new Arena(data);

      const obj = arena.toObject();

      expect(obj).toEqual({
        id: "arena-123",
        nome: "Arena Beach Tennis",
        slug: "arena-beach-tennis",
        adminEmail: "admin@arena.com",
        adminUid: "admin-uid-123",
        ativa: true,
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-15T00:00:00Z"),
      });
    });

    it("deve retornar objeto independente da instância", () => {
      const arena = new Arena(createArenaData());

      const obj = arena.toObject();
      obj.nome = "Modificado";

      expect(arena.nome).toBe("Arena Beach Tennis");
    });
  });

  describe("fromFirestore", () => {
    it("deve criar Arena a partir de dados do Firestore", () => {
      const firestoreData = {
        id: "arena-456",
        nome: "Arena Praia",
        slug: "arena-praia",
        adminEmail: "contato@praia.com",
        adminUid: "uid-456",
        ativa: true,
        createdAt: { toDate: () => new Date("2024-02-01") },
        updatedAt: { toDate: () => new Date("2024-02-10") },
      };

      const arena = Arena.fromFirestore(firestoreData);

      expect(arena).toBeInstanceOf(Arena);
      expect(arena.id).toBe("arena-456");
      expect(arena.nome).toBe("Arena Praia");
      expect(arena.slug).toBe("arena-praia");
      expect(arena.createdAt).toEqual(new Date("2024-02-01"));
      expect(arena.updatedAt).toEqual(new Date("2024-02-10"));
    });

    it("deve usar valor padrão true para ativa se não definido", () => {
      const firestoreData = {
        id: "arena-789",
        nome: "Arena Nova",
        slug: "arena-nova",
        adminEmail: "admin@nova.com",
        adminUid: "uid-789",
        // ativa não definido
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
      };

      const arena = Arena.fromFirestore(firestoreData);

      expect(arena.ativa).toBe(true);
    });

    it("deve usar data atual se createdAt não definido", () => {
      const now = new Date();
      const firestoreData = {
        id: "arena-test",
        nome: "Teste",
        slug: "teste",
        adminEmail: "test@test.com",
        adminUid: "uid-test",
        ativa: true,
        // createdAt não definido
        updatedAt: { toDate: () => new Date() },
      };

      const arena = Arena.fromFirestore(firestoreData);

      // createdAt deve ser uma data próxima de agora
      expect(arena.createdAt.getTime()).toBeGreaterThanOrEqual(now.getTime() - 1000);
    });

    it("deve usar data atual se updatedAt não definido", () => {
      const now = new Date();
      const firestoreData = {
        id: "arena-test",
        nome: "Teste",
        slug: "teste",
        adminEmail: "test@test.com",
        adminUid: "uid-test",
        ativa: true,
        createdAt: { toDate: () => new Date() },
        // updatedAt não definido
      };

      const arena = Arena.fromFirestore(firestoreData);

      expect(arena.updatedAt.getTime()).toBeGreaterThanOrEqual(now.getTime() - 1000);
    });

    it("deve manter ativa false quando explicitamente definido", () => {
      const firestoreData = {
        id: "arena-inativa",
        nome: "Arena Inativa",
        slug: "arena-inativa",
        adminEmail: "admin@inativa.com",
        adminUid: "uid-inativa",
        ativa: false,
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
      };

      const arena = Arena.fromFirestore(firestoreData);

      expect(arena.ativa).toBe(false);
    });
  });

  describe("ArenaType interface", () => {
    it("deve implementar corretamente a interface ArenaType", () => {
      const arena = new Arena(createArenaData());

      // Verificar que a instância pode ser atribuída ao tipo ArenaType
      const arenaType: ArenaType = arena;

      expect(arenaType.id).toBe(arena.id);
      expect(arenaType.nome).toBe(arena.nome);
      expect(arenaType.slug).toBe(arena.slug);
      expect(arenaType.adminEmail).toBe(arena.adminEmail);
      expect(arenaType.adminUid).toBe(arena.adminUid);
      expect(arenaType.ativa).toBe(arena.ativa);
      expect(arenaType.createdAt).toBe(arena.createdAt);
      expect(arenaType.updatedAt).toBe(arena.updatedAt);
    });
  });

  describe("Imutabilidade", () => {
    it("deve manter dados consistentes após criação", () => {
      const originalData = createArenaData();
      const arena = new Arena(originalData);

      // Modificar dados originais
      originalData.nome = "Modificado";
      originalData.ativa = false;

      // Arena deve manter os valores originais
      expect(arena.nome).toBe("Arena Beach Tennis");
      expect(arena.ativa).toBe(true);
    });
  });

  describe("Casos de uso reais", () => {
    it("deve lidar com arena típica de beach tennis", () => {
      const arena = new Arena({
        id: "bt-copacabana",
        nome: "Beach Tennis Copacabana",
        slug: "beach-tennis-copacabana",
        adminEmail: "admin@btcopacabana.com.br",
        adminUid: "firebase-uid-123",
        ativa: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(arena.getPublicUrl()).toBe(
        "https://challengebt.com.br/arena/beach-tennis-copacabana"
      );

      const obj = arena.toObject();
      expect(obj.nome).toBe("Beach Tennis Copacabana");
      expect(obj.slug).toBe("beach-tennis-copacabana");
    });

    it("deve suportar fluxo completo de criação a partir do Firestore", () => {
      // Simular documento do Firestore
      const firestoreDoc = {
        id: "arena-firestore",
        nome: "Arena do Firestore",
        slug: "arena-firestore",
        adminEmail: "admin@firestore.com",
        adminUid: "uid-firestore",
        ativa: true,
        createdAt: { toDate: () => new Date("2024-01-01") },
        updatedAt: { toDate: () => new Date("2024-06-15") },
      };

      // Converter para Arena
      const arena = Arena.fromFirestore(firestoreDoc);

      // Obter URL pública
      const url = arena.getPublicUrl();
      expect(url).toContain("arena-firestore");

      // Converter de volta para objeto (para salvar)
      const obj = arena.toObject();
      expect(obj.id).toBe("arena-firestore");
    });
  });
});
