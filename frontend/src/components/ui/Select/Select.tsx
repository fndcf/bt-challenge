/**
 * Lista de opções com label, ajuda e erro
 */

import { SelectHTMLAttributes, forwardRef, useId } from "react";
import styled from "styled-components";
import { theme } from "@/styles/theme";
import {
  CampoAjuda,
  CampoLabel,
  CampoWrapper,
  estiloCampo,
  TamanhoCampo,
} from "../Campo/estilosCampo";

export type SelectSize = TamanhoCampo;

interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  selectSize?: SelectSize;
  options: SelectOption[];
  placeholder?: string;
}

const SelectContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;

  /* Seta */
  &::after {
    content: "";
    position: absolute;
    right: 1rem;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 5px solid ${theme.semantic.texto.secundario};
    pointer-events: none;
  }
`;

const StyledSelect = styled.select<{ $hasError: boolean; $size: SelectSize }>`
  ${estiloCampo}
  padding-right: ${theme.spacing[10]};
  cursor: pointer;
  appearance: none;

  option[value=""][disabled] {
    display: none;
  }
`;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      selectSize = "md",
      options,
      placeholder,
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

        <SelectContainer>
          <StyledSelect
            ref={ref}
            id={campoId}
            $hasError={!!error}
            $size={selectSize}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={ajuda ? ajudaId : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}

            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </StyledSelect>
        </SelectContainer>

        {ajuda && (
          <CampoAjuda id={ajudaId} $erro={!!error}>
            {ajuda}
          </CampoAjuda>
        )}
      </CampoWrapper>
    );
  }
);

Select.displayName = "Select";

export default Select;
