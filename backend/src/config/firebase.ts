/**
 * Configuração do Firebase Admin SDK
 */

import admin from "firebase-admin";
import dotenv from "dotenv";
import path from "path";
import logger from "../utils/logger";

// Em desenvolvimento, carregar .env.local (credenciais locais)
// Em produção, Firebase Functions injeta as credenciais automaticamente
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
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

    // Em desenvolvimento, usar variáveis de ambiente locais
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : undefined;

    // Validar credenciais para desenvolvimento
    if (
      !privateKey ||
      !process.env.FIREBASE_PROJECT_ID ||
      !process.env.FIREBASE_CLIENT_EMAIL
    ) {
      logger.critical("Credenciais do Firebase não configuradas", {
        hasPrivateKey: !!privateKey,
        hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      });
      throw new Error("Credenciais do Firebase não configuradas corretamente");
    }

    logger.debug("Inicializando Firebase Admin em modo desenvolvimento", {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    });

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: privateKey,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });

    logger.info("Firebase Admin inicializado com sucesso", {
      projectId: process.env.FIREBASE_PROJECT_ID,
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

logger.debug("Firestore configurado", {
  ignoreUndefinedProperties: true,
});

export default admin;
