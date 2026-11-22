/**
 * Filtro por gênero das listas de seleção de jogadores (etapas mistas)
 */

import React from "react";
import styled from "styled-components";
import { Button } from "@/components/ui";
import { theme } from "@/styles/theme";
import { GeneroJogador } from "@/types/jogador";
import { GeneroDoJogador, IconeGenero } from "./SeloGenero";

export type ValorFiltroGenero = "todos" | GeneroDoJogador;

interface FiltroGeneroProps {
  valor: ValorFiltroGenero;
  onChange: (valor: ValorFiltroGenero) => void;
  /** Gênero de cada jogador da lista, para mostrar a quantidade */
  generos: (string | undefined)[];
}

const Grupo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing[2]};
`;

const { MASCULINO, FEMININO } = GeneroJogador;

const OPCOES: { valor: ValorFiltroGenero; label: string }[] = [
  { valor: "todos", label: "Todos" },
  { valor: MASCULINO, label: "Masc" },
  { valor: FEMININO, label: "Fem" },
];

/** true quando o jogador deve aparecer com o filtro escolhido */
export const passaNoFiltroGenero = (
  genero: string | undefined,
  filtro: ValorFiltroGenero
): boolean => filtro === "todos" || genero === filtro;

export const FiltroGenero: React.FC<FiltroGeneroProps> = ({
  valor,
  onChange,
  generos,
}) => (
  <Grupo role="group" aria-label="Filtrar por gênero">
    {OPCOES.map((opcao) => {
      const quantidade = generos.filter((genero) =>
        passaNoFiltroGenero(genero, opcao.valor)
      ).length;

      return (
        <Button
          key={opcao.valor}
          type="button"
          size="sm"
          icon={
            opcao.valor !== "todos" && <IconeGenero genero={opcao.valor} />
          }
          variant={valor === opcao.valor ? "primary" : "outline"}
          aria-pressed={valor === opcao.valor}
          onClick={() => onChange(opcao.valor)}
        >
          {`${opcao.label} (${quantidade})`}
        </Button>
      );
    })}
  </Grupo>
);
