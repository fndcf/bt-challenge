/**
 * Desempate de posições em grupos
 *
 * Ordena participantes pelos critérios do formato e identifica blocos
 * empatados em TODOS os critérios. Blocos já decididos pelo admin
 * (sorteio ou escolha manual) seguem a ordem definida; os demais são
 * devolvidos como empates pendentes, em ordem determinística (sem sorteio
 * automático, para a tabela não "mudar sozinha" a cada resultado).
 */

import { DesempateDefinido, EmpatePendente, Etapa } from "../models/Etapa";

export interface BlocoEmpatado {
  posicaoInicial: number;
  ids: string[];
}

/**
 * Rankings entre grupos usados para formar as duplas da eliminatória
 * (Rei da Praia). Usam o mesmo armazenamento dos desempates de grupo,
 * com estas chaves no lugar do grupoId.
 */
export const RANKING_PRIMEIROS = "eliminatoria-primeiros";
export const RANKING_SEGUNDOS = "eliminatoria-segundos";

export function isRankingEliminatoria(grupoId: string): boolean {
  return grupoId === RANKING_PRIMEIROS || grupoId === RANKING_SEGUNDOS;
}

/**
 * Empates pendentes da etapa (todos os grupos), ordenados por grupo/posição
 */
export function listarEmpatesPendentes(
  etapa: Pick<Etapa, "empatesPendentes"> | null
): EmpatePendente[] {
  return Object.values(etapa?.empatesPendentes ?? {})
    .flat()
    .sort(
      (a, b) =>
        a.grupoNome.localeCompare(b.grupoNome) ||
        a.posicaoInicial - b.posicaoInicial
    );
}

/**
 * Lançar erro se a etapa tiver empate pendente
 *
 * @param acao - Texto da ação bloqueada (ex: "gerar a fase eliminatória")
 * @param filtro - Considerar apenas os empates que passam no filtro
 */
export function garantirSemEmpatesPendentes(
  etapa: Pick<Etapa, "empatesPendentes"> | null,
  acao: string,
  filtro: (empate: EmpatePendente) => boolean = () => true
): void {
  const pendentes = listarEmpatesPendentes(etapa).filter(filtro);
  if (pendentes.length === 0) return;

  const grupos = [...new Set(pendentes.map((e) => e.grupoNome))].join(", ");
  throw new Error(
    `Não é possível ${acao}: há empate pendente em ${grupos}. Resolva o desempate antes de continuar.`
  );
}

/**
 * Verifica se duas listas de IDs têm exatamente os mesmos elementos
 */
export function mesmosIds(a: string[], b: string[]): boolean {
  if (a.length !== b.length || new Set(b).size !== b.length) return false;
  const conjunto = new Set(a);
  return b.every((id) => conjunto.has(id));
}

/**
 * Ordenar itens aplicando desempates definidos e detectando empates pendentes
 *
 * @param itens - Participantes do grupo
 * @param comparar - Critérios do formato (retorna 0 quando empatados em tudo)
 * @param getId - ID estável do participante
 * @param desempates - Ordens já definidas para este grupo
 */
export function ordenarComDesempate<T>(
  itens: T[],
  comparar: (a: T, b: T) => number,
  getId: (item: T) => string,
  desempates: DesempateDefinido[] = []
): { ordenados: T[]; empates: BlocoEmpatado[] } {
  const ordenados = [...itens].sort(
    (a, b) => comparar(a, b) || getId(a).localeCompare(getId(b))
  );
  const empates: BlocoEmpatado[] = [];

  let inicio = 0;
  while (inicio < ordenados.length) {
    let fim = inicio + 1;
    while (
      fim < ordenados.length &&
      comparar(ordenados[fim - 1], ordenados[fim]) === 0
    ) {
      fim++;
    }

    if (fim - inicio > 1) {
      const bloco = ordenados.slice(inicio, fim);
      const ids = bloco.map(getId);
      const definido = desempates.find((d) => mesmosIds(d.ids, ids));

      if (definido) {
        bloco.sort(
          (a, b) => definido.ids.indexOf(getId(a)) - definido.ids.indexOf(getId(b))
        );
        ordenados.splice(inicio, bloco.length, ...bloco);
      } else {
        empates.push({ posicaoInicial: inicio + 1, ids });
      }
    }

    inicio = fim;
  }

  return { ordenados, empates };
}
