/**
 * Leitura segura do que chega no catch (unknown): pode ser Error, objeto do
 * Firebase ou qualquer outro valor lançado.
 */

const lerTexto = (erro: unknown, campo: string): string | undefined => {
  if (typeof erro !== "object" || erro === null) return undefined;
  const valor = (erro as Record<string, unknown>)[campo];
  return typeof valor === "string" && valor ? valor : undefined;
};

/** Mensagem do erro, ou a padrão quando ele não traz uma */
export const getMensagemErro = (erro: unknown, padrao: string): string =>
  lerTexto(erro, "message") ?? padrao;

/** Código do erro (ex.: "auth/user-disabled"), quando houver */
export const getCodigoErro = (erro: unknown): string | undefined =>
  lerTexto(erro, "code");

/** Para o logger, que espera um Error */
export const paraError = (erro: unknown): Error =>
  erro instanceof Error
    ? erro
    : new Error(getMensagemErro(erro, "Erro desconhecido"));
