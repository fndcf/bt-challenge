/**
 * Responsabilidade única: Orquestrar componentes da página de registro de arena
 */

import React from "react";
import { Formulario } from "@/components/layout/Pagina";
import {
  LinkAcesso,
  PaginaAcesso,
  RodapeAcesso,
} from "@/components/layout/PaginaAcesso";
import { Alert, Button, Input } from "@/components/ui";
import { useDocumentTitle } from "@/hooks";
import { PasswordFields } from "./components/PasswordFields";
import { SlugField } from "./components/SlugField";
import { useRegisterArena } from "./hooks/useRegisterArena";

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
    <PaginaAcesso
      titulo="Registrar Nova Arena"
      subtitulo="Crie sua arena e comece a organizar torneios"
      voltar={{ para: "/", rotulo: "← Voltar para o site" }}
    >
      <Formulario onSubmit={handleSubmit} noValidate>
        {errorMessage && <Alert variant="error">{errorMessage}</Alert>}
        {successMessage && <Alert variant="success">{successMessage}</Alert>}

        <Input
          label="Nome da Arena"
          id="nome"
          required
          fullWidth
          value={values.nome}
          onChange={(e) => handleChange("nome", e.target.value)}
          error={errors.nome}
          disabled={loading}
          placeholder="Ex: Arena Azul"
        />

        <SlugField
          value={values.slug}
          error={errors.slug}
          checkingSlug={checkingSlug}
          slugAvailable={slugAvailable}
          disabled={loading}
          onChange={(value) => handleChange("slug", value)}
        />

        <Input
          label="Seu Email (Administrador)"
          type="email"
          id="adminEmail"
          required
          fullWidth
          value={values.adminEmail}
          onChange={(e) => handleChange("adminEmail", e.target.value)}
          error={errors.adminEmail}
          disabled={loading}
          placeholder="seu@email.com"
        />

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

        <Button type="submit" fullWidth loading={loading}>
          {loading ? "Criando..." : "Criar Arena"}
        </Button>

        <RodapeAcesso>
          <p>
            Já tem uma arena?{" "}
            <LinkAcesso to="/login">Fazer login</LinkAcesso>
          </p>
        </RodapeAcesso>
      </Formulario>
    </PaginaAcesso>
  );
};

export default RegisterArena;
