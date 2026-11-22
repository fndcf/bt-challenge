/**
 * Selo do gênero do jogador: cor + símbolo + letra (nunca só a cor)
 */

import React from "react";
import { LucideIcon, Mars, Venus } from "lucide-react";
import { Badge } from "@/components/ui";
import { GeneroJogador } from "@/types/jogador";
import { getGeneroLabel } from "@/utils/formatters";

export type GeneroDoJogador = GeneroJogador.MASCULINO | GeneroJogador.FEMININO;

const ICONE: Record<GeneroDoJogador, LucideIcon> = {
  [GeneroJogador.MASCULINO]: Mars,
  [GeneroJogador.FEMININO]: Venus,
};

/**
 * Ícone do gênero. Desenhado, e não o caractere: no iPhone o caractere sai
 * menor e fora da linha do texto.
 */
export const IconeGenero: React.FC<{ genero: GeneroDoJogador }> = ({
  genero,
}) => {
  const Icone = ICONE[genero];
  return <Icone aria-hidden="true" size="1.1em" strokeWidth={2.5} />;
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
      <IconeGenero genero={genero} />
      {children ?? LETRA[genero]}
    </Badge>
  );
};
