/**
 * Responsabilidade única: Orquestrar componentes da página de login
 */

import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { useDocumentTitle } from "@/hooks";
import { useAuth } from "@/contexts/AuthContext";
import { useLogin } from "./hooks/useLogin";
import { LoginForm } from "./components/LoginForm";
import { theme } from "@/styles/theme";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Formulario } from "@/components/layout/Pagina";
import {
  LinkAcesso,
  PaginaAcesso,
  RodapeAcesso,
} from "@/components/layout/PaginaAcesso";
import { Alert, Button, Checkbox } from "@/components/ui";

// Timeout máximo para verificação de sessão (3 segundos)
const AUTH_CHECK_TIMEOUT = 3000;

const SUBTITULO = "Faça login para acessar o painel administrativo";

const Opcoes = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing[2]};
`;

export const Login: React.FC = () => {
  useDocumentTitle("Login");

  const [searchParams, setSearchParams] = useSearchParams();
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

  // Verificar se há mensagem de erro na URL (ex: após logout forçado)
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setErrorMessage(decodeURIComponent(errorParam));
      // Limpar o parâmetro da URL para não mostrar novamente em refresh
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setErrorMessage, setSearchParams]);

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
      <PaginaAcesso titulo="Acesse sua arena" subtitulo={SUBTITULO}>
        <LoadingSpinner message="Verificando sessão..." />
      </PaginaAcesso>
    );
  }

  return (
    <PaginaAcesso
      titulo="Acesse sua arena"
      subtitulo={SUBTITULO}
      voltar={{ para: "/", rotulo: "← Voltar para o site" }}
    >
      <Formulario onSubmit={handleSubmit} noValidate>
        {errorMessage && (
          <div role="alert">
            <Alert variant="error" onClose={() => setErrorMessage("")}>
              {errorMessage}
            </Alert>
          </div>
        )}

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

        <Opcoes>
          <Checkbox
            label="Lembrar de mim"
            checked={rememberMe}
            onChange={setRememberMe}
            disabled={loading}
          />
          <LinkAcesso to="/recuperar-senha">Esqueceu a senha?</LinkAcesso>
        </Opcoes>

        <Button type="submit" fullWidth loading={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>

        <RodapeAcesso>
          <p>
            Ainda não tem uma arena?{" "}
            <LinkAcesso to="/register">Criar nova arena</LinkAcesso>
          </p>
        </RodapeAcesso>
      </Formulario>
    </PaginaAcesso>
  );
};

export default Login;
