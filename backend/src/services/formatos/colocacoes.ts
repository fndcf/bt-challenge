/**
 * Colocações e pontos no encerramento, comuns a mais de um formato
 */

import {
  ConfrontoEliminatorio,
  StatusConfrontoEliminatorio,
  TipoFase,
} from "../../models/Eliminatoria";
import { Etapa } from "../../models/Etapa";
import { PontuacaoColocacao } from "../../repositories/interfaces/IConfigRepository";
import { IConfrontoEliminatorioRepository } from "../../repositories/interfaces/IConfrontoEliminatorioRepository";
import { IDuplaRepository } from "../../repositories/interfaces/IDuplaRepository";
import { Encerramento } from "./FormatoTorneio";

export interface Colocacao {
  colocacao: string;
  pontos: number;
}

type NomeColocacao = keyof PontuacaoColocacao;

const colocar = (
  colocacao: NomeColocacao,
  pontuacao: PontuacaoColocacao
): Colocacao => ({ colocacao, pontos: pontuacao[colocacao] });

/**
 * Colocação pela posição na tabela: a 1ª da lista para o primeiro, e assim por
 * diante. Quem passa da lista fica com a última.
 */
export const colocacaoPorPosicao = (
  posicao: number,
  colocacoes: NomeColocacao[],
  pontuacao: PontuacaoColocacao
): Colocacao =>
  colocar(
    colocacoes[posicao - 1] ?? colocacoes[colocacoes.length - 1],
    pontuacao
  );

/**
 * Final da eliminatória de duplas
 *
 * @throws Se não há eliminatória ou a final não terminou
 */
export const buscarFinal = async (
  { id, arenaId }: Etapa,
  confrontos: IConfrontoEliminatorioRepository
): Promise<ConfrontoEliminatorio> => {
  const [final] = await confrontos.buscarPorFase(id, arenaId, TipoFase.FINAL);

  if (!final) {
    throw new Error("Não há fase eliminatória para esta etapa");
  }

  if (final.status !== StatusConfrontoEliminatorio.FINALIZADA) {
    throw new Error("A final ainda não foi finalizada");
  }

  return final;
};

export const campeaoDaFinal = (
  final: ConfrontoEliminatorio
): Encerramento["campeao"] =>
  final.vencedoraId
    ? { id: final.vencedoraId, nome: final.vencedoraNome || "Campeão" }
    : null;

/** Confronto terminado: quem jogou e quem venceu */
export interface ConfrontoEncerrado {
  lados: [string | undefined, string | undefined];
  vencedoraId?: string;
}

export interface FasesEncerradas {
  final: ConfrontoEncerrado;
  semifinais: ConfrontoEncerrado[];
  quartas: ConfrontoEncerrado[];
  oitavas: ConfrontoEncerrado[];
}

const perdedora = ({ lados: [a, b], vencedoraId }: ConfrontoEncerrado) =>
  vencedoraId === a ? b : a;

/**
 * Colocação de cada participante da eliminatória, pela fase em que parou
 */
export const colocarPorFase = (
  { final, semifinais, quartas, oitavas }: FasesEncerradas,
  pontuacao: PontuacaoColocacao
): Map<string, Colocacao> => {
  const colocacoes = new Map<string, Colocacao>();
  const incluir = (id: string | undefined, nome: NomeColocacao) => {
    // Quem já foi colocado parou numa fase mais adiantada
    if (id && !colocacoes.has(id)) {
      colocacoes.set(id, colocar(nome, pontuacao));
    }
  };

  incluir(final.vencedoraId, "campeao");
  incluir(perdedora(final), "vice");
  semifinais.forEach((c) => incluir(perdedora(c), "semifinalista"));
  quartas.forEach((c) => incluir(perdedora(c), "quartas"));
  oitavas.forEach((c) => incluir(perdedora(c), "oitavas"));

  return colocacoes;
};

const entreDuplas = (confronto: ConfrontoEliminatorio): ConfrontoEncerrado => ({
  lados: [confronto.dupla1Id, confronto.dupla2Id],
  vencedoraId: confronto.vencedoraId,
});

/**
 * Colocação de cada dupla da eliminatória
 */
export const colocacoesDaEliminatoria = async (
  { id, arenaId }: Etapa,
  final: ConfrontoEliminatorio,
  pontuacao: PontuacaoColocacao,
  confrontos: IConfrontoEliminatorioRepository
): Promise<Map<string, Colocacao>> => {
  const [semifinais, quartas, oitavas] = await Promise.all(
    [TipoFase.SEMIFINAL, TipoFase.QUARTAS, TipoFase.OITAVAS].map(
      async (fase) =>
        (await confrontos.buscarFinalizadosPorFase(id, arenaId, fase)).map(
          entreDuplas
        )
    )
  );

  return colocarPorFase(
    { final: entreDuplas(final), semifinais, quartas, oitavas },
    pontuacao
  );
};

/**
 * Passar as colocações das duplas para os jogadores
 */
export const colocacoesDosJogadores = async (
  porDupla: Map<string, Colocacao>,
  duplas: IDuplaRepository
): Promise<Map<string, Colocacao>> => {
  const porJogador = new Map<string, Colocacao>();
  const encontradas = await Promise.all(
    [...porDupla.keys()].map((id) => duplas.buscarPorId(id))
  );

  encontradas.forEach((dupla) => {
    const colocacao = dupla && porDupla.get(dupla.id);
    if (!colocacao) return;

    porJogador.set(dupla.jogador1Id, colocacao);
    porJogador.set(dupla.jogador2Id, colocacao);
  });

  return porJogador;
};
