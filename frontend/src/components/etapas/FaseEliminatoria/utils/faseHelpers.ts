import {
  ConfrontoEliminatorio,
  TipoFase,
  StatusConfrontoEliminatorio,
} from "@/types/chave";

/**
 * Retorna o nome formatado de uma fase eliminatória
 */
export const getNomeFase = (fase: TipoFase): string => {
  const nomes = {
    [TipoFase.OITAVAS]: "Oitavas de Final",
    [TipoFase.QUARTAS]: "Quartas de Final",
    [TipoFase.SEMIFINAL]: "Semifinal",
    [TipoFase.FINAL]: "Final",
  };
  return nomes[fase] || fase;
};

/**
 * Agrupa confrontos por fase
 */
export const agruparPorFase = (
  confrontos: ConfrontoEliminatorio[]
): Record<TipoFase, ConfrontoEliminatorio[]> => {
  const grupos: Record<TipoFase, ConfrontoEliminatorio[]> = {
    [TipoFase.OITAVAS]: [],
    [TipoFase.QUARTAS]: [],
    [TipoFase.SEMIFINAL]: [],
    [TipoFase.FINAL]: [],
  };

  if (confrontos && Array.isArray(confrontos)) {
    confrontos.forEach((c) => {
      grupos[c.fase].push(c);
    });
  }

  return grupos;
};

/**
 * Conta quantos confrontos de uma fase estão finalizados
 */
export const contarStatus = (fase: ConfrontoEliminatorio[]): string => {
  const finalizados = fase.filter(
    (c) =>
      c.status === StatusConfrontoEliminatorio.FINALIZADA ||
      c.status === StatusConfrontoEliminatorio.BYE
  ).length;
  return `${finalizados}/${fase.length}`;
};
