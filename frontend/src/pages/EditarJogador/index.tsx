/**
 * Responsabilidade única: Orquestrar componentes da página de editar jogador
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import {
  AcoesFormulario,
  CabecalhoPagina,
  CarregandoPagina,
  Formulario,
  Pagina,
} from "@/components/layout/Pagina";
import { Alert, Button } from "@/components/ui";
import { useDocumentTitle } from "@/hooks";
import { GeneroJogador, NivelJogador, StatusJogador } from "@/types/jogador";
import { InformacoesBasicas } from "../NovoJogador/components/InformacoesBasicas";
import { NivelStatus } from "../NovoJogador/components/NivelStatus";
import { ObservacoesField } from "../NovoJogador/components/ObservacoesField";
import { useEditarJogador } from "./hooks/useEditarJogador";

export const EditarJogador: React.FC = () => {
  useDocumentTitle("Editar Jogador");
  const navigate = useNavigate();

  const {
    jogador,
    loading,
    formData,
    errors,
    saving,
    errorMessage,
    successMessage,
    handleChange,
    handleSubmit,
    handleCancel,
    setErrorMessage,
    setSuccessMessage,
  } = useEditarJogador();

  if (loading) {
    return <CarregandoPagina mensagem="Carregando jogador..." />;
  }

  if (!jogador) {
    return (
      <Pagina $estreita>
        <Alert variant="error">Jogador não encontrado</Alert>
        <div>
          <Button
            variant="outline"
            onClick={() => navigate("/admin/jogadores")}
          >
            ← Voltar para jogadores
          </Button>
        </div>
      </Pagina>
    );
  }

  return (
    <Pagina $estreita>
      <CabecalhoPagina
        titulo="Editar Jogador"
        subtitulo="Atualize as informações do jogador"
        voltar={{ onClick: handleCancel }}
      />

      <Formulario onSubmit={handleSubmit}>
        <InformacoesBasicas
          nome={formData.nome || ""}
          email={formData.email || ""}
          telefone={formData.telefone || ""}
          dataNascimento={formData.dataNascimento || ""}
          genero={formData.genero || GeneroJogador.MASCULINO}
          errors={errors}
          onChange={handleChange}
        />

        <NivelStatus
          nivel={formData.nivel || NivelJogador.INICIANTE}
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
          <Button type="submit" loading={saving}>
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </AcoesFormulario>
      </Formulario>

      <Footer />
    </Pagina>
  );
};

export default EditarJogador;
