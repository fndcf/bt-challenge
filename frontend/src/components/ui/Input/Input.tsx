/**
 * Input Component
 * Componente de input reutilizável com label e erro
 */

import React, { InputHTMLAttributes, forwardRef } from 'react';
import styled, { css } from 'styled-components';
import { theme } from '@/styles/theme';

export type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  inputSize?: InputSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const InputWrapper = styled.div<{ $fullWidth: boolean }>`
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

const InputContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const StyledInput = styled.input<{
  $hasError: boolean;
  $size: InputSize;
  $hasIcon: boolean;
  $iconPosition: 'left' | 'right';
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

  /* Size variants */
  ${({ $size }) => {
    switch ($size) {
      case 'sm':
        return css`
          padding: ${theme.spacing[2]} ${theme.spacing[3]};
          height: ${theme.components.input.height.sm};
          font-size: ${theme.typography.fontSize.sm};
        `;
      case 'lg':
        return css`
          padding: ${theme.spacing[4]} ${theme.spacing[5]};
          height: ${theme.components.input.height.lg};
          font-size: ${theme.typography.fontSize.lg};
        `;
      case 'md':
      default:
        return css`
          padding: ${theme.spacing[3]} ${theme.spacing[4]};
          height: ${theme.components.input.height.md};
        `;
    }
  }}

  /* Icon padding */
  ${({ $hasIcon, $iconPosition, $size }) => {
    if (!$hasIcon) return '';
    
    const paddingSize = $size === 'sm' ? theme.spacing[10] : 
                       $size === 'lg' ? theme.spacing[12] : 
                       theme.spacing[10];
    
    return $iconPosition === 'left' 
      ? css`padding-left: ${paddingSize};`
      : css`padding-right: ${paddingSize};`;
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

  /* Placeholder */
  &::placeholder {
    color: ${theme.colors.neutral[400]};
  }

  /* Remove number input arrows */
  &[type='number']::-webkit-inner-spin-button,
  &[type='number']::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  &[type='number'] {
    -moz-appearance: textfield;
  }
`;

const IconWrapper = styled.div<{
  $position: 'left' | 'right';
  $size: InputSize;
}>`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.neutral[500]};
  pointer-events: none;

  ${({ $position, $size }) => {
    const spacing = $size === 'sm' ? theme.spacing[3] : 
                   $size === 'lg' ? theme.spacing[4] : 
                   theme.spacing[3];
    
    return $position === 'left' 
      ? css`left: ${spacing};`
      : css`right: ${spacing};`;
  }}

  svg {
    width: ${({ $size }) => 
      $size === 'sm' ? '1rem' : 
      $size === 'lg' ? '1.5rem' : 
      '1.25rem'};
    height: ${({ $size }) => 
      $size === 'sm' ? '1rem' : 
      $size === 'lg' ? '1.5rem' : 
      '1.25rem'};
  }
`;

const HelperText = styled.span<{ $isError?: boolean }>`
  font-size: ${theme.typography.fontSize.sm};
  color: ${({ $isError }) => 
    $isError ? theme.colors.error[500] : theme.colors.neutral[500]};
  margin-top: ${theme.spacing[1]};
`;

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  fullWidth = false,
  inputSize = 'md',
  icon,
  iconPosition = 'left',
  required,
  ...props
}, ref) => {
  return (
    <InputWrapper $fullWidth={fullWidth}>
      {label && (
        <Label $required={required}>
          {label}
        </Label>
      )}
      
      <InputContainer>
        {icon && (
          <IconWrapper $position={iconPosition} $size={inputSize}>
            {icon}
          </IconWrapper>
        )}
        
        <StyledInput
          ref={ref}
          $hasError={!!error}
          $size={inputSize}
          $hasIcon={!!icon}
          $iconPosition={iconPosition}
          required={required}
          {...props}
        />
      </InputContainer>

      {(error || helperText) && (
        <HelperText $isError={!!error}>
          {error || helperText}
        </HelperText>
      )}
    </InputWrapper>
  );
});

Input.displayName = 'Input';

export default Input;
