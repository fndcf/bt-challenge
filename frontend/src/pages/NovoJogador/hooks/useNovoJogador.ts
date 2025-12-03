/**
 * useNovoJogador.ts
 *
 * Responsabilidade única: Gerenciar lógica de negócio do cadastro de jogador
 *
 * SOLID aplicado:
 * - SRP: Hook único com responsabilidade de gerenciar estado e lógica do formulário
 * - DIP: Depende de abstrações (jogadorService), não de implementações
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import jogadorService from "@/services/jogadorService";
import {
  CriarJogadorDTO,
  GeneroJogador,
  NivelJogador,
  StatusJogador,
} from "@/types/jogador";

export interface UseNovoJogadorReturn {
  // Estado do formulário
  formData: CriarJogadorDTO;
  errors: Record<string, string>;

  // Estado da UI
  loading: boolean;
  errorMessage: string;
  successMessage: string;

  // Funções
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleCancel: () => void;
  setErrorMessage: (msg: string) => void;
  setSuccessMessage: (msg: string) => void;
}

export const useNovoJogador = (): UseNovoJogadorReturn => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState<CriarJogadorDTO>({
    nome: "",
    email: "",
    telefone: "",
    dataNascimento: "",
    genero: GeneroJogador.MASCULINO,
    nivel: NivelJogador.INICIANTE,
    status: StatusJogador.ATIVO,
    observacoes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ============== MÁSCARA DE TELEFONE ==============

  const applyPhoneMask = (value: string): string => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  // ============== VALIDAÇÃO ==============

  const validateField = useCallback((name: string, value: any): string => {
    switch (name) {
      case "nome":
        if (!value || value.trim().length < 3) {
          return "Nome deve ter no mínimo 3 caracteres";
        }
        if (value.trim().length > 100) {
          return "Nome deve ter no máximo 100 caracteres";
        }
        return "";

      case "email":
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return "Email inválido";
        }
        return "";

      case "telefone":
        if (value && value.replace(/\D/g, "").length < 10) {
          return "Telefone inválido";
        }
        return "";

      case "dataNascimento":
        if (value) {
          const data = new Date(value);
          const hoje = new Date();
          const idade = hoje.getFullYear() - data.getFullYear();
          if (idade < 5 || idade > 120) {
            return "Data de nascimento inválida";
          }
        }
        return "";

      default:
        return "";
    }
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome || formData.nome.trim().length < 3) {
      newErrors.nome = "Nome é obrigatório (mínimo 3 caracteres)";
    }

    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof CriarJogadorDTO]);
      if (error) {
        newErrors[key] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateField]);

  // ============== HANDLERS ==============

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const { name, value } = e.target;

      let finalValue = value;
      if (name === "telefone") {
        finalValue = applyPhoneMask(value);
      }

      setFormData((prev) => ({
        ...prev,
        [name]: finalValue,
      }));

      const error = validateField(name, finalValue);
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    },
    [validateField]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        setErrorMessage("Por favor, corrija os erros no formulário");
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");

        const dataToSend: any = { ...formData };
        Object.keys(dataToSend).forEach((key) => {
          if (dataToSend[key] === "" || dataToSend[key] === undefined) {
            delete dataToSend[key];
          }
        });

        await jogadorService.criar(dataToSend);

        setSuccessMessage("Jogador cadastrado com sucesso!");

        setTimeout(() => {
          navigate("/admin/jogadores");
        }, 1500);
      } catch (error: any) {
        let mensagem = "Erro ao cadastrar jogador";

        if (error.message) {
          mensagem = error.message;
        }

        if (mensagem.toLowerCase().includes("já existe")) {
          mensagem = "⚠️ " + mensagem;
        }

        setErrorMessage(mensagem);
      } finally {
        setLoading(false);
      }
    },
    [formData, validateForm, navigate]
  );

  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return {
    // Estado do formulário
    formData,
    errors,

    // Estado da UI
    loading,
    errorMessage,
    successMessage,

    // Funções
    handleChange,
    handleSubmit,
    handleCancel,
    setErrorMessage,
    setSuccessMessage,
  };
};
