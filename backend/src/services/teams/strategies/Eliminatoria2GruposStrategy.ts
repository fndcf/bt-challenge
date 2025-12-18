/**
 * Estratégia de eliminatória para 2 grupos
 *
 * Estrutura:
 * S1: 1A x 2B → Final
 * S2: 1B x 2A → Final
 */

import { FaseEtapa } from "../../../models/Etapa";
import { ConfrontoEquipe } from "../../../models/Teams";
import { BaseEliminatoriaStrategy, EliminatoriaContext } from "./IEliminatoriaStrategy";

export class Eliminatoria2GruposStrategy extends BaseEliminatoriaStrategy {
  readonly numGrupos = 2;

  async gerar(context: EliminatoriaContext): Promise<ConfrontoEquipe[]> {
    const [grupoA, grupoB] = context.grupos;

    // Criar final primeiro
    const [confrontoFinal] = await context.confrontoRepository.criarEmLote([
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.FINAL,
        3,
        context.tipoFormacaoJogos,
        "Vencedor Semifinal 1",
        "Vencedor Semifinal 2"
      ),
    ]);

    // Criar semifinais
    const semifinais = await context.confrontoRepository.criarEmLote([
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.SEMIFINAL,
        1,
        context.tipoFormacaoJogos,
        `1º Grupo ${grupoA}`,
        `2º Grupo ${grupoB}`,
        confrontoFinal.id
      ),
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.SEMIFINAL,
        2,
        context.tipoFormacaoJogos,
        `1º Grupo ${grupoB}`,
        `2º Grupo ${grupoA}`,
        confrontoFinal.id
      ),
    ]);

    return [...semifinais, confrontoFinal];
  }
}
