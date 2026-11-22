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
import { ConfirmacaoAcao } from "@/components/modals/ConfirmacaoAcao";
import { ModalSubstituirJogador } from "@/components/modals/ModalSubstituirJogador";
import { Footer } from "@/components/layout/Footer";
import { CarregandoPagina, Pagina } from "@/components/layout/Pagina";
import { Alert, Badge, Button, LoadingOverlay, Tabs } from "@/components/ui";
import { getEtapaService } from "@/services";
import { AbaEtapa } from "@/hooks/useEtapaUI";
import { StatusEtapa } from "@/types/etapa";
import { getQtdGrupos } from "@/utils/etapa";
import logger from "@/utils/logger";

// Componentes extraídos
import { EtapaHeader } from "./components/EtapaHeader";
import { EtapaInfoCards } from "./components/EtapaInfoCards";
import { InscricoesTab } from "./components/InscricoesTab";
import { CabecasTab } from "./components/CabecasTab";
import { ActionsSection } from "./components/ActionsSection";
import { DuplasManuaisTab } from "./components/DuplasManuaisTab";

// Estilos
import * as S from "./DetalhesEtapa.styles";
import { getMensagemErro, paraError } from "@/utils/erro";

const DetalhesEtapa: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const etapaService = getEtapaService();
  const tabsRef = useRef<HTMLDivElement>(null);

  // Estado do modal de formação manual
  const [modalFormacaoManualAberto, setModalFormacaoManualAberto] = useState(false);

  // Estado do modal de substituição de jogador
  const [modalSubstituicaoAberto, setModalSubstituicaoAberto] = useState(false);

  // Estado da exportação de súmula
  const [exportandoSumula, setExportandoSumula] = useState(false);

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
    carregarEtapa,
    handleAbrirInscricoes,
    handleEncerrarInscricoes,
    handleCancelarInscricao,
    handleCancelarMultiplosInscricoes,
    handleGerarChaves,
    handleGerarChavesManual,
    handleGerarDuplasManual,
    handleApagarChaves,
    isFormacaoManual,
    isFormacaoManualDupla,
    setAbaAtiva,
    setModalInscricaoAberto,
    setModalConfirmacaoAberto,
  } = useDetalhesEtapa(id);

  const isDuplaFixa = etapa?.formato === "dupla_fixa";

  // Estado de loading para ação de excluir - DEVE VIR ANTES DOS EARLY RETURNS
  const [loadingExcluir, setLoadingExcluir] = React.useState(false);

  // Estado global de loading para operações críticas que bloqueiam toda a tela
  const [globalLoading, setGlobalLoading] = React.useState(false);
  const [globalLoadingMessage, setGlobalLoadingMessage] = React.useState("");

  /** Executa com a tela bloqueada e a mensagem de carregamento */
  const comLoading = async (
    mensagem: string,
    executar: () => Promise<unknown>
  ) => {
    try {
      setGlobalLoading(true);
      setGlobalLoadingMessage(mensagem);
      await executar();
    } finally {
      setGlobalLoading(false);
      setGlobalLoadingMessage("");
    }
  };

  // Estados de loading e erro
  if (loading) {
    return (
      <CarregandoPagina mensagem="Carregando etapa..." />
    );
  }

  if (error || !etapa) {
    return (
      <Pagina>
        <Alert variant="error">{error || "Etapa não encontrada"}</Alert>
        <div>
          <Button variant="outline" onClick={() => navigate("/admin/etapas")}>
            ← Voltar para etapas
          </Button>
        </div>
      </Pagina>
    );
  }

  // Handler para exportar súmula
  const handleExportarSumula = async () => {
    try {
      setExportandoSumula(true);
      await etapaService.exportarSumula(etapa.id);
    } catch (err) {
      const message = getMensagemErro(err, "Erro ao exportar súmula");
      alert(message);
    } finally {
      setExportandoSumula(false);
    }
  };

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
      await comLoading("Excluindo etapa...", () =>
        etapaService.deletar(etapa.id)
      );
      logger.info("Etapa excluída com sucesso", {
        etapaId: etapa.id,
        nome: etapa.nome,
      });
      alert("Etapa excluída com sucesso!");
      navigate("/admin/etapas");
    } catch (err) {
      logger.error("Erro ao excluir etapa", { etapaId: etapa.id }, paraError(err));
      alert(getMensagemErro(err, "Erro ao excluir etapa"));
    } finally {
      setLoadingExcluir(false);
    }
  };

  const gerarChaves = async () => {
    // Formação manual: o admin monta as duplas (aba) ou as equipes (modal)
    if (isFormacaoManualDupla) {
      setAbaAtiva("duplas-manuais");
    } else if (isFormacaoManual) {
      setModalFormacaoManualAberto(true);
    } else {
      await comLoading("Gerando chaves...", handleGerarChaves);
    }
  };

  // Super X, TEAMS e Dupla Fixa Manual não têm cabeças de chave
  const temCabecas = !isSuperX && !isTeams && !isFormacaoManualDupla;
  const temDuplasManuais =
    isDuplaFixa && isFormacaoManualDupla && !etapa.chavesGeradas;

  const abas: { id: AbaEtapa; label: React.ReactNode }[] = [
    {
      id: "inscricoes",
      label: (
        <S.RotuloAba>
          Inscrições <Badge>{etapa.totalInscritos}</Badge>
        </S.RotuloAba>
      ),
    },
  ];
  if (temCabecas) abas.push({ id: "cabeças", label: "Cabeças de Chave" });
  if (temDuplasManuais) {
    abas.push({ id: "duplas-manuais", label: "Duplas Manuais" });
  }
  if (etapa.chavesGeradas) {
    abas.push({
      id: "chaves",
      label: (
        <S.RotuloAba>
          Chaves/Grupos <Badge>{getQtdGrupos(etapa)}</Badge>
        </S.RotuloAba>
      ),
    });
  }

  // Renderização principal
  return (
    <>
      <Pagina>
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
          onAbrirInscricoes={() =>
            comLoading("Reabrindo inscrições...", handleAbrirInscricoes)
          }
          onEncerrarInscricoes={() =>
            comLoading("Encerrando inscrições...", handleEncerrarInscricoes)
          }
          onGerarChaves={gerarChaves}
          onApagarChaves={() => setModalConfirmacaoAberto(true)}
          onVerChaves={() => {
            setAbaAtiva("chaves");
            setTimeout(() => {
              tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
          }}
          onSubstituirJogador={() => setModalSubstituicaoAberto(true)}
          onExportarSumula={handleExportarSumula}
          exportandoSumula={exportandoSumula}
        />

        {/* Tabs */}
        <S.Abas ref={tabsRef}>
          <Tabs
            rotulo="Seções da etapa"
            abas={abas}
            ativa={abaAtiva}
            onChange={setAbaAtiva}
            formato={etapa.formato}
          />

          {/* Conteúdo das Tabs */}
          {abaAtiva === "inscricoes" && (
            <InscricoesTab
              etapa={etapa}
              inscricoes={etapa.inscricoes || []}
              onInscricao={() => setModalInscricaoAberto(true)}
              onCancelar={handleCancelarInscricao}
              onCancelarMultiplos={(ids) =>
                comLoading(`Excluindo ${ids.length} inscrição(ões)...`, () =>
                  handleCancelarMultiplosInscricoes(ids)
                )
              }
            />
          )}

          {abaAtiva === "cabeças" && !isSuperX && !isTeams && (
            <CabecasTab etapa={etapa} onUpdate={carregarEtapa} />
          )}

          {abaAtiva === "duplas-manuais" && temDuplasManuais && (
            <DuplasManuaisTab
              inscricoes={etapa.inscricoes || []}
              isMisto={etapa.genero === "misto"}
              onConfirm={(formacoes) =>
                comLoading("Gerando duplas e chaves...", () =>
                  handleGerarDuplasManual(formacoes)
                )
              }
            />
          )}

          {abaAtiva === "chaves" && etapa.chavesGeradas && (
            <>
              {isTeams ? (
                <ChavesTeams
                  etapaId={etapa.id}
                  varianteTeams={etapa.varianteTeams}
                  tipoFormacaoJogos={etapa.tipoFormacaoJogos}
                  etapaFinalizada={etapa.status === StatusEtapa.FINALIZADA}
                  melhorDe3={etapa.melhorDe3}
                  melhorDe3Eliminatoria={!!etapa.melhorDe3 && !!etapa.melhorDe3Eliminatoria}
                  onAtualizar={carregarEtapa}
                />
              ) : isSuperX ? (
                <ChavesSuperX
                  etapaId={etapa.id}
                  varianteSuperX={etapa.varianteSuperX}
                  etapaFinalizada={etapa.status === StatusEtapa.FINALIZADA}
                  melhorDe3={etapa.melhorDe3}
                  onAtualizar={carregarEtapa}
                />
              ) : isReiDaPraia ? (
                <ChavesReiDaPraia
                  etapaId={etapa.id}
                  tipoChaveamento={etapa.tipoChaveamento}
                  etapaFinalizada={etapa.status === StatusEtapa.FINALIZADA}
                  melhorDe3={etapa.melhorDe3}
                  melhorDe3Eliminatoria={!!etapa.melhorDe3 && !!etapa.melhorDe3Eliminatoria}
                />
              ) : (
                <ChavesEtapa
                  etapaId={etapa.id}
                  etapaFinalizada={etapa.status === StatusEtapa.FINALIZADA}
                  melhorDe3={etapa.melhorDe3}
                  melhorDe3Eliminatoria={!!etapa.melhorDe3 && !!etapa.melhorDe3Eliminatoria}
                />
              )}
            </>
          )}
        </S.Abas>
      </Pagina>

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
        <ConfirmacaoAcao
          acao="excluirChaves"
          isOpen={modalConfirmacaoAberto}
          onConfirm={async () => {
            setModalConfirmacaoAberto(false);
            await comLoading("Excluindo chaves...", handleApagarChaves);
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

      {modalSubstituicaoAberto && etapa && (
        <ModalSubstituirJogador
          isOpen={modalSubstituicaoAberto}
          onClose={() => setModalSubstituicaoAberto(false)}
          onSuccess={async () => {
            await carregarEtapa();
            setModalSubstituicaoAberto(false);
          }}
          etapaId={etapa.id}
          inscricoes={etapa.inscricoes || []}
        />
      )}

      {/* Loading Overlay Global - Bloqueia toda a tela */}
      <LoadingOverlay isLoading={globalLoading} message={globalLoadingMessage} />
    </>
  );
};

export default DetalhesEtapa;
