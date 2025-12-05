/**
 * Responsabilidade única: Gerenciar lógica de negócio do login
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "@/hooks";

export interface LoginForm {
  email: string;
  password: string;
}

export interface UseLoginReturn {
  // Estado do formulário
  values: LoginForm;
  errors: Record<string, string>;

  // Estado da UI
  loading: boolean;
  errorMessage: string;
  rememberMe: boolean;
  showPassword: boolean;

  // Funções
  handleChange: (field: keyof LoginForm, value: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  setErrorMessage: (msg: string) => void;
  setRememberMe: (value: boolean) => void;
  toggleShowPassword: () => void;
}

export const useLogin = (): UseLoginReturn => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from = (location.state as any)?.from?.pathname || "/admin";

  const { values, errors, handleChange, setFieldError, setFieldValue } =
    useForm<LoginForm>({
      email: "",
      password: "",
    });

  // ============== CARREGAR EMAIL SALVO ==============

  useEffect(() => {
    const rememberedEmail = localStorage.getItem("userEmail");
    const shouldRemember = localStorage.getItem("rememberMe") === "true";

    if (shouldRemember && rememberedEmail) {
      setFieldValue("email", rememberedEmail);
      setRememberMe(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============== REDIRECIONAR SE JÁ AUTENTICADO ==============

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // ============== VALIDAÇÃO ==============

  const validateForm = useCallback((): boolean => {
    let isValid = true;

    if (!values.email) {
      setFieldError("email", "Email é obrigatório");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      setFieldError("email", "Email inválido");
      isValid = false;
    }

    if (!values.password) {
      setFieldError("password", "Senha é obrigatória");
      isValid = false;
    } else if (values.password.length < 6) {
      setFieldError("password", "Senha deve ter no mínimo 6 caracteres");
      isValid = false;
    }

    return isValid;
  }, [values, setFieldError]);

  // ============== SUBMIT ==============

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMessage("");

      if (!validateForm()) {
        return;
      }

      try {
        setLoading(true);
        await login(values.email, values.password, rememberMe);
        navigate(from, { replace: true });
      } catch (error: any) {
        setErrorMessage(error.message || "Erro ao fazer login");
      } finally {
        setLoading(false);
      }
    },
    [values, rememberMe, validateForm, login, navigate, from]
  );

  // ============== TOGGLE PASSWORD ==============

  const toggleShowPassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return {
    // Estado do formulário
    values,
    errors,

    // Estado da UI
    loading,
    errorMessage,
    rememberMe,
    showPassword,

    // Funções
    handleChange,
    handleSubmit,
    setErrorMessage,
    setRememberMe,
    toggleShowPassword,
  };
};
