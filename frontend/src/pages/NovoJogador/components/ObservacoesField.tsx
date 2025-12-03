/**
 * ObservacoesField.tsx
 *
 * Responsabilidade única: Campo de observações do jogador
 */

import React from "react";
import * as S from "../NovoJogador.styles";

export interface ObservacoesFieldProps {
  observacoes: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const ObservacoesField: React.FC<ObservacoesFieldProps> = ({
  observacoes,
  onChange,
}) => {
  return (
    <S.Card>
      <S.CardTitle>Observações</S.CardTitle>
      <S.FormGroup $fullWidth>
        <S.Label htmlFor="observacoes">Observações (Opcional)</S.Label>
        <S.Textarea
          id="observacoes"
          name="observacoes"
          value={observacoes}
          onChange={onChange}
          placeholder="Ex: Prefere jogar à noite, canhoto, etc."
          rows={4}
          maxLength={500}
        />
        <S.HelperText>{observacoes?.length || 0}/500 caracteres</S.HelperText>
      </S.FormGroup>
    </S.Card>
  );
};

export default ObservacoesField;
