import React from "react";
import {
  EmptyStateCard,
  EmptyStateContent,
  EmptyTitle,
  AlertBox,
  InfoBox,
  InfoText,
  ButtonGroup,
  Button,
  HintText,
} from "../styles";

interface EmptyStateProps {
  isGrupoUnico: boolean;
  grupoUnicoCompleto: boolean;
  etapaFinalizada: boolean;
  todosGruposCompletos: boolean;
  partidasPendentes: number;
  loading: boolean;
  onGerarEliminatoria: () => void;
  onEncerrarEtapa: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  isGrupoUnico,
  grupoUnicoCompleto,
  etapaFinalizada,
  todosGruposCompletos,
  partidasPendentes,
  loading,
  onGerarEliminatoria,
  onEncerrarEtapa,
}) => {
  return (
    <EmptyStateCard>
      <EmptyStateContent>
        <EmptyTitle>Fase Eliminatória</EmptyTitle>

        {isGrupoUnico ? (
          <>
            <AlertBox $variant="success">
              <h4>Grupo Único - Sistema Round-Robin</h4>
              <p>
                Com apenas 1 grupo, todos os jogadores já se enfrentaram no
                sistema <strong>Todos contra Todos</strong>.
              </p>
              <InfoBox>
                <InfoText>
                  <strong>Sistema:</strong> Round-Robin (Todos contra Todos)
                </InfoText>
                <InfoText>
                  O <strong>1º colocado</strong> do grupo é automaticamente o{" "}
                  <strong>CAMPEÃO</strong>!
                </InfoText>
              </InfoBox>
            </AlertBox>

            {grupoUnicoCompleto ? (
              <>
                {etapaFinalizada ? (
                  <AlertBox $variant="success">
                    <h4>Etapa Finalizada!</h4>
                    <p>
                      Esta etapa já foi encerrada. O campeão foi definido e os
                      pontos foram atribuídos.
                    </p>
                  </AlertBox>
                ) : (
                  <>
                    <AlertBox $variant="warning">
                      <h4>Grupo Completo!</h4>
                      <p>
                        Todas as partidas foram finalizadas. O campeão está
                        definido!
                      </p>
                      <InfoBox>
                        <InfoText>
                          <strong>Próximo passo:</strong> Encerre a etapa para
                          atribuir pontos ao ranking.
                        </InfoText>
                      </InfoBox>
                    </AlertBox>

                    <ButtonGroup>
                      <Button
                        $variant="warning"
                        onClick={onEncerrarEtapa}
                        disabled={loading}
                      >
                        <span>Encerrar Etapa e Atribuir Pontos</span>
                      </Button>
                    </ButtonGroup>
                  </>
                )}
              </>
            ) : (
              <AlertBox $variant="warning">
                <h4>Finalize todas as partidas do grupo primeiro</h4>
                <p>
                  Ainda há {partidasPendentes} partida(s) pendente(s). Complete
                  todos os jogos para definir o campeão.
                </p>
              </AlertBox>
            )}

            <HintText>
              Para ter fase eliminatória, configure a etapa com 2 ou mais grupos
            </HintText>
          </>
        ) : !todosGruposCompletos ? (
          <>
            <AlertBox $variant="warning">
              <h4>Finalize todas as partidas da fase de grupos primeiro</h4>
              <p>
                Ainda há {partidasPendentes} partida(s) pendente(s) nos grupos.
                Complete todos os jogos para gerar a fase eliminatória.
              </p>
            </AlertBox>
            <ButtonGroup>
              <Button disabled>Gerar Fase Eliminatória</Button>
            </ButtonGroup>
          </>
        ) : (
          <>
            <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
              A fase de grupos foi concluída! Gere a fase eliminatória para
              continuar o torneio.
            </p>
            <ButtonGroup>
              <Button onClick={onGerarEliminatoria} disabled={loading}>
                Gerar Fase Eliminatória
              </Button>
            </ButtonGroup>
          </>
        )}
      </EmptyStateContent>
    </EmptyStateCard>
  );
};
