/**
 * Campo de texto com label, ajuda e erro
 */

import React, { InputHTMLAttributes, forwardRef, useId } from "react";
import styled, { css } from "styled-components";
import { theme } from "@/styles/theme";
import {
  CampoAjuda,
  CampoLabel,
  CampoWrapper,
  estiloCampo,
  TamanhoCampo,
} from "../Campo/estilosCampo";

export type InputSize = TamanhoCampo;

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  inputSize?: InputSize;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  /** Botão dentro do campo, à direita (ex.: mostrar a senha) */
  acao?: React.ReactNode;
}

const { texto } = theme.semantic;

const InputContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const StyledInput = styled.input<{
  $hasError: boolean;
  $size: InputSize;
  $icone?: "left" | "right";
}>`
  ${estiloCampo}

  ${({ $icone }) =>
    $icone &&
    css`
      padding-${$icone}: ${theme.spacing[10]};
    `}

  &::placeholder {
    color: ${texto.secundario};
  }

  &[type="number"]::-webkit-inner-spin-button,
  &[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  &[type="number"] {
    -moz-appearance: textfield;
  }
`;

const IconWrapper = styled.div<{ $position: "left" | "right" }>`
  position: absolute;
  ${({ $position }) => $position}: ${theme.spacing[3]};
  display: flex;
  color: ${texto.secundario};
  pointer-events: none;

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

const AcaoWrapper = styled.div`
  position: absolute;
  right: ${theme.spacing[1]};
  display: flex;
  color: ${texto.secundario};
`;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      inputSize = "md",
      icon,
      iconPosition = "left",
      acao: acaoDoCampo,
      required,
      id,
      ...props
    },
    ref
  ) => {
    const idGerado = useId();
    const campoId = id ?? idGerado;
    const ajudaId = `${campoId}-ajuda`;
    const ajuda = error || helperText;

    return (
      <CampoWrapper $fullWidth={fullWidth}>
        {label && (
          <CampoLabel htmlFor={campoId} $required={required}>
            {label}
          </CampoLabel>
        )}

        <InputContainer>
          {icon && <IconWrapper $position={iconPosition}>{icon}</IconWrapper>}
          <StyledInput
            ref={ref}
            id={campoId}
            $hasError={!!error}
            $size={inputSize}
            $icone={icon ? iconPosition : acaoDoCampo ? "right" : undefined}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={ajuda ? ajudaId : undefined}
            {...props}
          />
          {acaoDoCampo && <AcaoWrapper>{acaoDoCampo}</AcaoWrapper>}
        </InputContainer>

        {ajuda && (
          <CampoAjuda id={ajudaId} $erro={!!error}>
            {ajuda}
          </CampoAjuda>
        )}
      </CampoWrapper>
    );
  }
);

Input.displayName = "Input";

export default Input;
