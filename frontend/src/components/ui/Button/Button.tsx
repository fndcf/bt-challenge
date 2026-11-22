/**
 * Componente de botão reutilizável e responsivo
 *
 * Cores por função (docs/ARCHITECTURE.md > "Cores por funcao"):
 * - primary / outline / ghost: cor de ação (teal), igual em todos os formatos
 * - danger: ação destrutiva
 * - secondary: ação neutra (ex.: Cancelar)
 * Botões nunca usam cor de formato nem de status.
 */

import React, { ButtonHTMLAttributes } from "react";
import { Link, LinkProps } from "react-router-dom";
import styled, { css } from "styled-components";
import { theme } from "@/styles/theme";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

const { acao, texto, superficie, status } = theme.semantic;

const StyledButton = styled.button<{
  $variant: ButtonVariant;
  $size: ButtonSize;
  $fullWidth: boolean;
  $loading: boolean;
}>`
  /* Base styles */
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing[2]};
  border: 1px solid transparent;
  border-radius: ${theme.borderRadius.lg};
  font-weight: ${theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: background-color ${theme.transitions.base} ${theme.easing.easeInOut},
    border-color ${theme.transitions.base} ${theme.easing.easeInOut},
    color ${theme.transitions.base} ${theme.easing.easeInOut};
  white-space: nowrap;
  position: relative;
  font-family: ${theme.typography.fontFamily.sans};
  text-decoration: none;

  /* Width */
  ${({ $fullWidth }) =>
    $fullWidth &&
    css`
      width: 100%;
    `}

  /* Disabled state */
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Loading state */
  ${({ $loading }) =>
    $loading &&
    css`
      pointer-events: none;
      opacity: 0.7;
    `}

  /* Focus state */
  &:focus-visible {
    outline: 2px solid ${acao.primaria};
    outline-offset: 2px;
  }

  /*
   * Tamanhos (altura = área de toque):
   * - md: padrão, 44px
   * - sm: 36px, só para ações secundárias em listas densas (cards de confronto)
   * - lg: 48px
   */
  ${({ $size }) => {
    switch ($size) {
      case "sm":
        return css`
          padding: 0 ${theme.spacing[3]};
          font-size: ${theme.typography.fontSize.sm};
          min-height: 36px;
        `;
      case "lg":
        return css`
          padding: 0 ${theme.spacing[8]};
          font-size: ${theme.typography.fontSize.base};
          min-height: 48px;
        `;
      case "md":
      default:
        return css`
          padding: 0 ${theme.spacing[5]};
          font-size: ${theme.typography.fontSize.sm};
          min-height: 44px;
        `;
    }
  }}

  /* Variantes de cor */
  ${({ $variant }) => {
    switch ($variant) {
      case "primary":
        return css`
          background: ${acao.primaria};
          color: ${acao.textoSobreAcao};

          &:hover:not(:disabled) {
            background: ${acao.primariaHover};
          }
        `;

      case "secondary":
        return css`
          background: ${superficie.pagina};
          color: ${texto.principal};
          border-color: ${superficie.bordaForte};

          &:hover:not(:disabled) {
            background: ${superficie.borda};
          }
        `;

      case "outline":
        return css`
          background: ${superficie.fundo};
          color: ${acao.primaria};
          border-color: ${acao.primaria};

          &:hover:not(:disabled) {
            background: ${acao.fundoClaro};
          }
        `;

      case "ghost":
        return css`
          background: transparent;
          color: ${acao.primaria};

          &:hover:not(:disabled) {
            background: ${acao.fundoClaro};
          }
        `;

      case "danger":
        return css`
          background: ${acao.perigo};
          color: ${acao.textoSobreAcao};

          &:hover:not(:disabled) {
            background: ${acao.perigoHover};
          }

          &:focus-visible {
            outline-color: ${status.erro.texto};
          }
        `;

      default:
        return "";
    }
  }}
`;

// Usa a cor do texto do botão: visível em todas as variantes
const Spinner = styled.div`
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  icon,
  iconPosition = "left",
  disabled,
  ...props
}) => {
  return (
    <StyledButton
      $variant={variant}
      $size={size}
      $fullWidth={fullWidth}
      $loading={loading}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner />}
      {!loading && icon && iconPosition === "left" && icon}
      {children}
      {!loading && icon && iconPosition === "right" && icon}
    </StyledButton>
  );
};

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

/** Link com cara de botão (navega em vez de executar uma ação) */
export const ButtonLink: React.FC<ButtonLinkProps> = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  ...props
}) => (
  <StyledButton
    as={Link}
    $variant={variant}
    $size={size}
    $fullWidth={fullWidth}
    $loading={false}
    {...props}
  />
);

export default Button;
