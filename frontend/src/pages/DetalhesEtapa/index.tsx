/**
 * Responsabilidade única: Orquestrar e renderizar página de detalhes da etapa
 */

import React, { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDetalhesEtapa } from "@/hooks/useDetalhesEtapa";
import { ModalInscricao } from "@/components/etapas/ModalInscricao";
import { ModalFormacaoManualEquipes } from "@/components/etapas/ModalFormacaoManualEquipes";
import { ChavesEtapa } from "@/components/etapas/ChavesEtapa";
import { ChavesReiDaPraia } from "@/components/etapas/ChavesReiDaPraia";
import { ChavesSuperX } from "@/components/etapas/ChavesSuperX";
import { ChavesTeams } from "@/components/etapas/ChavesTeams";
import { ConfirmacaoPerigosa } from "@/components/modals/ConfirmacaoPerigosa";
import { Footer } from "@/components/layout/Footer";
import { LoadingOverlay } from "@/components/ui";
import { getEtapaService } from "@/services";
import { StatusEtapa } from "@/types/etapa";
import logger from "@/utils/logger";

// Componentes extraídos
import { EtapaHeader } from "./components/EtapaHeader";
import { EtapaInfoCards } from "./components/EtapaInfoCards";
import { InscricoesTab } from "./components/InscricoesTab";
import { CabecasTab } from "./components/CabecasTab";
import { ActionsSection } from "./components/ActionsSection";

// Estilos
import * as S from "./DetalhesEtapa.styles";

