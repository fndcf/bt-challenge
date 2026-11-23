/**
 * Leitura dos filtros que chegam na URL (?status=...&nivel=...)
 */

import { BadRequestError } from "./errors";

/**
 * Valor de uma lista fechada (enum ou união de textos). Sem valor, não
 * filtra; valor fora da lista é erro de quem chamou, não "nenhum resultado".
 *
 * @throws BadRequestError com o nome do filtro
 */
export function lerOpcao<T extends string>(
  valor: unknown,
  opcoes: readonly T[] | Record<string, T>,
  nome: string
): T | undefined {
  if (valor === undefined || valor === "") return undefined;

  const validas: readonly string[] = Array.isArray(opcoes)
    ? opcoes
    : Object.values(opcoes);

  if (typeof valor !== "string" || !validas.includes(valor)) {
    throw new BadRequestError(`Filtro inválido: ${nome}`);
  }

  return valor as T;
}

/**
 * Texto livre (ex.: busca); repetido na URL, vale o primeiro
 */
export function lerTexto(valor: unknown): string | undefined {
  const texto = Array.isArray(valor) ? valor[0] : valor;
  return typeof texto === "string" && texto !== "" ? texto : undefined;
}

/**
 * Número da URL (limite, offset); ausente ou inválido usa o padrão
 */
export function lerNumero<T extends number | undefined>(
  valor: unknown,
  padrao: T
): number | T {
  const numero = parseInt(String(valor), 10);
  return Number.isNaN(numero) ? padrao : numero;
}

export const ORDENS = ["asc", "desc"] as const;
