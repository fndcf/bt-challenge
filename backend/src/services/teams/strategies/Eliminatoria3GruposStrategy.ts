/**
 * Estratégia de eliminatória para 3 grupos
 *
 * Estrutura:
 * Q1: 1A x BYE → S1
 * Q2: 1C x 2B → S1
 * Q3: 1B x BYE → S2
 * Q4: 2A x 2C → S2
 */

import { FaseEtapa } from "../../../models/Etapa";
import { ConfrontoEquipe } from "../../../models/Teams";
import { BaseEliminatoriaStrategy, EliminatoriaContext } from "./IEliminatoriaStrategy";

export class Eliminatoria3GruposStrategy extends BaseEliminatoriaStrategy {
  readonly numGrupos = 3;

  async gerar(context: EliminatoriaContext): Promise<ConfrontoEquipe[]> {
    const [grupoA, grupoB, grupoC] = context.grupos;

    // Criar final
    const [confrontoFinal] = await context.confrontoRepository.criarEmLote([
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.FINAL,
        7,
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
        5,
        context.tipoFormacaoJogos,
        "Vencedor Quartas 1",
        "Vencedor Quartas 2",
        confrontoFinal.id
      ),
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.SEMIFINAL,
        6,
        context.tipoFormacaoJogos,
        "Vencedor Quartas 3",
        "Vencedor Quartas 4",
        confrontoFinal.id
      ),
    ]);

    // Criar quartas (Q1 e Q3 são BYEs, passam direto)
    const quartas = await context.confrontoRepository.criarEmLote([
      // Q1: 1A x BYE
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.QUARTAS,
        1,
        context.tipoFormacaoJogos,
        `1º Grupo ${grupoA}`,
        "BYE",
        semifinais[0].id,
        true // isBye
      ),
      // Q2: 1C x 2B
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.QUARTAS,
        2,
        context.tipoFormacaoJogos,
        `1º Grupo ${grupoC}`,
        `2º Grupo ${grupoB}`,
        semifinais[0].id
      ),
      // Q3: 1B x BYE
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.QUARTAS,
        3,
        context.tipoFormacaoJogos,
        `1º Grupo ${grupoB}`,
        "BYE",
        semifinais[1].id,
        true // isBye
      ),
      // Q4: 2A x 2C
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.QUARTAS,
        4,
        context.tipoFormacaoJogos,
        `2º Grupo ${grupoA}`,
        `2º Grupo ${grupoC}`,
        semifinais[1].id
      ),
    ]);

    return [...quartas, ...semifinais, confrontoFinal];
  }
}