const DetalhesEtapa: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const etapaService = getEtapaService();
  const tabsRef = useRef<HTMLDivElement>(null);

  // Estado do modal de formação manual
  const [modalFormacaoManualAberto, setModalFormacaoManualAberto] = useState(false);

  // Hook customizado gerencia todo o estado e lógica
  const {
    etapa,
    loading,
    error,
    abaAtiva,
    modalInscricaoAberto,
    modalConfirmacaoAberto,
    isReiDaPraia,
    isSuperX,
    isTeams,
    progresso,
    todasPartidasFinalizadas,
    carregarEtapa,
    handleAbrirInscricoes,
    handleEncerrarInscricoes,
    handleFinalizarEtapa,
    handleCancelarInscricao,
    handleCancelarMultiplosInscricoes,
    handleGerarChaves,
    handleGerarChavesManual,
    handleApagarChaves,
    isFormacaoManual,
    setAbaAtiva,
    setModalInscricaoAberto,
    setModalConfirmacaoAberto,
  } = useDetalhesEtapa(id);

  // Estado de loading para ação de excluir - DEVE VIR ANTES DOS EARLY RETURNS
  const [loadingExcluir, setLoadingExcluir] = React.useState(false);

  // Estado global de loading para operações críticas que bloqueiam toda a tela
  const [globalLoading, setGlobalLoading] = React.useState(false);
  const [globalLoadingMessage, setGlobalLoadingMessage] = React.useState("");

  // Estados de loading e erro
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

  if (error || !etapa) {
    return (
      <S.Container>
        <S.ErrorContainer>
          <S.ErrorText>{error || "Etapa não encontrada"}</S.ErrorText>
          <S.Button $variant="blue" onClick={() => navigate("/admin/etapas")}>
            ← Voltar para etapas
          </S.Button>
        </S.ErrorContainer>
      </S.Container>
    );
  }

  // Handlers
  const handleEditar = () => {
    navigate(`/admin/etapas/${etapa.id}/editar`);
  };

  const handleExcluir = async () => {
    const confirmar = window.confirm(
      `ATENÇÃO: Deseja realmente excluir a etapa "${etapa.nome}"?\n\n` +
        `Esta ação não pode ser desfeita!`
    );

    if (!confirmar) return;

    try {
      setLoadingExcluir(true);
      setGlobalLoading(true);
      setGlobalLoadingMessage("Excluindo etapa...");
      await etapaService.deletar(etapa.id);
      logger.info("Etapa excluída com sucesso", {
        etapaId: etapa.id,
        nome: etapa.nome,
      });
      alert("Etapa excluída com sucesso!");
      navigate("/admin/etapas");
    } catch (err: any) {
      logger.error("Erro ao excluir etapa", { etapaId: etapa.id }, err);
      alert(err.message || "Erro ao excluir etapa");
    } finally {
      setLoadingExcluir(false);
      setGlobalLoading(false);
      setGlobalLoadingMessage("");
    }
  };

  // Wrapper para handleCancelarMultiplosInscricoes com loading global
  const handleCancelarMultiplosInscricoesWithLoading = async (inscricaoIds: string[]) => {
    try {
      setGlobalLoading(true);
      setGlobalLoadingMessage(`Excluindo ${inscricaoIds.length} inscrição(ões)...`);
      await handleCancelarMultiplosInscricoes(inscricaoIds);
    } finally {
      setGlobalLoading(false);
      setGlobalLoadingMessage("");
    }
  };

  // Wrapper para handleAbrirInscricoes com loading global
  const handleAbrirInscricoesWithLoading = async () => {
    try {
      setGlobalLoading(true);
      setGlobalLoadingMessage("Reabrindo inscrições...");
      await handleAbrirInscricoes();
    } finally {
      setGlobalLoading(false);
      setGlobalLoadingMessage("");
    }
  };

  // Wrapper para handleEncerrarInscricoes com loading global
  const handleEncerrarInscricoesWithLoading = async () => {
    try {
      setGlobalLoading(true);
      setGlobalLoadingMessage("Encerrando inscrições...");
      await handleEncerrarInscricoes();
    } finally {
      setGlobalLoading(false);
      setGlobalLoadingMessage("");
    }
  };

  // Wrapper para handleGerarChaves com loading global
  const handleGerarChavesWithLoading = async () => {
    try {
      setGlobalLoading(true);
      setGlobalLoadingMessage("Gerando chaves...");
      // Se é TEAMS com formação manual, abre o modal
      if (isFormacaoManual) {
        setModalFormacaoManualAberto(true);
      } else {
        await handleGerarChaves();
      }
    } finally {
      setGlobalLoading(false);
      setGlobalLoadingMessage("");
    }
  };

  // Wrapper para handleApagarChaves com loading global
  const handleApagarChavesWithLoading = async () => {
    try {
      setGlobalLoading(true);
      setGlobalLoadingMessage("Excluindo chaves...");
      await handleApagarChaves();
    } finally {
      setGlobalLoading(false);
      setGlobalLoadingMessage("");
    }
  };

  // Wrapper para handleFinalizarEtapa com loading global
  const handleFinalizarEtapaWithLoading = async () => {
    try {
      setGlobalLoading(true);
      setGlobalLoadingMessage("Finalizando etapa...");
      await handleFinalizarEtapa();
    } finally {
      setGlobalLoading(false);
      setGlobalLoadingMessage("");
    }
  };

  // Renderização principal
  return (
    <>
      <S.Container>
        {/* Cabeçalho */}
        <EtapaHeader
          etapa={etapa}
          onEditar={handleEditar}
          onExcluir={handleExcluir}
          loadingExcluir={loadingExcluir}
        />

        {/* Cards de Informação */}
        <EtapaInfoCards
          etapa={etapa}
          progresso={progresso}
          isReiDaPraia={isReiDaPraia}
          isSuperX={isSuperX}
          isTeams={isTeams}
        />

        {/* Ações Administrativas */}
        <ActionsSection
          etapa={etapa}
          isReiDaPraia={isReiDaPraia}
          isSuperX={isSuperX}
          isTeams={isTeams}
          todasPartidasFinalizadas={todasPartidasFinalizadas}
          onAbrirInscricoes={handleAbrirInscricoesWithLoading}
          onEncerrarInscricoes={handleEncerrarInscricoesWithLoading}
          onGerarChaves={handleGerarChavesWithLoading}
          onApagarChaves={() => setModalConfirmacaoAberto(true)}
          onFinalizarEtapa={handleFinalizarEtapaWithLoading}
          onVerChaves={() => {
            setAbaAtiva("chaves");
            setTimeout(() => {
              tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
          }}
        />

        {/* Tabs */}
        <S.TabsContainer ref={tabsRef}>
          <S.TabsNav>
            <S.TabsList>
              <S.Tab
                $active={abaAtiva === "inscricoes"}
                onClick={() => setAbaAtiva("inscricoes")}
              >
                Inscrições
                <S.TabBadge>{etapa.totalInscritos}</S.TabBadge>
              </S.Tab>

              {/* Super X e TEAMS não tem cabeças de chave */}
              {!isSuperX && !isTeams && (
                <S.Tab
                  $active={abaAtiva === "cabeças"}
                  onClick={() => setAbaAtiva("cabeças")}
                >
                  Cabeças de Chave
                </S.Tab>
              )}

              {etapa.chavesGeradas && (
                <S.Tab
                  $active={abaAtiva === "chaves"}
                  onClick={() => setAbaAtiva("chaves")}
                >
                  Chaves/Grupos
                  <S.TabBadge>{etapa.qtdGrupos || 0}</S.TabBadge>
                </S.Tab>
              )}
            </S.TabsList>
          </S.TabsNav>

          {/* Conteúdo das Tabs */}
          {abaAtiva === "inscricoes" && (
            <InscricoesTab
              etapa={etapa}
              inscricoes={etapa.inscricoes || []}
              onInscricao={() => setModalInscricaoAberto(true)}
              onCancelar={handleCancelarInscricao}
              onCancelarMultiplos={handleCancelarMultiplosInscricoesWithLoading}
            />
          )}

          {abaAtiva === "cabeças" && !isSuperX && !isTeams && (
            <CabecasTab etapa={etapa} onUpdate={carregarEtapa} />
          )}

          {abaAtiva === "chaves" && etapa.chavesGeradas && (
            <>
              {isTeams ? (
                <ChavesTeams
                  etapaId={etapa.id}
                  varianteTeams={etapa.varianteTeams}
                  etapaFinalizada={etapa.status === StatusEtapa.FINALIZADA}
                  onAtualizar={carregarEtapa}
                />
              ) : isSuperX ? (
                <ChavesSuperX
                  etapaId={etapa.id}
                  varianteSuperX={etapa.varianteSuperX}
                  etapaFinalizada={etapa.status === StatusEtapa.FINALIZADA}
                />
              ) : isReiDaPraia ? (
                <ChavesReiDaPraia
                  etapaId={etapa.id}
                  tipoChaveamento={etapa.tipoChaveamento}
                  etapaFinalizada={etapa.status === StatusEtapa.FINALIZADA}
                />
              ) : (
                <ChavesEtapa
                  etapaId={etapa.id}
                  etapaFinalizada={etapa.status === StatusEtapa.FINALIZADA}
                />
              )}
            </>
          )}
        </S.TabsContainer>
      </S.Container>

      <Footer />

      {/* Modais */}
      {modalInscricaoAberto && (
        <ModalInscricao
          etapaId={etapa.id}
          etapaNome={etapa.nome}
          etapaNivel={etapa.nivel}
          etapaGenero={etapa.genero}
          etapaFormato={etapa.formato}
          maxJogadores={etapa.maxJogadores}
          totalInscritos={etapa.totalInscritos}
          onClose={() => setModalInscricaoAberto(false)}
          onSuccess={async () => {
            await carregarEtapa();
            setModalInscricaoAberto(false);
          }}
        />
      )}

      {modalConfirmacaoAberto && (
        <ConfirmacaoPerigosa
          isOpen={modalConfirmacaoAberto}
          titulo="Excluir Chaves"
          mensagem="Tem certeza que deseja excluir todas as chaves? Esta ação não pode ser desfeita!"
          palavraConfirmacao="EXCLUIR"
          onConfirm={async () => {
            setModalConfirmacaoAberto(false);
            await handleApagarChavesWithLoading();
          }}
          onClose={() => setModalConfirmacaoAberto(false)}
        />
      )}

      {modalFormacaoManualAberto && etapa && (
        <ModalFormacaoManualEquipes
          isOpen={modalFormacaoManualAberto}
          onClose={() => setModalFormacaoManualAberto(false)}
          onConfirm={async (formacoes) => {
            await handleGerarChavesManual(formacoes);
            setModalFormacaoManualAberto(false);
          }}
          inscricoes={etapa.inscricoes || []}
          varianteTeams={etapa.varianteTeams || 4}
          isMisto={etapa.isMisto}
        />
      )}

      {/* Loading Overlay Global - Bloqueia toda a tela */}
      <LoadingOverlay isLoading={globalLoading} message={globalLoadingMessage} />
    </>
  );
};

export default DetalhesEtapa;
