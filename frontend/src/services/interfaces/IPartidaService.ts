/**
 * Interface para serviço de gerenciamento de partidas do formato DUPLA FIXA
 */

import {
  ResultadoPartidaLoteDTO,
  RegistrarResultadosEmLoteResponse,
} from "@/types/chave";

export interface IPartidaService {
  /**
   * Registrar múltiplos resultados de partidas em lote
   * @param resultados - Array de resultados com partidaId e placar
   * @returns Promise com resposta contendo processados e erros
   */
  registrarResultadosEmLote(
    resultados: ResultadoPartidaLoteDTO[]
  ): Promise<RegistrarResultadosEmLoteResponse>;
}
