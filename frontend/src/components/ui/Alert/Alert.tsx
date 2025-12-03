/**
 * Alert Component
 * Componente de alerta/notificação inline
 */

import React from 'react';
import styled, { css } from 'styled-components';
import { theme } from '@/styles/theme';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClose?: () => void;
}

const AlertContainer = styled.div<{ $variant: AlertVariant }>`
  display: flex;
  gap: ${theme.spacing[3]};
  padding: ${theme.spacing[4]};
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid;
  position: relative;

  ${({ $variant }) => {
    switch ($variant) {
      case 'success':
        return css`
          background: ${theme.colors.success[50]};
          border-color: ${theme.colors.success[500]};
          color: ${theme.colors.success[700]};
        `;
      case 'warning':
        return css`
          background: ${theme.colors.warning[50]};
          border-color: ${theme.colors.warning[500]};
          color: ${theme.colors.warning[700]};
        `;
      case 'error':
        return css`
          background: ${theme.colors.error[50]};
          border-color: ${theme.colors.error[500]};
          color: ${theme.colors.error[700]};
        `;
      case 'info':
      default:
        return css`
          background: ${theme.colors.info[50]};
          border-color: ${theme.colors.info[500]};
          color: ${theme.colors.info[700]};
        `;
    }
  }}
`;

const IconWrapper = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  padding-top: 0.125rem;

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

const Content = styled.div`
  flex: 1;
`;

const AlertTitle = styled.div`
  font-weight: ${theme.typography.fontWeight.semibold};
  font-size: ${theme.typography.fontSize.base};
  margin-bottom: ${theme.spacing[1]};
`;

const AlertMessage = styled.div`
  font-size: ${theme.typography.fontSize.sm};
  line-height: ${theme.typography.lineHeight.relaxed};
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: opacity ${theme.transitions.fast};

  &:hover {
    opacity: 1;
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const getDefaultIcon = (variant: AlertVariant) => {
  switch (variant) {
    case 'success':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case 'warning':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      );
    case 'error':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case 'info':
    default:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
  }
};

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  icon,
  onClose,
}) => {
  const displayIcon = icon || getDefaultIcon(variant);

  return (
    <AlertContainer $variant={variant}>
      <IconWrapper>{displayIcon}</IconWrapper>
      
      <Content>
        {title && <AlertTitle>{title}</AlertTitle>}
        <AlertMessage>{children}</AlertMessage>
      </Content>

      {onClose && (
        <CloseButton onClick={onClose} aria-label="Fechar alerta">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </CloseButton>
      )}
    </AlertContainer>
  );
};

export default Alert;
