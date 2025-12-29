/**
 * Testes para firebase.ts
 * Testa cenários de inicialização do Firebase Admin SDK
 */

// Mock do firebase-admin antes de qualquer import
const mockApp = {
  options: {
    projectId: "test-project",
  },
};

const mockFirestore = {
  settings: jest.fn(),
};

const mockAuth = jest.fn();
const mockStorage = jest.fn();

const mockInitializeApp = jest.fn().mockReturnValue(mockApp);
const mockCredentialCert = jest.fn().mockReturnValue("mock-credential");

jest.mock("firebase-admin", () => ({
  apps: [],
  app: jest.fn().mockReturnValue(mockApp),
  initializeApp: mockInitializeApp,
  firestore: jest.fn().mockReturnValue(mockFirestore),
  auth: jest.fn().mockReturnValue(mockAuth),
  storage: jest.fn().mockReturnValue(mockStorage),
  credential: {
    cert: mockCredentialCert,
  },
}));

// Mock do logger
jest.mock("../../utils/logger", () => ({
  info: jest.fn(),
  debug: jest.fn(),
  critical: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Mock do dotenv
jest.mock("dotenv", () => ({
  config: jest.fn(),
}));

import admin from "firebase-admin";
import logger from "../../utils/logger";

describe("firebase.ts", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    // Reset apps array
    (admin as any).apps = [];
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("initializeFirebase - já inicializado", () => {
    it("deve retornar app existente quando Firebase já está inicializado", () => {
      // Simular que já existe um app inicializado
      (admin as any).apps = [mockApp];

      // Importar o módulo para testar
      jest.isolateModules(() => {
        require("../../config/firebase");
      });

      // Deve logar que já foi inicializado
      expect(logger.info).toHaveBeenCalledWith(
        "Firebase Admin já inicializado",
        expect.any(Object)
      );
    });
  });

  describe("initializeFirebase - modo produção", () => {
    it("deve inicializar em modo produção quando NODE_ENV é production", () => {
      process.env.NODE_ENV = "production";
      (admin as any).apps = [];

      jest.isolateModules(() => {
        require("../../config/firebase");
      });

      expect(logger.info).toHaveBeenCalledWith(
        "Inicializando Firebase Admin em modo produção (automático)"
      );
      expect(mockInitializeApp).toHaveBeenCalledWith();
    });

    it("deve inicializar em modo produção quando FIREBASE_CONFIG está definido", () => {
      process.env.NODE_ENV = "test";
      process.env.FIREBASE_CONFIG = '{"projectId": "test"}';
      (admin as any).apps = [];

      jest.isolateModules(() => {
        require("../../config/firebase");
      });

      expect(logger.info).toHaveBeenCalledWith(
        "Inicializando Firebase Admin em modo produção (automático)"
      );
    });

    it("deve inicializar em modo produção quando GCLOUD_PROJECT está definido", () => {
      process.env.NODE_ENV = "test";
      process.env.GCLOUD_PROJECT = "test-project";
      (admin as any).apps = [];

      jest.isolateModules(() => {
        require("../../config/firebase");
      });

      expect(logger.info).toHaveBeenCalledWith(
        "Inicializando Firebase Admin em modo produção (automático)"
      );
    });
  });

  describe("initializeFirebase - modo desenvolvimento", () => {
    it("deve inicializar em modo desenvolvimento com credenciais válidas", () => {
      process.env.NODE_ENV = "development";
      delete process.env.FIREBASE_CONFIG;
      delete process.env.GCLOUD_PROJECT;
      process.env.FIREBASE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\\ntest\\n-----END PRIVATE KEY-----";
      process.env.FIREBASE_PROJECT_ID = "test-project-id";
      process.env.FIREBASE_CLIENT_EMAIL = "test@test.iam.gserviceaccount.com";
      (admin as any).apps = [];

      jest.isolateModules(() => {
        require("../../config/firebase");
      });

      expect(logger.debug).toHaveBeenCalledWith(
        "Inicializando Firebase Admin em modo desenvolvimento",
        expect.objectContaining({
          projectId: "test-project-id",
          clientEmail: "test@test.iam.gserviceaccount.com",
        })
      );

      expect(mockCredentialCert).toHaveBeenCalledWith({
        projectId: "test-project-id",
        privateKey: "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----",
        clientEmail: "test@test.iam.gserviceaccount.com",
      });
    });

    it("deve lançar erro quando credenciais estão faltando", () => {
      process.env.NODE_ENV = "development";
      delete process.env.FIREBASE_CONFIG;
      delete process.env.GCLOUD_PROJECT;
      delete process.env.FIREBASE_PRIVATE_KEY;
      delete process.env.FIREBASE_PROJECT_ID;
      delete process.env.FIREBASE_CLIENT_EMAIL;
      (admin as any).apps = [];

      expect(() => {
        jest.isolateModules(() => {
          require("../../config/firebase");
        });
      }).toThrow("Credenciais do Firebase não configuradas corretamente");

      expect(logger.critical).toHaveBeenCalledWith(
        "Credenciais do Firebase não configuradas",
        expect.objectContaining({
          hasPrivateKey: false,
          hasProjectId: false,
          hasClientEmail: false,
        })
      );
    });
  });

  describe("initializeFirebase - tratamento de erro", () => {
    it("deve logar erro crítico quando inicialização falha", () => {
      process.env.NODE_ENV = "production";
      (admin as any).apps = [];

      const mockError = new Error("Firebase initialization failed");
      mockInitializeApp.mockImplementationOnce(() => {
        throw mockError;
      });

      expect(() => {
        jest.isolateModules(() => {
          require("../../config/firebase");
        });
      }).toThrow("Firebase initialization failed");

      expect(logger.critical).toHaveBeenCalledWith(
        "Erro ao inicializar Firebase Admin",
        expect.objectContaining({
          error: "Firebase initialization failed",
        }),
        mockError
      );
    });
  });

  describe("Exports", () => {
    it("deve exportar db, auth, storage e admin", () => {
      // Garantir que apps está vazio para inicialização
      (admin as any).apps = [];
      process.env.NODE_ENV = "production";

      jest.isolateModules(() => {
        const firebase = require("../../config/firebase");
        expect(firebase.db).toBeDefined();
        expect(firebase.auth).toBeDefined();
        expect(firebase.storage).toBeDefined();
        expect(firebase.default).toBeDefined();
      });
    });

    it("deve configurar Firestore com ignoreUndefinedProperties", () => {
      (admin as any).apps = [];
      process.env.NODE_ENV = "production";

      jest.isolateModules(() => {
        require("../../config/firebase");
      });

      expect(mockFirestore.settings).toHaveBeenCalledWith({
        ignoreUndefinedProperties: true,
      });
    });
  });
});
