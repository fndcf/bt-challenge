/**
 * Fuso fixo para todos os testes: o do Brasil, como no uso real.
 *
 * Roda antes de o Jest criar os processos dos testes (que herdam o TZ).
 * Trocar process.env.TZ dentro de um teste não funciona: o Jest isola o
 * process.env de cada arquivo e o relógio não muda. Sem isto, teste com
 * data passava no computador (fuso do Brasil) e quebrava no CI (UTC).
 */
export default function fixarFuso() {
  process.env.TZ = "America/Sao_Paulo";
}
