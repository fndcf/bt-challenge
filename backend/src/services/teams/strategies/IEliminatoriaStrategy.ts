/**
 * Interface para estratégias de geração de fase eliminatória
 * Cada estratégia implementa a lógica específica para N grupos
 */

import { Etapa, FaseEtapa } from "../../../models/Etapa";
import { ConfrontoEquipe, CriarConfrontoDTO, TipoFormacaoJogos } from "../../../models/Teams";
import { IConfrontoEquipeRepository } from "../../../repositories/interfaces/IConfrontoEquipeRepository";

/**
 * DTO base para criar confronto na fase eliminatória
 */
export interface ConfrontoEliminatorioDTO extends CriarConfrontoDTO {
  fase: FaseEtapa;
  ordem: number;
  equipe1Origem?: string;
  equipe2Origem?: string;
  proximoConfrontoId?: string;
  isBye?: boolean;
}

/**
 * Contexto passado para as estratégias
 */
export interface EliminatoriaContext {
  etapa: Etapa;
  grupos: string[];
  tipoFormacaoJogos: TipoFormacaoJogos;
  confrontoRepository: IConfrontoEquipeRepository;
}

/**
 * Interface que todas as estratégias de eliminatória devem implementar
 * Seguindo o padrão Strategy
 */
export interface IEliminatoriaStrategy {
  /**
   * Número de grupos que esta estratégia suporta
   */
  readonly numGrupos: number;

  /**
   * Gera a fase eliminatória completa para o número de grupos específico
   * @param context Contexto com etapa, grupos e repositório
   * @returns Lista de confrontos criados (oitavas/quartas/semis/final)
   */
  gerar(context: EliminatoriaContext): Promise<ConfrontoEquipe[]>;
}

/**
 * Classe base abstrata com métodos auxiliares compartilhados
 */
export abstract class BaseEliminatoriaStrategy implements IEliminatoriaStrategy {
  abstract readonly numGrupos: number;
  abstract gerar(context: EliminatoriaContext): Promise<ConfrontoEquipe[]>;

  /**
   * Cria DTO base para confronto
   */
  protected criarConfrontoDTO(
    etapa: Etapa,
    fase: FaseEtapa,
    ordem: number,
    tipoFormacaoJogos: TipoFormacaoJogos,
    equipe1Origem?: string,
    equipe2Origem?: string,
    proximoConfrontoId?: string,
    isBye: boolean = false
  ): CriarConfrontoDTO {
    const dto: CriarConfrontoDTO = {
      etapaId: etapa.id,
      arenaId: etapa.arenaId,
      fase,
      ordem,
      equipe1Id: "",
      equipe1Nome: "",
      equipe2Id: isBye ? "BYE" : "",
      equipe2Nome: isBye ? "BYE" : "",
      tipoFormacaoJogos,
    };

    if (equipe1Origem) dto.equipe1Origem = equipe1Origem;
    if (equipe2Origem) dto.equipe2Origem = isBye ? "BYE" : equipe2Origem;
    if (proximoConfrontoId) dto.proximoConfrontoId = proximoConfrontoId;
    if (isBye) dto.isBye = true;

    return dto;
  }

  /**
   * Cria a final
   */
  protected async criarFinal(
    context: EliminatoriaContext,
    ordem: number
  ): Promise<ConfrontoEquipe> {
    return context.confrontoRepository.criar(
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.FINAL,
        ordem,
        context.tipoFormacaoJogos,
        "Vencedor Semifinal 1",
        "Vencedor Semifinal 2"
      )
    );
  }

  /**
   * Cria as semifinais
   */
  protected async criarSemifinais(
    context: EliminatoriaContext,
    ordem1: number,
    ordem2: number,
    finalId: string
  ): Promise<ConfrontoEquipe[]> {
    return context.confrontoRepository.criarEmLote([
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.SEMIFINAL,
        ordem1,
        context.tipoFormacaoJogos,
        "Vencedor Quartas 1",
        "Vencedor Quartas 2",
        finalId
      ),
      this.criarConfrontoDTO(
        context.etapa,
        FaseEtapa.SEMIFINAL,
        ordem2,
        context.tipoFormacaoJogos,
        "Vencedor Quartas 3",
        "Vencedor Quartas 4",
        finalId
      ),
    ]);
  }
}
