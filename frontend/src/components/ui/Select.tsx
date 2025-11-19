/**
 * Select Component
 * Componente de select reutilizável com label e erro
 */

import React, { SelectHTMLAttributes, forwardRef } from 'react';
import styled, { css } from 'styled-components';
import { theme } from '../../styles/theme';

export type SelectSize = 'sm' | 'md' | 'lg';

interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  selectSize?: SelectSize;
  options: SelectOption[];
  placeholder?: string;
}

const SelectWrapper = styled.div<{ $fullWidth: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[2]};
  width: ${({ $fullWidth }) => $fullWidth ? '100%' : 'auto'};
`;

const Label = styled.label<{ $required?: boolean }>`
  font-size: ${theme.typography.fontSize.sm};
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.neutral[700]};

  ${({ $required }) => $required && css`
    &::after {
      content: ' *';
      color: ${theme.colors.error[500]};
    }
  `}
`;

const SelectContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;

  /* Custom arrow icon */
  &::after {
    content: '';
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 5px solid ${theme.colors.neutral[500]};
    pointer-events: none;
  }
`;

const StyledSelect = styled.select<{
  $hasError: boolean;
  $size: SelectSize;
}>`
  width: 100%;
  border: 1px solid ${({ $hasError }) => 
    $hasError ? theme.colors.error[500] : theme.colors.neutral[300]};
  border-radius: ${theme.borderRadius.lg};
  font-size: ${theme.typography.fontSize.base};
  font-family: ${theme.typography.fontFamily.sans};
  color: ${theme.colors.neutral[900]};
  background: ${theme.colors.white};
  transition: all ${theme.transitions.base} ${theme.easing.easeInOut};
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  /* Size variants */
  ${({ $size }) => {
    switch ($size) {
      case 'sm':
        return css`
          padding: ${theme.spacing[2]} ${theme.spacing[10]} ${theme.spacing[2]} ${theme.spacing[3]};
          height: ${theme.components.input.height.sm};
          font-size: ${theme.typography.fontSize.sm};
        `;
      case 'lg':
        return css`
          padding: ${theme.spacing[4]} ${theme.spacing[12]} ${theme.spacing[4]} ${theme.spacing[5]};
          height: ${theme.components.input.height.lg};
          font-size: ${theme.typography.fontSize.lg};
        `;
      case 'md':
      default:
        return css`
          padding: ${theme.spacing[3]} ${theme.spacing[10]} ${theme.spacing[3]} ${theme.spacing[4]};
          height: ${theme.components.input.height.md};
        `;
    }
  }}

  /* Focus state */
  &:focus {
    outline: none;
    border-color: ${({ $hasError }) => 
      $hasError ? theme.colors.error[500] : theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${({ $hasError }) => 
      $hasError 
        ? `${theme.colors.error[500]}20` 
        : `${theme.colors.primary[500]}20`};
  }

  /* Disabled state */
  &:disabled {
    background: ${theme.colors.neutral[50]};
    cursor: not-allowed;
    opacity: 0.6;
  }

  /* Placeholder option */
  option[value=""][disabled] {
    display: none;
  }
`;

const HelperText = styled.span<{ $isError?: boolean }>`
  font-size: ${theme.typography.fontSize.sm};
  color: ${({ $isError }) => 
    $isError ? theme.colors.error[500] : theme.colors.neutral[500]};
  margin-top: ${theme.spacing[1]};
`;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  helperText,
  fullWidth = false,
  selectSize = 'md',
  options,
  placeholder,
  required,
  ...props
}, ref) => {
  return (
    <SelectWrapper $fullWidth={fullWidth}>
      {label && (
        <Label $required={required}>
          {label}
        </Label>
      )}
      
      <SelectContainer>
        <StyledSelect
          ref={ref}
          $hasError={!!error}
          $size={selectSize}
          required={required}
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

      {(error || helperText) && (
        <HelperText $isError={!!error}>
          {error || helperText}
        </HelperText>
      )}
    </SelectWrapper>
  );
});

Select.displayName = 'Select';

export default Select;
