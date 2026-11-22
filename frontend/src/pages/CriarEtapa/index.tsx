/**
 * Responsabilidade única: Orquestrar componentes da página de criação de etapa
 */

import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FormatoEtapa } from "@/types/etapa";
import { Footer } from "@/components/layout/Footer";
import { useCriarEtapa } from "./hooks/useCriarEtapa";
import { FormatoSelector } from "./components/FormatoSelector";
import { ChaveamentoSelector } from "./components/ChaveamentoSelector";
import { InformacoesBasicas } from "./components/InformacoesBasicas";
import { ConfiguracoesDatas } from "./components/ConfiguracoesDatas";
import { ConfiguracoesJogadores } from "./components/ConfiguracoesJogadores";
import { DistribuicaoPreview } from "./components/DistribuicaoPreview";
import {
  AcoesFormulario,
  CabecalhoPagina,
  Formulario,
  Pagina,
} from "@/components/layout/Pagina";
import { Alert, Button, LoadingOverlay } from "@/components/ui";

export const CriarEtapa: React.FC = () => {
  const navigate = useNavigate();
  const errorRef = useRef<HTMLDivElement>(null);

  // Hook centralizado com toda a lógica de negócio
  const {
    loading,
    error,
    errosDatas,
    formData,
    globalLoading,
    globalLoadingMessage,
    infoDuplaFixa,
    infoReiDaPraia,
    infoSuperX,
    infoTeams,
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
    <Pagina $estreita>
      <CabecalhoPagina
        titulo="Criar Nova Etapa"
        subtitulo="Preencha os dados para criar uma nova etapa do torneio"
        voltar={{ onClick: () => navigate(-1) }}
      />

      {error && (
        <div ref={errorRef} role="alert">
          <Alert variant="error" title="Erro ao criar etapa">
            {error}
          </Alert>
        </div>
      )}

      <Formulario onSubmit={handleSubmit}>
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
          formato={formData.formato}
          tipoFormacaoEquipe={formData.tipoFormacaoEquipe}
          tipoFormacaoDupla={formData.tipoFormacaoDupla}
          onNomeChange={(nome) => handleChange("nome", nome)}
          onDescricaoChange={(descricao) =>
            handleChange("descricao", descricao)
          }
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
          onDataRealizacaoChange={(data) =>
            handleChange("dataRealizacao", data)
          }
        />

        {/* Configurações de Jogadores */}
        <ConfiguracoesJogadores
          maxJogadores={formData.maxJogadores}
          formato={formData.formato}
          contaPontosRanking={formData.contaPontosRanking ?? true}
          darPontosParticipacao={formData.darPontosParticipacao ?? true}
          melhorDe3={formData.melhorDe3 ?? false}
          melhorDe3Eliminatoria={formData.melhorDe3Eliminatoria ?? false}
          grupoUnico={formData.grupoUnico ?? false}
          varianteSuperX={formData.varianteSuperX}
          varianteTeams={formData.varianteTeams}
          tipoFormacaoEquipe={formData.tipoFormacaoEquipe}
          tipoFormacaoJogos={formData.tipoFormacaoJogos}
          tipoFormacaoDupla={formData.tipoFormacaoDupla}
          onMaxJogadoresChange={(value) => handleChange("maxJogadores", value)}
          onContaPontosRankingChange={(value) =>
            handleChange("contaPontosRanking", value)
          }
          onDarPontosParticipacaoChange={(value) =>
            handleChange("darPontosParticipacao", value)
          }
          onMelhorDe3Change={(value) => handleChange("melhorDe3", value)}
          onMelhorDe3EliminatoriaChange={(value) =>
            handleChange("melhorDe3Eliminatoria", value)
          }
          onGrupoUnicoChange={(value) =>
            handleChange("grupoUnico", value)
          }
          onVarianteSuperXChange={(value) =>
            handleChange("varianteSuperX", value)
          }
          onVarianteTeamsChange={(value) =>
            handleChange("varianteTeams", value)
          }
          onTipoFormacaoEquipeChange={(value) =>
            handleChange("tipoFormacaoEquipe", value)
          }
          onTipoFormacaoJogosChange={(value) =>
            handleChange("tipoFormacaoJogos", value)
          }
          onTipoFormacaoDuplaChange={(value) =>
            handleChange("tipoFormacaoDupla", value)
          }
        />

        {/* Preview de Distribuição */}
        <DistribuicaoPreview
          formato={formData.formato}
          tipoChaveamento={formData.tipoChaveamento!}
          infoDuplaFixa={infoDuplaFixa}
          infoReiDaPraia={infoReiDaPraia}
          infoSuperX={infoSuperX}
          infoTeams={infoTeams}
        />

        {/* Botões de Ação */}
        <AcoesFormulario>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(-1)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={
              loading || !infoAtual.valido || Object.keys(errosDatas).length > 0
            }
          >
            {loading ? "Criando..." : "Criar Etapa"}
          </Button>
        </AcoesFormulario>
      </Formulario>

      <LoadingOverlay isLoading={globalLoading} message={globalLoadingMessage} />

      <Footer />
    </Pagina>
  );
};

export default CriarEtapa;
