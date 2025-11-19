import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";

type AlertType = "success" | "error" | "warning" | "info";

interface AlertProps {
  type: AlertType;
  message: string;
  onClose?: () => void;
  autoClose?: number; // tempo em ms
}

// ============== ANIMATIONS ==============

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-10px);
  }
`;

// ============== STYLED COMPONENTS ==============

const AlertContainer = styled.div<{ $type: AlertType; $isClosing: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 0.5rem;
  border: 1px solid;
  animation: ${(props) => (props.$isClosing ? fadeOut : fadeIn)} 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  min-height: 3rem;

  ${(props) => {
    switch (props.$type) {
      case "success":
        return `
          background: #f0fdf4;
          border-color: #86efac;
          color: #166534;
        `;
      case "error":
        return `
          background: #fef2f2;
          border-color: #fca5a5;
          color: #991b1b;
        `;
      case "warning":
        return `
          background: #fefce8;
          border-color: #fde047;
          color: #854d0e;
        `;
      case "info":
        return `
          background: #eff6ff;
          border-color: #93c5fd;
          color: #1e40af;
        `;
      default:
        return `
          background: #f3f4f6;
          border-color: #d1d5db;
          color: #374151;
        `;
    }
  }}

  @media (max-width: 768px) {
    padding: 0.875rem 1rem;
    gap: 0.5rem;
  }

  @media (max-width: 480px) {
    padding: 0.75rem 0.875rem;
    min-height: 2.5rem;
  }
`;

const AlertIcon = styled.span<{ $type: AlertType }>`
  font-size: 1.25rem;
  font-weight: 700;
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;

  ${(props) => {
    switch (props.$type) {
      case "success":
        return `
          background: #86efac;
          color: #166534;
        `;
      case "error":
        return `
          background: #fca5a5;
          color: #991b1b;
        `;
      case "warning":
        return `
          background: #fde047;
          color: #854d0e;
        `;
      case "info":
        return `
          background: #93c5fd;
          color: #1e40af;
        `;
      default:
        return `
          background: #d1d5db;
          color: #374151;
        `;
    }
  }}

  @media (max-width: 768px) {
    font-size: 1.125rem;
    width: 1.375rem;
    height: 1.375rem;
  }

  @media (max-width: 480px) {
    font-size: 1rem;
    width: 1.25rem;
    height: 1.25rem;
  }
`;

const AlertMessage = styled.span`
  flex: 1;
  font-size: 0.9375rem;
  line-height: 1.5;
  font-weight: 500;

  @media (max-width: 768px) {
    font-size: 0.875rem;
  }

  @media (max-width: 480px) {
    font-size: 0.8125rem;
  }
`;

const CloseButton = styled.button<{ $type: AlertType }>`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1;
  flex-shrink: 0;
  transition: all 0.2s ease;
  opacity: 0.7;

  ${(props) => {
    switch (props.$type) {
      case "success":
        return `
          color: #166534;
          &:hover {
            background: #86efac;
            opacity: 1;
          }
        `;
      case "error":
        return `
          color: #991b1b;
          &:hover {
            background: #fca5a5;
            opacity: 1;
          }
        `;
      case "warning":
        return `
          color: #854d0e;
          &:hover {
            background: #fde047;
            opacity: 1;
          }
        `;
      case "info":
        return `
          color: #1e40af;
          &:hover {
            background: #93c5fd;
            opacity: 1;
          }
        `;
      default:
        return `
          color: #374151;
          &:hover {
            background: #d1d5db;
            opacity: 1;
          }
        `;
    }
  }}

  &:focus {
    outline: none;
    opacity: 1;
  }

  @media (max-width: 768px) {
    font-size: 1.125rem;
    width: 1.375rem;
    height: 1.375rem;
  }

  @media (max-width: 480px) {
    font-size: 1rem;
    width: 1.25rem;
    height: 1.25rem;
  }
`;

// ============== COMPONENTE ==============

const Alert: React.FC<AlertProps> = ({ type, message, onClose, autoClose }) => {
  const [visible, setVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoClose);

      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setVisible(false);
      if (onClose) {
        onClose();
      }
    }, 300); // Tempo da animação
  };

  if (!visible) return null;

  const icons = {
    success: "✓",
    error: "✗",
    warning: "⚠",
    info: "ℹ",
  };

  return (
    <AlertContainer $type={type} $isClosing={isClosing}>
      <AlertIcon $type={type}>{icons[type]}</AlertIcon>
      <AlertMessage>{message}</AlertMessage>
      {onClose && (
        <CloseButton $type={type} onClick={handleClose}>
          ×
        </CloseButton>
      )}
    </AlertContainer>
  );
};

export default Alert;
