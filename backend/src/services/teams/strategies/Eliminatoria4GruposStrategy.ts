/**
 * Estratégia de eliminatória para 4 grupos
 *
 * Estrutura (sem BYEs):
 * Q1: 1A x 2B → S1
 * Q2: 1C x 2D → S1
 * Q3: 1B x 2A → S2
 * Q4: 1D x 2C → S2
 */

import { FaseEtapa } from "../../../models/Etapa";
import { ConfrontoEquipe } from "../../../models/Teams";
import { BaseEliminatoriaStrategy, EliminatoriaContext } from "./IEliminatoriaStrategy";

export class Eliminatoria4GruposStrategy extends BaseEliminatoriaStrategy {
  readonly numGrupos = 4;

  async gerar(context: EliminatoriaContext): Promise<ConfrontoEquipe[]> {
    const [grupoA, grupoB, grupoC, grupoD] = context.grupos;

    // Criar final
    const confrontoFinal = await context.confrontoRepository.criar(
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.FINAL,
        7,
        context.tipoFormacaoJogos,
        "Vencedor Semifinal 1",
        "Vencedor Semifinal 2"
      )
    );

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

    // Criar quartas
    const quartas = await context.confrontoRepository.criarEmLote([
      // Q1: 1A x 2B
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.QUARTAS,
        1,
        context.tipoFormacaoJogos,
        `1º Grupo ${grupoA}`,
        `2º Grupo ${grupoB}`,
        semifinais[0].id
      ),
      // Q2: 1C x 2D
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.QUARTAS,
        2,
        context.tipoFormacaoJogos,
        `1º Grupo ${grupoC}`,
        `2º Grupo ${grupoD}`,
        semifinais[0].id
      ),
      // Q3: 1B x 2A
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.QUARTAS,
        3,
        context.tipoFormacaoJogos,
        `1º Grupo ${grupoB}`,
        `2º Grupo ${grupoA}`,
        semifinais[1].id
      ),
      // Q4: 1D x 2C
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.QUARTAS,
        4,
        context.tipoFormacaoJogos,
        `1º Grupo ${grupoD}`,
        `2º Grupo ${grupoC}`,
        semifinais[1].id
      ),
    ]);

    return [...quartas, ...semifinais, confrontoFinal];
  }
}
