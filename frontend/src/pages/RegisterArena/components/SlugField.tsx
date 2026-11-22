/**
 * Responsabilidade única: Campo de slug com verificação em tempo real
 */

import React from "react";
import { Campos } from "@/components/layout/Pagina";
import { Badge, Input } from "@/components/ui";

export interface SlugFieldProps {
  value: string;
  error?: string;
  checkingSlug: boolean;
  slugAvailable: boolean | null;
  disabled: boolean;
  onChange: (value: string) => void;
}

export const SlugField: React.FC<SlugFieldProps> = ({
  value,
  error,
  checkingSlug,
  slugAvailable,
  disabled,
  onChange,
}) => {
  const renderSituacao = () => {
    if (checkingSlug) return <Badge>Verificando disponibilidade...</Badge>;
    if (slugAvailable === true && value.length >= 3) {
      return <Badge tom="sucesso">✓ Slug disponível!</Badge>;
    }
    if (slugAvailable === false) {
      return <Badge tom="erro">✗ Slug já está em uso</Badge>;
    }
    return null;
  };

  const situacao = renderSituacao();

  return (
    <Campos>
      <Input
        label="Slug (URL da Arena, opcional)"
        id="slug"
        fullWidth
        value={value}
        onChange={(e) => onChange(e.target.value.toLowerCase())}
        error={error}
        disabled={disabled}
        placeholder="Ex: arena-azul"
        helperText={
          value
            ? `challengebt.com.br/arena/${value} — apenas letras minúsculas, números e hífens.`
            : "Será gerado automaticamente a partir do nome da arena."
        }
      />
      {situacao && <div role="status">{situacao}</div>}
    </Campos>
  );
};

export default SlugField;
