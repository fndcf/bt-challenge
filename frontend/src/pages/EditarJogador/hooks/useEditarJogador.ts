/**
 * useEditarJogador.ts
 *
 * Responsabilidade única: Gerenciar lógica de negócio da edição de jogador
 *
 * SOLID aplicado:
 * - SRP: Hook único com responsabilidade de gerenciar estado e lógica do formulário
 * - DIP: Depende de abstrações (jogadorService), não de implementações
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getJogadorService } from "@/services";
import {
  AtualizarJogadorDTO,
  Jogador,
  GeneroJogador,
  NivelJogador,
  StatusJogador,
} from "@/types/jogador";

export interface UseEditarJogadorReturn {
  // Estado do jogador
  jogador: Jogador | null;
  loading: boolean;

  // Estado do formulário
  formData: AtualizarJogadorDTO;
  errors: Record<string, string>;

  // Estado da UI
  saving: boolean;
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

export const useEditarJogador = (): UseEditarJogadorReturn => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jogador, setJogador] = useState<Jogador | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState<AtualizarJogadorDTO>({
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

  // ============== CARREGAR JOGADOR ==============

  useEffect(() => {
    const carregarJogador = async () => {
      if (!id) {
        setErrorMessage("ID do jogador não fornecido");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const jogadorService = getJogadorService();
        const data = await jogadorService.buscarPorId(id);

        setJogador(data);

        setFormData({
          nome: data.nome || "",
          email: data.email || "",
          telefone: data.telefone || "",
          dataNascimento: data.dataNascimento || "",
          genero: data.genero,
          nivel: data.nivel,
          status: data.status,
          observacoes: data.observacoes || "",
        });
      } catch (error: any) {
        setErrorMessage(error.message || "Erro ao carregar jogador");
      } finally {
        setLoading(false);
      }
    };

    carregarJogador();
  }, [id]);

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
      const error = validateField(
        key,
        formData[key as keyof AtualizarJogadorDTO]
      );
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

      if (!id) {
        setErrorMessage("ID do jogador não encontrado");
        return;
      }

      try {
        setSaving(true);
        setErrorMessage("");

        // Preparar dados (apenas campos que mudaram)
        const dataToSend: any = {};
        Object.keys(formData).forEach((key) => {
          const typedKey = key as keyof AtualizarJogadorDTO;
          const newValue = formData[typedKey];
          const oldValue = jogador?.[typedKey as keyof Jogador];

          if (
            newValue !== oldValue &&
            newValue !== "" &&
            newValue !== undefined
          ) {
            dataToSend[key] = newValue;
          }
        });

        if (Object.keys(dataToSend).length === 0) {
          setErrorMessage("Nenhuma alteração foi feita");
          setSaving(false);
          return;
        }

        const jogadorService = getJogadorService();
        await jogadorService.atualizar(id, dataToSend);

        setSuccessMessage("Jogador atualizado com sucesso!");

        setTimeout(() => {
          navigate("/admin/jogadores");
        }, 1500);
      } catch (error: any) {
        setErrorMessage(error.message || "Erro ao atualizar jogador");
      } finally {
        setSaving(false);
      }
    },
    [formData, jogador, id, validateForm, navigate]
  );

  const handleCancel = useCallback(() => {
    navigate("/admin/jogadores");
  }, [navigate]);

  return {
    // Estado do jogador
    jogador,
    loading,

    // Estado do formulário
    formData,
    errors,

    // Estado da UI
    saving,
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
