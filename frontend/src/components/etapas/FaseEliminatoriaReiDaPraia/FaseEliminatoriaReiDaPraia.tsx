import React, { useState } from "react";
import { TipoFase, Grupo } from "@/types/chave";
import { TipoChaveamentoReiDaPraia } from "@/types/reiDaPraia";
import { ModalRegistrarResultadoEliminatorio } from "../ModalRegistrarResultadoEliminatorio";
import { ConfirmacaoAcao } from "@/components/modals/ConfirmacaoAcao";
import {
  useFaseEliminatoriaReiDaPraia,
} from "./hooks/useFaseEliminatoriaReiDaPraia";
import {
  getNomeFase,
  agruparPorFase,
} from "../FaseEliminatoria/utils/faseHelpers";
import { EmptyState } from "../FaseEliminatoria/components/EmptyState";
import { ListaConfrontosEliminatorios } from "../FaseEliminatoria/components/ListaConfrontosEliminatorios";
import { LoadingOverlay, Button } from "@/components/ui";
import {
  Container,
  Header,
  ChaveamentoInfo,
  ActionsRow,
  Controls,
  Select,
  LoadingContainer,
  Spinner,
  ErrorBox,
  EmptyStateCard,
  EmptyStateContent,
  ButtonGroup,
  AlertBox,
} from "./styles";

interface FaseEliminatoriaReiDaPraiaProps {
  etapaId: string;
  arenaId: string;
  grupos: Grupo[];
  etapaTipoChaveamento?: TipoChaveamentoReiDaPraia;
  melhorDe3?: boolean;
  // Geração bloqueada por empate: o pai recarrega e o painel de empates abre o modal
  onEmpatePendente?: () => void;
  // Empate pendente já conhecido: bloqueia gerar/encerrar
  bloqueadoPorEmpate?: boolean;
}

export const FaseEliminatoriaReiDaPraia: React.FC<
  FaseEliminatoriaReiDaPraiaProps
