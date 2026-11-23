/**
 * O que muda de um formato de etapa para outro. Regra nova que vale para todos
 * entra aqui, e o TypeScript cobra a implementação dos quatro.
 */

import { Etapa } from "../../models/Etapa";
import { Jogador } from "../../models/Jogador";
import { PontuacaoColocacao } from "../../repositories/interfaces/IConfigRepository";
import { AtualizarPontuacaoEmLoteDTO } from "../../repositories/interfaces/IEstatisticasJogadorRepository";

export interface Encerramento {
  campeao: { id: string; nome: string } | null;

  /** Só é chamado se a etapa conta pontos no ranking */
  calcularPontuacoes(): Promise<AtualizarPontuacaoEmLoteDTO[]>;
}

export interface FormatoTorneio {
  /**
   * Alguma partida da etapa já foi jogada (ou está em andamento)?
   */
  temPartidasJogadas(etapaId: string, arenaId: string): Promise<boolean>;

  /**
   * Trocar um jogador depois de geradas as chaves
   */
  substituirJogador(
    etapaId: string,
    arenaId: string,
    jogadorAntigoId: string,
    jogadorNovo: Jogador
  ): Promise<void>;

  /**
   * Aplicar na classificação a decisão de um empate
   */
  reaplicarClassificacao(etapa: Etapa, grupoId: string): Promise<void>;

  /**
   * Conferir se a etapa pode ser encerrada e definir campeão e pontos.
   * Não grava nada.
   *
   * @param pontuacao Pontos por colocação; a participação já vem zerada se o
   * organizador escolheu não dar esses pontos
   * @throws Se ainda faltam partidas
   */
  prepararEncerramento(
    etapa: Etapa,
    pontuacao: PontuacaoColocacao
  ): Promise<Encerramento>;
}
