import React from "react";
import {
  ConfrontoEliminatorio,
  TipoFase,
  StatusConfrontoEliminatorio,
  Grupo,
} from "@/types/chave";
import { ModalRegistrarResultadoEliminatorio } from "../ModalRegistrarResultadoEliminatorio";
import { useFaseEliminatoria } from "./hooks/useFaseEliminatoria";
import { getNomeFase, agruparPorFase, contarStatus } from "./utils/faseHelpers";
import { EmptyState } from "./components/EmptyState";
import { StatusBadge } from "./components/StatusBadge";
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
  PlacarDetalhado,
  PlacarInfo,
  ActionSection,
  ActionButton,
} from "./styles";

interface FaseEliminatoriaProps {
  etapaId: string;
  arenaId: string;
  grupos: Grupo[];
}

export const FaseEliminatoria: React.FC<FaseEliminatoriaProps> = ({
  etapaId,
  grupos,
}) => {
  const {
    // Estado
    confrontos,
    loading,
    erro,
    confrontoSelecionado,
    faseAtual,
    etapaFinalizada,

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
          onClick={cancelarEliminatoria}
          disabled={loading || etapaFinalizada}
        >
          <span> Cancelar Eliminatória</span>
        </Button>
        {finalFinalizada && (
          <>
            <Button
              $variant="warning"
              onClick={encerrarEtapa}
              disabled={loading || etapaFinalizada}
            >
              <span>
                {etapaFinalizada ? " Etapa Encerrada " : " Encerrar Etapa"}
              </span>
            </Button>
            {etapaFinalizada && (
              <AlertBox $variant="success">
                <h4> Etapa Finalizada!</h4>
                <p>
                  Esta etapa já foi encerrada. O campeão foi definido e os
                  pontos foram atribuídos.
                </p>
              </AlertBox>
            )}
          </>
        )}
      </ActionsRow>

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
          onClose={() => setConfrontoSelecionado(null)}
          onSuccess={() => {
            setConfrontoSelecionado(null);
            carregarConfrontos();
          }}
        />
      )}
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
                            <Score>{confronto.placar.split("-")[0]}</Score>
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
                            <Score>{confronto.placar.split("-")[1]}</Score>
                          )}
                      </DuplaRow>
                    </ConfrontoContent>

                    {/* PLACAR DETALHADO */}
                    {confronto.status ===
                      StatusConfrontoEliminatorio.FINALIZADA && (
                      <PlacarDetalhado>
                        <PlacarInfo>
                          <span>Vencedor:</span>
                          <span style={{ fontWeight: 700, color: "#16a34a" }}>
                            {confronto.vencedoraNome}
                          </span>
                        </PlacarInfo>
                      </PlacarDetalhado>
                    )}

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
