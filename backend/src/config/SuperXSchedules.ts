/**
 * Tabelas de rodadas para formato Super X
 *
 * Formato: Cada rodada contém partidas
 * Partida: [[jogador1A, jogador1B], [jogador2A, jogador2B]]
 * Jogadores são indexados de 0 a N-1
 *
 * Super 8: 8 jogadores, 7 rodadas, 2 partidas/rodada
 * Super 12: 12 jogadores, 11 rodadas, 3 partidas/rodada
 */

export interface PartidaSuperX {
  dupla1: [number, number]; // [jogador1A, jogador1B]
  dupla2: [number, number]; // [jogador2A, jogador2B]
}

export interface RodadaSuperX {
  rodada: number;
  partidas: PartidaSuperX[];
}

/**
 * SUPER 8: 7 rodadas, 8 jogadores (índices 0-7)
 * Cada jogador joga em todas as rodadas
 * Total: 14 partidas
 */
export const SUPER_8_SCHEDULE: RodadaSuperX[] = [
  // R1: A+B vs C+D, E+F vs G+H
  {
    rodada: 1,
    partidas: [
      { dupla1: [0, 1], dupla2: [2, 3] },
      { dupla1: [4, 5], dupla2: [6, 7] },
    ],
  },
  // R2: A+C vs B+D, E+G vs F+H
  {
    rodada: 2,
    partidas: [
      { dupla1: [0, 2], dupla2: [1, 3] },
      { dupla1: [4, 6], dupla2: [5, 7] },
    ],
  },
  // R3: A+D vs B+C, E+H vs F+G
  {
    rodada: 3,
    partidas: [
      { dupla1: [0, 3], dupla2: [1, 2] },
      { dupla1: [4, 7], dupla2: [5, 6] },
    ],
  },
  // R4: A+E vs B+F, C+G vs D+H
  {
    rodada: 4,
    partidas: [
      { dupla1: [0, 4], dupla2: [1, 5] },
      { dupla1: [2, 6], dupla2: [3, 7] },
    ],
  },
  // R5: A+F vs B+E, C+H vs D+G
  {
    rodada: 5,
    partidas: [
      { dupla1: [0, 5], dupla2: [1, 4] },
      { dupla1: [2, 7], dupla2: [3, 6] },
    ],
  },
  // R6: A+G vs B+H, C+E vs D+F
  {
    rodada: 6,
    partidas: [
      { dupla1: [0, 6], dupla2: [1, 7] },
      { dupla1: [2, 4], dupla2: [3, 5] },
    ],
  },
  // R7: A+H vs B+G, C+F vs D+E
  {
    rodada: 7,
    partidas: [
      { dupla1: [0, 7], dupla2: [1, 6] },
      { dupla1: [2, 5], dupla2: [3, 4] },
    ],
  },
];

/**
 * SUPER 12: 11 rodadas, 12 jogadores (índices 0-11)
 * Sem jogadores de folga
 * Total: 33 partidas
 */
