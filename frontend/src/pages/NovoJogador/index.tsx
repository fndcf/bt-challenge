/**
 * Responsabilidade única: Orquestrar componentes da página de novo jogador
 */

import React from "react";
import { Footer } from "@/components/layout/Footer";
import {
  AcoesFormulario,
  CabecalhoPagina,
  Formulario,
  Pagina,
} from "@/components/layout/Pagina";
import { Alert, Button, LoadingOverlay } from "@/components/ui";
import { useDocumentTitle } from "@/hooks";
import { StatusJogador } from "@/types/jogador";
import { InformacoesBasicas } from "./components/InformacoesBasicas";
import { NivelStatus } from "./components/NivelStatus";
import { ObservacoesField } from "./components/ObservacoesField";
import { useNovoJogador } from "./hooks/useNovoJogador";

export const NovoJogador: React.FC = () => {
  useDocumentTitle("Novo Jogador");

  const {
    formData,
    errors,
    loading,
    errorMessage,
    successMessage,
    globalLoading,
    globalLoadingMessage,
    handleChange,
    handleSubmit,
    handleCancel,
    setErrorMessage,
    setSuccessMessage,
  } = useNovoJogador();

  return (
    <Pagina $estreita>
      <CabecalhoPagina
        titulo="Novo Jogador"
        subtitulo="Cadastre um novo jogador na sua arena"
        voltar={{ onClick: handleCancel }}
      />

      <Formulario onSubmit={handleSubmit}>
        <InformacoesBasicas
          nome={formData.nome}
          email={formData.email || ""}
          telefone={formData.telefone || ""}
          dataNascimento={formData.dataNascimento || ""}
          genero={formData.genero}
          errors={errors}
          onChange={handleChange}
        />

        <NivelStatus
          nivel={formData.nivel}
          status={formData.status || StatusJogador.ATIVO}
          onChange={handleChange}
        />

        <ObservacoesField
          observacoes={formData.observacoes || ""}
          onChange={handleChange}
        />

        {successMessage && (
          <Alert variant="success" onClose={() => setSuccessMessage("")}>
            {successMessage}
          </Alert>
        )}

        {errorMessage && (
          <Alert variant="error" onClose={() => setErrorMessage("")}>
            {errorMessage}
          </Alert>
        )}

        <AcoesFormulario>
          <Button type="button" variant="secondary" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            {loading ? "Cadastrando..." : "Cadastrar Jogador"}
          </Button>
        </AcoesFormulario>
      </Formulario>

      <LoadingOverlay isLoading={globalLoading} message={globalLoadingMessage} />

      <Footer />
    </Pagina>
  );
};

export default NovoJogador;
