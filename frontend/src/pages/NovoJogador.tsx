import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useDocumentTitle } from "../hooks";
import jogadorService from "../services/jogadorService";
import {
  NivelJogador,
  StatusJogador,
  CriarJogadorDTO,
  GeneroJogador,
} from "../types/jogador";
import Footer from "@/components/Footer";

// ============== STYLED COMPONENTS ==============

const PageContainer = styled.div`
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
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const Subtitle = styled.p`
  color: #6b7280;
  margin: 0;
  font-size: 0.9375rem;

  @media (max-width: 768px) {
    font-size: 0.875rem;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
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
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #f3f4f6;

  @media (min-width: 768px) {
    font-size: 1.25rem;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;

  @media (min-width: 768px) {
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
    @media (min-width: 768px) {
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
  padding: 0.75rem 1rem;
  border: 1px solid ${(props) => (props.$hasError ? "#ef4444" : "#d1d5db")};
  border-radius: 0.5rem;
  font-size: 1rem;
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

  &:disabled {
    background: #f9fafb;
    cursor: not-allowed;
  }
`;

const Select = styled.select<{ $hasError?: boolean }>`
  padding: 0.75rem 1rem;
  border: 1px solid ${(props) => (props.$hasError ? "#ef4444" : "#d1d5db")};
  border-radius: 0.5rem;
  font-size: 1rem;
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

  &:disabled {
    background: #f9fafb;
    cursor: not-allowed;
  }
`;

const Textarea = styled.textarea<{ $hasError?: boolean }>`
  padding: 0.75rem 1rem;
  border: 1px solid ${(props) => (props.$hasError ? "#ef4444" : "#d1d5db")};
  border-radius: 0.5rem;
  font-size: 1rem;
  color: #111827;
  background: white;
  transition: all 0.2s;
  resize: vertical;
  font-family: inherit;

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

  &:disabled {
    background: #f9fafb;
    cursor: not-allowed;
  }
`;

const ErrorText = styled.span`
  font-size: 0.8125rem;
  color: #ef4444;
  font-weight: 500;
`;

const FormHint = styled.small`
  font-size: 0.8125rem;
  color: #6b7280;
`;

const Alert = styled.div<{ $type: "success" | "error" }>`
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
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

const FormActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 1rem;

  @media (min-width: 640px) {
    flex-direction: row;
    justify-content: flex-end;
  }
`;

const Button = styled.button<{ $variant?: "primary" | "secondary" }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  min-height: 48px;

  ${(props) =>
    props.$variant === "secondary"
      ? `
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
    
    &:hover:not(:disabled) {
      background: #f9fafb;
      border-color: #9ca3af;
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
    min-width: 140px;
  }

  @media (min-width: 768px) {
    font-size: 1rem;
    min-height: 52px;
  }
`;

const Spinner = styled.div`
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

// ============== COMPONENTE ==============

const NovoJogador: React.FC = () => {
  useDocumentTitle("Novo Jogador");

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

  const handleChange = (
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
  };

  const applyPhoneMask = (value: string): string => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  const validateForm = (): boolean => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      console.error("Erro ao cadastrar jogador:", error);

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
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <PageContainer>
      <Header>
        <BackButton onClick={handleCancel}>← Voltar</BackButton>
        <Title>Novo Jogador</Title>
        <Subtitle>Cadastre um novo jogador na sua arena</Subtitle>
      </Header>

      <Form onSubmit={handleSubmit}>
        {/* Card: Informações Básicas */}
        <FormCard>
          <CardTitle>Informações Básicas</CardTitle>
          <FormGrid>
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
              {errors.nome && <ErrorText>{errors.nome}</ErrorText>}
            </FormGroup>

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
              {errors.email && <ErrorText>{errors.email}</ErrorText>}
            </FormGroup>

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
              {errors.telefone && <ErrorText>{errors.telefone}</ErrorText>}
            </FormGroup>

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
                <ErrorText>{errors.dataNascimento}</ErrorText>
              )}
            </FormGroup>

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
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
              </Select>
            </FormGroup>
          </FormGrid>
        </FormCard>

        {/* Card: Nível e Status */}
        <FormCard>
          <CardTitle> Nível e Status</CardTitle>
          <FormGrid>
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
              <FormHint>Escolha o nível de habilidade do jogador</FormHint>
            </FormGroup>

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

        {/* Botões de Ação */}
        <FormActions>
          <Button type="button" $variant="secondary" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner />
                Cadastrando...
              </>
            ) : (
              <>Cadastrar Jogador</>
            )}
          </Button>
        </FormActions>
      </Form>
      <Footer></Footer>
    </PageContainer>
  );
};

export default NovoJogador;
