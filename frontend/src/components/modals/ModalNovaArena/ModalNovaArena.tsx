/**
 * Modal para criar uma nova arena
 */

import React, { useState } from "react";
import { Formulario } from "@/components/layout/Pagina";
import { Alert, Button, Input, Modal } from "@/components/ui";
import { getMensagemErro } from "@/utils/erro";

interface ModalNovaArenaProps {
  isOpen: boolean;
  onClose: () => void;
  onCriar: (nome: string, slug?: string) => Promise<void>;
}

const MINIMO_NOME = 3;

export const ModalNovaArena: React.FC<ModalNovaArenaProps> = ({
  isOpen,
  onClose,
  onCriar,
}) => {
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nomeValido = nome.trim().length >= MINIMO_NOME;

  const handleClose = () => {
    setNome("");
    setSlug("");
    setError("");
    setLoading(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomeValido) {
      setError("Nome deve ter no mínimo 3 caracteres");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await onCriar(nome.trim(), slug.trim() || undefined);
      handleClose();
    } catch (err) {
      setError(getMensagemErro(err, "Erro ao criar arena"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nova Arena"
      size="sm"
      loading={loading}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-nova-arena"
            disabled={!nomeValido}
            loading={loading}
          >
            {loading ? "Criando..." : "Criar Arena"}
          </Button>
        </>
      }
    >
      <Formulario id="form-nova-arena" onSubmit={handleSubmit}>
        <Input
          label="Nome da Arena"
          required
          fullWidth
          placeholder="Ex: Arena Beach Tennis"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          autoFocus
          disabled={loading}
          helperText="Mínimo 3 caracteres"
        />

        <Input
          label="Slug (opcional)"
          fullWidth
          placeholder="Ex: arena-beach-tennis"
          value={slug}
          onChange={(e) =>
            setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
          }
          disabled={loading}
          helperText="Será usado na URL pública. Se vazio, será gerado automaticamente."
        />

        {error && (
          <div role="alert">
            <Alert variant="error">{error}</Alert>
          </div>
        )}
      </Formulario>
    </Modal>
  );
};

export default ModalNovaArena;
