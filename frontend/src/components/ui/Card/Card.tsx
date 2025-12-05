/**
 * Componente de card reutilizável e responsivo
 */

import React, { HTMLAttributes } from "react";
import styled, { css } from "styled-components";
import { theme } from "@/styles/theme";

export type CardVariant = "default" | "outlined" | "elevated";
export type CardPadding = "none" | "sm" | "md" | "lg";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  hoverable?: boolean;
  clickable?: boolean;
}

const StyledCard = styled.div<{
  $variant: CardVariant;
  $padding: CardPadding;
  $hoverable: boolean;
  $clickable: boolean;
}>`
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius["2xl"]};
  transition: all ${theme.transitions.base} ${theme.easing.easeInOut};
  width: 100%;

  /* Padding variants */
  ${({ $padding }) => {
    switch ($padding) {
      case "none":
        return css`
          padding: 0;
        `;
      case "sm":
        return css`
          padding: ${theme.components.card.padding.sm};
        `;
      case "lg":
        return css`
          padding: ${theme.components.card.padding.lg};
        `;
      case "md":
      default:
        return css`
          padding: ${theme.components.card.padding.md};
        `;
    }
  }}

  /* Variant styles */
  ${({ $variant }) => {
    switch ($variant) {
      case "outlined":
        return css`
          border: 1px solid ${theme.colors.neutral[200]};
          box-shadow: none;
        `;
      case "elevated":
        return css`
          box-shadow: ${theme.shadows.xl};
        `;
      case "default":
      default:
        return css`
          box-shadow: ${theme.shadows.md};
        `;
    }
  }}

  /* Hoverable */
  ${({ $hoverable, $variant }) =>
    $hoverable &&
    css`
      &:hover {
        box-shadow: ${$variant === "outlined"
          ? theme.shadows.md
          : theme.shadows.xl};
        transform: translateY(-2px);
      }
    `}

  /* Clickable */
  ${({ $clickable }) =>
    $clickable &&
    css`
      cursor: pointer;
      user-select: none;

      &:active {
        transform: scale(0.98);
      }
    `}
`;

const CardHeader = styled.div`
  margin-bottom: ${theme.spacing[4]};
  padding-bottom: ${theme.spacing[4]};
  border-bottom: 1px solid ${theme.colors.neutral[200]};
`;

const CardTitle = styled.h3`
  font-size: ${theme.typography.fontSize.xl};
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${theme.colors.neutral[900]};
  margin: 0;
`;

const CardDescription = styled.p`
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.neutral[600]};
  margin: ${theme.spacing[2]} 0 0;
`;

const CardBody = styled.div`
  /* Body styles */
`;

const CardFooter = styled.div`
  margin-top: ${theme.spacing[4]};
  padding-top: ${theme.spacing[4]};
  border-top: 1px solid ${theme.colors.neutral[200]};
  display: flex;
  gap: ${theme.spacing[3]};
  align-items: center;

  /* Responsive footer */
  @media (max-width: ${theme.breakpoints.sm}) {
    flex-direction: column;
    align-items: stretch;

    > * {
      width: 100%;
    }
  }
`;

export const Card: React.FC<CardProps> & {
  Header: typeof CardHeader;
  Title: typeof CardTitle;
  Description: typeof CardDescription;
  Body: typeof CardBody;
  Footer: typeof CardFooter;
} = ({
  variant = "default",
  padding = "md",
  hoverable = false,
  clickable = false,
  children,
  ...props
}) => {
  return (
    <StyledCard
      $variant={variant}
      $padding={padding}
      $hoverable={hoverable}
      $clickable={clickable}
      {...props}
    >
      {children}
    </StyledCard>
  );
};

// Subcomponents
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
