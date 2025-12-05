/**
 * Responsabilidade única: Orquestrar componentes da página de edição de etapa
 */

import React, { useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { useEditarEtapa } from "./hooks/useEditarEtapa";
import { FormatoDisplay } from "./components/FormatoDisplay";
import { RestricoesList } from "./components/RestricoesList";
import { ConfiguracoesJogadoresEdit } from "./components/ConfiguracoesJogadoresEdit";

// Componentes reutilizados de CriarEtapa
import { InformacoesBasicas } from "../CriarEtapa/components/InformacoesBasicas";
import { ConfiguracoesDatas } from "../CriarEtapa/components/ConfiguracoesDatas";

import * as S from "./EditarEtapa.styles";

export const EditarEtapa: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const errorRef = useRef<HTMLDivElement>(null);

  // Hook centralizado com toda a lógica de negócio
  const {
    etapa,
    loading,
    salvando,
    error,
    formData,
    temInscritos,
    chavesGeradas,
    handleChange,
    handleSubmit,
    calcularMinimoJogadores,
    ajustarValorJogadores,
  } = useEditarEtapa(id);

  // Scroll para o erro quando ele aparecer
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [error]);

  // ============== ESTADOS DE LOADING E ERRO ==============

  if (loading) {
    return (
      <S.LoadingContainer>
        <S.LoadingContent>
          <S.Spinner />
          <S.LoadingText>Carregando etapa...</S.LoadingText>
        </S.LoadingContent>
      </S.LoadingContainer>
    );
  }

  if (error && !etapa) {
    return (
      <S.Container>
        <S.ErrorContainer>
          <S.ErrorText>{error}</S.ErrorText>
          <S.Button
            $variant="primary"
            onClick={() => navigate("/admin/etapas")}
          >
            Voltar para etapas
          </S.Button>
        </S.ErrorContainer>
      </S.Container>
    );
  }

  if (!etapa) return null;

  // ============== RENDER PRINCIPAL ==============

  return (
    <S.Container>
      <S.Header>
        <S.BackButton onClick={() => navigate(`/admin/etapas/${id}`)}>
          ← Voltar
        </S.BackButton>
        <S.Title>Editar Etapa</S.Title>
        <S.Subtitle>Atualize as informações da etapa</S.Subtitle>
      </S.Header>

      {/* Alertas de Restrições */}
      <RestricoesList
        formato={etapa.formato}
        chavesGeradas={chavesGeradas}
        temInscritos={temInscritos}
      />

      <S.Form onSubmit={handleSubmit}>
        {/* Erro de validação */}
        {error && (
          <S.FormError ref={errorRef}>
            <p>{error}</p>
          </S.FormError>
        )}

        <S.FieldsContainer>
          {/* Formato (Read-only) + Chaveamento (Editável) */}
          <FormatoDisplay
            formato={etapa.formato}
            tipoChaveamento={formData.tipoChaveamento}
            chavesGeradas={chavesGeradas}
            onTipoChaveamentoChange={(tipo) =>
              handleChange("tipoChaveamento", tipo)
            }
          />

          {/* Informações Básicas - REUTILIZADO de CriarEtapa */}
          <InformacoesBasicas
            nome={formData.nome || ""}
            descricao={formData.descricao || ""}
            genero={formData.genero!}
            nivel={formData.nivel!}
            local={formData.local || ""}
            disabled={chavesGeradas}
            disabledGenero={chavesGeradas || temInscritos}
            disabledNivel={chavesGeradas || temInscritos}
            onNomeChange={(nome) => handleChange("nome", nome)}
            onDescricaoChange={(descricao) =>
              handleChange("descricao", descricao)
            }
            onGeneroChange={(genero) => handleChange("genero", genero)}
            onNivelChange={(nivel) => handleChange("nivel", nivel)}
            onLocalChange={(local) => handleChange("local", local)}
            helperGenero={
              temInscritos
                ? "Não é possível alterar o gênero pois já existem jogadores inscritos"
                : undefined
            }
            helperNivel={
              temInscritos
                ? "Não é possível alterar o nível pois já existem jogadores inscritos"
                : undefined
            }
          />

          {/* Configurações de Datas - REUTILIZADO de CriarEtapa */}
          <ConfiguracoesDatas
            dataInicio={formData.dataInicio || ""}
            dataFim={formData.dataFim || ""}
            dataRealizacao={formData.dataRealizacao || ""}
            errosDatas={{}} // Não validamos datas no modo edição (pode usar validação se quiser)
            disabled={chavesGeradas}
            onDataInicioChange={(data) => handleChange("dataInicio", data)}
            onDataFimChange={(data) => handleChange("dataFim", data)}
            onDataRealizacaoChange={(data) =>
              handleChange("dataRealizacao", data)
            }
          />

          {/* Configurações de Jogadores - ESPECÍFICO para edição */}
          <ConfiguracoesJogadoresEdit
            maxJogadores={formData.maxJogadores}
            formato={etapa.formato}
            chavesGeradas={chavesGeradas}
            temInscritos={temInscritos}
            totalInscritos={etapa.totalInscritos || 0}
            minimoJogadores={calcularMinimoJogadores()}
            onMaxJogadoresChange={(value) =>
              handleChange("maxJogadores", value)
            }
            onBlur={(value) =>
              handleChange("maxJogadores", ajustarValorJogadores(value))
            }
          />
        </S.FieldsContainer>

        {/* Botões de Ação */}
        <S.ButtonsRow>
          <S.Button
            type="button"
            $variant="secondary"
            onClick={() => navigate(`/admin/etapas/${id}`)}
            disabled={salvando}
          >
            Cancelar
          </S.Button>
          <S.Button
            type="submit"
            $variant="primary"
            disabled={salvando || chavesGeradas}
          >
            {salvando ? "Salvando..." : "Salvar Alterações"}
          </S.Button>
        </S.ButtonsRow>
      </S.Form>

      <Footer />
    </S.Container>
  );
};

export default EditarEtapa;
