/**
 * Tipos de chaveamento para fase eliminatória do Rei da Praia
 */

export enum TipoChaveamentoReiDaPraia {
  /**
   * OPÇÃO 1: Melhores com Melhores
   *
   * Agrupa os MELHORES juntos:
   * - 1º melhor 1º + 2º melhor 1º
   * - 3º melhor 1º + 4º melhor 1º
   * - 1º melhor 2º + 2º melhor 2º
   * - 3º melhor 2º + 4º melhor 2º
   *
   * Exemplo 4 grupos:
   * - Dupla A: Rafael (1º melhor 1º) + João (2º melhor 1º) = FORTE
   * - Dupla B: Lucas (3º melhor 1º) + André (4º melhor 1º) = FRACA
   * - Dupla C: Carlos (1º melhor 2º) + Pedro (2º melhor 2º) = FORTE
   * - Dupla D: Bruno (3º melhor 2º) + Felipe (4º melhor 2º) = FRACA
   *
   * Confronto: A vs D, B vs C (forte vs fraco)
   */
  MELHORES_COM_MELHORES = "melhores_com_melhores",

  /**
   * OPÇÃO 2: Pareamento por Ranking
   *
   * Pareia por posição relativa (equilibrado + meritocracia):
   * - 1º melhor 1º + 1º melhor 2º = SEED 1
   * - 2º melhor 1º + 2º melhor 2º = SEED 2
   * - 3º melhor 1º + 3º melhor 2º = SEED 3
   * - 4º melhor 1º + 4º melhor 2º = SEED 4
   *
   * Exemplo 4 grupos:
   * - Dupla A: Rafael (1º melhor 1º) + Carlos (1º melhor 2º) = SEED 1
   * - Dupla B: João (2º melhor 1º) + Pedro (2º melhor 2º) = SEED 2
   * - Dupla C: Lucas (3º melhor 1º) + Bruno (3º melhor 2º) = SEED 3
   * - Dupla D: André (4º melhor 1º) + Felipe (4º melhor 2º) = SEED 4
   *
   * Confronto: A vs D, B vs C (seed vs seed)
   */
  PAREAMENTO_POR_RANKING = "pareamento_por_ranking",

  /**
   * OPÇÃO 3: Sorteio Aleatório
   *
   * - Embaralha classificados
   * - Protege contra jogadores do mesmo grupo
   * - Forma duplas aleatoriamente
   */
  SORTEIO_ALEATORIO = "sorteio_aleatorio",
}
