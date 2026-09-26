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
 *
 * Tabela balanceada (whist tournament): cada par de jogadores é parceiro
 * exatamente 1 vez e adversário exatamente 2 vezes.
 * Construção cíclica: o jogador 7 é fixo e os índices 0-6 avançam +1 (mod 7)
 * a cada rodada.
 */
export const SUPER_8_SCHEDULE: RodadaSuperX[] = [
  // R1
  {
    rodada: 1,
    partidas: [
      { dupla1: [0, 1], dupla2: [2, 4] },
      { dupla1: [3, 6], dupla2: [5, 7] },
    ],
  },
  // R2
  {
    rodada: 2,
    partidas: [
      { dupla1: [1, 2], dupla2: [3, 5] },
      { dupla1: [4, 0], dupla2: [6, 7] },
    ],
  },
  // R3
  {
    rodada: 3,
    partidas: [
      { dupla1: [2, 3], dupla2: [4, 6] },
      { dupla1: [5, 1], dupla2: [0, 7] },
    ],
  },
  // R4
  {
    rodada: 4,
    partidas: [
      { dupla1: [3, 4], dupla2: [5, 0] },
      { dupla1: [6, 2], dupla2: [1, 7] },
    ],
  },
  // R5
  {
    rodada: 5,
    partidas: [
      { dupla1: [4, 5], dupla2: [6, 1] },
      { dupla1: [0, 3], dupla2: [2, 7] },
    ],
  },
  // R6
  {
    rodada: 6,
    partidas: [
      { dupla1: [5, 6], dupla2: [0, 2] },
      { dupla1: [1, 4], dupla2: [3, 7] },
    ],
  },
  // R7
  {
    rodada: 7,
    partidas: [
      { dupla1: [6, 0], dupla2: [1, 3] },
      { dupla1: [2, 5], dupla2: [4, 7] },
    ],
  },
];

/**
 * SUPER 12: 11 rodadas, 12 jogadores (índices 0-11)
 * Sem jogadores de folga
 * Total: 33 partidas
 *
 * Tabela balanceada (whist tournament): cada par de jogadores é parceiro
 * exatamente 1 vez e adversário exatamente 2 vezes.
 * Construção cíclica: o jogador 11 é fixo e os índices 0-10 avançam +1 (mod 11)
 * a cada rodada.
 */
export const SUPER_12_SCHEDULE: RodadaSuperX[] = [
  // R1
  {
    rodada: 1,
    partidas: [
      { dupla1: [0, 1], dupla2: [2, 5] },
      { dupla1: [3, 7], dupla2: [8, 10] },
      { dupla1: [4, 9], dupla2: [6, 11] },
    ],
  },
  // R2
  {
    rodada: 2,
    partidas: [
      { dupla1: [1, 2], dupla2: [3, 6] },
      { dupla1: [4, 8], dupla2: [9, 0] },
      { dupla1: [5, 10], dupla2: [7, 11] },
    ],
  },
  // R3
  {
    rodada: 3,
    partidas: [
      { dupla1: [2, 3], dupla2: [4, 7] },
      { dupla1: [5, 9], dupla2: [10, 1] },
      { dupla1: [6, 0], dupla2: [8, 11] },
    ],
  },
  // R4
  {
    rodada: 4,
    partidas: [
      { dupla1: [3, 4], dupla2: [5, 8] },
      { dupla1: [6, 10], dupla2: [0, 2] },
      { dupla1: [7, 1], dupla2: [9, 11] },
    ],
  },
  // R5
  {
    rodada: 5,
    partidas: [
      { dupla1: [4, 5], dupla2: [6, 9] },
      { dupla1: [7, 0], dupla2: [1, 3] },
      { dupla1: [8, 2], dupla2: [10, 11] },
    ],
  },
  // R6
  {
    rodada: 6,
    partidas: [
      { dupla1: [5, 6], dupla2: [7, 10] },
      { dupla1: [8, 1], dupla2: [2, 4] },
      { dupla1: [9, 3], dupla2: [0, 11] },
    ],
  },
  // R7
  {
    rodada: 7,
    partidas: [
      { dupla1: [6, 7], dupla2: [8, 0] },
      { dupla1: [9, 2], dupla2: [3, 5] },
      { dupla1: [10, 4], dupla2: [1, 11] },
    ],
  },
  // R8
  {
    rodada: 8,
    partidas: [
      { dupla1: [7, 8], dupla2: [9, 1] },
      { dupla1: [10, 3], dupla2: [4, 6] },
      { dupla1: [0, 5], dupla2: [2, 11] },
    ],
  },
  // R9
  {
    rodada: 9,
    partidas: [
      { dupla1: [8, 9], dupla2: [10, 2] },
      { dupla1: [0, 4], dupla2: [5, 7] },
      { dupla1: [1, 6], dupla2: [3, 11] },
    ],
  },
  // R10
  {
    rodada: 10,
    partidas: [
      { dupla1: [9, 10], dupla2: [0, 3] },
      { dupla1: [1, 5], dupla2: [6, 8] },
      { dupla1: [2, 7], dupla2: [4, 11] },
    ],
  },
  // R11
  {
    rodada: 11,
    partidas: [
      { dupla1: [10, 0], dupla2: [1, 4] },
      { dupla1: [2, 6], dupla2: [7, 9] },
      { dupla1: [3, 8], dupla2: [5, 11] },
    ],
  },
];

/**
 * Pontos de ranking por posição final no Super X.
 *
 * Diferente dos outros formatos (Dupla Fixa, Rei da Praia, Teams), o Super X
 * não tem fase eliminatória — é um grupo único, todos jogam contra todos, e a
 * colocação final é só a posição na classificação do grupo. Por isso os
 * pontos seguem uma tabela por posição (1º ao 12º) em vez das faixas de
 * bracket (campeão/vice/semifinalista/quartas/oitavas/participação) usadas
 * nos outros formatos.
 *
 * A tabela é única — o Super 8 usa só as 8 primeiras posições dela (o último
 * colocado do Super 8 fica com 40 pontos, não desce até o piso de 10, que é
 * exclusivo de quem joga — e perde — as 12 rodadas do Super 12).
 */
export const SUPER_X_PONTOS_POR_POSICAO: number[] = [
  100, 92, 84, 76, 64, 56, 48, 40, 32, 24, 16, 10,
];

/**
 * Retorna os pontos de ranking para uma posição final no Super X (1-indexado).
 */
export function getPontosSuperXPorPosicao(posicao: number): number {
  const pontos = SUPER_X_PONTOS_POR_POSICAO[posicao - 1];
  return pontos ?? SUPER_X_PONTOS_POR_POSICAO[SUPER_X_PONTOS_POR_POSICAO.length - 1];
}

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
