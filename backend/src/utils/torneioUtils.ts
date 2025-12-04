/**
 * Torneio Utilities
 * Funções utilitárias para cálculos de torneio.
 * Centraliza lógica de distribuição de grupos, BYEs e fases.
 */

import { TipoFase } from "../models/Eliminatoria";

/**
 * Calcular distribuição ideal de grupos
 *
 * REGRA:
 * - PRIORIDADE 1: Grupos de 3 duplas (sempre que possível)
 * - PRIORIDADE 2: Grupos de 4 duplas (quando necessário)
 * - EXCEÇÃO: 5 duplas = 1 grupo de 5
 *
 * @param totalDuplas - Número total de duplas
 * @returns Array com tamanho de cada grupo
 *
 * @example
 * calcularDistribuicaoGrupos(6);  // [3, 3]
 * calcularDistribuicaoGrupos(7);  // [3, 4]
 * calcularDistribuicaoGrupos(8);  // [4, 4]
 * calcularDistribuicaoGrupos(9);  // [3, 3, 3]
 * calcularDistribuicaoGrupos(10); // [3, 3, 4]
 * calcularDistribuicaoGrupos(11); // [3, 4, 4]
 */
export function calcularDistribuicaoGrupos(totalDuplas: number): number[] {
  // Caso especial: 5 duplas = 1 grupo de 5
  if (totalDuplas === 5) {
    return [5];
  }

  const resto = totalDuplas % 3;

  // Divisível por 3: todos grupos de 3
  if (resto === 0) {
    const numGrupos = totalDuplas / 3;
    return Array(numGrupos).fill(3);
  }

  // Resto 1: precisa de 1 grupo de 4 (ex: 7 = 3+4, 10 = 3+3+4)
  if (resto === 1) {
    const numGruposDe3 = Math.floor(totalDuplas / 3) - 1;
    if (numGruposDe3 <= 0) {
      return [4];
    }
    return [...Array(numGruposDe3).fill(3), 4];
  }

  // Resto 2: precisa de 2 grupos de 4 (ex: 8 = 4+4, 11 = 3+4+4)
  if (resto === 2) {
    const numGruposDe3 = Math.floor(totalDuplas / 3);
    if (numGruposDe3 >= 2) {
      const gruposDe3Restantes = numGruposDe3 - 2;
      return [...Array(gruposDe3Restantes).fill(3), 4, 4];
    } else {
      return [4, 4];
    }
  }

  return [totalDuplas];
}

/**
 * Calcular quantidade de BYEs necessários para fase eliminatória
 *
 * BYE = dupla que passa direto para próxima fase quando o número
 * de classificados não é potência de 2.
 *
 * @param totalClassificados - Número de duplas classificadas
 * @returns Objeto com byes, confrontos necessários e próxima potência de 2
 *
 * @example
 * calcularByes(8);  // { byes: 0, confrontosNecessarios: 4, proximaPotencia: 8 }
 * calcularByes(6);  // { byes: 2, confrontosNecessarios: 2, proximaPotencia: 8 }
 * calcularByes(5);  // { byes: 3, confrontosNecessarios: 1, proximaPotencia: 8 }
 */
export function calcularByes(totalClassificados: number): {
  byes: number;
  confrontosNecessarios: number;
  proximaPotencia: number;
} {
  const proximaPotencia = Math.pow(2, Math.ceil(Math.log2(totalClassificados)));

  // Quantos precisam jogar na primeira rodada para chegar na potência de 2
  const precisamJogar = (totalClassificados - proximaPotencia / 2) * 2;

  // BYEs são os que não precisam jogar
  const byes = totalClassificados - precisamJogar;

  // Número de confrontos na primeira rodada
  const confrontosNecessarios = precisamJogar / 2;

  return { byes, confrontosNecessarios, proximaPotencia };
}

/**
 * Determinar tipo da primeira fase baseado no número de classificados
 *
 * @param totalClassificados - Número de duplas classificadas
 * @returns Tipo da fase (OITAVAS, QUARTAS, SEMIFINAL ou FINAL)
 *
 * @example
 * determinarTipoFase(16); // TipoFase.OITAVAS
 * determinarTipoFase(8);  // TipoFase.QUARTAS
 * determinarTipoFase(4);  // TipoFase.SEMIFINAL
 * determinarTipoFase(2);  // TipoFase.FINAL
 */
export function determinarTipoFase(totalClassificados: number): TipoFase {
  if (totalClassificados > 8) return TipoFase.OITAVAS;
  if (totalClassificados > 4) return TipoFase.QUARTAS;
  if (totalClassificados > 2) return TipoFase.SEMIFINAL;
  return TipoFase.FINAL;
}

/**
 * Calcular total de partidas em um grupo (todos contra todos)
 *
 * Fórmula: n * (n - 1) / 2
 * Onde n = número de duplas no grupo
 *
 * @param numeroDuplas - Número de duplas no grupo
 * @returns Total de partidas
 *
 * @example
 * calcularTotalPartidas(3); // 3 (A×B, A×C, B×C)
 * calcularTotalPartidas(4); // 6 (A×B, A×C, A×D, B×C, B×D, C×D)
 * calcularTotalPartidas(5); // 10
 */
export function calcularTotalPartidas(numeroDuplas: number): number {
  return (numeroDuplas * (numeroDuplas - 1)) / 2;
}

/**
 * Obter próxima fase do torneio
 *
 * @param faseAtual - Fase atual
 * @returns Próxima fase ou null se for a final
 *
 * @example
 * obterProximaFase(TipoFase.OITAVAS);   // TipoFase.QUARTAS
 * obterProximaFase(TipoFase.FINAL);     // null
 */
export function obterProximaFase(faseAtual: TipoFase): TipoFase | null {
  switch (faseAtual) {
    case TipoFase.OITAVAS:
      return TipoFase.QUARTAS;
    case TipoFase.QUARTAS:
      return TipoFase.SEMIFINAL;
    case TipoFase.SEMIFINAL:
      return TipoFase.FINAL;
    case TipoFase.FINAL:
      return null;
    default:
      return null;
  }
}

/**
 * Gerar ordem de bracket para torneio (algoritmo clássico)
 *
 * Para N=8: [1, 8, 4, 5, 2, 7, 3, 6]
 * Garante que os melhores seeds não se encontrem até a final
 *
 * @param n - Número de seeds (deve ser potência de 2)
 * @returns Array com ordem dos seeds
 *
 * @example
 * gerarOrdemBracket(4); // [1, 4, 2, 3]
 * gerarOrdemBracket(8); // [1, 8, 4, 5, 2, 7, 3, 6]
 */
export function gerarOrdemBracket(n: number): number[] {
  if (n === 1) return [1];

  const anterior = gerarOrdemBracket(n / 2);
  const resultado: number[] = [];

  for (const seed of anterior) {
    resultado.push(seed);
    resultado.push(n + 1 - seed);
  }

  return resultado;
}

/**
 * Letras para nomes de grupos
 */
export const LETRAS_GRUPOS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Gerar nome do grupo baseado no índice
 *
 * @param indice - Índice do grupo (0-based)
 * @returns Nome do grupo (ex: "Grupo A", "Grupo B")
 */
export function gerarNomeGrupo(indice: number): string {
  return `Grupo ${LETRAS_GRUPOS[indice] || indice + 1}`;
}
