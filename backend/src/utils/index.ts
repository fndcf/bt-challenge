/**
 * Utils Index
 * backend/src/utils/index.ts
 *
 * Re-exporta todas as funções utilitárias
 */

// Array utilities
export { embaralhar, dividirEmChunks, removerDuplicatas } from "./arrayUtils";

// Torneio utilities
export {
  calcularDistribuicaoGrupos,
  calcularByes,
  determinarTipoFase,
  calcularTotalPartidas,
  obterProximaFase,
  gerarOrdemBracket,
  LETRAS_GRUPOS,
  gerarNomeGrupo,
} from "./torneioUtils";

// Response helpers
export { ResponseHelper, ApiResponse, PaginatedResponse } from "./responseHelper";
