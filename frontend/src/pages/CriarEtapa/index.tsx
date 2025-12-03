/**
 * CriarEtapa/index.tsx
 *
 * Responsabilidade única: Orquestrar componentes da página de criação de etapa
 *
 * SOLID aplicado:
 * - SRP: Cada componente tem uma responsabilidade única
 * - OCP: Componentes são extensíveis sem modificação
 * - ISP: Interfaces específicas para cada componente
 * - DIP: Componentes dependem de abstrações (props), não de implementações
 */

import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FormatoEtapa } from "@/types/etapa";
import Footer from "@/components/Footer";
import { useCriarEtapa } from "./hooks/useCriarEtapa";
import { FormatoSelector } from "./components/FormatoSelector";
import { ChaveamentoSelector } from "./components/ChaveamentoSelector";
import { InformacoesBasicas } from "./components/InformacoesBasicas";
import { ConfiguracoesDatas } from "./components/ConfiguracoesDatas";
import { ConfiguracoesJogadores } from "./components/ConfiguracoesJogadores";
import { DistribuicaoPreview } from "./components/DistribuicaoPreview";
import * as S from "./CriarEtapa.styles";

export const CriarEtapa: React.FC = () => {
  const navigate = useNavigate();
  const errorRef = useRef<HTMLDivElement>(null);

  // Hook centralizado com toda a lógica de negócio
  const {
    loading,
    error,
    errosDatas,
    formData,
    infoDuplaFixa,
    infoReiDaPraia,
    infoAtual,
    handleChange,
    handleSubmit,
  } = useCriarEtapa();

  // Scroll para o erro quando ele aparecer
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [error]);

  return (
    <S.Container>
      <S.Header>
        <S.BackButton onClick={() => navigate(-1)}>← Voltar</S.BackButton>
        <S.Title>Criar Nova Etapa</S.Title>
        <S.Subtitle>
          Preencha os dados para criar uma nova etapa do torneio
        </S.Subtitle>
      </S.Header>

      {error && (
        <S.ErrorAlert ref={errorRef}>
          <p>Erro ao criar etapa</p>
          <p>{error}</p>
        </S.ErrorAlert>
      )}

      <S.Form onSubmit={handleSubmit}>
        {/* Seletor de Formato */}
        <FormatoSelector
          formatoAtual={formData.formato}
          onFormatoChange={(formato) => handleChange("formato", formato)}
        />

        {/* Seletor de Chaveamento (apenas para Rei da Praia) */}
        {formData.formato === FormatoEtapa.REI_DA_PRAIA && (
          <ChaveamentoSelector
            tipoChaveamento={formData.tipoChaveamento!}
            onTipoChange={(tipo) => handleChange("tipoChaveamento", tipo)}
          />
        )}

        {/* Informações Básicas */}
        <InformacoesBasicas
          nome={formData.nome}
          descricao={formData.descricao || ""}
          genero={formData.genero}
          nivel={formData.nivel}
          local={formData.local || ""}
          onNomeChange={(nome) => handleChange("nome", nome)}
          onDescricaoChange={(descricao) => handleChange("descricao", descricao)}
          onGeneroChange={(genero) => handleChange("genero", genero)}
          onNivelChange={(nivel) => handleChange("nivel", nivel)}
          onLocalChange={(local) => handleChange("local", local)}
        />

        {/* Configurações de Datas */}
        <ConfiguracoesDatas
          dataInicio={formData.dataInicio}
          dataFim={formData.dataFim}
          dataRealizacao={formData.dataRealizacao}
          errosDatas={errosDatas}
          onDataInicioChange={(data) => handleChange("dataInicio", data)}
          onDataFimChange={(data) => handleChange("dataFim", data)}
          onDataRealizacaoChange={(data) => handleChange("dataRealizacao", data)}
        />

        {/* Configurações de Jogadores */}
        <ConfiguracoesJogadores
          maxJogadores={formData.maxJogadores}
          formato={formData.formato}
          onMaxJogadoresChange={(value) => handleChange("maxJogadores", value)}
        />

        {/* Preview de Distribuição */}
        <DistribuicaoPreview
          formato={formData.formato}
          tipoChaveamento={formData.tipoChaveamento!}
          infoDuplaFixa={infoDuplaFixa}
          infoReiDaPraia={infoReiDaPraia}
        />

        {/* Botões de Ação */}
        <S.ButtonsRow>
          <S.Button
            type="button"
            $variant="secondary"
            onClick={() => navigate(-1)}
          >
            Cancelar
          </S.Button>
          <S.Button
            type="submit"
            $variant="primary"
            disabled={
              loading || !infoAtual.valido || Object.keys(errosDatas).length > 0
            }
          >
            {loading ? "Criando..." : "Criar Etapa"}
          </S.Button>
        </S.ButtonsRow>
      </S.Form>

      <Footer />
    </S.Container>
  );
};

export default CriarEtapa;
