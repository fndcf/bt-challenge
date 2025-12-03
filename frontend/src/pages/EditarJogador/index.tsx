/**
 * EditarJogador/index.tsx
 *
 * Responsabilidade única: Orquestrar componentes da página de editar jogador
 *
 * SOLID aplicado:
 * - SRP: Cada componente tem uma responsabilidade única
 * - OCP: Componentes são extensíveis sem modificação
 * - DIP: Componentes dependem de abstrações (props)
 * - ISP: Reutiliza componentes de NovoJogador sem duplicação
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "@/hooks";
import { StatusJogador, NivelJogador } from "@/types/jogador";
import { useEditarJogador } from "./hooks/useEditarJogador";
import { InformacoesBasicas } from "../NovoJogador/components/InformacoesBasicas";
import { NivelStatus } from "../NovoJogador/components/NivelStatus";
import { ObservacoesField } from "../NovoJogador/components/ObservacoesField";
import Footer from "@/components/Footer";
import * as S from "./EditarJogador.styles";

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

  // Loading inicial
  if (loading) {
    return (
      <S.Container>
        <S.LoadingContainer>
          <S.Spinner $size="large" />
          <S.LoadingMessage>Carregando jogador...</S.LoadingMessage>
        </S.LoadingContainer>
      </S.Container>
    );
  }

  // Jogador não encontrado
  if (!jogador) {
    return (
      <S.Container>
        <S.Alert $type="error">
          <S.AlertContent>Jogador não encontrado</S.AlertContent>
          <S.AlertClose onClick={() => navigate("/admin/jogadores")}>
            ×
          </S.AlertClose>
        </S.Alert>
      </S.Container>
    );
  }

  return (
    <S.Container>
      <S.Header>
        <S.BackButton onClick={handleCancel}>← Voltar</S.BackButton>
        <S.Title>Editar Jogador</S.Title>
        <S.Subtitle>Atualize as informações do jogador</S.Subtitle>
      </S.Header>

      {/* Mensagens */}
      {successMessage && (
        <S.Alert $type="success">
          <S.AlertContent>{successMessage}</S.AlertContent>
          <S.AlertClose onClick={() => setSuccessMessage("")}>×</S.AlertClose>
        </S.Alert>
      )}

      {errorMessage && (
        <S.Alert $type="error">
          <S.AlertContent>{errorMessage}</S.AlertContent>
          <S.AlertClose onClick={() => setErrorMessage("")}>×</S.AlertClose>
        </S.Alert>
      )}

      <S.Form onSubmit={handleSubmit}>
        {/* Informações Básicas - REUTILIZADO de NovoJogador */}
        <InformacoesBasicas
          nome={formData.nome || ""}
          email={formData.email || ""}
          telefone={formData.telefone || ""}
          dataNascimento={formData.dataNascimento || ""}
          genero={formData.genero}
          errors={errors}
          onChange={handleChange}
        />

        {/* Nível e Status - REUTILIZADO de NovoJogador */}
        <NivelStatus
          nivel={formData.nivel || NivelJogador.INICIANTE}
          status={formData.status || StatusJogador.ATIVO}
          onChange={handleChange}
        />

        {/* Observações - REUTILIZADO de NovoJogador */}
        <ObservacoesField
          observacoes={formData.observacoes || ""}
          onChange={handleChange}
        />

        {/* Botões de Ação */}
        <S.FormActions>
          <S.Button type="button" $variant="cancel" onClick={handleCancel}>
            Cancelar
          </S.Button>
          <S.Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <S.Spinner $size="small" />
                Salvando...
              </>
            ) : (
              <>Salvar Alterações</>
            )}
          </S.Button>
        </S.FormActions>
      </S.Form>
      <Footer />
    </S.Container>
  );
};

export default EditarJogador;
