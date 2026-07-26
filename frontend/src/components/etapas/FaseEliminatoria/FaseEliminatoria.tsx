import React, { useState } from "react";
import {
  ConfrontoEliminatorio,
  TipoFase,
  StatusConfrontoEliminatorio,
  Grupo,
} from "@/types/chave";
import { ModalRegistrarResultadoEliminatorio } from "../ModalRegistrarResultadoEliminatorio";
import { ConfirmacaoPerigosa } from "@/components/modals/ConfirmacaoPerigosa";
import { formatarLadoPlacarConfronto } from "@/utils/placarMelhorDe3";
import { useFaseEliminatoria } from "./hooks/useFaseEliminatoria";
import { getNomeFase, agruparPorFase, contarStatus } from "./utils/faseHelpers";
import { EmptyState } from "./components/EmptyState";
import { StatusBadge } from "./components/StatusBadge";
import { LoadingOverlay } from "@/components/ui";
import {
  Container,
  Header,
  ActionsRow,
  Button,
  Controls,
  Select,
  LoadingContainer,
  Spinner,
  ErrorBox,
  EmptyStateCard,
  EmptyStateContent,
  ButtonGroup,
  AlertBox,
  FaseCard,
  FaseHeader,
  FaseTitle,
  FaseStatus,
  ConfrontosList,
  ConfrontoCard,
  ConfrontoHeader,
  ConfrontoInfo,
  StatusInfo,
  ConfrontoLabel,
  ConfrontoContent,
  ByeBox,
  ByeTeam,
  ByeOrigin,
  ByeLabel,
  DuplaRow,
  DuplaNome,
  DuplaOrigemText,
  Score,
  VsSeparator,
  ActionSection,
  ActionButton,
} from "./styles";

interface FaseEliminatoriaProps {
  etapaId: string;
  arenaId: string;
  grupos: Grupo[];
  melhorDe3?: boolean;
}

