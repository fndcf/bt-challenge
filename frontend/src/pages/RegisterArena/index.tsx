/**
 * Responsabilidade única: Orquestrar componentes da página de registro de arena
 */

import React from "react";
import { useDocumentTitle } from "@/hooks";
import { useRegisterArena } from "./hooks/useRegisterArena";
import { SlugField } from "./components/SlugField";
import { PasswordFields } from "./components/PasswordFields";
import * as S from "./RegisterArena.styles";

export const RegisterArena: React.FC = () => {
  useDocumentTitle("Registrar Arena");

  const {
    values,
    errors,
    loading,
    errorMessage,
    successMessage,
    checkingSlug,
    slugAvailable,
    handleChange,
    handleSubmit,
  } = useRegisterArena();

  return (
    <S.PageContainer>
      <S.Container>
        <S.Header>
          <h1>Registrar Nova Arena</h1>
          <p>Crie sua arena e comece a organizar torneios</p>
        </S.Header>

        <S.Form onSubmit={handleSubmit}>
          {errorMessage && <S.Alert $type="error">{errorMessage}</S.Alert>}
          {successMessage && (
            <S.Alert $type="success">{successMessage}</S.Alert>
          )}

          {/* Nome da Arena */}
          <S.FormGroup>
            <S.Label htmlFor="nome">
              Nome da Arena <S.Required>*</S.Required>
            </S.Label>
            <S.Input
              type="text"
              id="nome"
              value={values.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
              $hasError={!!errors.nome}
              disabled={loading}
              placeholder="Ex: Arena Azul"
            />
            {errors.nome && <S.ErrorText>{errors.nome}</S.ErrorText>}
          </S.FormGroup>

          {/* Slug - Componente especializado */}
          <SlugField
            value={values.slug}
            error={errors.slug}
            checkingSlug={checkingSlug}
            slugAvailable={slugAvailable}
            disabled={loading}
            onChange={(value) => handleChange("slug", value)}
          />

          {/* Email */}
          <S.FormGroup>
            <S.Label htmlFor="adminEmail">
              Seu Email (Administrador) <S.Required>*</S.Required>
            </S.Label>
            <S.Input
              type="email"
              id="adminEmail"
              value={values.adminEmail}
              onChange={(e) => handleChange("adminEmail", e.target.value)}
              $hasError={!!errors.adminEmail}
              disabled={loading}
              placeholder="seu@email.com"
            />
            {errors.adminEmail && (
              <S.ErrorText>{errors.adminEmail}</S.ErrorText>
            )}
          </S.FormGroup>

          {/* Senha e Confirmação - Componente especializado */}
          <PasswordFields
            password={values.adminPassword}
            confirmPassword={values.confirmPassword}
            passwordError={errors.adminPassword}
            confirmPasswordError={errors.confirmPassword}
            disabled={loading}
            onPasswordChange={(value) => handleChange("adminPassword", value)}
            onConfirmPasswordChange={(value) =>
              handleChange("confirmPassword", value)
            }
          />

          <S.SubmitButton type="submit" disabled={loading}>
            {loading ? <S.Spinner /> : "Criar Arena"}
          </S.SubmitButton>

          <S.FormFooter>
            <p>
              Já tem uma arena?{" "}
              <S.StyledLink to="/login">Fazer login</S.StyledLink>
            </p>
          </S.FormFooter>
        </S.Form>

        <S.BackLinkContainer>
          <S.BackLink to="/">← Voltar para o site</S.BackLink>
        </S.BackLinkContainer>
      </S.Container>
    </S.PageContainer>
  );
};

export default RegisterArena;
