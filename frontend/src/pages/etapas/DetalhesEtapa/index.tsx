/**
 * DetalhesEtapa - REFATORADO COM SOLID
 *
 * Responsabilidade única: Orquestrar e renderizar página de detalhes da etapa
 *
 * Antes: 1,765 linhas
 * Depois: ~250 linhas
 *
 * Princípios SOLID aplicados:
 * - SRP: Componente apenas renderiza, lógica delegada para hooks/componentes
 * - OCP: Extensível via props e componentes filhos
 * - DIP: Depende de abstrações (hooks, services)
 */

import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDetalhesEtapa } from "@/hooks/useDetalhesEtapa";
import { ModalInscricao } from "@/components/etapas/ModalInscricao";
import { ChavesEtapa } from "@/components/etapas/ChavesEtapa";
import { ChavesReiDaPraia } from "@/components/etapas/ChavesReiDaPraia";
import { ConfirmacaoPerigosa } from "@/components/ConfirmacaoPerigosa";
import Footer from "@/components/Footer";
import etapaService from "@/services/etapaService";
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

  // Hook customizado gerencia todo o estado e lógica
  const {
    etapa,
    loading,
    error,
    abaAtiva,
    modalInscricaoAberto,
    modalConfirmacaoAberto,
    isReiDaPraia,
    progresso,
    carregarEtapa,
    handleAbrirInscricoes,
    handleEncerrarInscricoes,
    handleFinalizarEtapa,
    handleCancelarInscricao,
    handleCancelarMultiplosInscricoes,
    handleGerarChaves,
    handleApagarChaves,
    setAbaAtiva,
    setModalInscricaoAberto,
    setModalConfirmacaoAberto,
  } = useDetalhesEtapa(id);

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
      `⚠️ ATENÇÃO: Deseja realmente excluir a etapa "${etapa.nome}"?\n\n` +
        `Esta ação não pode ser desfeita!`
    );

    if (!confirmar) return;

    try {
      await etapaService.deletar(etapa.id);
      logger.info("Etapa excluída com sucesso", { etapaId: etapa.id, nome: etapa.nome });
      alert("Etapa excluída com sucesso!");
      navigate("/admin/etapas");
    } catch (err: any) {
      logger.error("Erro ao excluir etapa", { etapaId: etapa.id }, err);
      alert(err.message || "Erro ao excluir etapa");
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
        />

        {/* Cards de Informação */}
        <EtapaInfoCards
          etapa={etapa}
          progresso={progresso}
          isReiDaPraia={isReiDaPraia}
        />

        {/* Ações Administrativas */}
        <ActionsSection
          etapa={etapa}
          isReiDaPraia={isReiDaPraia}
          onAbrirInscricoes={handleAbrirInscricoes}
          onEncerrarInscricoes={handleEncerrarInscricoes}
          onGerarChaves={handleGerarChaves}
          onApagarChaves={handleApagarChaves}
          onFinalizarEtapa={handleFinalizarEtapa}
          onVerChaves={() => setAbaAtiva("chaves")}
        />

        {/* Tabs */}
        <S.TabsContainer>
          <S.TabsNav>
            <S.TabsList>
              <S.Tab
                $active={abaAtiva === "inscricoes"}
                onClick={() => setAbaAtiva("inscricoes")}
              >
                📋 Inscrições
                <S.TabBadge>{etapa.totalInscritos}</S.TabBadge>
              </S.Tab>

              <S.Tab
                $active={abaAtiva === "cabeças"}
                onClick={() => setAbaAtiva("cabeças")}
              >
                👑 Cabeças de Chave
              </S.Tab>

              {etapa.chavesGeradas && (
                <S.Tab
                  $active={abaAtiva === "chaves"}
                  onClick={() => setAbaAtiva("chaves")}
                >
                  🎾 Chaves/Grupos
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
              onCancelarMultiplos={handleCancelarMultiplosInscricoes}
            />
          )}

          {abaAtiva === "cabeças" && (
            <CabecasTab etapa={etapa} onUpdate={carregarEtapa} />
          )}

          {abaAtiva === "chaves" && etapa.chavesGeradas && (
            <>
              {isReiDaPraia ? (
                <ChavesReiDaPraia etapaId={etapa.id} />
              ) : (
                <ChavesEtapa etapaId={etapa.id} />
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
            await handleApagarChaves();
            setModalConfirmacaoAberto(false);
          }}
          onClose={() => setModalConfirmacaoAberto(false)}
        />
      )}
    </>
  );
};

export default DetalhesEtapa;
