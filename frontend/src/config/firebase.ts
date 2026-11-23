import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import logger from "../utils/logger";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validar configuração
const validateConfig = () => {
  const requiredKeys = [
    "apiKey",
    "authDomain",
    "projectId",
    "storageBucket",
    "messagingSenderId",
    "appId",
  ];

  const missingKeys = requiredKeys.filter(
    (key) => !firebaseConfig[key as keyof typeof firebaseConfig]
  );

  if (missingKeys.length > 0) {
    logger.error("Configurações do Firebase faltando", { missingKeys });
    throw new Error("Configuração do Firebase incompleta");
  }
};

validateConfig();

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar serviços
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Conectar aos emuladores em desenvolvimento
// Portas trocáveis para rodar um segundo emulador (ex.: prints da galeria)
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === "true") {
  const porta = (nome: string, padrao: number) =>
    Number(import.meta.env[nome]) || padrao;

  connectAuthEmulator(
    auth,
    `http://127.0.0.1:${porta("VITE_EMULADOR_AUTH_PORTA", 9099)}`
  );
  connectFirestoreEmulator(
    db,
    "127.0.0.1",
    porta("VITE_EMULADOR_FIRESTORE_PORTA", 8080)
  );
  connectStorageEmulator(
    storage,
    "127.0.0.1",
    porta("VITE_EMULADOR_STORAGE_PORTA", 9199)
  );

  logger.info("Conectado aos emuladores do Firebase");
}

export default app;
