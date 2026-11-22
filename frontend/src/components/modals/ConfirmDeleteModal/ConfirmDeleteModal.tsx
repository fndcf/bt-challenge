import React from "react";
import styled from "styled-components";
import { Modal, Button } from "@/components/ui";
import { theme } from "@/styles/theme";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemName?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const { texto, status } = theme.semantic;

// ============== STYLED COMPONENTS ==============

const Message = styled.p`
  font-size: 0.9375rem;
  color: ${texto.secundario};
  margin: 0 0 1rem 0;
  line-height: 1.5;
`;

const ItemHighlight = styled.div`
  background: ${status.erro.fundo};
  border: 1px solid ${status.erro.borda};
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;

  strong {
    color: ${status.erro.texto};
    font-weight: 600;
  }
`;

const Warning = styled.p`
  font-size: 0.875rem;
  color: ${status.erro.texto};
  font-weight: 600;
  margin: 0;
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
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onCancel}
    title={title}
    size="sm"
    loading={loading}
    footer={
      <>
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={loading}>
          {loading ? "Deletando..." : "Sim, Deletar"}
        </Button>
      </>
    }
  >
    <Message>{message}</Message>
    {itemName && (
      <ItemHighlight>
        <strong>{itemName}</strong>
      </ItemHighlight>
    )}
    <Warning>Esta ação não pode ser desfeita!</Warning>
  </Modal>
);

export default ConfirmDeleteModal;
