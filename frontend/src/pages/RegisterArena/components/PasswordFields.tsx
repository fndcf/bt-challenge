/**
 * Responsabilidade única: Campos de senha e confirmação de senha
 */

import React from "react";
import { Input } from "@/components/ui";

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
}) => (
  <>
    <Input
      label="Senha"
      type="password"
      id="adminPassword"
      required
      fullWidth
      value={password}
      onChange={(e) => onPasswordChange(e.target.value)}
      error={passwordError}
      helperText="Mínimo de 6 caracteres"
      disabled={disabled}
      placeholder="••••••••"
      autoComplete="new-password"
    />

    <Input
      label="Confirmar Senha"
      type="password"
      id="confirmPassword"
      required
      fullWidth
      value={confirmPassword}
      onChange={(e) => onConfirmPasswordChange(e.target.value)}
      error={confirmPasswordError}
      disabled={disabled}
      placeholder="••••••••"
      autoComplete="new-password"
    />
  </>
);

export default PasswordFields;
