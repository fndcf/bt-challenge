/**
 * Componente de modal acessível e responsivo
 */

import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import styled, { css, keyframes } from "styled-components";
import { useAreaVisivel } from "@/hooks/useAreaVisivel";
import { theme } from "@/styles/theme";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  /** Linha abaixo do título (ex.: nome da etapa) */
  subtitle?: React.ReactNode;
  size?: ModalSize;
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  loading?: boolean;
  /** false: conteúdo vai até a borda (abas, tabelas, listas com fundo próprio) */
  bodyPadding?: boolean;
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
  background: ${theme.semantic.superficie.fundo};
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
    /* Da área visível, não da tela: no iPhone, vh conta o espaço atrás da barra
       do navegador e o cabeçalho do modal ficava fora da tela */
    max-height: 96%;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    width: 100%;
  }
`;

const ModalHeader = styled.div`
  flex-shrink: 0;
  padding: ${theme.spacing[6]};
  border-bottom: 1px solid ${theme.semantic.superficie.borda};
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
  color: ${theme.semantic.texto.principal};
  margin: 0;

  @media (max-width: ${theme.breakpoints.sm}) {
    font-size: ${theme.typography.fontSize.xl};
  }
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: ${theme.borderRadius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${theme.semantic.texto.secundario};
  transition: all ${theme.transitions.fast} ${theme.easing.easeInOut};
  flex-shrink: 0;

  &:hover {
    background: ${theme.semantic.superficie.pagina};
    color: ${theme.semantic.texto.principal};
  }

  &:focus-visible {
    outline: 2px solid ${theme.semantic.acao.primaria};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

const ModalSubtitle = styled.div`
  margin-top: ${theme.spacing[1]};
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.semantic.texto.secundario};
`;

const ModalBody = styled.div<{ $padding: boolean }>`
  overflow-y: auto;
  overscroll-behavior: contain;
  flex: 1;
  min-height: 0;

  ${({ $padding }) =>
    $padding &&
    css`
      padding: ${theme.spacing[6]};

      @media (max-width: ${theme.breakpoints.sm}) {
        padding: ${theme.spacing[4]};
      }
    `}
`;

const ModalFooter = styled.div`
  flex-shrink: 0;
  padding: ${theme.spacing[6]};
  border-top: 1px solid ${theme.semantic.superficie.borda};
  display: flex;
  gap: ${theme.spacing[3]};
  justify-content: flex-end;

  @media (max-width: ${theme.breakpoints.sm}) {
    padding: ${theme.spacing[4]};
    /* Lado a lado; se não couber, a ação principal fica em cima */
    flex-wrap: wrap-reverse;

    > * {
      flex: 1 1 auto;
    }
  }
`;

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  size = "md",
  children,
  footer,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  loading = false,
  bodyPadding = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const tituloId = useId();
  const areaVisivel = useAreaVisivel(isOpen);

  useEffect(() => {
    if (!isOpen || !closeOnEscape || loading) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, closeOnEscape, loading]);

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

  // O teclado abriu e o modal encolheu: traz o campo focado para a vista
  useEffect(() => {
    const focado = document.activeElement;
    if (areaVisivel && modalRef.current?.contains(focado)) {
      focado?.scrollIntoView?.({ block: "nearest" });
    }
  }, [areaVisivel]);

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && !loading && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <Overlay style={areaVisivel ?? undefined} onClick={handleOverlayClick}>
      <ModalContainer
        ref={modalRef}
        $size={size}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? tituloId : undefined}
      >
        {title && (
          <ModalHeader>
            <div>
              <ModalTitle id={tituloId}>{title}</ModalTitle>
              {subtitle && <ModalSubtitle>{subtitle}</ModalSubtitle>}
            </div>
            <CloseButton onClick={onClose} aria-label="Fechar modal" disabled={loading}>
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

        <ModalBody $padding={bodyPadding}>{children}</ModalBody>

        {footer && <ModalFooter>{footer}</ModalFooter>}
      </ModalContainer>
    </Overlay>,
    document.body
  );
};

export default Modal;
