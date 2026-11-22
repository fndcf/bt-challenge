/**
 * Selo do gênero do jogador: cor + símbolo + letra (nunca só a cor)
 */

import React from "react";
import { Badge } from "@/components/ui";
import { GeneroJogador } from "@/types/jogador";
import { getGeneroLabel } from "@/utils/formatters";

export type GeneroDoJogador = GeneroJogador.MASCULINO | GeneroJogador.FEMININO;

export const SIMBOLO_GENERO: Record<GeneroDoJogador, string> = {
  [GeneroJogador.MASCULINO]: "♂",
  [GeneroJogador.FEMININO]: "♀",
};

const LETRA: Record<GeneroDoJogador, string> = {
  [GeneroJogador.MASCULINO]: "M",
  [GeneroJogador.FEMININO]: "F",
};

interface SeloGeneroProps {
  genero?: string;
  /** Substitui a letra (ex.: "Masc: 3/4") */
  children?: React.ReactNode;
}

const ehGeneroDoJogador = (genero?: string): genero is GeneroDoJogador =>
  genero === GeneroJogador.MASCULINO || genero === GeneroJogador.FEMININO;

export const SeloGenero: React.FC<SeloGeneroProps> = ({ genero, children }) => {
  // Etapas antigas podem ter jogador sem gênero
  if (!ehGeneroDoJogador(genero)) return null;

  return (
    <Badge genero={genero} title={getGeneroLabel(genero)}>
      {`${SIMBOLO_GENERO[genero]} `}
      {children ?? LETRA[genero]}
    </Badge>
  );
};
