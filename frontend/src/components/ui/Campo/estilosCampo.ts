/**
 * Estilos compartilhados dos campos de formulário (Input e Select)
 */

import styled, { css } from "styled-components";
import { theme } from "@/styles/theme";

const { texto, superficie, acao, status } = theme.semantic;
const { fontSize, fontWeight, fontFamily } = theme.typography;

export type TamanhoCampo = "sm" | "md" | "lg";

const ALTURA: Record<TamanhoCampo, string> = {
  sm: "36px",
  md: "44px",
  lg: "48px",
};

export const CampoWrapper = styled.div<{ $fullWidth: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[1]};
  width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "auto")};
`;

export const CampoLabel = styled.label<{ $required?: boolean }>`
  font-size: ${fontSize.sm};
  font-weight: ${fontWeight.semibold};
  color: ${texto.principal};

  ${({ $required }) =>
    $required &&
    css`
      &::after {
        content: " *";
        color: ${status.erro.texto};
      }
    `}
`;

export const CampoAjuda = styled.span<{ $erro?: boolean }>`
  font-size: ${fontSize.xs};
  color: ${({ $erro }) => ($erro ? status.erro.texto : texto.secundario)};
`;

export const estiloCampo = css<{ $hasError: boolean; $size: TamanhoCampo }>`
  width: 100%;
  box-sizing: border-box;
  min-height: ${({ $size }) => ALTURA[$size]};
  padding: ${theme.spacing[2]} ${theme.spacing[4]};
  border: 1px solid
    ${({ $hasError }) =>
      $hasError ? status.erro.texto : superficie.bordaForte};
  border-radius: ${theme.borderRadius.lg};
  background: ${superficie.fundo};
  color: ${texto.principal};
  font-family: ${fontFamily.sans};
  /* 16px: abaixo disso o iPhone dá zoom ao focar */
  font-size: ${fontSize.base};

  &:focus-visible {
    outline: 2px solid ${acao.primaria};
    outline-offset: 1px;
  }

  &:disabled {
    background: ${superficie.pagina};
    color: ${texto.secundario};
    cursor: not-allowed;
  }
`;
