import React from "react";
import styled from "styled-components";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemName?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

// ============== STYLED COMPONENTS ==============

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  padding: 1rem;
`;

const ModalContent = styled.div`
  position: relative;
  z-index: 51;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 28rem;
  width: 100%;
  overflow: hidden;
`;

const Header = styled.div`
  padding: 1.5rem;
  text-align: center;
  border-bottom: 1px solid #f3f4f6;
`;

const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
`;

const Body = styled.div`
  padding: 1.5rem;
`;

const Message = styled.p`
  font-size: 0.9375rem;
  color: #6b7280;
  margin: 0 0 1rem 0;
  line-height: 1.5;
`;

const ItemHighlight = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;

  strong {
    color: #dc2626;
    font-weight: 600;
  }
`;

const Warning = styled.p`
  font-size: 0.875rem;
  color: #dc2626;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Footer = styled.div`
  padding: 1rem 1.5rem;
  background: #f9fafb;
  display: flex;
  gap: 0.75rem;
  border-top: 1px solid #f3f4f6;
`;

const Button = styled.button<{ $variant: "cancel" | "delete" }>`
  flex: 1;
  padding: 0.625rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;

  ${(props) =>
    props.$variant === "delete"
      ? `
    background: #dc2626;
    color: white;
    
    &:hover:not(:disabled) {
      background: #b91c1c;
    }
  `
      : `
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
    
    &:hover:not(:disabled) {
      background: #f9fafb;
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// ============== COMPONENTE ==============

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  message,
  itemName,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <Overlay onClick={!loading ? onCancel : undefined}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>{title}</Title>
        </Header>

        <Body>
          <Message>{message}</Message>
          {itemName && (
            <ItemHighlight>
              <strong>{itemName}</strong>
            </ItemHighlight>
          )}
          <Warning>Esta ação não pode ser desfeita!</Warning>
        </Body>

        <Footer>
          <Button $variant="cancel" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button $variant="delete" onClick={onConfirm} disabled={loading}>
            {loading ? "Deletando..." : "Sim, Deletar"}
          </Button>
        </Footer>
      </ModalContent>
    </Overlay>
  );
};

export default ConfirmDeleteModal;
