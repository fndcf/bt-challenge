import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

// Inicializar Firebase Admin SDK
const initializeFirebase = () => {
  try {
    // Verificar se já foi inicializado
    if (admin.apps.length > 0) {
      return admin.app();
    }

    // Configuração usando variáveis de ambiente
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : undefined;

    if (
      !privateKey ||
      !process.env.FIREBASE_PROJECT_ID ||
      !process.env.FIREBASE_CLIENT_EMAIL
    ) {
      throw new Error("Credenciais do Firebase não configuradas corretamente");
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: privateKey,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });

    console.log("✅ Firebase Admin inicializado com sucesso");
    return admin.app();
  } catch (error) {
    console.error("❌ Erro ao inicializar Firebase Admin:", error);
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

export default admin;
