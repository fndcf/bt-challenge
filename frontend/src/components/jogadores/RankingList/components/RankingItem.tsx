/**
 * Jogador no ranking: posição, nome e números, com link para o perfil
 */

import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { JogadorPublico } from "@/services/arenaPublicService";
import { CoresStatus } from "@/styles/semantic";
import { theme } from "@/styles/theme";

const { texto, superficie, acao, medalha, status } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

interface RankingItemProps {
  jogador: JogadorPublico;
  posicao: number;
  arenaSlug?: string;
}

const coresDaPosicao = (posicao: number): CoresStatus => {
  if (posicao === 1) return medalha.ouro;
  if (posicao === 2) return medalha.prata;
  if (posicao === 3) return medalha.bronze;
  return status.neutro;
};

const Item = styled(Link)`
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: ${theme.spacing[2]} ${theme.spacing[3]};
  padding: ${theme.spacing[3]};
  border: 1px solid ${superficie.borda};
  border-radius: ${theme.borderRadius.lg};
  background: ${superficie.fundoAlternativo};
  color: ${texto.principal};
  text-decoration: none;

  &:hover {
    border-color: ${acao.primaria};
  }

  &:focus-visible {
    outline: 2px solid ${acao.primaria};
    outline-offset: 1px;
  }

  @media (min-width: ${theme.breakpoints.md}) {
    grid-template-columns: auto 1fr auto;
  }
`;

const Posicao = styled.span<{ $cores: CoresStatus }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid ${({ $cores }) => $cores.borda};
  border-radius: 50%;
  background: ${({ $cores }) => $cores.fundo};
  color: ${({ $cores }) => $cores.texto};
  font-weight: ${fontWeight.bold};
`;

const Nome = styled.span`
  min-width: 0;
  overflow-wrap: anywhere;
  font-weight: ${fontWeight.semibold};
`;

/* No celular os números descem para uma linha própria */
const Numeros = styled.dl`
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  gap: ${theme.spacing[2]};
  margin: 0;

  @media (min-width: ${theme.breakpoints.md}) {
    grid-column: auto;
    gap: ${theme.spacing[4]};
  }
`;

const Numero = styled.div`
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  min-width: 2.5rem;

  dt {
    font-size: ${fontSize.xs};
    color: ${texto.secundario};
  }

  dd {
    margin: 0;
    font-size: ${fontSize.sm};
    font-weight: ${fontWeight.bold};
    font-variant-numeric: tabular-nums;
  }
`;

const Positivo = styled.span`
  color: ${status.sucesso.texto};
`;

const Negativo = styled.span`
  color: ${status.erro.texto};
`;

const Pontos = styled.span`
  color: ${acao.primaria};
`;

export const RankingItem: React.FC<RankingItemProps> = ({
  jogador,
  posicao,
  arenaSlug,
}) => {
  const { etapasParticipadas, vitorias, derrotas } = jogador;
  const temGames =
    jogador.gamesVencidos !== undefined || jogador.gamesPerdidos !== undefined;
  const pontos = jogador.pontos ?? jogador.ranking;

  const numeros: [string, React.ReactNode | undefined][] = [
    ["Etapas", etapasParticipadas],
    ["V", vitorias !== undefined && <Positivo>{vitorias}</Positivo>],
    ["D", derrotas !== undefined && <Negativo>{derrotas}</Negativo>],
    [
      "Games",
      temGames && (
        <>
          <Positivo>{jogador.gamesVencidos ?? 0}</Positivo>/
          <Negativo>{jogador.gamesPerdidos ?? 0}</Negativo>
        </>
      ),
    ],
    ["Pts", pontos !== undefined && <Pontos>{pontos}</Pontos>],
  ];

  return (
    <Item
      to={
        arenaSlug
          ? `/arena/${arenaSlug}/jogador/${jogador.jogadorId || jogador.id}`
          : "#"
      }
    >
      <Posicao $cores={coresDaPosicao(posicao)}>{posicao}</Posicao>
      <Nome>
        {jogador.jogadorNome || jogador.nome || `Jogador #${posicao}`}
      </Nome>
      <Numeros>
        {numeros.map(
          ([rotulo, valor]) =>
            valor !== undefined &&
            valor !== false && (
              <Numero key={rotulo}>
                <dt>{rotulo}</dt>
                <dd>{valor}</dd>
              </Numero>
            )
        )}
      </Numeros>
    </Item>
  );
};
