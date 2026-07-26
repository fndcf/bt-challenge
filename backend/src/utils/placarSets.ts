/**
 * Validação e cálculo de vencedor de um placar de partida (1 a 3 sets).
 * Suporta tanto o formato tradicional (1 set único) quanto "melhor de 3 sets"
 * com desempate no 3º set quando cada lado vence 1 set.
 */

export interface SetPlacar {
  numero: number;
  gamesDupla1: number;
  gamesDupla2: number;
}

export interface ResultadoValidacaoPlacar {
  setsDupla1: number;
  setsDupla2: number;
  dupla1Venceu: boolean;
}

export function validarEDeterminarVencedorPlacar(
  placar: SetPlacar[]
): ResultadoValidacaoPlacar {
  if (!Array.isArray(placar) || placar.length < 1 || placar.length > 3) {
    throw new Error("Placar inválido: deve ter entre 1 e 3 sets");
  }

  let setsDupla1 = 0;
  let setsDupla2 = 0;
  const vencedoresPorSet: (1 | 2)[] = [];

  for (const set of placar) {
    if (set.gamesDupla1 === set.gamesDupla2) {
      throw new Error(`Placar inválido: o set ${set.numero} não pode terminar empatado`);
    }
    const vencedorSet = set.gamesDupla1 > set.gamesDupla2 ? 1 : 2;
    vencedoresPorSet.push(vencedorSet);
    if (vencedorSet === 1) setsDupla1++;
    else setsDupla2++;
  }

  if (placar.length === 2 && vencedoresPorSet[0] !== vencedoresPorSet[1]) {
    throw new Error(
      "Placar incompleto: cada lado venceu 1 set, é necessário um 3º set de desempate"
    );
  }

  if (placar.length === 3 && vencedoresPorSet[0] === vencedoresPorSet[1]) {
    throw new Error(
      "Placar inválido: não deve haver 3º set quando um lado já venceu os 2 primeiros sets"
    );
  }

  return {
    setsDupla1,
    setsDupla2,
    dupla1Venceu: setsDupla1 > setsDupla2,
  };
}
