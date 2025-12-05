/**
 * Responsabilidade única: Orquestrar componentes da página de login
 */

import React from "react";
import { useDocumentTitle } from "@/hooks";
import { useLogin } from "./hooks/useLogin";
import { LoginForm } from "./components/LoginForm";
import * as S from "./Login.styles";

export const Login: React.FC = () => {
  useDocumentTitle("Login");

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

  return (
    <S.PageContainer>
      <S.LoginContainer>
        <S.Header>
          <S.Logo>Challenge BT</S.Logo>
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
