/**
 * Responsabilidade única: Orquestrar componentes da página de recuperação de senha
 */

import React from "react";
import { PaginaAcesso } from "@/components/layout/PaginaAcesso";
import { Alert } from "@/components/ui";
import { useDocumentTitle } from "@/hooks";
import { RecoveryForm } from "./components/RecoveryForm";
import { SuccessView } from "./components/SuccessView";
import { useRecuperarSenha } from "./hooks/useRecuperarSenha";

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
    <PaginaAcesso
      titulo="Dupley"
      subtitulo={emailEnviado ? "Verifique seu email" : "Recuperação de senha"}
      voltar={
        emailEnviado
          ? undefined
          : { para: "/login", rotulo: "← Voltar para o login" }
      }
    >
      {errorMessage && (
        <Alert variant="error" onClose={() => setErrorMessage("")}>
          {errorMessage}
        </Alert>
      )}

      {successMessage && !emailEnviado && (
        <Alert variant="success" onClose={() => setSuccessMessage("")}>
          {successMessage}
        </Alert>
      )}

      {emailEnviado ? (
        <SuccessView email={email} loading={loading} onResend={handleResend} />
      ) : (
        <RecoveryForm
          email={email}
          emailError={emailError}
          loading={loading}
          onEmailChange={handleEmailChange}
          onSubmit={handleSubmit}
        />
      )}
    </PaginaAcesso>
  );
};

export default RecuperarSenha;
