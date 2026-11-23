/**
 * Pontos de cada jogador, a partir das colocações
 */

import {
  AtualizarPontuacaoEmLoteDTO,
  IEstatisticasJogadorRepository,
} from "../../repositories/interfaces/IEstatisticasJogadorRepository";
import { Colocacao } from "./colocacoes";

/**
 * Pontos dos jogadores colocados (quem não tem estatística na etapa fica fora)
 */
export const pontuarJogadores = async (
  etapaId: string,
  colocacoes: Map<string, Colocacao>,
  estatisticas: IEstatisticasJogadorRepository
): Promise<AtualizarPontuacaoEmLoteDTO[]> => {
  const encontradas = await Promise.all(
    [...colocacoes].map(async ([jogadorId, colocacao]) => {
      const estatistica = await estatisticas.buscarPorJogadorEEtapa(
        jogadorId,
        etapaId
      );
      return estatistica && { estatisticaId: estatistica.id, ...colocacao };
    })
  );

  return encontradas.filter((p) => p !== null);
};
