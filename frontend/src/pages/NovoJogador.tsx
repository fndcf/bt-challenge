import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "../hooks";
import jogadorService from "../services/jogadorService";
import { NivelJogador, StatusJogador, CriarJogadorDTO } from "../types/jogador";
import LoadingSpinner from "../components/LoadingSpinner";
import Alert from "../components/Alert";
import "./NovoJogador.css";

const NovoJogador: React.FC = () => {
  useDocumentTitle("Novo Jogador");

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Form state
  const [formData, setFormData] = useState<CriarJogadorDTO>({
    nome: "",
    email: "",
    telefone: "",
    dataNascimento: "",
    genero: undefined,
    nivel: NivelJogador.INICIANTE,
    status: StatusJogador.ATIVO,
    observacoes: "",
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      const error = validateField(key, formData[key as keyof CriarJogadorDTO]);
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

    try {
      setLoading(true);
      setErrorMessage("");

      // Limpar campos vazios
      const dataToSend: any = { ...formData };
      Object.keys(dataToSend).forEach((key) => {
        if (dataToSend[key] === "" || dataToSend[key] === undefined) {
          delete dataToSend[key];
        }
      });

      await jogadorService.criar(dataToSend);

      setSuccessMessage("Jogador cadastrado com sucesso!");

      // Redirect após 1.5 segundos
      setTimeout(() => {
        navigate("/admin/jogadores");
      }, 1500);
    } catch (error: any) {
      console.error("Erro ao cadastrar jogador:", error);

      // Extrair mensagem de erro
      let mensagem = "Erro ao cadastrar jogador";

      // Tentar pegar mensagem do erro
      if (error.message) {
        mensagem = error.message;
      }

      // Se for erro de duplicação, adicionar ícone de aviso
      if (mensagem.toLowerCase().includes("já existe")) {
        mensagem = "⚠️ " + mensagem;
      }

      setErrorMessage(mensagem);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancelar e voltar
   */
  const handleCancel = () => {
    navigate("/admin/jogadores");
  };

  return (
    <div className="novo-jogador-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <button className="btn-back" onClick={handleCancel}>
            ← Voltar
          </button>
          <div>
            <h1>➕ Novo Jogador</h1>
            <p>Cadastre um novo jogador na sua arena</p>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <form className="jogador-form" onSubmit={handleSubmit}>
        {/* Card: Informações Básicas */}
        <div className="form-card">
          <h2 className="card-title">📋 Informações Básicas</h2>

          <div className="form-grid">
            {/* Nome */}
            <div className="form-group full-width">
              <label htmlFor="nome">
                Nome Completo <span className="required">*</span>
              </label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Ex: João Silva"
                className={errors.nome ? "error" : ""}
                required
              />
              {errors.nome && (
                <span className="error-message">{errors.nome}</span>
              )}
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="joao@email.com"
                className={errors.email ? "error" : ""}
              />
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>

            {/* Telefone */}
            <div className="form-group">
              <label htmlFor="telefone">Telefone</label>
              <input
                type="tel"
                id="telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
                className={errors.telefone ? "error" : ""}
                maxLength={15}
              />
              {errors.telefone && (
                <span className="error-message">{errors.telefone}</span>
              )}
            </div>

            {/* Data de Nascimento */}
            <div className="form-group">
              <label htmlFor="dataNascimento">Data de Nascimento</label>
              <input
                type="date"
                id="dataNascimento"
                name="dataNascimento"
                value={formData.dataNascimento}
                onChange={handleChange}
                className={errors.dataNascimento ? "error" : ""}
              />
              {errors.dataNascimento && (
                <span className="error-message">{errors.dataNascimento}</span>
              )}
            </div>

            {/* Gênero */}
            <div className="form-group">
              <label htmlFor="genero">Gênero</label>
              <select
                id="genero"
                name="genero"
                value={formData.genero || ""}
                onChange={handleChange}
              >
                <option value="">Selecione...</option>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>
        </div>

        {/* Card: Nível e Status */}
        <div className="form-card">
          <h2 className="card-title">🎯 Nível e Status</h2>

          <div className="form-grid">
            {/* Nível */}
            <div className="form-group">
              <label htmlFor="nivel">
                Nível <span className="required">*</span>
              </label>
              <select
                id="nivel"
                name="nivel"
                value={formData.nivel}
                onChange={handleChange}
                required
              >
                <option value={NivelJogador.INICIANTE}>🌱 Iniciante</option>
                <option value={NivelJogador.INTERMEDIARIO}>
                  ⚡ Intermediário
                </option>
                <option value={NivelJogador.AVANCADO}>🔥 Avançado</option>
                <option value={NivelJogador.PROFISSIONAL}>
                  ⭐ Profissional
                </option>
              </select>
              <small className="form-hint">
                Escolha o nível de habilidade do jogador
              </small>
            </div>

            {/* Status */}
            <div className="form-group">
              <label htmlFor="status">
                Status <span className="required">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value={StatusJogador.ATIVO}>✅ Ativo</option>
                <option value={StatusJogador.INATIVO}>⏸️ Inativo</option>
                <option value={StatusJogador.SUSPENSO}>🚫 Suspenso</option>
              </select>
              <small className="form-hint">Status atual do jogador</small>
            </div>
          </div>
        </div>

        {/* Card: Observações */}
        <div className="form-card">
          <h2 className="card-title">📝 Observações</h2>

          <div className="form-group full-width">
            <label htmlFor="observacoes">Observações (Opcional)</label>
            <textarea
              id="observacoes"
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              placeholder="Ex: Prefere jogar à noite, canhoto, etc."
              rows={4}
              maxLength={500}
            />
            <small className="form-hint">
              {formData.observacoes?.length || 0}/500 caracteres
            </small>
          </div>
        </div>

        {/* Mensagens - Exibidas acima dos botões */}
        {successMessage && (
          <Alert
            type="success"
            message={successMessage}
            onClose={() => setSuccessMessage("")}
          />
        )}

        {errorMessage && (
          <Alert
            type="error"
            message={errorMessage}
            onClose={() => setErrorMessage("")}
          />
        )}

        {/* Botões de Ação */}
        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={handleCancel}>
            Cancelar
          </button>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? (
              <>
                <LoadingSpinner size="small" />
                Cadastrando...
              </>
            ) : (
              <>✅ Cadastrar Jogador</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NovoJogador;
