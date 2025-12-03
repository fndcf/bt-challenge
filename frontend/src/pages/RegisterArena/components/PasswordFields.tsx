/**
 * PasswordFields.tsx
 *
 * Responsabilidade única: Campos de senha e confirmação de senha
 */

import React from "react";
import * as S from "../RegisterArena.styles";

export interface PasswordFieldsProps {
  password: string;
  confirmPassword: string;
  passwordError?: string;
  confirmPasswordError?: string;
  disabled: boolean;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
}

export const PasswordFields: React.FC<PasswordFieldsProps> = ({
  password,
  confirmPassword,
  passwordError,
  confirmPasswordError,
  disabled,
  onPasswordChange,
  onConfirmPasswordChange,
}) => {
  return (
    <>
      {/* Senha */}
      <S.FormGroup>
        <S.Label htmlFor="adminPassword">
          Senha <S.Required>*</S.Required>
        </S.Label>
        <S.Input
          type="password"
          id="adminPassword"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          $hasError={!!passwordError}
          disabled={disabled}
          placeholder="••••••••"
        />
        {passwordError && <S.ErrorText>{passwordError}</S.ErrorText>}
        <S.HelperText>Mínimo de 6 caracteres</S.HelperText>
      </S.FormGroup>

      {/* Confirmar Senha */}
      <S.FormGroup>
        <S.Label htmlFor="confirmPassword">
          Confirmar Senha <S.Required>*</S.Required>
        </S.Label>
        <S.Input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => onConfirmPasswordChange(e.target.value)}
          $hasError={!!confirmPasswordError}
          disabled={disabled}
          placeholder="••••••••"
        />
        {confirmPasswordError && <S.ErrorText>{confirmPasswordError}</S.ErrorText>}
      </S.FormGroup>
    </>
  );
};

export default PasswordFields;
