import React, { useState } from "react";
import {
  TipoFase,
  Grupo,
} from "@/types/chave";
import { ModalRegistrarResultadoEliminatorio } from "../ModalRegistrarResultadoEliminatorio";
import { ConfirmacaoAcao } from "@/components/modals/ConfirmacaoAcao";
import { useFaseEliminatoria } from "./hooks/useFaseEliminatoria";
import { getNomeFase, agruparPorFase } from "./utils/faseHelpers";
import { EmptyState } from "./components/EmptyState";
import { ListaConfrontosEliminatorios } from "./components/ListaConfrontosEliminatorios";
import { LoadingOverlay, Button } from "@/components/ui";
import {
  Container,
  Header,
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

interface FaseEliminatoriaProps {
  etapaId: string;
  arenaId: string;
  grupos: Grupo[];
  melhorDe3?: boolean;
  // Empate pendente nos grupos: bloqueia gerar/encerrar
  bloqueadoPorEmpate?: boolean;
}

export const FaseEliminatoria: React.FC<FaseEliminatoriaProps> = ({
  etapaId,
  grupos,
  melhorDe3 = false,
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

    // Actions
    setConfrontoSelecionado,
    setFaseAtual,
    carregarConfrontos,
    gerarEliminatoria,
    cancelarEliminatoria,
    encerrarEtapa,
  } = useFaseEliminatoria({ etapaId, grupos });

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
  const confrontosPorFase = agruparPorFase(confrontosFiltrados);

  // Sempre calcular fases com confrontos baseado em TODOS os confrontos
  const todasFasesComConfrontos = Object.entries(
    agruparPorFase(confrontos)
  ).filter(([_, c]) => c && c.length > 0);

  const fasesComConfrontos = Object.entries(confrontosPorFase).filter(
    ([_, c]) => c && c.length > 0
  );

  return (
    <Container>
      <Header>
        <h2>⚔️ Fase Eliminatória</h2>
        <p>Confrontos mata-mata até o campeão!</p>
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
          <h4>Etapa Finalizada!</h4>
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
          confronto={confrontoSelecionado}
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

export default FaseEliminatoria;
