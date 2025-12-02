/**
 * Array Utilities
 * backend/src/utils/arrayUtils.ts
 *
 * Funções utilitárias para manipulação de arrays.
 * Centraliza lógica comum usada em múltiplos services.
 */

/**
 * Embaralhar array usando algoritmo Fisher-Yates
 *
 * @param array - Array a ser embaralhado
 * @returns Novo array embaralhado (não modifica o original)
 *
 * @example
 * const jogadores = [j1, j2, j3, j4];
 * const embaralhados = embaralhar(jogadores);
 */
export function embaralhar<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Dividir array em chunks de tamanho específico
 *
 * @param array - Array a ser dividido
 * @param tamanho - Tamanho de cada chunk
 * @returns Array de arrays (chunks)
 *
 * @example
 * const nums = [1, 2, 3, 4, 5, 6];
 * const chunks = dividirEmChunks(nums, 2); // [[1,2], [3,4], [5,6]]
 */
export function dividirEmChunks<T>(array: T[], tamanho: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += tamanho) {
    chunks.push(array.slice(i, i + tamanho));
  }
  return chunks;
}

/**
 * Remover duplicatas de um array baseado em uma chave
 *
 * @param array - Array com possíveis duplicatas
 * @param chave - Função que retorna a chave única de cada item
 * @returns Array sem duplicatas
 *
 * @example
 * const jogadores = [{id: 1, nome: 'A'}, {id: 1, nome: 'A'}, {id: 2, nome: 'B'}];
 * const unicos = removerDuplicatas(jogadores, j => j.id); // [{id: 1}, {id: 2}]
 */
export function removerDuplicatas<T>(array: T[], chave: (item: T) => string | number): T[] {
  const vistos = new Set<string | number>();
  return array.filter((item) => {
    const k = chave(item);
    if (vistos.has(k)) {
      return false;
    }
    vistos.add(k);
    return true;
  });
}
