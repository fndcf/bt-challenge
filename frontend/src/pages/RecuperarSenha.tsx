import React, { useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../contexts/AuthContext";
import { useDocumentTitle } from "../hooks";

// ============== STYLED COMPONENTS ==============

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #134e5e 0%, #71b280 100%);
  padding: 1rem;
`;

const Container = styled.div`
  width: 100%;
  max-width: 500px;
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
    font-size: 2rem;
    font-weight: 800;
    color: #111827;
    margin: 0 0 0.5rem 0;

    @media (min-width: 768px) {
      font-size: 2.5rem;
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

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

const Required = styled.span`
  color: #ef4444;
  margin-left: 0.25rem;
`;

const Input = styled.input`
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  color: #111827;
  background: white;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }

  &:disabled {
    background: #f9fafb;
    cursor: not-allowed;
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

const InfoBox = styled.div`
  background: #eff6ff;
  border: 1px solid #dbeafe;
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
`;

const InfoIcon = styled.div`
  font-size: 1.25rem;
  line-height: 1;
  flex-shrink: 0;
`;

const InfoText = styled.div`
  flex: 1;
  font-size: 0.8125rem;
  color: #1e40af;

  strong {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }

  ol {
    margin: 0;
    padding-left: 1.25rem;

    li {
      margin-bottom: 0.25rem;
    }
  }

  @media (min-width: 768px) {
    font-size: 0.875rem;
  }
`;

const SuccessContainer = styled.div`
  text-align: center;
`;

const SuccessIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;

  @media (min-width: 768px) {
    font-size: 5rem;
  }
`;

const SuccessTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;

  @media (min-width: 768px) {
    font-size: 1.875rem;
  }
`;

const SuccessText = styled.p`
  color: #6b7280;
  margin: 0 0 1rem 0;
  font-size: 0.9375rem;

  &.email-sent {
    background: #f3f4f6;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 1.5rem;
  }

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const SuccessActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2rem;

  @media (min-width: 640px) {
    flex-direction: row;
    justify-content: center;
  }
`;

const Button = styled.button<{ $variant?: "primary" | "secondary" }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  border: none;

  ${(props) =>
    props.$variant === "secondary"
      ? `
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
    
    &:hover {
      background: #f9fafb;
      border-color: #9ca3af;
    }
  `
      : `
    background: #2563eb;
    color: white;
    
    &:hover {
      background: #1d4ed8;
    }
  `}

  @media (min-width: 640px) {
    min-width: 140px;
  }
`;

const StyledLink = styled(Link)<{ $variant?: "primary" | "secondary" }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;

  ${(props) =>
    props.$variant === "secondary"
      ? `
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
    
    &:hover {
      background: #f9fafb;
      border-color: #9ca3af;
    }
  `
      : `
    background: #2563eb;
    color: white;
    
    &:hover {
      background: #1d4ed8;
    }
  `}

  @media (min-width: 640px) {
    min-width: 140px;
  }
`;

const HelpBox = styled.div`
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 0.5rem;
  padding: 1rem;
  font-size: 0.8125rem;
  color: #92400e;

  p {
    font-weight: 600;
    margin: 0 0 0.5rem 0;
  }

  ul {
    margin: 0;
    padding-left: 1.25rem;

    li {
      margin-bottom: 0.25rem;
    }
  }

  @media (min-width: 768px) {
    font-size: 0.875rem;
  }
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
  flex-wrap: wrap;
`;

const FooterLink = styled(Link)`
  color: #2563eb;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 0.2s;

  &:hover {
    color: #1d4ed8;
    text-decoration: underline;
  }

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

const Separator = styled.span`
  color: #d1d5db;
  font-size: 0.875rem;
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

const RecuperarSenha: React.FC = () => {
  useDocumentTitle("Recuperar Senha");

  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = (): boolean => {
    if (!email) {
      setErrorMessage("Digite seu email");
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrorMessage("Email inválido");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!validateEmail()) {
      return;
    }

    try {
      setLoading(true);
      await resetPassword(email);
      setSuccessMessage(
        `Email de recuperação enviado para ${email}. Verifique sua caixa de entrada e spam.`
      );
      setEmailSent(true);
      setEmail("");
    } catch (error: any) {
      setErrorMessage(error.message || "Erro ao enviar email de recuperação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <Container>
        <Header>
          <h1>Recuperar Senha</h1>
          <p>Digite seu email para receber instruções de recuperação</p>
        </Header>

        {!emailSent ? (
          <Form onSubmit={handleSubmit}>
            {errorMessage && (
              <Alert $type="error">
                <AlertContent>{errorMessage}</AlertContent>
                <AlertClose onClick={() => setErrorMessage("")}>×</AlertClose>
              </Alert>
            )}

            {successMessage && (
              <Alert $type="success">
                <AlertContent>{successMessage}</AlertContent>
                <AlertClose onClick={() => setSuccessMessage("")}>×</AlertClose>
              </Alert>
            )}

            <FormGroup>
              <Label htmlFor="email">
                Email <Required>*</Required>
              </Label>
              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="seu@email.com"
                autoComplete="email"
                autoFocus
              />
            </FormGroup>

            <SubmitButton type="submit" disabled={loading}>
              {loading ? <Spinner /> : "Enviar Email de Recuperação"}
            </SubmitButton>

            <InfoBox>
              <InfoIcon>ℹ️</InfoIcon>
              <InfoText>
                <strong>Como funciona:</strong>
                <ol>
                  <li>Digite o email cadastrado na sua arena</li>
                  <li>Receba um link de recuperação por email</li>
                  <li>Clique no link para criar uma nova senha</li>
                </ol>
              </InfoText>
            </InfoBox>
          </Form>
        ) : (
          <SuccessContainer>
            <SuccessIcon>✅</SuccessIcon>
            <SuccessTitle>Email Enviado!</SuccessTitle>
            <SuccessText>
              Verifique sua caixa de entrada e também a pasta de spam.
            </SuccessText>
            <SuccessText className="email-sent">{email}</SuccessText>

            <SuccessActions>
              <Button
                $variant="secondary"
                onClick={() => {
                  setEmailSent(false);
                  setSuccessMessage("");
                }}
              >
                Enviar para Outro Email
              </Button>

              <StyledLink to="/login">Voltar para Login</StyledLink>
            </SuccessActions>

            <HelpBox>
              <p>Não recebeu o email?</p>
              <ul>
                <li>Verifique a pasta de spam</li>
                <li>Aguarde alguns minutos</li>
                <li>Tente reenviar o email</li>
              </ul>
            </HelpBox>
          </SuccessContainer>
        )}

        <Footer>
          <FooterLink to="/login">← Voltar para Login</FooterLink>
          <Separator>•</Separator>
          <FooterLink to="/register">Criar nova arena</FooterLink>
        </Footer>
      </Container>
    </PageContainer>
  );
};

export default RecuperarSenha;
