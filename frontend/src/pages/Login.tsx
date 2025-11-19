import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../contexts/AuthContext";
import { useForm, useDocumentTitle } from "../hooks";

// ============== STYLED COMPONENTS ==============

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
`;

const LoginContainer = styled.div`
  width: 100%;
  max-width: 450px;
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
`;

const Logo = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  color: #111827;
  margin: 0 0 0.5rem 0;

  @media (min-width: 768px) {
    font-size: 3rem;
  }
`;

const HeaderText = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

// ============== ALERT ==============

const Alert = styled.div`
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.875rem;
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

const PasswordWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const PasswordInput = styled(Input)`
  padding-right: 3rem;
  flex: 1;
`;

const TogglePasswordButton = styled.button`
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
  opacity: 0.6;
  transition: opacity 0.2s;

  &:hover:not(:disabled) {
    opacity: 1;
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const ErrorText = styled.span`
  font-size: 0.8125rem;
  color: #ef4444;
  font-weight: 500;
`;

// ============== OPTIONS ==============

const FormOptions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: #374151;

  input[type="checkbox"] {
    width: 1rem;
    height: 1rem;
    cursor: pointer;
  }

  &:hover {
    color: #111827;
  }
`;

const ForgotLink = styled(Link)`
  font-size: 0.875rem;
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;

  &:hover {
    color: #1d4ed8;
    text-decoration: underline;
  }
`;

// ============== BUTTON ==============

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.875rem 1.5rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
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
    min-height: 52px;
  }
`;

// ============== FOOTER ==============

const Footer = styled.div`
  text-align: center;
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

const RegisterLink = styled(Link)`
  color: #2563eb;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;

  &:hover {
    color: #1d4ed8;
    text-decoration: underline;
  }
`;

const BackLink = styled.div`
  text-align: center;
  margin-top: 1.5rem;
`;

const BackLinkButton = styled(Link)`
  color: white;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: opacity 0.2s;
  display: inline-block;

  &:hover {
    opacity: 0.8;
    text-decoration: underline;
  }

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

// ============== LOADING ==============

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

// ============== INTERFACES ==============

interface LoginForm {
  email: string;
  password: string;
}

// ============== COMPONENTE ==============

const Login: React.FC = () => {
  useDocumentTitle("Login");

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

  /**
   * ✅ Carregar email salvo do "Lembrar de mim"
   */
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("userEmail");
    const shouldRemember = localStorage.getItem("rememberMe") === "true";

    if (shouldRemember && rememberedEmail) {
      setFieldValue("email", rememberedEmail);
      setRememberMe(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Redirecionar se já estiver autenticado
   */
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const validateForm = (): boolean => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <PageContainer>
      <LoginContainer>
        <Header>
          <Logo>🎾 Challenge BT</Logo>
          <HeaderText>
            Faça login para acessar o painel administrativo
          </HeaderText>
        </Header>

        <Form onSubmit={handleSubmit}>
          {errorMessage && (
            <Alert>
              <span>{errorMessage}</span>
              <AlertClose onClick={() => setErrorMessage("")}>×</AlertClose>
            </Alert>
          )}

          <FormGroup>
            <Label htmlFor="email">
              Email <Required>*</Required>
            </Label>
            <Input
              type="email"
              id="email"
              value={values.email}
              onChange={(e) => handleChange("email", e.target.value)}
              $hasError={!!errors.email}
              disabled={loading}
              placeholder="seu@email.com"
              autoComplete="email"
            />
            {errors.email && <ErrorText>{errors.email}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">
              Senha <Required>*</Required>
            </Label>
            <PasswordWrapper>
              <PasswordInput
                type={showPassword ? "text" : "password"}
                id="password"
                value={values.password}
                onChange={(e) => handleChange("password", e.target.value)}
                $hasError={!!errors.password}
                disabled={loading}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <TogglePasswordButton
                type="button"
                onClick={toggleShowPassword}
                disabled={loading}
                title={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </TogglePasswordButton>
            </PasswordWrapper>
            {errors.password && <ErrorText>{errors.password}</ErrorText>}
          </FormGroup>

          <FormOptions>
            <CheckboxLabel>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <span>Lembrar de mim</span>
            </CheckboxLabel>

            <ForgotLink to="/recuperar-senha">Esqueceu a senha?</ForgotLink>
          </FormOptions>

          <SubmitButton type="submit" disabled={loading}>
            {loading ? <Spinner /> : "Entrar"}
          </SubmitButton>

          <Footer>
            <p>
              Ainda não tem uma arena?{" "}
              <RegisterLink to="/register">Criar nova arena</RegisterLink>
            </p>
          </Footer>
        </Form>

        <BackLink>
          <BackLinkButton to="/">← Voltar para o site</BackLinkButton>
        </BackLink>
      </LoginContainer>
    </PageContainer>
  );
};

export default Login;
