import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { arenaService } from "../services/arenaService";
import { useForm, useDebounce, useDocumentTitle } from "../hooks";
import LoadingSpinner from "../components/LoadingSpinner";
import "./RegisterArena.css";

interface RegisterArenaForm {
  nome: string;
  slug: string;
  adminEmail: string;
  adminPassword: string;
  confirmPassword: string;
}

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

  // Debounce do slug para verificação
  const debouncedSlug = useDebounce(values.slug, 500);

  /**
   * Auto-gerar slug a partir do nome
   */
  useEffect(() => {
    if (values.nome && !values.slug) {
      const generatedSlug = values.nome
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/[^\w\s-]/g, "") // Remove caracteres especiais
        .replace(/\s+/g, "-") // Substitui espaços por hífens
        .replace(/--+/g, "-") // Remove hífens duplos
        .replace(/^-+|-+$/g, ""); // Remove hífens do início/fim

      handleChange("slug", generatedSlug);
    }
  }, [values.nome]);

  /**
   * Verificar disponibilidade do slug
   */
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
        setSlugAvailable(null);
      }
    };

    checkSlug();
  }, [debouncedSlug]);

  /**
   * Validar formulário
   */
  const validateForm = (): boolean => {
    let isValid = true;

    // Nome
    if (!values.nome || values.nome.trim().length < 3) {
      setFieldError("nome", "Nome deve ter no mínimo 3 caracteres");
      isValid = false;
    }

    // Slug
    if (!values.slug || values.slug.length < 3) {
      setFieldError("slug", "Slug deve ter no mínimo 3 caracteres");
      isValid = false;
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug)) {
      setFieldError(
        "slug",
        "Slug deve conter apenas letras minúsculas, números e hífens"
      );
      isValid = false;
    } else if (!slugAvailable) {
      setFieldError("slug", "Este slug já está em uso");
      isValid = false;
    }

    // Email
    if (!values.adminEmail) {
      setFieldError("adminEmail", "Email é obrigatório");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(values.adminEmail)) {
      setFieldError("adminEmail", "Email inválido");
      isValid = false;
    }

    // Senha
    if (!values.adminPassword) {
      setFieldError("adminPassword", "Senha é obrigatória");
      isValid = false;
    } else if (values.adminPassword.length < 6) {
      setFieldError("adminPassword", "Senha deve ter no mínimo 6 caracteres");
      isValid = false;
    }

    // Confirmar senha
    if (values.adminPassword !== values.confirmPassword) {
      setFieldError("confirmPassword", "As senhas não coincidem");
      isValid = false;
    }

    return isValid;
  };

  /**
   * Submeter formulário
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const result = await arenaService.create({
        nome: values.nome,
        slug: values.slug,
        adminEmail: values.adminEmail,
        adminPassword: values.adminPassword,
      });

      setSuccessMessage(
        `Arena "${result.arena.nome}" criada com sucesso! Você receberá um email de verificação.`
      );

      // Limpar formulário
      reset();
      setSlugAvailable(null);

      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        navigate("/login", {
          state: {
            email: values.adminEmail,
            message: "Arena criada! Faça login para continuar.",
          },
        });
      }, 3000);
    } catch (error: any) {
      setErrorMessage(error.message || "Erro ao criar arena. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-arena-page">
      <div className="register-arena-container">
        <div className="register-arena-header">
          <h1>🎾 Registrar Nova Arena</h1>
          <p>Crie sua arena e comece a organizar torneios</p>
        </div>

        <form onSubmit={handleSubmit} className="register-arena-form">
          {errorMessage && (
            <div className="alert alert-error">{errorMessage}</div>
          )}

          {successMessage && (
            <div className="alert alert-success">{successMessage}</div>
          )}

          {/* Nome da Arena */}
          <div className="form-group">
            <label htmlFor="nome">
              Nome da Arena <span className="required">*</span>
            </label>
            <input
              type="text"
              id="nome"
              value={values.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
              className={errors.nome ? "input-error" : ""}
              disabled={loading}
              placeholder="Ex: Arena Azul Beach Tennis"
            />
            {errors.nome && <span className="error-text">{errors.nome}</span>}
          </div>

          {/* Slug */}
          <div className="form-group">
            <label htmlFor="slug">
              Slug (URL da Arena) <span className="required">*</span>
            </label>
            <div className="slug-input-wrapper">
              <span className="slug-prefix">challengebt.com.br/arena/</span>
              <input
                type="text"
                id="slug"
                value={values.slug}
                onChange={(e) =>
                  handleChange("slug", e.target.value.toLowerCase())
                }
                className={errors.slug ? "input-error" : ""}
                disabled={loading}
                placeholder="arenaazul"
              />
            </div>

            {checkingSlug && (
              <div className="slug-status checking">
                <LoadingSpinner size="small" /> Verificando disponibilidade...
              </div>
            )}

            {!checkingSlug &&
              slugAvailable === true &&
              values.slug.length >= 3 && (
                <div className="slug-status available">✓ Slug disponível!</div>
              )}

            {!checkingSlug && slugAvailable === false && (
              <div className="slug-status unavailable">
                ✗ Slug já está em uso
              </div>
            )}

            {errors.slug && <span className="error-text">{errors.slug}</span>}
            <small className="helper-text">
              Apenas letras minúsculas, números e hífens. Este será o endereço
              da sua arena.
            </small>
          </div>

          {/* Email do Admin */}
          <div className="form-group">
            <label htmlFor="adminEmail">
              Seu Email (Administrador) <span className="required">*</span>
            </label>
            <input
              type="email"
              id="adminEmail"
              value={values.adminEmail}
              onChange={(e) => handleChange("adminEmail", e.target.value)}
              className={errors.adminEmail ? "input-error" : ""}
              disabled={loading}
              placeholder="seu@email.com"
            />
            {errors.adminEmail && (
              <span className="error-text">{errors.adminEmail}</span>
            )}
          </div>

          {/* Senha */}
          <div className="form-group">
            <label htmlFor="adminPassword">
              Senha <span className="required">*</span>
            </label>
            <input
              type="password"
              id="adminPassword"
              value={values.adminPassword}
              onChange={(e) => handleChange("adminPassword", e.target.value)}
              className={errors.adminPassword ? "input-error" : ""}
              disabled={loading}
              placeholder="••••••••"
            />
            {errors.adminPassword && (
              <span className="error-text">{errors.adminPassword}</span>
            )}
            <small className="helper-text">Mínimo de 6 caracteres</small>
          </div>

          {/* Confirmar Senha */}
          <div className="form-group">
            <label htmlFor="confirmPassword">
              Confirmar Senha <span className="required">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={values.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              className={errors.confirmPassword ? "input-error" : ""}
              disabled={loading}
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <span className="error-text">{errors.confirmPassword}</span>
            )}
          </div>

          <button
            type="submit"
            className="btn-submit"
            disabled={loading || !slugAvailable}
          >
            {loading ? <LoadingSpinner size="small" /> : "Criar Arena"}
          </button>

          <div className="register-arena-footer">
            <p>
              Já tem uma arena?{" "}
              <Link to="/login" className="link">
                Fazer login
              </Link>
            </p>
          </div>
        </form>

        <div className="register-arena-back">
          <Link to="/" className="link-back">
            ← Voltar para o site
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterArena;
