/**
 * Responsabilidade única: regras compartilhadas de placar "melhor de 3 sets"
 * usadas pelos modais de lançamento de resultado (Super X, Teams, Dupla Fixa,
 * Rei da Praia e Eliminatório).
 */

export interface SetScore {
  gamesDupla1?: number;
  gamesDupla2?: number;
}

/** true quando os dois lados do set estão preenchidos */
export const setPreenchido = (set: SetScore): boolean =>
  set.gamesDupla1 !== undefined &&
  set.gamesDupla1 !== null &&
  set.gamesDupla2 !== undefined &&
  set.gamesDupla2 !== null;

/** true quando os dois lados do set estão vazios (nenhum preenchido) */
export const setVazio = (set: SetScore): boolean =>
  (set.gamesDupla1 === undefined || set.gamesDupla1 === null) &&
  (set.gamesDupla2 === undefined || set.gamesDupla2 === null);

/** Retorna 1 ou 2 (dupla vencedora do set) ou undefined se o set estiver incompleto/empatado */
export const venceuSet = (set: SetScore): 1 | 2 | undefined => {
  if (!setPreenchido(set)) return undefined;
  if (set.gamesDupla1 === set.gamesDupla2) return undefined;
  return set.gamesDupla1! > set.gamesDupla2! ? 1 : 2;
};

/** true quando set1 e set2 estão completos e cada lado venceu um (1x1) */
export const deveExibirTerceiroSet = (set1: SetScore, set2: SetScore): boolean => {
  const vencedor1 = venceuSet(set1);
  const vencedor2 = venceuSet(set2);
  return vencedor1 !== undefined && vencedor2 !== undefined && vencedor1 !== vencedor2;
};

/**
 * Valida um set isolado.
 * @param obrigatorio se true, set vazio é erro; se false, set vazio é válido (será ignorado)
 */
export const validarSet = (set: SetScore, obrigatorio: boolean): string | undefined => {
  const preenchido = setPreenchido(set);

  if (!preenchido) {
    if (obrigatorio) {
      return set.gamesDupla1 === undefined || set.gamesDupla1 === null
        ? "Preencha o placar da primeira dupla"
        : "Preencha o placar da segunda dupla";
    }
    return undefined;
  }

  if (set.gamesDupla1 === 0 && set.gamesDupla2 === 0) {
    return "O placar não pode ser 0 x 0";
  }

  if (set.gamesDupla1 === set.gamesDupla2) {
    return "Não há um vencedor definido";
  }

  return undefined;
};

/** Monta o array de placar (numerado a partir de 1) a partir dos sets preenchidos, na ordem */
export const montarPlacarFinal = (
  sets: SetScore[]
): { numero: number; gamesDupla1: number; gamesDupla2: number }[] =>
  sets.filter(setPreenchido).map((set, index) => ({
    numero: index + 1,
    gamesDupla1: set.gamesDupla1!,
    gamesDupla2: set.gamesDupla2!,
  }));

/**
 * Parseia o placar textual salvo em ConfrontoEliminatorio.placar:
 * "6-4" (1 set) ou "6-4, 3-6, 6-2" (múltiplos sets, melhor de 3)
 */
export const parsePlacarConfronto = (placar?: string): SetScore[] => {
  if (!placar) return [];
  return placar.split(",").map((parte) => {
    const [g1, g2] = parte.trim().split("-").map(Number);
    return { gamesDupla1: g1, gamesDupla2: g2 };
  });
};

/** Formata os games de um dos lados do confronto, um valor por set (ex: "6, 3") */
export const formatarLadoPlacarConfronto = (placar: string | undefined, lado: 1 | 2): string =>
  parsePlacarConfronto(placar)
    .map((set) => (lado === 1 ? set.gamesDupla1 : set.gamesDupla2))
    .join(", ");
