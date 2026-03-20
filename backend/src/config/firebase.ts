/**
 * Configuração do Firebase Admin SDK
 *
 * Ambientes suportados:
 * - production: Firebase Functions injeta credenciais automaticamente
 * - staging: Usa .env.staging com credenciais do projeto de staging
 * - development: Usa .env.local com credenciais locais
 * - emulators: Usa emuladores locais do Firebase (sem credenciais reais)
 */

import admin from "firebase-admin";
import dotenv from "dotenv";
import path from "path";
import logger from "../utils/logger";

// Carregar variáveis de ambiente por prioridade:
// 1. .env.local (desenvolvimento com credenciais reais)
// 2. .env.staging (ambiente de staging)
// 3. .env (fallback)
const nodeEnv = process.env.NODE_ENV || "development";

if (nodeEnv === "staging") {
  dotenv.config({ path: path.resolve(__dirname, "../../.env.staging") });
} else {
  dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
}
dotenv.config();

/**
 * Inicializar Firebase Admin SDK
 */
const initializeFirebase = () => {
  try {
    // Verificar se já foi inicializado
    if (admin.apps.length > 0) {
      logger.info("Firebase Admin já inicializado", {
        projectId: admin.app().options.projectId,
      });
      return admin.app();
    }

    // Em produção (Firebase Functions), usar inicialização automática
    const isProduction =
      process.env.NODE_ENV === "production" ||
      process.env.FIREBASE_CONFIG ||
      process.env.GCLOUD_PROJECT;

    if (isProduction) {
      logger.info("Inicializando Firebase Admin em modo produção (automático)");
      admin.initializeApp();

      logger.info("Firebase Admin inicializado com sucesso", {
        projectId: process.env.GCLOUD_PROJECT || "auto-detected",
        environment: "production",
      });

      return admin.app();
    }

    // Em desenvolvimento/staging, usar variáveis de ambiente locais
    // Prefixo FB_ em vez de FIREBASE_ (reservado pelo Firebase Functions)
    const privateKey = process.env.FB_PRIVATE_KEY
      ? process.env.FB_PRIVATE_KEY.replace(/\\n/g, "\n")
      : undefined;

    // Validar credenciais para desenvolvimento
    if (
      !privateKey ||
      !process.env.FB_PROJECT_ID ||
      !process.env.FB_CLIENT_EMAIL
    ) {
      logger.critical("Credenciais do Firebase não configuradas", {
        hasPrivateKey: !!privateKey,
        hasProjectId: !!process.env.FB_PROJECT_ID,
        hasClientEmail: !!process.env.FB_CLIENT_EMAIL,
      });
      throw new Error("Credenciais do Firebase não configuradas corretamente");
    }

    logger.debug("Inicializando Firebase Admin em modo desenvolvimento", {
      projectId: process.env.FB_PROJECT_ID,
      clientEmail: process.env.FB_CLIENT_EMAIL,
    });

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FB_PROJECT_ID,
        privateKey: privateKey,
        clientEmail: process.env.FB_CLIENT_EMAIL,
      }),
    });

    logger.info("Firebase Admin inicializado com sucesso", {
      projectId: process.env.FB_PROJECT_ID,
      environment: process.env.NODE_ENV || "development",
    });

    return admin.app();
  } catch (error) {
    logger.critical(
      "Erro ao inicializar Firebase Admin",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        environment: process.env.NODE_ENV,
      },
      error as Error
    );
    throw error;
  }
};

// Inicializar
initializeFirebase();

// Exportar instâncias
export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();

// Configurações do Firestore
db.settings({
  ignoreUndefinedProperties: true,
});

/**
 * Conectar aos emuladores do Firebase em desenvolvimento
 * Ativado quando as variáveis FIRESTORE_EMULATOR_HOST ou
 * FIREBASE_AUTH_EMULATOR_HOST estão definidas
 */
const useEmulators =
  process.env.FIRESTORE_EMULATOR_HOST ||
  process.env.FIREBASE_AUTH_EMULATOR_HOST;

if (useEmulators) {
  logger.info("Firebase Admin conectado aos emuladores locais", {
    firestore: process.env.FIRESTORE_EMULATOR_HOST || "não configurado",
    auth: process.env.FIREBASE_AUTH_EMULATOR_HOST || "não configurado",
    storage: process.env.FIREBASE_STORAGE_EMULATOR_HOST || "não configurado",
  });
} else {
  logger.debug("Firestore configurado", {
    ignoreUndefinedProperties: true,
  });
}

export default admin;