export const FaseEliminatoria: React.FC<FaseEliminatoriaProps> = ({
  etapaId,
  grupos,
  melhorDe3 = false,
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
          $variant="danger"
          onClick={() => setModalCancelarAberto(true)}
          disabled={loading || etapaFinalizada}
        >
          Cancelar Eliminatória
        </Button>
        {finalFinalizada && (
          <Button
            $variant="warning"
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

      <VisualizacaoLista
        confrontosPorFase={confrontosPorFase}
        fasesComConfrontos={fasesComConfrontos}
        setConfrontoSelecionado={setConfrontoSelecionado}
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
        <ConfirmacaoPerigosa
          isOpen={modalCancelarAberto}
          titulo="Cancelar Eliminatória"
          mensagem="Tem certeza que deseja cancelar a fase eliminatória? Todos os confrontos e resultados serão perdidos. Esta ação não pode ser desfeita!"
          palavraConfirmacao="CANCELAR"
          onConfirm={async () => {
            await cancelarEliminatoria();
            setModalCancelarAberto(false);
          }}
          onClose={() => setModalCancelarAberto(false)}
        />
      )}

      {modalEncerrarAberto && (
        <ConfirmacaoPerigosa
          isOpen={modalEncerrarAberto}
          titulo="Encerrar Etapa"
          mensagem="Tem certeza que deseja encerrar esta etapa? O campeão será definido e os pontos serão atribuídos. Esta ação não pode ser desfeita!"
          palavraConfirmacao="ENCERRAR"
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

// ============== VISUALIZAÇÃO LISTA ==============

const VisualizacaoLista: React.FC<{
  confrontosPorFase: Record<TipoFase, ConfrontoEliminatorio[]>;
  fasesComConfrontos: [string, ConfrontoEliminatorio[]][];
  setConfrontoSelecionado: (confronto: ConfrontoEliminatorio) => void;
  etapaFinalizada: boolean;
}> = ({ fasesComConfrontos, setConfrontoSelecionado, etapaFinalizada }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {fasesComConfrontos.map(([fase, confrontos]) => (
        <FaseCard key={fase}>
          <FaseHeader>
            <FaseTitle>{getNomeFase(fase as TipoFase)}</FaseTitle>
            <FaseStatus>{contarStatus(confrontos)} completos</FaseStatus>
          </FaseHeader>

          <ConfrontosList>
            {confrontos.map((confronto) => (
              <ConfrontoCard key={confronto.id}>
                <ConfrontoHeader>
                  <ConfrontoInfo>
                    <ConfrontoLabel>CONFRONTO {confronto.ordem}</ConfrontoLabel>
                    <StatusInfo>
                      <StatusBadge status={confronto.status} />
                    </StatusInfo>
                  </ConfrontoInfo>
                </ConfrontoHeader>

                {confronto.status === StatusConfrontoEliminatorio.BYE ? (
                  <ByeBox>
                    <ByeTeam>{confronto.dupla1Nome}</ByeTeam>
                    <ByeOrigin>({confronto.dupla1Origem})</ByeOrigin>
                    <ByeLabel>Classificado automaticamente (BYE)</ByeLabel>
                  </ByeBox>
                ) : (
                  <>
                    <ConfrontoContent>
                      {/* DUPLA 1 */}
                      <DuplaRow>
                        <div>
                          <DuplaNome
                            $isWinner={
                              confronto.vencedoraId === confronto.dupla1Id
                            }
                          >
                            {confronto.dupla1Nome}
                          </DuplaNome>
                          <DuplaOrigemText>
                            ({confronto.dupla1Origem})
                          </DuplaOrigemText>
                        </div>
                        {confronto.status ===
                          StatusConfrontoEliminatorio.FINALIZADA &&
                          confronto.placar && (
                            <Score>{formatarLadoPlacarConfronto(confronto.placar, 1)}</Score>
                          )}
                      </DuplaRow>

                      {/* VS */}
                      <VsSeparator>
                        <span>VS</span>
                      </VsSeparator>

                      {/* DUPLA 2 */}
                      <DuplaRow>
                        <div>
                          <DuplaNome
                            $isWinner={
                              confronto.vencedoraId === confronto.dupla2Id
                            }
                          >
                            {confronto.dupla2Nome}
                          </DuplaNome>
                          <DuplaOrigemText>
                            ({confronto.dupla2Origem})
                          </DuplaOrigemText>
                        </div>
                        {confronto.status ===
                          StatusConfrontoEliminatorio.FINALIZADA &&
                          confronto.placar && (
                            <Score>{formatarLadoPlacarConfronto(confronto.placar, 2)}</Score>
                          )}
                      </DuplaRow>
                    </ConfrontoContent>

                    {/* ACTION SECTION */}
                    {confronto.status ===
                      StatusConfrontoEliminatorio.AGENDADA && (
                      <ActionSection>
                        <ActionButton
                          $variant="register"
                          onClick={() => setConfrontoSelecionado(confronto)}
                        >
                          <span>Registrar Resultado</span>
                        </ActionButton>
                      </ActionSection>
                    )}

                    {confronto.status ===
                      StatusConfrontoEliminatorio.FINALIZADA && (
                      <ActionSection>
                        <ActionButton
                          $variant={etapaFinalizada ? "disabled" : "edit"}
                          onClick={() =>
                            !etapaFinalizada &&
                            setConfrontoSelecionado(confronto)
                          }
                          disabled={etapaFinalizada}
                        >
                          <span>
                            {etapaFinalizada
                              ? "Etapa Finalizada"
                              : "Editar Resultado"}
                          </span>
                        </ActionButton>
                      </ActionSection>
                    )}
                  </>
                )}
              </ConfrontoCard>
            ))}
          </ConfrontosList>
        </FaseCard>
      ))}
    </div>
  );
};

export default FaseEliminatoria;
