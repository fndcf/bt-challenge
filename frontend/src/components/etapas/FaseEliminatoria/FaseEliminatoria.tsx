import React, { useState } from "react";
import {
  ConfrontoEliminatorio,
  TipoFase,
  StatusConfrontoEliminatorio,
  Grupo,
} from "@/types/chave";
import { ModalRegistrarResultadoEliminatorio } from "../ModalRegistrarResultadoEliminatorio";
import { ConfirmacaoAcao } from "@/components/modals/ConfirmacaoAcao";
import { formatarLadoPlacarConfronto } from "@/utils/placarMelhorDe3";
import { useFaseEliminatoria } from "./hooks/useFaseEliminatoria";
import { getNomeFase, agruparPorFase, contarStatus } from "./utils/faseHelpers";
import { EmptyState } from "./components/EmptyState";
import { StatusBadge } from "./components/StatusBadge";
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
                        <Button
                          fullWidth
                          onClick={() => setConfrontoSelecionado(confronto)}
                        >
                          <span>Registrar Resultado</span>
                        </Button>
                      </ActionSection>
                    )}

                    {confronto.status ===
                      StatusConfrontoEliminatorio.FINALIZADA && (
                      <ActionSection>
                        <Button
                          variant={etapaFinalizada ? "secondary" : "outline"}
                          fullWidth
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
                        </Button>
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
