import React from "react";
import * as S from "../Login.styles";

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
}) => {
  return (
    <>
      {/* Email */}
      <S.FormGroup>
        <S.Label htmlFor="email">
          Email <S.Required>*</S.Required>
        </S.Label>
        <S.Input
          type="email"
          id="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          $hasError={!!errors.email}
          disabled={loading}
          placeholder="seu@email.com"
          autoComplete="email"
        />
        {errors.email && <S.ErrorText>{errors.email}</S.ErrorText>}
      </S.FormGroup>

      {/* Senha */}
      <S.FormGroup>
        <S.Label htmlFor="password">
          Senha <S.Required>*</S.Required>
        </S.Label>
        <S.PasswordWrapper>
          <S.PasswordInput
            type={showPassword ? "text" : "password"}
            id="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            $hasError={!!errors.password}
            disabled={loading}
            placeholder="••••••••"
            autoComplete="current-password"
          />
          <S.TogglePasswordButton
            type="button"
            onClick={onTogglePassword}
            disabled={loading}
            title={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? "👁️" : "👁️‍🗨️"}
          </S.TogglePasswordButton>
        </S.PasswordWrapper>
        {errors.password && <S.ErrorText>{errors.password}</S.ErrorText>}
      </S.FormGroup>
    </>
  );
};

export default LoginForm;
