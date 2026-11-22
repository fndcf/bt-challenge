/**
 * Responsabilidade única: Campo de observações do jogador
 */

import React from "react";
import { Cartao, CartaoTitulo } from "@/components/layout/Pagina";
import { Textarea } from "@/components/ui";

export interface ObservacoesFieldProps {
  observacoes: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const ObservacoesField: React.FC<ObservacoesFieldProps> = ({
  observacoes,
  onChange,
}) => (
  <Cartao>
    <CartaoTitulo>Observações</CartaoTitulo>
    <Textarea
      label="Observações (Opcional)"
      id="observacoes"
      name="observacoes"
      value={observacoes}
      onChange={onChange}
      placeholder="Ex: Prefere jogar à noite, canhoto, etc."
      rows={4}
      maxLength={500}
      helperText={`${observacoes?.length || 0}/500 caracteres`}
    />
  </Cartao>
);

export default ObservacoesField;
