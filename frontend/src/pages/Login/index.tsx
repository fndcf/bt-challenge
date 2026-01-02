/**
 * Responsabilidade única: Orquestrar componentes da página de login
 */

import React, { useState, useEffect } from "react";
import { useDocumentTitle } from "@/hooks";
import { useAuth } from "@/contexts/AuthContext";
import { useLogin } from "./hooks/useLogin";
import { LoginForm } from "./components/LoginForm";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import * as S from "./Login.styles";

// Timeout máximo para verificação de sessão (3 segundos)
const AUTH_CHECK_TIMEOUT = 3000;

export const Login: React.FC = () => {
  useDocumentTitle("Login");

  const { loading: authLoading, isAuthenticated } = useAuth();
  const [authCheckTimedOut, setAuthCheckTimedOut] = useState(false);

  const {
    values,
    errors,
    loading,
    errorMessage,
    rememberMe,
    showPassword,
    handleChange,
    handleSubmit,
    setErrorMessage,
    setRememberMe,
    toggleShowPassword,
  } = useLogin();

  // Timeout para evitar loading infinito
  useEffect(() => {
    const timer = setTimeout(() => {
      if (authLoading) {
        setAuthCheckTimedOut(true);
      }
    }, AUTH_CHECK_TIMEOUT);

    return () => clearTimeout(timer);
  }, [authLoading]);

  // Reset timeout quando loading terminar
  useEffect(() => {
    if (!authLoading) {
      setAuthCheckTimedOut(false);
    }
  }, [authLoading]);

  // Mostra loading apenas se:
  // 1. Está verificando auth E não deu timeout
  // 2. OU já está autenticado (vai redirecionar)
  const shouldShowLoading = (authLoading && !authCheckTimedOut) || (isAuthenticated && !authCheckTimedOut);

  if (shouldShowLoading) {
    return (
      <S.PageContainer>
        <S.LoginContainer>
          <LoadingSpinner message="Verificando sessão..." />
        </S.LoginContainer>
      </S.PageContainer>
    );
  }

  return (
    <S.PageContainer>
      <S.LoginContainer>
        <S.Header>
          <S.Logo>Dupley</S.Logo>
          <S.HeaderText>
            Faça login para acessar o painel administrativo
          </S.HeaderText>
        </S.Header>

        <S.Form onSubmit={handleSubmit}>
          {errorMessage && (
            <S.Alert>
              <span>{errorMessage}</span>
              <S.AlertClose onClick={() => setErrorMessage("")}>×</S.AlertClose>
            </S.Alert>
          )}

          {/* Campos de Login */}
          <LoginForm
            email={values.email}
            password={values.password}
            showPassword={showPassword}
            errors={errors}
            loading={loading}
            onEmailChange={(value) => handleChange("email", value)}
            onPasswordChange={(value) => handleChange("password", value)}
            onTogglePassword={toggleShowPassword}
          />

          {/* Opções */}
          <S.FormOptions>
            <S.CheckboxLabel>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <span>Lembrar de mim</span>
            </S.CheckboxLabel>

            <S.ForgotLink to="/recuperar-senha">Esqueceu a senha?</S.ForgotLink>
          </S.FormOptions>

          {/* Botão de Submit */}
          <S.SubmitButton type="submit" disabled={loading}>
            {loading ? <S.Spinner /> : "Entrar"}
          </S.SubmitButton>

          {/* Footer */}
          <S.Footer>
            <p>
              Ainda não tem uma arena?{" "}
              <S.RegisterLink to="/register">Criar nova arena</S.RegisterLink>
            </p>
          </S.Footer>
        </S.Form>

        <S.BackLinkContainer>
          <S.BackLink to="/">← Voltar para o site</S.BackLink>
        </S.BackLinkContainer>
      </S.LoginContainer>
    </S.PageContainer>
  );
};

export default Login;
