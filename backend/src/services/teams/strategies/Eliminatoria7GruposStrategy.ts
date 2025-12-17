/**
 * Estratégia de eliminatória para 7 grupos
 *
 * Estrutura (2 BYEs):
 * O1: 1A x BYE
 * O2: 1E x 2F
 * O3: 1C x 2D
 * O4: 1G x 2B
 * O5: 1B x BYE
 * O6: 1F x 2E
 * O7: 1D x 2C
 * O8: 2A x 2G
 */

import { FaseEtapa } from "../../../models/Etapa";
import { ConfrontoEquipe } from "../../../models/Teams";
import { BaseEliminatoriaStrategy, EliminatoriaContext } from "./IEliminatoriaStrategy";

export class Eliminatoria7GruposStrategy extends BaseEliminatoriaStrategy {
  readonly numGrupos = 7;

  async gerar(context: EliminatoriaContext): Promise<ConfrontoEquipe[]> {
    const [grupoA, grupoB, grupoC, grupoD, grupoE, grupoF, grupoG] = context.grupos;

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
        "Vencedor Oitavas 2",
        semifinais[0].id
      ),
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.QUARTAS,
        10,
        context.tipoFormacaoJogos,
        "Vencedor Oitavas 3",
        "Vencedor Oitavas 4",
        semifinais[0].id
      ),
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.QUARTAS,
        11,
        context.tipoFormacaoJogos,
        "Vencedor Oitavas 5",
        "Vencedor Oitavas 6",
        semifinais[1].id
      ),
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.QUARTAS,
        12,
        context.tipoFormacaoJogos,
        "Vencedor Oitavas 7",
        "Vencedor Oitavas 8",
        semifinais[1].id
      ),
    ]);

    // Criar oitavas (2 BYEs)
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
      // O2: 1E x 2F
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.OITAVAS,
        2,
        context.tipoFormacaoJogos,
        `1º Grupo ${grupoE}`,
        `2º Grupo ${grupoF}`,
        quartas[0].id
      ),
      // O3: 1C x 2D
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.OITAVAS,
        3,
        context.tipoFormacaoJogos,
        `1º Grupo ${grupoC}`,
        `2º Grupo ${grupoD}`,
        quartas[1].id
      ),
      // O4: 1G x 2B
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.OITAVAS,
        4,
        context.tipoFormacaoJogos,
        `1º Grupo ${grupoG}`,
        `2º Grupo ${grupoB}`,
        quartas[1].id
      ),
      // O5: 1B x BYE
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.OITAVAS,
        5,
        context.tipoFormacaoJogos,
        `1º Grupo ${grupoB}`,
        "BYE",
        quartas[2].id,
        true
      ),
      // O6: 1F x 2E
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.OITAVAS,
        6,
        context.tipoFormacaoJogos,
        `1º Grupo ${grupoF}`,
        `2º Grupo ${grupoE}`,
        quartas[2].id
      ),
      // O7: 1D x 2C
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.OITAVAS,
        7,
        context.tipoFormacaoJogos,
        `1º Grupo ${grupoD}`,
        `2º Grupo ${grupoC}`,
        quartas[3].id
      ),
      // O8: 2A x 2G
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.OITAVAS,
        8,
        context.tipoFormacaoJogos,
        `2º Grupo ${grupoA}`,
        `2º Grupo ${grupoG}`,
        quartas[3].id
      ),
    ]);

    return [...oitavas, ...quartas, ...semifinais, confrontoFinal];
  }
}
