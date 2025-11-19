import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import styled from "styled-components";
import { arenaService } from "../services/arenaService";
import { useForm, useDebounce, useDocumentTitle } from "../hooks";

// ============== STYLED COMPONENTS ==============

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 1rem;

  @media (min-width: 768px) {
    padding: 3rem 1rem;
  }
`;

const Container = styled.div`
  width: 100%;
  max-width: 600px;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  padding: 2rem;

  @media (min-width: 768px) {
    padding: 3rem;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;

  h1 {
    font-size: 1.75rem;
    font-weight: 800;
    color: #111827;
    margin: 0 0 0.5rem 0;

    @media (min-width: 768px) {
      font-size: 2.25rem;
    }
  }

  p {
    color: #6b7280;
    font-size: 0.875rem;
    margin: 0;

    @media (min-width: 768px) {
      font-size: 1rem;
    }
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

const Required = styled.span`
  color: #ef4444;
`;

const OptionalBadge = styled.span`
  background: #dbeafe;
  color: #1e40af;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
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

const SlugInputWrapper = styled.div`
  display: flex;
  align-items: stretch;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  overflow: hidden;
  transition: all 0.2s;

  &:focus-within {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const SlugPrefix = styled.span`
  background: #f3f4f6;
  color: #6b7280;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  display: flex;
  align-items: center;
  border-right: 1px solid #e5e7eb;

  @media (max-width: 640px) {
    font-size: 0.75rem;
    padding: 0.75rem 0.5rem;
  }
`;

const SlugInput = styled.input<{ $hasError?: boolean }>`
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  font-size: 1rem;
  color: #111827;
  background: white;

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: #9ca3af;
  }

  &:disabled {
    background: #f9fafb;
    cursor: not-allowed;
  }
`;

const SlugStatus = styled.div<{
  $status: "checking" | "available" | "unavailable";
}>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  margin-top: 0.25rem;

  ${(props) => {
    switch (props.$status) {
      case "checking":
        return `color: #6b7280;`;
      case "available":
        return `color: #16a34a;`;
      case "unavailable":
        return `color: #dc2626;`;
    }
  }}
`;

const ErrorText = styled.span`
  font-size: 0.8125rem;
  color: #ef4444;
  font-weight: 500;
`;

const HelperText = styled.small`
  font-size: 0.8125rem;
  color: #6b7280;
`;

const Alert = styled.div<{ $type: "success" | "error" }>`
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;

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

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.875rem 1.5rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 48px;
  margin-top: 0.5rem;

  &:hover:not(:disabled) {
    background: #1d4ed8;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  @media (min-width: 768px) {
    padding: 1rem 1.5rem;
    font-size: 1rem;
    min-height: 52px;
  }
`;

const FormFooter = styled.div`
  text-align: center;
  margin-top: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;

  p {
    color: #6b7280;
    font-size: 0.875rem;
    margin: 0;

    @media (min-width: 768px) {
      font-size: 0.9375rem;
    }
  }
`;

const StyledLink = styled(Link)`
  color: #2563eb;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;

  &:hover {
    color: #1d4ed8;
    text-decoration: underline;
  }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #2563eb;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  margin-top: 1.5rem;
  transition: color 0.2s;

  &:hover {
    color: #1d4ed8;
    text-decoration: underline;
  }

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

const BackLinkContainer = styled.div`
  text-align: center;
  margin-top: 1.5rem;
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

const SmallSpinner = styled.div`
  width: 1rem;
  height: 1rem;
  border: 2px solid #d1d5db;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

// ============== INTERFACES ==============

interface RegisterArenaForm {
  nome: string;
  slug: string;
  adminEmail: string;
  adminPassword: string;
  confirmPassword: string;
}

// ============== COMPONENTE ==============

const RegisterArena: React.FC = () => {
  useDocumentTitle("Registrar Arena");

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

  useEffect(() => {
    const checkSlug = async () => {
      if (debouncedSlug && debouncedSlug.length >= 3) {
        setCheckingSlug(true);
        try {
          const available = await arenaService.checkSlugAvailability(
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

  const validateForm = (): boolean => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

      const result = await arenaService.create(payload);

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
  };

  return (
    <PageContainer>
      <Container>
        <Header>
          <h1>🎾 Registrar Nova Arena</h1>
          <p>Crie sua arena e comece a organizar torneios</p>
        </Header>

        <Form onSubmit={handleSubmit}>
          {errorMessage && <Alert $type="error">{errorMessage}</Alert>}

          {successMessage && <Alert $type="success">{successMessage}</Alert>}

          {/* Nome da Arena */}
          <FormGroup>
            <Label htmlFor="nome">
              Nome da Arena <Required>*</Required>
            </Label>
            <Input
              type="text"
              id="nome"
              value={values.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
              $hasError={!!errors.nome}
              disabled={loading}
              placeholder="Ex: Arena Azul Beach Tennis"
            />
            {errors.nome && <ErrorText>{errors.nome}</ErrorText>}
          </FormGroup>

          {/* Slug */}
          <FormGroup>
            <Label htmlFor="slug">
              Slug (URL da Arena)
              <OptionalBadge>opcional</OptionalBadge>
            </Label>
            <SlugInputWrapper>
              <SlugPrefix>challengebt.com.br/arena/</SlugPrefix>
              <SlugInput
                type="text"
                id="slug"
                value={values.slug}
                onChange={(e) =>
                  handleChange("slug", e.target.value.toLowerCase())
                }
                $hasError={!!errors.slug}
                disabled={loading}
                placeholder="deixe em branco para gerar automaticamente"
              />
            </SlugInputWrapper>

            {checkingSlug && (
              <SlugStatus $status="checking">
                <SmallSpinner /> Verificando disponibilidade...
              </SlugStatus>
            )}

            {!checkingSlug &&
              slugAvailable === true &&
              values.slug.length >= 3 && (
                <SlugStatus $status="available">✓ Slug disponível!</SlugStatus>
              )}

            {!checkingSlug && slugAvailable === false && (
              <SlugStatus $status="unavailable">
                ✗ Slug já está em uso
              </SlugStatus>
            )}

            {errors.slug && <ErrorText>{errors.slug}</ErrorText>}

            <HelperText>
              {values.slug
                ? "Apenas letras minúsculas, números e hífens."
                : "Será gerado automaticamente a partir do nome da arena."}
            </HelperText>
          </FormGroup>

          {/* Email do Admin */}
          <FormGroup>
            <Label htmlFor="adminEmail">
              Seu Email (Administrador) <Required>*</Required>
            </Label>
            <Input
              type="email"
              id="adminEmail"
              value={values.adminEmail}
              onChange={(e) => handleChange("adminEmail", e.target.value)}
              $hasError={!!errors.adminEmail}
              disabled={loading}
              placeholder="seu@email.com"
            />
            {errors.adminEmail && <ErrorText>{errors.adminEmail}</ErrorText>}
          </FormGroup>

          {/* Senha */}
          <FormGroup>
            <Label htmlFor="adminPassword">
              Senha <Required>*</Required>
            </Label>
            <Input
              type="password"
              id="adminPassword"
              value={values.adminPassword}
              onChange={(e) => handleChange("adminPassword", e.target.value)}
              $hasError={!!errors.adminPassword}
              disabled={loading}
              placeholder="••••••••"
            />
            {errors.adminPassword && (
              <ErrorText>{errors.adminPassword}</ErrorText>
            )}
            <HelperText>Mínimo de 6 caracteres</HelperText>
          </FormGroup>

          {/* Confirmar Senha */}
          <FormGroup>
            <Label htmlFor="confirmPassword">
              Confirmar Senha <Required>*</Required>
            </Label>
            <Input
              type="password"
              id="confirmPassword"
              value={values.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              $hasError={!!errors.confirmPassword}
              disabled={loading}
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <ErrorText>{errors.confirmPassword}</ErrorText>
            )}
          </FormGroup>

          <SubmitButton type="submit" disabled={loading}>
            {loading ? <Spinner /> : "Criar Arena"}
          </SubmitButton>

          <FormFooter>
            <p>
              Já tem uma arena? <StyledLink to="/login">Fazer login</StyledLink>
            </p>
          </FormFooter>
        </Form>

        <BackLinkContainer>
          <BackLink to="/">← Voltar para o site</BackLink>
        </BackLinkContainer>
      </Container>
    </PageContainer>
  );
};

export default RegisterArena;
