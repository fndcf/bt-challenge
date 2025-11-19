/**
 * Toast Notification System
 * Sistema de notificações toast com contexto e hook
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styled, { keyframes } from 'styled-components';
import { theme } from '../../styles/theme';

export type ToastType = 'info' | 'success' | 'warning' | 'error';
export type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// Animations
const slideInRight = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOutRight = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const ToastContainer = styled.div<{ $position: ToastPosition }>`
  position: fixed;
  z-index: ${theme.zIndex.tooltip};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[3]};
  max-width: 400px;
  pointer-events: none;

  ${({ $position }) => {
    const [vertical, horizontal] = $position.split('-');
    
    let styles = '';
    
    // Vertical positioning
    if (vertical === 'top') {
      styles += `top: ${theme.spacing[4]};`;
    } else {
      styles += `bottom: ${theme.spacing[4]};`;
    }
    
    // Horizontal positioning
    if (horizontal === 'left') {
      styles += `left: ${theme.spacing[4]};`;
    } else if (horizontal === 'right') {
      styles += `right: ${theme.spacing[4]};`;
    } else {
      styles += `
        left: 50%;
        transform: translateX(-50%);
      `;
    }
    
    return styles;
  }}

  @media (max-width: ${theme.breakpoints.sm}) {
    left: ${theme.spacing[2]};
    right: ${theme.spacing[2]};
    max-width: none;
    transform: none;
  }
`;

const ToastItem = styled.div<{ $type: ToastType; $isExiting: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[3]};
  padding: ${theme.spacing[4]};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.lg};
  pointer-events: auto;
  animation: ${({ $isExiting }) => $isExiting ? slideOutRight : slideInRight} 
    ${theme.transitions.base} ${theme.easing.easeOut};

  ${({ $type }) => {
    switch ($type) {
      case 'success':
        return `
          background: ${theme.colors.success[500]};
          color: ${theme.colors.white};
        `;
      case 'warning':
        return `
          background: ${theme.colors.warning[500]};
          color: ${theme.colors.white};
        `;
      case 'error':
        return `
          background: ${theme.colors.error[500]};
          color: ${theme.colors.white};
        `;
      case 'info':
      default:
        return `
          background: ${theme.colors.info[500]};
          color: ${theme.colors.white};
        `;
    }
  }}
`;

const ToastIcon = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

const ToastMessage = styled.div`
  flex: 1;
  font-size: ${theme.typography.fontSize.sm};
  font-weight: ${theme.typography.fontWeight.medium};
`;

const ToastCloseButton = styled.button`
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  opacity: 0.8;
  transition: opacity ${theme.transitions.fast};

  &:hover {
    opacity: 1;
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const getToastIcon = (type: ToastType) => {
  switch (type) {
    case 'success':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'warning':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case 'error':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    case 'info':
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

interface ToastProviderProps {
  children: React.ReactNode;
  position?: ToastPosition;
  defaultDuration?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'top-right',
  defaultDuration = 5000,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [exitingToasts, setExitingToasts] = useState<Set<string>>(new Set());

  const showToast = useCallback((
    message: string,
    type: ToastType = 'info',
    duration: number = defaultDuration
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, type, message, duration };

    setToasts((prev) => [...prev, newToast]);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }
  }, [defaultDuration]);

  const hideToast = useCallback((id: string) => {
    setExitingToasts((prev) => new Set([...prev, id]));
    
    // Remove after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
      setExitingToasts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 200); // Animation duration
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toasts.length > 0 && createPortal(
        <ToastContainer $position={position}>
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              $type={toast.type}
              $isExiting={exitingToasts.has(toast.id)}
            >
              <ToastIcon>{getToastIcon(toast.type)}</ToastIcon>
              <ToastMessage>{toast.message}</ToastMessage>
              <ToastCloseButton onClick={() => hideToast(toast.id)}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </ToastCloseButton>
            </ToastItem>
          ))}
        </ToastContainer>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

/**
 * Hook para usar toast notifications
 */
export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider');
  }
  return context;
};
