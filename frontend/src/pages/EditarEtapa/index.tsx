/**
 * Responsabilidade única: Orquestrar componentes da página de edição de etapa
 */

import React, { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import {
  AcoesFormulario,
  CabecalhoPagina,
  CarregandoPagina,
  Formulario,
  Pagina,
} from "@/components/layout/Pagina";
import { Alert, Button, LoadingOverlay } from "@/components/ui";
import { useEditarEtapa } from "./hooks/useEditarEtapa";
import { FormatoDisplay } from "./components/FormatoDisplay";
import { RestricoesList } from "./components/RestricoesList";
import { ConfiguracoesJogadoresEdit } from "./components/ConfiguracoesJogadoresEdit";

// Componentes reutilizados de CriarEtapa
import { InformacoesBasicas } from "../CriarEtapa/components/InformacoesBasicas";
import { ConfiguracoesDatas } from "../CriarEtapa/components/ConfiguracoesDatas";

export const EditarEtapa: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const errorRef = useRef<HTMLDivElement>(null);

  const {
    etapa,
    loading,
    salvando,
    error,
    formData,
    temInscritos,
    chavesGeradas,
    globalLoading,
    globalLoadingMessage,
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

  if (loading) {
    return <CarregandoPagina mensagem="Carregando etapa..." />;
  }

  if (error && !etapa) {
    return (
      <Pagina $estreita>
        <Alert variant="error">{error}</Alert>
        <div>
          <Button variant="outline" onClick={() => navigate("/admin/etapas")}>
            Voltar para etapas
          </Button>
        </div>
      </Pagina>
    );
  }

  if (!etapa) return null;

  const voltar = () => navigate(`/admin/etapas/${id}`);

  const ajudaInscritos = (campo: string) =>
    temInscritos
      ? `Não é possível alterar o ${campo} pois já existem jogadores inscritos`
      : undefined;

  return (
    <Pagina $estreita>
      <CabecalhoPagina
        titulo="Editar Etapa"
        subtitulo="Atualize as informações da etapa"
        voltar={{ onClick: voltar }}
      />

      <RestricoesList
        chavesGeradas={chavesGeradas}
        temInscritos={temInscritos}
      />

      <Formulario onSubmit={handleSubmit}>
        {error && (
          <div ref={errorRef} role="alert">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        {/* Formato (só leitura) + chaveamento e formação das partidas */}
        <FormatoDisplay
          formato={etapa.formato}
          tipoChaveamento={formData.tipoChaveamento}
          chavesGeradas={chavesGeradas}
          onTipoChaveamentoChange={(tipo) =>
            handleChange("tipoChaveamento", tipo)
          }
          varianteSuperX={etapa.varianteSuperX}
          varianteTeams={etapa.varianteTeams}
          tipoFormacaoEquipe={etapa.tipoFormacaoEquipe}
          tipoFormacaoJogos={formData.tipoFormacaoJogos}
          onTipoFormacaoJogosChange={(tipo) =>
            handleChange("tipoFormacaoJogos", tipo)
          }
        />

        <InformacoesBasicas
          nome={formData.nome || ""}
          descricao={formData.descricao || ""}
          genero={formData.genero!}
          nivel={formData.nivel}
          local={formData.local || ""}
          formato={etapa.formato}
          tipoFormacaoEquipe={etapa.tipoFormacaoEquipe}
          tipoFormacaoDupla={etapa.tipoFormacaoDupla}
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
          helperGenero={ajudaInscritos("gênero")}
          helperNivel={ajudaInscritos("nível")}
        />

        <ConfiguracoesDatas
          dataInicio={formData.dataInicio || ""}
          dataFim={formData.dataFim || ""}
          dataRealizacao={formData.dataRealizacao || ""}
          errosDatas={{}} // Não validamos datas no modo edição
          disabled={chavesGeradas}
          onDataInicioChange={(data) => handleChange("dataInicio", data)}
          onDataFimChange={(data) => handleChange("dataFim", data)}
          onDataRealizacaoChange={(data) =>
            handleChange("dataRealizacao", data)
          }
        />

        <ConfiguracoesJogadoresEdit
          maxJogadores={formData.maxJogadores}
          formato={etapa.formato}
          varianteTeams={etapa.varianteTeams}
          chavesGeradas={chavesGeradas}
          temInscritos={temInscritos}
          totalInscritos={etapa.totalInscritos || 0}
          minimoJogadores={calcularMinimoJogadores()}
          contaPontosRanking={formData.contaPontosRanking ?? true}
          darPontosParticipacao={formData.darPontosParticipacao ?? true}
          melhorDe3={formData.melhorDe3 ?? false}
          melhorDe3Eliminatoria={formData.melhorDe3Eliminatoria ?? false}
          onMaxJogadoresChange={(value) => handleChange("maxJogadores", value)}
          onBlur={(value) =>
            handleChange("maxJogadores", ajustarValorJogadores(value))
          }
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
        />

        <AcoesFormulario>
          <Button
            type="button"
            variant="secondary"
            onClick={voltar}
            disabled={salvando}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={salvando || chavesGeradas}>
            {salvando ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </AcoesFormulario>
      </Formulario>

      <LoadingOverlay isLoading={globalLoading} message={globalLoadingMessage} />

      <Footer />
    </Pagina>
  );
};

export default EditarEtapa;
