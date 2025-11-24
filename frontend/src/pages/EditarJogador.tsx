import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import { useDocumentTitle } from "../hooks";
import jogadorService from "../services/jogadorService";
import {
  NivelJogador,
  StatusJogador,
  AtualizarJogadorDTO,
  Jogador,
  GeneroJogador,
} from "../types/jogador";
import Footer from "@/components/Footer";

// ============== STYLED COMPONENTS ==============

const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem;

  @media (min-width: 768px) {
    padding: 1.5rem;
  }

  @media (min-width: 1024px) {
    padding: 2rem;
  }
`;

// ============== HEADER ==============

const Header = styled.div`
  margin-bottom: 2rem;
`;

const BackButton = styled.button`
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  transition: color 0.2s;
  padding: 0;

  &:hover {
    color: #111827;
  }
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.25rem 0;

  @media (min-width: 768px) {
    font-size: 1.875rem;
  }
`;

const Subtitle = styled.p`
  color: #6b7280;
  margin: 0;
  font-size: 0.875rem;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

// ============== ALERT ==============

const Alert = styled.div<{ $type: "success" | "error" }>`
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;

  ${(props) =>
    props.$type === "success"
      ? `
    background: #dcfce7;
    border: 1px solid #bbf7d0;
    color: #166534;
  `
      : `
    background: #fee2e2;
    border: 1px solid #fecaca;
    color: #991b1b;
  `}
`;

const AlertContent = styled.div`
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

const AlertClose = styled.button`
  background: none;
  border: none;
  color: inherit;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  opacity: 0.7;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
`;

// ============== FORM ==============

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;

  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

const CardTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 1.5rem 0;

  @media (min-width: 768px) {
    font-size: 1.25rem;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const FormGroup = styled.div<{ $fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  ${(props) =>
    props.$fullWidth &&
    `
    @media (min-width: 640px) {
      grid-column: 1 / -1;
    }
  `}
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

const Required = styled.span`
  color: #ef4444;
  margin-left: 0.25rem;
`;

const Input = styled.input<{ $hasError?: boolean }>`
  padding: 0.625rem 0.875rem;
  border: 1px solid ${(props) => (props.$hasError ? "#ef4444" : "#d1d5db")};
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  color: #111827;
  background: white;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: ${(props) => (props.$hasError ? "#ef4444" : "#2563eb")};
    box-shadow: 0 0 0 3px
      ${(props) =>
        props.$hasError ? "rgba(239, 68, 68, 0.1)" : "rgba(37, 99, 235, 0.1)"};
  }

  &::placeholder {
    color: #9ca3af;
  }

  @media (min-width: 768px) {
    padding: 0.75rem 1rem;
    font-size: 1rem;
  }
`;

const Select = styled.select<{ $hasError?: boolean }>`
  padding: 0.625rem 0.875rem;
  border: 1px solid ${(props) => (props.$hasError ? "#ef4444" : "#d1d5db")};
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  color: #111827;
  background: white;
  cursor: pointer;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: ${(props) => (props.$hasError ? "#ef4444" : "#2563eb")};
    box-shadow: 0 0 0 3px
      ${(props) =>
        props.$hasError ? "rgba(239, 68, 68, 0.1)" : "rgba(37, 99, 235, 0.1)"};
  }

  @media (min-width: 768px) {
    padding: 0.75rem 1rem;
    font-size: 1rem;
  }
`;

const Textarea = styled.textarea<{ $hasError?: boolean }>`
  padding: 0.625rem 0.875rem;
  border: 1px solid ${(props) => (props.$hasError ? "#ef4444" : "#d1d5db")};
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  color: #111827;
  background: white;
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: ${(props) => (props.$hasError ? "#ef4444" : "#2563eb")};
    box-shadow: 0 0 0 3px
      ${(props) =>
        props.$hasError ? "rgba(239, 68, 68, 0.1)" : "rgba(37, 99, 235, 0.1)"};
  }

  &::placeholder {
    color: #9ca3af;
  }

  @media (min-width: 768px) {
    padding: 0.75rem 1rem;
    font-size: 1rem;
  }
`;

const ErrorMessage = styled.span`
  font-size: 0.8125rem;
  color: #ef4444;
  font-weight: 500;
`;

const FormHint = styled.small`
  font-size: 0.8125rem;
  color: #6b7280;
