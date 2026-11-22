/**
 * Selo (badge) de status ou de formato
 *
 * - tom: situação (sucesso, aviso, erro, neutro, info) — sempre com texto
 * - genero: masculino ou feminino (use o SeloGenero)
 * - formato: identidade do tipo de etapa (selo "Rei da Praia", etc.)
 * Cores por função: docs/ARCHITECTURE.md > "Cores por funcao".
 */

import React from "react";
import styled, { css } from "styled-components";
import { theme } from "@/styles/theme";
import { getCoresFormato } from "@/styles/semantic";
import { FormatoEtapa } from "@/types/etapa";

export type BadgeTom = keyof typeof theme.semantic.status;
export type BadgeTamanho = "sm" | "md";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Situação. Ignorado quando `formato` é informado. */
  tom?: BadgeTom;
  /** Selo de identidade do formato da etapa */
  formato?: FormatoEtapa;
  /** Gênero do jogador */
  genero?: keyof typeof theme.semantic.genero;
  tamanho?: BadgeTamanho;
  children: React.ReactNode;
}

interface CoresBadge {
  texto: string;
  fundo: string;
  borda: string;
}

const StyledBadge = styled.span<{ $cores: CoresBadge; $tamanho: BadgeTamanho }>`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing[1]};
  border-radius: ${theme.borderRadius.full};
  border: 1px solid ${({ $cores }) => $cores.borda};
  background: ${({ $cores }) => $cores.fundo};
  color: ${({ $cores }) => $cores.texto};
  font-family: ${theme.typography.fontFamily.sans};
  font-weight: ${theme.typography.fontWeight.semibold};
  white-space: nowrap;
  line-height: 1.4;

  ${({ $tamanho }) =>
    $tamanho === "md"
      ? css`
          padding: ${theme.spacing[1]} ${theme.spacing[3]};
          font-size: ${theme.typography.fontSize.sm};
        `
      : css`
          padding: 0.125rem ${theme.spacing[2]};
          font-size: ${theme.typography.fontSize.xs};
        `}
`;

export const Badge: React.FC<BadgeProps> = ({
  tom = "neutro",
  formato,
  genero,
  tamanho = "sm",
  children,
  ...props
}) => {
  const getCores = (): CoresBadge => {
    if (formato) {
      const cores = getCoresFormato(formato);
      return { texto: cores.texto, fundo: cores.claro, borda: cores.borda };
    }
    return genero ? theme.semantic.genero[genero] : theme.semantic.status[tom];
  };

  return (
    <StyledBadge $cores={getCores()} $tamanho={tamanho} {...props}>
      {children}
    </StyledBadge>
  );
};

export default Badge;
