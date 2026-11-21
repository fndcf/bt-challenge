/**
 * Isolamento dos testes do Firebase real
 *
 * Roda antes de qualquer módulo ser carregado (jest "setupFiles").
 * O config/firebase carrega o .env.local, que pode ter credenciais reais
 * (staging); apontando os SDKs para emuladores em uma porta sem nada
 * escutando, um teste que esqueça de mockar o Firebase falha (conexão
 * recusada / timeout) em vez de ler ou gravar num banco de verdade.
 *
 * O dotenv não sobrescreve variáveis já definidas, então estes valores
 * prevalecem sobre o .env.local.
 */

const HOST_INEXISTENTE = "127.0.0.1:1";

process.env.FIRESTORE_EMULATOR_HOST = HOST_INEXISTENTE;
process.env.FIREBASE_AUTH_EMULATOR_HOST = HOST_INEXISTENTE;
process.env.FIREBASE_STORAGE_EMULATOR_HOST = HOST_INEXISTENTE;
