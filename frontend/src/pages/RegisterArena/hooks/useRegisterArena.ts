/**
 * useRegisterArena.ts
 *
 * Responsabilidade única: Gerenciar lógica de negócio do registro de arena
 *
 * SOLID aplicado:
 * - SRP: Hook único com responsabilidade de gerenciar estado e lógica do formulário
 * - DIP: Depende de abstrações (arenaAdminService), não de implementações
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { arenaAdminService } from "@/services/arenaAdminService";
import { useForm, useDebounce } from "@/hooks";

export interface RegisterArenaForm {
  nome: string;
  slug: string;
  adminEmail: string;
  adminPassword: string;
  confirmPassword: string;
}

export interface UseRegisterArenaReturn {
  // Estado do formulário
  values: RegisterArenaForm;
  errors: Record<string, string>;

  // Estado da UI
  loading: boolean;
  errorMessage: string;
  successMessage: string;

  // Estado do Slug
  checkingSlug: boolean;
  slugAvailable: boolean | null;

  // Funções
  handleChange: (field: keyof RegisterArenaForm, value: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export const useRegisterArena = (): UseRegisterArenaReturn => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  const { values, errors, handleChange, setFieldError, reset } =
    useForm<RegisterArenaForm>({
      nome: "",
      slug: "",
      adminEmail: "",
      adminPassword: "",
      confirmPassword: "",
    });

  const debouncedSlug = useDebounce(values.slug, 500);

  // ============== VERIFICAÇÃO DE SLUG ==============

  useEffect(() => {
    const checkSlug = async () => {
      if (debouncedSlug && debouncedSlug.length >= 3) {
        setCheckingSlug(true);
        try {
          const available = await arenaAdminService.verificarSlugDisponivel(
            debouncedSlug
          );
          setSlugAvailable(available);
        } catch (error) {
          setSlugAvailable(null);
        } finally {
          setCheckingSlug(false);
        }
      } else {
        setSlugAvailable(debouncedSlug === "" ? true : null);
      }
    };

    checkSlug();
  }, [debouncedSlug]);

  // ============== VALIDAÇÃO ==============

  const validateForm = useCallback((): boolean => {
    let isValid = true;

    if (!values.nome || values.nome.trim().length < 3) {
      setFieldError("nome", "Nome deve ter no mínimo 3 caracteres");
      isValid = false;
    }

    if (values.slug) {
      if (values.slug.length < 3) {
        setFieldError("slug", "Slug deve ter no mínimo 3 caracteres");
        isValid = false;
      } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug)) {
        setFieldError(
          "slug",
          "Slug deve conter apenas letras minúsculas, números e hífens"
        );
        isValid = false;
      } else if (slugAvailable === false) {
        setFieldError("slug", "Este slug já está em uso");
        isValid = false;
      }
    }

    if (!values.adminEmail) {
      setFieldError("adminEmail", "Email é obrigatório");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(values.adminEmail)) {
      setFieldError("adminEmail", "Email inválido");
      isValid = false;
    }

    if (!values.adminPassword) {
      setFieldError("adminPassword", "Senha é obrigatória");
      isValid = false;
    } else if (values.adminPassword.length < 6) {
      setFieldError("adminPassword", "Senha deve ter no mínimo 6 caracteres");
      isValid = false;
    }

    if (values.adminPassword !== values.confirmPassword) {
      setFieldError("confirmPassword", "As senhas não coincidem");
      isValid = false;
    }

    return isValid;
  }, [values, slugAvailable, setFieldError]);

  // ============== SUBMIT ==============

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMessage("");
      setSuccessMessage("");

      if (!validateForm()) {
        return;
      }

      try {
        setLoading(true);

        const payload: any = {
          nome: values.nome,
          adminEmail: values.adminEmail,
          adminPassword: values.adminPassword,
        };

        if (values.slug && values.slug.trim()) {
          payload.slug = values.slug;
        }

        const result = await arenaAdminService.criar(payload);

        setSuccessMessage(
          `Arena "${result.arena.nome}" criada com sucesso! Slug: ${result.arena.slug}. Redirecionando para login...`
        );

        reset();
        setSlugAvailable(null);

        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } catch (error: any) {
        setErrorMessage(error.message || "Erro ao criar arena. Tente novamente.");
      } finally {
        setLoading(false);
      }
    },
    [values, validateForm, reset, navigate]
  );

  return {
    // Estado do formulário
    values,
    errors,

    // Estado da UI
    loading,
    errorMessage,
    successMessage,

    // Estado do Slug
    checkingSlug,
    slugAvailable,

    // Funções
    handleChange,
    handleSubmit,
  };
};
