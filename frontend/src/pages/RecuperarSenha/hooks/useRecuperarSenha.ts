/**
 * useRecuperarSenha.ts
 *
 * Responsabilidade única: Gerenciar lógica de negócio da recuperação de senha
 *
 * SOLID aplicado:
 * - SRP: Hook único com responsabilidade de gerenciar estado e lógica da recuperação
 * - DIP: Depende de abstrações (AuthContext), não de implementações
 */

import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

export interface UseRecuperarSenhaReturn {
  // Estado do formulário
  email: string;
  emailError: string;

  // Estado da UI
  loading: boolean;
  errorMessage: string;
  successMessage: string;
  emailEnviado: boolean;

  // Funções
  handleEmailChange: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleResend: () => Promise<void>;
  setErrorMessage: (msg: string) => void;
  setSuccessMessage: (msg: string) => void;
}

export const useRecuperarSenha = (): UseRecuperarSenhaReturn => {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [emailEnviado, setEmailEnviado] = useState(false);

  // ============== VALIDAÇÃO ==============

  const validateEmail = useCallback((value: string): boolean => {
    if (!value) {
      setEmailError("Email é obrigatório");
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(value)) {
      setEmailError("Email inválido");
      return false;
    }

    setEmailError("");
    return true;
  }, []);

  // ============== HANDLERS ==============

  const handleEmailChange = useCallback(
    (value: string) => {
      setEmail(value);
      if (emailError) {
        validateEmail(value);
      }
    },
    [emailError, validateEmail]
  );

  const sendRecoveryEmail = useCallback(
    async (emailToSend: string) => {
      try {
        setLoading(true);
        setErrorMessage("");
        setSuccessMessage("");

        await resetPassword(emailToSend);

        setEmailEnviado(true);
        setSuccessMessage(
          "Link de recuperação enviado! Verifique seu email."
        );
      } catch (error: any) {
        setErrorMessage(
          error.message || "Erro ao enviar email de recuperação"
        );
      } finally {
        setLoading(false);
      }
    },
    [resetPassword]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateEmail(email)) {
        return;
      }

      await sendRecoveryEmail(email);
    },
    [email, validateEmail, sendRecoveryEmail]
  );

  const handleResend = useCallback(async () => {
    await sendRecoveryEmail(email);
  }, [email, sendRecoveryEmail]);

  return {
    // Estado do formulário
    email,
    emailError,

    // Estado da UI
    loading,
    errorMessage,
    successMessage,
    emailEnviado,

    // Funções
    handleEmailChange,
    handleSubmit,
    handleResend,
    setErrorMessage,
    setSuccessMessage,
  };
};