> = ({
  etapaId,
  grupos,
  etapaTipoChaveamento,
  melhorDe3 = false,
  onEmpatePendente,
  bloqueadoPorEmpate = false,
}) => {
  const [modalCancelarAberto, setModalCancelarAberto] = useState(false);
  const [modalEncerrarAberto, setModalEncerrarAberto] = useState(false);

  const {
    // Estado
    confrontos,
    loading,
    erro,
    confrontoSelecionado,
    faseAtual,
    etapaFinalizada,
    globalLoading,
    globalLoadingMessage,

    // Dados computados
    todosGruposCompletos,
    isGrupoUnico,
    partidasPendentes,
    finalFinalizada,
    grupoUnicoCompleto,
    tipoChaveamento,

    // Actions
    setConfrontoSelecionado,
    setFaseAtual,
    carregarConfrontos,
    gerarEliminatoria,
    cancelarEliminatoria,
    encerrarEtapa,
  } = useFaseEliminatoriaReiDaPraia({
    etapaId,
    grupos,
    etapaTipoChaveamento,
    onEmpatePendente,
  });

  // Loading inicial
  if (loading && (!confrontos || confrontos.length === 0)) {
    return (
      <LoadingContainer>
        <Spinner />
      </LoadingContainer>
    );
  }

  // Erro
  if (erro) {
    return (
      <EmptyStateCard>
        <EmptyStateContent>
          <ErrorBox>❌ {erro}</ErrorBox>
          <ButtonGroup>
            <Button onClick={carregarConfrontos}>🔄 Tentar Novamente</Button>
          </ButtonGroup>
        </EmptyStateContent>
      </EmptyStateCard>
    );
  }

  // Empty state (sem confrontos)
  if (!confrontos || confrontos.length === 0) {
    return (
      <>
        <EmptyState
          isGrupoUnico={isGrupoUnico}
          grupoUnicoCompleto={grupoUnicoCompleto}
          etapaFinalizada={etapaFinalizada}
          todosGruposCompletos={todosGruposCompletos}
          partidasPendentes={partidasPendentes}
          loading={loading}
          onGerarEliminatoria={gerarEliminatoria}
          onEncerrarEtapa={encerrarEtapa}
          bloqueadoPorEmpate={bloqueadoPorEmpate}
        />
        <LoadingOverlay isLoading={globalLoading} message={globalLoadingMessage} />
      </>
    );
  }

  // Filtrar confrontos por fase selecionada
  const confrontosFiltrados =
    faseAtual === "todas"
      ? confrontos
      : confrontos.filter((c) => c.fase === faseAtual);

  // Agrupar confrontos e preparar dados
  const confrontosPorFase = agruparPorFase(confrontosFiltrados as any);

  // Sempre calcular fases com confrontos baseado em TODOS os confrontos
  const todasFasesComConfrontos = Object.entries(
    agruparPorFase(confrontos as any)
  ).filter(([_, c]) => c && c.length > 0);

  const fasesComConfrontos = Object.entries(confrontosPorFase).filter(
    ([_, c]) => c && c.length > 0
  );

  return (
    <Container>
      <Header>
        <h2>
          <span>Fase Eliminatória - Rei da Praia</span>
        </h2>
        <p>Duplas formadas pelos classificados individuais!</p>

        {tipoChaveamento && (
          <ChaveamentoInfo>
            <span>Tipo de Chaveamento:</span>
            <span>{tipoChaveamento}</span>
          </ChaveamentoInfo>
        )}
      </Header>

      <ActionsRow>
        <Button
          variant="danger"
          onClick={() => setModalCancelarAberto(true)}
          disabled={loading || etapaFinalizada}
        >
          Cancelar Eliminatória
        </Button>
        {finalFinalizada && (
          <Button
            onClick={() => setModalEncerrarAberto(true)}
            disabled={loading || etapaFinalizada}
          >
            {etapaFinalizada ? "Etapa Encerrada" : "Encerrar Etapa"}
          </Button>
        )}
      </ActionsRow>

      {etapaFinalizada && (
        <AlertBox $variant="success">
          <h4>Etapa Rei da Praia Finalizada!</h4>
          <p>
            Esta etapa já foi encerrada. O campeão foi definido e os pontos
            foram atribuídos.
          </p>
        </AlertBox>
      )}

      <Controls>
        <Select
          value={faseAtual}
          onChange={(e) => setFaseAtual(e.target.value as TipoFase | "todas")}
        >
          <option value="todas">Todas as Fases</option>
          {todasFasesComConfrontos.map(([fase]) => (
            <option key={fase} value={fase}>
              {getNomeFase(fase as TipoFase)}
            </option>
          ))}
        </Select>
      </Controls>

      {erro && <ErrorBox>❌ {erro}</ErrorBox>}

      <ListaConfrontosEliminatorios
        fases={fasesComConfrontos}
        onSelecionar={setConfrontoSelecionado}
        etapaFinalizada={etapaFinalizada}
      />

      {confrontoSelecionado && (
        <ModalRegistrarResultadoEliminatorio
          confronto={confrontoSelecionado as any}
          melhorDe3={melhorDe3}
          onClose={() => setConfrontoSelecionado(null)}
          onSuccess={() => {
            setConfrontoSelecionado(null);
            carregarConfrontos();
          }}
        />
      )}

      {modalCancelarAberto && (
        <ConfirmacaoAcao
          acao="cancelarEliminatoria"
          isOpen={modalCancelarAberto}
          onConfirm={async () => {
            await cancelarEliminatoria();
            setModalCancelarAberto(false);
          }}
          onClose={() => setModalCancelarAberto(false)}
        />
      )}

      {modalEncerrarAberto && (
        <ConfirmacaoAcao
          acao="encerrarEtapa"
          isOpen={modalEncerrarAberto}
          onConfirm={async () => {
            await encerrarEtapa();
            setModalEncerrarAberto(false);
          }}
          onClose={() => setModalEncerrarAberto(false)}
        />
      )}

      <LoadingOverlay isLoading={globalLoading} message={globalLoadingMessage} />
    </Container>
  );
};

export default FaseEliminatoriaReiDaPraia;