export const SUPER_12_SCHEDULE: RodadaSuperX[] = [
  // R1
  {
    rodada: 1,
    partidas: [
      { dupla1: [0, 1], dupla2: [2, 3] },
      { dupla1: [4, 5], dupla2: [6, 7] },
      { dupla1: [8, 9], dupla2: [10, 11] },
    ],
  },
  // R2
  {
    rodada: 2,
    partidas: [
      { dupla1: [0, 2], dupla2: [1, 4] },
      { dupla1: [3, 6], dupla2: [5, 8] },
      { dupla1: [7, 10], dupla2: [9, 11] },
    ],
  },
  // R3
  {
    rodada: 3,
    partidas: [
      { dupla1: [0, 3], dupla2: [2, 5] },
      { dupla1: [1, 7], dupla2: [4, 9] },
      { dupla1: [6, 10], dupla2: [8, 11] },
    ],
  },
  // R4
  {
    rodada: 4,
    partidas: [
      { dupla1: [0, 4], dupla2: [1, 6] },
      { dupla1: [2, 8], dupla2: [3, 9] },
      { dupla1: [5, 10], dupla2: [7, 11] },
    ],
  },
  // R5
  {
    rodada: 5,
    partidas: [
      { dupla1: [0, 5], dupla2: [3, 7] },
      { dupla1: [1, 9], dupla2: [2, 10] },
      { dupla1: [4, 11], dupla2: [6, 8] },
    ],
  },
  // R6
  {
    rodada: 6,
    partidas: [
      { dupla1: [0, 6], dupla2: [1, 8] },
      { dupla1: [2, 11], dupla2: [4, 7] },
      { dupla1: [3, 10], dupla2: [5, 9] },
    ],
  },
  // R7
  {
    rodada: 7,
    partidas: [
      { dupla1: [0, 7], dupla2: [2, 9] },
      { dupla1: [1, 10], dupla2: [3, 11] },
      { dupla1: [4, 6], dupla2: [5, 8] },
    ],
  },
  // R8
  {
    rodada: 8,
    partidas: [
      { dupla1: [0, 8], dupla2: [1, 11] },
      { dupla1: [2, 6], dupla2: [4, 10] },
      { dupla1: [3, 5], dupla2: [7, 9] },
    ],
  },
  // R9
  {
    rodada: 9,
    partidas: [
      { dupla1: [0, 9], dupla2: [3, 8] },
      { dupla1: [1, 5], dupla2: [6, 11] },
      { dupla1: [2, 7], dupla2: [4, 10] },
    ],
  },
  // R10
  {
    rodada: 10,
    partidas: [
      { dupla1: [0, 10], dupla2: [2, 4] },
      { dupla1: [1, 3], dupla2: [5, 11] },
      { dupla1: [6, 9], dupla2: [7, 8] },
    ],
  },
  // R11
  {
    rodada: 11,
    partidas: [
      { dupla1: [0, 11], dupla2: [1, 2] },
      { dupla1: [3, 4], dupla2: [5, 6] },
      { dupla1: [7, 10], dupla2: [8, 9] },
    ],
  },
];

/**
 * Mapa de schedules por variante
 */
export const SUPER_X_SCHEDULES: Record<8 | 12, RodadaSuperX[]> = {
  8: SUPER_8_SCHEDULE,
  12: SUPER_12_SCHEDULE,
};

/**
 * Obtém o schedule para uma variante específica
 */
export function getSuperXSchedule(variant: 8 | 12): RodadaSuperX[] {
  return SUPER_X_SCHEDULES[variant];
}

/**
 * Retorna o número total de rodadas para uma variante
 */
export function getTotalRodadas(variant: 8 | 12): number {
  return variant - 1; // 7 ou 11 rodadas
}

/**
 * Retorna o número de partidas por rodada para uma variante
 */
export function getPartidasPorRodada(variant: 8 | 12): number {
  if (variant === 12) return 3;
  return 2;
}

/**
 * Retorna o número total de partidas para uma variante
 */
export function getTotalPartidas(variant: 8 | 12): number {
  const rodadas = getTotalRodadas(variant);
  const partidasPorRodada = getPartidasPorRodada(variant);
  return rodadas * partidasPorRodada;
}

/**
 * Valida se um schedule está correto (para testes)
 */
export function validarSchedule(variant: 8 | 12): {
  valido: boolean;
  erros: string[];
} {
  const schedule = SUPER_X_SCHEDULES[variant];
  const erros: string[] = [];
  const totalJogadores = variant;

  // Verificar número de rodadas
  const rodadasEsperadas = getTotalRodadas(variant);
  if (schedule.length !== rodadasEsperadas) {
    erros.push(
      `Esperado ${rodadasEsperadas} rodadas, encontrado ${schedule.length}`
    );
  }

  // Verificar cada rodada
  for (const rodada of schedule) {
    const jogadoresNaRodada = new Set<number>();

    // Adicionar jogadores das partidas
    for (const partida of rodada.partidas) {
      jogadoresNaRodada.add(partida.dupla1[0]);
      jogadoresNaRodada.add(partida.dupla1[1]);
      jogadoresNaRodada.add(partida.dupla2[0]);
      jogadoresNaRodada.add(partida.dupla2[1]);
    }

    // Verificar se todos os jogadores estão presentes
    if (jogadoresNaRodada.size !== totalJogadores) {
      erros.push(
        `Rodada ${rodada.rodada}: esperado ${totalJogadores} jogadores, encontrado ${jogadoresNaRodada.size}`
      );
    }

    // Verificar índices válidos
    for (const jogador of jogadoresNaRodada) {
      if (jogador < 0 || jogador >= totalJogadores) {
        erros.push(
          `Rodada ${rodada.rodada}: índice inválido ${jogador} (deve ser 0-${
            totalJogadores - 1
          })`
        );
      }
    }
  }

  return {
    valido: erros.length === 0,
    erros,
  };
}
