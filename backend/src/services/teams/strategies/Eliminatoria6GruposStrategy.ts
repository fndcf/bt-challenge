/**
 * Estratégia de eliminatória para 6 grupos
 *
 * Estrutura (4 BYEs):
 * O1: 1A x BYE
 * O2: 1C x BYE
 * O3: 1B x BYE
 * O4: 1D x BYE
 * O5: 2B x 2C
 * O6: 2D x 2A
 * O7: 1E x 2F
 * O8: 1F x 2E
 */

import { FaseEtapa } from "../../../models/Etapa";
import { ConfrontoEquipe } from "../../../models/Teams";
import { BaseEliminatoriaStrategy, EliminatoriaContext } from "./IEliminatoriaStrategy";

export class Eliminatoria6GruposStrategy extends BaseEliminatoriaStrategy {
  readonly numGrupos = 6;

  async gerar(context: EliminatoriaContext): Promise<ConfrontoEquipe[]> {
    const [grupoA, grupoB, grupoC, grupoD, grupoE, grupoF] = context.grupos;

    // Criar final
    const confrontoFinal = await context.confrontoRepository.criar(
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.FINAL,
        15,
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
        13,
        context.tipoFormacaoJogos,
        "Vencedor Quartas 1",
        "Vencedor Quartas 2",
        confrontoFinal.id
      ),
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.SEMIFINAL,
        14,
        context.tipoFormacaoJogos,
        "Vencedor Quartas 3",
        "Vencedor Quartas 4",
        confrontoFinal.id
      ),
    ]);

    // Criar quartas
    const quartas = await context.confrontoRepository.criarEmLote([
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.QUARTAS,
        9,
        context.tipoFormacaoJogos,
        "Vencedor Oitavas 1",
        "Vencedor Oitavas 5",
        semifinais[0].id
      ),
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.QUARTAS,
        10,
        context.tipoFormacaoJogos,
        "Vencedor Oitavas 4",
        "Vencedor Oitavas 7",
        semifinais[0].id
      ),
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.QUARTAS,
        11,
        context.tipoFormacaoJogos,
        "Vencedor Oitavas 3",
        "Vencedor Oitavas 6",
        semifinais[1].id
      ),
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.QUARTAS,
        12,
        context.tipoFormacaoJogos,
        "Vencedor Oitavas 2",
        "Vencedor Oitavas 8",
        semifinais[1].id
      ),
    ]);

    // Criar oitavas (4 BYEs)
    const oitavas = await context.confrontoRepository.criarEmLote([
      // O1: 1A x BYE
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.OITAVAS,
        1,
        context.tipoFormacaoJogos,
        `1º Grupo ${grupoA}`,
        "BYE",
        quartas[0].id,
        true
      ),
      // O2: 1C x BYE
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.OITAVAS,
        2,
        context.tipoFormacaoJogos,
        `1º Grupo ${grupoC}`,
        "BYE",
        quartas[3].id,
        true
      ),
      // O3: 1B x BYE
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.OITAVAS,
        3,
        context.tipoFormacaoJogos,
        `1º Grupo ${grupoB}`,
        "BYE",
        quartas[2].id,
        true
      ),
      // O4: 1D x BYE
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.OITAVAS,
        4,
        context.tipoFormacaoJogos,
        `1º Grupo ${grupoD}`,
        "BYE",
        quartas[1].id,
        true
      ),
      // O5: 2B x 2C
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.OITAVAS,
        5,
        context.tipoFormacaoJogos,
        `2º Grupo ${grupoB}`,
        `2º Grupo ${grupoC}`,
        quartas[0].id
      ),
      // O6: 2D x 2A
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.OITAVAS,
        6,
        context.tipoFormacaoJogos,
        `2º Grupo ${grupoD}`,
        `2º Grupo ${grupoA}`,
        quartas[2].id
      ),
      // O7: 1E x 2F
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.OITAVAS,
        7,
        context.tipoFormacaoJogos,
        `1º Grupo ${grupoE}`,
        `2º Grupo ${grupoF}`,
        quartas[1].id
      ),
      // O8: 1F x 2E
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.OITAVAS,
        8,
        context.tipoFormacaoJogos,
        `1º Grupo ${grupoF}`,
        `2º Grupo ${grupoE}`,
        quartas[3].id
      ),
    ]);

    return [...oitavas, ...quartas, ...semifinais, confrontoFinal];
  }
}
