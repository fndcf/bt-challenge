/**
 * Componente de botão reutilizável e responsivo
 */

import React, { ButtonHTMLAttributes } from "react";
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

const StyledButton = styled.button<{
  $variant: ButtonVariant;
  $size: ButtonSize;
  $fullWidth: boolean;
  $loading: boolean;
}>`
  /* Base styles */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing[2]};
  border: none;
  border-radius: ${theme.borderRadius.lg};
  font-weight: ${theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${theme.transitions.base} ${theme.easing.easeInOut};
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
    outline: 2px solid ${theme.colors.primary[500]};
    outline-offset: 2px;
  }

  /* Size variants */
  ${({ $size }) => {
    switch ($size) {
      case "sm":
        return css`
          padding: ${theme.spacing[2]} ${theme.spacing[4]};
          font-size: ${theme.typography.fontSize.sm};
          height: ${theme.components.button.height.sm};
        `;
      case "lg":
        return css`
          padding: ${theme.spacing[4]} ${theme.spacing[8]};
          font-size: ${theme.typography.fontSize.lg};
          height: ${theme.components.button.height.lg};
        `;
      case "md":
      default:
        return css`
          padding: ${theme.spacing[3]} ${theme.spacing[6]};
          font-size: ${theme.typography.fontSize.base};
          height: ${theme.components.button.height.md};
        `;
    }
  }}

  /* Color variants */
  ${({ $variant }) => {
    switch ($variant) {
      case "primary":
        return css`
          background: ${theme.gradients.primary};
          color: ${theme.colors.white};

          &:hover:not(:disabled) {
            background: ${theme.gradients.primaryHover};
            transform: translateY(-1px);
            box-shadow: ${theme.shadows.lg};
          }

          &:active:not(:disabled) {
            transform: translateY(0);
          }
        `;

      case "secondary":
        return css`
          background: ${theme.colors.neutral[100]};
          color: ${theme.colors.neutral[900]};

          &:hover:not(:disabled) {
            background: ${theme.colors.neutral[200]};
          }
        `;

      case "outline":
        return css`
          background: transparent;
          color: ${theme.colors.primary[500]};
          border: 2px solid ${theme.colors.primary[500]};

          &:hover:not(:disabled) {
            background: ${theme.colors.primary[500]};
            color: ${theme.colors.white};
          }
        `;

      case "ghost":
        return css`
          background: transparent;
          color: ${theme.colors.primary[500]};

          &:hover:not(:disabled) {
            background: ${theme.colors.primary[50]};
          }
        `;

      case "danger":
        return css`
          background: ${theme.colors.error[500]};
          color: ${theme.colors.white};

          &:hover:not(:disabled) {
            background: ${theme.colors.error[700]};
            transform: translateY(-1px);
            box-shadow: ${theme.shadows.md};
          }
        `;

      default:
        return "";
    }
  }}
`;

const Spinner = styled.div`
  width: 1em;
  height: 1em;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
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

export default Button;
