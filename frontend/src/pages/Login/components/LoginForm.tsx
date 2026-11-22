/**
 * Responsabilidade única: Campos de email e senha do login
 */

import React from "react";
import { Eye, EyeOff } from "lucide-react";
import { IconButton, Input } from "@/components/ui";

export interface LoginFormProps {
  email: string;
  password: string;
  showPassword: boolean;
  errors: Record<string, string>;
  loading: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  email,
  password,
  showPassword,
  errors,
  loading,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
}) => (
  <>
    <Input
      label="Email"
      type="email"
      id="email"
      required
      fullWidth
      value={email}
      onChange={(e) => onEmailChange(e.target.value)}
      error={errors.email}
      disabled={loading}
      placeholder="seu@email.com"
      autoComplete="email"
    />

    <Input
      label="Senha"
      type={showPassword ? "text" : "password"}
      id="password"
      required
      fullWidth
      value={password}
      onChange={(e) => onPasswordChange(e.target.value)}
      error={errors.password}
      disabled={loading}
      placeholder="••••••••"
      autoComplete="current-password"
      acao={
        <IconButton
          rotulo={showPassword ? "Ocultar" : "Mostrar"}
          icone={
            showPassword ? (
              <EyeOff aria-hidden="true" />
            ) : (
              <Eye aria-hidden="true" />
            )
          }
          onClick={onTogglePassword}
          disabled={loading}
        />
      }
    />
  </>
);

export default LoginForm;
