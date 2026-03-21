/**
 * Modal para criar uma nova arena
 */

import React, { useState } from "react";
import styled from "styled-components";
import { Modal } from "@/components/ui/Modal";

interface ModalNovaArenaProps {
  isOpen: boolean;
  onClose: () => void;
  onCriar: (nome: string, slug?: string) => Promise<void>;
}

export const ModalNovaArena: React.FC<ModalNovaArenaProps> = ({
  isOpen,
  onClose,
  onCriar,
}) => {
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (nome.trim().length < 3) {
      setError("Nome deve ter no mínimo 3 caracteres");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await onCriar(nome.trim(), slug.trim() || undefined);
      handleClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao criar arena");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNome("");
    setSlug("");
    setError("");
    setLoading(false);
    onClose();
  };

  const footer = (
    <FooterButtons>
      <CancelButton type="button" onClick={handleClose} disabled={loading}>
        Cancelar
      </CancelButton>
      <SubmitButton
        type="submit"
        form="form-nova-arena"
        disabled={loading || nome.trim().length < 3}
      >
        {loading ? "Criando..." : "Criar Arena"}
      </SubmitButton>
    </FooterButtons>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nova Arena"
      size="sm"
      footer={footer}
    >
      <Form id="form-nova-arena" onSubmit={handleSubmit}>
        <Field>
          <Label>Nome da Arena *</Label>
          <Input
            type="text"
            placeholder="Ex: Arena Beach Tennis"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoFocus
            disabled={loading}
          />
          <Hint>Mínimo 3 caracteres</Hint>
        </Field>

        <Field>
          <Label>Slug (opcional)</Label>
          <Input
            type="text"
            placeholder="Ex: arena-beach-tennis"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            disabled={loading}
          />
          <Hint>Será usado na URL pública. Se vazio, será gerado automaticamente.</Hint>
        </Field>

        {error && <ErrorMessage>{error}</ErrorMessage>}
      </Form>
    </Modal>
  );
};

// ============== STYLED COMPONENTS ==============

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  color: #111827;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }

  &:disabled {
    background: #f9fafb;
  }
`;

const Hint = styled.span`
  font-size: 0.75rem;
  color: #9ca3af;
`;

const ErrorMessage = styled.div`
  padding: 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  color: #991b1b;
  font-size: 0.875rem;
`;

const FooterButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  width: 100%;
`;

const CancelButton = styled.button`
  padding: 0.625rem 1.25rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  color: #374151;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #f9fafb;
  }

  &:disabled {
    opacity: 0.5;
  }
`;

const SubmitButton = styled.button`
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 0.375rem;
  background: #2563eb;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #1d4ed8;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default ModalNovaArena;
