/**
 * NovoJogador/index.tsx
 *
 * Responsabilidade única: Orquestrar componentes da página de novo jogador
 *
 * SOLID aplicado:
 * - SRP: Cada componente tem uma responsabilidade única
 * - OCP: Componentes são extensíveis sem modificação
 * - DIP: Componentes dependem de abstrações (props)
 */

import React from "react";
import { useDocumentTitle } from "@/hooks";
import { StatusJogador } from "@/types/jogador";
import { useNovoJogador } from "./hooks/useNovoJogador";
import { InformacoesBasicas } from "./components/InformacoesBasicas";
import { NivelStatus } from "./components/NivelStatus";
import { ObservacoesField } from "./components/ObservacoesField";
import { Footer } from "@/components/layout/Footer";
import * as S from "./NovoJogador.styles";

export const NovoJogador: React.FC = () => {
  useDocumentTitle("Novo Jogador");

  const {
    formData,
    errors,
    loading,
    errorMessage,
    successMessage,
    handleChange,
    handleSubmit,
    handleCancel,
    setErrorMessage,
    setSuccessMessage,
  } = useNovoJogador();

  return (
    <S.PageContainer>
      <S.Header>
        <S.BackButton onClick={handleCancel}>← Voltar</S.BackButton>
        <S.Title>Novo Jogador</S.Title>
        <S.Subtitle>Cadastre um novo jogador na sua arena</S.Subtitle>
      </S.Header>

      <S.Form onSubmit={handleSubmit}>
        {/* Informações Básicas */}
        <InformacoesBasicas
          nome={formData.nome}
          email={formData.email || ""}
          telefone={formData.telefone || ""}
          dataNascimento={formData.dataNascimento || ""}
          genero={formData.genero}
          errors={errors}
          onChange={handleChange}
        />

        {/* Nível e Status */}
        <NivelStatus
          nivel={formData.nivel}
          status={formData.status || StatusJogador.ATIVO}
          onChange={handleChange}
        />

        {/* Observações */}
        <ObservacoesField
          observacoes={formData.observacoes || ""}
          onChange={handleChange}
        />

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

        {/* Botões de Ação */}
        <S.FormActions>
          <S.Button type="button" $variant="secondary" onClick={handleCancel}>
            Cancelar
          </S.Button>
          <S.Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <S.Spinner />
                Cadastrando...
              </>
            ) : (
              <>Cadastrar Jogador</>
            )}
          </S.Button>
        </S.FormActions>
      </S.Form>
      <Footer />
    </S.PageContainer>
  );
};

export default NovoJogador;
