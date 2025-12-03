/**
 * RecoveryForm.tsx
 *
 * Responsabilidade única: Formulário de email para recuperação de senha
 */

import React from "react";
import * as S from "../RecuperarSenha.styles";

export interface RecoveryFormProps {
  email: string;
  emailError: string;
  loading: boolean;
  onEmailChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export const RecoveryForm: React.FC<RecoveryFormProps> = ({
  email,
  emailError,
  loading,
  onEmailChange,
  onSubmit,
}) => {
  return (
    <>
      <S.InfoBox>
        <p>
          Digite seu email cadastrado e enviaremos um link para redefinir sua
          senha.
        </p>
      </S.InfoBox>

      <S.Form onSubmit={onSubmit}>
        <S.FormGroup>
          <S.Label htmlFor="email">
            Email <S.Required>*</S.Required>
          </S.Label>
          <S.Input
            type="email"
            id="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            $hasError={!!emailError}
            disabled={loading}
            placeholder="seu@email.com"
            autoComplete="email"
            autoFocus
          />
          {emailError && <S.ErrorText>{emailError}</S.ErrorText>}
        </S.FormGroup>

        <S.SubmitButton type="submit" disabled={loading}>
          {loading ? <S.Spinner /> : "Enviar link de recuperação"}
        </S.SubmitButton>
      </S.Form>
    </>
  );
};

export default RecoveryForm;
