import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useDocumentTitle } from "../hooks";
import LoadingSpinner from "../components/LoadingSpinner";
import Alert from "../components/Alert";
import "./RecuperarSenha.css";

const RecuperarSenha: React.FC = () => {
  useDocumentTitle("Recuperar Senha");

  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  /**
   * Validar email
   */
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

  /**
   * Submeter formulário
   */
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
    <div className="recuperar-senha-page">
      <div className="recuperar-senha-container">
        <div className="recuperar-senha-header">
          <h1>🔐 Recuperar Senha</h1>
          <p>Digite seu email para receber instruções de recuperação</p>
        </div>

        {!emailSent ? (
          <form onSubmit={handleSubmit} className="recuperar-senha-form">
            {errorMessage && (
              <Alert
                type="error"
                message={errorMessage}
                onClose={() => setErrorMessage("")}
              />
            )}

            {successMessage && (
              <Alert
                type="success"
                message={successMessage}
                onClose={() => setSuccessMessage("")}
              />
            )}

            <div className="form-group">
              <label htmlFor="email">
                Email <span className="required">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="seu@email.com"
                autoComplete="email"
                autoFocus
              />
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? (
                <LoadingSpinner size="small" />
              ) : (
                "Enviar Email de Recuperação"
              )}
            </button>

            <div className="recuperar-senha-info">
              <div className="info-icon">ℹ️</div>
              <div className="info-text">
                <strong>Como funciona:</strong>
                <ol>
                  <li>Digite o email cadastrado na sua arena</li>
                  <li>Receba um link de recuperação por email</li>
                  <li>Clique no link para criar uma nova senha</li>
                </ol>
              </div>
            </div>
          </form>
        ) : (
          <div className="success-container">
            <div className="success-icon">✅</div>
            <h2>Email Enviado!</h2>
            <p>Verifique sua caixa de entrada e também a pasta de spam.</p>
            <p className="email-sent">{email}</p>

            <div className="success-actions">
              <button
                onClick={() => {
                  setEmailSent(false);
                  setSuccessMessage("");
                }}
                className="btn-secondary"
              >
                Enviar para Outro Email
              </button>

              <Link to="/login" className="btn-primary">
                Voltar para Login
              </Link>
            </div>

            <div className="help-text">
              <p>Não recebeu o email?</p>
              <ul>
                <li>Verifique a pasta de spam</li>
                <li>Aguarde alguns minutos</li>
                <li>Tente reenviar o email</li>
              </ul>
            </div>
          </div>
        )}

        <div className="recuperar-senha-footer">
          <Link to="/login" className="link-back">
            ← Voltar para Login
          </Link>
          <span className="separator">•</span>
          <Link to="/register" className="link">
            Criar nova arena
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RecuperarSenha;
