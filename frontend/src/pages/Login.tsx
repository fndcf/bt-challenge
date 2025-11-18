// frontend/src/pages/Login.tsx
// ✅ VERSÃO SIMPLIFICADA (sem receber email do registro)

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useForm, useDocumentTitle } from "../hooks";
import LoadingSpinner from "../components/LoadingSpinner";
import Alert from "../components/Alert";
import "./Login.css";

interface LoginForm {
  email: string;
  password: string;
}

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
   * ✅ SIMPLIFICADO: Apenas carregar email salvo do "Lembrar de mim"
   */
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("userEmail");
    const shouldRemember = localStorage.getItem("rememberMe") === "true";

    if (shouldRemember && rememberedEmail) {
      setFieldValue("email", rememberedEmail);
      setRememberMe(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← Array vazio: roda apenas 1 vez

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
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>🎾 Challenge BT</h1>
          <p>Faça login para acessar o painel administrativo</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {errorMessage && (
            <Alert
              type="error"
              message={errorMessage}
              onClose={() => setErrorMessage("")}
            />
          )}

          <div className="form-group">
            <label htmlFor="email">
              Email <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={values.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className={errors.email ? "input-error" : ""}
              disabled={loading}
              placeholder="seu@email.com"
              autoComplete="email"
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Senha <span className="required">*</span>
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={values.password}
                onChange={(e) => handleChange("password", e.target.value)}
                className={errors.password ? "input-error" : ""}
                disabled={loading}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={toggleShowPassword}
                disabled={loading}
                title={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {errors.password && (
              <span className="error-text">{errors.password}</span>
            )}
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <span>Lembrar de mim</span>
            </label>

            <Link to="/recuperar-senha" className="link-forgot">
              Esqueceu a senha?
            </Link>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? <LoadingSpinner size="small" /> : "Entrar"}
          </button>

          <div className="login-footer">
            <p>
              Ainda não tem uma arena?{" "}
              <Link to="/register" className="link">
                Criar nova arena
              </Link>
            </p>
          </div>
        </form>

        <div className="login-back">
          <Link to="/" className="link-back">
            ← Voltar para o site
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
