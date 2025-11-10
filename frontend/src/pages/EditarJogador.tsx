import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDocumentTitle } from "../hooks";
import jogadorService from "../services/jogadorService";
import {
  NivelJogador,
  StatusJogador,
  AtualizarJogadorDTO,
  Jogador,
} from "../types/jogador";
import LoadingSpinner from "../components/LoadingSpinner";
import Alert from "../components/Alert";
import "./EditarJogador.css";

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
    genero: undefined,
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
      <div className="editar-jogador-page">
        <div className="loading-container">
          <LoadingSpinner size="large" message="Carregando jogador..." />
        </div>
      </div>
    );
  }

  // Jogador não encontrado
  if (!jogador) {
    return (
      <div className="editar-jogador-page">
        <Alert
          type="error"
          message="Jogador não encontrado"
          onClose={() => navigate("/admin/jogadores")}
        />
      </div>
    );
  }

  return (
    <div className="editar-jogador-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <button className="btn-back" onClick={handleCancel}>
            ← Voltar
          </button>
          <div>
            <h1>✏️ Editar Jogador</h1>
            <p>Atualize as informações de {jogador.nome}</p>
          </div>
        </div>
      </div>

      {/* Mensagens */}
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
                Nível de habilidade do jogador
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

        {/* Card: Estatísticas (read-only) */}
        {(jogador.vitorias || jogador.derrotas || jogador.pontos) && (
          <div className="form-card stats-card">
            <h2 className="card-title">📊 Estatísticas</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-icon">🏆</span>
                <div className="stat-info">
                  <span className="stat-value">{jogador.vitorias || 0}</span>
                  <span className="stat-label">Vitórias</span>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">❌</span>
                <div className="stat-info">
                  <span className="stat-value">{jogador.derrotas || 0}</span>
                  <span className="stat-label">Derrotas</span>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">⭐</span>
                <div className="stat-info">
                  <span className="stat-value">{jogador.pontos || 0}</span>
                  <span className="stat-label">Pontos</span>
                </div>
              </div>
            </div>
          </div>
        )}

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

        {/* Botões de Ação */}
        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={handleCancel}>
            Cancelar
          </button>
          <button type="submit" className="btn-submit" disabled={saving}>
            {saving ? (
              <>
                <LoadingSpinner size="small" />
                Salvando...
              </>
            ) : (
              <>✅ Salvar Alterações</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditarJogador;