`;

// ============== ACTIONS ==============

const FormActions = styled.div`
  display: flex;
  flex-direction: column-reverse;
  gap: 0.75rem;
  padding-top: 1rem;

  @media (min-width: 640px) {
    flex-direction: row;
    justify-content: flex-end;
  }
`;

const Button = styled.button<{ $variant?: "primary" | "cancel" }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s;

  ${(props) =>
    props.$variant === "cancel"
      ? `
    background: #f3f4f6;
    color: #374151;
    
    &:hover:not(:disabled) {
      background: #e5e7eb;
    }
  `
      : `
    background: #2563eb;
    color: white;
    
    &:hover:not(:disabled) {
      background: #1d4ed8;
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (min-width: 640px) {
    width: auto;
    min-width: 150px;
  }
`;

// ============== LOADING ==============

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
  gap: 1rem;
`;

const Spinner = styled.div<{ $size?: "small" | "large" }>`
  width: ${(props) => (props.$size === "small" ? "1.25rem" : "3rem")};
  height: ${(props) => (props.$size === "small" ? "1.25rem" : "3rem")};
  border: ${(props) => (props.$size === "small" ? "2px" : "4px")} solid #dbeafe;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingMessage = styled.p`
  color: #6b7280;
  font-size: 0.9375rem;
`;

// ============== COMPONENTE ==============

const EditarJogador: React.FC = () => {
  useDocumentTitle("Editar Jogador");

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jogador, setJogador] = useState<Jogador | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Form state
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

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Carregar dados do jogador
   */
  useEffect(() => {
    const carregarJogador = async () => {
      if (!id) {
        setErrorMessage("ID do jogador não fornecido");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await jogadorService.buscarPorId(id);

        setJogador(data);

        // Preencher formulário com dados existentes
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

  /**
   * Validar campo individual
   */
  const validateField = (name: string, value: any): string => {
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
  };

  /**
   * Handle input change
   */
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Aplicar máscara de telefone
    let finalValue = value;
    if (name === "telefone") {
      finalValue = applyPhoneMask(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));

    // Validar campo
    const error = validateField(name, finalValue);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  /**
   * Máscara de telefone
   */
  const applyPhoneMask = (value: string): string => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  /**
   * Validar formulário completo
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Nome é obrigatório
    if (!formData.nome || formData.nome.trim().length < 3) {
      newErrors.nome = "Nome é obrigatório (mínimo 3 caracteres)";
    }

    // Validar outros campos
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
  };

  /**
   * Submit form
   */
  const handleSubmit = async (e: React.FormEvent) => {
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

        // Incluir apenas se mudou e não está vazio
        if (
          newValue !== oldValue &&
          newValue !== "" &&
          newValue !== undefined
        ) {
          dataToSend[key] = newValue;
        }
      });

      // Se nenhum campo mudou
      if (Object.keys(dataToSend).length === 0) {
        setErrorMessage("Nenhuma alteração foi feita");
        setSaving(false);
        return;
      }

      await jogadorService.atualizar(id, dataToSend);

      setSuccessMessage("Jogador atualizado com sucesso!");

      // Redirect após 1.5 segundos
      setTimeout(() => {
        navigate("/admin/jogadores");
      }, 1500);
    } catch (error: any) {
      setErrorMessage(error.message || "Erro ao atualizar jogador");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Cancelar e voltar
   */
  const handleCancel = () => {
    navigate("/admin/jogadores");
  };

  // Loading inicial
  if (loading) {
    return (
      <Container>
        <LoadingContainer>
          <Spinner $size="large" />
          <LoadingMessage>Carregando jogador...</LoadingMessage>
        </LoadingContainer>
      </Container>
    );
  }

  // Jogador não encontrado
  if (!jogador) {
    return (
      <Container>
        <Alert $type="error">
          <AlertContent>Jogador não encontrado</AlertContent>
          <AlertClose onClick={() => navigate("/admin/jogadores")}>
            ×
          </AlertClose>
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      {/* Header */}

      <Header>
        <BackButton onClick={handleCancel}>← Voltar</BackButton>
        <Title> Editar Jogador</Title>
        <Subtitle>Cadastre um novo jogador na sua arena</Subtitle>
      </Header>

      {/* Mensagens */}
      {successMessage && (
        <Alert $type="success">
          <AlertContent>{successMessage}</AlertContent>
          <AlertClose onClick={() => setSuccessMessage("")}>×</AlertClose>
        </Alert>
      )}

      {errorMessage && (
        <Alert $type="error">
          <AlertContent>{errorMessage}</AlertContent>
          <AlertClose onClick={() => setErrorMessage("")}>×</AlertClose>
        </Alert>
      )}

      {/* Formulário */}
      <Form onSubmit={handleSubmit}>
        {/* Card: Informações Básicas */}
        <FormCard>
          <CardTitle>Informações Básicas</CardTitle>

          <FormGrid>
            {/* Nome */}
            <FormGroup $fullWidth>
              <Label htmlFor="nome">
                Nome Completo <Required>*</Required>
              </Label>
              <Input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Ex: João Silva"
                $hasError={!!errors.nome}
                required
              />
              {errors.nome && <ErrorMessage>{errors.nome}</ErrorMessage>}
            </FormGroup>

            {/* Email */}
            <FormGroup>
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="joao@email.com"
                $hasError={!!errors.email}
              />
              {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
            </FormGroup>

            {/* Telefone */}
            <FormGroup>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                type="tel"
                id="telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
                $hasError={!!errors.telefone}
                maxLength={15}
              />
              {errors.telefone && (
                <ErrorMessage>{errors.telefone}</ErrorMessage>
              )}
            </FormGroup>

            {/* Data de Nascimento */}
            <FormGroup>
              <Label htmlFor="dataNascimento">Data de Nascimento</Label>
              <Input
                type="date"
                id="dataNascimento"
                name="dataNascimento"
                value={formData.dataNascimento}
                onChange={handleChange}
                $hasError={!!errors.dataNascimento}
              />
              {errors.dataNascimento && (
                <ErrorMessage>{errors.dataNascimento}</ErrorMessage>
              )}
            </FormGroup>

            {/* Gênero */}
            <FormGroup>
              <Label htmlFor="genero">
                Gênero <Required>*</Required>
              </Label>
              <Select
                id="genero"
                name="genero"
                value={formData.genero || ""}
                onChange={handleChange}
              >
                <option value={GeneroJogador.MASCULINO}>Masculino</option>
                <option value={GeneroJogador.FEMININO}>Feminino</option>
              </Select>
            </FormGroup>
          </FormGrid>
        </FormCard>

        {/* Card: Nível e Status */}
        <FormCard>
          <CardTitle>Nível e Status</CardTitle>

          <FormGrid>
            {/* Nível */}
            <FormGroup>
              <Label htmlFor="nivel">
                Nível <Required>*</Required>
              </Label>
              <Select
                id="nivel"
                name="nivel"
                value={formData.nivel}
                onChange={handleChange}
                required
              >
                <option value={NivelJogador.INICIANTE}>Iniciante</option>
                <option value={NivelJogador.INTERMEDIARIO}>
                  Intermediário
                </option>
                <option value={NivelJogador.AVANCADO}>Avançado</option>
              </Select>
              <FormHint>Nível de habilidade do jogador</FormHint>
            </FormGroup>

            {/* Status */}
            <FormGroup>
              <Label htmlFor="status">
                Status <Required>*</Required>
              </Label>
              <Select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value={StatusJogador.ATIVO}>Ativo</option>
                <option value={StatusJogador.INATIVO}>Inativo</option>
                <option value={StatusJogador.SUSPENSO}>Suspenso</option>
              </Select>
              <FormHint>Status atual do jogador</FormHint>
            </FormGroup>
          </FormGrid>
        </FormCard>

        {/* Card: Observações */}
        <FormCard>
          <CardTitle>Observações</CardTitle>

          <FormGroup $fullWidth>
            <Label htmlFor="observacoes">Observações (Opcional)</Label>
            <Textarea
              id="observacoes"
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              placeholder="Ex: Prefere jogar à noite, canhoto, etc."
              rows={4}
              maxLength={500}
            />
            <FormHint>
              {formData.observacoes?.length || 0}/500 caracteres
            </FormHint>
          </FormGroup>
        </FormCard>

        {/* Botões de Ação */}
        <FormActions>
          <Button type="button" $variant="cancel" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Spinner $size="small" />
                Salvando...
              </>
            ) : (
              <>Salvar Alterações</>
            )}
          </Button>
        </FormActions>
      </Form>
      <Footer></Footer>
    </Container>
  );
};

export default EditarJogador;
