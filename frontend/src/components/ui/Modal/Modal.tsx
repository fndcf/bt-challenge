/**
 * Componente de modal acessível e responsivo
 */

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import styled, { keyframes } from "styled-components";
import { theme } from "@/styles/theme";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: ModalSize;
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const slideUp = keyframes`
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing[4]};
  z-index: ${theme.zIndex.modalBackdrop};
  animation: ${fadeIn} ${theme.transitions.base} ${theme.easing.easeOut};
  overflow-y: auto;

  @media (max-width: ${theme.breakpoints.sm}) {
    padding: 0;
    align-items: flex-end;
  }
`;

const ModalContainer = styled.div<{ $size: ModalSize }>`
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius["2xl"]};
  box-shadow: ${theme.shadows["2xl"]};
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  animation: ${slideUp} ${theme.transitions.base} ${theme.easing.easeOut};
  position: relative;
  z-index: ${theme.zIndex.modal};

  /* Size variants */
  ${({ $size }) => {
    switch ($size) {
      case "sm":
        return `
          width: 100%;
          max-width: 400px;
        `;
      case "lg":
        return `
          width: 100%;
          max-width: 800px;
        `;
      case "xl":
        return `
          width: 100%;
          max-width: 1200px;
        `;
      case "full":
        return `
          width: 100%;
          height: 100%;
          max-width: 100%;
          max-height: 100%;
          border-radius: 0;
        `;
      case "md":
      default:
        return `
          width: 100%;
          max-width: 600px;
        `;
    }
  }}

  @media (max-width: ${theme.breakpoints.sm}) {
    max-height: 95vh;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    width: 100%;
  }
`;

const ModalHeader = styled.div`
  padding: ${theme.spacing[6]};
  border-bottom: 1px solid ${theme.colors.neutral[200]};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing[4]};

  @media (max-width: ${theme.breakpoints.sm}) {
    padding: ${theme.spacing[4]};
  }
`;

const ModalTitle = styled.h2`
  font-size: ${theme.typography.fontSize["2xl"]};
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${theme.colors.neutral[900]};
  margin: 0;

  @media (max-width: ${theme.breakpoints.sm}) {
    font-size: ${theme.typography.fontSize.xl};
  }
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  width: 2rem;
  height: 2rem;
  border-radius: ${theme.borderRadius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${theme.colors.neutral[500]};
  transition: all ${theme.transitions.fast} ${theme.easing.easeInOut};
  flex-shrink: 0;

  &:hover {
    background: ${theme.colors.neutral[100]};
    color: ${theme.colors.neutral[700]};
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.primary[500]};
    outline-offset: 2px;
  }

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

const ModalBody = styled.div`
  padding: ${theme.spacing[6]};
  overflow-y: auto;
  flex: 1;

  @media (max-width: ${theme.breakpoints.sm}) {
    padding: ${theme.spacing[4]};
  }
`;

const ModalFooter = styled.div`
  padding: ${theme.spacing[6]};
  border-top: 1px solid ${theme.colors.neutral[200]};
  display: flex;
  gap: ${theme.spacing[3]};
  justify-content: flex-end;

  @media (max-width: ${theme.breakpoints.sm}) {
    padding: ${theme.spacing[4]};
    flex-direction: column-reverse;

    > * {
      width: 100%;
    }
  }
`;

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = "md",
  children,
  footer,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <Overlay onClick={handleOverlayClick}>
      <ModalContainer
        ref={modalRef}
        $size={size}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <ModalHeader>
            <ModalTitle>{title}</ModalTitle>
            <CloseButton onClick={onClose} aria-label="Fechar modal">
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
          </ModalHeader>
        )}

        <ModalBody>{children}</ModalBody>

        {footer && <ModalFooter>{footer}</ModalFooter>}
      </ModalContainer>
    </Overlay>,
    document.body
  );
};

export default Modal;
