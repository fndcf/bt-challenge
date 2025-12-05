/**
 * Responsabilidade única: Orquestrar componentes da página de recuperação de senha
 */

import React from "react";
import { useDocumentTitle } from "@/hooks";
import { useRecuperarSenha } from "./hooks/useRecuperarSenha";
import { RecoveryForm } from "./components/RecoveryForm";
import { SuccessView } from "./components/SuccessView";
import * as S from "./RecuperarSenha.styles";

export const RecuperarSenha: React.FC = () => {
  useDocumentTitle("Recuperar Senha");

  const {
    email,
    emailError,
    loading,
    errorMessage,
    successMessage,
    emailEnviado,
    handleEmailChange,
    handleSubmit,
    handleResend,
    setErrorMessage,
    setSuccessMessage,
  } = useRecuperarSenha();

  return (
    <S.PageContainer>
      <S.RecoveryContainer>
        <S.Header>
          <S.Logo>Challenge BT</S.Logo>
          <S.HeaderText>
            {emailEnviado ? "Verifique seu email" : "Recuperação de senha"}
          </S.HeaderText>
        </S.Header>

        {/* Mensagens de erro/sucesso */}
        {errorMessage && (
          <S.Alert $variant="error">
            <span>{errorMessage}</span>
            <S.AlertClose onClick={() => setErrorMessage("")}>×</S.AlertClose>
          </S.Alert>
        )}

        {successMessage && !emailEnviado && (
          <S.Alert $variant="success">
            <span>{successMessage}</span>
            <S.AlertClose onClick={() => setSuccessMessage("")}>×</S.AlertClose>
          </S.Alert>
        )}

        {/* Conteúdo condicional */}
        {emailEnviado ? (
          <SuccessView
            email={email}
            loading={loading}
            onResend={handleResend}
          />
        ) : (
          <RecoveryForm
            email={email}
            emailError={emailError}
            loading={loading}
            onEmailChange={handleEmailChange}
            onSubmit={handleSubmit}
          />
        )}

        {/* Link de voltar */}
        {!emailEnviado && (
          <S.BackLinkContainer>
            <S.BackLink to="/login">← Voltar para o login</S.BackLink>
          </S.BackLinkContainer>
        )}
      </S.RecoveryContainer>
    </S.PageContainer>
  );
};

export default RecuperarSenha;
